import { PageShell, Container } from "../components/layout";
import { LinkBtn } from "../components/ui-kit";

export function NotFound() {
  return (
    <PageShell>
      <Container className="py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">404</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">Səhifə tapılmadı</h1>
        <p className="mt-3 text-[15px] text-slate-500">Axtardığınız səhifə mövcud deyil və ya köçürülüb.</p>
        <div className="mt-8 flex justify-center">
          <LinkBtn to="/" variant="ink">
            Arenaya qayıt
          </LinkBtn>
        </div>
      </Container>
    </PageShell>
  );
}
