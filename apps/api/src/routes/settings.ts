import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { requireSession } from "../auth.js";
import { audit } from "../server.js";

export default async function settingRoutes(app: FastifyInstance) {
  app.get("/api/settings", async request => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return { error: "settings.manage permission required" };
    return db.setting.findMany({ orderBy: { key: "asc" } });
  });

  app.get("/api/settings/:key", async request => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return { error: "settings.manage permission required" };
    const { key } = z.object({ key: z.string() }).parse(request.params);
    const setting = await db.setting.findUnique({ where: { key } });
    if (!setting) return { error: "Setting not found" };
    return setting;
  });

  app.put("/api/settings/:key", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "settings.manage permission required" });
    const { key } = z.object({ key: z.string().regex(/^[a-z][a-z0-9._-]{1,63}$/) }).parse(request.params);
    const { value } = z.object({ value: z.unknown() }).parse(request.body);

    const blockedKeys = ["discord.token", "tailscale.key", "pinggy.key", "jwt.secret", "cookie.secret", "encryption.key"];
    if (blockedKeys.some(bk => key.includes(bk))) return reply.status(400).send({ error: "Secrets must be supplied through the deployment environment" });

    const setting = await db.setting.upsert({
      where: { key },
      create: { key, value: JSON.parse(JSON.stringify(value)), updatedById: s.sub },
      update: { value: JSON.parse(JSON.stringify(value)), updatedById: s.sub },
    });
    await audit(s.sub, "setting.updated", key, "success", request.ip);
    return setting;
  });

  app.delete("/api/settings/:key", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "settings.manage permission required" });
    const { key } = z.object({ key: z.string() }).parse(request.params);
    const blockedKeys = ["discord.token", "tailscale.key", "pinggy.key", "jwt.secret", "cookie.secret", "encryption.key"];
    if (blockedKeys.some(bk => key.includes(bk))) return reply.status(400).send({ error: "Cannot delete environment secrets" });
    await db.setting.delete({ where: { key } }).catch(() => {});
    await audit(s.sub, "setting.deleted", key, "success", request.ip);
    return { success: true };
  });
}
