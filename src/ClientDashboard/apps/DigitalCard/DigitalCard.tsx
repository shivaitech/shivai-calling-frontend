import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";
import CardView from "./CardView";
import { CardData, emptyCard, SOCIAL_TYPES, SocialType } from "./types";
import { optimizePhoto } from "./photo";
import { changeType, finalizeUrl, fromUrlInput, fromUsernameInput, USERNAME_PLACEHOLDER } from "./socialLinks";
import { useAgent } from "../../../contexts/AgentContext";
import { agentAPI } from "../../../services/agentAPI";
import {
  BusinessCard,
  BusinessCardError,
  businessCardAPI,
  Pagination,
  publicCardUrl,
  toPayload,
} from "../../../services/businessCardAPI";
import "./digitalCard.css";

const DRAFT_KEY = "shivai-digital-card-new-draft";
const PAGE_SIZE = 10;

// ── Card cache (list responses + saves) so the editor / share views can open
// a card by id. There is no GET /business-cards/:id, only the list. ──────────
const cardCache = new Map<string, BusinessCard>();

async function findCard(id: string): Promise<BusinessCard> {
  const hit = cardCache.get(id);
  if (hit) return hit;
  let page = 1;
  for (;;) {
    const { cards, pagination } = await businessCardAPI.list({ page, limit: 100, sortBy: "updatedAt", sortOrder: "desc" });
    cards.forEach((c) => cardCache.set(c._id, c));
    if (cardCache.has(id)) return cardCache.get(id)!;
    if (page >= pagination.totalPages) throw new BusinessCardError("Business card not found", 404);
    page++;
  }
}

const fromCard = (c: BusinessCard): CardData => ({
  full_name: c.full_name ?? "",
  job_title: c.job_title ?? "",
  company_name: c.company_name ?? "",
  tagline: c.tagline ?? "",
  image_url: c.image_url ?? "",
  color_code: c.color_code || "#161616",
  country_code: c.country_code ?? "",
  phone_number: c.phone_number ?? "",
  is_whatsapp_number: !!c.is_whatsapp_number,
  email: c.email ?? "",
  website: c.website ?? "",
  social_media: (c.social_media ?? []).map((s) => ({ type: s.type, url: s.url ?? "", username: s.username ?? "" })),
  ventures: (c.ventures ?? []).map((v) => ({ name: v.name ?? "", logo_url: v.logo_url ?? "", url: v.url ?? "" })),
  agent_id: c.agent_id ?? "",
});

const loadDraft = (): CardData => {
  try {
    const s = localStorage.getItem(DRAFT_KEY);
    if (s) {
      const d = { ...emptyCard(), ...JSON.parse(s) } as CardData;
      // Drafts saved by an earlier version were pre-filled with a demo profile — start blank instead.
      if (d.full_name === "Alex Morgan" && d.company_name === "Acme Studio") return emptyCard();
      return d;
    }
  } catch {
    /* storage unavailable */
  }
  return emptyCard();
};

/** Mirrors the API's Joi rules so most mistakes are caught before the request. */
function validate(f: CardData): Record<string, string> {
  const e: Record<string, string> = {};
  const name = f.full_name.trim();
  if (!name) e.full_name = "Full name is required";
  else if (name.length < 2) e.full_name = "Full name must be at least 2 characters";
  else if (name.length > 100) e.full_name = "Full name must be at most 100 characters";
  if (!f.job_title.trim()) e.job_title = "Job title is required";
  else if (f.job_title.trim().length > 150) e.job_title = "Job title must be at most 150 characters";
  if (!f.company_name.trim()) e.company_name = "Company name is required";
  else if (f.company_name.trim().length > 150) e.company_name = "Company name must be at most 150 characters";
  if (f.tagline.length > 300) e.tagline = "Tagline must be at most 300 characters";
  if (f.image_url.length > 500) e.image_url = "Image URL must be at most 500 characters";
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(f.color_code)) e.color_code = "Color code must be a hex color such as #ffffff";
  if (f.country_code.length > 8) e.country_code = "Max 8 characters";
  if (f.phone_number.length > 20) e.phone_number = "Max 20 characters";
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Enter a valid email";
  if (f.website.length > 500) e.website = "Website must be at most 500 characters";
  f.social_media.forEach((s, i) => {
    if (s.url.length > 500) e[`social_media.${i}.url`] = "Max 500 characters";
    if (s.username.length > 100) e[`social_media.${i}.username`] = "Max 100 characters";
  });
  f.ventures.forEach((v, i) => {
    if (!v.name.trim()) e[`ventures.${i}.name`] = "Venture name is required";
    if (v.url.length > 500) e[`ventures.${i}.url`] = "Max 500 characters";
    if (v.logo_url.length > 500) e[`ventures.${i}.logo_url`] = "Max 500 characters";
  });
  return e;
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="err">{error}</small>}
    </label>
  );
}

const patchAt = <T,>(arr: T[], i: number, patch: Partial<T>) => arr.map((x, j) => (j === i ? { ...x, ...patch } : x));

const initials = (n: string) => n.split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase();

// ═════════════════════════════════════════════════════════════════════════════
export default function DigitalCard({ section = "cards" }: { section?: string }) {
  const [params, setParams] = useSearchParams();
  const id = params.get("id");

  const go = useCallback(
    (sec: string, cardId?: string | null) => {
      const next = new URLSearchParams(params);
      next.set("section", sec);
      if (cardId) next.set("id", cardId);
      else next.delete("id");
      setParams(next);
    },
    [params, setParams],
  );

  return (
    <div className="dc">
      {section === "share" ? (
        <SharePanel key={id ?? "none"} id={id} go={go} />
      ) : section === "card" ? (
        <CardEditor key={id ?? "new"} id={id || "new"} go={go} />
      ) : (
        <CardsList go={go} />
      )}
    </div>
  );
}

// ── My Cards ─────────────────────────────────────────────────────────────────
function CardsList({ go }: { go: (s: string, id?: string | null) => void }) {
  const [page, setPage] = useState(1);
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [pg, setPg] = useState<Pagination | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState<BusinessCardError | null>(null);

  const load = useCallback(() => {
    setState("loading");
    businessCardAPI
      .list({ page, limit: PAGE_SIZE, sortBy: "updatedAt", sortOrder: "desc" })
      .then(({ cards, pagination }) => {
        cards.forEach((c) => cardCache.set(c._id, c));
        setCards(cards);
        setPg(pagination);
        setState("ok");
      })
      .catch((e: BusinessCardError) => {
        setError(e);
        setState("error");
      });
  }, [page]);

  useEffect(load, [load]);

  const copy = async (slug: string) => {
    await navigator.clipboard.writeText(publicCardUrl(slug));
    toast.success("Link copied");
  };

  return (
    <div className="stackv">
      <div className="head">
        <div>
          <h2 className="title">My cards</h2>
          <p className="muted">Each card gets its own public link and QR code.</p>
        </div>
        <button className="btn" onClick={() => go("card", null)}>+ New card</button>
      </div>

      {state === "loading" && <p className="muted">Loading cards…</p>}

      {state === "error" && (
        <section className="panel">
          <p className="err">
            {error?.status === 403
              ? "Your account type can’t manage business cards. Only admin and tenant accounts can."
              : error?.message || "Couldn’t load your cards."}
          </p>
          {error?.status !== 403 && <button className="btn small" onClick={load}>Retry</button>}
        </section>
      )}

      {state === "ok" && cards.length === 0 && (
        <section className="panel empty">
          <h3>No cards yet</h3>
          <p className="muted">Create your first digital business card and share it in seconds.</p>
          <button className="btn small" onClick={() => go("card", null)}>Create a card</button>
        </section>
      )}

      {state === "ok" &&
        cards.map((c) => (
          <section className="panel listrow" key={c._id}>
            <div className="avatar">
              {c.image_url ? <img src={c.image_url} alt="" onError={(e) => (e.currentTarget.style.display = "none")} /> : initials(c.full_name)}
            </div>
            <div className="grow">
              <strong>{c.full_name}</strong>
              <div className="muted">{[c.job_title, c.company_name].filter(Boolean).join(" · ")}</div>
              <a className="slug" href={publicCardUrl(c.slug)} target="_blank" rel="noopener noreferrer">/card/{c.slug}</a>
            </div>
            <div className="btns">
              <button className="btn small ghost" onClick={() => go("card", c._id)}>Edit</button>
              <button className="btn small ghost" onClick={() => go("share", c._id)}>Share</button>
              <button className="btn small ghost" onClick={() => copy(c.slug)}>Copy link</button>
            </div>
          </section>
        ))}

      {pg && pg.totalPages > 1 && (
        <div className="pager">
          <button className="btn small ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="muted">Page {pg.page} of {pg.totalPages} · {pg.total} cards</span>
          <button className="btn small ghost" disabled={page >= pg.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

// ── Editor ───────────────────────────────────────────────────────────────────
function CardEditor({ id, go }: { id: string; go: (s: string, id?: string | null) => void }) {
  const isNew = id === "new";
  const { agents, isLoading: agentsLoading, refreshAgents } = useAgent();
  const [load, setLoad] = useState<"loading" | "ready" | "missing" | "forbidden">(isNew ? "ready" : "loading");
  const [saved, setSaved] = useState<BusinessCard | null>(null);
  const [form, setForm] = useState<CardData>(() => (isNew ? loadDraft() : emptyCard()));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [oldSlug, setOldSlug] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<CardData>) => setForm((f) => ({ ...f, ...patch }));
  const err = (k: string) => errors[k];

  // AgentProvider only auto-loads on agent-related routes (not /app/*).
  useEffect(() => {
    if (agents.length === 0) refreshAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isNew) return;
    let live = true;
    findCard(id)
      .then((c) => {
        if (!live) return;
        setSaved(c);
        setForm(fromCard(c));
        setLoad("ready");
      })
      .catch((e: BusinessCardError) => live && setLoad(e.status === 403 ? "forbidden" : "missing"));
    return () => {
      live = false;
    };
  }, [id, isNew]);

  // Keep the not-yet-saved card as a local draft.
  useEffect(() => {
    if (!isNew) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* ignore */
    }
  }, [form, isNew]);

  const onUpload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await agentAPI.uploadLogo(await optimizePhoto(file));
      const url = res?.logo_url || res?.url || res?.data?.logo_url || res?.data?.url || res?.data?.data?.logo_url;
      if (!url) throw new Error("Upload succeeded but no URL was returned.");
      set({ image_url: url });
      toast.success("Photo uploaded");
    } catch (e: any) {
      toast.error(e?.message || "Couldn’t upload the photo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submit = async () => {
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return toast.error("Fix the highlighted fields");
    setSaving(true);
    try {
      if (isNew) {
        const card = await businessCardAPI.create(form);
        cardCache.set(card._id, card);
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        toast.success("Card created");
        go("share", card._id);
      } else {
        const card = await businessCardAPI.update(id, toPayload(form));
        cardCache.set(card._id, card);
        if (saved && card.slug !== saved.slug) setOldSlug(saved.slug);
        setSaved(card);
        setErrors({});
        toast.success("Card updated");
      }
    } catch (e: any) {
      const be = e as BusinessCardError;
      if (be.status === 404 && !isNew) {
        cardCache.delete(id);
        setLoad("missing");
      } else {
        if (be.status === 422) setErrors(be.fieldErrors);
        toast.error(be.message || "Couldn’t save the card");
      }
    } finally {
      setSaving(false);
    }
  };

  if (load === "loading") return <p className="muted">Loading card…</p>;
  if (load === "forbidden")
    return <section className="panel"><p className="err">Your account type can’t manage business cards. Only admin and tenant accounts can.</p></section>;
  if (load === "missing")
    return (
      <section className="panel empty">
        <h3>This card is no longer available</h3>
        <p className="muted">It may have been removed, or it belongs to another account.</p>
        <button className="btn small" onClick={() => go("cards", null)}>Back to my cards</button>
      </section>
    );

  const agentKnown = agents.some((a) => a.id === form.agent_id);

  return (
    <div className="grid">
      <div className="form">
        {!isNew && saved && (
          <section className="panel notice">
            <div className="muted">Public link</div>
            <a href={publicCardUrl(saved.slug)} target="_blank" rel="noopener noreferrer" className="slug">{publicCardUrl(saved.slug)}</a>
            {oldSlug && (
              <small className="warn">Your name or company changed, so the link changed too. The old link (/card/{oldSlug}) no longer works — re-share the new one.</small>
            )}
            <div className="btns"><button className="btn small ghost" onClick={() => go("share", saved._id)}>Share & QR</button></div>
          </section>
        )}

        <section className="panel">
          <h3>Basics</h3>
          <Field label="Full name *" error={err("full_name")}>
            <input value={form.full_name} placeholder="Enter your full name" onChange={(e) => set({ full_name: e.target.value })} />
          </Field>
          <div className="row">
            <Field label="Job title *" error={err("job_title")}>
              <input value={form.job_title} placeholder="Enter your job title" onChange={(e) => set({ job_title: e.target.value })} />
            </Field>
            <Field label="Company *" error={err("company_name")}>
              <input value={form.company_name} placeholder="Enter your company name" onChange={(e) => set({ company_name: e.target.value })} />
            </Field>
          </div>
          <small>Your public link is built from your name and company (like /card/your-name-your-company). Changing either one later changes the link.</small>
          <Field label="Tagline" error={err("tagline")}>
            <input value={form.tagline} placeholder="A short line about what you do (optional)" onChange={(e) => set({ tagline: e.target.value })} />
          </Field>
          <Field label="Photo" error={err("image_url")}>
            <div className="photo-row">
              <input value={form.image_url} placeholder="Paste an image link, or upload a photo" onChange={(e) => set({ image_url: e.target.value })} />
              <button type="button" className="btn small" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? "Uploading…" : "Upload"}</button>
              <input ref={fileRef} hidden type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0])} />
              {form.image_url && <button type="button" className="btn small ghost" onClick={() => set({ image_url: "" })}>Remove</button>}
            </div>
          </Field>
          <Field label="Accent color" error={err("color_code")}>
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(form.color_code) ? form.color_code : "#161616"} onChange={(e) => set({ color_code: e.target.value })} className="color" />
          </Field>
        </section>

        <section className="panel">
          <h3>Contact</h3>
          <div className="row phone">
            <Field label="Code" error={err("country_code")}>
              <input className="w-cc" value={form.country_code} placeholder="Code" onChange={(e) => set({ country_code: e.target.value })} />
            </Field>
            <Field label="Phone" error={err("phone_number")}>
              <input value={form.phone_number} placeholder="Enter your phone number" inputMode="tel" onChange={(e) => set({ phone_number: e.target.value })} />
            </Field>
          </div>
          <label className="chk"><input type="checkbox" checked={form.is_whatsapp_number} onChange={(e) => set({ is_whatsapp_number: e.target.checked })} />This number is on WhatsApp</label>
          <Field label="Email" error={err("email")}>
            <input type="email" value={form.email} placeholder="Enter your email address" onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Website" error={err("website")}>
            <input value={form.website} placeholder="Paste your website link" onChange={(e) => set({ website: e.target.value })} />
          </Field>
        </section>

        <section className="panel">
          <h3>My AI <small>Optional — you can add it later</small></h3>
          <Field label="AI agent" error={err("agent_id")}>
            <select value={form.agent_id} onChange={(e) => set({ agent_id: e.target.value })}>
              <option value="">{agentsLoading && agents.length === 0 ? "Loading agents…" : "No agent — add later"}</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}{a.status !== "Published" ? " (not published)" : ""}</option>
              ))}
              {form.agent_id && !agentKnown && <option value={form.agent_id}>{form.agent_id}</option>}
            </select>
          </Field>
          <small>If you pick one, a “My AI” button on your card opens it. Leave it empty and the button is simply hidden.</small>
          {agents.length === 0 && !agentsLoading && <small>You don’t have any AI employees yet — you can create one later and come back to add it.</small>}
        </section>

        <section className="panel">
          <h3>Social links <small>Type a username or paste a link — the other fills in automatically</small></h3>
          {form.social_media.map((s, i) => (
            <div className="stack" key={i}>
              <div className="row">
                <select className="w-type" value={s.type} onChange={(e) => { const type = e.target.value as SocialType; set({ social_media: patchAt(form.social_media, i, { type, ...changeType(type, s) }) }); }}>
                  {SOCIAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input value={s.username} placeholder={USERNAME_PLACEHOLDER[s.type]} onChange={(e) => set({ social_media: patchAt(form.social_media, i, fromUsernameInput(s.type, e.target.value)) })} />
                <button className="x" aria-label="Remove link" onClick={() => set({ social_media: form.social_media.filter((_, j) => j !== i) })}>×</button>
              </div>
              <input
                value={s.url}
                placeholder="…or paste the profile link — we’ll fill in the username"
                onChange={(e) => set({ social_media: patchAt(form.social_media, i, fromUrlInput(s.type, e.target.value, s)) })}
                onBlur={(e) => { const fixed = finalizeUrl(s.type, e.target.value); if (fixed) set({ social_media: patchAt(form.social_media, i, fixed) }); }}
              />
              {(err(`social_media.${i}.url`) || err(`social_media.${i}.username`) || err(`social_media.${i}.type`)) && (
                <small className="err">{err(`social_media.${i}.url`) || err(`social_media.${i}.username`) || err(`social_media.${i}.type`)}</small>
              )}
            </div>
          ))}
          <button className="btn small ghost" onClick={() => set({ social_media: [...form.social_media, { type: "instagram", url: "", username: "" }] })}>+ Add more social links</button>
        </section>

        <section className="panel">
          <h3>Ventures <small>Companies or projects</small></h3>
          {form.ventures.map((v, i) => (
            <div className="stack" key={i}>
              <div className="row">
                <input value={v.name} placeholder="Name *" onChange={(e) => set({ ventures: patchAt(form.ventures, i, { name: e.target.value }) })} />
                <button className="x" aria-label="Remove venture" onClick={() => set({ ventures: form.ventures.filter((_, j) => j !== i) })}>×</button>
              </div>
              {err(`ventures.${i}.name`) && <small className="err">{err(`ventures.${i}.name`)}</small>}
              <div className="row">
                <input value={v.url} placeholder="Link" onChange={(e) => set({ ventures: patchAt(form.ventures, i, { url: e.target.value }) })} />
                <input value={v.logo_url} placeholder="Logo image URL" onChange={(e) => set({ ventures: patchAt(form.ventures, i, { logo_url: e.target.value }) })} />
              </div>
              {(err(`ventures.${i}.url`) || err(`ventures.${i}.logo_url`)) && <small className="err">{err(`ventures.${i}.url`) || err(`ventures.${i}.logo_url`)}</small>}
            </div>
          ))}
          <button className="btn small ghost" onClick={() => set({ ventures: [...form.ventures, { name: "", logo_url: "", url: "" }] })}>+ Add venture</button>
        </section>

        <div className="savebar">
          <button className="btn" disabled={saving} onClick={submit}>{saving ? "Saving…" : isNew ? "Create card" : "Save changes"}</button>
          <button className="btn ghost" disabled={saving} onClick={() => go("cards", null)}>Cancel</button>
        </div>
      </div>

      <aside className="preview">
        <div className="phone-frame"><CardView card={form} placeholders /></div>
      </aside>
    </div>
  );
}

// ── Share & QR ───────────────────────────────────────────────────────────────
function SharePanel({ id, go }: { id: string | null; go: (s: string, id?: string | null) => void }) {
  const [card, setCard] = useState<BusinessCard | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "none" | "missing">(id ? "loading" : "none");
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    let live = true;
    findCard(id)
      .then((c) => live && (setCard(c), setState("ready")))
      .catch(() => live && setState("missing"));
    return () => {
      live = false;
    };
  }, [id]);

  if (state === "loading") return <p className="muted">Loading…</p>;
  if (state === "none" || state === "missing" || !card)
    return (
      <section className="panel empty">
        <h3>{state === "missing" ? "This card is no longer available" : "Pick a card to share"}</h3>
        <p className="muted">Choose one of your cards to get its link and QR code.</p>
        <button className="btn small" onClick={() => go("cards", null)}>Go to my cards</button>
      </section>
    );

  const link = publicCardUrl(card.slug);
  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const share = () => navigator.share({ title: `${card.full_name} – Digital Card`, url: link }).catch(() => {});
  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 1024;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.drawImage(img, 0, 0, 1024, 1024);
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = `${card.slug}-qr.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(new XMLSerializer().serializeToString(svg));
  };

  return (
    <div className="grid">
      <div className="form">
        <section className="panel share">
          <h3>Share {card.full_name}’s card</h3>
          <div className="linkbox"><input readOnly value={link} onFocus={(e) => e.currentTarget.select()} /></div>
          <div className="btns">
            <button className="btn" onClick={copy}>{copied ? "Copied ✓" : "Copy link"}</button>
            {"share" in navigator && <button className="btn ghost" onClick={share}>Share…</button>}
            <a className="btn ghost" href={`https://wa.me/?text=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a className="btn ghost" href={link} target="_blank" rel="noopener noreferrer">Open card ↗</a>
          </div>
          <div className="qr">
            <div ref={qrRef} className="qrbox"><QRCode value={link} size={168} /></div>
            <div>
              <p className="muted">Scan to open the card. The code stays valid until the name or company changes, which changes the link.</p>
              <button className="btn small" onClick={downloadQR}>Download QR (PNG)</button>
            </div>
          </div>
          <div className="btns"><button className="btn small ghost" onClick={() => go("card", card._id)}>Edit card</button></div>
        </section>
      </div>
      <aside className="preview">
        <div className="phone-frame"><CardView card={fromCard(card)} /></div>
      </aside>
    </div>
  );
}
