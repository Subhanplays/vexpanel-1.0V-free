import { createHash, randomBytes } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
export type Session = { sub: string; role: "USER" | "SUPPORT" | "NODE_MANAGER" | "ADMIN" | "SUPER_ADMIN" };
export const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");
export const csrfToken = () => randomBytes(24).toString("base64url");

export async function signSession(session: Session) {
  return new SignJWT({ role: session.role }).setProtectedHeader({ alg: "HS256" }).setSubject(session.sub).setIssuedAt().setExpirationTime("8h").sign(secret);
}
export async function requireSession(request: FastifyRequest): Promise<Session> {
  const token = request.cookies.session;
  if (!token) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
  const { payload } = await jwtVerify(token, secret);
  if (!payload.sub || typeof payload.role !== "string") throw Object.assign(new Error("Invalid session"), { statusCode: 401 });
  return { sub: payload.sub, role: payload.role as Session["role"] };
}
export function enforceCsrf(request: FastifyRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const path = request.url.split("?")[0];
  if (path === "/api/auth/bootstrap" || path === "/api/auth/login" || path === "/api/auth/register" || path === "/api/auth/discord") return;
  if (!request.cookies.session || request.headers["x-csrf-token"] !== request.cookies.csrf) throw Object.assign(new Error("CSRF validation failed"), { statusCode: 403 });
}
export function setSession(reply: FastifyReply, session: string) {
  const secure = process.env.NODE_ENV === "production";
  reply.setCookie("session", session, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 28_800 });
  reply.setCookie("csrf", csrfToken(), { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: 28_800 });
}
export const hasRole = (actual: Session["role"], minimum: Session["role"]) => ["USER", "SUPPORT", "NODE_MANAGER", "ADMIN", "SUPER_ADMIN"].indexOf(actual) >= ["USER", "SUPPORT", "NODE_MANAGER", "ADMIN", "SUPER_ADMIN"].indexOf(minimum);
