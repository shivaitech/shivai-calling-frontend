import { ReactNode, useRef, useState } from "react";
import { Camera, Plus, User, X } from "lucide-react";
import type { ImageKind } from "./photo";
import { CardData, MAX_ADDITIONAL_PHONES, PHONE_LABELS, SUGGESTED_TAGLINE } from "./types";
import type { CardPhone, PhoneLabel } from "../../../services/businessCardAPI";
import CountryCodeSelect from "./CountryCodeSelect";
import SocialLinksEditor from "./SocialLinksEditor";
import VenturesEditor from "./VenturesEditor";
import PayMeEditor from "./PayMeEditor";
import { CARD_EXTRAS } from "./features";
import UsernameField from "./UsernameField";
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

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="err">{error}</small>}
    </label>
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
  onDocumentFile,
  onDocumentError = () => {},
}: CardFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const err = (k: string) => errors[k];
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
  // Pay Me errors (ours or the API's "payment_methods.<i>.<field>"), first one wins.
  const payError = Object.entries(errors).find(([k]) => k.startsWith("payment_methods"))?.[1];
  const setPhone = (i: number, patch: Partial<CardPhone>) =>
    set((f) => ({ additional_phones: patchAt(f.additional_phones ?? [], i, patch) }));

  return (
    <>
      <section className="panel">
        <h3>Basics</h3>
        {/* Instagram-style profile photo: tap the avatar (or the link) to pick one. */}
        <div className="avatar-picker">
          <button
            type="button"
            className="avatar-picker-btn"
            disabled={uploading}
            aria-label={hasPhoto ? "Change profile photo" : "Add profile photo"}
            onClick={() => fileRef.current?.click()}
          >
            <span className="avatar-picker-ring">
              {hasPhoto ? (
                <img src={form.image_url} alt="" onError={() => setBrokenUrl(form.image_url)} />
              ) : (
                <span className="avatar-picker-ph">
                  <User size={40} strokeWidth={1.6} />
                </span>
              )}
            </span>
            <span className="avatar-picker-cam" aria-hidden="true">
              <Camera size={14} />
            </span>
            {uploading && <span className="avatar-picker-busy" aria-hidden="true" />}
          </button>
          <div className="avatar-picker-actions">
            <button type="button" className="link-btn" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? "Uploading…" : hasPhoto ? "Change photo" : "Add profile photo"}
            </button>
            {form.image_url && !uploading && (
              <button type="button" className="link-btn danger" onClick={() => set({ image_url: "" })}>
                Remove
              </button>
            )}
          </div>
          {err("image_url") && <small className="err">{err("image_url")}</small>}
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
        <Field label="Full name *" error={err("full_name")}>
          <input value={form.full_name} placeholder="Enter your full name" onChange={(e) => set({ full_name: e.target.value })} />
        </Field>
        <UsernameField
          value={form.username}
          onChange={(username) => set({ username })}
          fullName={form.full_name}
          savedUsername={savedUsername}
          error={err("username")}
        />
        <div className="row">
          <Field label="Job title *" error={err("job_title")}>
            <input value={form.job_title} placeholder="Enter your job title" onChange={(e) => set({ job_title: e.target.value })} />
          </Field>
          <Field label="Company *" error={err("company_name")}>
            <input value={form.company_name} placeholder="Enter your company name" onChange={(e) => set({ company_name: e.target.value })} />
          </Field>
        </div>
        <Field label="Tagline" error={err("tagline")}>
          <textarea
            rows={3}
            maxLength={300}
            value={form.tagline}
            placeholder="A short line about what you do (optional)"
            style={{ resize: "vertical" }}
            onChange={(e) => set({ tagline: e.target.value })}
          />
        </Field>
        {!form.tagline.trim() && (
          <button type="button" className="btn small ghost" style={{ alignSelf: "flex-start" }} onClick={() => set({ tagline: SUGGESTED_TAGLINE })}>
            ✦ Use suggested text
          </button>
        )}
        <Field label="Accent color" error={err("color_code")}>
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(form.color_code) ? form.color_code : "#161616"}
            onChange={(e) => set({ color_code: e.target.value })}
            className="color"
          />
        </Field>
      </section>

      <section className="panel">
        <h3>Contact</h3>
        <div className="row phone">
          <Field label="Code" error={err("country_code")}>
            <CountryCodeSelect value={form.country_code} onChange={(country_code) => set({ country_code })} />
          </Field>
          <Field label={extraPhones.length ? "Primary phone" : "Phone"} error={err("phone_number")}>
            <input value={form.phone_number} placeholder="Enter your phone number" inputMode="tel" onChange={(e) => set({ phone_number: e.target.value })} />
          </Field>
        </div>
        <label className="chk">
          <input type="checkbox" checked={form.is_whatsapp_number} onChange={(e) => set({ is_whatsapp_number: e.target.checked })} />
          This number is on WhatsApp
        </label>
        {CARD_EXTRAS && extraPhones.map((p, i) => (
          <div className="xphone" key={i}>
            <div className="xphone-head">
              <select
                aria-label="Number label"
                value={p.label}
                onChange={(e) => setPhone(i, { label: e.target.value as PhoneLabel })}
              >
                {PHONE_LABELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              <label className="chk">
                <input type="checkbox" checked={p.is_whatsapp_number} onChange={(e) => setPhone(i, { is_whatsapp_number: e.target.checked })} />
                On WhatsApp
              </label>
              <button type="button" className="xphone-x" aria-label="Remove this number" onClick={() => set((f) => ({ additional_phones: (f.additional_phones ?? []).filter((_, j) => j !== i) }))}>
                <X size={15} />
              </button>
            </div>
            <div className="row phone">
              <Field label="Code">
                <CountryCodeSelect value={p.country_code} onChange={(country_code) => setPhone(i, { country_code })} />
              </Field>
              <Field label="Phone" error={err(`additional_phones.${i}.phone_number`)}>
                <input value={p.phone_number} placeholder="Enter the number" inputMode="tel" onChange={(e) => setPhone(i, { phone_number: e.target.value })} />
              </Field>
            </div>
          </div>
        ))}
        {CARD_EXTRAS && extraPhones.length < MAX_ADDITIONAL_PHONES && (
          <button
            type="button"
            className="xphone-add"
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
          <input type="email" value={form.email} placeholder="Enter your email address" onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label="Website" error={err("website")}>
          <input value={form.website} placeholder="Paste your website link" onChange={(e) => set({ website: e.target.value })} />
        </Field>
      </section>

      {CARD_EXTRAS && (
        <section className="panel">
          <h3>Pay Me <small>Optional · let people pay you from your card</small></h3>
          <PayMeEditor
            value={form.payment_methods ?? []}
            update={(fn) => set((f) => ({ payment_methods: fn(f.payment_methods ?? []) }))}
            onQrFile={(file) => onImageFile(file, "logo")}
          />
          {payError && <small className="err">{payError}</small>}
        </section>
      )}

      {agents !== null && (
        <section className="panel">
          <h3>Ask My AI <small>Optional — you can add it later</small></h3>
          <Field label="AI agent" error={err("agent_id")}>
            <select value={form.agent_id} onChange={(e) => set({ agent_id: e.target.value })}>
              <option value="">{agentsLoading && agents.length === 0 ? "Loading agents…" : "No agent — add later"}</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}{a.status && a.status !== "Published" ? " (not published)" : ""}</option>
              ))}
              {form.agent_id && !agentKnown && <option value={form.agent_id}>{form.agent_id}</option>}
            </select>
          </Field>
          <small>If you pick one, an “Ask My AI” button on your card opens it. Leave it empty and the button is simply hidden.</small>
          {agents.length === 0 && !agentsLoading && <small>You don’t have any AI employees yet — you can create one later and come back to add it.</small>}
        </section>
      )}

      <section className="panel">
        <h3>Social links <small>Tap a platform to connect it</small></h3>
        <SocialLinksEditor
          value={form.social_media}
          onChange={(social_media) => set({ social_media })}
          errorFor={(i) => err(`social_media.${i}.url`) || err(`social_media.${i}.username`) || err(`social_media.${i}.type`)}
        />
      </section>

      <section className="panel">
        {CARD_EXTRAS ? (
          <h3>Ventures &amp; more <small>Companies, shop catalogs, documents, menus</small></h3>
        ) : (
          <h3>Ventures <small>Companies or projects</small></h3>
        )}
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
          errorFor={(i) => err(`ventures.${i}.name`) || err(`ventures.${i}.url`) || err(`ventures.${i}.logo_url`) || err(`ventures.${i}.type`) || err(`ventures.${i}.logo_size`) || err(`ventures.${i}.description`)}
        />
      </section>
    </>
  );
}
