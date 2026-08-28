import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { requireSession } from "../auth.js";
import { audit } from "../server.js";

export default async function ipv4Routes(app: FastifyInstance) {
  app.get("/api/ipv4", async request => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return { error: "ipv4.manage permission required" };
    return db.ipAddress.findMany({
      include: { node: { select: { name: true } }, vps: { select: { name: true } } },
      orderBy: { address: "asc" },
    });
  });

  app.post("/api/ipv4", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "ipv4.manage permission required" });
    const input = z.object({
      address: z.string().ip({ version: "v4" }),
      gateway: z.string().ip({ version: "v4" }).optional(),
      cidr: z.number().int().min(8).max(32).default(32),
      nodeId: z.string().cuid(),
    }).parse(request.body);

    const existing = await db.ipAddress.findUnique({ where: { address: input.address } });
    if (existing) return reply.status(409).send({ error: "IP address already exists" });

    const ip = await db.ipAddress.create({ data: input });
    await audit(s.sub, "ipv4.added", ip.id, "success", request.ip);
    return reply.status(201).send(ip);
  });

  app.post("/api/ipv4/bulk", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "ipv4.manage permission required" });
    const input = z.object({
      addresses: z.array(z.string().ip({ version: "v4" })).min(1).max(256),
      gateway: z.string().ip({ version: "v4" }).optional(),
      cidr: z.number().int().min(8).max(32).default(32),
      nodeId: z.string().cuid(),
    }).parse(request.body);

    const created = [];
    for (const address of input.addresses) {
      const existing = await db.ipAddress.findUnique({ where: { address } });
      if (!existing) {
        const ip = await db.ipAddress.create({ data: { address, gateway: input.gateway, cidr: input.cidr, nodeId: input.nodeId } });
        created.push(ip);
      }
    }

    await audit(s.sub, "ipv4.bulk_added", `${created.length} IPs`, "success", request.ip);
    return reply.status(201).send({ created: created.length });
  });

  app.put("/api/ipv4/:id", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "ipv4.manage permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const input = z.object({ address: z.string().ip({ version: "v4" }).optional(), gateway: z.string().ip({ version: "v4" }).optional().nullable(), cidr: z.number().int().min(8).max(32).optional(), nodeId: z.string().cuid().optional() }).parse(request.body);
    const ip = await db.ipAddress.update({ where: { id }, data: input });
    await audit(s.sub, "ipv4.updated", id, "success", request.ip);
    return ip;
  });

  app.post("/api/ipv4/:id/reservation", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "ipv4.manage permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const { reserved } = z.object({ reserved: z.boolean() }).parse(request.body);
    const ip = await db.ipAddress.findUniqueOrThrow({ where: { id } });
    if (ip.status === "ASSIGNED") return reply.status(409).send({ error: "Assigned IPs cannot be reserved" });
    return db.ipAddress.update({ where: { id }, data: { status: reserved ? "RESERVED" : "AVAILABLE" } });
  });

  app.post("/api/ipv4/:id/disable", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "ipv4.manage permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const { disabled } = z.object({ disabled: z.boolean() }).parse(request.body);
    const ip = await db.ipAddress.findUniqueOrThrow({ where: { id } });
    if (ip.status === "ASSIGNED") return reply.status(409).send({ error: "Cannot disable an assigned IP" });
    return db.ipAddress.update({ where: { id }, data: { status: disabled ? "DISABLED" : "AVAILABLE" } });
  });

  app.delete("/api/ipv4/:id", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "super-admin permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const ip = await db.ipAddress.findUniqueOrThrow({ where: { id } });
    if (ip.status === "ASSIGNED") return reply.status(409).send({ error: "Cannot delete an assigned IP" });
    await db.ipAddress.delete({ where: { id } });
    await audit(s.sub, "ipv4.deleted", id, "success", request.ip);
    return reply.status(204).send();
  });
}
