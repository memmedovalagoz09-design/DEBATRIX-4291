import * as React from "react";
import { useSearch, useLocation } from "wouter";
import { PageShell } from "../components/layout";
import { Hero } from "../components/hero";
import { GuideSection, RixSection } from "../components/guide-sections";
import { StatsBar, TopicArena, type TopicItem } from "../components/topic-grid";
import { StartDebateDialog } from "../components/start-debate-dialog";
import { CreateTopicDialog } from "../components/create-topic-dialog";
import { Container } from "../components/layout";
import { useRandomTopic } from "../queries/arena";

function Home() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [start, setStart] = React.useState<{ topic: { id: string; title: string }; side: "pro" | "con" } | null>(null);
  const random = useRandomTopic();
  const [noTopic, setNoTopic] = React.useState(false);

  React.useEffect(() => {
    if (new URLSearchParams(search).get("yeni") === "1") {
      setCreateOpen(true);
      setLocation("/", { replace: true });
    }
  }, [search, setLocation]);

  const onRandom = async () => {
    setNoTopic(false);
    const t = await random.mutateAsync();
    if (!t) setNoTopic(true);
    else setStart({ topic: t, side: "pro" });
  };

  return (
    <PageShell>
      <Hero onRandom={onRandom} randomBusy={random.isPending} />
      <Container>
        <StatsBar />
      </Container>
      {noTopic && (
        <Container className="mt-4">
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-[15px] text-gold">
            Hələ heç bir mövzu yoxdur. Əvvəlcə "Yeni Mövzu Yarat" ilə mövzu əlavə edin.
          </p>
        </Container>
      )}
      <GuideSection />
      <RixSection />
      <TopicArena onStart={(t: TopicItem, side) => setStart({ topic: { id: t.id, title: t.title }, side })} />
      <StartDebateDialog
        topic={start?.topic ?? null}
        initialSide={start?.side ?? "pro"}
        onClose={() => setStart(null)}
      />
      <CreateTopicDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </PageShell>
  );
}

export default Home;
