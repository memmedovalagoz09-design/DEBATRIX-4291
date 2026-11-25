import { BannerHeader } from "../components/banner-header";
import { DebateCard } from "../components/debate-card";
import { Empty, LinkBtn, Spinner } from "../components/ui-kit";
import { PageShell, Container } from "../components/layout";
import { useDebateList } from "../queries/debates";

function Section({
  title,
  hint,
  status,
  empty,
}: {
  title: string;
  hint: string;
  status: "live" | "waiting" | "completed";
  empty: { title: string; text: string };
}) {
  const q = useDebateList(status);
  const items = q.data ?? [];
  return (
    <section className="mt-12">
      <div className="flex flex-col gap-1">
        <h3 className="text-2xl font-bold tracking-tight text-ink">{title}</h3>
        <p className="text-[15px] text-slate-500">{hint}</p>
      </div>
      <div className="mt-6">
        {q.isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <Empty
            title={empty.title}
            text={empty.text}
            action={
              <LinkBtn to="/" variant="ink">
                Arenaya keç
              </LinkBtn>
            }
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((d) => (
              <DebateCard key={d.id} d={d} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Live() {
  return (
    <PageShell>
      <Container className="py-10">
        <BannerHeader
          image="/images/banner-courtroom.jpg"
          position="center 30%"
          eyebrow="Tamaşaçı rejimi"
          title="Canlı Debatlar"
          subtitle="Hal-hazırda gedən debatları izlə, Mind-Shift səsini ver və şərh yaz. Açıq dəvətləri qəbul edib öz debatını başlat."
        />
        <Section
          title="Canlı"
          hint="Hal-hazırda davam edən debatlar"
          status="live"
          empty={{
            title: "Hal-hazırda canlı debat yoxdur",
            text: "Bir mövzu seçib debata başla. Canlı olan debatlar burada görünəcək.",
          }}
        />
        <Section
          title="Açıq dəvət"
          hint="Rəqib gözləyən debatlar. Linki qəbul edərək qoşula bilərsən."
          status="waiting"
          empty={{
            title: "Açıq dəvət yoxdur",
            text: "Real istifadəçini dəvət etmək üçün debat yarat və yaranan linki paylaş.",
          }}
        />
        <Section
          title="Tamamlanmış"
          hint="AI Hakimin qərar verdiyi son debatlar"
          status="completed"
          empty={{
            title: "Hələ tamamlanmış debat yoxdur",
            text: "Debat üç raund davam edib bitdikdə nəticə və AI Hakim qərarı burada görünəcək.",
          }}
        />
      </Container>
    </PageShell>
  );
}

export default Live;
