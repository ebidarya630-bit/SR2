import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const steps = [
  { n: "01", title: "Submit", text: "A manufacturer submits its phone details and complete display-test evidence." },
  { n: "02", title: "Evaluate", text: "The SR team reviews the evidence against a documented, repeatable test method." },
  { n: "03", title: "Certify", text: "Approved devices receive a public score and a verifiable SR certificate." },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero shell">
          <div className="hero-copy">
            <div className="eyebrow"><span className="status-dot" /> INDEPENDENT DISPLAY READABILITY STANDARD</div>
            <h1>Clarity that<br /><span>stands in the sun.</span></h1>
            <p className="hero-lead">A clearer way to compare how smartphone displays perform in bright outdoor conditions.</p>
            <div className="actions">
              <Link className="btn" href="/phones">Explore phone registry <span aria-hidden="true">↗</span></Link>
              <Link className="text-link" href="/brand">For manufacturers <span aria-hidden="true">→</span></Link>
            </div>
            <div className="hero-note"><span className="note-line" /> Evidence-led. Transparent. Built for everyone.</div>
          </div>
          <div className="hero-visual" aria-label="SR sunlight readability emblem">
            <div className="sun-orbit orbit-one" /><div className="sun-orbit orbit-two" />
            <div className="sun-core"><span>SR</span><small>READABILITY</small></div>
            <div className="orbit-label label-top">OUTDOOR VISIBILITY</div>
            <div className="orbit-label label-bottom">A STANDARD IN PROGRESS</div>
          </div>
        </section>

        <section className="trust-strip">
          <div className="shell trust-inner"><span>ONE CLEAR PURPOSE</span><strong>Measure what people actually see.</strong><span>SMARTPHONE DISPLAY CERTIFICATION</span></div>
        </section>

        <section className="shell section" id="standard">
          <div className="section-heading">
            <div><div className="eyebrow">THE SR METHOD</div><h2>From real-world evidence<br />to a clearer standard.</h2></div>
            <p>SR aims to make outdoor screen readability easier to understand through documented testing, careful review and public verification.</p>
          </div>
          <div className="process-grid">
            {steps.map((step) => <article className="process-card" key={step.n}><span className="step-number">{step.n}</span><div className="step-mark" aria-hidden="true">{step.n === "01" ? "↗" : step.n === "02" ? "⌕" : "✓"}</div><h3>{step.title}</h3><p>{step.text}</p></article>)}
          </div>
        </section>

        <section className="shell registry-callout">
          <div><div className="eyebrow">PUBLIC REGISTRY</div><h2>Find a certified device.</h2><p>Search published SR certificates by manufacturer, phone model or certificate code.</p></div>
          <Link className="btn btn-light" href="/phones">Open phone registry <span aria-hidden="true">↗</span></Link>
        </section>

        <section className="shell brand-section">
          <div className="brand-panel"><div className="brand-copy"><div className="eyebrow">FOR PHONE BRANDS</div><h2>Bring your display<br />into the light.</h2><p>Register your organization, complete brand verification and submit devices for SR assessment.</p><Link className="btn" href="/brand">Open brand portal <span aria-hidden="true">→</span></Link></div><div className="brand-art" aria-hidden="true"><div className="device-frame"><div className="device-glow" /><div className="device-screen"><span>SR</span><small>DISPLAY TEST</small></div></div></div></div>
        </section>
      </main>
      <footer className="shell footer"><Link className="footer-logo" href="/">SR<span>.</span></Link><span>Independent sunlight readability certification</span><span>© {new Date().getFullYear()} SR Certification</span></footer>
    </>
  );
}
