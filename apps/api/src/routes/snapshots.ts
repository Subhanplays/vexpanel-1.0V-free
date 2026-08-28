import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { requireSession, hasRole, type Session } from "../auth.js";
import { audit } from "../server.js";

const has = (min: Session["role"], s: Session) => hasRole(s.role, min);

export default async function snapshotRoutes(app: FastifyInstance) {
  app.get("/api/vps/:id/snapshots", async request => {
    const s = await requireSession(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const vps = await db.vps.findUnique({ where: { id } });
    if (!vps) return { error: "VPS not found" };
    if (vps.userId !== s.sub && !has("SUPPORT", s)) return { error: "Access denied" };
    return db.snapshot.findMany({ where: { vpsId: id }, orderBy: { createdAt: "desc" } });
  });

  app.post("/api/vps/:id/snapshots", async (request, reply) => {
    const s = await requireSession(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const vps = await db.vps.findUnique({ where: { id }, include: { plan: true } });
    if (!vps) return reply.status(404).send({ error: "VPS not found" });
    if (vps.userId !== s.sub && !has("SUPPORT", s)) return reply.status(403).send({ error: "Access denied" });

    if (vps.plan && !vps.plan.snapshots && !has("ADMIN", s))
      return reply.status(403).send({ error: "Snapshots not included in plan" });

    const { name } = z.object({ name: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/) }).parse(request.body);
    const snapshot = await db.snapshot.create({ data: { name, vpsId: id } });
    const queued = await db.task.create({ data: { type: "snapshot.create", vpsId: id, payload: { vpsId: id, nodeId: vps.nodeId, lxdName: vps.lxdName, snapshotName: name } } });
    await audit(s.sub, "snapshot.create.queued", snapshot.id, "queued", request.ip);
    return reply.status(202).send({ snapshot, taskId: queued.id });
  });

  app.post("/api/vps/:id/snapshots/:snapshotId/restore", async (request, reply) => {
    const s = await requireSession(request);
    if (!has("SUPPORT", s)) return reply.status(403).send({ error: "Elevated permission required" });
    const { id, snapshotId } = z.object({ id: z.string().cuid(), snapshotId: z.string().cuid() }).parse(request.params);
    const vps = await db.vps.findUnique({ where: { id } });
    if (!vps) return reply.status(404).send({ error: "VPS not found" });
    const snapshot = await db.snapshot.findUnique({ where: { id: snapshotId } });
    if (!snapshot || snapshot.vpsId !== id) return reply.status(404).send({ error: "Snapshot not found" });

    const queued = await db.task.create({ data: { type: "snapshot.restore", vpsId: id, payload: { vpsId: id, nodeId: vps.nodeId, lxdName: vps.lxdName, snapshotName: snapshot.name } } });
    await audit(s.sub, "snapshot.restore.queued", snapshotId, "queued", request.ip);
    return reply.status(202).send({ taskId: queued.id });
  });

  app.delete("/api/vps/:id/snapshots/:snapshotId", async (request, reply) => {
    const s = await requireSession(request);
    const { id, snapshotId } = z.object({ id: z.string().cuid(), snapshotId: z.string().cuid() }).parse(request.params);
    const vps = await db.vps.findUnique({ where: { id } });
    if (!vps) return reply.status(404).send({ error: "VPS not found" });
    if (vps.userId !== s.sub && !has("SUPPORT", s)) return reply.status(403).send({ error: "Access denied" });

    const snapshot = await db.snapshot.findUnique({ where: { id: snapshotId } });
    if (!snapshot || snapshot.vpsId !== id) return reply.status(404).send({ error: "Snapshot not found" });

    const queued = await db.task.create({ data: { type: "snapshot.delete", vpsId: id, payload: { vpsId: id, nodeId: vps.nodeId, lxdName: vps.lxdName, snapshotName: snapshot.name } } });
    await audit(s.sub, "snapshot.delete.queued", snapshotId, "queued", request.ip);
    return reply.status(202).send({ taskId: queued.id });
  });
}
