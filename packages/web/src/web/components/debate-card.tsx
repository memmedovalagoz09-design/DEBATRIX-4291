import { Link } from "wouter";
import { Card, Badge } from "./ui-kit";
import { timeAgo } from "../lib/format";

export type DebateListItem = {
  id: string;
  title: string;
  status: string;
  proName: string | null;
  conName: string | null;
  createdAt: number;
  completedAt: number | null;
  winner: string | null;
};

const STATUS: Record<string, { label: string; tone: "live" | "gold" | "slate" }> = {
  live: { label: "Canlı", tone: "live" },
  waiting: { label: "Açıq dəvət", tone: "gold" },
  completed: { label: "Tamamlanmış", tone: "slate" },
};

export function DebateCard({ d }: { d: DebateListItem }) {
  const st = STATUS[d.status] ?? STATUS.completed;
  const winnerName =
    d.winner === "pro" ? d.proName : d.winner === "con" ? d.conName : null;
  return (
    <Link href={`/debat/${d.id}`} className="block">
      <Card className="h-full p-5 transition hover:border-slate-300 hover:shadow-md">
        <div className="flex items-center justify-between gap-3">
          <Badge tone={st.tone}>{st.label}</Badge>
          <span className="text-[13px] text-slate-500">{timeAgo(d.completedAt ?? d.createdAt)}</span>
        </div>
        <h3 className="mt-3 text-[18px] font-semibold leading-snug text-ink">{d.title}</h3>
        <div className="mt-4 space-y-1.5 text-[15px]">
          <p className="text-pro">
            <span className="font-semibold">PRO:</span> {d.proName ?? "Gözləyir..."}
          </p>
          <p className="text-con">
            <span className="font-semibold">CON:</span> {d.conName ?? "Gözləyir..."}
          </p>
        </div>
        {winnerName && <p className="mt-4 text-[14px] font-medium text-gold">Qalib: {winnerName}</p>}
      </Card>
    </Link>
  );
}
