import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { requireSession } from "../auth.js";
import { audit } from "../server.js";

export default async function osImageRoutes(app: FastifyInstance) {
  app.get("/api/os-images", async request => {
    const s = await requireSession(request);
    return db.osImage.findMany({ orderBy: { name: "asc" } });
  });

  app.get("/api/os-images/:id", async request => {
    const s = await requireSession(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    return db.osImage.findUniqueOrThrow({ where: { id } });
  });

  app.post("/api/os-images", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "images.manage permission required" });
    const input = z.object({
      name: z.string().min(3).max(64),
      distribution: z.string().regex(/^[a-z0-9-]+$/i),
      release: z.string().regex(/^[a-z0-9._-]+$/i),
      architecture: z.enum(["amd64", "arm64"]).default("amd64"),
      imageAlias: z.string().regex(/^[a-z0-9:._/-]{1,128}$/i),
      enabled: z.boolean().default(true),
    }).parse(request.body);

    const existing = await db.osImage.findFirst({ where: { OR: [{ name: input.name }, { imageAlias: input.imageAlias }] } });
    if (existing) return reply.status(409).send({ error: "Image name or alias already exists" });

    const image = await db.osImage.create({ data: input });
    await audit(s.sub, "os-image.created", image.id, "success", request.ip);
    return reply.status(201).send(image);
  });

  app.put("/api/os-images/:id", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "images.manage permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const input = z.object({
      name: z.string().min(3).max(64).optional(),
      distribution: z.string().regex(/^[a-z0-9-]+$/i).optional(),
      release: z.string().regex(/^[a-z0-9._-]+$/i).optional(),
      architecture: z.enum(["amd64", "arm64"]).optional(),
      imageAlias: z.string().regex(/^[a-z0-9:._/-]{1,128}$/i).optional(),
      enabled: z.boolean().optional(),
    }).parse(request.body);

    const image = await db.osImage.update({ where: { id }, data: input });
    await audit(s.sub, "os-image.updated", id, "success", request.ip);
    return image;
  });

  app.delete("/api/os-images/:id", async (request, reply) => {
    const s = await requireSession(request);
    if (s.role !== "SUPER_ADMIN") return reply.status(403).send({ error: "super-admin permission required" });
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const vpsCount = await db.vps.count({ where: { osImageId: id } });
    if (vpsCount > 0) return reply.status(409).send({ error: "Image is in use by VPS instances" });
    await db.osImage.delete({ where: { id } });
    await audit(s.sub, "os-image.deleted", id, "success", request.ip);
    return reply.status(204).send();
  });
}
