import type { useDebate } from "../queries/debates";

export type DebateView = NonNullable<ReturnType<typeof useDebate>["data"]>;

export type Scores = { logic: number; facts: number; persuasion: number; politeness: number };

export type Verdict = {
  judgeSource: "ai" | "heuristic";
  ai: {
    pro: Scores;
    con: Scores;
    fallacies: { side: "pro" | "con"; type: string; quote: string; explanation: string }[];
    summary: string;
  };
  aiPro: number;
  aiCon: number;
  votesPro: number;
  votesCon: number;
  mindShiftPro: number;
  finalPro: number;
  finalCon: number;
  winner: "pro" | "con" | null;
};

export const ROUND_TITLES: Record<number, string> = {
  1: "Giriş Arqumenti",
  2: "Əks-Hücum və Təkzib",
  3: "Yekun Söz və İzləyici Sualına Cavab",
};
