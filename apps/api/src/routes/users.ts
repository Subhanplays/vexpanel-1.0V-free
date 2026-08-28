import type { FastifyInstance } from "fastify";
import argon2 from "argon2";
import { z } from "zod";
import { db } from "../lib/db.js";
import { requireSession } from "../auth.js";
import { audit } from "../server.js";

export default async function userRoutes(app: FastifyInstance) {
  app.get("/api/users", async request => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return { error: "users.view permission required" };
    return db.user.findMany({
      select: { id: true, email: true, username: true, role: true, suspendedAt: true, createdAt: true, lastLoginAt: true, discordId: true, plan: { select: { name: true } }, _count: { select: { vpses: true } } },
      orderBy: { createdAt: "desc" },
    });
  });

  app.get("/api/users/:id", async request => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return { error: "users.view permission required" };
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    return db.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, email: true, username: true, role: true, suspendedAt: true, createdAt: true, lastLoginAt: true, discordId: true, plan: { select: { name: true } }, _count: { select: { vpses: true } } },
    });
  });

  app.post("/api/users", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "users.manage permission required" });
    const input = z.object({
      email: z.string().email(),
      username: z.string().regex(/^[a-zA-Z0-9_-]{3,32}$/),
      password: z.string().min(12).max(256),
      role: z.enum(["USER", "SUPPORT", "NODE_MANAGER", "ADMIN", "SUPER_ADMIN"]).default("USER"),
      planId: z.string().cuid().optional(),
    }).parse(request.body);

    if (input.role === "SUPER_ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "super-admin permission required" });

    const existing = await db.user.findFirst({ where: { OR: [{ email: input.email }, { username: input.username }] } });
    if (existing) return reply.status(409).send({ error: "Email or username already taken" });

    const user = await db.user.create({
      data: { email: input.email, username: input.username, passwordHash: await argon2.hash(input.password, { type: argon2.argon2id }), role: input.role, planId: input.planId },
    });
    await audit(s.sub, "user.created", user.id, "success", request.ip);
    return reply.status(201).send({ id: user.id, email: user.email, username: user.username, role: user.role });
  });

  app.put("/api/users/:id", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "users.manage permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const input = z.object({
      email: z.string().email().optional(),
      username: z.string().regex(/^[a-zA-Z0-9_-]{3,32}$/).optional(),
      role: z.enum(["USER", "SUPPORT", "NODE_MANAGER", "ADMIN", "SUPER_ADMIN"]).optional(),
      planId: z.string().cuid().nullable().optional(),
    }).parse(request.body);

    if (input.role === "SUPER_ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "super-admin permission required" });
    if (id === s.sub && input.role && input.role !== s.role) return reply.status(409).send({ error: "Cannot change your own role" });

    const user = await db.user.update({ where: { id }, data: input });
    await audit(s.sub, "user.updated", id, "success", request.ip);
    return { id: user.id, email: user.email, username: user.username, role: user.role };
  });

  app.delete("/api/users/:id", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "super-admin permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    if (id === s.sub) return reply.status(409).send({ error: "Cannot delete your own account" });

    const vpsCount = await db.vps.count({ where: { userId: id, status: { notIn: ["DELETED"] } } });
    if (vpsCount > 0) return reply.status(409).send({ error: "User has active VPS instances" });

    await db.user.delete({ where: { id } });
    await audit(s.sub, "user.deleted", id, "success", request.ip);
    return reply.status(204).send();
  });

  app.post("/api/users/:id/suspension", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "users.manage permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const { suspended } = z.object({ suspended: z.boolean() }).parse(request.body);
    if (id === s.sub) return reply.status(409).send({ error: "You cannot suspend your own account" });

    const user = await db.user.update({ where: { id }, data: { suspendedAt: suspended ? new Date() : null } });
    await audit(s.sub, suspended ? "user.suspended" : "user.unsuspended", id, "success", request.ip);
    return { id: user.id, suspendedAt: user.suspendedAt };
  });

  app.put("/api/users/:id/role", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "super-admin permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const { role } = z.object({ role: z.enum(["USER", "SUPPORT", "NODE_MANAGER", "ADMIN", "SUPER_ADMIN"]) }).parse(request.body);
    if (id === s.sub) return reply.status(409).send({ error: "Cannot change your own role" });

    const user = await db.user.update({ where: { id }, data: { role } });
    await audit(s.sub, "user.role_changed", id, `role:${role}`, request.ip);
    return { id: user.id, role: user.role };
  });

  app.post("/api/users/:id/reset-password", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "users.manage permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const { password } = z.object({ password: z.string().min(12).max(256) }).parse(request.body);

    await db.user.update({ where: { id }, data: { passwordHash: await argon2.hash(password, { type: argon2.argon2id }) } });
    await audit(s.sub, "user.password_reset", id, "success", request.ip);
    return { success: true };
  });
}
