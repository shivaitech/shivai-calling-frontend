import { cardUrl, type BusinessCard } from "../../../services/businessCardAPI";
import { fullPhone } from "./vcard";

/**
 * An email signature made from a card, built for email clients rather than browsers:
 * tables and inline styles only (Gmail, Outlook and Apple Mail drop <style> and classes), Arial,
 * absolute https images with explicit widths, and every text value escaped. Small enough that
 * Gmail never clips it.
 */

export type SignatureLayout = "business" | "classic" | "stacked" | "banner" | "compact";

export const SIGNATURE_LAYOUTS: { id: SignatureLayout; label: string; hint: string }[] = [
  { id: "business", label: "Business", hint: "Big name, two columns, coloured footer" },
  { id: "classic", label: "Classic", hint: "Photo, details and QR side by side" },
  { id: "stacked", label: "Centered", hint: "Photo on top, everything centered" },
  { id: "banner", label: "Banner", hint: "Your name on a coloured header" },
  { id: "compact", label: "Compact", hint: "Text only, a few short lines" },
];

/** Layouts that have room for the photo and QR code (Compact is text only). */
export const layoutHasImages = (l: SignatureLayout) => l !== "compact";

export interface SignatureOptions {
  photo: boolean;
  qr: boolean;
  /** The card's plan look: Prestige signs in gold, Signature in slate, else the card's accent colour. */
  tier?: "essential" | "signature" | "prestige";
  layout?: SignatureLayout;
  /** A rounded border around the whole signature. */
  border?: boolean;
  /** The owner's own colour (#rrggbb) for the button, labels and border; otherwise the plan's or card's. */
  color?: string;
}

/** Ready-made signature colours offered beside the default one. */
export const SIGNATURE_COLORS = ["#171717", "#1e3a8a", "#2563eb", "#0f766e", "#047857", "#b91c1c", "#be185d", "#6d28d9"];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Only https images (data: or http images break or get blocked in mail). */
const httpsUrl = (u?: string | null) => {
  const v = (u ?? "").trim();
  return /^https:\/\//i.test(v) ? v : "";
};

const withHttps = (u: string) => (/^https?:\/\//i.test(u) ? u.replace(/^http:/i, "https:") : `https://${u.replace(/^\/+/, "")}`);
const host = (u: string) => u.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/[/?#].*$/, "");

function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.72;
}

/** `hex` mixed towards white by `amount` (0–1): a soft border in the signature's colour. */
function tint(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => mix(c).toString(16).padStart(2, "0")).join("")}`;
}

/** The colour a signature starts with: gold for Prestige, slate for Signature, else the card's accent. */
export function defaultSignatureColor(card: BusinessCard, tier?: SignatureOptions["tier"]): string {
  if (tier === "prestige") return "#b87908";
  if (tier === "signature") return "#4b5563";
  const c = (card.color_code ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(c) && !isLight(c) ? c : "#171717";
}

/** The card's public link, tagged so visits from a signature can be told apart. */
export const signatureLink = (card: BusinessCard) => `${cardUrl(card).replace(/\/+$/, "")}/?src=email`;

/** Social icons as hosted PNGs (mail apps don't show SVG or icon fonts), served from public/email-icons. */
const ICON_BASE = "https://www.callshivai.com/email-icons";
const SOCIAL_NAMES: Record<string, string> = { linkedin: "LinkedIn", instagram: "Instagram", twitter: "X", facebook: "Facebook", youtube: "YouTube", website: "Website" };

const font = "font-family:Arial,Helvetica,sans-serif;";
const table = (style = "") => `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;${font}color:#171717;${style}">`;

export function buildSignatureHtml(card: BusinessCard, opts: SignatureOptions): string {
  const layout = opts.layout ?? "business";
  const accent = /^#[0-9a-f]{6}$/i.test(opts.color ?? "") ? opts.color!.toLowerCase() : defaultSignatureColor(card, opts.tier);
  const onAccent = isLight(accent) ? "#171717" : "#ffffff";
  const link = esc(signatureLink(card));
  const name = esc(card.full_name.trim());
  const role = esc([card.job_title, card.company_name].map((s) => (s ?? "").trim()).filter(Boolean).join(", "));
  const photo = opts.photo && layoutHasImages(layout) ? httpsUrl(card.image_url) : "";
  const qr = opts.qr && layoutHasImages(layout) ? httpsUrl(card.qr_code) : "";

  const tel = fullPhone(card);
  const phoneShown = esc(`${card.country_code} ${card.phone_number}`.trim());
  const email = (card.email ?? "").trim();
  const site = (card.website ?? "").trim();

  const a = (href: string, text: string) => `<a href="${esc(href)}" style="color:#171717;text-decoration:none;">${text}</a>`;
  const lines = [
    tel ? a(`tel:${tel}`, phoneShown) : "",
    email ? a(`mailto:${email}`, esc(email)) : "",
    site ? a(withHttps(site), esc(host(site))) : "",
  ].filter(Boolean);

  const nameDiv = (color = "#171717", size = 16) => `<div style="${font}font-size:${size}px;line-height:${size + 4}px;font-weight:bold;color:${color};">${name}</div>`;
  const roleDiv = (color = "#555555") => (role ? `<div style="${font}font-size:13px;line-height:18px;color:${color};">${role}</div>` : "");
  const contactDiv = (sep = "<br>", align = "left") =>
    lines.length ? `<div style="${font}font-size:12px;line-height:19px;color:#333333;padding-top:6px;text-align:${align};">${lines.join(sep)}</div>` : "";
  const button = (align = "left") =>
    `${table(`margin-top:10px;${align === "center" ? "margin-left:auto;margin-right:auto;" : ""}`)}<tr>` +
    `<td style="background:${accent};border-radius:6px;"><a href="${link}" style="display:inline-block;padding:6px 12px;${font}font-size:12px;line-height:16px;font-weight:bold;color:${onAccent};text-decoration:none;">View my digital card &rarr;</a></td>` +
    `</tr></table>`;
  const photoImg = (size: number, round: boolean) =>
    `<a href="${link}" style="text-decoration:none;"><img src="${esc(photo)}" width="${size}" alt="${name}" style="display:block;width:${size}px;height:auto;border:0;border-radius:${round ? "50%" : "8px"};${round ? `height:${size}px;object-fit:cover;` : ""}"></a>`;
  const qrBlock = (size: number) =>
    `<a href="${link}" style="text-decoration:none;"><img src="${esc(qr)}" width="${size}" height="${size}" alt="QR code for my digital card" style="display:block;width:${size}px;height:${size}px;border:0;margin:0 auto;"></a>` +
    `<div style="${font}font-size:10px;line-height:14px;color:#777777;padding-top:3px;text-align:center;">Scan to save</div>`;
  const socials = (card.social_media ?? []).filter((s) => s.url?.trim() && SOCIAL_NAMES[s.type]).slice(0, 6);
  const socialRow = (size: number, align = "left", top = 10) =>
    socials.length
      ? `${table(`margin-top:${top}px;${align === "center" ? "margin-left:auto;margin-right:auto;" : align === "right" ? "margin-left:auto;" : ""}`)}<tr>` +
        socials
          .map(
            (s, i) =>
              `<td style="padding:0 0 0 ${i ? 6 : 0}px;"><a href="${esc(withHttps(s.url.trim()))}" style="text-decoration:none;"><img src="${ICON_BASE}/${s.type}.png" width="${size}" height="${size}" alt="${SOCIAL_NAMES[s.type]}" style="display:block;width:${size}px;height:${size}px;border:0;"></a></td>`,
          )
          .join("") +
        `</tr></table>`
      : "";

  let inner: string;
  let pad = "14px 16px";
  if (layout === "business") {
    // Big name and role with the website under them, photo top right; a rule; contact details
    // beside the company; then a footer bar in the signature colour with the card link and socials.
    pad = "0";
    const r = opts.border === false ? 12 : 11;
    const label = (l: string) => `<b style="color:#171717;">${l}:</b> `;
    const extraPhones = (card.additional_phones ?? [])
      .filter((p) => p.phone_number?.trim())
      .slice(0, 2)
      .map((p) => {
        const shown = `${p.country_code ?? ""} ${p.phone_number}`.trim();
        const l = (p.label || "mobile").replace(/^./, (c) => c.toUpperCase());
        return `${label(esc(l))}${a(`tel:${shown.replace(/[^\d+]/g, "")}`, esc(shown))}`;
      });
    const rows = [tel ? `${label("Phone")}${a(`tel:${tel}`, phoneShown)}` : "", ...extraPhones, email ? `${label("Email")}${a(`mailto:${email}`, esc(email))}` : ""].filter(Boolean);
    const company = esc((card.company_name ?? "").trim());
    const tagline = (card.tagline ?? "").trim();
    // Long taglines are cut at a word so the signature stays compact.
    const note = esc(tagline.length > 140 ? `${tagline.slice(0, 140).replace(/\s+\S*$/, "")}…` : tagline);
    const cell = `${font}font-size:12.5px;line-height:19px;color:#333333;vertical-align:top;`;
    inner = [
      table(`width:100%;min-width:340px;background:#f6f6f4;border-radius:${r}px;border-collapse:separate;`),
      `<tr><td style="padding:22px 24px 0;">`,
      table("width:100%;"),
      `<tr><td style="vertical-align:top;">`,
      `<div style="${font}font-size:24px;line-height:28px;font-weight:bold;color:#171717;">${name}</div>`,
      card.job_title?.trim() ? `<div style="${font}font-size:14px;line-height:20px;color:#333333;padding-top:2px;">${esc(card.job_title.trim())}</div>` : "",
      note ? `<div style="${font}font-size:12.5px;line-height:18px;color:#666666;padding-top:6px;max-width:340px;">${note}</div>` : "",
      site ? `<div style="${font}font-size:13px;line-height:18px;font-weight:bold;padding-top:12px;"><a href="${esc(withHttps(site))}" style="color:#171717;text-decoration:none;">${esc(host(site))}</a></div>` : "",
      `</td>`,
      photo ? `<td style="vertical-align:top;padding-left:16px;width:84px;"><a href="${link}" style="text-decoration:none;"><img src="${esc(photo)}" width="84" height="84" alt="${name}" style="display:block;width:84px;height:84px;object-fit:cover;border:0;border-radius:18px;"></a></td>` : "",
      `</tr></table>`,
      `</td></tr>`,
      `<tr><td style="padding:16px 24px 0;"><div style="height:1px;line-height:1px;font-size:0;background:${accent};">&nbsp;</div></td></tr>`,
      `<tr><td style="padding:14px 24px 18px;">`,
      table("width:100%;"),
      `<tr>`,
      rows.length ? `<td style="${cell}padding-right:18px;">${rows.join("<br>")}</td>` : "",
      company ? `<td style="${cell}padding-right:${qr ? 14 : 0}px;"><b style="color:#171717;">${company}</b></td>` : "",
      qr ? `<td style="vertical-align:top;width:60px;">${qrBlock(60)}</td>` : "",
      `</tr></table>`,
      `</td></tr>`,
      `<tr><td style="background:${accent};padding:9px 24px;border-radius:0 0 ${r}px ${r}px;">`,
      table("width:100%;"),
      `<tr><td style="vertical-align:middle;"><a href="${link}" style="${font}font-size:12px;line-height:16px;font-weight:bold;color:${onAccent};text-decoration:none;">View my digital card &rarr;</a></td>`,
      socials.length ? `<td style="vertical-align:middle;text-align:right;">${socialRow(22, "right", 0)}</td>` : "",
      `</tr></table>`,
      `</td></tr></table>`,
    ].join("");
  } else if (layout === "stacked") {
    inner = [
      table("margin:0 auto;"),
      `<tr><td style="text-align:center;">`,
      photo ? `<div style="padding-bottom:10px;"><center>${photoImg(72, true)}</center></div>` : "",
      nameDiv(),
      roleDiv(),
      `<div style="width:40px;height:2px;background:${accent};margin:9px auto 3px;line-height:2px;font-size:0;">&nbsp;</div>`,
      contactDiv(" &nbsp;&middot;&nbsp; ", "center"),
      button("center"),
      socialRow(20, "center"),
      qr ? `<div style="padding-top:12px;">${qrBlock(64)}</div>` : "",
      `</td></tr></table>`,
    ].join("");
  } else if (layout === "banner") {
    pad = "0";
    inner = [
      table("width:100%;min-width:300px;"),
      `<tr><td style="background:${accent};padding:12px 16px;border-radius:${opts.border === false ? "8px 8px 0 0" : "11px 11px 0 0"};">`,
      table(),
      `<tr>`,
      photo ? `<td style="padding:0 12px 0 0;vertical-align:middle;">${photoImg(48, true)}</td>` : "",
      `<td style="vertical-align:middle;">${nameDiv(onAccent)}${role ? `<div style="${font}font-size:12.5px;line-height:17px;color:${onAccent};opacity:.85;">${role}</div>` : ""}</td>`,
      `</tr></table>`,
      `</td></tr>`,
      `<tr><td style="padding:10px 16px 14px;">`,
      table("width:100%;"),
      `<tr><td style="vertical-align:top;">${contactDiv()}${button()}${socialRow(20)}</td>`,
      qr ? `<td style="padding:0 0 0 14px;vertical-align:top;width:64px;">${qrBlock(64)}</td>` : "",
      `</tr></table>`,
      `</td></tr></table>`,
    ].join("");
  } else if (layout === "compact") {
    inner = [
      `<div style="${font}font-size:14px;line-height:19px;color:#171717;"><b>${name}</b>${role ? `<span style="color:#555555;"> &nbsp;|&nbsp; ${role}</span>` : ""}</div>`,
      lines.length ? `<div style="${font}font-size:12px;line-height:18px;color:#333333;padding-top:3px;">${lines.join(" &nbsp;|&nbsp; ")}</div>` : "",
      `<div style="${font}font-size:12px;line-height:18px;padding-top:4px;"><a href="${link}" style="color:${accent};font-weight:bold;text-decoration:none;">View my digital card &rarr;</a></div>`,
    ].join("");
  } else {
    inner = [
      table(),
      `<tr>`,
      photo ? `<td style="padding:0 14px 0 0;vertical-align:top;">${photoImg(72, false)}</td>` : "",
      `<td style="padding:0 0 0 14px;vertical-align:top;border-left:2px solid ${accent};">`,
      nameDiv(),
      roleDiv(),
      contactDiv(),
      button(),
      socialRow(20),
      `</td>`,
      qr ? `<td style="padding:0 0 0 14px;vertical-align:top;text-align:center;">${qrBlock(68)}</td>` : "",
      `</tr></table>`,
    ].join("");
  }

  // The outer frame: a rounded border in a soft tint of the signature's colour (square in Outlook desktop).
  const frame = opts.border === false ? "" : `border:1px solid ${tint(accent, 0.72)};border-radius:12px;`;
  return `${table(`border-collapse:separate;${frame}`)}<tr><td style="padding:${opts.border === false && pad !== "0" ? "0" : pad};">${inner}</td></tr></table>`;
}

/** The same signature as plain text (pasted where HTML isn't accepted). */
export function buildSignatureText(card: BusinessCard): string {
  return [
    card.full_name.trim(),
    [card.job_title, card.company_name].filter(Boolean).join(", "),
    fullPhone(card) ? `${card.country_code} ${card.phone_number}` : "",
    card.email ?? "",
    card.website ? host(card.website) : "",
    `My digital card: ${signatureLink(card)}`,
  ]
    .filter(Boolean)
    .join("\n");
}
