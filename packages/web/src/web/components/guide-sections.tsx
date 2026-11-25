import { MessageSquare, UserPlus, Users, Eye, Trophy, Zap, Target, Star } from "lucide-react";
import { Card } from "./ui-kit";

const GUIDE = [
  {
    q: "Mən burada nə edə bilərəm?",
    a: "Mövzular üzrə real debatlar aparır, başqalarının debatlarını canlı izləyir və öz mövzunu yarada bilərsən.",
    icon: MessageSquare,
  },
  {
    q: "Necə debatçı ola bilərəm?",
    a: "Qeydiyyatdan keç, universitetini və ixtisasını yaz. Hər yeni istifadəçi 1,000 RIX ilə başlayır.",
    icon: Star,
  },
  {
    q: "Debatlara necə qoşula bilərəm?",
    a: "Bir mövzu seç, RAZISAN (PRO) və ya RAZI DEYİLSƏN (CON) tərəfini seç. AI rəqiblə və ya link ilə dəvət etdiyin real istifadəçi ilə başla.",
    icon: UserPlus,
  },
  {
    q: "Başqalarının debatlarını necə izləyə bilərəm?",
    a: "Canlı Debatlar səhifəsindən aktiv debatları aç. Tamaşaçı kimi Mind-Shift səsini verə, şərh və sual yaza bilərsən.",
    icon: Eye,
  },
];

export function GuideSection() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-pro">Başlanğıc</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">DEBATRİX nədir?</h2>
        <p className="mt-3 text-[17px] text-slate-600">
          DEBATRİX fikirlərin sınaqdan keçdiyi açıq arenadır. Hər debat üç raunddan ibarətdir və nəticəni AI Hakim ilə
          tamaşaçılar birlikdə verir.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {GUIDE.map((g) => (
          <Card key={g.q} className="p-6 transition hover:border-slate-300">
            <span className="flex size-10 items-center justify-center rounded-xl bg-canvas text-ink">
              <g.icon className="size-5" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-ink">{g.q}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{g.a}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

const RIX_STEPS = [
  {
    q: "RIX nədir?",
    a: "RIX — debatçı reytinq balıdır. Hər debatçının bal hesabı və rütbəsi var. Uğurlu debatlar RIX artırır, uduzduqda azalır.",
  },
  {
    q: "Necə hesablanır?",
    a: "Yeni qeydiyyatdan keçən hər istifadəçi 1,000 RIX ilə başlayır. Qalibiyyət +25 RIX, məğlubiyyət −15 RIX gətirir. Tamaşaçı səsi ilə düzgün tərəfi seçən hər kəs +10 Obyektiv Hakim XP qazanır.",
  },
  {
    q: "Hansı nəticələrə əsaslanır?",
    a: "3 raundlu debatın nəticəsi 50% AI Hakim + 50% İzləyici Mind-Shift ilə müəyyən edilir. Həmçinin real debat və liqa kubokundakı performans nəzərə alınır.",
  },
  {
    q: "İstifadəçi necə daha yüksək reytinq əldə edə bilər?",
    a: "Daha çox debat apar, arqumentlərini faktlarla və məntiqlə qur, rəqibin zəif nöqtələrinə cavab ver və nəzakətli üslubu qoru. Universitet liqasında həftəlik debat sayını artırmaq kubok yarışında üstünlük verir.",
  },
];

const RANKS = [
  { r: "0–999 RIX", n: "Rookie", icon: Zap, tone: "text-slate-700 bg-slate-100" },
  { r: "1,000–1,499 RIX", n: "Debater", icon: Target, tone: "text-pro bg-blue-50" },
  { r: "1,500–1,999 RIX", n: "Mindshifter", icon: Users, tone: "text-violet bg-violet-50" },
  { r: "2,000+ RIX", n: "Grandmaster", icon: Trophy, tone: "text-gold bg-amber-50" },
];

export function RixSection() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 pb-6">
      <div className="rounded-3xl border border-line bg-canvas p-6 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-gold">Reytinq</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">RIX və Reytinq Sistemi</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {RIX_STEPS.map((s) => (
            <div key={s.q} className="rounded-2xl border border-line bg-white p-6">
              <h3 className="text-lg font-semibold text-ink">{s.q}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{s.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RANKS.map((r) => (
            <div key={r.n} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
              <span className={`flex size-10 items-center justify-center rounded-xl ${r.tone}`}>
                <r.icon className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">{r.n}</p>
                <p className="text-[14px] text-slate-500">{r.r}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
