import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { requireSession } from "../auth.js";

export default async function notificationRoutes(app: FastifyInstance) {
  app.get("/api/notifications", async request => {
    const s = await requireSession(request);
    return db.notification.findMany({
      where: { userId: s.sub },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  });

  app.get("/api/notifications/unread-count", async request => {
    const s = await requireSession(request);
    const count = await db.notification.count({ where: { userId: s.sub, readAt: null } });
    return { count };
  });

  app.put("/api/notifications/:id/read", async request => {
    const s = await requireSession(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const notification = await db.notification.findFirst({ where: { id, userId: s.sub } });
    if (!notification) return { error: "Notification not found" };
    return db.notification.update({ where: { id }, data: { readAt: new Date() } });
  });

  app.put("/api/notifications/read-all", async request => {
    const s = await requireSession(request);
    await db.notification.updateMany({ where: { userId: s.sub, readAt: null }, data: { readAt: new Date() } });
    return { success: true };
  });

  app.delete("/api/notifications/:id", async request => {
    const s = await requireSession(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    await db.notification.deleteMany({ where: { id, userId: s.sub } });
    return { success: true };
  });

  app.delete("/api/notifications", async request => {
    const s = await requireSession(request);
    await db.notification.deleteMany({ where: { userId: s.sub } });
    return { success: true };
  });
}

export async function createNotification(userId: string, type: string, title: string, body: string) {
  return db.notification.create({ data: { userId, type, title, body } });
}
