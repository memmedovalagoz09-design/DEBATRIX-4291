import * as React from "react";
import { useLocation } from "wouter";
import { Copy, Check, Repeat2, Trophy } from "lucide-react";
import { Card, Btn, Badge, ErrorText } from "./ui-kit";
import { useDebateMutations } from "../queries/debates";
import { errorMessage } from "../lib/errors";
import { PersonName } from "./people";
import type { DebateView, Verdict } from "./debate-types";

const CRITERIA: { key: keyof Verdict["ai"]["pro"]; label: string }[] = [
  { key: "logic", label: "Məntiqi ardıcıllıq" },
  { key: "facts", label: "Faktlara əsaslanma" },
  { key: "persuasion", label: "İnandırıcılıq" },
  { key: "politeness", label: "Nəzakətli üslub" },
];

export function DebateVerdict({ view, verdict }: { view: DebateView; verdict: Verdict }) {
  const [, setLocation] = useLocation();
  const { rematch } = useDebateMutations();
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState("");
  const winnerName = verdict.winner === "pro" ? view.pro.name : verdict.winner === "con" ? view.con.name : null;
  const isDebater = view.myRole === "pro" || view.myRole === "con";

  const shareText = [
    `DEBATRİX · "${view.title}"`,
    verdict.winner
      ? `Qalib: ${winnerName} (${verdict.winner === "pro" ? "RAZISAN" : "RAZI DEYİLSƏN"}) — ${verdict.winner === "pro" ? verdict.finalPro : verdict.finalCon}%`
      : "Nəticə: bərabərlik",
    `AI Hakim: PRO ${verdict.aiPro}% · CON ${verdict.aiCon}%`,
    `Mind-Shift: PRO ${verdict.mindShiftPro}% · CON ${100 - verdict.mindShiftPro}%`,
    "Sadəcə mübahisə etmə, sübut et!",
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Kopyalamaq mümkün olmadı.");
    }
  };

  const doRematch = async () => {
    setError("");
    try {
      const r = await rematch.mutateAsync({ id: view.id });
      setLocation(`/debat/${r.id}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 via-white to-red-50 px-6 py-8 text-center sm:px-10">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-gold">AI Hakim qərarı</p>
          <h2 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
            {winnerName ? (
              <>
                Qalib: <PersonName name={winnerName} champion={verdict.winner === "pro" ? view.pro.champion : view.con.champion} />
              </>
            ) : (
              "Nəticə bərabərdir"
            )}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:mx-auto sm:max-w-md">
            <div className="rounded-2xl border border-blue-200 bg-white p-4">
              <p className="text-[13px] font-semibold text-pro">RAZISAN (PRO)</p>
              <p className="text-4xl font-bold tabular-nums text-pro">{verdict.finalPro}%</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-white p-4">
              <p className="text-[13px] font-semibold text-con">RAZI DEYİLSƏN (CON)</p>
              <p className="text-4xl font-bold tabular-nums text-con">{verdict.finalCon}%</p>
            </div>
          </div>
          <p className="mt-5 text-[14px] text-slate-600">
            Yekun hesablama: 50% AI Hakim + 50% İzləyici Mind-Shift
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-ink">Qiymətləndirmə</h3>
            <div className="mt-4 space-y-4">
              {CRITERIA.map((c) => (
                <div key={c.key}>
                  <div className="flex justify-between text-[14px] text-slate-600">
                    <span>{c.label}</span>
                    <span className="tabular-nums">
                      <span className="font-semibold text-pro">{verdict.ai.pro[c.key]}%</span> ·{" "}
                      <span className="font-semibold text-con">{verdict.ai.con[c.key]}%</span>
                    </span>
                  </div>
                  <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-canvas">
                    <div className="bg-pro" style={{ width: `${verdict.ai.pro[c.key]}%` }} />
                    <div className="bg-con" style={{ width: `${verdict.ai.con[c.key]}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-3 text-[15px]">
              <div className="rounded-xl bg-canvas px-4 py-3">
                <dt className="text-[13px] text-slate-500">AI Hakim balı</dt>
                <dd className="font-semibold tabular-nums text-violet">
                  PRO {verdict.aiPro}% · CON {verdict.aiCon}%
                </dd>
              </div>
              <div className="rounded-xl bg-canvas px-4 py-3">
                <dt className="text-[13px] text-slate-500">Tamaşaçı səsi</dt>
                <dd className="font-semibold tabular-nums text-ink">
                  {verdict.votesPro + verdict.votesCon === 0
                    ? "Səs verilmədi"
                    : `PRO ${verdict.votesPro} · CON ${verdict.votesCon}`}
                </dd>
              </div>
            </dl>
            {verdict.winner && (
              <p className="mt-4 flex items-start gap-2 text-[14px] text-slate-600">
                <Trophy className="mt-0.5 size-4 shrink-0 text-gold" />
                Düzgün tərəfi seçən tamaşaçılar +10 Obyektiv Hakim XP qazanır.
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-ink">Hakimin xülasəsi</h3>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                {verdict.ai.summary || "Xülasə yoxdur."}
              </p>
              {verdict.judgeSource === "heuristic" && (
                <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-[14px] text-gold">
                  AI Hakim bu dəfə qiymətləndirmə apara bilmədi. Ballar arqumentlərin həcminə əsasən hesablandı.
                </p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">Məntiq xətaları</h3>
              {verdict.ai.fallacies.length === 0 ? (
                <p className="mt-3 text-[15px] text-slate-500">Əhəmiyyətli məntiq xətası aşkarlanmadı.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {verdict.ai.fallacies.map((f, i) => (
                    <li key={i} className="rounded-xl border border-line p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={f.side === "pro" ? "pro" : "con"}>{f.side === "pro" ? "PRO" : "CON"}</Badge>
                        <span className="font-semibold text-ink">{f.type}</span>
                      </div>
                      {f.quote && <p className="mt-2 border-l-2 border-line pl-3 text-[14px] italic text-slate-600">"{f.quote}"</p>}
                      {f.explanation && <p className="mt-2 text-[14px] text-slate-600">{f.explanation}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 sm:p-7">
        <h3 className="text-lg font-semibold text-ink">Nəticəni paylaş</h3>
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-canvas p-4 text-[14px] leading-relaxed text-slate-700">{shareText}</pre>
        <div className="mt-4 flex flex-wrap gap-3">
          <Btn variant="outline" onClick={copy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Kopyalandı" : "Mətni kopyala"}
          </Btn>
          {isDebater && view.status === "completed" && (
            <Btn variant="gold" onClick={doRematch} disabled={rematch.isPending}>
              <Repeat2 className="size-4" /> {rematch.isPending ? "Göndərilir..." : "Revans istə"}
            </Btn>
          )}
        </div>
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      </Card>
    </section>
  );
}
