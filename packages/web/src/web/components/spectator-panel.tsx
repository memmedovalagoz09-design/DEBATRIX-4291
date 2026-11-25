import * as React from "react";
import { useLocation } from "wouter";
import { ThumbsUp, ThumbsDown, MessageSquare, HelpCircle, ArrowUp, Send } from "lucide-react";
import { Card, Btn, Textarea, ErrorText } from "./ui-kit";
import { useDebateMutations } from "../queries/debates";
import { useMe } from "../queries/account";
import { errorMessage } from "../lib/errors";
import { REACTION_LABEL } from "../lib/format";
import { cn } from "@/lib/utils";
import type { DebateView } from "./debate-types";

const REACTION_KEYS = ["guclu_fakt", "mantiq_xetasi", "emosional", "movzudan_yayindi"] as const;

/**
 * Spectator-only controls for a live debate: Mind-Shift vote, reactions,
 * comments and audience questions. Debaters never see this panel.
 */
export function SpectatorPanel({ view }: { view: DebateView }) {
  const [, setLocation] = useLocation();
  const { user } = useMe();
  const m = useDebateMutations();
  const [error, setError] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [question, setQuestion] = React.useState("");

  const requireLogin = () => {
    if (!user) setLocation("/giris");
    return !!user;
  };

  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const onVote = (side: "pro" | "con") => {
    if (!requireLogin()) return;
    void run(() => m.vote.mutateAsync({ id: view.id, side }));
  };

  const onReact = (kind: (typeof REACTION_KEYS)[number]) => {
    if (!requireLogin()) return;
    void run(() => m.react.mutateAsync({ id: view.id, kind }));
  };

  const onComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireLogin()) return;
    const content = comment.trim();
    if (!content) return;
    await run(async () => {
      await m.comment.mutateAsync({ id: view.id, content });
      setComment("");
    });
  };

  const onQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireLogin()) return;
    const content = question.trim();
    if (!content) return;
    await run(async () => {
      await m.question.mutateAsync({ id: view.id, content });
      setQuestion("");
    });
  };

  const onUpvote = (questionId: string) => {
    if (!requireLogin()) return;
    void run(() => m.upvote.mutateAsync({ questionId }));
  };

  const proName = view.pro.name ?? "PRO";
  const conName = view.con.name ?? "CON";
  const { mindShift } = view;
  const hasVotes = mindShift.total > 0;

  return (
    <section className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink">Mind-Shift səsi</h3>
          <span className="text-[13px] text-slate-500">{mindShift.total} səs</span>
        </div>
        <p className="mt-1 text-[14px] text-slate-500">
          Tamaşaçıların səsi qərarın 50%-ni təşkil edir. Sən hansı tərəfə inandın?
        </p>

        <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-canvas">
          <div className="bg-pro transition-all duration-500" style={{ width: `${hasVotes ? mindShift.pro : 50}%` }} />
          <div className="bg-con transition-all duration-500" style={{ width: `${hasVotes ? mindShift.con : 50}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[14px] font-semibold">
          <span className="text-pro">
            {proName} {hasVotes ? `${mindShift.pro}%` : ""}
          </span>
          <span className="text-con">
            {conName} {hasVotes ? `${mindShift.con}%` : ""}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Btn
            variant={view.myVote === "pro" ? "pro" : "outline"}
            onClick={() => onVote("pro")}
            disabled={m.vote.isPending}
            className="h-11"
          >
            <ThumbsUp className="size-4" /> Razıyam
          </Btn>
          <Btn
            variant={view.myVote === "con" ? "con" : "outline"}
            onClick={() => onVote("con")}
            disabled={m.vote.isPending}
            className="h-11"
          >
            <ThumbsDown className="size-4" /> Razı deyiləm
          </Btn>
        </div>
        {view.myVote && (
          <p className="mt-3 text-center text-[13px] text-slate-500">Səsini istənilən vaxt dəyişə bilərsən.</p>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-ink">Reaksiyalar</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {REACTION_KEYS.map((k) => (
            <button
              key={k}
              onClick={() => onReact(k)}
              disabled={m.react.isPending}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-[14px] text-ink transition hover:border-slate-300 hover:bg-canvas disabled:opacity-50"
            >
              {REACTION_LABEL[k]}
              <span className="font-semibold text-slate-500">{view.reactions[k] ?? 0}</span>
            </button>
          ))}
        </div>
      </Card>

      {view.topQuestion && (
        <Card className="border-amber-200 bg-amber-50/60 p-5 sm:p-6">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-gold">Ən çox bəyənilən sual</p>
          <p className="mt-2 text-[16px] font-medium text-ink">{view.topQuestion.content}</p>
          <p className="mt-1 text-[13px] text-slate-500">
            {view.topQuestion.authorName} · {view.topQuestion.upvotes} bəyənmə
          </p>
          <p className="mt-2 text-[13px] text-slate-600">Bu sual Üçüncü Raundda debatçıya veriləcək.</p>
        </Card>
      )}

      <Card className="p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <HelpCircle className="size-5 text-violet" /> Tamaşaçı sualları
        </h3>
        <p className="mt-1 text-[14px] text-slate-500">
          Sual yaz və ən çox bəyənilən sual üçüncü raundda debatçıya veriləcək.
        </p>
        <form onSubmit={onQuestion} className="mt-4 flex gap-2">
          <input
            aria-label="Debatçıya sual"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={300}
            placeholder="Debatçıya sualın..."
            className="h-11 min-w-0 flex-1 rounded-xl border border-line px-4 text-[15px] text-ink outline-none placeholder:text-slate-400 focus:border-pro focus:ring-2 focus:ring-blue-100"
          />
          <Btn type="submit" variant="ink" disabled={m.question.isPending || !question.trim()}>
            Göndər
          </Btn>
        </form>

        {view.questions.length === 0 ? (
          <p className="mt-5 text-[14px] text-slate-500">Hələ sual yoxdur. İlk sualı sən ver.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {[...view.questions]
              .sort((a, b) => b.upvotes - a.upvotes)
              .map((q) => (
                <li key={q.id} className="flex items-start gap-3 rounded-xl border border-line p-3.5">
                  <button
                    onClick={() => onUpvote(q.id)}
                    disabled={q.votedByMe || m.upvote.isPending}
                    aria-label="Bəyən"
                    className={cn(
                      "flex shrink-0 flex-col items-center rounded-lg px-2 py-1 text-[13px] font-semibold transition",
                      q.votedByMe ? "bg-violet/10 text-violet" : "text-slate-500 hover:bg-canvas hover:text-ink",
                    )}
                  >
                    <ArrowUp className="size-4" />
                    {q.upvotes}
                  </button>
                  <div className="min-w-0">
                    <p className="text-[15px] text-ink">{q.content}</p>
                    <p className="mt-0.5 text-[13px] text-slate-500">{q.authorName}</p>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <MessageSquare className="size-5 text-slate-500" /> Şərhlər
        </h3>
        <form onSubmit={onComment} className="mt-4 space-y-3">
          <Textarea
            rows={3}
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Fikrini yaz..."
          />
          <div className="flex justify-end">
            <Btn type="submit" variant="ink" size="sm" disabled={m.comment.isPending || !comment.trim()}>
              <Send className="size-4" /> Şərh yaz
            </Btn>
          </div>
        </form>

        {view.comments.length === 0 ? (
          <p className="mt-5 text-[14px] text-slate-500">Hələ şərh yoxdur.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {view.comments.map((c) => (
              <li key={c.id} className="rounded-xl bg-canvas px-4 py-3">
                <p className="text-[13px] font-semibold text-ink">{c.authorName}</p>
                <p className="mt-1 whitespace-pre-line text-[15px] text-slate-700">{c.content}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {error && <ErrorText>{error}</ErrorText>}
    </section>
  );
}
