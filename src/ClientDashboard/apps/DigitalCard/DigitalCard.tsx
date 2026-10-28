import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "react-qr-code";
import toast from "react-hot-toast";
import CardView from "./CardView";
import CardForm, { type CardPatch } from "./CardForm";
import CardMonitoring from "./CardMonitoring";
import CardAffiliate from "./CardAffiliate";
import QrPlayground from "./QrPlayground";
import { loadQrDesign, saveQrDesign } from "./qrDesignStore";
import { CardData, emptyCard, withSuggestedTagline } from "./types";
import { clearDraft, loadDraft, saveDraft } from "./draft";
import { validateCard } from "./validate";
import { type ImageKind, uploadPhoto } from "./photo";
import { useAgent } from "../../../contexts/AgentContext";
import {
  BusinessCard,
  BusinessCardError,
  businessCardAPI,
  Pagination,
  cardLabel,
  cardQrImage,
  cardUrl,
  toPayload,
} from "../../../services/businessCardAPI";
import "./digitalCard.css";

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
      ) : section === "monitoring" ? (
        <CardMonitoring cardId={id} go={go} />
      ) : section === "affiliate" ? (
        <CardAffiliate go={go} />
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

  const copy = async (c: BusinessCard) => {
    await navigator.clipboard.writeText(cardUrl(c));
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
              <a className="slug" href={cardUrl(c)} target="_blank" rel="noopener noreferrer">{cardLabel(c)}</a>
            </div>
            <div className="btns">
              <button className="btn small ghost" onClick={() => go("card", c._id)}>Edit</button>
              <button className="btn small ghost" onClick={() => go("share", c._id)}>Share</button>
              <button className="btn small ghost" onClick={() => copy(c)}>Copy link</button>
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
  const [oldLink, setOldLink] = useState<string | null>(null);
  const set = (patch: CardPatch) => setForm((f) => ({ ...f, ...(typeof patch === "function" ? patch(f) : patch) }));

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
        setForm(withSuggestedTagline(fromCard(c)));
        setLoad("ready");
      })
      .catch((e: BusinessCardError) => live && setLoad(e.status === 403 ? "forbidden" : "missing"));
    return () => {
      live = false;
    };
  }, [id, isNew]);

  // Keep the not-yet-saved card as a local draft.
  useEffect(() => {
    if (isNew) saveDraft(form);
  }, [form, isNew]);

  // Signed-in editor: images upload straight away.
  const onImageFile = async (file: File, kind: ImageKind) => {
    try {
      const url = await uploadPhoto(file, kind);
      toast.success(kind === "logo" ? "Logo uploaded" : "Photo uploaded");
      return url;
    } catch (e: any) {
      toast.error(e?.message || "Couldn’t upload the image");
      return null;
    }
  };

  const submit = async () => {
    const v = validateCard(form);
    setErrors(v);
    if (Object.keys(v).length) return toast.error("Fix the highlighted fields");
    setSaving(true);
    try {
      if (isNew) {
        const card = await businessCardAPI.create(form);
        cardCache.set(card._id, card);
        clearDraft();
        toast.success("Card created");
        go("share", card._id);
      } else {
        const card = await businessCardAPI.update(id, toPayload(form));
        cardCache.set(card._id, card);
        if (saved && card.slug !== saved.slug) setOldLink(cardLabel(saved));
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

  return (
    <div className="grid">
      <div className="form">
        {!isNew && saved && (
          <section className="panel notice">
            <div className="muted">Public link</div>
            <a href={cardUrl(saved)} target="_blank" rel="noopener noreferrer" className="slug">{cardUrl(saved)}</a>
            {oldLink && (
              <small className="warn">Your name or company changed, so the link changed too. The old link ({oldLink}) no longer works — re-share the new one.</small>
            )}
            <div className="btns"><button className="btn small ghost" onClick={() => go("share", saved._id)}>Share & QR</button></div>
          </section>
        )}

        <CardForm
          form={form}
          set={set}
          errors={errors}
          onImageFile={onImageFile}
          agents={agents.map((a) => ({ id: a.id, name: a.name, status: a.status }))}
          agentsLoading={agentsLoading}
        />

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
  const [qrImageBroken, setQrImageBroken] = useState(false);
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

  if (state === "none") return <QrListing go={go} />;
  if (state === "loading") return <p className="muted">Loading…</p>;
  if (state === "missing" || !card)
    return (
      <section className="panel empty">
        <h3>This card is no longer available</h3>
        <p className="muted">It may have been deleted. Pick another card to share.</p>
        <button className="btn small" onClick={() => go("share", null)}>All QR codes</button>
      </section>
    );

  const link = cardUrl(card);
  const qrImage = qrImageBroken ? null : cardQrImage(card);
  const qrFileName = `${card.slug}-qr.png`;
  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const share = () => navigator.share({ title: `${card.full_name} – Digital Card`, url: link }).catch(() => {});
  const downloadQR = async () => {
    if (qrImage) {
      // A cross-origin <a download> is ignored by browsers, so fetch it as a blob (S3 allows CORS).
      try {
        const res = await fetch(qrImage);
        if (!res.ok) throw new Error(String(res.status));
        const url = URL.createObjectURL(await res.blob());
        const a = document.createElement("a");
        a.href = url;
        a.download = qrFileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch {
        window.open(qrImage, "_blank", "noopener,noreferrer");
      }
      return;
    }
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
      a.download = qrFileName;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(new XMLSerializer().serializeToString(svg));
  };

  return (
    <div className="stackv">
      <button type="button" className="link-back" onClick={() => go("share", null)}>
        ← All QR codes
      </button>
      <div className="qr-studio">
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
            <div ref={qrRef} className="qrbox">
              {qrImage ? (
                <img
                  src={qrImage}
                  alt={`QR code for ${card.full_name}'s card`}
                  width={168}
                  height={168}
                  style={{ display: "block", objectFit: "contain" }}
                  onError={() => setQrImageBroken(true)}
                />
              ) : (
                <QRCode value={link} size={168} />
              )}
            </div>
            <div>
              <p className="muted">Scan to open the card. The code stays valid until the name or company changes, which changes the link.</p>
              <button className="btn small" onClick={downloadQR}>Download QR (PNG)</button>
            </div>
          </div>
          <div className="btns"><button className="btn small ghost" onClick={() => go("card", card._id)}>Edit card</button></div>
        </section>

        <section className="panel qr-studio-design">
          <div>
            <h3>Design your QR wallpaper</h3>
            <p className="muted">
              Pick a format, background and colours, place your QR anywhere, then download it for your phone, tablet, desktop or wallet.
              Designs are saved in this browser.
            </p>
          </div>
          <QrPlayground
            key={card._id}
            link={link}
            initial={loadQrDesign(card._id)}
            onSave={(d) => {
              saveQrDesign(card._id, d);
              toast.success("QR design saved");
            }}
          />
        </section>
      </div>
    </div>
  );
}

// ── QR listing: every card's QR at a glance ─────────────────────────────────
function QrListing({ go }: { go: (s: string, id?: string | null) => void }) {
  const [cards, setCards] = useState<BusinessCard[] | null>(null);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    businessCardAPI
      .list({ limit: 50, sortBy: "updatedAt", sortOrder: "desc" })
      .then(({ cards }) => {
        cards.forEach((c) => cardCache.set(c._id, c));
        setCards(cards);
      })
      .catch((e: BusinessCardError) => setError(e.message || "Couldn’t load your cards"));
  }, []);

  const copy = async (c: BusinessCard) => {
    await navigator.clipboard.writeText(cardUrl(c));
    setCopiedId(c._id);
    setTimeout(() => setCopiedId((id) => (id === c._id ? null : id)), 1800);
  };

  return (
    <div className="stackv">
      <div className="head">
        <div>
          <h2 className="title">Share &amp; QR</h2>
          <p className="muted">Your cards’ QR codes. Open one to share it or design a QR wallpaper.</p>
        </div>
      </div>

      {error && (
        <section className="panel">
          <p className="err">{error}</p>
        </section>
      )}
      {!cards && !error && <p className="muted">Loading…</p>}
      {cards && cards.length === 0 && (
        <section className="panel empty">
          <h3>No QR codes yet</h3>
          <p className="muted">Every card gets its own QR code. Create your card to get yours.</p>
          <button className="btn small" onClick={() => go("card", null)}>Create a card</button>
        </section>
      )}
      {cards && cards.length > 0 && (
        <div className="qr-list">
          {cards.map((c) => {
            const design = loadQrDesign(c._id);
            return (
              <article key={c._id} className="qr-list-item">
                <button type="button" className="qr-list-code" onClick={() => go("share", c._id)} aria-label={`Open ${c.full_name}'s QR`}>
                  <QRCode value={cardUrl(c)} size={132} fgColor={design?.fg ?? "#161616"} />
                </button>
                <div className="qr-list-meta">
                  <strong>{c.full_name}</strong>
                  <span className="muted">{[c.job_title, c.company_name].filter(Boolean).join(" · ")}</span>
                  <span className="qr-list-link">{cardLabel(c)}</span>
                  {design && <span className="qr-list-badge">Custom design saved</span>}
                </div>
                <div className="qr-list-actions">
                  <button className="btn small" onClick={() => go("share", c._id)}>
                    Design QR
                  </button>
                  <button className="btn small ghost" onClick={() => copy(c)}>
                    {copiedId === c._id ? "Copied ✓" : "Copy link"}
                  </button>
                  <a className="btn small ghost" href={cardUrl(c)} target="_blank" rel="noopener noreferrer">
                    Open ↗
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
