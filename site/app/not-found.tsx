import { SiteFooter } from "./_components/SiteFooter";
import { SiteHeader } from "./_components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="not-found">
        <p className="eyebrow">404 / not found</p>
        <h1>This route did not earn “delivered.”</h1>
        <p>The page is missing. The proof surface is not.</p>
        <a className="button button-primary" href="/proof/">Inspect Factory proof <span aria-hidden="true">↗</span></a>
      </main>
      <SiteFooter />
    </>
  );
}
