import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { requireSession } from "../auth.js";
import { audit } from "../server.js";

export default async function planRoutes(app: FastifyInstance) {
  app.get("/api/plans", async request => {
    const s = await requireSession(request);
    return db.plan.findMany({ orderBy: { name: "asc" } });
  });

  app.get("/api/plans/:id", async request => {
    const s = await requireSession(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    return db.plan.findUniqueOrThrow({ where: { id }, include: { _count: { select: { users: true, vpses: true } } } });
  });

  app.post("/api/plans", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "plans.manage permission required" });
    const input = z.object({
      name: z.string().min(2).max(64),
      cpu: z.number().int().min(1),
      ramMiB: z.number().int().min(512),
      diskGiB: z.number().int().min(5),
      vpsLimit: z.number().int().min(1),
      ipv4: z.boolean().default(false),
      ipv6: z.boolean().default(false),
      rdp: z.boolean().default(false),
      sshx: z.boolean().default(false),
      tailscale: z.boolean().default(false),
      backups: z.boolean().default(false),
      snapshots: z.boolean().default(false),
    }).parse(request.body);

    const plan = await db.plan.create({ data: input });
    await audit(s.sub, "plan.created", plan.id, "success", request.ip);
    return reply.status(201).send(plan);
  });

  app.put("/api/plans/:id", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "plans.manage permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const input = z.object({
      name: z.string().min(2).max(64).optional(),
      cpu: z.number().int().min(1).optional(),
      ramMiB: z.number().int().min(512).optional(),
      diskGiB: z.number().int().min(5).optional(),
      vpsLimit: z.number().int().min(1).optional(),
      ipv4: z.boolean().optional(),
      ipv6: z.boolean().optional(),
      rdp: z.boolean().optional(),
      sshx: z.boolean().optional(),
      tailscale: z.boolean().optional(),
      backups: z.boolean().optional(),
      snapshots: z.boolean().optional(),
    }).parse(request.body);

    const plan = await db.plan.update({ where: { id }, data: input });
    await audit(s.sub, "plan.updated", id, "success", request.ip);
    return plan;
  });

  app.delete("/api/plans/:id", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "super-admin permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const userCount = await db.user.count({ where: { planId: id } });
    if (userCount > 0) return reply.status(409).send({ error: "Plan has assigned users" });
    await db.plan.delete({ where: { id } });
    await audit(s.sub, "plan.deleted", id, "success", request.ip);
    return reply.status(204).send();
  });
}
