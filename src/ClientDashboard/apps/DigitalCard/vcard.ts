import type { CardData } from "./types";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

// RFC 6350 line folding at 75 chars
const fold = (line: string) => {
  const out: string[] = [];
  for (let i = 0; i < line.length; i += 74) out.push((i ? " " : "") + line.slice(i, i + 74));
  return out.join("\r\n");
};

export const fullPhone = (c: Pick<CardData, "country_code" | "phone_number">) => {
  const cc = c.country_code.replace(/[^\d]/g, "");
  const num = c.phone_number.replace(/[^\d]/g, "");
  return num ? (cc ? `+${cc}${num}` : num) : "";
};

export function buildVCard(c: CardData, socialUrl: (s: CardData["social_media"][number]) => string): string {
  const parts = c.full_name.trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop()! : "";
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `N:${esc(last)};${esc(parts.join(" "))};;;`, `FN:${esc(c.full_name)}`];
  if (c.company_name) lines.push(`ORG:${esc(c.company_name)}`);
  if (c.job_title) lines.push(`TITLE:${esc(c.job_title)}`);
  const tel = fullPhone(c);
  if (tel) lines.push(`TEL;TYPE=CELL,VOICE:${tel}`);
  if (c.email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${c.email}`);
  [c.website, ...c.social_media.map(socialUrl), ...c.ventures.map((v) => v.url)]
    .filter(Boolean)
    .forEach((u) => lines.push(`URL:${u}`));
  if (c.tagline) lines.push(`NOTE:${esc(c.tagline)}`);
  if (/^https?:\/\//i.test(c.image_url)) lines.push(`PHOTO;VALUE=URI:${c.image_url}`);
  lines.push("END:VCARD");
  return lines.map(fold).join("\r\n");
}

export function downloadVCard(c: CardData, socialUrl: (s: CardData["social_media"][number]) => string) {
  const blob = new Blob([buildVCard(c, socialUrl)], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(c.full_name || "contact").trim().replace(/\s+/g, "-")}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
