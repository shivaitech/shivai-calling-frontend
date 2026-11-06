import { ReactNode, useRef, useState } from "react";
import {
  Camera,
  Check,
  ChevronDown,
  Globe,
  Layers,
  LucideIcon,
  Mail,
  Phone,
  Plus,
  Share2,
  Sparkles,
  Star,
  Upload,
  User,
  UserPlus,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import type { ImageKind } from "./photo";
import { CardData, EMAIL_LABELS, MAX_ADDITIONAL_EMAILS, MAX_ADDITIONAL_PHONES, PHONE_LABELS, SUGGESTED_TAGLINE } from "./types";
import type { CardEmail, CardHighlight, CardPhone, EmailLabel, PhoneLabel } from "../../../services/businessCardAPI";
import CountryCodeSelect from "./CountryCodeSelect";
import SocialLinksEditor from "./SocialLinksEditor";
import VenturesEditor from "./VenturesEditor";
import PayMeEditor from "./PayMeEditor";
import { CARD_EXTRAS } from "./features";
import { visiblePayMethods } from "./payMe";
import WhatsAppIcon from "./WhatsAppIcon";
import UsernameField from "./UsernameField";
import { suggestUsername } from "./username";
import { editImage, type EditImageOptions } from "./ImageEditor";

// The card shows the photo in a 4:5 portrait frame with rounded corners.
const PHOTO_EDIT: EditImageOptions = { title: "Edit profile photo", aspects: [{ label: "Portrait", value: 4 / 5 }], rounded: true, maxSide: 1600 };
const LOGO_EDIT: EditImageOptions = {
  title: "Edit logo",
  aspects: [
    { label: "Original", value: null },
    { label: "Square", value: 1 },
    { label: "Wide", value: 3 },
  ],
  keepTransparency: true,
  maxSide: 1024,
};

/** Accent colours offered as swatches; any other colour comes from the "+" picker. */
const ACCENTS = ["#161616", "#1f4f9b", "#2a8c7b", "#7c4bab", "#b4702e"];
const TAGLINE_MAX = 300;

const WaIcon = ({ size = 16 }: { size?: number }) => <WhatsAppIcon mono size={size} />;
/** Actions that can be the card’s big featured button, and what each one needs. */
const HIGHLIGHTS: { id: CardHighlight; label: string; Icon: LucideIcon | typeof WaIcon; needs: string }[] = [
  { id: "ai", label: "Ask My AI", Icon: Sparkles, needs: "Pick an AI agent below first" },
  { id: "whatsapp", label: "WhatsApp", Icon: WaIcon, needs: "Add a phone number that’s on WhatsApp first" },
  { id: "email", label: "Email", Icon: Mail, needs: "Add your email first" },
  { id: "pay", label: "Pay Me", Icon: Wallet, needs: "Add a Pay Me method first" },
  { id: "save", label: "Save Contact", Icon: UserPlus, needs: "" },
];

export function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="field">
      <span>
        {label}
        {required && (
          <b className="req" aria-hidden="true">
            {" "}
            *
          </b>
        )}
      </span>
      {children}
      {error && <small className="err">{error}</small>}
    </label>
  );
}

/**
 * One builder section: an icon, a title and a one-line description, collapsible. A section
 * holding an error is always open, so a problem is never hidden behind a closed header.
 */
function FormSection({
  id,
  icon: Icon,
  title,
  subtitle,
  hasError = false,
  children,
}: {
  id?: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  hasError?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const shown = open || hasError;
  const bodyId = `${id ?? title.toLowerCase().replace(/\W+/g, "-")}-body`;
  return (
    <section className={`panel fsec${shown ? " is-open" : ""}`} id={id}>
      <button type="button" className="fsec-head" aria-expanded={shown} aria-controls={bodyId} onClick={() => setOpen((v) => !v || hasError)}>
        <span className="fsec-ico" aria-hidden="true">
          <Icon size={19} strokeWidth={1.8} />
        </span>
        <span className="fsec-titles">
          <strong>{title}</strong>
          <small>{subtitle}</small>
        </span>
        <ChevronDown className="fsec-chev" size={18} aria-hidden="true" />
      </button>
      {shown && (
        <div className="fsec-body" id={bodyId}>
          {children}
        </div>
      )}
    </section>
  );
}

const patchAt = <T,>(arr: T[], i: number, patch: Partial<T>) => arr.map((x, j) => (j === i ? { ...x, ...patch } : x));

export interface AgentOption {
  id: string;
  name: string;
  status?: string;
}

export type CardPatch = Partial<CardData> | ((current: CardData) => Partial<CardData>);

interface CardFormProps {
  form: CardData;
  /** A patch, or a function of the latest form (use that after an await, so other edits aren't lost). */
  set: (patch: CardPatch) => void;
  errors: Record<string, string>;
  /** Turns a picked file into a URL the card can use (uploaded now, or a local data URL until save). null = failed (caller reports it). */
  onImageFile: (file: File, kind: ImageKind) => Promise<string | null>;
  /** null = hide the "Ask My AI" section (e.g. before the visitor has an account). */
  agents: AgentOption[] | null;
  agentsLoading?: boolean;
  /** The card's username as last saved (editing), so it isn't reported as taken by itself. */
  savedUsername?: string;
  /** The card already exists: its username (link) is permanent and shown read-only. */
  usernameLocked?: boolean;
  /** New card: may the owner choose their link? (Prestige only; other plans get one made from the name.) */
  chooseUsername?: boolean;
  /** Uploads a PDF for a document/catalog entry. Leave out before the visitor has an account (links only). */
  onDocumentFile?: (file: File) => Promise<{ url: string; file_name: string }>;
  onDocumentError?: (message: string) => void;
}

/** All the editable sections of a business card (everything except the save bar / preview). */
export default function CardForm({
  form,
  set,
  errors,
  onImageFile,
  agents,
  agentsLoading = false,
  savedUsername,
  usernameLocked = false,
  chooseUsername = true,
  onDocumentFile,
  onDocumentError = () => {},
}: CardFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const err = (k: string) => errors[k];
  const errIn = (...prefixes: string[]) => Object.keys(errors).some((k) => prefixes.some((p) => k === p || k.startsWith(`${p}.`)));
  // Which image is being processed: "photo", or "logo-<venture index>".
  const [busy, setBusy] = useState<string | null>(null);
  const uploading = busy === "photo";

  const pickImage = async (file: File | undefined, kind: ImageKind, key: string, apply: (url: string) => void) => {
    if (!file) return;
    // Crop & adjust first; cancelling the editor cancels the upload.
    const edited = await editImage(file, kind === "logo" ? LOGO_EDIT : PHOTO_EDIT);
    if (!edited) return;
    setBusy(key);
    try {
      const url = await onImageFile(edited, kind);
      if (url) apply(url);
    } finally {
      setBusy(null);
    }
  };
  // A photo URL that failed to load shows the placeholder instead of a broken image.
  const [brokenUrl, setBrokenUrl] = useState("");
  const hasPhoto = !!form.image_url && form.image_url !== brokenUrl;
  const agentKnown = (agents ?? []).some((a) => a.id === form.agent_id);
  const extraPhones = form.additional_phones ?? [];
  // Featured button: only actions the card actually has can be picked.
  const highlightAvailable: Record<CardHighlight, boolean> = {
    ai: !!form.agent_id,
    whatsapp: !!form.phone_number.trim() && form.is_whatsapp_number,
    email: !!form.email.trim(),
    pay: visiblePayMethods(form.payment_methods).length > 0,
    save: true,
  };
  const currentHighlight: CardHighlight | null =
    form.highlight && highlightAvailable[form.highlight] ? form.highlight : highlightAvailable.ai ? "ai" : null;
  // Pay Me errors (ours or the API's "payment_methods.<i>.<field>"), first one wins.
  const payError = Object.entries(errors).find(([k]) => k.startsWith("payment_methods"))?.[1];
  const setPhone = (i: number, patch: Partial<CardPhone>) =>
    set((f) => ({ additional_phones: patchAt(f.additional_phones ?? [], i, patch) }));
  const extraEmails = form.additional_emails ?? [];
  const setEmail = (i: number, patch: Partial<CardEmail>) =>
    set((f) => ({ additional_emails: patchAt(f.additional_emails ?? [], i, patch) }));
  const accent = /^#[0-9a-f]{6}$/i.test(form.color_code) ? form.color_code.toLowerCase() : "#161616";
  const customAccent = !ACCENTS.includes(accent);

  return (
    <>
      <FormSection
        id="card-basics"
        icon={UserRound}
        title="Basics"
        subtitle="Your identity on the card"
        hasError={errIn("image_url", "full_name", "username", "job_title", "company_name", "tagline", "color_code")}
      >
        {/* Profile photo: round preview, with Upload / Remove beside it. */}
        <div className="photo-row">
          <button
            type="button"
            className="photo-avatar"
            disabled={uploading}
            aria-label={hasPhoto ? "Change profile photo" : "Add profile photo"}
            onClick={() => fileRef.current?.click()}
          >
            <span className="photo-avatar-img">
              {hasPhoto ? (
                <img src={form.image_url} alt="" onError={() => setBrokenUrl(form.image_url)} />
              ) : (
                <User size={34} strokeWidth={1.6} aria-hidden="true" />
              )}
            </span>
            <span className="photo-avatar-cam" aria-hidden="true">
              <Camera size={13} />
            </span>
            {uploading && <span className="avatar-picker-busy" aria-hidden="true" />}
          </button>
          <div className="photo-copy">
            <strong>Profile photo</strong>
            <p>A clear photo helps people recognise you.</p>
            <div className="photo-actions">
              <button type="button" className="pill-btn" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Upload size={14} aria-hidden="true" /> {uploading ? "Uploading…" : hasPhoto ? "Change photo" : "Upload photo"}
              </button>
              {form.image_url && !uploading && (
                <button type="button" className="text-btn" onClick={() => set({ image_url: "" })}>
                  Remove
                </button>
              )}
            </div>
            {err("image_url") && <small className="err">{err("image_url")}</small>}
          </div>
          <input
            ref={fileRef}
            hidden
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = ""; // allow picking the same file again
              void pickImage(file, "photo", "photo", (url) => set({ image_url: url }));
            }}
          />
        </div>

        <Field label="Full name" required error={err("full_name")}>
          <input value={form.full_name} placeholder="Enter your full name" onChange={(e) => set({ full_name: e.target.value })} />
        </Field>
        {usernameLocked || chooseUsername ? (
          <UsernameField
            locked={usernameLocked}
            value={usernameLocked ? form.username || savedUsername || "" : form.username}
            onChange={(username) => set({ username })}
            fullName={form.full_name}
            savedUsername={savedUsername}
            error={err("username")}
          />
        ) : (
          // Choosing the link is a Prestige option; other plans get one made from the name on save.
          <div className="field">
            <span>Your card’s link</span>
            <small className="field-help">
              Your link is created from your name when you save, like <strong>{suggestUsername(form.full_name) || "your-name"}.callshivai.com</strong>. Choose your
              own link with Prestige.
            </small>
            {err("username") && <small className="err">{err("username")}</small>}
          </div>
        )}
        <div className="row two">
          <Field label="Job title" required error={err("job_title")}>
            <input value={form.job_title} placeholder="Your job title" onChange={(e) => set({ job_title: e.target.value })} />
          </Field>
          <Field label="Company" required error={err("company_name")}>
            <input value={form.company_name} placeholder="Your company" onChange={(e) => set({ company_name: e.target.value })} />
          </Field>
        </div>
        <Field label="Tagline" error={err("tagline")}>
          <span className="textarea-wrap">
            <textarea
              rows={3}
              maxLength={TAGLINE_MAX}
              value={form.tagline}
              placeholder="A short line about what you do (optional)"
              onChange={(e) => set({ tagline: e.target.value })}
            />
            <span className="textarea-count" aria-hidden="true">
              {form.tagline.length} / {TAGLINE_MAX}
            </span>
          </span>
          <small className="field-help">A short line about you. It appears on your card below your name and title.</small>
        </Field>
        {!form.tagline.trim() && (
          <button type="button" className="text-btn" style={{ alignSelf: "flex-start" }} onClick={() => set({ tagline: SUGGESTED_TAGLINE })}>
            ✦ Use suggested text
          </button>
        )}

        <div className="field">
          <span>Accent colour</span>
          <small className="field-help">
            Your card’s highlight colour. It is used for the featured button (such as Talk to My AI Manager) and the short line under your title.
            Signature and Prestige cards use their own silver and gold styling.
          </small>
          <div className="swatches" role="radiogroup" aria-label="Accent colour">
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={accent === c}
                aria-label={c}
                className={`swatch${accent === c ? " is-on" : ""}`}
                style={{ background: c }}
                onClick={() => set({ color_code: c })}
              >
                {accent === c && <Check size={15} strokeWidth={3} aria-hidden="true" />}
              </button>
            ))}
            {customAccent && (
              <button type="button" role="radio" aria-checked className="swatch is-on" style={{ background: accent }} aria-label={`Custom ${accent}`} onClick={() => colorRef.current?.click()}>
                <Check size={15} strokeWidth={3} aria-hidden="true" />
              </button>
            )}
            <button type="button" className="swatch swatch-add" aria-label="Choose another colour" onClick={() => colorRef.current?.click()}>
              <Plus size={16} aria-hidden="true" />
            </button>
            <input ref={colorRef} type="color" className="swatch-input" value={accent} tabIndex={-1} aria-hidden="true" onChange={(e) => set({ color_code: e.target.value })} />
          </div>
          {err("color_code") && <small className="err">{err("color_code")}</small>}
        </div>
      </FormSection>

      <FormSection
        icon={Phone}
        title="Contact"
        subtitle="How people can reach you"
        hasError={errIn("country_code", "phone_number", "additional_phones", "email", "additional_emails", "website")}
      >
        <div className="field">
          <span>Phone number</span>
          <div className="phone-row">
            <CountryCodeSelect value={form.country_code} onChange={(country_code) => set({ country_code })} />
            <input value={form.phone_number} placeholder="Phone number" inputMode="tel" aria-label="Phone number" onChange={(e) => set({ phone_number: e.target.value })} />
            <button
              type="button"
              role="switch"
              aria-checked={form.is_whatsapp_number}
              aria-label="This number is on WhatsApp"
              className={`wa-switch${form.is_whatsapp_number ? " is-on" : ""}`}
              onClick={() => set({ is_whatsapp_number: !form.is_whatsapp_number })}
            >
              <WhatsAppIcon mono size={18} />
              <span className="wa-switch-track" aria-hidden="true">
                <span className="wa-switch-knob" />
              </span>
            </button>
          </div>
          <span className={`wa-note${form.is_whatsapp_number ? " is-on" : ""}`}>
            {form.is_whatsapp_number ? (
              <>
                <Check size={12} strokeWidth={3} aria-hidden="true" /> This number is on WhatsApp
              </>
            ) : (
              "Turn on if people can message this number on WhatsApp"
            )}
          </span>
          {(err("country_code") || err("phone_number")) && <small className="err">{err("country_code") || err("phone_number")}</small>}
        </div>

        {CARD_EXTRAS &&
          extraPhones.map((p, i) => (
            <div className="xphone" key={i}>
              <div className="xphone-head">
                <select aria-label="Number label" value={p.label} onChange={(e) => setPhone(i, { label: e.target.value as PhoneLabel })}>
                  {PHONE_LABELS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="xphone-x"
                  aria-label="Remove this number"
                  onClick={() => set((f) => ({ additional_phones: (f.additional_phones ?? []).filter((_, j) => j !== i) }))}
                >
                  <X size={15} />
                </button>
              </div>
              <div className="phone-row">
                <CountryCodeSelect value={p.country_code} onChange={(country_code) => setPhone(i, { country_code })} />
                <input value={p.phone_number} placeholder="Phone number" inputMode="tel" aria-label="Phone number" onChange={(e) => setPhone(i, { phone_number: e.target.value })} />
                <button
                  type="button"
                  role="switch"
                  aria-checked={p.is_whatsapp_number}
                  aria-label="This number is on WhatsApp"
                  className={`wa-switch${p.is_whatsapp_number ? " is-on" : ""}`}
                  onClick={() => setPhone(i, { is_whatsapp_number: !p.is_whatsapp_number })}
                >
                  <WhatsAppIcon mono size={18} />
                  <span className="wa-switch-track" aria-hidden="true">
                    <span className="wa-switch-knob" />
                  </span>
                </button>
              </div>
              {err(`additional_phones.${i}.phone_number`) && <small className="err">{err(`additional_phones.${i}.phone_number`)}</small>}
            </div>
          ))}
        {CARD_EXTRAS && extraPhones.length < MAX_ADDITIONAL_PHONES && (
          <button
            type="button"
            className="dash-btn"
            onClick={() =>
              set((f) => ({
                additional_phones: [
                  ...(f.additional_phones ?? []),
                  { label: (f.additional_phones ?? []).length ? "mobile" : "work", country_code: f.country_code || "+91", phone_number: "", is_whatsapp_number: false },
                ],
              }))
            }
          >
            <Plus size={14} aria-hidden="true" /> Add another number
          </button>
        )}

        <Field label="Email" error={err("email")}>
          <span className="icon-input">
            <Mail size={16} aria-hidden="true" />
            <input type="email" value={form.email} placeholder="you@company.com" onChange={(e) => set({ email: e.target.value })} />
          </span>
        </Field>

        {/* More emails (optional), e.g. a personal and an official one, like extra numbers. */}
        {extraEmails.map((m, i) => (
          <div className="xphone" key={i}>
            <div className="xphone-head">
              <select aria-label="Email label" value={m.label} onChange={(e) => setEmail(i, { label: e.target.value as EmailLabel })}>
                {EMAIL_LABELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="xphone-x"
                aria-label="Remove this email"
                onClick={() => set((f) => ({ additional_emails: (f.additional_emails ?? []).filter((_, j) => j !== i) }))}
              >
                <X size={15} />
              </button>
            </div>
            <span className="icon-input">
              <Mail size={16} aria-hidden="true" />
              <input type="email" value={m.email} placeholder="another@email.com" aria-label="Email" onChange={(e) => setEmail(i, { email: e.target.value })} />
            </span>
            {err(`additional_emails.${i}.email`) && <small className="err">{err(`additional_emails.${i}.email`)}</small>}
          </div>
        ))}
        {CARD_EXTRAS && extraEmails.length < MAX_ADDITIONAL_EMAILS && (
          <button
            type="button"
            className="dash-btn"
            onClick={() =>
              set((f) => ({
                additional_emails: [...(f.additional_emails ?? []), { label: (f.additional_emails ?? []).length ? "other" : "personal", email: "" }],
              }))
            }
          >
            <Plus size={14} aria-hidden="true" /> Add another email
          </button>
        )}
        <Field label="Website" error={err("website")}>
          <span className="icon-input">
            <Globe size={16} aria-hidden="true" />
            <input value={form.website} placeholder="https://yourcompany.com" inputMode="url" onChange={(e) => set({ website: e.target.value })} />
          </span>
        </Field>
      </FormSection>

      {CARD_EXTRAS && (
        <FormSection icon={Wallet} title="Pay Me" subtitle="Let people pay you from your card" hasError={!!payError}>
          <PayMeEditor
            value={form.payment_methods ?? []}
            update={(fn) => set((f) => ({ payment_methods: fn(f.payment_methods ?? []) }))}
            onQrFile={(file) => onImageFile(file, "logo")}
          />
          {payError && <small className="err">{payError}</small>}
        </FormSection>
      )}

      {agents !== null && (
        <FormSection icon={Sparkles} title="Ask My AI" subtitle="Optional. You can add it later" hasError={errIn("agent_id")}>
          <Field label="AI agent" error={err("agent_id")}>
            <select value={form.agent_id} onChange={(e) => set({ agent_id: e.target.value })}>
              <option value="">{agentsLoading && agents.length === 0 ? "Loading agents…" : "No agent, add later"}</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.status && a.status !== "Published" ? " (not published)" : ""}
                </option>
              ))}
              {form.agent_id && !agentKnown && <option value={form.agent_id}>{form.agent_id}</option>}
            </select>
          </Field>
          <small className="field-help">Choose an AI agent to let visitors talk to your AI directly from your card. Leave it empty and the button is simply hidden.</small>
          {agents.length === 0 && !agentsLoading && <small className="field-help">You don’t have any AI employees yet. Create one later and come back to add it.</small>}
        </FormSection>
      )}

      {CARD_EXTRAS && (
        <FormSection icon={Star} title="Featured button" subtitle="Shown big at the top of your card">
          <div className="hl-grid" role="radiogroup" aria-label="Featured button">
            {HIGHLIGHTS.map((h) => {
              const ok = highlightAvailable[h.id];
              const on = currentHighlight === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={!ok}
                  title={ok ? undefined : h.needs}
                  className={`hl-opt${on ? " is-on" : ""}`}
                  onClick={() => set({ highlight: h.id })}
                >
                  <h.Icon size={17} aria-hidden="true" />
                  <span>{h.label}</span>
                  {on && (
                    <span className="hl-check" aria-hidden="true">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <small className="field-help">
            {currentHighlight ? "Choose the main action you want visitors to see first. The others stay in the row of icons under it." : "Add an AI agent, WhatsApp number, email or Pay Me to feature one."}
          </small>
        </FormSection>
      )}

      <FormSection icon={Share2} title="Social links" subtitle="Add your social profiles" hasError={errIn("social_media")}>
        <SocialLinksEditor
          value={form.social_media}
          onChange={(social_media) => set({ social_media })}
          errorFor={(i) => err(`social_media.${i}.url`) || err(`social_media.${i}.username`) || err(`social_media.${i}.type`)}
        />
      </FormSection>

      <FormSection
        icon={Layers}
        title={CARD_EXTRAS ? "Ventures & more" : "Ventures"}
        subtitle={CARD_EXTRAS ? "Companies, shop catalogs, documents, menus and more" : "Companies or projects"}
        hasError={errIn("ventures")}
      >
        <VenturesEditor
          basic={!CARD_EXTRAS}
          value={form.ventures}
          update={(fn) => set((f) => ({ ventures: fn(f.ventures) }))}
          busyKey={busy}
          onPickLogo={(i, file) =>
            void pickImage(file, "logo", `logo-${i}`, (url) => set((f) => ({ ventures: patchAt(f.ventures, i, { logo_url: url }) })))
          }
          onDocumentFile={onDocumentFile}
          onDocumentError={onDocumentError}
          errorFor={(i) =>
            err(`ventures.${i}.name`) ||
            err(`ventures.${i}.url`) ||
            err(`ventures.${i}.logo_url`) ||
            err(`ventures.${i}.type`) ||
            err(`ventures.${i}.logo_size`) ||
            err(`ventures.${i}.description`)
          }
        />
      </FormSection>
    </>
  );
}
