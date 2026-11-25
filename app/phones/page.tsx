import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ q?: string }>;

export default async function Phones({ searchParams }: { searchParams: SearchParams }) {
  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 80);
  let rows: Array<{
    sr_code: string;
    score: number;
    issued_at: string;
    expires_at: string | null;
    manufacturer: string | null;
    model_name: string | null;
    model_number: string | null;
    release_date: string | null;
    brand_name: string;
    public_summary: string | null;
  }> = [];
  let unavailable = false;

  try {
    const supabase = await createClient();
    let request = supabase
      .from("public_certificate_directory")
      .select("sr_code,score,issued_at,expires_at,manufacturer,model_name,model_number,release_date,brand_name,public_summary")
      .order("issued_at", { ascending: false })
      .limit(50);

    if (query) {
      const pattern = `%${query.replace(/[,%_\\\\]/g, "")}%`;
      if (query.toUpperCase().startsWith("SR-")) {
        request = request.ilike("sr_code", pattern);
      } else {
        request = request.ilike("model_name", pattern);
      }
    }

    const { data, error } = await request;
    if (error) throw error;
    rows = data ?? [];
  } catch {
    unavailable = true;
  }

  return (
    <main className="shell dashboard">
      <Link className="logo" href="/">SR<span>.</span></Link>
      <div className="eyebrow" style={{ marginTop: 55 }}>Public certificate registry</div>
      <h1>Find an SR-certified phone</h1>
      <p className="muted">Search active certificates by phone model or SR certificate code. Results are limited to published, active records.</p>
      <form method="get" className="card" style={{ maxWidth: 720, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <label htmlFor="q" className="sr-only">Phone model or SR code</label>
        <input id="q" name="q" type="search" defaultValue={query} placeholder="e.g. SR-12345 or phone model" maxLength={80} style={{ flex: "1 1 260px" }} />
        <button className="btn" type="submit">Search registry</button>
        {query && <Link className="btn secondary" href="/phones">Clear</Link>}
      </form>

      {unavailable ? (
        <section className="card section">
          <h2>Registry temporarily unavailable</h2>
          <p className="muted">The public certificate database is not connected yet. Please try again later.</p>
        </section>
      ) : rows.length === 0 ? (
        <section className="card section">
          <h2>{query ? "No matching active certificates" : "No certified devices published yet"}</h2>
          <p className="muted">{query ? "Check the model spelling or certificate code. Suspended, revoked and expired certificates are not shown as active." : "When the first device completes the independent review process, its public verification record will appear here."}</p>
        </section>
      ) : (
        <section className="section">
          <p className="muted">{rows.length} active certificate{rows.length === 1 ? "" : "s"} found</p>
          <div className="cards">
            {rows.map((row) => (
              <article className="card" key={row.sr_code}>
                <div className="eyebrow">{row.sr_code}</div>
                <h2>{row.manufacturer ?? row.brand_name} {row.model_name ?? "Device"}</h2>
                {row.model_number && <p className="muted">Model number: {row.model_number}</p>}
                <p className="muted">Certified brand: {row.brand_name}</p>
                <p className="muted">Issued: {new Date(row.issued_at).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" })}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <strong style={{ color: "var(--orange)", fontSize: 32 }}>{row.score}</strong>
                  <span className="muted">/ 100 SR score</span>
                </div>
                {row.public_summary && <p>{row.public_summary}</p>}
                {row.expires_at && <p className="muted">Valid until: {new Date(row.expires_at).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" })}</p>}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
