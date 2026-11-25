import * as React from "react";
import { Link, useLocation } from "wouter";
import { LogOut, Trash2 } from "lucide-react";
import { PageShell, Container } from "../components/layout";
import { Card, Btn, Field, Input, ErrorText, Modal, Spinner, Badge } from "../components/ui-kit";
import { RankBadge } from "../components/people";
import { useAuthMutations, useMe } from "../queries/account";
import { useMyDebates } from "../queries/debates";
import { errorMessage } from "../lib/errors";
import { rankOf } from "../lib/rank-ui";
import { SIDE_LABEL, timeAgo } from "../lib/format";

const RANK_TARGETS = [
  { name: "Debater", at: 1000 },
  { name: "Mindshifter", at: 1500 },
  { name: "Grandmaster", at: 2000 },
];

function Profile() {
  const [, setLocation] = useLocation();
  const { user, loading } = useMe();
  const history = useMyDebates(!!user);
  const { updateProfile, logout, deleteProfile } = useAuthMutations();
  const [form, setForm] = React.useState({ name: "", university: "", specialization: "" });
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState("");
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [deleteError, setDeleteError] = React.useState("");

  React.useEffect(() => {
    if (user) setForm({ name: user.name, university: user.university, specialization: user.specialization });
  }, [user]);

  React.useEffect(() => {
    if (!loading && !user) setLocation("/giris");
  }, [loading, user, setLocation]);

  if (loading || !user) {
    return (
      <PageShell>
        <Container className="py-10">
          <Spinner />
        </Container>
      </PageShell>
    );
  }

  const rank = rankOf(user.rix);
  const next = RANK_TARGETS.find((t) => t.at > user.rix);
  const progress = next ? Math.min(100, ((user.rix - (next.at - 500)) / 500) * 100) : 100;
  const games = user.wins + user.losses;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      await updateProfile.mutateAsync(form);
      setSaved(true);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const doLogout = async () => {
    await logout.mutateAsync(undefined).catch(() => {});
    setLocation("/");
  };

  const doDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError("");
    try {
      await deleteProfile.mutateAsync({ password });
      setDeleteOpen(false);
      setLocation("/");
    } catch (err) {
      setDeleteError(errorMessage(err));
    }
  };

  return (
    <PageShell>
      <Container className="py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6">
            <Card className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-ink">{user.name}</h1>
                <RankBadge rix={user.rix} />
              </div>
              <p className="mt-2 text-[15px] text-slate-600">
                {user.university} · {user.specialization}
              </p>

              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold tabular-nums text-gold">{user.rix}</p>
                  <p className="text-[14px] text-slate-500">RIX balı · {rank}</p>
                </div>
                <div className="text-right text-[14px] text-slate-500">
                  {next ? `Növbəti: ${next.name} (${next.at} RIX)` : "Ən yüksək rütbə"}
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
                <div className="h-full rounded-full bg-gradient-to-r from-pro to-violet" style={{ width: `${progress}%` }} />
              </div>

              <dl className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { label: "Qalibiyyət", value: user.wins },
                  { label: "Məğlubiyyət", value: user.losses },
                  { label: "XP", value: user.xp },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-canvas px-4 py-3">
                    <dt className="text-[13px] text-slate-500">{s.label}</dt>
                    <dd className="mt-0.5 text-xl font-bold tabular-nums text-ink">{s.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[13px] text-slate-500">Ümumi {games} debat</p>

              <Btn variant="outline" className="mt-6" onClick={doLogout} disabled={logout.isPending}>
                <LogOut className="size-4" /> Çıxış
              </Btn>
            </Card>

            <Card className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-ink">Profil məlumatları</h2>
              <p className="mt-1 text-[14px] text-slate-500">Universitet və ixtisasını sərbəst mətnlə yaza bilərsən.</p>
              <form onSubmit={save} className="mt-6 space-y-4">
                <Field label="Ad və soyad">
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required minLength={2} maxLength={40} />
                </Field>
                <Field label="Universitet">
                  <Input value={form.university} onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))} required minLength={2} />
                </Field>
                <Field label="İxtisas">
                  <Input value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} required minLength={2} />
                </Field>
                <ErrorText>{error}</ErrorText>
                {saved && <p className="text-sm text-pro">Məlumatlar yadda saxlanıldı.</p>}
                <Btn type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Saxlanılır..." : "Yadda saxla"}
                </Btn>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-ink">Debat tarixçəsi</h2>
              <div className="mt-5">
                {history.isLoading ? (
                  <Spinner />
                ) : !history.data?.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center">
                    <p className="font-semibold text-ink">Hələ debatın yoxdur</p>
                    <p className="mt-2 text-[15px] text-slate-500">Bir mövzu seçib ilk debatını başlat.</p>
                    <Link href="/" className="mt-5 inline-flex h-11 items-center rounded-xl bg-ink px-5 text-[15px] font-medium text-white">
                      Arenaya keç
                    </Link>
                  </div>
                ) : (
                  <ul className="divide-y divide-line">
                    {history.data.map((d) => {
                      const won = d.winner === d.side;
                      const outcome =
                        d.status !== "completed" ? (d.status === "live" ? "Canlı" : "Gözləyir") : d.winner ? (won ? "Qalib" : "Məğlub") : "Bərabər";
                      return (
                        <li key={d.id}>
                          <Link href={`/debat/${d.id}`} className="flex items-center justify-between gap-3 py-4 hover:text-pro">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-ink">{d.title}</p>
                              <p className="mt-1 text-[13px] text-slate-500">
                                {SIDE_LABEL[d.side]} · {d.opponentName ? `Rəqib: ${d.opponentName}` : d.opponentId ? "Real rəqib" : "Rəqib gözləyir"} ·{" "}
                                {timeAgo(d.createdAt)}
                              </p>
                            </div>
                            <Badge tone={outcome === "Qalib" ? "gold" : outcome === "Məğlub" ? "con" : "slate"}>{outcome}</Badge>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Card>

            <Card className="border-red-200 p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-con">Təhlükəli zona</h2>
              <p className="mt-2 text-[15px] text-slate-600">
                Profilini silsən, hesabın, sessiyan və RIX balın həmişəlik silinər. Qeydiyyatlı debatçı sayı, universitet və ixtisas cədvəlləri yenidən hesablanacaq.
              </p>
              <Btn variant="danger" className="mt-5" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" /> Profili sil
              </Btn>
            </Card>
          </div>
        </div>
      </Container>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Profili silmək istəyirsən?">
        <form onSubmit={doDelete} className="space-y-5">
          <p className="text-[15px] text-slate-600">
            Bu əməliyyat geri qaytarıla bilməz. Davam etmək üçün şifrəni daxil et.
          </p>
          <Field label="Şifrə">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </Field>
          <ErrorText>{deleteError}</ErrorText>
          <div className="flex justify-end gap-2">
            <Btn type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Ləğv et
            </Btn>
            <Btn type="submit" variant="danger" disabled={deleteProfile.isPending || !password}>
              {deleteProfile.isPending ? "Silinir..." : "Bəli, profilimi sil"}
            </Btn>
          </div>
        </form>
      </Modal>
    </PageShell>
  );
}

export default Profile;
