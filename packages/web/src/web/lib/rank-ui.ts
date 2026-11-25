import { rankOf, type RankName } from "../../api/lib/rank";

export { rankOf, type RankName };

export const RANK_STYLE: Record<RankName, string> = {
  Rookie: "bg-slate-100 text-slate-700 border-slate-200",
  Debater: "bg-blue-50 text-pro border-blue-200",
  Mindshifter: "bg-violet-50 text-violet border-violet-200",
  Grandmaster: "bg-amber-50 text-gold border-amber-200",
};
