import type { FastifyInstance } from "fastify";
import { db } from "../lib/db.js";
import { requireSession, hasRole, type Session } from "../auth.js";

const has = (min: Session["role"], s: Session) => hasRole(s.role, min);

export default async function dashboardRoutes(app: FastifyInstance) {
  app.get("/api/dashboard", async request => {
    const s = await requireSession(request);
    const scope = (request.query as { scope?: string }).scope;
    const adminScope = scope === "admin" && has("ADMIN", s);
    const where = adminScope ? {} : { userId: s.sub };
    const [total, running, stopped, suspended, provisioning, tasks, nodesOnline, nodesTotal, ipsAvailable, ipsTotal, expiringSoon, usersTotal] = await Promise.all([
      db.vps.count({ where }),
      db.vps.count({ where: { ...where, status: "RUNNING" } }),
      db.vps.count({ where: { ...where, status: "STOPPED" } }),
      db.vps.count({ where: { ...where, status: "SUSPENDED" } }),
      db.vps.count({ where: { ...where, status: "PROVISIONING" } }),
      db.task.count({ where: adminScope ? { status: { in: ["QUEUED", "RUNNING"] } } : { vps: { userId: s.sub }, status: { in: ["QUEUED", "RUNNING"] } } }),
      adminScope ? db.node.count({ where: { status: "ONLINE" } }) : Promise.resolve(undefined),
      adminScope ? db.node.count() : Promise.resolve(undefined),
      adminScope ? db.ipAddress.count({ where: { status: "AVAILABLE" } }) : Promise.resolve(undefined),
      adminScope ? db.ipAddress.count() : Promise.resolve(undefined),
      adminScope ? db.vps.count({ where: { expiresAt: { not: null, lte: new Date(Date.now() + 7 * 86400000) }, status: { notIn: ["DELETED"] } } }) : Promise.resolve(undefined),
      adminScope ? db.user.count() : Promise.resolve(undefined),
    ]);

    return {
      total, running, stopped, suspended, provisioning, tasks,
      nodesOnline, nodesTotal, ipsAvailable, ipsTotal,
      expiringSoon, usersTotal,
    };
  });

  app.get("/api/dashboard/recent", async request => {
    const s = await requireSession(request);
    const scope = (request.query as { scope?: string }).scope;
    const adminScope = scope === "admin" && has("ADMIN", s);
    const [recentTasks, recentAudit] = await Promise.all([
      db.task.findMany({
        where: adminScope ? {} : { vps: { userId: s.sub } },
        include: { vps: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      adminScope ? db.auditLog.findMany({ include: { actor: { select: { username: true } } }, orderBy: { createdAt: "desc" }, take: 10 }) : Promise.resolve([]),
    ]);

    return { recentTasks, recentAudit };
  });
}
