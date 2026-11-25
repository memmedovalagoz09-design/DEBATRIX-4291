import { BannerHeader } from "../components/banner-header";
import { PageShell, Container } from "../components/layout";
import { Card, Empty, LinkBtn, Spinner } from "../components/ui-kit";
import { PersonName, RankBadge } from "../components/people";
import { useLeague } from "../queries/league";
import { cn } from "@/lib/utils";

type Member = {
  userId: string;
  name: string;
  university: string;
  specialization: string;
  rix: number;
  debates: number;
  weekDebates: number;
};

type Group = {
  name: string;
  members: number;
  totalRix: number;
  debates: number;
  champion: Member | null;
};

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card className="p-6 sm:p-7">
      <h3 className="text-xl font-semibold text-ink">{title}</h3>
      {hint && <p className="mt-1 text-[14px] text-slate-500">{hint}</p>}
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function ChampionLine({ champion }: { champion: Member | null }) {
  if (!champion) return <p className="text-[14px] text-slate-400">Bu həftə kubok sahibi yoxdur</p>;
  return (
    <div className="flex items-center gap-2">
      <PersonName name={champion.name} champion />
      <span className="text-[13px] text-slate-500">{champion.weekDebates} debat bu həftə</span>
    </div>
  );
}

function GroupTable({ groups, emptyTitle }: { groups: Group[]; emptyTitle: string }) {
  if (!groups.length)
    return <Empty title={emptyTitle} text="Qeydiyyatdan keçən istifadəçilər daxil etdikləri universitet və ixtisasa görə burada qruplaşacaq." />;
  return (
    <ol className="divide-y divide-line">
      {groups.map((g, i) => (
        <li key={g.name} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-canvas text-[14px] font-bold text-slate-600">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-ink">{g.name}</p>
              <p className="text-[14px] text-slate-500">
                {g.members} debatçı · {g.debates} debat · {g.totalRix} RIX
              </p>
            </div>
          </div>
          <ChampionLine champion={g.champion} />
        </li>
      ))}
    </ol>
  );
}

function League() {
  const q = useLeague();
  if (q.isLoading) {
    return (
      <PageShell>
        <Container className="py-10">
          <Spinner />
        </Container>
      </PageShell>
    );
  }
  const data = q.data;
  const champions = new Set(data?.championIds ?? []);
  const mdu = data?.mdu;
  const hasUsers = (data?.rankings.length ?? 0) > 0;

  return (
    <PageShell>
      <Container className="py-10">
        <BannerHeader
          image="/images/banner-roundtable.jpg"
          position="center 40%"
          eyebrow="Liqa"
          title="Universitet Liqaları"
          subtitle="Reytinqlər yalnız real qeydiyyatlı istifadəçilərin RIX balına və debat sayına əsasən hesablanır. Hər həftə kubok uğrunda mübarizə gedir."
        >
          <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
            {[
              { label: "Debatçı", value: data?.rankings.length ?? 0 },
              { label: "Universitet", value: data?.universities.length ?? 0 },
              { label: "İxtisas", value: data?.specializations.length ?? 0 },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-line bg-white/90 px-4 py-3">
                <p className="text-2xl font-bold tabular-nums text-ink">{s.value}</p>
                <p className="text-[13px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </BannerHeader>

        {!hasUsers ? (
          <div className="mt-10">
            <Empty
              title="Liqa hələ boşdur"
              text="İlk debatçı olaraq qeydiyyatdan keç, universitetini və ixtisasını yaz və liqada ilk yerini tut."
              action={
                <LinkBtn to="/giris" variant="ink">
                  Qeydiyyatdan keç
                </LinkBtn>
              }
            />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Panel
              title="MDU Həftəlik Kuboku"
              hint={`Mingəçevir Dövlət Universiteti · ${mdu?.members ?? 0} debatçı`}
            >
              <div className="mb-5 rounded-2xl bg-amber-50 p-4">
                <p className="text-[13px] font-semibold uppercase tracking-wider text-gold">Həftənin çempionu</p>
                <div className="mt-2">
                  <ChampionLine champion={mdu?.champion ?? null} />
                </div>
              </div>
              {mdu && mdu.standings.length > 0 ? (
                <ol className="divide-y divide-line">
                  {mdu.standings.map((m, i) => (
                    <li key={m.userId} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-6 text-[14px] font-bold text-slate-500">{i + 1}</span>
                        <span className="truncate text-[15px] font-medium text-ink">{m.name}</span>
                      </div>
                      <span className="shrink-0 text-[14px] text-slate-500">
                        {m.weekDebates} debat · {m.rix} RIX
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <Empty title="MDU-da debatçı yoxdur" text="MDU tələbələri qeydiyyatdan keçdikdə kubok cədvəli burada açılacaq." />
              )}
            </Panel>

            <Panel title="Universitet kubokları" hint="Universitetlər RIX cəminə görə sıralanır">
              <GroupTable groups={data?.universities ?? []} emptyTitle="Universitet qrupu yoxdur" />
            </Panel>

            <Panel title="İxtisas kubokları" hint="Eyni ixtisasdan olan debatçılar bir-biri ilə yarışır">
              <GroupTable groups={data?.specializations ?? []} emptyTitle="İxtisas qrupu yoxdur" />
            </Panel>

            <Panel title="Qlobal reytinq" hint="Ən yüksək RIX balına malik debatçılar">
              <ol className="divide-y divide-line">
                {(data?.rankings ?? []).map((r, i) => (
                  <li key={r.userId} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={cn("w-7 text-[14px] font-bold", i < 3 ? "text-gold" : "text-slate-500")}>
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <PersonName name={r.name} champion={champions.has(r.userId)} className="text-[15px] font-medium text-ink" />
                        <p className="truncate text-[13px] text-slate-500">
                          {r.university} · {r.specialization}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[15px] font-semibold tabular-nums text-ink">{r.rix} RIX</span>
                      <RankBadge rix={r.rix} />
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>
        )}
      </Container>
    </PageShell>
  );
}

export default League;
