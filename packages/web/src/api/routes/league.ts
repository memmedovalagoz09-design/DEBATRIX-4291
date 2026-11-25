import { eq } from "drizzle-orm";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { rankOf, type RankName } from "../lib/rank";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MDU_PATTERN = /mingəçevir|mingecevir|mdu/i;

export type LeagueRow = {
  userId: string;
  name: string;
  university: string;
  specialization: string;
  rix: number;
  rank: RankName;
  debates: number;
  weekDebates: number;
};

type Group = { name: string; members: number; totalRix: number; debates: number; champion: LeagueRow | null };

function groupBy(rows: LeagueRow[], key: "university" | "specialization"): Group[] {
  const map = new Map<string, LeagueRow[]>();
  for (const r of rows) {
    const k = r[key];
    map.set(k, [...(map.get(k) ?? []), r]);
  }
  return [...map.entries()]
    .map(([name, members]) => ({
      name,
      members: members.length,
      totalRix: members.reduce((s, m) => s + m.rix, 0),
      debates: members.reduce((s, m) => s + m.debates, 0),
      champion: cupChampion(members),
    }))
    .sort((a, b) => b.totalRix - a.totalRix);
}

/** Cup standings: this week's debatlar first, then RIX. Champion needs at least one weekly debat. */
function cupStandings(members: LeagueRow[]): LeagueRow[] {
  return [...members].sort((a, b) => b.weekDebates - a.weekDebates || b.rix - a.rix);
}

function cupChampion(members: LeagueRow[]): LeagueRow | null {
  const top = cupStandings(members)[0];
  return top && top.weekDebates > 0 ? top : null;
}

export async function computeLeague() {
  const users = await db.select().from(schema.users);
  const completed = await db
    .select()
    .from(schema.debates)
    .where(eq(schema.debates.status, "completed"));

  const total = new Map<string, number>();
  const week = new Map<string, number>();
  const weekAgo = Date.now() - WEEK_MS;
  for (const d of completed) {
    const inWeek = (d.completedAt ?? 0) >= weekAgo;
    for (const uid of [d.proUserId, d.conUserId]) {
      if (!uid) continue;
      total.set(uid, (total.get(uid) ?? 0) + 1);
      if (inWeek) week.set(uid, (week.get(uid) ?? 0) + 1);
    }
  }

  const rows: LeagueRow[] = users.map((u) => ({
    userId: u.id,
    name: u.name,
    university: u.university,
    specialization: u.specialization,
    rix: u.rix,
    rank: rankOf(u.rix),
    debates: total.get(u.id) ?? 0,
    weekDebates: week.get(u.id) ?? 0,
  }));

  const rankings = [...rows].sort((a, b) => b.rix - a.rix || b.debates - a.debates).slice(0, 50);
  const mduMembers = rows.filter((r) => MDU_PATTERN.test(r.university));
  const mduStandings = cupStandings(mduMembers).slice(0, 20);
  const mduChampion = cupChampion(mduMembers);
  const specializations = groupBy(rows, "specialization");
  const championIds = new Set<string>();
  if (mduChampion) championIds.add(mduChampion.userId);
  for (const s of specializations) if (s.champion) championIds.add(s.champion.userId);

  return {
    rankings,
    universities: groupBy(rows, "university").slice(0, 20),
    specializations,
    mdu: {
      members: mduMembers.length,
      champion: mduChampion,
      standings: mduStandings,
    },
    championIds: [...championIds],
  };
}

export const league = {
  standings: base.handler(() => computeLeague()),
};
