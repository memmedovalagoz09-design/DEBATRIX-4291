import { Shuffle, Eye, ShieldCheck, Globe2, GraduationCap } from "lucide-react";
import { LinkBtn, Btn } from "./ui-kit";

export function Hero({ onRandom, randomBusy }: { onRandom: () => void; randomBusy: boolean }) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[520px] max-w-[900px] rounded-full bg-gradient-to-r from-blue-100/60 via-white to-red-100/60 blur-3xl" />
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 pb-16 pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-20">
        <div className="animate-[fadeUp_0.7s_ease-out_both]">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-[13px] font-semibold tracking-wide text-violet">
            ✨ İDEYALARIN QLOBAL ARENASI
          </span>
          <h1 className="mt-6 text-5xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">DEBATRİX</h1>
          <p className="mt-2 text-xl font-semibold text-slate-500">Debate Arena</p>
          <p className="mt-6 max-w-xl text-2xl font-medium leading-snug text-ink">
            Sadəcə mübahisə etmə, <span className="text-pro">sübut et!</span>
          </p>
          <p className="mt-4 max-w-xl text-[17px] text-slate-600">
            Mövzu seç, mövqeyini seç, arqumentlərinlə qarşılaş. AI Hakim və tamaşaçılar nəticəni birlikdə müəyyən edir.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <LinkBtn to="/giris" size="lg" variant="ink">
              Debata Qoşul →
            </LinkBtn>
            <LinkBtn to="/canli" size="lg" variant="outline">
              <Eye className="size-4.5" /> Canlı Arenaları İzlə
            </LinkBtn>
            <Btn size="lg" variant="outline" onClick={onRandom} disabled={randomBusy}>
              <Shuffle className="size-4.5" /> Təsadüfi Mövzu
            </Btn>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-gold" /> AI Hakimlik
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="size-4 text-pro" /> Qlobal İcma
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="size-4 text-violet" /> Universitet Liqaları
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-white p-3 shadow-sm">
            <img
              src="/images/hero-philosophers.jpg"
              alt="Sokrat və Aristotel heykəlləri arasında parlayan mavi-qırmızı xətt"
              className="aspect-[4/3] w-full rounded-2xl object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
