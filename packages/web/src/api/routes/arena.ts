import { z } from "zod";
import { count, countDistinct, desc, eq, sql } from "drizzle-orm";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { authed, newId } from "../lib/auth";

export const CATEGORIES = [
  "Fəlsəfə və Əxlaq",
  "Psixologiya və Davranış",
  "Elm və Gələcək",
  "Biologiya və Təkamül",
  "Tanrı, Din və Ruhaniyyət",
] as const;

export const arena = {
  stats: base.handler(async () => {
    const [registered] = await db.select({ n: count() }).from(schema.users);
    const [live] = await db
      .select({ n: count() })
      .from(schema.debates)
      .where(eq(schema.debates.status, "live"));
    const [completed] = await db
      .select({ n: count() })
      .from(schema.debates)
      .where(eq(schema.debates.status, "completed"));
    const [universities] = await db
      .select({ n: countDistinct(schema.users.university) })
      .from(schema.users);
    return {
      registered: registered?.n ?? 0,
      live: live?.n ?? 0,
      completed: completed?.n ?? 0,
      universities: universities?.n ?? 0,
    };
  }),

  categories: base.handler(() => [...CATEGORIES]),

  topics: base
    .input(z.object({ q: z.string().optional(), category: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      const rows = await db
        .select()
        .from(schema.topics)
        .orderBy(desc(schema.topics.createdAt));
      const q = input?.q?.trim().toLocaleLowerCase("az") ?? "";
      const cat = input?.category && input.category !== "Hamısı" ? input.category : null;
      const filtered = rows.filter(
        (t) =>
          (!cat || t.category === cat) &&
          (!q || t.title.toLocaleLowerCase("az").includes(q)),
      );
      const counts = await db
        .select({
          topicId: schema.debates.topicId,
          total: count(),
          live: sql<number>`sum(case when ${schema.debates.status} = 'live' then 1 else 0 end)`,
        })
        .from(schema.debates)
        .groupBy(schema.debates.topicId);
      const byTopic = new Map(counts.map((c) => [c.topicId, c]));
      return filtered.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        description: t.description,
        debateCount: byTopic.get(t.id)?.total ?? 0,
        liveCount: Number(byTopic.get(t.id)?.live ?? 0),
        createdAt: t.createdAt,
      }));
    }),

  createTopic: authed
    .input(
      z.object({
        title: z.string().trim().min(5, "Mövzu ən azı 5 simvol olmalıdır").max(200),
        category: z.enum(CATEGORIES),
        description: z.string().trim().max(500).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const id = newId();
      await db.insert(schema.topics).values({
        id,
        title: input.title,
        category: input.category,
        description: input.description ?? "",
        createdById: context.user.id,
        createdAt: Date.now(),
      });
      return { id };
    }),

  randomTopic: base.handler(async () => {
    const rows = await db.select({ id: schema.topics.id, title: schema.topics.title }).from(schema.topics);
    if (!rows.length) return null;
    return rows[Math.floor(Math.random() * rows.length)];
  }),
};
