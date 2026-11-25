import { z } from "zod";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { authed, getUserFromHeaders, newId } from "../lib/auth";
import { ask, parseJson } from "../lib/ai";
import {
  LOSS_RIX,
  TOTAL_TURNS,
  TURN_MS,
  WIN_RIX,
  roundOf,
  turnSide,
} from "../lib/rank";
import { computeLeague } from "./league";

export const AI_PERSONAS = {
  socrates: {
    name: "Sokrat",
    style: "Sokratik metod: rəqibə suallar verir, fərziyyələri açır, məntiqi ziddiyyətləri göstərir.",
  },
  aristotle: {
    name: "Aristotel",
    style: "Sistemli məntiq: silogizmlər, təsnifat və empirik faktlar əsasında qurulmuş arqumentlər.",
  },
  champion: {
    name: "Sərt Debat Çempionu",
    style: "Sərt və sürətli təkzib: rəqibin ən zəif nöqtəsinə birbaşa hücum edir.",
  },
} as const;

type PersonaKey = keyof typeof AI_PERSONAS;
const PERSONA_KEYS = Object.keys(AI_PERSONAS) as [PersonaKey, ...PersonaKey[]];

const REACTION_KINDS = ["guclu_fakt", "mantiq_xetasi", "emosional", "movzudan_yayindi"] as const;

const ROUND_GOALS: Record<number, string> = {
  1: "Raund 1 — Giriş arqumenti: mövqeyini aydın təqdim et və əsas dəlillərini göstər.",
  2: "Raund 2 — Əks-hücum və təkzib: rəqibin son arqumentini təhlil et, zəif nöqtələrini göstər.",
  3: "Raund 3 — Yekun söz: mövqeyini yekunlaşdır və verilmiş tamaşaçı sualına cavab ver.",
};

/** Debates currently being advanced. Prevents two requests from moving the same debate twice. */
const locks = new Set<string>();

/** Last AI failure per debate. The turn stays open and is retried on the next poll. */
const aiStalls = new Map<string, string>();

type DebateRow = typeof schema.debates.$inferSelect;
type ArgRow = typeof schema.debateArguments.$inferSelect;

async function loadDebate(id: string): Promise<DebateRow | null> {
  const [d] = await db.select().from(schema.debates).where(eq(schema.debates.id, id)).limit(1);
  return d ?? null;
}

async function userNames(ids: string[]): Promise<Map<string, string>> {
  const clean = ids.filter(Boolean);
  if (!clean.length) return new Map();
  const rows = await db
    .select({ id: schema.users.id, name: schema.users.name })
    .from(schema.users)
    .where(inArray(schema.users.id, clean));
  return new Map(rows.map((r) => [r.id, r.name]));
}

function controllerOf(d: DebateRow, side: "pro" | "con") {
  return side === "pro"
    ? { human: d.proUserId, ai: d.proAi }
    : { human: d.conUserId, ai: d.conAi };
}

async function insertArgument(
  d: DebateRow,
  content: string,
  timedOut: boolean,
  author: { userId?: string | null; ai?: string | null },
) {
  const side = turnSide(d.turnIndex);
  await db.insert(schema.debateArguments).values({
    id: newId(),
    debateId: d.id,
    turnIndex: d.turnIndex,
    side,
    round: roundOf(d.turnIndex),
    authorUserId: author.userId ?? null,
    authorAi: author.ai ?? null,
    content,
    timedOut: timedOut ? 1 : 0,
    createdAt: Date.now(),
  });
}

async function topQuestion(debateId: string): Promise<string | null> {
  const questions = await db
    .select()
    .from(schema.debateQuestions)
    .where(eq(schema.debateQuestions.debateId, debateId))
    .orderBy(asc(schema.debateQuestions.createdAt));
  if (!questions.length) return null;
  const votes = await db
    .select({ questionId: schema.questionVotes.questionId })
    .from(schema.questionVotes)
    .where(inArray(schema.questionVotes.questionId, questions.map((q) => q.id)));
  const count = new Map<string, number>();
  for (const v of votes) count.set(v.questionId, (count.get(v.questionId) ?? 0) + 1);
  const best = [...questions].sort((a, b) => (count.get(b.id) ?? 0) - (count.get(a.id) ?? 0))[0];
  return best.content;
}

async function aiArgument(d: DebateRow, side: "pro" | "con"): Promise<string> {
  const key = (side === "pro" ? d.proAi : d.conAi) as PersonaKey;
  const persona = AI_PERSONAS[key] ?? AI_PERSONAS.aristotle;
  const round = roundOf(d.turnIndex);
  const args = await db
    .select()
    .from(schema.debateArguments)
    .where(eq(schema.debateArguments.debateId, d.id))
    .orderBy(asc(schema.debateArguments.turnIndex));
  const history = args
    .filter((a) => a.content.trim())
    .map((a) => `${a.side === "pro" ? "RAZISAN (PRO)" : "RAZI DEYİLSƏN (CON)"} · Raund ${a.round}:\n${a.content}`)
    .join("\n\n");
  const question = round === 3 ? await topQuestion(d.id) : null;

  const system = [
    `Sən DEBATRİX platformasında AI debatçısan. Adın: ${persona.name}. Üslub: ${persona.style}`,
    `Sən ${side === "pro" ? "RAZISAN (PRO)" : "RAZI DEYİLSƏN (CON)"} tərəfini müdafiə edirsən.`,
    `Mövzu: "${d.title}".`,
    d.devilsAdvocate ? "Şeytanın vəkili rejimi: ən güclü və ən sərt əks-arqumentləri ver." : "",
    ROUND_GOALS[round],
    "Yalnız səlis, təbii Azərbaycan dilində yaz. 80–250 söz. Rol adı, başlıq və ya giriş cümləsi (məsələn 'Əlbəttə') yazma, birbaşa arqumentə başla.",
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = [
    history ? `Debatın indiyə qədərki gedişi:\n\n${history}` : "Bu, debatın ilk arqumentidir.",
    question ? `Tamaşaçı sualı (ən çox səs toplayıb): "${question}". Yekun sözündə bu suala cavab ver.` : "",
    "İndi növbəti arqumentini yaz.",
  ]
    .filter(Boolean)
    .join("\n\n");

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await ask(system, prompt);
      if (text.length > 0) return text;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError ?? new Error("AI boş cavab verdi");
}

type Scores = { logic: number; facts: number; persuasion: number; politeness: number };
type Judge = {
  pro: Scores;
  con: Scores;
  fallacies: { side: "pro" | "con"; type: string; quote: string; explanation: string }[];
  summary: string;
};

function avgScores(s: Scores) {
  return Math.round((s.logic + s.facts + s.persuasion + s.politeness) / 4);
}

function clamp(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 50;
  return Math.max(0, Math.min(100, Math.round(v)));
}

async function judge(d: DebateRow, args: ArgRow[]): Promise<{ result: Judge; source: "ai" | "heuristic" }> {
  const transcript = args
    .map((a) => {
      const who = a.authorAi ? `AI (${AI_PERSONAS[a.authorAi as PersonaKey]?.name ?? a.authorAi})` : a.authorUserId ? "İstifadəçi" : "Vaxt bitdi";
      return `[${a.side === "pro" ? "PRO" : "CON"} · Raund ${a.round} · ${who}]\n${a.content || "(boş — növbə itirildi)"}`;
    })
    .join("\n\n");
  try {
    const raw = await ask(
      [
        "Sən DEBATRİX AI Hakimisən. Debatı obyektiv qiymətləndir.",
        "Hər tərəf üçün 0–100 arasında bal ver: logic (Məntiqi ardıcıllıq), facts (Faktlara əsaslanma), persuasion (İnandırıcılıq), politeness (Nəzakətli üslub).",
        "Məntiqi səhvləri (fallacies) tap: type Azərbaycan dilində (məsələn 'Adam hücumu'), quote orijinal mətndən qısa sitat, explanation Azərbaycanca izahat.",
        "summary: Azərbaycan dilində 2–3 cümləlik qərar.",
        'YALNIZ bu JSON formatında cavab ver: {"pro":{"logic":0,"facts":0,"persuasion":0,"politeness":0},"con":{...},"fallacies":[{"side":"pro","type":"","quote":"","explanation":""}],"summary":""}',
      ].join("\n"),
      `Mövzu: "${d.title}"\n\n${transcript}`,
      60_000,
    );
    const parsed = parseJson<Judge>(raw);
    const norm = (s: Partial<Scores> | undefined): Scores => ({
      logic: clamp(s?.logic),
      facts: clamp(s?.facts),
      persuasion: clamp(s?.persuasion),
      politeness: clamp(s?.politeness),
    });
    return {
      source: "ai",
      result: {
        pro: norm(parsed.pro),
        con: norm(parsed.con),
        fallacies: Array.isArray(parsed.fallacies) ? parsed.fallacies.slice(0, 12) : [],
        summary: String(parsed.summary ?? ""),
      },
    };
  } catch {
    // Heuristic fallback so a verdict is always produced.
    const words = (side: "pro" | "con") =>
      args.filter((a) => a.side === side).reduce((s, a) => s + a.content.split(/\s+/).filter(Boolean).length, 0);
    const score = (w: number) => clamp(40 + Math.min(45, w / 8));
    const pro = { logic: score(words("pro")), facts: score(words("pro")), persuasion: score(words("pro")), politeness: 70 };
    const con = { logic: score(words("con")), facts: score(words("con")), persuasion: score(words("con")), politeness: 70 };
    return {
      source: "heuristic",
      result: {
        pro,
        con,
        fallacies: [],
        summary: "AI Hakim bu dəfə qiymətləndirmə apara bilmədi. Bal arqumentlərin həcminə əsasən hesablandı.",
      },
    };
  }
}

/** Runs the verdict: AI judge + audience Mind-Shift (50/50), RIX and XP updates. */
async function finalize(d: DebateRow) {
  const args = await db
    .select()
    .from(schema.debateArguments)
    .where(eq(schema.debateArguments.debateId, d.id))
    .orderBy(asc(schema.debateArguments.turnIndex));
  const votes = await db.select().from(schema.debateVotes).where(eq(schema.debateVotes.debateId, d.id));
  const votesPro = votes.filter((v) => v.side === "pro").length;
  const votesCon = votes.length - votesPro;
  const mindShiftPro = votes.length ? Math.round((votesPro / votes.length) * 100) : 50;

  const { result, source } = await judge(d, args);
  const aiPro = avgScores(result.pro);
  const aiCon = avgScores(result.con);
  const finalPro = Math.round(0.5 * aiPro + 0.5 * mindShiftPro);
  const finalCon = Math.round(0.5 * aiCon + 0.5 * (100 - mindShiftPro));
  const winner = finalPro > finalCon ? "pro" : finalCon > finalPro ? "con" : null;

  const verdict = {
    judgeSource: source,
    ai: result,
    aiPro,
    aiCon,
    votesPro,
    votesCon,
    mindShiftPro,
    finalPro,
    finalCon,
    winner,
  };

  const now = Date.now();
  await db
    .update(schema.debates)
    .set({
      status: "completed",
      turnIndex: TOTAL_TURNS,
      turnDeadline: null,
      verdict: JSON.stringify(verdict),
      winner,
      completedAt: now,
    })
    .where(eq(schema.debates.id, d.id));

  const humans: { side: "pro" | "con"; userId: string }[] = [];
  if (d.proUserId) humans.push({ side: "pro", userId: d.proUserId });
  if (d.conUserId) humans.push({ side: "con", userId: d.conUserId });
  for (const h of humans) {
    const [u] = await db.select().from(schema.users).where(eq(schema.users.id, h.userId)).limit(1);
    if (!u) continue;
    if (winner === h.side) {
      await db
        .update(schema.users)
        .set({ rix: u.rix + WIN_RIX, wins: u.wins + 1 })
        .where(eq(schema.users.id, u.id));
    } else if (winner) {
      await db
        .update(schema.users)
        .set({ rix: Math.max(0, u.rix - LOSS_RIX), losses: u.losses + 1 })
        .where(eq(schema.users.id, u.id));
    }
  }
  if (winner) {
    for (const v of votes.filter((v) => v.side === winner)) {
      const [u] = await db.select().from(schema.users).where(eq(schema.users.id, v.userId)).limit(1);
      if (u) await db.update(schema.users).set({ xp: u.xp + 10 }).where(eq(schema.users.id, u.id));
    }
  }
}

/** Moves the debate to the next turn or completes it. */
async function advance(d: DebateRow) {
  const next = d.turnIndex + 1;
  if (next >= TOTAL_TURNS) {
    await finalize({ ...d, turnIndex: next });
    return;
  }
  const ctrl = controllerOf(d, turnSide(next));
  await db
    .update(schema.debates)
    .set({ turnIndex: next, turnDeadline: ctrl.human ? Date.now() + TURN_MS : null })
    .where(eq(schema.debates.id, d.id));
}

/** One unit of progress: AI writes its argument, or a human's expired turn is forfeited. */
async function stepOnce(id: string) {
  const d = await loadDebate(id);
  if (!d || d.status !== "live") return;
  const side = turnSide(d.turnIndex);
  const ctrl = controllerOf(d, side);

  if (ctrl.human) {
    if (!d.turnDeadline) {
      await db.update(schema.debates).set({ turnDeadline: Date.now() + TURN_MS }).where(eq(schema.debates.id, id));
      return;
    }
    if (Date.now() > d.turnDeadline) {
      await insertArgument(d, "", true, { userId: ctrl.human });
      await advance(d);
    }
    return;
  }
  if (ctrl.ai) {
    const content = await aiArgument(d, side);
    await insertArgument(d, content, false, { ai: ctrl.ai });
    await advance(d);
  }
}

async function tick(id: string) {
  if (locks.has(id)) return;
  locks.add(id);
  try {
    await stepOnce(id);
    aiStalls.delete(id);
  } catch (e) {
    console.error("[debates] AI turn failed", id, e);
    aiStalls.set(id, "AI hazırda cavab verə bilmir. Növbə saxlanılır və yenidən cəhd olunur.");
  } finally {
    locks.delete(id);
  }
}

async function buildView(id: string, viewerId: string | null) {
  const d = await loadDebate(id);
  if (!d) throw new ORPCError("NOT_FOUND", { message: "Debat tapılmadı." });

  const args = await db
    .select()
    .from(schema.debateArguments)
    .where(eq(schema.debateArguments.debateId, id))
    .orderBy(asc(schema.debateArguments.turnIndex));
  const names = await userNames([d.proUserId ?? "", d.conUserId ?? ""]);
  const authorIds = args.map((a) => a.authorUserId ?? "");
  const authorNames = await userNames(authorIds);

  const votes = await db.select().from(schema.debateVotes).where(eq(schema.debateVotes.debateId, id));
  const reactions = await db.select().from(schema.debateReactions).where(eq(schema.debateReactions.debateId, id));
  const comments = await db
    .select()
    .from(schema.debateComments)
    .where(eq(schema.debateComments.debateId, id))
    .orderBy(desc(schema.debateComments.createdAt))
    .limit(100);
  const questions = await db
    .select()
    .from(schema.debateQuestions)
    .where(eq(schema.debateQuestions.debateId, id))
    .orderBy(asc(schema.debateQuestions.createdAt));
  const qVotes = questions.length
    ? await db
        .select()
        .from(schema.questionVotes)
        .where(inArray(schema.questionVotes.questionId, questions.map((q) => q.id)))
    : [];

  const votesPro = votes.filter((v) => v.side === "pro").length;
  const mindShiftPro = votes.length ? Math.round((votesPro / votes.length) * 100) : 50;
  const reactionCounts: Record<string, number> = Object.fromEntries(REACTION_KINDS.map((k) => [k, 0]));
  for (const r of reactions) reactionCounts[r.kind] = (reactionCounts[r.kind] ?? 0) + 1;

  const qs = questions.map((q) => {
    const upvotes = qVotes.filter((v) => v.questionId === q.id);
    return {
      id: q.id,
      content: q.content,
      authorName: q.authorName,
      upvotes: upvotes.length,
      votedByMe: viewerId ? upvotes.some((v) => v.userId === viewerId) : false,
    };
  });
  const top = [...qs].sort((a, b) => b.upvotes - a.upvotes)[0];

  const myRole: "pro" | "con" | "spectator" | null = !viewerId
    ? null
    : viewerId === d.proUserId
      ? "pro"
      : viewerId === d.conUserId
        ? "con"
        : "spectator";
  const side = d.status === "live" ? turnSide(d.turnIndex) : null;
  const ctrl = side ? controllerOf(d, side) : null;
  const ctrlName = ctrl
    ? ctrl.human
      ? names.get(ctrl.human) ?? null
      : AI_PERSONAS[(ctrl.ai ?? "aristotle") as PersonaKey]?.name ?? null
    : null;

  let verdict: unknown = null;
  if (d.verdict) {
    try {
      verdict = JSON.parse(d.verdict);
    } catch {
      verdict = null;
    }
  }

  const champions = new Set((await computeLeague()).championIds);
  const nameOf = (uid: string | null, ai: string | null) =>
    uid ? names.get(uid) ?? "Naməlum" : ai ? AI_PERSONAS[ai as PersonaKey]?.name ?? "AI" : null;

  return {
    id: d.id,
    title: d.title,
    topicId: d.topicId,
    status: d.status as "waiting" | "live" | "completed",
    devilsAdvocate: !!d.devilsAdvocate,
    rematchOfId: d.rematchOfId,
    createdAt: d.createdAt,
    completedAt: d.completedAt,
    pro: {
      userId: d.proUserId,
      name: nameOf(d.proUserId, d.proAi),
      isAi: !d.proUserId && !!d.proAi,
      champion: !!d.proUserId && champions.has(d.proUserId),
    },
    con: {
      userId: d.conUserId,
      name: nameOf(d.conUserId, d.conAi),
      isAi: !d.conUserId && !!d.conAi,
      champion: !!d.conUserId && champions.has(d.conUserId),
    },
    turnIndex: d.turnIndex,
    totalTurns: TOTAL_TURNS,
    round: Math.min(roundOf(d.turnIndex), 3),
    currentSide: side,
    currentControllerName: ctrlName,
    turnDeadline: d.turnDeadline,
    myRole,
    myVote: votes.find((v) => v.userId === viewerId)?.side ?? null,
    canSubmit: !!viewerId && d.status === "live" && myRole !== null && myRole !== "spectator" && side === myRole,
    invitedForMe: !!viewerId && d.invitedUserId === viewerId,
    arguments: args.map((a) => ({
      id: a.id,
      turnIndex: a.turnIndex,
      side: a.side as "pro" | "con",
      round: a.round,
      authorName: a.authorUserId
        ? authorNames.get(a.authorUserId) ?? "Naməlum"
        : a.authorAi
          ? AI_PERSONAS[a.authorAi as PersonaKey]?.name ?? "AI"
          : "Vaxt bitdi",
      isAi: !!a.authorAi,
      content: a.content,
      timedOut: !!a.timedOut,
      createdAt: a.createdAt,
    })),
    aiStalled: aiStalls.get(d.id) ?? null,
    mindShift: { pro: mindShiftPro, con: 100 - mindShiftPro, total: votes.length },
    reactions: reactionCounts,
    comments: comments.map((c) => ({ id: c.id, authorName: c.authorName, content: c.content, createdAt: c.createdAt })),
    questions: qs,
    topQuestion: top && top.upvotes > 0 ? top : null,
    verdict,
  };
}

const sideInput = z.enum(["pro", "con"]);

export const debates = {
  /** Live and recent debates. Also nudges live debates forward in the background. */
  list: base
    .input(z.object({ status: z.enum(["live", "completed", "waiting"]) }))
    .handler(async ({ input }) => {
      const rows = await db
        .select()
        .from(schema.debates)
        .where(eq(schema.debates.status, input.status))
        .orderBy(desc(schema.debates.createdAt))
        .limit(50);
      if (input.status === "live") for (const r of rows) void tick(r.id).catch(() => {});
      const names = await userNames(rows.flatMap((r) => [r.proUserId ?? "", r.conUserId ?? ""]));
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        proName: r.proUserId ? names.get(r.proUserId) ?? "" : r.proAi ? AI_PERSONAS[r.proAi as PersonaKey]?.name ?? "AI" : null,
        conName: r.conUserId ? names.get(r.conUserId) ?? "" : r.conAi ? AI_PERSONAS[r.conAi as PersonaKey]?.name ?? "AI" : null,
        turnIndex: r.turnIndex,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
        winner: r.winner,
      }));
    }),

  /** Full debate view. Advances AI turns and expired human turns as a side effect. */
  get: base.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const viewer = await getUserFromHeaders(context.headers);
    void tick(input.id).catch(() => {});
    return buildView(input.id, viewer?.id ?? null);
  }),

  myInvites: authed.handler(async ({ context }) => {
    const rows = await db
      .select({ id: schema.debates.id, title: schema.debates.title, createdAt: schema.debates.createdAt })
      .from(schema.debates)
      .where(and(eq(schema.debates.invitedUserId, context.user.id), eq(schema.debates.status, "waiting")))
      .orderBy(desc(schema.debates.createdAt));
    return rows;
  }),

  create: authed
    .input(
      z.object({
        topicId: z.string(),
        side: sideInput,
        mode: z.enum(["ai", "invite"]),
        aiPersona: z.enum(PERSONA_KEYS).optional(),
        devilsAdvocate: z.boolean().default(false),
      }),
    )
    .handler(async ({ input, context }) => {
      const [topic] = await db
        .select()
        .from(schema.topics)
        .where(eq(schema.topics.id, input.topicId))
        .limit(1);
      if (!topic) throw new ORPCError("NOT_FOUND", { message: "Mövzu tapılmadı." });
      if (input.mode === "ai" && !input.aiPersona) {
        throw new ORPCError("BAD_REQUEST", { message: "AI rəqib seçin." });
      }
      const id = newId();
      const uid = context.user.id;
      const base = {
        id,
        topicId: topic.id,
        title: topic.title,
        devilsAdvocate: input.devilsAdvocate ? 1 : 0,
        turnIndex: 0,
        verdict: null,
        winner: null,
        createdById: uid,
        createdAt: Date.now(),
        completedAt: null,
        rematchOfId: null,
        invitedUserId: null,
      };

      if (input.mode === "invite") {
        await db.insert(schema.debates).values({
          ...base,
          status: "waiting",
          proUserId: input.side === "pro" ? uid : null,
          conUserId: input.side === "con" ? uid : null,
          proAi: null,
          conAi: null,
          turnDeadline: null,
        });
        return { id };
      }

      const persona = input.aiPersona!;
      const humanIsPro = input.side === "pro";
      await db.insert(schema.debates).values({
        ...base,
        status: "live",
        proUserId: humanIsPro ? uid : null,
        conUserId: humanIsPro ? null : uid,
        proAi: humanIsPro ? null : persona,
        conAi: humanIsPro ? persona : null,
        turnDeadline: humanIsPro ? Date.now() + TURN_MS : null,
      });
      void tick(id).catch(() => {});
      return { id };
    }),

  /** Second human joins an invite-link debate; it goes live. */
  join: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const uid = context.user.id;
    const d = await loadDebate(input.id);
    if (!d) throw new ORPCError("NOT_FOUND", { message: "Debat tapılmadı." });
    if (d.proUserId === uid || d.conUserId === uid) return { id: d.id };
    if (d.status !== "waiting") throw new ORPCError("CONFLICT", { message: "Bu debat artıq başlayıb." });
    if (d.invitedUserId && d.invitedUserId !== uid) {
      throw new ORPCError("FORBIDDEN", { message: "Bu dəvət sizə aid deyil." });
    }
    const fillPro = !d.proUserId;
    const values = fillPro ? { proUserId: uid } : { conUserId: uid };
    const newDebate = { ...d, ...values };
    const ctrl = controllerOf(newDebate, "pro");
    await db
      .update(schema.debates)
      .set({
        ...values,
        status: "live",
        turnIndex: 0,
        invitedUserId: null,
        turnDeadline: ctrl.human ? Date.now() + TURN_MS : null,
      })
      .where(eq(schema.debates.id, d.id));
    return { id: d.id };
  }),

  /** Debater submits an argument for the current turn. */
  submit: authed
    .input(z.object({ id: z.string(), content: z.string().max(100_000) }))
    .handler(async ({ input, context }) => {
      const uid = context.user.id;
      if (locks.has(input.id)) throw new ORPCError("CONFLICT", { message: "Yenidən cəhd edin." });
      locks.add(input.id);
      try {
        const d = await loadDebate(input.id);
        if (!d || d.status !== "live") throw new ORPCError("BAD_REQUEST", { message: "Debat aktiv deyil." });
        const side = turnSide(d.turnIndex);
        const ctrl = controllerOf(d, side);
        if (ctrl.human !== uid) throw new ORPCError("FORBIDDEN", { message: "Bu turda növbə sizdə deyil." });
        if (d.turnDeadline && Date.now() > d.turnDeadline) {
          await insertArgument(d, "", true, { userId: uid });
          await advance(d);
          throw new ORPCError("CONFLICT", { message: "Vaxt bitdi. Bu növbə itirildi." });
        }
        const content = input.content.trim();
        if (!content) throw new ORPCError("BAD_REQUEST", { message: "Arqument boş ola bilməz." });
        await insertArgument(d, content, false, { userId: uid });
        await advance(d);
        return { ok: true };
      } finally {
        locks.delete(input.id);
      }
    }),

  /** Spectator Mind-Shift vote. */
  vote: authed.input(z.object({ id: z.string(), side: sideInput })).handler(async ({ input, context }) => {
    const uid = context.user.id;
    const d = await loadDebate(input.id);
    if (!d) throw new ORPCError("NOT_FOUND", { message: "Debat tapılmadı." });
    if (d.proUserId === uid || d.conUserId === uid) {
      throw new ORPCError("FORBIDDEN", { message: "Debatçılar səs verə bilməz." });
    }
    if (d.status !== "live") throw new ORPCError("BAD_REQUEST", { message: "Səs yalnız canlı debatda verilir." });
    await db
      .delete(schema.debateVotes)
      .where(and(eq(schema.debateVotes.debateId, input.id), eq(schema.debateVotes.userId, uid)));
    await db.insert(schema.debateVotes).values({
      debateId: input.id,
      userId: uid,
      side: input.side,
      createdAt: Date.now(),
    });
    return { ok: true };
  }),

  react: authed
    .input(z.object({ id: z.string(), kind: z.enum(REACTION_KINDS) }))
    .handler(async ({ input, context }) => {
      const d = await loadDebate(input.id);
      if (!d) throw new ORPCError("NOT_FOUND", { message: "Debat tapılmadı." });
      if (d.proUserId === context.user.id || d.conUserId === context.user.id) {
        throw new ORPCError("FORBIDDEN", { message: "Debatçılar reaksiya verə bilməz." });
      }
      await db.insert(schema.debateReactions).values({
        id: newId(),
        debateId: input.id,
        userId: context.user.id,
        kind: input.kind,
        createdAt: Date.now(),
      });
      return { ok: true };
    }),

  comment: authed
    .input(z.object({ id: z.string(), content: z.string().trim().min(1).max(500) }))
    .handler(async ({ input, context }) => {
      const d = await loadDebate(input.id);
      if (!d) throw new ORPCError("NOT_FOUND", { message: "Debat tapılmadı." });
      if (d.proUserId === context.user.id || d.conUserId === context.user.id) {
        throw new ORPCError("FORBIDDEN", { message: "Debatçılar şərh yaza bilməz." });
      }
      await db.insert(schema.debateComments).values({
        id: newId(),
        debateId: input.id,
        userId: context.user.id,
        authorName: context.user.name,
        content: input.content,
        createdAt: Date.now(),
      });
      return { ok: true };
    }),

  question: authed
    .input(z.object({ id: z.string(), content: z.string().trim().min(3).max(300) }))
    .handler(async ({ input, context }) => {
      const d = await loadDebate(input.id);
      if (!d) throw new ORPCError("NOT_FOUND", { message: "Debat tapılmadı." });
      if (d.proUserId === context.user.id || d.conUserId === context.user.id) {
        throw new ORPCError("FORBIDDEN", { message: "Debatçılar sual göndərə bilməz." });
      }
      await db.insert(schema.debateQuestions).values({
        id: newId(),
        debateId: input.id,
        userId: context.user.id,
        authorName: context.user.name,
        content: input.content,
        createdAt: Date.now(),
      });
      return { ok: true };
    }),

  upvoteQuestion: authed
    .input(z.object({ questionId: z.string() }))
    .handler(async ({ input, context }) => {
      const [q] = await db
        .select()
        .from(schema.debateQuestions)
        .where(eq(schema.debateQuestions.id, input.questionId))
        .limit(1);
      if (!q) throw new ORPCError("NOT_FOUND", { message: "Sual tapılmadı." });
      const existing = await db
        .select()
        .from(schema.questionVotes)
        .where(and(eq(schema.questionVotes.questionId, q.id), eq(schema.questionVotes.userId, context.user.id)))
        .limit(1);
      if (existing[0]) {
        await db
          .delete(schema.questionVotes)
          .where(and(eq(schema.questionVotes.questionId, q.id), eq(schema.questionVotes.userId, context.user.id)));
      } else {
        await db.insert(schema.questionVotes).values({ questionId: q.id, userId: context.user.id });
      }
      return { ok: true };
    }),

  /** Revans: a new debate with the sides swapped, inviting the same opponent. */
  rematch: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const uid = context.user.id;
    const old = await loadDebate(input.id);
    if (!old) throw new ORPCError("NOT_FOUND", { message: "Debat tapılmadı." });
    if (old.status !== "completed") throw new ORPCError("BAD_REQUEST", { message: "Revans yalnız bitmiş debatdan." });
    if (old.proUserId !== uid && old.conUserId !== uid) {
      throw new ORPCError("FORBIDDEN", { message: "Yalnız debatçılar revans istəyə bilər." });
    }
    const callerOld: "pro" | "con" = old.proUserId === uid ? "pro" : "con";
    const callerNew = callerOld === "pro" ? "con" : "pro";
    const oppId = callerOld === "pro" ? old.conUserId : old.proUserId;
    const aiPersona = (callerOld === "pro" ? old.conAi : old.proAi) as PersonaKey | null;
    const id = newId();
    const now = Date.now();
    const base = {
      id,
      topicId: old.topicId,
      title: old.title,
      devilsAdvocate: old.devilsAdvocate,
      turnIndex: 0,
      verdict: null,
      winner: null,
      createdById: uid,
      createdAt: now,
      completedAt: null,
      rematchOfId: old.id,
      proUserId: null,
      conUserId: null,
      proAi: null,
      conAi: null,
      invitedUserId: oppId ?? null,
    };

    if (oppId) {
      await db.insert(schema.debates).values({
        ...base,
        status: "waiting",
        ...(callerNew === "pro" ? { proUserId: uid } : { conUserId: uid }),
      });
      return { id };
    }

    const humanIsPro = callerNew === "pro";
    await db.insert(schema.debates).values({
      ...base,
      status: "live",
      ...(humanIsPro ? { proUserId: uid } : { conUserId: uid }),
      ...(humanIsPro ? { conAi: aiPersona } : { proAi: aiPersona }),
      turnDeadline: humanIsPro ? now + TURN_MS : null,
    });
    void tick(id).catch(() => {});
    return { id };
  }),

  /** Debates the signed-in user took part in, newest first. */
  mine: authed.handler(async ({ context }) => {
    const uid = context.user.id;
    const rows = await db
      .select()
      .from(schema.debates)
      .where(or(eq(schema.debates.proUserId, uid), eq(schema.debates.conUserId, uid)))
      .orderBy(desc(schema.debates.createdAt))
      .limit(100);
    const names = await userNames(
      rows.map((r) => (r.proUserId === uid ? r.conUserId : r.proUserId) ?? "").filter(Boolean),
    );
    return rows.map((r) => {
      const side: "pro" | "con" = r.proUserId === uid ? "pro" : "con";
      const opponentAi = side === "pro" ? r.conAi : r.proAi;
      const opponentId = side === "pro" ? r.conUserId : r.proUserId;
      return {
        id: r.id,
        title: r.title,
        status: r.status as "waiting" | "live" | "completed",
        side,
        opponentName: opponentId
          ? names.get(opponentId) ?? "Naməlum"
          : opponentAi
            ? AI_PERSONAS[opponentAi as PersonaKey]?.name ?? "AI"
            : null,
        opponentId,
        winner: r.winner,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
      };
    });
  }),

  /** Translates one argument into English for the AI Tərcümə toggle. */
  translate: authed
    .input(z.object({ text: z.string().trim().min(1).max(100_000) }))
    .handler(async ({ input }) => {
      const text = await ask(
        "Translate the user's text into natural English. Preserve meaning, structure and paragraphs. Output only the translation.",
        input.text,
        60_000,
      );
      return { text };
    }),
};
