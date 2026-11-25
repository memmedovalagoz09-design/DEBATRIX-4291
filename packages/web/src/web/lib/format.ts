export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "indicə";
  if (m < 60) return `${m} dəq əvvəl`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat əvvəl`;
  const d = Math.floor(h / 24);
  return `${d} gün əvvəl`;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const SIDE_LABEL = {
  pro: "RAZISAN (PRO)",
  con: "RAZI DEYİLSƏN (CON)",
} as const;

export const REACTION_LABEL = {
  guclu_fakt: "Güclü Fakt",
  mantiq_xetasi: "Məntiq Xətası",
  emosional: "Emosional",
  movzudan_yayindi: "Mövzudan Yayındı",
} as const;

export const AI_OPPONENTS = [
  { key: "socrates", name: "Sokrat", desc: "Sokratik metod: suallar və fərziyyələrin sınağı." },
  { key: "aristotle", name: "Aristotel", desc: "Sistemli məntiq, silogizmlər və təsnifat." },
  { key: "champion", name: "Sərt Debat Çempionu", desc: "Sərt və sürətli təkzib." },
] as const;
