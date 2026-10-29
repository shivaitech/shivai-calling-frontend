import { ReactNode, useRef, useState } from "react";
import { Camera, ImagePlus, User, X } from "lucide-react";
import type { ImageKind } from "./photo";
import { CardData, SUGGESTED_TAGLINE } from "./types";
import CountryCodeSelect from "./CountryCodeSelect";
import SocialLinksEditor from "./SocialLinksEditor";
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
}

/** All the editable sections of a business card (everything except the save bar / preview). */
export default function CardForm({ form, set, errors, onImageFile, agents, agentsLoading = false, savedUsername }: CardFormProps) {
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
          <Field label="Phone" error={err("phone_number")}>
            <input value={form.phone_number} placeholder="Enter your phone number" inputMode="tel" onChange={(e) => set({ phone_number: e.target.value })} />
          </Field>
        </div>
        <label className="chk">
          <input type="checkbox" checked={form.is_whatsapp_number} onChange={(e) => set({ is_whatsapp_number: e.target.checked })} />
          This number is on WhatsApp
        </label>
        <Field label="Email" error={err("email")}>
          <input type="email" value={form.email} placeholder="Enter your email address" onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label="Website" error={err("website")}>
          <input value={form.website} placeholder="Paste your website link" onChange={(e) => set({ website: e.target.value })} />
        </Field>
      </section>

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
        <h3>Ventures <small>Companies or projects</small></h3>
        {form.ventures.map((v, i) => (
          <div className="stack" key={i}>
            <div className="row">
              {/* Logo: tap to upload; ✕ removes it. */}
              <div className="logo-picker">
                <label className={`logo-picker-tile${busy === `logo-${i}` ? " is-busy" : ""}`} title={v.logo_url ? "Change logo" : "Add logo"}>
                  {v.logo_url ? <img src={v.logo_url} alt={`${v.name || "Venture"} logo`} /> : <ImagePlus size={18} />}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    aria-label={v.logo_url ? "Change logo" : "Add logo"}
                    disabled={busy !== null}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      void pickImage(file, "logo", `logo-${i}`, (url) =>
                        set((f) => ({ ventures: patchAt(f.ventures, i, { logo_url: url }) })),
                      );
                    }}
                  />
                </label>
                {v.logo_url && busy !== `logo-${i}` && (
                  <button type="button" className="logo-picker-x" aria-label="Remove logo" onClick={() => set({ ventures: patchAt(form.ventures, i, { logo_url: "" }) })}>
                    <X size={11} />
                  </button>
                )}
              </div>
              <input value={v.name} placeholder="Name *" onChange={(e) => set({ ventures: patchAt(form.ventures, i, { name: e.target.value }) })} />
              <button className="x" aria-label="Remove venture" onClick={() => set({ ventures: form.ventures.filter((_, j) => j !== i) })}>×</button>
            </div>
            {err(`ventures.${i}.name`) && <small className="err">{err(`ventures.${i}.name`)}</small>}
            <input value={v.url} placeholder="Link (e.g. yourcompany.com)" onChange={(e) => set({ ventures: patchAt(form.ventures, i, { url: e.target.value }) })} />
            {(err(`ventures.${i}.url`) || err(`ventures.${i}.logo_url`)) && (
              <small className="err">{err(`ventures.${i}.url`) || err(`ventures.${i}.logo_url`)}</small>
            )}
          </div>
        ))}
        <button className="btn small ghost" onClick={() => set({ ventures: [...form.ventures, { name: "", logo_url: "", url: "" }] })}>
          + Add venture
        </button>
      </section>
    </>
  );
}
