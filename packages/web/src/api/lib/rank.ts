export type RankName = "Rookie" | "Debater" | "Mindshifter" | "Grandmaster";

export const RANK_LABELS: Record<RankName, string> = {
  Rookie: "Rookie",
  Debater: "Debater",
  Mindshifter: "Mindshifter",
  Grandmaster: "Grandmaster",
};

/** 0–999 Rookie, 1000–1499 Debater, 1500–1999 Mindshifter, 2000+ Grandmaster */
export function rankOf(rix: number): RankName {
  if (rix >= 2000) return "Grandmaster";
  if (rix >= 1500) return "Mindshifter";
  if (rix >= 1000) return "Debater";
  return "Rookie";
}

export const START_RIX = 1000;
export const WIN_RIX = 25;
export const LOSS_RIX = 15;
export const TURN_MS = 5 * 60 * 1000;
export const TOTAL_TURNS = 6;

export function turnSide(turnIndex: number): "pro" | "con" {
  return turnIndex % 2 === 0 ? "pro" : "con";
}

export function roundOf(turnIndex: number): number {
  return Math.floor(turnIndex / 2) + 1;
}
