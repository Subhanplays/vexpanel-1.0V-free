import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { PrismaClient } from "@prisma/client";

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });
const db = new PrismaClient();

/** Workers coordinate jobs only. The agent, authenticated over a private channel,
 * performs LXD actions and returns verification before the task can complete. */
const worker = new Worker("vexpanel", async job => {
  const { type, vpsId } = job.data;
  console.log(`[worker] processing job ${job.id} type=${type} vps=${vpsId}`);

  if (type === "vps.delete" && vpsId) {
    await db.vps.update({ where: { id: vpsId }, data: { status: "DELETING" } }).catch(() => {});
  }
}, {
  connection,
  concurrency: 4,
  limiter: { max: 10, duration: 1000 },
});

worker.on("failed", (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err.message);
});

worker.on("completed", job => {
  console.log(`[worker] job ${job.id} completed`);
});

/** Expiration processor - runs every minute */
async function processExpirations() {
  const now = new Date();
  const expiringSoon = new Date(now.getTime() + 7 * 86400000);

  const expiredVps = await db.vps.findMany({
    where: { expiresAt: { lte: now }, status: { notIn: ["DELETED", "DELETING", "SUSPENDED"] } },
    include: { user: { select: { id: true, username: true } }, node: { select: { name: true } } },
  });

  for (const vps of expiredVps) {
    try {
      await db.task.create({
        data: {
          type: "vps.stop",
          vpsId: vps.id,
          payload: { vpsId: vps.id, nodeId: vps.nodeId, lxdName: vps.lxdName, reason: "expired" },
        },
      });

      await db.vps.update({ where: { id: vps.id }, data: { status: "SUSPENDED" } });

      await db.notification.create({
        data: {
          userId: vps.userId,
          type: "vps.expired",
          title: "VPS Expired",
          body: `Your VPS "${vps.name}" has expired and has been suspended.`,
        },
      });
    } catch (error) {
      console.error(`[expiration] failed to process VPS ${vps.id}:`, error);
    }
  }

  const expiringVps = await db.vps.findMany({
    where: { expiresAt: { gte: now, lte: expiringSoon }, status: { notIn: ["DELETED", "DELETING"] } },
  });

  for (const vps of expiringVps) {
    const existingNotification = await db.notification.findFirst({
      where: { userId: vps.userId, type: "vps.expiring", createdAt: { gte: new Date(now.getTime() - 86400000) } },
    });

    if (!existingNotification) {
      const daysUntil = Math.ceil((vps.expiresAt!.getTime() - now.getTime()) / 86400000);
      await db.notification.create({
        data: {
          userId: vps.userId,
          type: "vps.expiring",
          title: "VPS Expiring Soon",
          body: `Your VPS "${vps.name}" will expire in ${daysUntil} day(s).`,
        },
      });
    }
  }
}

/** Backup scheduler - runs every hour */
async function processScheduledBackups() {
  const settings = await db.setting.findUnique({ where: { key: "backup.schedule" } });
  if (!settings?.value) return;

  const schedule = settings.value as { frequency?: string };
  if (!schedule.frequency) return;

  const vpses = await db.vps.findMany({
    where: { status: "RUNNING", plan: { backups: true } },
  });

  for (const vps of vpses) {
    const existingBackup = await db.backup.findFirst({
      where: { vpsId: vps.id, createdAt: { gte: new Date(Date.now() - 86400000) } },
    });

    if (!existingBackup) {
      const name = `scheduled-${new Date().toISOString().slice(0, 10)}`;
      const backup = await db.backup.create({ data: { name, vpsId: vps.id } });
      await db.task.create({
        data: {
          type: "backup.create",
          vpsId: vps.id,
          payload: { vpsId: vps.id, nodeId: vps.nodeId, lxdName: vps.lxdName, backupId: backup.id },
        },
      });
    }
  }
}

setInterval(() => {
  processExpirations().catch(err => console.error("[expiration] error:", err));
  processScheduledBackups().catch(err => console.error("[backup-scheduler] error:", err));
}, 60_000);

processExpirations().catch(err => console.error("[expiration] initial error:", err));
processScheduledBackups().catch(err => console.error("[backup-scheduler] initial error:", err));

console.log("[worker] started with expiration processor and backup scheduler");
