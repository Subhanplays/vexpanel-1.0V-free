import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { requireSession, hasRole, type Session } from "../auth.js";

const has = (min: Session["role"], s: Session) => hasRole(s.role, min);

export default async function rdpRoutes(app: FastifyInstance) {
  app.get("/api/vps/:id/rdp", async request => {
    const s = await requireSession(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const vps = await db.vps.findUnique({ where: { id } });
    if (!vps) return { error: "VPS not found" };
    if (vps.userId !== s.sub && !has("SUPPORT", s)) return { error: "Access denied" };
    const rdp = await db.rdpAccess.findUnique({ where: { vpsId: id } });
    if (!rdp) return { enabled: false, status: "DISABLED" };
    return { enabled: rdp.enabled, provider: rdp.provider, status: rdp.status, host: rdp.host, port: rdp.port, username: rdp.username };
  });

  app.get("/api/rdp/status", async request => {
    const s = await requireSession(request);
    if (!has("SUPPORT", s)) return { error: "Support permission required" };
    const rdpAccesses = await db.rdpAccess.findMany({ where: { enabled: true }, include: { vps: { select: { id: true, name: true, userId: true } } } });
    return rdpAccesses;
  });
}
