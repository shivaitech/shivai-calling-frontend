import { useState } from "react";
import { Country, defaultCountries } from "../../../types/country";

// India first (most cards), then A–Z.
const COUNTRIES: Country[] = [
  ...defaultCountries.filter((c) => c.code === "IN"),
  ...defaultCountries.filter((c) => c.code !== "IN").sort((a, b) => a.name.localeCompare(b.name)),
];

/** Dial-code picker. A transparent native <select> sits over a compact
 *  "flag +code" label, so phones get their own picker and the field stays narrow.
 *  Stores the dial code (e.g. "+91"); a code not in the list is kept as-is. */
export default function CountryCodeSelect({ value, onChange }: { value: string; onChange: (dialCode: string) => void }) {
  // Several countries share a dial code (+1 US/Canada, +7), so remember which one was picked.
  const [iso, setIso] = useState(() => COUNTRIES.find((c) => c.dialCode === value)?.code ?? "");
  const selected =
    COUNTRIES.find((c) => c.code === iso && c.dialCode === value) ?? COUNTRIES.find((c) => c.dialCode === value);
  const custom = value && !selected ? value : "";

  return (
    <div className="cc-select">
      <span className="cc-display" aria-hidden="true">
        {selected ? (
          <>
            <span className="cc-flag">{selected.flag}</span>
            {selected.dialCode}
          </>
        ) : (
          custom || <span className="cc-placeholder">Code</span>
        )}
        <span className="cc-caret">▾</span>
      </span>
      <select
        aria-label="Country code"
        value={selected?.code ?? (custom ? "__custom" : "")}
        onChange={(e) => {
          const c = COUNTRIES.find((x) => x.code === e.target.value);
          if (!c) return;
          setIso(c.code);
          onChange(c.dialCode);
        }}
      >
        <option value="" disabled>
          Select country code
        </option>
        {custom && <option value="__custom">{custom}</option>}
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.name} ({c.dialCode})
          </option>
        ))}
      </select>
    </div>
  );
}
