import { ReactNode, useRef } from "react";
import { CardData, SOCIAL_TYPES, SocialType } from "./types";
import { changeType, finalizeUrl, fromUrlInput, fromUsernameInput, USERNAME_PLACEHOLDER } from "./socialLinks";

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

interface CardFormProps {
  form: CardData;
  set: (patch: Partial<CardData>) => void;
  errors: Record<string, string>;
  /** Called with the photo the user picked. */
  onPhotoFile: (file?: File) => void;
  uploading?: boolean;
  /** null = hide the "My AI" section (e.g. before the visitor has an account). */
  agents: AgentOption[] | null;
  agentsLoading?: boolean;
}

/** All the editable sections of a business card (everything except the save bar / preview). */
export default function CardForm({ form, set, errors, onPhotoFile, uploading = false, agents, agentsLoading = false }: CardFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const err = (k: string) => errors[k];
  const photoIsLocal = form.image_url.startsWith("data:");
  const agentKnown = (agents ?? []).some((a) => a.id === form.agent_id);

  return (
    <>
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
            <input
              value={photoIsLocal ? "" : form.image_url}
              placeholder={photoIsLocal ? "Photo selected ✓" : "Paste an image link, or upload a photo"}
              onChange={(e) => set({ image_url: e.target.value })}
            />
            <button type="button" className="btn small" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? "Uploading…" : "Upload"}
            </button>
            <input
              ref={fileRef}
              hidden
              type="file"
              accept="image/*"
              onChange={(e) => {
                onPhotoFile(e.target.files?.[0]);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
            {form.image_url && (
              <button type="button" className="btn small ghost" onClick={() => set({ image_url: "" })}>
                Remove
              </button>
            )}
          </div>
        </Field>
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
            <input className="w-cc" value={form.country_code} placeholder="Code" onChange={(e) => set({ country_code: e.target.value })} />
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
          <h3>My AI <small>Optional — you can add it later</small></h3>
          <Field label="AI agent" error={err("agent_id")}>
            <select value={form.agent_id} onChange={(e) => set({ agent_id: e.target.value })}>
              <option value="">{agentsLoading && agents.length === 0 ? "Loading agents…" : "No agent — add later"}</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}{a.status && a.status !== "Published" ? " (not published)" : ""}</option>
              ))}
              {form.agent_id && !agentKnown && <option value={form.agent_id}>{form.agent_id}</option>}
            </select>
          </Field>
          <small>If you pick one, a “My AI” button on your card opens it. Leave it empty and the button is simply hidden.</small>
          {agents.length === 0 && !agentsLoading && <small>You don’t have any AI employees yet — you can create one later and come back to add it.</small>}
        </section>
      )}

      <section className="panel">
        <h3>Social links <small>Type a username or paste a link — the other fills in automatically</small></h3>
        {form.social_media.map((s, i) => (
          <div className="stack" key={i}>
            <div className="row">
              <select
                className="w-type"
                value={s.type}
                onChange={(e) => {
                  const type = e.target.value as SocialType;
                  set({ social_media: patchAt(form.social_media, i, { type, ...changeType(type, s) }) });
                }}
              >
                {SOCIAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input
                value={s.username}
                placeholder={USERNAME_PLACEHOLDER[s.type]}
                onChange={(e) => set({ social_media: patchAt(form.social_media, i, fromUsernameInput(s.type, e.target.value)) })}
              />
              <button className="x" aria-label="Remove link" onClick={() => set({ social_media: form.social_media.filter((_, j) => j !== i) })}>×</button>
            </div>
            <input
              value={s.url}
              placeholder="…or paste the profile link — we’ll fill in the username"
              onChange={(e) => set({ social_media: patchAt(form.social_media, i, fromUrlInput(s.type, e.target.value, s)) })}
              onBlur={(e) => {
                const fixed = finalizeUrl(s.type, e.target.value);
                if (fixed) set({ social_media: patchAt(form.social_media, i, fixed) });
              }}
            />
            {(err(`social_media.${i}.url`) || err(`social_media.${i}.username`) || err(`social_media.${i}.type`)) && (
              <small className="err">{err(`social_media.${i}.url`) || err(`social_media.${i}.username`) || err(`social_media.${i}.type`)}</small>
            )}
          </div>
        ))}
        <button className="btn small ghost" onClick={() => set({ social_media: [...form.social_media, { type: "instagram", url: "", username: "" }] })}>
          + Add more social links
        </button>
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
