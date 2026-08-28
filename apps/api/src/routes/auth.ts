import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import argon2 from "argon2";
import { z } from "zod";
import { db } from "../lib/db.js";
import { requireSession, setSession, signSession } from "../auth.js";
import { audit } from "../server.js";

export default async function authRoutes(app: FastifyInstance) {
  app.post("/api/auth/register", async (request, reply) => {
    const input = z.object({
      email: z.string().email(),
      username: z.string().regex(/^[a-zA-Z0-9_-]{3,32}$/),
      password: z.string().min(12).max(256),
    }).parse(request.body);

    const existing = await db.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] },
    });
    if (existing) return reply.status(409).send({ error: "Email or username already taken" });

    const user = await db.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash: await argon2.hash(input.password, { type: argon2.argon2id }),
      },
    });

    setSession(reply, await signSession({ sub: user.id, role: user.role }));
    await audit(user.id, "auth.register", user.id, "success", request.ip);
    return reply.status(201).send({ user: { id: user.id, email: user.email, username: user.username, role: user.role } });
  });

  app.post("/api/auth/login", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (request, reply) => {
    const input = z.object({ email: z.string().email(), password: z.string().min(12).max(256) }).parse(request.body);
    const user = await db.user.findUnique({ where: { email: input.email } });
    if (!user?.passwordHash || user.suspendedAt || !(await argon2.verify(user.passwordHash, input.password)))
      return reply.status(401).send({ error: "Invalid credentials" });

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    setSession(reply, await signSession({ sub: user.id, role: user.role }));
    await audit(user.id, "auth.login", user.id, "success", request.ip);
    return { user: { id: user.id, email: user.email, username: user.username, role: user.role } };
  });

  app.post("/api/auth/logout", async (_request, reply) => {
    reply.clearCookie("session", { path: "/" }).clearCookie("csrf", { path: "/" });
    return reply.status(204).send();
  });

  app.get("/api/me", async request => {
    const s = await requireSession(request);
    return db.user.findUniqueOrThrow({
      where: { id: s.sub },
      select: { id: true, email: true, username: true, role: true, discordId: true, createdAt: true, lastLoginAt: true, plan: { select: { name: true } } },
    });
  });

  app.put("/api/me", async (request, reply) => {
    const s = await requireSession(request);
    const input = z.object({
      username: z.string().regex(/^[a-zA-Z0-9_-]{3,32}$/).optional(),
      email: z.string().email().optional(),
    }).parse(request.body);

    if (input.username) {
      const existing = await db.user.findFirst({ where: { username: input.username, NOT: { id: s.sub } } });
      if (existing) return reply.status(409).send({ error: "Username already taken" });
    }
    if (input.email) {
      const existing = await db.user.findFirst({ where: { email: input.email, NOT: { id: s.sub } } });
      if (existing) return reply.status(409).send({ error: "Email already taken" });
    }

    const user = await db.user.update({ where: { id: s.sub }, data: input, select: { id: true, email: true, username: true, role: true } });
    await audit(s.sub, "user.profile_updated", s.sub, "success", request.ip);
    return user;
  });

  app.put("/api/me/password", async (request, reply) => {
    const s = await requireSession(request);
    const input = z.object({ currentPassword: z.string().min(12), newPassword: z.string().min(12).max(256) }).parse(request.body);

    const user = await db.user.findUniqueOrThrow({ where: { id: s.sub } });
    if (!user.passwordHash || !(await argon2.verify(user.passwordHash, input.currentPassword)))
      return reply.status(401).send({ error: "Current password is incorrect" });

    await db.user.update({ where: { id: s.sub }, data: { passwordHash: await argon2.hash(input.newPassword, { type: argon2.argon2id }) } });
    await audit(s.sub, "user.password_changed", s.sub, "success", request.ip);
    return { success: true };
  });

  app.post("/api/auth/discord", async (request, reply) => {
    const input = z.object({ code: z.string().min(1) }).parse(request.body);
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = `${process.env.PANEL_URL}/api/auth/discord/callback`;

    if (!clientId || !clientSecret) return reply.status(503).send({ error: "Discord integration not configured" });

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "authorization_code", code: input.code, redirect_uri: redirectUri }),
    });
    if (!tokenRes.ok) return reply.status(401).send({ error: "Discord OAuth failed" });
    const { access_token } = await tokenRes.json() as { access_token: string };

    const userRes = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${access_token}` } });
    if (!userRes.ok) return reply.status(401).send({ error: "Failed to fetch Discord user" });
    const discordUser = await userRes.json() as { id: string; username: string; email?: string; avatar?: string };

    let user = await db.user.findUnique({ where: { discordId: discordUser.id } });
    if (!user) {
      user = await db.user.findFirst({ where: { OR: [{ email: discordUser.email ?? "" }, { username: `discord_${discordUser.username}` }] } });
      if (user) {
        user = await db.user.update({ where: { id: user.id }, data: { discordId: discordUser.id } });
      } else {
        user = await db.user.create({
          data: {
            discordId: discordUser.id,
            email: discordUser.email ?? `${discordUser.id}@discord.local`,
            username: `discord_${discordUser.username}`,
            role: "USER",
          },
        });
      }
    }

    setSession(reply, await signSession({ sub: user.id, role: user.role }));
    await audit(user.id, "auth.discord_login", user.id, "success", request.ip);
    return reply.redirect(`${process.env.PANEL_URL}/`);
  });
}
