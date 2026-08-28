import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { requireSession, hashToken } from "../auth.js";
import { audit } from "../server.js";

export default async function nodeRoutes(app: FastifyInstance) {
  app.get("/api/nodes", async request => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN" && s.role !== "NODE_MANAGER") return { error: "nodes.view permission required" };
    return db.node.findMany({ include: { _count: { select: { vpses: true } } }, orderBy: { name: "asc" } });
  });

  app.get("/api/nodes/:id", async request => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN" && s.role !== "NODE_MANAGER") return { error: "nodes.view permission required" };
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const node = await db.node.findUniqueOrThrow({ where: { id }, include: { _count: { select: { vpses: true } }, vpses: { select: { id: true, name: true, status: true } } } });
    return node;
  });

  app.post("/api/nodes", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "nodes.manage permission required" });
    const input = z.object({ name: z.string().regex(/^[a-z0-9-]{2,32}$/), address: z.string().ip() }).parse(request.body);
    const enrollmentToken = randomUUID() + randomUUID();
    const node = await db.node.create({ data: { ...input, tokenHash: hashToken(enrollmentToken) } });
    await audit(s.sub, "node.created", node.id, "success", request.ip);
    return reply.status(201).send({ node, enrollmentToken });
  });

  app.put("/api/nodes/:id", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "nodes.manage permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const input = z.object({ name: z.string().regex(/^[a-z0-9-]{2,32}$/).optional(), address: z.string().ip().optional() }).parse(request.body);
    const node = await db.node.update({ where: { id }, data: input });
    await audit(s.sub, "node.updated", id, "success", request.ip);
    return node;
  });

  app.delete("/api/nodes/:id", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "super-admin permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const vpsCount = await db.vps.count({ where: { nodeId: id, status: { notIn: ["DELETED"] } } });
    if (vpsCount > 0) return reply.status(409).send({ error: "Node has active VPS instances" });
    await db.node.delete({ where: { id } });
    await audit(s.sub, "node.deleted", id, "success", request.ip);
    return reply.status(204).send();
  });

  app.post("/api/nodes/:id/maintenance", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "nodes.manage permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const { enabled } = z.object({ enabled: z.boolean() }).parse(request.body);
    const node = await db.node.update({ where: { id }, data: { status: enabled ? "MAINTENANCE" : "OFFLINE" } });
    await audit(s.sub, enabled ? "node.maintenance.on" : "node.maintenance.off", id, "success", request.ip);
    return { id: node.id, status: node.status };
  });

  app.post("/api/nodes/:id/regenerate-token", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "nodes.manage permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const enrollmentToken = randomUUID() + randomUUID();
    await db.node.update({ where: { id }, data: { tokenHash: hashToken(enrollmentToken) } });
    await audit(s.sub, "node.token_regenerated", id, "success", request.ip);
    return { enrollmentToken };
  });
}
