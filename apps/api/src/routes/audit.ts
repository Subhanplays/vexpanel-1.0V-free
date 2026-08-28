import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { requireSession } from "../auth.js";

export default async function auditRoutes(app: FastifyInstance) {
  app.get("/api/audit", async request => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return { error: "audit.view permission required" };
    const { action, actorId, target, limit } = z.object({
      action: z.string().optional(),
      actorId: z.string().optional(),
      target: z.string().optional(),
      limit: z.number().int().min(1).max(500).default(200),
    }).parse(request.query);

    return db.auditLog.findMany({
      where: { ...(action ? { action: { contains: action } } : {}), ...(actorId ? { actorId } : {}), ...(target ? { target: { contains: target } } : {}) },
      include: { actor: { select: { username: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  });
}
