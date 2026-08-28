import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { requireSession, hasRole, type Session } from "../auth.js";
import { audit } from "../server.js";

const has = (min: Session["role"], s: Session) => hasRole(s.role, min);

async function vpsFor(id: string, s: Session) {
  const vps = await db.vps.findUnique({ where: { id }, include: { ip: true, node: true, plan: true, rdp: true } });
  if (!vps) throw Object.assign(new Error("VPS not found"), { statusCode: 404 });
  if (vps.userId !== s.sub && !has("SUPPORT", s)) throw Object.assign(new Error("VPS access denied"), { statusCode: 403 });
  return vps;
}

async function createTask(type: string, vpsId: string | undefined, payload: object) {
  return db.task.create({ data: { type, vpsId, payload } });
}

export default async function vpsRoutes(app: FastifyInstance) {
  app.get("/api/vps", async request => {
    const s = await requireSession(request);
    return db.vps.findMany({
      where: has("SUPPORT", s) ? {} : { userId: s.sub },
      include: { node: { select: { name: true } }, ip: true, plan: { select: { name: true } }, rdp: true },
      orderBy: { createdAt: "desc" },
    });
  });

  app.get("/api/vps/:id", async request => {
    const s = await requireSession(request);
    const vps = await vpsFor(z.object({ id: z.string().cuid() }).parse(request.params).id, s);
    const snapshots = await db.snapshot.findMany({ where: { vpsId: vps.id }, orderBy: { createdAt: "desc" } });
    const backups = await db.backup.findMany({ where: { vpsId: vps.id }, orderBy: { createdAt: "desc" } });
    const tasks = await db.task.findMany({ where: { vpsId: vps.id }, orderBy: { createdAt: "desc" }, take: 20 });
    return { ...vps, snapshots, backups, tasks };
  });

  app.post("/api/vps", async (request, reply) => {
    const s = await requireSession(request);
    if (!has("SUPPORT", s)) return reply.status(403).send({ error: "vps.create permission required" });

    const input = z.object({
      userId: z.string().cuid(),
      nodeId: z.string().cuid().optional(),
      planId: z.string().cuid().optional(),
      name: z.string().regex(/^[a-zA-Z0-9 _-]{1,64}$/),
      hostname: z.string().regex(/^[a-zA-Z0-9-]{1,63}$/),
      imageAlias: z.string().regex(/^[a-z0-9:._/-]{1,128}$/i),
      cpu: z.number().int().min(1).max(64),
      ramMiB: z.number().int().min(512).max(524288),
      diskGiB: z.number().int().min(5).max(4096),
      ipv4: z.boolean().default(true),
      ipv6: z.boolean().default(false),
      rdp: z.boolean().default(false),
      sshx: z.boolean().default(true),
      tailscale: z.boolean().default(false),
      expiresAt: z.coerce.date().optional(),
    }).parse(request.body);

    if (input.planId) {
      const plan = await db.plan.findUnique({ where: { id: input.planId } });
      if (!plan) return reply.status(404).send({ error: "Plan not found" });
      if (input.cpu > plan.cpu || input.ramMiB > plan.ramMiB || input.diskGiB > plan.diskGiB)
        return reply.status(400).send({ error: "Resources exceed plan limits" });

      const userVpsCount = await db.vps.count({ where: { userId: input.userId, status: { notIn: ["DELETED"] } } });
      if (userVpsCount >= plan.vpsLimit) return reply.status(400).send({ error: "Plan VPS limit reached" });
    }

    let nodeId = input.nodeId;
    if (!nodeId) {
      const node = await db.node.findFirst({ where: { status: "ONLINE" }, include: { _count: { select: { vpses: true } } }, orderBy: { vpses: { _count: "asc" } } });
      if (!node) return reply.status(409).send({ error: "No online nodes available" });
      nodeId = node.id;
    } else {
      const node = await db.node.findFirst({ where: { id: nodeId, status: "ONLINE" } });
      if (!node) return reply.status(409).send({ error: "Selected node is not online" });
    }

    let assignedIpId: string | undefined;
    if (input.ipv4) {
      const ip = await db.ipAddress.findFirst({ where: { status: "AVAILABLE", nodeId } });
      if (ip) {
        assignedIpId = ip.id;
        await db.ipAddress.update({ where: { id: ip.id }, data: { status: "ASSIGNED" } });
      }
    }

    const vps = await db.vps.create({
      data: {
        userId: input.userId,
        nodeId,
        planId: input.planId,
        name: input.name,
        hostname: input.hostname,
        imageAlias: input.imageAlias,
        cpu: input.cpu,
        ramMiB: input.ramMiB,
        diskGiB: input.diskGiB,
        lxdName: `vex-${randomUUID()}`,
        status: "PROVISIONING",
        expiresAt: input.expiresAt,
      },
    });

    if (assignedIpId) {
      await db.ipAddress.update({ where: { id: assignedIpId }, data: { vpsId: vps.id } });
    }

    const queued = await createTask("vps.create", vps.id, { vpsId: vps.id, nodeId, lxdName: vps.lxdName, imageAlias: vps.imageAlias, cpu: vps.cpu, ramMiB: vps.ramMiB, diskGiB: vps.diskGiB });
    await audit(s.sub, "vps.create.queued", vps.id, "queued", request.ip);
    return reply.status(202).send({ vpsId: vps.id, taskId: queued.id, status: "queued" });
  });

  app.put("/api/vps/:id", async (request, reply) => {
    const s = await requireSession(request);
    const vps = await vpsFor(z.object({ id: z.string().cuid() }).parse(request.params).id, s);
    if (vps.userId !== s.sub && !has("ADMIN", s)) return reply.status(403).send({ error: "Permission denied" });

    const input = z.object({
      name: z.string().regex(/^[a-zA-Z0-9 _-]{1,64}$/).optional(),
      hostname: z.string().regex(/^[a-zA-Z0-9-]{1,63}$/).optional(),
      expiresAt: z.coerce.date().nullable().optional(),
    }).parse(request.body);

    const updated = await db.vps.update({ where: { id: vps.id }, data: input });
    await audit(s.sub, "vps.updated", vps.id, "success", request.ip);
    return { id: updated.id, name: updated.name, hostname: updated.hostname, expiresAt: updated.expiresAt };
  });

  app.put("/api/vps/:id/resources", async (request, reply) => {
    const s = await requireSession(request);
    if (!has("ADMIN", s)) return reply.status(403).send({ error: "vps.manage permission required" });
    const vps = await vpsFor(z.object({ id: z.string().cuid() }).parse(request.params).id, s);

    const input = z.object({
      cpu: z.number().int().min(1).max(64).optional(),
      ramMiB: z.number().int().min(512).max(524288).optional(),
      diskGiB: z.number().int().min(5).max(4096).optional(),
    }).parse(request.body);

    if (vps.planId) {
      const plan = await db.plan.findUnique({ where: { id: vps.planId } });
      if (plan) {
        if (input.cpu && input.cpu > plan.cpu) return reply.status(400).send({ error: "CPU exceeds plan limit" });
        if (input.ramMiB && input.ramMiB > plan.ramMiB) return reply.status(400).send({ error: "RAM exceeds plan limit" });
        if (input.diskGiB && input.diskGiB > plan.diskGiB) return reply.status(400).send({ error: "Disk exceeds plan limit" });
      }
    }

    const queued = await createTask("vps.resize", vps.id, { vpsId: vps.id, nodeId: vps.nodeId, lxdName: vps.lxdName, ...input });
    await audit(s.sub, "vps.resize.queued", vps.id, "queued", request.ip);
    return reply.status(202).send({ taskId: queued.id, status: "queued" });
  });

  app.post("/api/vps/:id/actions", async (request, reply) => {
    const s = await requireSession(request);
    const vps = await vpsFor(z.object({ id: z.string().cuid() }).parse(request.params).id, s);
    const input = z.object({
      action: z.enum(["start", "stop", "restart", "force-stop", "suspend", "unsuspend", "delete", "rebuild", "snapshot", "rdp-enable", "rdp-disable", "rdp-reset-password", "rdp-restart"]),
    }).parse(request.body);

    if (["delete", "suspend", "unsuspend", "rebuild"].includes(input.action) && !has("SUPPORT", s))
      return reply.status(403).send({ error: "Elevated permission required" });

    if (input.action === "delete") {
      const queued = await createTask("vps.delete", vps.id, { vpsId: vps.id, nodeId: vps.nodeId, lxdName: vps.lxdName, ipAddressId: vps.ip?.id });
      await audit(s.sub, "vps.delete.queued", vps.id, "queued", request.ip);
      return reply.status(202).send({ taskId: queued.id, status: "queued" });
    }

    if (input.action === "rebuild") {
      const queued = await createTask("vps.rebuild", vps.id, { vpsId: vps.id, nodeId: vps.nodeId, lxdName: vps.lxdName, imageAlias: vps.imageAlias });
      await audit(s.sub, "vps.rebuild.queued", vps.id, "queued", request.ip);
      return reply.status(202).send({ taskId: queued.id, status: "queued" });
    }

    if (input.action === "rdp-enable") {
      const queued = await createTask("rdp.enable", vps.id, { vpsId: vps.id, nodeId: vps.nodeId, lxdName: vps.lxdName, hostname: vps.hostname });
      await audit(s.sub, "rdp.enable.queued", vps.id, "queued", request.ip);
      return reply.status(202).send({ taskId: queued.id, status: "queued" });
    }

    if (input.action === "rdp-disable") {
      const queued = await createTask("rdp.disable", vps.id, { vpsId: vps.id, nodeId: vps.nodeId, lxdName: vps.lxdName });
      await audit(s.sub, "rdp.disable.queued", vps.id, "queued", request.ip);
      return reply.status(202).send({ taskId: queued.id, status: "queued" });
    }

    if (input.action === "rdp-reset-password") {
      const queued = await createTask("rdp.reset-password", vps.id, { vpsId: vps.id, nodeId: vps.nodeId, lxdName: vps.lxdName });
      await audit(s.sub, "rdp.reset-password.queued", vps.id, "queued", request.ip);
      return reply.status(202).send({ taskId: queued.id, status: "queued" });
    }

    if (input.action === "rdp-restart") {
      const queued = await createTask("rdp.restart", vps.id, { vpsId: vps.id, nodeId: vps.nodeId, lxdName: vps.lxdName });
      await audit(s.sub, "rdp.restart.queued", vps.id, "queued", request.ip);
      return reply.status(202).send({ taskId: queued.id, status: "queued" });
    }

    const queued = await createTask(`vps.${input.action}`, vps.id, { vpsId: vps.id, nodeId: vps.nodeId, lxdName: vps.lxdName });
    await audit(s.sub, `vps.${input.action}.queued`, vps.id, "queued", request.ip);
    return reply.status(202).send({ taskId: queued.id, status: "queued" });
  });

  app.post("/api/vps/:id/ip", async (request, reply) => {
    const s = await requireSession(request);
    if (!has("ADMIN", s)) return reply.status(403).send({ error: "ipv4.manage permission required" });
    const vps = await vpsFor(z.object({ id: z.string().cuid() }).parse(request.params).id, s);
    const { ipId } = z.object({ ipId: z.string().cuid() }).parse(request.body);

    const ip = await db.ipAddress.findUnique({ where: { id: ipId } });
    if (!ip || ip.status !== "AVAILABLE") return reply.status(409).send({ error: "IP not available" });

    if (vps.ip?.id) {
      await db.ipAddress.update({ where: { id: vps.ip.id }, data: { status: "AVAILABLE", vpsId: null } });
    }

    await db.ipAddress.update({ where: { id: ipId }, data: { status: "ASSIGNED", vpsId: vps.id } });
    await audit(s.sub, "vps.ip_assigned", vps.id, `ip:${ip.address}`, request.ip);
    return { success: true, ip: ip.address };
  });

  app.delete("/api/vps/:id/ip", async (request, reply) => {
    const s = await requireSession(request);
    if (!has("ADMIN", s)) return reply.status(403).send({ error: "ipv4.manage permission required" });
    const vps = await vpsFor(z.object({ id: z.string().cuid() }).parse(request.params).id, s);
    if (!vps.ip?.id) return reply.status(404).send({ error: "No IP assigned" });

    await db.ipAddress.update({ where: { id: vps.ip.id }, data: { status: "AVAILABLE", vpsId: null } });
    await audit(s.sub, "vps.ip_released", vps.id, "released", request.ip);
    return { success: true };
  });

  app.post("/api/vps/:id/move", async (request, reply) => {
    const s = await requireSession(request);
    if (!has("ADMIN", s)) return reply.status(403).send({ error: "vps.manage permission required" });
    const vps = await vpsFor(z.object({ id: z.string().cuid() }).parse(request.params).id, s);
    const { nodeId } = z.object({ nodeId: z.string().cuid() }).parse(request.body);

    const node = await db.node.findFirst({ where: { id: nodeId, status: "ONLINE" } });
    if (!node) return reply.status(409).send({ error: "Target node is not online" });

    const queued = await createTask("vps.move", vps.id, { vpsId: vps.id, fromNodeId: vps.nodeId, toNodeId: nodeId, lxdName: vps.lxdName });
    await audit(s.sub, "vps.move.queued", vps.id, `to:${nodeId}`, request.ip);
    return reply.status(202).send({ taskId: queued.id, status: "queued" });
  });

  app.post("/api/vps/:id/clone", async (request, reply) => {
    const s = await requireSession(request);
    if (!has("ADMIN", s)) return reply.status(403).send({ error: "vps.manage permission required" });
    const vps = await vpsFor(z.object({ id: z.string().cuid() }).parse(request.params).id, s);
    const input = z.object({ name: z.string().regex(/^[a-zA-Z0-9 _-]{1,64}$/), hostname: z.string().regex(/^[a-zA-Z0-9-]{1,63}$/) }).parse(request.body);

    const newVps = await db.vps.create({
      data: {
        userId: vps.userId,
        nodeId: vps.nodeId,
        planId: vps.planId,
        name: input.name,
        hostname: input.hostname,
        imageAlias: vps.imageAlias,
        cpu: vps.cpu,
        ramMiB: vps.ramMiB,
        diskGiB: vps.diskGiB,
        lxdName: `vex-${randomUUID()}`,
        status: "PROVISIONING",
      },
    });

    const queued = await createTask("vps.clone", newVps.id, { vpsId: newVps.id, sourceLxdName: vps.lxdName, nodeId: vps.nodeId, lxdName: newVps.lxdName });
    await audit(s.sub, "vps.clone.queued", newVps.id, `from:${vps.id}`, request.ip);
    return reply.status(202).send({ vpsId: newVps.id, taskId: queued.id, status: "queued" });
  });

  app.get("/api/vps/:id/metrics", async request => {
    const s = await requireSession(request);
    const vps = await vpsFor(z.object({ id: z.string().cuid() }).parse(request.params).id, s);
    const queued = await createTask("vps.metrics", vps.id, { vpsId: vps.id, nodeId: vps.nodeId, lxdName: vps.lxdName });
    return { taskId: queued.id, status: "queued" };
  });
}
