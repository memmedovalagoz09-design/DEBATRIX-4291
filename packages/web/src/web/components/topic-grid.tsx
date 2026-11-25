import * as React from "react";
import { Search, Radio, Flame } from "lucide-react";
import { Card, Badge, Empty, Input, Spinner, LinkBtn } from "./ui-kit";
import { useCategories, useTopics, useArenaStats } from "../queries/arena";
import { cn } from "@/lib/utils";

export type TopicItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  debateCount: number;
  liveCount: number;
};

export function StatsBar() {
  const { data } = useArenaStats();
  const items = [
    { label: "Qeydiyyatlı debatçı", value: data?.registered },
    { label: "Canlı debat", value: data?.live },
    { label: "Tamamlanmış debat", value: data?.completed },
    { label: "Təmsil olunan universitet", value: data?.universities },
  ];
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-sm lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="bg-white px-5 py-5 sm:px-6">
          <p className="text-3xl font-bold tabular-nums text-ink">{it.value ?? 0}</p>
          <p className="mt-1 text-[14px] text-slate-500">{it.label}</p>
        </div>
      ))}
    </div>
  );
}

export function TopicArena({
  onStart,
}: {
  onStart: (topic: TopicItem, side: "pro" | "con") => void;
}) {
  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState("Hamısı");
  const cats = useCategories();
  const topics = useTopics(q, category);
  const list = (topics.data ?? []) as TopicItem[];

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16" id="arena">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-pro">Arena</p>
        <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Bir mövzu seç. Mövqeyini göstər.</h2>
        <p className="text-[17px] text-slate-600">Hər sual yeni bir baxış bucağıdır. Sənin arqumentin nədir?</p>
      </div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Mövzu axtar..."
            className="pl-10"
            aria-label="Mövzu axtar"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["Hamısı", ...(cats.data ?? [])].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full border px-4 py-2 text-[14px] font-medium transition",
              category === c
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-slate-600 hover:border-slate-300 hover:text-ink",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {topics.isLoading ? (
          <Spinner />
        ) : list.length === 0 ? (
          <Empty
            title={q || category !== "Hamısı" ? "Bu filtrə uyğun mövzu tapılmadı" : "Hələ mövzu yoxdur"}
            text={
              q || category !== "Hamısı"
                ? "Axtarışı və ya kateqoriyanı dəyişin, ya da yeni mövzu yaradın."
                : "İlk mövzunu sən yarat və debatı başlat. Mövzu yaradıldıqdan sonra burada görünəcək."
            }
            action={
              <LinkBtn to="/?yeni=1" variant="ink">
                Yeni Mövzu Yarat
              </LinkBtn>
            }
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {list.map((t) => (
              <TopicCard key={t.id} topic={t} onStart={onStart} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TopicCard({ topic, onStart }: { topic: TopicItem; onStart: TopicArenaProps["onStart"] }) {
  return (
    <Card className="flex flex-col p-6 transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <Badge tone="violet">{topic.category}</Badge>
        {topic.liveCount > 0 && (
          <Badge tone="live">
            <Radio className="size-3.5" /> {topic.liveCount} canlı
          </Badge>
        )}
      </div>
      <h3 className="mt-4 text-[19px] font-semibold leading-snug text-ink">{topic.title}</h3>
      {topic.description && <p className="mt-2 line-clamp-3 text-[15px] text-slate-600">{topic.description}</p>}
      <p className="mt-4 flex items-center gap-1.5 text-[14px] text-slate-500">
        <Flame className="size-4" /> {topic.debateCount} debat
      </p>
      <div className="mt-auto grid grid-cols-2 gap-2.5 pt-6">
        <button
          onClick={() => onStart(topic, "pro")}
          className="h-11 rounded-xl bg-pro px-3 text-[14px] font-semibold text-white transition hover:bg-blue-700"
        >
          RAZISAN (PRO)
        </button>
        <button
          onClick={() => onStart(topic, "con")}
          className="h-11 rounded-xl bg-con px-3 text-[14px] font-semibold text-white transition hover:bg-red-700"
        >
          RAZI DEYİLSƏN (CON)
        </button>
      </div>
    </Card>
  );
}

type TopicArenaProps = { onStart: (topic: TopicItem, side: "pro" | "con") => void };
