import * as React from "react";
import { useLocation } from "wouter";
import { PageShell, Container } from "../components/layout";
import { Card, Btn, Field, Input, ErrorText } from "../components/ui-kit";
import { useAuthMutations, useMe } from "../queries/account";
import { errorMessage } from "../lib/errors";
import { cn } from "@/lib/utils";

function Auth() {
  const [, setLocation] = useLocation();
  const { user } = useMe();
  const { register, login } = useAuthMutations();
  const [mode, setMode] = React.useState<"login" | "register">("register");
  const [error, setError] = React.useState("");
  const [form, setForm] = React.useState({
    name: "",
    university: "",
    specialization: "",
    email: "",
    password: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  React.useEffect(() => {
    if (user) setLocation("/profil");
  }, [user, setLocation]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "register") {
        await register.mutateAsync({
          name: form.name,
          university: form.university,
          specialization: form.specialization,
          email: form.email,
          password: form.password,
        });
      } else {
        await login.mutateAsync({ email: form.email, password: form.password });
      }
      setLocation("/profil");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const busy = register.isPending || login.isPending;

  return (
    <PageShell>
      <Container className="py-14">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              {mode === "register" ? "Debatçı kimi qeydiyyat" : "Xoş gəlmisən"}
            </h1>
            <p className="mt-2 text-[16px] text-slate-600">
              {mode === "register"
                ? "Hesab yarat, universitetini əlavə et və ilk debatını başlat. Başlanğıc balın 1,000 RIX-dir."
                : "Hesabına daxil ol və debatlarına davam et."}
            </p>
          </div>

          <Card className="mt-8 p-6 sm:p-8">
            <div className="grid grid-cols-2 rounded-xl bg-canvas p-1">
              {(["register", "login"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError("");
                  }}
                  className={cn(
                    "h-10 rounded-lg text-[15px] font-medium transition",
                    mode === m ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink",
                  )}
                >
                  {m === "register" ? "Qeydiyyat" : "Daxil ol"}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled
              className="mt-6 flex h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-line text-[15px] font-medium text-slate-400"
              title="Google ilə giriş hələ quraşdırılmayıb"
            >
              Google ilə davam et (tezliklə)
            </button>
            <div className="my-5 flex items-center gap-3 text-[13px] text-slate-400">
              <span className="h-px flex-1 bg-line" /> və ya e-poçt ilə <span className="h-px flex-1 bg-line" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <>
                  <Field label="Ad və soyad">
                    <Input value={form.name} onChange={set("name")} placeholder="Adın" required minLength={2} maxLength={40} />
                  </Field>
                  <Field label="Universitet" hint="Məsələn: Mingəçevir Dövlət Universiteti (MDU)">
                    <Input value={form.university} onChange={set("university")} placeholder="Universitetin adı" required minLength={2} />
                  </Field>
                  <Field label="İxtisas" hint="Məsələn: Mühəndislik, Pedaqogika, Hüquq">
                    <Input value={form.specialization} onChange={set("specialization")} placeholder="İxtisasın" required minLength={2} />
                  </Field>
                </>
              )}
              <Field label="E-poçt">
                <Input type="email" value={form.email} onChange={set("email")} placeholder="ad@mail.com" required autoComplete="email" />
              </Field>
              <Field label="Şifrə" hint={mode === "register" ? "Ən azı 6 simvol" : undefined}>
                <Input
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  required
                  minLength={mode === "register" ? 6 : 1}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                />
              </Field>
              <ErrorText>{error}</ErrorText>
              <Btn type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? "Gözləyin..." : mode === "register" ? "Hesab yarat →" : "Daxil ol →"}
              </Btn>
            </form>
          </Card>
        </div>
      </Container>
    </PageShell>
  );
}

export default Auth;
