import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../lib/db.js";
import { requireSession } from "../auth.js";
import { audit } from "../server.js";

const UI_SCHEMA = z.object({
  theme: z.object({
    mode: z.enum(["dark", "light"]).optional(),
    accentColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    cardColor: z.string().optional(),
    textColor: z.string().optional(),
    borderColor: z.string().optional(),
    fontFamily: z.string().optional(),
  }).optional(),
  sidebar: z.object({
    width: z.number().min(180).max(400).optional(),
    collapsed: z.boolean().optional(),
    position: z.enum(["left", "right"]).optional(),
  }).optional(),
  layout: z.object({
    density: z.enum(["compact", "comfortable", "spacious"]).optional(),
    cardStyle: z.enum(["rounded", "square", "pill"]).optional(),
    showGridLines: z.boolean().optional(),
  }).optional(),
  widgets: z.object({
    showCpuChart: z.boolean().optional(),
    showRamChart: z.boolean().optional(),
    showDiskChart: z.boolean().optional(),
    showNetworkChart: z.boolean().optional(),
    chartPosition: z.enum(["top", "bottom", "side"]).optional(),
  }).optional(),
  navigation: z.object({
    showLabels: z.boolean().optional(),
    showIcons: z.boolean().optional(),
    style: z.enum(["sidebar", "tabs", "minimal"]).optional(),
  }).optional(),
  typography: z.object({
    headingSize: z.enum(["sm", "md", "lg"]).optional(),
    bodySize: z.enum(["sm", "md", "lg"]).optional(),
  }).optional(),
}).strict();

export default async function uiRoutes(app: FastifyInstance) {
  app.get("/api/ui/versions", async request => {
    const s = await requireSession(request);
    return db.uiVersion.findMany({ where: { userId: s.sub }, orderBy: { createdAt: "desc" } });
  });

  app.post("/api/ui/versions", async (request, reply) => {
    const s = await requireSession(request);
    const { config } = z.object({ config: z.unknown() }).parse(request.body);

    const parsed = UI_SCHEMA.safeParse(config);
    if (!parsed.success) return reply.status(400).send({ error: "Invalid UI configuration", details: parsed.error.issues });

    await db.uiVersion.updateMany({ where: { userId: s.sub, active: true }, data: { active: false } });
    const version = await db.uiVersion.create({ data: { userId: s.sub, config: JSON.parse(JSON.stringify(parsed.data)), active: true } });
    await audit(s.sub, "ui.version_created", version.id, "success", request.ip);
    return reply.status(201).send(version);
  });

  app.put("/api/ui/versions/:id/activate", async (request, reply) => {
    const s = await requireSession(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const version = await db.uiVersion.findFirst({ where: { id, userId: s.sub } });
    if (!version) return reply.status(404).send({ error: "UI version not found" });

    await db.uiVersion.updateMany({ where: { userId: s.sub, active: true }, data: { active: false } });
    await db.uiVersion.update({ where: { id }, data: { active: true } });
    await audit(s.sub, "ui.version_activated", id, "success", request.ip);
    return { success: true };
  });

  app.delete("/api/ui/versions/:id", async (request, reply) => {
    const s = await requireSession(request);
    const { id } = z.object({ id: z.string().cuid() }).parse(request.params);
    const version = await db.uiVersion.findFirst({ where: { id, userId: s.sub } });
    if (!version) return reply.status(404).send({ error: "UI version not found" });
    if (version.active) return reply.status(400).send({ error: "Cannot delete active UI version" });

    await db.uiVersion.delete({ where: { id } });
    await audit(s.sub, "ui.version_deleted", id, "success", request.ip);
    return { success: true };
  });

  app.get("/api/ui/active", async request => {
    const s = await requireSession(request);
    const version = await db.uiVersion.findFirst({ where: { userId: s.sub, active: true } });
    return version?.config ?? {};
  });

  app.post("/api/ui/generate", async (request, reply) => {
    const s = await requireSession(request);
    const { prompt } = z.object({ prompt: z.string().min(10).max(2000) }).parse(request.body);
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return reply.status(503).send({ error: "Gemini API not configured" });

    const systemPrompt = `You are a UI configuration generator for a VPS hosting panel. Generate ONLY a JSON configuration object matching the schema. Never generate code, shell commands, or backend modifications. Schema: { theme: { mode, accentColor, backgroundColor, cardColor, textColor, borderColor, fontFamily }, sidebar: { width, collapsed, position }, layout: { density, cardStyle, showGridLines }, widgets: { showCpuChart, showRamChart, showDiskChart, showNetworkChart, chartPosition }, navigation: { showLabels, showIcons, style }, typography: { headingSize, bodySize } }`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\nUser request: ${prompt}` }] }] }),
    });

    if (!res.ok) return reply.status(502).send({ error: "Gemini API request failed" });
    const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return reply.status(422).send({ error: "Could not parse UI configuration from AI response" });

    let config: unknown;
    try { config = JSON.parse(jsonMatch[0]); } catch { return reply.status(422).send({ error: "Invalid JSON in AI response" }); }

    const parsed = UI_SCHEMA.safeParse(config);
    if (!parsed.success) return reply.status(422).send({ error: "AI configuration failed schema validation", details: parsed.error.issues });

    return { config: parsed.data };
  });
}
