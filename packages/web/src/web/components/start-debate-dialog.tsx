import * as React from "react";
import { useLocation } from "wouter";
import { Modal, Btn, ErrorText } from "./ui-kit";
import { useMe } from "../queries/account";
import { useDebateMutations } from "../queries/debates";
import { errorMessage } from "../lib/errors";
import { AI_OPPONENTS, SIDE_LABEL } from "../lib/format";
import { cn } from "@/lib/utils";

type Opponent = "ai:socrates" | "ai:aristotle" | "ai:champion" | "invite";

export function StartDebateDialog({
  topic,
  initialSide,
  onClose,
}: {
  topic: { id: string; title: string } | null;
  initialSide: "pro" | "con";
  onClose: () => void;
}) {
  const [, setLocation] = useLocation();
  const { user } = useMe();
  const { create } = useDebateMutations();
  const [side, setSide] = React.useState<"pro" | "con">(initialSide);
  const [opponent, setOpponent] = React.useState<Opponent>("ai:aristotle");
  const [devils, setDevils] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setSide(initialSide);
    setError("");
  }, [initialSide, topic?.id]);

  const start = async () => {
    if (!topic) return;
    if (!user) {
      setLocation("/giris");
      return;
    }
    setError("");
    try {
      const isAi = opponent.startsWith("ai:");
      const res = await create.mutateAsync({
        topicId: topic.id,
        side,
        mode: isAi ? "ai" : "invite",
        aiPersona: isAi ? (opponent.slice(3) as "socrates" | "aristotle" | "champion") : undefined,
        devilsAdvocate: devils,
      });
      onClose();
      setLocation(`/debat/${res.id}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <Modal open={!!topic} onClose={onClose} title="Debata başla" wide>
      {topic && (
        <div className="space-y-6">
          <div className="rounded-xl bg-canvas px-4 py-3">
            <p className="text-sm text-slate-500">Mövzu</p>
            <p className="mt-0.5 text-[17px] font-semibold text-ink">{topic.title}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">Mövqeyin</p>
            <div className="grid grid-cols-2 gap-3">
              {(["pro", "con"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={cn(
                    "rounded-xl border-2 px-3 py-3 text-[15px] font-semibold transition",
                    side === s
                      ? s === "pro"
                        ? "border-pro bg-blue-50 text-pro"
                        : "border-con bg-red-50 text-con"
                      : "border-line bg-white text-slate-500 hover:border-slate-300",
                  )}
                >
                  {SIDE_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">Rəqib</p>
            <div className="grid gap-2">
              {AI_OPPONENTS.map((a) => {
                const val = `ai:${a.key}` as Opponent;
                return (
                  <OptionRow
                    key={a.key}
                    active={opponent === val}
                    onClick={() => setOpponent(val)}
                    title={`AI Rəqib: ${a.name}`}
                    text={a.desc}
                  />
                );
              })}
              <OptionRow
                active={opponent === "invite"}
                onClick={() => setOpponent("invite")}
                title="Real istifadəçi (dəvət linki)"
                text="Debat yaradılır və link yaradılır. Linki paylaşdığın istifadəçi qoşulduqda debat başlayır."
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4">
            <input
              type="checkbox"
              aria-label="Şeytanın vəkili rejimi"
              checked={devils}
              onChange={(e) => setDevils(e.target.checked)}
              className="mt-1 size-4 accent-violet"
            />
            <span>
              <span className="block font-semibold text-ink">Şeytanın Vəkili</span>
              <span className="block text-[14px] text-slate-500">
                Rəqib ən sərt əks-arqumentlərlə çıxış edir. Mövqeyini sınamaq üçün.
              </span>
            </span>
          </label>

          <ErrorText>{error}</ErrorText>
          {!user && (
            <p className="text-[14px] text-slate-500">Debat başlatmaq üçün əvvəlcə daxil olmalısan.</p>
          )}
          <div className="flex justify-end gap-2">
            <Btn variant="outline" onClick={onClose}>
              Ləğv et
            </Btn>
            <Btn variant={side === "pro" ? "pro" : "con"} onClick={start} disabled={create.isPending}>
              {create.isPending ? "Yaradılır..." : user ? "Debata başla →" : "Daxil ol →"}
            </Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

function OptionRow({
  active,
  onClick,
  title,
  text,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition",
        active ? "border-ink bg-canvas" : "border-line bg-white hover:border-slate-300",
      )}
    >
      <span
        className={cn(
          "mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border-2",
          active ? "border-ink" : "border-slate-300",
        )}
      >
        {active && <span className="size-2 rounded-full bg-ink" />}
      </span>
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block text-[14px] text-slate-500">{text}</span>
      </span>
    </button>
  );
}

