import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { hashToken } from "../auth.js";

export default async function agentRoutes(app: FastifyInstance) {
  app.post("/api/agent/heartbeat", async (request, reply) => {
    const input = z.object({ nodeId: z.string().cuid(), token: z.string().min(32), lxdVersion: z.string().max(64), agentVersion: z.string().max(64) }).parse(request.body);
    const node = await db.node.findUnique({ where: { id: input.nodeId } });
    if (!node || node.tokenHash !== hashToken(input.token)) return reply.status(401).send({ error: "Invalid node credential" });
    await db.node.update({ where: { id: node.id }, data: { status: "ONLINE", lxdVersion: input.lxdVersion, agentVersion: input.agentVersion } });
    return { accepted: true };
  });

  app.post("/api/agent/metrics", async (request, reply) => {
    const input = z.object({ nodeId: z.string().cuid(), token: z.string().min(32), cpuCores: z.number().int(), ramMiB: z.number().int(), diskGiB: z.number().int() }).parse(request.body);
    const node = await db.node.findUnique({ where: { id: input.nodeId } });
    if (!node || node.tokenHash !== hashToken(input.token)) return reply.status(401).send({ error: "Invalid node credential" });
    await db.node.update({ where: { id: node.id }, data: { cpuCores: input.cpuCores, ramMiB: input.ramMiB, diskGiB: input.diskGiB } });
    return { accepted: true };
  });

  app.get("/api/agent/tasks/:nodeId", async (request, reply) => {
    const { nodeId } = z.object({ nodeId: z.string().cuid() }).parse(request.params);
    const token = request.headers.authorization?.replace("Bearer ", "");
    const node = await db.node.findUnique({ where: { id: nodeId } });
    if (!node || !token || node.tokenHash !== hashToken(token)) return reply.status(401).send({ error: "Invalid node credential" });
    return db.task.findMany({ where: { status: "QUEUED", vps: { nodeId } }, orderBy: { createdAt: "asc" }, take: 10 });
  });

  app.post("/api/agent/tasks/:id/result", async (request, reply) => {
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const body = z.object({
      nodeId: z.string().cuid(),
      token: z.string().min(32),
      status: z.enum(["RUNNING", "COMPLETED", "FAILED"]),
      progress: z.number().int().min(0).max(100),
      result: z.record(z.string(), z.unknown()).optional(),
      error: z.string().max(1000).optional(),
    }).parse(request.body);

    const node = await db.node.findUnique({ where: { id: body.nodeId } });
    if (!node || node.tokenHash !== hashToken(body.token)) return reply.status(401).send({ error: "Invalid node credential" });

    const current = await db.task.findUnique({ where: { id }, include: { vps: true } });
    if (!current || current.vps?.nodeId !== node.id) return reply.status(404).send({ error: "Task not found on node" });

    const safeResult = body.result ? JSON.parse(JSON.stringify(body.result)) : undefined;
    await db.task.update({ where: { id }, data: { status: body.status, progress: body.progress, result: safeResult, error: body.error } });

    if (body.status === "FAILED" && current.type === "vps.create") {
      await db.vps.update({ where: { id: current.vpsId! }, data: { status: "ERROR" } });
    }

    if (body.status === "COMPLETED") {
      const stateMap: Record<string, "RUNNING" | "STOPPED" | "SUSPENDED" | "DELETED"> = {
        "vps.create": "RUNNING", "vps.start": "RUNNING", "vps.restart": "RUNNING",
        "vps.stop": "STOPPED", "vps.force-stop": "STOPPED", "vps.suspend": "SUSPENDED",
        "vps.unsuspend": "RUNNING", "vps.delete": "DELETED",
      };
      const state = stateMap[current.type];
      if (state && current.vpsId) await db.vps.update({ where: { id: current.vpsId }, data: { status: state } });

      const payload = current.payload as Record<string, unknown>;
      const result = body.result as Record<string, unknown> | undefined;

      if (current.type === "snapshot.create" && typeof payload.snapshotName === "string" && current.vpsId) {
        await db.snapshot.updateMany({ where: { vpsId: current.vpsId, name: payload.snapshotName }, data: { sizeBytes: typeof result?.sizeBytes === "number" ? BigInt(result.sizeBytes as number) : null } });
      }

      if (current.type === "backup.create" && typeof payload.backupId === "string") {
        await db.backup.update({ where: { id: payload.backupId as string }, data: { status: "COMPLETED", completedAt: new Date(), storageRef: (result?.storageRef as string) ?? null, sizeBytes: typeof result?.sizeBytes === "number" ? BigInt(result.sizeBytes as number) : null } });
      }

      if (current.type === "backup.delete" && typeof payload.backupId === "string") {
        await db.backup.update({ where: { id: payload.backupId as string }, data: { status: "DELETED" } });
      }

      if (current.type === "snapshot.delete" && typeof payload.snapshotName === "string" && current.vpsId) {
        await db.snapshot.deleteMany({ where: { vpsId: current.vpsId, name: payload.snapshotName as string } });
      }

      if (current.type === "rdp.enable" && current.vpsId) {
        const rdpResult = result as { username?: string; host?: string; port?: number; provider?: string } | undefined;
        await db.rdpAccess.upsert({
          where: { vpsId: current.vpsId },
          create: { vpsId: current.vpsId, enabled: true, username: rdpResult?.username ?? "vexrdp", host: rdpResult?.host, port: rdpResult?.port ?? 3389, provider: (rdpResult?.provider as "DIRECT" | "TAILSCALE" | "PINGGY") ?? "DIRECT", status: "CONNECTED" },
          update: { enabled: true, username: rdpResult?.username ?? "vexrdp", host: rdpResult?.host, port: rdpResult?.port ?? 3389, provider: (rdpResult?.provider as "DIRECT" | "TAILSCALE" | "PINGGY") ?? "DIRECT", status: "CONNECTED" },
        });
      }

      if (current.type === "rdp.disable" && current.vpsId) {
        await db.rdpAccess.updateMany({ where: { vpsId: current.vpsId }, data: { enabled: false, status: "DISABLED" } });
      }

      if (current.type === "rdp.reset-password" && current.vpsId) {
        const rdpResult = result as { password?: string } | undefined;
        if (rdpResult?.password) {
          await db.rdpAccess.updateMany({ where: { vpsId: current.vpsId }, data: { passwordHash: rdpResult.password } });
        }
      }

      if (current.type === "vps.delete" && current.vpsId) {
        if (typeof payload.ipAddressId === "string") {
          await db.ipAddress.update({ where: { id: payload.ipAddressId as string }, data: { status: "AVAILABLE", vpsId: null } }).catch(() => {});
        }
        await db.vps.delete({ where: { id: current.vpsId } });
      }
    }

    return { accepted: true };
  });
}
