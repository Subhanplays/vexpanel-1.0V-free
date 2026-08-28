import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { db, shutdown } from "./lib/db.js";
import { enforceCsrf } from "./auth.js";

export const audit = (actorId: string, action: string, target: string, result: string, ip: string) =>
  db.auditLog.create({ data: { actorId, action, target, result, ip } }).catch(() => {});

const app = Fastify({ logger: true, trustProxy: process.env.TRUST_PROXY === "true" });

await app.register(cookie, { secret: process.env.COOKIE_SECRET });
await app.register(cors, { origin: process.env.PANEL_URL, credentials: true });
await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
app.addHook("onRequest", async request => enforceCsrf(request));
app.setErrorHandler((error, _request, reply) => {
  const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
  return reply.status(statusCode).send({ error: error instanceof Error ? error.message : "Internal server error" });
});

app.get("/", async (_request, reply) => reply.type("text/html").send(await readFile(resolve(process.cwd(), "apps/web/index.html"), "utf8")));
app.get("/health", async () => ({ status: "ok", service: "vexpanel-api" }));

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import vpsRoutes from "./routes/vps.js";
import nodeRoutes from "./routes/nodes.js";
import ipv4Routes from "./routes/ipv4.js";
import planRoutes from "./routes/plans.js";
import osImageRoutes from "./routes/os-images.js";
import notificationRoutes from "./routes/notifications.js";
import snapshotRoutes from "./routes/snapshots.js";
import backupRoutes from "./routes/backups.js";
import taskRoutes from "./routes/tasks.js";
import settingRoutes from "./routes/settings.js";
import rdpRoutes from "./routes/rdp.js";
import agentRoutes from "./routes/agent.js";
import dashboardRoutes from "./routes/dashboard.js";
import uiRoutes from "./routes/ui.js";
import auditRoutes from "./routes/audit.js";

await app.register(authRoutes);
await app.register(userRoutes);
await app.register(vpsRoutes);
await app.register(nodeRoutes);
await app.register(ipv4Routes);
await app.register(planRoutes);
await app.register(osImageRoutes);
await app.register(notificationRoutes);
await app.register(snapshotRoutes);
await app.register(backupRoutes);
await app.register(taskRoutes);
await app.register(settingRoutes);
await app.register(rdpRoutes);
await app.register(agentRoutes);
await app.register(dashboardRoutes);
await app.register(uiRoutes);
await app.register(auditRoutes);

const signals = ["SIGTERM", "SIGINT"];
for (const signal of signals) {
  process.on(signal, async () => {
    app.log.info(`Received ${signal}, shutting down gracefully`);
    await app.close();
    await shutdown();
    process.exit(0);
  });
}

await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3000) });
