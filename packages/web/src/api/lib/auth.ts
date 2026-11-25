import { ORPCError } from "@orpc/server";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function newId(): string {
  return randomUUID();
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await db.insert(schema.sessions).values({ token, userId, createdAt: Date.now() });
  return token;
}

function bearer(headers: Headers): string | null {
  const h = headers.get("authorization");
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

export async function getUserFromHeaders(headers: Headers) {
  const token = bearer(headers);
  if (!token) return null;
  const rows = await db
    .select({ user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(eq(schema.sessions.token, token))
    .limit(1);
  return rows[0]?.user ?? null;
}

/** Requires a valid session. Adds `user` to the context. */
export const authed = base.use(async ({ context, next }) => {
  const user = await getUserFromHeaders(context.headers);
  if (!user) throw new ORPCError("UNAUTHORIZED", { message: "Əvvəlcə daxil olmalısınız." });
  return next({ context: { user } });
});

export function publicUser(u: typeof schema.users.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    university: u.university,
    specialization: u.specialization,
    rix: u.rix,
    xp: u.xp,
    wins: u.wins,
    losses: u.losses,
    createdAt: u.createdAt,
  };
}
