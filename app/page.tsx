import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="shell">
        <section className="hero">
          <div className="eyebrow">A standard for sunlight readability</div>
          <h1>See clearly.<br /><span style={{ color: "var(--orange)" }}>Even in sunlight.</span></h1>
          <p>SR is an independent certification initiative designed to help people understand how clearly a smartphone display can be viewed in bright outdoor conditions.</p>
          <div className="actions">
            <Link className="btn" href="/phones">Explore certified phones</Link>
            <Link className="btn secondary" href="/brand">For smartphone brands</Link>
          </div>
        </section>
        <section className="section" id="capabilities">
          <div className="eyebrow">How SR works</div>
          <h2>Evidence-led display certification</h2>
          <div className="cards">
            <article className="card"><h3>01 · Submit</h3><p>Brands provide device details, complete test footage and supporting evidence.</p></article>
            <article className="card"><h3>02 · Evaluate</h3><p>The SR team reviews evidence and performs a documented assessment.</p></article>
            <article className="card"><h3>03 · Certify</h3><p>After the scoring method is validated, eligible models can receive a public SR score and a unique, verifiable certificate code.</p></article>
          </div>
        </section>
      </main>
      <footer className="shell footer">© {new Date().getFullYear()} SR Certification · A Saturn Studio initiative</footer>
    </>
  );
}
