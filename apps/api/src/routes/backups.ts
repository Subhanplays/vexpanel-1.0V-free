import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { requireSession, hasRole, type Session } from "../auth.js";
import { audit } from "../server.js";

const has = (min: Session["role"], s: Session) => hasRole(s.role, min);

export default async function backupRoutes(app: FastifyInstance) {
  app.get("/api/vps/:id/backups", async request => {
    const s = await requireSession(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const vps = await db.vps.findUnique({ where: { id } });
    if (!vps) return { error: "VPS not found" };
    if (vps.userId !== s.sub && !has("SUPPORT", s)) return { error: "Access denied" };
    return db.backup.findMany({ where: { vpsId: id }, orderBy: { createdAt: "desc" } });
  });

  app.post("/api/vps/:id/backups", async (request, reply) => {
    const s = await requireSession(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const vps = await db.vps.findUnique({ where: { id }, include: { plan: true } });
    if (!vps) return reply.status(404).send({ error: "VPS not found" });
    if (vps.userId !== s.sub && !has("SUPPORT", s)) return reply.status(403).send({ error: "Access denied" });
    if (vps.plan && !vps.plan.backups && !has("ADMIN", s))
      return reply.status(403).send({ error: "Backups not included in plan" });

    const { name } = z.object({ name: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/) }).parse(request.body);
    const backup = await db.backup.create({ data: { name, vpsId: id } });
    const queued = await db.task.create({ data: { type: "backup.create", vpsId: id, payload: { vpsId: id, nodeId: vps.nodeId, lxdName: vps.lxdName, backupId: backup.id } } });
    await audit(s.sub, "backup.create.queued", backup.id, "queued", request.ip);
    return reply.status(202).send({ backup, taskId: queued.id });
  });

  app.post("/api/vps/:id/backups/:backupId/restore", async (request, reply) => {
    const s = await requireSession(request);
    if (!has("SUPPORT", s)) return reply.status(403).send({ error: "Elevated permission required" });
    const { id, backupId } = z.object({ id: z.string().cuid(), backupId: z.string().cuid() }).parse(request.params);
    const vps = await db.vps.findUnique({ where: { id } });
    if (!vps) return reply.status(404).send({ error: "VPS not found" });
    const backup = await db.backup.findUnique({ where: { id: backupId } });
    if (!backup || backup.vpsId !== id) return reply.status(404).send({ error: "Backup not found" });
    if (backup.status !== "COMPLETED" || !backup.storageRef) return reply.status(400).send({ error: "Backup not ready" });

    const queued = await db.task.create({ data: { type: "backup.restore", vpsId: id, payload: { vpsId: id, nodeId: vps.nodeId, lxdName: vps.lxdName, backupId: backup.id, storageRef: backup.storageRef } } });
    await audit(s.sub, "backup.restore.queued", backupId, "queued", request.ip);
    return reply.status(202).send({ taskId: queued.id });
  });

  app.delete("/api/vps/:id/backups/:backupId", async (request, reply) => {
    const s = await requireSession(request);
    const { id, backupId } = z.object({ id: z.string().cuid(), backupId: z.string().cuid() }).parse(request.params);
    const vps = await db.vps.findUnique({ where: { id } });
    if (!vps) return reply.status(404).send({ error: "VPS not found" });
    if (vps.userId !== s.sub && !has("SUPPORT", s)) return reply.status(403).send({ error: "Access denied" });

    const backup = await db.backup.findUnique({ where: { id: backupId } });
    if (!backup || backup.vpsId !== id) return reply.status(404).send({ error: "Backup not found" });

    const queued = await db.task.create({ data: { type: "backup.delete", vpsId: id, payload: { vpsId: id, nodeId: vps.nodeId, lxdName: vps.lxdName, backupId: backup.id, storageRef: backup.storageRef } } });
    await audit(s.sub, "backup.delete.queued", backupId, "queued", request.ip);
    return reply.status(202).send({ taskId: queued.id });
  });
}
