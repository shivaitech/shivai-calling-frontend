// Data Principal rights under the DPDP Act, 2023: what a person can ask of us, and how it reaches us.
//
//   access      s.11  a summary of the personal data we hold and who we shared it with
//   correction  s.12  correct, complete or update it
//   erasure     s.12  erase it (and close the account)
//   nomination  s.14  name someone to act for them on death or incapacity
//   grievance   s.13  a complaint; answered within 90 days (DPDP Rules), else the Data Protection Board
//   opt_out           someone a ShivAI agent called: stop the calls, erase their number
//
// Endpoints (backend):
//   GET  /privacy/requests            → PrivacyRequest[]        (signed in)
//   POST /privacy/requests            → PrivacyRequest          (signed in)
//   POST /privacy/public-requests     → { reference }           (no sign-in: visitors, people called)
//   GET  /privacy/nominee  · PUT /privacy/nominee               (signed in)
//
// Until an endpoint exists (404/405/501) the request is not lost: it's handed to the person's email
// app, addressed to the Grievance Officer with every detail filled in, and kept on this device so
// the Privacy Center still shows it.

import axios from "axios";
import { GRIEVANCE_OFFICER } from "../legal/company";

const API = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const LOCAL_KEY = "shivai_privacy_requests_v1";
const NOMINEE_KEY = "shivai_nominee_v1";

export type RequestType = "access" | "correction" | "erasure" | "nomination" | "grievance" | "opt_out";
export type RequestStatus = "received" | "in_progress" | "completed" | "rejected" | "sent_by_email";

export const REQUEST_LABEL: Record<RequestType, string> = {
  access: "Copy of my data",
  correction: "Correct my data",
  erasure: "Erase my data",
  nomination: "Nominee",
  grievance: "Complaint",
  opt_out: "Stop calls / erase my number",
};

export interface PrivacyRequest {
  id: string;
  reference: string;
  type: RequestType;
  status: RequestStatus;
  details: string;
  created_at: string;
  /** When we must answer by. */
  due_at: string;
  resolution?: string;
}

export interface Nominee {
  name: string;
  relationship: string;
  email: string;
  phone?: string;
}

export interface PublicRequestInput {
  type: RequestType;
  name: string;
  email: string;
  phone?: string;
  /** The business that called them, if known. */
  business?: string;
  details: string;
}

/** The request went to our email inbox instead of the API (endpoint not live yet). */
export class SentByEmail {
  constructor(public readonly mailto: string, public readonly request: PrivacyRequest) {}
}

function token(): string | null {
  try {
    const t = localStorage.getItem("auth_tokens");
    if (t) return JSON.parse(t).accessToken ?? null;
  } catch {
    /* fall through */
  }
  return localStorage.getItem("authToken");
}
const headers = () => ({ Authorization: `Bearer ${token()}`, "Content-Type": "application/json" });
const notBuilt = (e: any) => [404, 405, 501].includes(e?.response?.status);
const errorText = (e: any) =>
  e?.response?.data?.message || (e?.response ? "Something went wrong. Please try again." : "Can't reach ShivAI right now. Check your connection and try again.");

const day = 86_400_000;
const reference = () => `PR-${Date.now().toString(36).toUpperCase().slice(-6)}`;

function readLocal(): PrivacyRequest[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveLocal(r: PrivacyRequest) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify([r, ...readLocal()].slice(0, 50)));
  } catch {
    /* ignore */
  }
}

function mailtoFor(subject: string, lines: (string | null | undefined)[]) {
  const body = lines.filter((l) => l != null).join("\n");
  return `mailto:${GRIEVANCE_OFFICER.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function localRecord(type: RequestType, details: string): PrivacyRequest {
  const now = Date.now();
  return {
    id: `local-${now}`,
    reference: reference(),
    type,
    status: "sent_by_email",
    details,
    created_at: new Date(now).toISOString(),
    due_at: new Date(now + GRIEVANCE_OFFICER.resolveDays * day).toISOString(),
  };
}

export const privacyAPI = {
  async list(): Promise<PrivacyRequest[]> {
    try {
      const r = await axios.get(`${API}/privacy/requests`, { headers: headers() });
      const server: PrivacyRequest[] = r.data?.data ?? [];
      // Requests sent by email before the endpoint existed stay visible.
      return [...server, ...readLocal().filter((l) => !server.some((s) => s.reference === l.reference))];
    } catch (e) {
      if (notBuilt(e)) return readLocal();
      throw new Error(errorText(e));
    }
  },

  /** Signed-in request. Throws SentByEmail when it was handed to email instead. */
  async create(type: RequestType, details: string, account: { name?: string; email?: string }): Promise<PrivacyRequest> {
    try {
      const r = await axios.post(`${API}/privacy/requests`, { type, details }, { headers: headers() });
      return r.data?.data as PrivacyRequest;
    } catch (e) {
      if (!notBuilt(e)) throw new Error(errorText(e));
      const rec = localRecord(type, details);
      saveLocal(rec);
      throw new SentByEmail(
        mailtoFor(`[${rec.reference}] DPDP request: ${REQUEST_LABEL[type]}`, [
          `Request: ${REQUEST_LABEL[type]}`,
          `Reference: ${rec.reference}`,
          `Account: ${account.name ?? ""} <${account.email ?? ""}>`,
          "",
          details,
          "",
          "Sent from the ShivAI Privacy Center under the Digital Personal Data Protection Act, 2023.",
        ]),
        rec,
      );
    }
  },

  /** No sign-in needed: visitors, and people a ShivAI agent called. */
  async createPublic(input: PublicRequestInput): Promise<{ reference: string }> {
    try {
      const r = await axios.post(`${API}/privacy/public-requests`, input, { headers: { "Content-Type": "application/json" } });
      return { reference: r.data?.data?.reference ?? reference() };
    } catch (e) {
      if (!notBuilt(e)) throw new Error(errorText(e));
      const rec = localRecord(input.type, input.details);
      throw new SentByEmail(
        mailtoFor(`[${rec.reference}] DPDP request: ${REQUEST_LABEL[input.type]}`, [
          `Request: ${REQUEST_LABEL[input.type]}`,
          `Reference: ${rec.reference}`,
          `Name: ${input.name}`,
          `Email: ${input.email}`,
          input.phone ? `Phone: ${input.phone}` : null,
          input.business ? `Business that contacted me: ${input.business}` : null,
          "",
          input.details,
        ]),
        rec,
      );
    }
  },

  async getNominee(): Promise<Nominee | null> {
    try {
      const r = await axios.get(`${API}/privacy/nominee`, { headers: headers() });
      return (r.data?.data as Nominee) ?? null;
    } catch (e) {
      if (!notBuilt(e)) throw new Error(errorText(e));
      try {
        return JSON.parse(localStorage.getItem(NOMINEE_KEY) || "null");
      } catch {
        return null;
      }
    }
  },

  /** Throws SentByEmail when the endpoint isn't live (the nominee is then also kept on this device). */
  async saveNominee(n: Nominee, account: { name?: string; email?: string }): Promise<Nominee> {
    try {
      const r = await axios.put(`${API}/privacy/nominee`, n, { headers: headers() });
      return (r.data?.data as Nominee) ?? n;
    } catch (e) {
      if (!notBuilt(e)) throw new Error(errorText(e));
      try {
        localStorage.setItem(NOMINEE_KEY, JSON.stringify(n));
      } catch {
        /* ignore */
      }
      const rec = localRecord("nomination", `${n.name} (${n.relationship}) · ${n.email}${n.phone ? ` · ${n.phone}` : ""}`);
      saveLocal(rec);
      throw new SentByEmail(
        mailtoFor(`[${rec.reference}] DPDP nomination`, [
          `Account: ${account.name ?? ""} <${account.email ?? ""}>`,
          "",
          "I nominate the person below to exercise my rights under the DPDP Act, 2023 (s.14) in the event of my death or incapacity.",
          `Name: ${n.name}`,
          `Relationship: ${n.relationship}`,
          `Email: ${n.email}`,
          n.phone ? `Phone: ${n.phone}` : null,
        ]),
        rec,
      );
    }
  },
};
