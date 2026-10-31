import type { CardData } from "./types";
import { usernameProblem } from "./username";
import { ventureKind } from "./ventureKinds";
import { payMethodProblem } from "./payMe";

/** Mirrors the API's Joi rules so most mistakes are caught before the request. */
export function validateCard(f: CardData): Record<string, string> {
  const e: Record<string, string> = {};
  const name = f.full_name.trim();
  if (!name) e.full_name = "Full name is required";
  else if (name.length < 2) e.full_name = "Full name must be at least 2 characters";
  else if (name.length > 100) e.full_name = "Full name must be at most 100 characters";
  if (!f.job_title.trim()) e.job_title = "Job title is required";
  else if (f.job_title.trim().length > 150) e.job_title = "Job title must be at most 150 characters";
  if (!f.company_name.trim()) e.company_name = "Company name is required";
  else if (f.company_name.trim().length > 150) e.company_name = "Company name must be at most 150 characters";
  const usernameIssue = usernameProblem(f.username ?? "");
  if (usernameIssue) e.username = usernameIssue;
  if (f.tagline.length > 300) e.tagline = "Tagline must be at most 300 characters";
  // A "data:" photo is a local draft — it gets uploaded (and replaced by a short URL) on save.
  if (!f.image_url.startsWith("data:") && f.image_url.length > 500) e.image_url = "Image URL must be at most 500 characters";
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(f.color_code)) e.color_code = "Color code must be a hex color such as #ffffff";
  if (f.country_code.length > 8) e.country_code = "Max 8 characters";
  if (f.phone_number.length > 20) e.phone_number = "Max 20 characters";
  (f.payment_methods ?? []).forEach((m, i) => {
    const problem = payMethodProblem(m);
    if (problem) e[`payment_methods.${i}`] = `${m.label || "A payment option"}: ${problem}`;
  });
  (f.additional_phones ?? []).forEach((p, i) => {
    if (!p.phone_number.trim()) e[`additional_phones.${i}.phone_number`] = "Enter the number, or remove this row";
    else if (p.phone_number.length > 20) e[`additional_phones.${i}.phone_number`] = "Max 20 characters";
    else if (p.phone_number.replace(/\D/g, "").length < 5) e[`additional_phones.${i}.phone_number`] = "That number looks too short";
  });
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Enter a valid email";
  if (f.website.length > 500) e.website = "Website must be at most 500 characters";
  f.social_media.forEach((s, i) => {
    if (s.url.length > 500) e[`social_media.${i}.url`] = "Max 500 characters";
    if (s.username.length > 100) e[`social_media.${i}.username`] = "Max 100 characters";
  });
  f.ventures.forEach((v, i) => {
    if (!v.name.trim()) e[`ventures.${i}.name`] = `Give this ${ventureKind(v.type).label.toLowerCase()} a name`;
    else if (v.name.trim().length > 150) e[`ventures.${i}.name`] = "Max 150 characters";
    if (v.type && v.type !== "venture" && !v.url.trim()) e[`ventures.${i}.url`] = "Add a link or upload a PDF";
    if ((v.description ?? "").trim().length > 300) e[`ventures.${i}.description`] = "Keep the description under 300 characters";
    if (v.url.length > 500) e[`ventures.${i}.url`] = "Max 500 characters";
    // Same as the photo: a "data:" logo is a local draft, uploaded and replaced by a URL on save.
    if (!v.logo_url.startsWith("data:") && v.logo_url.length > 500) e[`ventures.${i}.logo_url`] = "Max 500 characters";
  });
  return e;
}
