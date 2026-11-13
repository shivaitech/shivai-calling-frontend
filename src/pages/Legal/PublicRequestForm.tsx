import { useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { privacyAPI, SentByEmail, type RequestType } from "../../services/privacyAPI";
import { GRIEVANCE_OFFICER } from "../../legal/company";

const TYPES: { id: RequestType; title: string; hint: string }[] = [
  { id: "opt_out", title: "Stop calls to my number", hint: "A business called me via ShivAI" },
  { id: "access", title: "Copy of my data", hint: "What you hold about me" },
  { id: "correction", title: "Correct my data", hint: "Something is wrong" },
  { id: "erasure", title: "Erase my data", hint: "Delete what you hold" },
  { id: "grievance", title: "Complaint", hint: "Anything else" },
];

const PLACEHOLDER: Record<RequestType, string> = {
  opt_out: "Which number was called, roughly when, and anything else that helps us find the calls.",
  access: "Tell us which account or number this is about.",
  correction: "What's wrong, and what it should say.",
  erasure: "Which account, number or card should we erase?",
  grievance: "Tell us what happened.",
  nomination: "",
};

/** Data Principal requests from anyone, signed in or not: visitors and people ShivAI agents called. */
export default function PublicRequestForm() {
  const [type, setType] = useState<RequestType>("opt_out");
  const [f, setF] = useState({ name: "", email: "", phone: "", business: "", details: "" });
  const [own, setOwn] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ reference: string; mailto?: string } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.name.trim()) errs.name = "Your name, please.";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) errs.email = "An email we can reply to.";
    if (type === "opt_out" && f.phone.replace(/\D/g, "").length < 8) errs.phone = "The number that was called.";
    if (!f.details.trim() && type !== "opt_out") errs.details = "A few words, so we can help.";
    setErrors(errs);
    if (Object.keys(errs).length || !own) return;
    setSending(true);
    setFailure(null);
    try {
      const r = await privacyAPI.createPublic({
        type,
        name: f.name.trim(),
        email: f.email.trim(),
        phone: f.phone.trim() || undefined,
        business: f.business.trim() || undefined,
        details: f.details.trim() || "Please stop calls to this number and erase it.",
      });
      setDone({ reference: r.reference });
    } catch (err) {
      if (err instanceof SentByEmail) {
        window.location.href = err.mailto;
        setDone({ reference: err.request.reference, mailto: err.mailto });
      } else setFailure((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="lg-form">
        <div className="lg-done">
          <CheckCircle2 size={40} color="#059669" style={{ margin: "0 auto" }} />
          <h3>{done.mailto ? "Almost there: send the email" : "Request received"}</h3>
          <p>
            {done.mailto
              ? "We opened your email app with everything filled in. Press send and we'll take it from there."
              : `We'll acknowledge within ${GRIEVANCE_OFFICER.ackHours} hours and reply to ${f.email} within ${GRIEVANCE_OFFICER.resolveDays} days.`}
          </p>
          <span className="lg-ref">Reference {done.reference}</span>
          {done.mailto && (
            <p style={{ marginTop: 14 }}>
              <a className="lg-btn" href={done.mailto}>
                <Mail size={14} /> Open email again
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="lg-form" onSubmit={submit} noValidate>
      <h2>Make a request</h2>
      <p className="lg-form-sub">No account needed. We only use these details to handle your request.</p>

      <div className="lg-types" role="radiogroup" aria-label="Request type">
        {TYPES.map((t) => (
          <button key={t.id} type="button" role="radio" aria-checked={type === t.id} className={`lg-type${type === t.id ? " is-on" : ""}`} onClick={() => setType(t.id)}>
            {t.title}
            <small>{t.hint}</small>
          </button>
        ))}
      </div>

      <div className="lg-grid">
        <label className="lg-field">
          Full name
          <input value={f.name} onChange={set("name")} autoComplete="name" />
          {errors.name && <span className="err">{errors.name}</span>}
        </label>
        <label className="lg-field">
          Email
          <input type="email" value={f.email} onChange={set("email")} autoComplete="email" />
          {errors.email && <span className="err">{errors.email}</span>}
        </label>
        <label className="lg-field">
          Phone {type === "opt_out" ? "(the number that was called)" : "(optional)"}
          <input type="tel" value={f.phone} onChange={set("phone")} autoComplete="tel" placeholder="+91 98765 43210" />
          {errors.phone && <span className="err">{errors.phone}</span>}
        </label>
        <label className="lg-field">
          Business that contacted you (optional)
          <input value={f.business} onChange={set("business")} />
        </label>
        <label className="lg-field is-wide">
          Details {type === "opt_out" && "(optional)"}
          <textarea rows={4} value={f.details} onChange={set("details")} placeholder={PLACEHOLDER[type]} />
          {errors.details && <span className="err">{errors.details}</span>}
        </label>
      </div>

      <label className="lg-check">
        <input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} />
        <span>This request is about my own personal data, or I'm legally authorised to make it for the person concerned. We may ask you to verify this.</span>
      </label>

      {failure && <p style={{ color: "#dc2626", fontSize: 13, margin: "0 0 12px" }}>{failure}</p>}

      <button type="submit" className="lg-btn is-primary" disabled={sending || !own}>
        {sending ? <Loader2 size={14} className="animate-spin" /> : null}
        Send request
      </button>
    </form>
  );
}
