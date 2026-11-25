import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { RANK_STYLE, rankOf } from "../lib/rank-ui";

/** Name with the gold champion frame when the user holds a cup. */
export function PersonName({ name, champion, className }: { name: string; champion?: boolean; className?: string }) {
  if (!champion) return <span className={className}>{name}</span>;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="frame-champion inline-flex items-center gap-1 bg-amber-50 px-2.5 py-0.5 text-[14px] font-semibold text-gold">
        <Trophy className="size-3.5" />
        {name}
      </span>
    </span>
  );
}

export function RankBadge({ rix, className }: { rix: number; className?: string }) {
  const rank = rankOf(rix);
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[13px] font-semibold", RANK_STYLE[rank], className)}>
      {rank}
    </span>
  );
}
