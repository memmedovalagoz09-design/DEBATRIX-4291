import * as React from "react";
import { useLocation } from "wouter";
import { Copy, Check, Languages, Hourglass, Send, Swords } from "lucide-react";
import { PageShell, Container } from "../components/layout";
import { Card, Btn, Badge, ErrorText, Spinner, Textarea } from "../components/ui-kit";
import { PersonName } from "../components/people";
import { SpectatorPanel } from "../components/spectator-panel";
import { DebateVerdict } from "../components/debate-verdict";
import { ROUND_TITLES, type DebateView, type Verdict } from "../components/debate-types";
import { useDebate, useDebateMutations } from "../queries/debates";
import { useMe } from "../queries/account";
import { errorMessage } from "../lib/errors";
import { formatClock } from "../lib/format";
import { cn } from "@/lib/utils";

const STATUS: Record<string, { label: string; tone: "live" | "gold" | "slate" }> = {
  live: { label: "Canlı", tone: "live" },
  waiting: { label: "Açıq dəvət", tone: "gold" },
  completed: { label: "Tamamlanmış", tone: "slate" },
};

/** Ticks once a second while `active`, so countdowns move without refetching. */
function useNow(active: boolean) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

function Debate({ params }: { params: { id: string } }) {
  const id = params.id;
  const [, setLocation] = useLocation();
  const { user, loading: meLoading } = useMe();
  const q = useDebate(id);
  const m = useDebateMutations();
  const view = q.data as DebateView | undefined;

  const isLive = view?.status === "live";
  const now = useNow(!!view && isLive && !!view.turnDeadline);
  const remaining = view?.turnDeadline ? view.turnDeadline - now : null;

  const [error, setError] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [translations, setTranslations] = React.useState<Record<string, string>>({});
  const [showEn, setShowEn] = React.useState<Record<string, boolean>>({});
  const [translating, setTranslating] = React.useState<Record<string, boolean>>({});

  if (q.isLoading) return <Shell><Spinner /></Shell>;

  if (q.error || !view) {
    return (
      <Shell>
        <Card className="mx-auto max-w-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-ink">Debat tapılmadı</h2>
          <p className="mt-2 text-[15px] text-slate-500">Link səhv ola bilər, ya debat silinib.</p>
          <div className="mt-6">
            <Btn variant="ink" onClick={() => setLocation("/canli")}>
              Canlı debatlara bax
            </Btn>
          </div>
        </Card>
      </Shell>
    );
  }

  const status = STATUS[view.status] ?? STATUS.completed;
  const isDebater = view.myRole === "pro" || view.myRole === "con";
  const isCreator = isDebater && view.status === "waiting";
  const aiWriting = isLive && !view.turnDeadline && !view.canSubmit && !!view.currentSide;
  const inviteLink = `${window.location.origin}/debat/${view.id}`;

  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    await run(async () => {
      await m.submit.mutateAsync({ id: view.id, content });
      setDraft("");
    });
  };

  const onJoin = () => {
    if (!user) return setLocation("/giris");
    void run(() => m.join.mutateAsync({ id: view.id }));
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Linki kopyalamaq mümkün olmadı. Əl ilə kopyalayın.");
    }
  };

  const toggleEn = async (argId: string, text: string) => {
    if (showEn[argId]) return setShowEn((s) => ({ ...s, [argId]: false }));
    setShowEn((s) => ({ ...s, [argId]: true }));
    if (translations[argId] || translating[argId]) return;
    setTranslating((s) => ({ ...s, [argId]: true }));
    try {
      const r = await m.translate.mutateAsync({ text });
      setTranslations((s) => ({ ...s, [argId]: r.text }));
    } catch (e) {
      setShowEn((s) => ({ ...s, [argId]: false }));
      setError(errorMessage(e));
    } finally {
      setTranslating((s) => ({ ...s, [argId]: false }));
    }
  };

  const turnLabel = view.currentSide
    ? `${view.currentSide === "pro" ? "PRO" : "CON"} növbəsi${view.currentControllerName ? ` — ${view.currentControllerName}` : ""}`
    : null;

  return (
    <PageShell>
      <Container className="py-10">
        {/* Header */}
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-gradient-to-r from-blue-50/70 via-white to-red-50/70 px-6 py-7 sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={status.tone}>{status.label}</Badge>
              {view.status !== "waiting" && (
                <span className="text-[14px] font-medium text-slate-600">
                  {ROUND_TITLES[view.round] ?? ROUND_TITLES[1]} · Raund {view.round}/3
                </span>
              )}
              {view.devilsAdvocate && <span className="text-[13px] text-violet">Şeytanın vəkili rejimi</span>}
            </div>
            <h1 className="mt-4 text-2xl font-bold leading-snug tracking-tight text-ink sm:text-3xl">{view.title}</h1>
            <div className="mt-5 grid gap-3 text-[15px] sm:grid-cols-2">
              <p className="text-pro">
                <span className="font-semibold">PRO:</span>{" "}
                {view.pro.name ? (
                  <PersonName name={view.pro.name} champion={view.pro.champion} />
                ) : (
                  <span className="text-slate-500">Gözləyir...</span>
                )}
              </p>
              <p className="text-con">
                <span className="font-semibold">CON:</span>{" "}
                {view.con.name ? (
                  <PersonName name={view.con.name} champion={view.con.champion} />
                ) : (
                  <span className="text-slate-500">Gözləyir...</span>
                )}
              </p>
            </div>
          </div>

          {/* Turn bar */}
          {isLive && turnLabel && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-canvas px-6 py-3.5 text-[15px] sm:px-8">
              <span className="font-medium text-ink">{turnLabel}</span>
              {remaining !== null ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-2 font-semibold tabular-nums",
                    remaining <= 15_000 ? "text-con" : "text-slate-700",
                  )}
                >
                  <Hourglass className="size-4" />
                  {remaining > 0 ? formatClock(remaining) : "0:00"}
                </span>
              ) : (
                <span className="text-slate-500">AI arqument yazır...</span>
              )}
            </div>
          )}
        </Card>

        {view.aiStalled && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-[15px] text-gold">
            {view.aiStalled}
          </div>
        )}

        {view.canSubmit && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-[15px] font-medium text-pro">
            <Swords className="size-5 shrink-0" />
            Sizin növbəniz. Arqumentinizi yazın.
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            {/* Arguments */}
            <section>
              <h2 className="text-xl font-bold text-ink">Arqumentlər</h2>
              <div className="mt-5 space-y-5">
                {view.arguments.length === 0 && !aiWriting && (
                  <p className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-[15px] text-slate-500">
                    {view.status === "waiting"
                      ? "Debat hələ başlamayıb. Rəqib qoşulduqda ilk arqument yazılacaq."
                      : "Hələ arqument yoxdur."}
                  </p>
                )}

                {view.arguments.map((a) => {
                  const isPro = a.side === "pro";
                  const en = translations[a.id];
                  const open = !!showEn[a.id];
                  return (
                    <div key={a.id} className={cn("flex", isPro ? "justify-start" : "justify-end")}>
                      <article
                        className={cn(
                          "w-full max-w-[640px] rounded-2xl border p-5 sm:p-6",
                          isPro ? "border-blue-100 bg-blue-50/50" : "border-red-100 bg-red-50/50",
                        )}
                      >
                        <header className="flex flex-wrap items-center justify-between gap-2">
                          <p className={cn("text-[14px] font-semibold", isPro ? "text-pro" : "text-con")}>
                            {a.authorName}
                            <span className="ml-2 font-normal text-slate-500">
                              {isPro ? "PRO" : "CON"} · Raund {a.round}
                              {a.isAi ? " · AI" : ""}
                            </span>
                          </p>
                          {!a.timedOut && (
                            <button
                              onClick={() => toggleEn(a.id, a.content)}
                              disabled={translating[a.id]}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium text-slate-600 hover:bg-white hover:text-ink disabled:opacity-50"
                            >
                              <Languages className="size-4" />
                              {translating[a.id] ? "Tərcümə olunur..." : open ? "Azərbaycanca" : "AI Tərcümə"}
                            </button>
                          )}
                        </header>
                        {a.timedOut ? (
                          <p className="mt-3 text-[15px] italic text-slate-500">Vaxt bitdi — növbə itirildi</p>
                        ) : (
                          <>
                            <p className="mt-3 whitespace-pre-line text-[16px] leading-relaxed text-ink">
                              {open && en ? en : a.content}
                            </p>
                            {open && en && (
                              <p className="mt-2 text-[12px] uppercase tracking-wider text-slate-400">English (AI)</p>
                            )}
                          </>
                        )}
                      </article>
                    </div>
                  );
                })}

                {aiWriting && (
                  <div className={cn("flex", view.currentSide === "pro" ? "justify-start" : "justify-end")}>
                    <div
                      className={cn(
                        "w-full max-w-[640px] animate-pulse rounded-2xl border border-dashed p-5 sm:p-6",
                        view.currentSide === "pro" ? "border-blue-200" : "border-red-200",
                      )}
                    >
                      <p className="text-[14px] text-slate-500">
                        {view.currentControllerName ?? "AI"} arqument yazır...
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="h-3 w-11/12 rounded bg-slate-200" />
                        <div className="h-3 w-9/12 rounded bg-slate-200" />
                        <div className="h-3 w-7/12 rounded bg-slate-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Composer */}
            {view.canSubmit && (
              <form onSubmit={onSubmit} className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
                <label htmlFor="argument" className="text-[15px] font-semibold text-ink">
                  Sizin arqumentiniz
                </label>
                <Textarea
                  id="argument"
                  rows={6}
                  maxLength={100_000}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Fikrinizi aydın və sübutlu şəkildə yazın..."
                  className="mt-3"
                />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[13px] text-slate-500">
                    {draft.trim().length} simvol · Vaxt bitəndə növbə itirilir
                  </p>
                  <Btn type="submit" variant="ink" disabled={m.submit.isPending || !draft.trim()}>
                    <Send className="size-4" />
                    {m.submit.isPending ? "Göndərilir..." : "Arqumenti göndər"}
                  </Btn>
                </div>
              </form>
            )}

            {/* Waiting: join or invite */}
            {view.status === "waiting" && (
              <Card className="mt-8 p-6 sm:p-7">
                {isCreator ? (
                  <>
                    <h2 className="text-lg font-semibold text-ink">Rəqib gözlənilir</h2>
                    <p className="mt-1 text-[15px] text-slate-500">
                      Bu linki rəqibinizə göndərin. Link açılıb qoşulduqda debat başlayacaq.
                    </p>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                      <input
                        readOnly
                        aria-label="Dəvət linki"
                        value={inviteLink}
                        onFocus={(e) => e.currentTarget.select()}
                        className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-canvas px-4 text-[14px] text-ink"
                      />
                      <Btn variant="outline" onClick={onCopy} className="h-11">
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                        {copied ? "Kopyalandı" : "Linki kopyala"}
                      </Btn>
                    </div>
                  </>
                ) : isDebater ? (
                  <p className="text-[15px] text-slate-500">Rəqib gözlənilir.</p>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-ink">
                      {view.invitedForMe ? "Sizi debata dəvət etdilər" : "Bu debata qoşul"}
                    </h2>
                    <p className="mt-1 text-[15px] text-slate-500">
                      Qoşulduqda debatçı tərəfi sizin üçün açılacaq və ilk növbə başlayacaq.
                    </p>
                    {meLoading ? null : (
                      <div className="mt-5">
                        <Btn variant="ink" onClick={onJoin} disabled={m.join.isPending}>
                          {user ? (m.join.isPending ? "Qoşulur..." : "Debata qoşul") : "Daxil ol və qoşul"}
                        </Btn>
                      </div>
                    )}
                  </>
                )}
              </Card>
            )}

            {error && (
              <div className="mt-5">
                <ErrorText>{error}</ErrorText>
              </div>
            )}
          </div>

          {/* Side column */}
          <aside className="min-w-0 space-y-6">
            {view.status === "live" && !isDebater && <SpectatorPanel view={view} />}
            {view.status === "live" && isDebater && (
              <Card className="p-5 text-[15px] text-slate-600">
                Siz bu debatın iştirakçısısınız. Tamaşaçılar Mind-Shift səsi verir və suallar göndərir.
              </Card>
            )}
          </aside>
        </div>

        {view.status === "completed" && (
          <div className="mt-10">
            {view.verdict ? (
              <DebateVerdict view={view} verdict={view.verdict as Verdict} />
            ) : (
              <Card className="p-6 text-[15px] text-slate-500">Qərar hazırlanır...</Card>
            )}
          </div>
        )}
      </Container>
    </PageShell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <PageShell>
      <Container className="py-16">{children}</Container>
    </PageShell>
  );
}

export default Debate;
