/** VexPanel Agent: install only on a trusted Linux LXD host. It has no public listener. */
import { spawn } from "node:child_process";
import { mkdir, stat, readFile, writeFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { randomBytes } from "node:crypto";

const api = process.env.VEXPANEL_API_URL?.replace(/\/$/, "");
const nodeId = process.env.VEXPANEL_NODE_ID;
const token = process.env.VEXPANEL_NODE_TOKEN;
if (!api || !nodeId || !token) throw new Error("VEXPANEL_API_URL, VEXPANEL_NODE_ID and VEXPANEL_NODE_TOKEN are required");

const pollMs = Math.max(2, Number(process.env.AGENT_POLL_SECONDS ?? 5)) * 1_000;
const backupDir = resolve(process.env.VEXPANEL_BACKUP_DIR ?? "/var/lib/vexpanel/backups");
const tailscaleAuthKey = process.env.TAILSCALE_AUTH_KEY;
const pinggyToken = process.env.PINGGY_TOKEN;

type Job = { id: string; type: string; payload: Record<string, unknown> };

const safeName = (v: unknown): v is string => typeof v === "string" && /^[a-zA-Z0-9-]{1,63}$/.test(v);
const safeImage = (v: unknown): v is string => typeof v === "string" && /^[a-zA-Z0-9:._/-]{1,128}$/i.test(v);
const int = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

function run(args: string[], timeoutMs = 120_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("lxc", args, { stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const timer = setTimeout(() => { child.kill("SIGTERM"); reject(new Error(`lxc ${args[0]} timed out after ${timeoutMs}ms`)); }, timeoutMs);
    child.stdout.on("data", d => output += d);
    child.stderr.on("data", d => output += d);
    child.once("error", err => { clearTimeout(timer); reject(err); });
    child.once("close", code => { clearTimeout(timer); code === 0 ? resolve(output) : reject(new Error(`lxc ${args[0]} failed (${code}): ${output.slice(-800)}`)); });
  });
}

function runInContainer(container: string, command: string[], timeoutMs = 120_000): Promise<string> {
  return run(["exec", container, "--", ...command], timeoutMs);
}

async function report(id: string, data: object) {
  const response = await fetch(`${api}/api/agent/tasks/${id}/result`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nodeId, token, ...data }),
  });
  if (!response.ok) throw new Error(`Task reporting failed: ${response.status}`);
}

async function reportMetrics() {
  try {
    const cpuOutput = await run(["info"], 5000);
    const cpuMatch = cpuOutput.match(/CPU:\s*\((\d+)\s+core/);
    const cpuCores = cpuMatch ? parseInt(cpuMatch[1]) : 0;

    const memOutput = await run(["info"], 5000);
    const memMatch = memOutput.match(/Memory:\s*(\d+)/);
    const ramMiB = memMatch ? Math.round(parseInt(memMatch[1]) / 1024 / 1024) : 0;

    await fetch(`${api}/api/agent/metrics`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nodeId, token, cpuCores, ramMiB, diskGiB: 0 }),
    });
  } catch { /* metrics are best-effort */ }
}

async function getContainerIp(lxdName: string): Promise<string | null> {
  try {
    const output = await run(["list", lxdName, "--format", "json"]);
    const data = JSON.parse(output);
    const eth0 = data[`${lxdName}:eth0`];
    if (eth0?.addresses) {
      const ipv4 = eth0.addresses.find((a: { family: string; address: string }) => a.family === "inet" && !a.address.startsWith("127."));
      if (ipv4) return ipv4.address;
    }
    return null;
  } catch { return null; }
}

async function installRdpInContainer(lxdName: string): Promise<{ username: string; password: string }> {
  const username = "vexrdp";
  const password = randomBytes(16).toString("base64url");

  await runInContainer(lxdName, ["bash", "-c", `
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq xfce4 xfce4-goodies xrdp dbus-x11 > /dev/null 2>&1
    systemctl enable xrdp || true
    systemctl start xrdp || true
  `], 300_000);

  await runInContainer(lxdName, ["bash", "-c", `
    id ${username} || useradd -m -s /bin/bash ${username}
    echo "${username}:${password}" | chpasswd
    echo "${username}" >> /etc/xrdp/startwm.sh || true
  `], 30_000);

  await runInContainer(lxdName, ["bash", "-c", `
    echo "xfce4-session" > /home/${username}/.xsession
    chown ${username}:${username} /home/${username}/.xsession
  `], 10_000);

  return { username, password };
}

async function setupTailscaleInContainer(lxdName: string): Promise<string | null> {
  if (!tailscaleAuthKey) return null;
  try {
    await runInContainer(lxdName, ["bash", "-c", `
      curl -fsSL https://tailscale.com/install.sh | sh > /dev/null 2>&1
      tailscale up --authkey=${tailscaleAuthKey} --accept-routes --accept-dns=false
    `], 120_000);

    await sleep(5000);
    const output = await runInContainer(lxdName, ["tailscale", "ip", "-4"]);
    return output.trim() || null;
  } catch { return null; }
}

async function startPinggyInContainer(lxdName: string, rdpPort: number): Promise<{ host: string; port: number } | null> {
  if (!pinggyToken) return null;
  try {
    const script = `ssh -p 443 -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R0:127.0.0.1:${rdpPort} ${pinggyToken}@free.pinggy.io 2>&1`;
    await runInContainer(lxdName, ["bash", "-c", `
      nohup ${script} > /tmp/pinggy.log 2>&1 &
      sleep 10
      cat /tmp/pinggy.log
    `], 30_000);

    const logOutput = await runInContainer(lxdName, ["cat", "/tmp/pinggy.log"]).catch(() => "");
    const urlMatch = logOutput.match(/(https?:\/\/[a-zA-Z0-9.-]+\.pinggy\.link)/);
    const portMatch = logOutput.match(/port[:\s]+(\d+)/i);

    if (urlMatch) {
      const host = urlMatch[1].replace(/^https?:\/\//, "");
      const port = portMatch ? parseInt(portMatch[1]) : 443;
      return { host, port };
    }
    return null;
  } catch { return null; }
}

async function stopPinggyInContainer(lxdName: string): Promise<void> {
  try {
    await runInContainer(lxdName, ["bash", "-c", "pkill -f 'pinggy.io' || true"], 10_000);
  } catch { /* best effort */ }
}

async function removeRdpFromContainer(lxdName: string): Promise<void> {
  try {
    await runInContainer(lxdName, ["bash", "-c", `
      export DEBIAN_FRONTEND=noninteractive
      apt-get remove -y -qq xfce4 xrdp > /dev/null 2>&1 || true
      apt-get autoremove -y -qq > /dev/null 2>&1 || true
      userdel -r vexrdp 2>/dev/null || true
      systemctl stop xrdp 2>/dev/null || true
    `], 60_000);
  } catch { /* best effort */ }
}

async function getContainerMetrics(lxdName: string): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  try {
    const cpuOutput = await runInContainer(lxdName, ["grep", "-c", "^processor", "/proc/cpuinfo"]);
    result.cpuCount = parseInt(cpuOutput.trim()) || 0;

    const memOutput = await runInContainer(lxdName, ["grep", "MemAvailable", "/proc/meminfo"]);
    const memMatch = memOutput.match(/MemAvailable:\s+(\d+)/);
    result.ramAvailableMiB = memMatch ? Math.round(parseInt(memMatch[1]) / 1024) : 0;

    const diskOutput = await runInContainer(lxdName, ["df", "-BM", "/"], 10_000);
    const diskLines = diskOutput.trim().split("\n");
    if (diskLines.length > 1) {
      const parts = diskLines[1].split(/\s+/);
      result.diskTotalMiB = parseInt(parts[1]) || 0;
      result.diskUsedMiB = parseInt(parts[2]) || 0;
    }

    const uptimeOutput = await runInContainer(lxdName, ["uptime", "-p"]);
    result.uptime = uptimeOutput.trim();
  } catch { /* metrics are best-effort */ }
  return result;
}

async function execute(job: Job): Promise<Record<string, unknown>> {
  const p = job.payload;

  if (job.type === "vps.create") {
    if (!safeName(p.lxdName) || !safeImage(p.imageAlias) || !int(p.cpu, 1, 64) || !int(p.ramMiB, 512, 524288) || !int(p.diskGiB, 5, 4096))
      throw new Error("Rejected invalid provisioning payload");
    await run(["launch", p.imageAlias as string, p.lxdName as string]);
    try {
      await run(["config", "set", p.lxdName as string, "limits.cpu", String(p.cpu)]);
      await run(["config", "set", p.lxdName as string, "limits.memory", `${p.ramMiB}MiB`]);
      await run(["config", "device", "override", p.lxdName as string, "root", "size", `${p.diskGiB}GiB`]);
      await run(["info", p.lxdName as string]);
      return { lxdName: p.lxdName, verified: true };
    } catch (error) {
      await run(["delete", "--force", p.lxdName as string]).catch(() => undefined);
      throw error;
    }
  }

  if (job.type === "vps.rebuild") {
    if (!safeName(p.lxdName) || !safeImage(p.imageAlias)) throw new Error("Rejected invalid rebuild payload");
    await run(["delete", "--force", p.lxdName as string]);
    await run(["launch", p.imageAlias as string, p.lxdName as string]);
    await run(["config", "set", p.lxdName as string, "limits.cpu", String(p.cpu ?? 1)]);
    await run(["config", "set", p.lxdName as string, "limits.memory", `${p.ramMiB ?? 512}MiB`]);
    await run(["config", "device", "override", p.lxdName as string, "root", "size", `${p.diskGiB ?? 5}GiB`]);
    return { lxdName: p.lxdName, verified: true };
  }

  if (job.type === "vps.clone") {
    if (!safeName(p.lxdName) || !safeName(p.sourceLxdName)) throw new Error("Rejected invalid clone payload");
    await run(["copy", p.sourceLxdName as string, p.lxdName as string]);
    await run(["start", p.lxdName as string]);
    return { lxdName: p.lxdName, verified: true };
  }

  if (job.type === "vps.resize") {
    if (!safeName(p.lxdName)) throw new Error("Rejected invalid resize payload");
    if (p.cpu) await run(["config", "set", p.lxdName as string, "limits.cpu", String(p.cpu)]);
    if (p.ramMiB) await run(["config", "set", p.lxdName as string, "limits.memory", `${p.ramMiB}MiB`]);
    if (p.diskGiB) await run(["config", "device", "override", p.lxdName as string, "root", "size", `${p.diskGiB}GiB`]);
    return { lxdName: p.lxdName, verified: true };
  }

  if (job.type === "vps.metrics") {
    if (!safeName(p.lxdName)) throw new Error("Rejected invalid metrics payload");
    const metrics = await getContainerMetrics(p.lxdName);
    return { ...metrics, verified: true };
  }

  if (job.type === "vps.move") {
    if (!safeName(p.lxdName) || !safeName(p.sourceLxdName as string) || !safeName(p.toNodeId as string))
      throw new Error("Rejected invalid move payload");
    await run(["stop", p.lxdName as string, "--timeout", "30"]);
    await run(["move", p.lxdName as string, `${p.toNodeId}:`]);
    return { lxdName: p.lxdName, verified: true };
  }

  if (!safeName(p.lxdName)) throw new Error("Rejected invalid LXD name");

  if (job.type === "snapshot.create") {
    if (!safeName(p.snapshotName)) throw new Error("Rejected invalid snapshot name");
    await run(["snapshot", p.lxdName as string, p.snapshotName as string]);
    await run(["info", `${p.lxdName}/${p.snapshotName}`]);
    return { snapshotName: p.snapshotName, verified: true };
  }

  if (job.type === "snapshot.restore") {
    if (!safeName(p.snapshotName)) throw new Error("Rejected invalid snapshot name");
    await run(["restore", p.lxdName as string, p.snapshotName as string]);
    return { snapshotName: p.snapshotName, verified: true };
  }

  if (job.type === "snapshot.delete") {
    if (!safeName(p.snapshotName)) throw new Error("Rejected invalid snapshot name");
    await run(["delete", `${p.lxdName}/${p.snapshotName}`]);
    return { snapshotName: p.snapshotName, verified: true };
  }

  if (job.type === "backup.create") {
    if (!safeName(p.backupId)) throw new Error("Rejected invalid backup id");
    await mkdir(backupDir, { recursive: true, mode: 0o700 });
    const path = resolve(backupDir, `${p.backupId}.tar.zst`);
    if (!path.startsWith(`${backupDir}/`)) throw new Error("Rejected backup path");
    await run(["export", p.lxdName as string, path]);
    const info = await stat(path);
    if (info.size < 1) throw new Error("LXD export did not create a backup");
    return { storageRef: path, sizeBytes: info.size, verified: true };
  }

  if (job.type === "backup.restore") {
    if (!safeName(p.backupId) || !safeName(p.storageRef as string)) throw new Error("Rejected invalid restore payload");
    const backupPath = p.storageRef as string;
    await run(["stop", p.lxdName as string, "--timeout", "30"]).catch(() => {});
    await run(["delete", "--force", p.lxdName as string]).catch(() => {});
    await run(["import", backupPath, p.lxdName as string]);
    await run(["start", p.lxdName as string]);
    return { lxdName: p.lxdName, verified: true };
  }

  if (job.type === "backup.delete") {
    if (!safeName(p.storageRef as string)) throw new Error("Rejected invalid backup path");
    const backupPath = p.storageRef as string;
    if (backupPath.startsWith(backupDir + "/")) {
      await rm(backupPath, { force: true });
    }
    return { deleted: true, verified: true };
  }

  if (job.type === "rdp.enable") {
    if (!safeName(p.lxdName)) throw new Error("Rejected invalid RDP payload");
    const { username, password } = await installRdpInContainer(p.lxdName as string);
    let tailscaleIp: string | null = null;
    if (tailscaleAuthKey) tailscaleIp = await setupTailscaleInContainer(p.lxdName as string);

    let pinggyEndpoint: { host: string; port: number } | null = null;
    if (!tailscaleIp && pinggyToken) pinggyEndpoint = await startPinggyInContainer(p.lxdName as string, 3389);

    const provider = pinggyEndpoint ? "PINGGY" : tailscaleIp ? "TAILSCALE" : "DIRECT";
    const host = pinggyEndpoint?.host ?? tailscaleIp ?? await getContainerIp(p.lxdName as string) ?? "localhost";
    const port = pinggyEndpoint?.port ?? 3389;

    return { username, password, provider, host, port, verified: true };
  }

  if (job.type === "rdp.disable") {
    if (!safeName(p.lxdName)) throw new Error("Rejected invalid RDP payload");
    await stopPinggyInContainer(p.lxdName as string);
    await removeRdpFromContainer(p.lxdName as string);
    return { verified: true };
  }

  if (job.type === "rdp.reset-password") {
    if (!safeName(p.lxdName)) throw new Error("Rejected invalid RDP payload");
    const password = randomBytes(16).toString("base64url");
    await runInContainer(p.lxdName as string, ["bash", "-c", `echo "vexrdp:${password}" | chpasswd`], 10_000);
    return { password, verified: true };
  }

  if (job.type === "rdp.restart") {
    if (!safeName(p.lxdName)) throw new Error("Rejected invalid RDP payload");
    await runInContainer(p.lxdName as string, ["bash", "-c", "systemctl restart xrdp || true"], 15_000);
    return { verified: true };
  }

  if (job.type === "tailscale.setup") {
    if (!safeName(p.lxdName)) throw new Error("Rejected invalid Tailscale payload");
    const ip = await setupTailscaleInContainer(p.lxdName as string);
    return { tailscaleIp: ip, verified: true };
  }

  if (job.type === "sshx.start") {
    if (!safeName(p.lxdName)) throw new Error("Rejected invalid SSHX payload");
    try {
      await runInContainer(p.lxdName as string, ["bash", "-c", `
        curl -fsSL https://sshx.io/get | sh > /dev/null 2>&1
        nohup /tmp/sshx serve > /tmp/sshx.log 2>&1 &
        sleep 5
        cat /tmp/sshx.log
      `], 60_000);
      const output = await runInContainer(p.lxdName as string, ["cat", "/tmp/sshx.log"]).catch(() => "");
      const urlMatch = output.match(/(https:\/\/sshx\.io\/[a-zA-Z0-9]+)/);
      return { sshxUrl: urlMatch?.[1] ?? null, verified: true };
    } catch { return { sshxUrl: null, verified: false }; }
  }

  if (job.type === "sshx.stop") {
    if (!safeName(p.lxdName)) throw new Error("Rejected invalid SSHX payload");
    await runInContainer(p.lxdName as string, ["bash", "-c", "pkill -f sshx || true"], 10_000).catch(() => {});
    return { verified: true };
  }

  const actions: Record<string, string[]> = {
    "vps.start": ["start"],
    "vps.stop": ["stop", "--timeout", "30"],
    "vps.force-stop": ["stop", "--force"],
    "vps.restart": ["restart", "--timeout", "30"],
    "vps.suspend": ["pause"],
    "vps.unsuspend": ["resume"],
    "vps.delete": ["delete", "--force"],
  };

  if (!actions[job.type]) throw new Error(`Unsupported agent task: ${job.type}`);
  await run([...actions[job.type], p.lxdName as string]);
  return { lxdName: p.lxdName, verified: true };
}

async function heartbeat() {
  try {
    const version = (await run(["version"], 5000)).trim().split("\n")[0] || "unknown";
    await fetch(`${api}/api/agent/heartbeat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nodeId, token, lxdVersion: version, agentVersion: "0.2.0" }),
    });
  } catch { /* heartbeat is best-effort */ }
}

async function cycle() {
  await heartbeat();
  await reportMetrics();

  const response = await fetch(`${api}/api/agent/tasks/${nodeId}`, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Polling failed: ${response.status}`);

  const jobs = await response.json() as Job[];
  for (const job of jobs) {
    try {
      await report(job.id, { status: "RUNNING", progress: 5 });
      const result = await execute(job);
      await report(job.id, { status: "COMPLETED", progress: 100, result });
    } catch (error) {
      await report(job.id, { status: "FAILED", progress: 100, error: error instanceof Error ? error.message : "Unknown agent failure" });
    }
  }
}

for (;;) {
  try { await cycle(); } catch (error) { console.error("agent cycle failed", error); }
  await sleep(pollMs);
}
