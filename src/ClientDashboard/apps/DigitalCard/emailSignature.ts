import { cardUrl, type BusinessCard } from "../../../services/businessCardAPI";
import { fullPhone } from "./vcard";

/**
 * An email signature made from a card, built for email clients rather than browsers:
 * tables and inline styles only (Gmail, Outlook and Apple Mail drop <style> and classes), Arial,
 * absolute https images with explicit widths, and every text value escaped. Small enough that
 * Gmail never clips it.
 */

export interface SignatureOptions {
  photo: boolean;
  qr: boolean;
  /** The card's plan look: Prestige signs in gold, Signature in slate, else the card's accent colour. */
  tier?: "essential" | "signature" | "prestige";
}

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

function accentFor(card: BusinessCard, tier?: SignatureOptions["tier"]): string {
  if (tier === "prestige") return "#b87908";
  if (tier === "signature") return "#4b5563";
  const c = (card.color_code ?? "").trim();
  return /^#[0-9a-f]{6}$/i.test(c) && !isLight(c) ? c : "#171717";
}

/** The card's public link, tagged so visits from a signature can be told apart. */
export const signatureLink = (card: BusinessCard) => `${cardUrl(card).replace(/\/+$/, "")}/?src=email`;

export function buildSignatureHtml(card: BusinessCard, opts: SignatureOptions): string {
  const accent = accentFor(card, opts.tier);
  const link = esc(signatureLink(card));
  const name = esc(card.full_name.trim());
  const role = esc([card.job_title, card.company_name].map((s) => (s ?? "").trim()).filter(Boolean).join(", "));
  const photo = opts.photo ? httpsUrl(card.image_url) : "";
  const qr = opts.qr ? httpsUrl(card.qr_code) : "";

  const tel = fullPhone(card);
  const phoneShown = esc(`${card.country_code} ${card.phone_number}`.trim());
  const email = (card.email ?? "").trim();
  const site = (card.website ?? "").trim();

  const label = (l: string) => `<span style="color:${accent};font-weight:bold;">${l}</span>&nbsp;`;
  const a = (href: string, text: string) => `<a href="${esc(href)}" style="color:#171717;text-decoration:none;">${text}</a>`;
  const lines = [
    tel ? `${label("P")}${a(`tel:${tel}`, phoneShown)}` : "",
    email ? `${label("E")}${a(`mailto:${email}`, esc(email))}` : "",
    site ? `${label("W")}${a(withHttps(site), esc(host(site)))}` : "",
  ].filter(Boolean);

  const font = "font-family:Arial,Helvetica,sans-serif;";
  const photoCell = photo
    ? `<td style="padding:0 14px 0 0;vertical-align:top;"><a href="${link}" style="text-decoration:none;"><img src="${esc(photo)}" width="72" alt="${name}" style="display:block;width:72px;height:auto;border:0;border-radius:8px;"></a></td>`
    : "";
  const qrCell = qr
    ? `<td style="padding:0 0 0 14px;vertical-align:top;text-align:center;"><a href="${link}" style="text-decoration:none;"><img src="${esc(qr)}" width="68" height="68" alt="QR code for my digital card" style="display:block;width:68px;height:68px;border:0;"></a><div style="${font}font-size:10px;line-height:14px;color:#777777;padding-top:3px;">Scan to save</div></td>`
    : "";
  const buttonText = isLight(accent) ? "#171717" : "#ffffff";

  return [
    `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;${font}color:#171717;">`,
    `<tr>`,
    photoCell,
    `<td style="padding:0 0 0 14px;vertical-align:top;border-left:2px solid ${accent};">`,
    `<div style="${font}font-size:16px;line-height:20px;font-weight:bold;color:#171717;">${name}</div>`,
    role ? `<div style="${font}font-size:13px;line-height:18px;color:#555555;">${role}</div>` : "",
    lines.length ? `<div style="${font}font-size:12px;line-height:19px;color:#333333;padding-top:6px;">${lines.join("<br>")}</div>` : "",
    `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;margin-top:9px;"><tr>`,
    `<td style="background:${accent};border-radius:6px;"><a href="${link}" style="display:inline-block;padding:6px 12px;${font}font-size:12px;line-height:16px;font-weight:bold;color:${buttonText};text-decoration:none;">View my digital card &rarr;</a></td>`,
    `</tr></table>`,
    `</td>`,
    qrCell,
    `</tr>`,
    `</table>`,
  ].join("");
}

/** The same signature as plain text (pasted where HTML isn't accepted). */
export function buildSignatureText(card: BusinessCard): string {
  return [
    card.full_name.trim(),
    [card.job_title, card.company_name].filter(Boolean).join(", "),
    fullPhone(card) ? `P ${card.country_code} ${card.phone_number}` : "",
    card.email ? `E ${card.email}` : "",
    card.website ? `W ${host(card.website)}` : "",
    `My digital card: ${signatureLink(card)}`,
  ]
    .filter(Boolean)
    .join("\n");
}
