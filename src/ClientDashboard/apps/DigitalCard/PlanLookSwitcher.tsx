import { ArrowRight, Award, Crown, Sparkles } from "lucide-react";
import type { PlanTier } from "./PlanCardPreview";

const LOOKS: { id: PlanTier; label: string; Icon: typeof Crown }[] = [
  { id: "essential", label: "Essential", Icon: Sparkles },
  { id: "signature", label: "Signature", Icon: Award },
  { id: "prestige", label: "Prestige", Icon: Crown },
];
const RANK: Record<PlanTier, number> = { essential: 0, signature: 1, prestige: 2 };

/**
 * "Preview as" above the editor's live preview: see your own card in each plan's look
 * (standard, silver, gold). Previewing a plan above yours offers the upgrade.
 */
export default function PlanLookSwitcher({
  value,
  current,
  onChange,
  onUpgrade,
}: {
  value: PlanTier;
  /** The account's plan look today. */
  current: PlanTier;
  onChange: (tier: PlanTier) => void;
  onUpgrade: (tier: PlanTier) => void;
}) {
  const upgrade = RANK[value] > RANK[current];
  const name = LOOKS.find((l) => l.id === value)?.label ?? "";
  return (
    <div className="plook">
      <div className="plook-head">
        <span className="plook-title">Preview as</span>
        <div className="plook-seg" role="radiogroup" aria-label="Preview your card in a plan's look">
          {LOOKS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={value === id}
              className={`plook-opt plook-${id}${value === id ? " is-on" : ""}`}
              onClick={() => onChange(id)}
            >
              <Icon size={13} aria-hidden="true" />
              {label}
              {id === current && <span className="plook-yours">Yours</span>}
            </button>
          ))}
        </div>
      </div>
      {upgrade ? (
        <div className={`plook-upgrade plook-${value}`}>
          <span>This is your card on {name}.</span>
          <button type="button" onClick={() => onUpgrade(value)}>
            Upgrade to {name} <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <p className="plook-note">{value === current ? "This is how your card looks today." : `Your plan includes everything in ${name}.`}</p>
      )}
    </div>
  );
}
