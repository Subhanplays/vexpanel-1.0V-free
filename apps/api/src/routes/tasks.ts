import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { requireSession, hasRole, type Session } from "../auth.js";
import { audit } from "../server.js";

const has = (min: Session["role"], s: Session) => hasRole(s.role, min);

export default async function taskRoutes(app: FastifyInstance) {
  app.get("/api/tasks", async request => {
    const s = await requireSession(request);
    return db.task.findMany({
      where: has("SUPPORT", s) ? {} : { vps: { userId: s.sub } },
      include: { vps: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  });

  app.get("/api/tasks/:id", async request => {
    const s = await requireSession(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const taskRecord = await db.task.findUnique({ where: { id }, include: { vps: { select: { name: true, userId: true } } } });
    if (!taskRecord) return { error: "Task not found" };
    if (taskRecord.vps?.userId !== s.sub && !has("SUPPORT", s)) return { error: "Access denied" };
    return taskRecord;
  });

  app.post("/api/tasks/:id/cancel", async (request, reply) => {
    const s = await requireSession(request);
    if (!has("SUPPORT", s)) return reply.status(403).send({ error: "Elevated permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const taskRecord = await db.task.findUnique({ where: { id } });
    if (!taskRecord) return reply.status(404).send({ error: "Task not found" });
    if (taskRecord.status !== "QUEUED") return reply.status(400).send({ error: "Only queued tasks can be cancelled" });

    await db.task.update({ where: { id }, data: { status: "CANCELLED" } });
    await audit(s.sub, "task.cancelled", id, "success", request.ip);
    return { success: true };
  });

  app.delete("/api/tasks/:id", async (request, reply) => {
    const s = await requireSession(request);
    if (!has("ADMIN", s)) return reply.status(403).send({ error: "Admin permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const taskRecord = await db.task.findUnique({ where: { id } });
    if (!taskRecord) return reply.status(404).send({ error: "Task not found" });
    if (taskRecord.status === "RUNNING") return reply.status(400).send({ error: "Cannot delete running tasks" });

    await db.task.delete({ where: { id } });
    await audit(s.sub, "task.deleted", id, "success", request.ip);
    return { success: true };
  });

  app.delete("/api/tasks", async (request, reply) => {
    const s = await requireSession(request);
    if (!has("ADMIN", s)) return reply.status(403).send({ error: "Admin permission required" });
    const { olderThan } = z.object({ olderThan: z.coerce.date().optional() }).parse(request.body ?? {});
    const statusFilter: ("COMPLETED" | "FAILED" | "CANCELLED")[] = ["COMPLETED", "FAILED", "CANCELLED"];
    const where = { status: { in: statusFilter }, ...(olderThan ? { createdAt: { lt: olderThan } } : {}) };
    const result = await db.task.deleteMany({ where });
    await audit(s.sub, "task.bulk_deleted", `${result.count} tasks`, "success", request.ip);
    return { deleted: result.count };
  });
}
