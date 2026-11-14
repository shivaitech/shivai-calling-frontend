import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, RotateCcw } from "lucide-react";
import { BusinessCardError, cardErrorMessage } from "../../../services/businessCardAPI";
import { handlePlanLimit } from "../../Billing/planLimit";
import { useInstalledApps } from "../../../marketplace/useInstalledApps";
import { createWithUsername } from "./autoUsername";
import { clearDraft } from "./draft";
import { resolveCardImages } from "./photo";
import type { CardData } from "./types";
import { validateCard } from "./validate";

/**
 * "You started a card but it wasn't saved." Shown in My cards when the account has no cards and
 * this device still holds a card typed on the public creator, so a sign-up that never reached the
 * final save doesn't lose it. Save it in one click, open it in the editor first, or discard it.
 */
export default function UnsavedCardRescue({
  draft,
  onSaved,
  onEdit,
  onDiscard,
}: {
  draft: CardData;
  onSaved: () => void;
  onEdit: () => void;
  onDiscard: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const { install } = useInstalledApps();
  const name = draft.full_name.trim();
  const role = [draft.job_title.trim(), draft.company_name.trim()].filter(Boolean).join(", ");

  const save = async () => {
    // Anything missing or invalid: finish it in the editor, with the problems highlighted there.
    if (Object.keys(validateCard(draft)).length) return onEdit();
    setSaving(true);
    try {
      await createWithUsername(await resolveCardImages(draft));
      clearDraft();
      install("digital-card").catch(() => {});
      toast.success("Your card is saved.");
      onSaved();
    } catch (e) {
      const be = e as BusinessCardError;
      if (handlePlanLimit(be)) return;
      if (be.status === 422) {
        toast.error(cardErrorMessage(be));
        onEdit();
        return;
      }
      toast.error(cardErrorMessage(be, "Couldn’t save your card. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel rescue" aria-live="polite">
      <div className="rescue-head">
        <span className="rescue-ico" aria-hidden="true">
          <RotateCcw size={16} />
        </span>
        <div>
          <h3>Your card isn’t saved yet</h3>
          <p className="muted">
            You started a card for <strong>{name}</strong>
            {role ? ` (${role})` : ""} on this device. Save it to get your link and QR code.
          </p>
        </div>
      </div>
      <div className="rescue-actions">
        <button className="btn" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={15} className="un-spin" aria-hidden="true" /> : null}
          {saving ? "Saving…" : "Save my card"}
        </button>
        <button className="btn ghost" onClick={onEdit} disabled={saving}>
          Review and edit first
        </button>
        <button className="btn-link rescue-discard" onClick={onDiscard} disabled={saving}>
          Discard
        </button>
      </div>
    </section>
  );
}
