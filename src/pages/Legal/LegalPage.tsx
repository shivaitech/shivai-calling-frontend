import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Printer, ShieldCheck } from "lucide-react";
import SEO from "../../components/SEO";
import ShivaiLogo from "../../resources/images/ShivaiLogo.svg";
import { LEGAL_DOCS, LEGAL_ORDER } from "../../legal/documents";
import { BRAND, GRIEVANCE_OFFICER, LEGAL_ENTITY, LEGAL_PATHS, POLICY_EFFECTIVE, POLICY_VERSION, type LegalDocId } from "../../legal/company";
import { openCookieSettings } from "../../legal/consent";
import PublicRequestForm from "./PublicRequestForm";
import "./legal.css";

const SLUG_TO_ID: Record<string, LegalDocId> = Object.fromEntries(
  (Object.entries(LEGAL_PATHS) as [LegalDocId, string][]).map(([id, path]) => [path.split("/").pop()!, id]),
);

/** /legal/:doc — Privacy Notice, Terms, Cookies, DPA, Calling rules, Grievance Redressal. */
export default function LegalPage() {
  const { doc: slug = "privacy" } = useParams();
  const id = SLUG_TO_ID[slug];
  const doc = id ? LEGAL_DOCS[id] : null;
  const [active, setActive] = useState<string>("");

  // Highlight the section being read in the contents rail.
  useEffect(() => {
    if (!doc) return;
    const els = doc.sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-90px 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [doc]);

  if (!doc || !id) return <Navigate to={LEGAL_PATHS.privacy} replace />;

  return (
    <div className="lg">
      <SEO title={`${doc.title} | ${BRAND}`} description={doc.summary.slice(0, 155)} path={LEGAL_PATHS[id]} />

      <header className="lg-top">
        <div className="lg-top-in">
          <Link to="/" aria-label={`${BRAND} home`}>
            <img src={ShivaiLogo} alt={BRAND} />
          </Link>
          <div className="lg-top-links">
            <a className="lg-btn" href={`mailto:${GRIEVANCE_OFFICER.email}`}>
              Contact privacy team
            </a>
          </div>
        </div>
      </header>

      <section className="lg-hero">
        <div className="lg-hero-in">
          <span className="lg-eyebrow">
            <ShieldCheck size={14} /> Legal · DPDP Act, 2023
          </span>
          <h1>{doc.title}</h1>
          <div className="lg-meta">
            Effective {POLICY_EFFECTIVE} · Version {POLICY_VERSION} · {LEGAL_ENTITY}
          </div>
          <nav className="lg-tabs" aria-label="Legal documents">
            {LEGAL_ORDER.map((d) => (
              <Link key={d} to={LEGAL_PATHS[d]} className={`lg-tab${d === id ? " is-on" : ""}`} aria-current={d === id ? "page" : undefined}>
                {LEGAL_DOCS[d].title}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <main className="lg-main">
        <article className="lg-doc">
          <p className="lg-summary">{doc.summary}</p>
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="lg-section">
              <h2>{s.heading}</h2>
              <div className="lg-prose">{s.body}</div>
            </section>
          ))}
          {id === "grievance" && <PublicRequestForm />}
        </article>

        <aside className="lg-toc" aria-label="On this page">
          <div className="lg-toc-h">On this page</div>
          {doc.sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className={active === s.id ? "is-on" : ""}>
              {s.heading.replace(/^\d+\.\s*/, "")}
            </a>
          ))}
          <div className="lg-toc-actions">
            <button type="button" className="lg-btn" onClick={() => window.print()}>
              <Printer size={14} /> Print or save as PDF
            </button>
            {id !== "grievance" && (
              <Link className="lg-btn" to={LEGAL_PATHS.grievance}>
                Make a privacy request
              </Link>
            )}
          </div>
        </aside>
      </main>

      <footer className="lg-foot">
        <div className="lg-foot-in">
          <span>
            © {new Date().getFullYear()} {LEGAL_ENTITY}
          </span>
          <span style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <Link to={LEGAL_PATHS.privacy}>Privacy</Link>
            <Link to={LEGAL_PATHS.terms}>Terms</Link>
            <button type="button" onClick={openCookieSettings}>
              Cookie settings
            </button>
            <Link to={LEGAL_PATHS.grievance}>Grievances</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
