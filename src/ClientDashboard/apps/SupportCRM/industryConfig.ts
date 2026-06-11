/**
 * ── Industry configuration layer ─────────────────────────────────────────────
 *
 * Makes the Inquiry/Support CRM dynamic across verticals — telecom, government,
 * healthcare, retail, or a generic fallback. A preset defines the terminology
 * (what a "customer" / "ticket" is called), the ticket categories, the priority
 * scheme, and the default custom fields each industry expects.
 *
 * The active preset + any user-added custom fields are persisted in localStorage
 * so the choice survives reloads. When the backend lands this becomes an API
 * read/write — every consumer keeps working unchanged.
 */

export interface CustomField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "date" | "phone" | "email";
  options?: string[];      // for type === "select"
  required?: boolean;
}

/** A starter department/process suggestion for a vertical. */
export interface DepartmentSeed {
  name: string;
  desc: string;
}

export interface IndustryPreset {
  id: string;
  name: string;            // e.g. "Telecom / Network Provider"
  tagline: string;
  /** Terminology overrides used throughout the UI. */
  terms: {
    customer: string;       // singular, e.g. "Subscriber", "Citizen", "Patient"
    customers: string;      // plural
    ticket: string;         // e.g. "Complaint", "Grievance", "Case"
    tickets: string;
    agent: string;          // e.g. "Agent", "Officer", "Coordinator"
    department: string;     // e.g. "Department", "Cell", "Unit"
  };
  /** Ticket categories typical for this vertical. */
  categories: string[];
  /** Default custom fields shown on a ticket/customer for this vertical. */
  defaultFields: CustomField[];
  /** Starter departments/processes for this vertical. */
  departments: DepartmentSeed[];
}

export const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    id: "telecom",
    name: "Telecom / Network Provider",
    tagline: "Subscribers, plans, outages, recharges & billing support.",
    terms: { customer: "Subscriber", customers: "Subscribers", ticket: "Complaint", tickets: "Complaints", agent: "Agent", department: "Department" },
    categories: ["Network / Outage", "Billing & Recharge", "Plan Change", "SIM / Activation", "KYC", "Roaming", "Complaint Follow-up"],
    defaultFields: [
      { key: "mobile_number", label: "Mobile Number", type: "phone", required: true },
      { key: "circle", label: "Telecom Circle", type: "select", options: ["Delhi", "Mumbai", "Karnataka", "Tamil Nadu", "UP East", "Maharashtra"] },
      { key: "plan", label: "Current Plan", type: "text" },
      { key: "account_id", label: "Account ID", type: "text" },
    ],
    departments: [
      { name: "Network Operations", desc: "Outages, coverage & connectivity issues" },
      { name: "Billing & Payments", desc: "Recharges, bills, refunds & disputes" },
      { name: "Retention", desc: "Win-backs, plan changes & cancellations" },
      { name: "Activations & KYC", desc: "New SIMs, porting & verification" },
    ],
  },
  {
    id: "government",
    name: "Government / Public Institution",
    tagline: "Citizen grievances, RTI, permits, schemes & civic services.",
    terms: { customer: "Citizen", customers: "Citizens", ticket: "Grievance", tickets: "Grievances", agent: "Officer", department: "Department" },
    categories: ["Grievance / Complaint", "RTI Request", "Certificate / Permit", "Scheme Enrollment", "Water / Sanitation", "Property / Tax", "Public Service"],
    defaultFields: [
      { key: "aadhaar_ref", label: "ID Reference", type: "text" },
      { key: "ward", label: "Ward / Zone", type: "text" },
      { key: "department", label: "Department", type: "select", options: ["Water", "Electricity", "Sanitation", "Revenue", "Health", "Public Works"] },
      { key: "application_no", label: "Application No.", type: "text" },
    ],
    departments: [
      { name: "Grievance Cell", desc: "Public complaints & redressal" },
      { name: "RTI Section", desc: "Right to Information requests" },
      { name: "Permits & Certificates", desc: "Licenses, certificates & approvals" },
      { name: "Schemes & Welfare", desc: "Scheme enrollment & benefits" },
      { name: "Revenue & Tax", desc: "Property tax & revenue queries" },
    ],
  },
  {
    id: "healthcare",
    name: "Healthcare / Hospital",
    tagline: "Patients, appointments, reports, billing & care follow-ups.",
    terms: { customer: "Patient", customers: "Patients", ticket: "Case", tickets: "Cases", agent: "Coordinator", department: "Department" },
    categories: ["Appointment", "Report / Diagnostics", "Billing & Insurance", "Pharmacy", "Complaint", "Follow-up / Recall", "General Inquiry"],
    defaultFields: [
      { key: "patient_id", label: "Patient ID / UHID", type: "text", required: true },
      { key: "department", label: "Department", type: "select", options: ["Cardiology", "Orthopedics", "General Medicine", "Pediatrics", "Radiology", "Emergency"] },
      { key: "doctor", label: "Consulting Doctor", type: "text" },
      { key: "dob", label: "Date of Birth", type: "date" },
    ],
    departments: [
      { name: "Appointments Desk", desc: "Bookings, rescheduling & reminders" },
      { name: "Diagnostics & Reports", desc: "Lab reports & imaging queries" },
      { name: "Billing & Insurance", desc: "Bills, claims & approvals" },
      { name: "Patient Care & Follow-up", desc: "Recalls & post-visit care" },
    ],
  },
  {
    id: "retail",
    name: "Retail / E-commerce",
    tagline: "Customers, orders, returns, refunds & product support.",
    terms: { customer: "Customer", customers: "Customers", ticket: "Ticket", tickets: "Tickets", agent: "Agent", department: "Team" },
    categories: ["Order Status", "Return / Refund", "Product Issue", "Delivery / Logistics", "Payment", "Warranty", "General Inquiry"],
    defaultFields: [
      { key: "order_id", label: "Order ID", type: "text" },
      { key: "product", label: "Product", type: "text" },
      { key: "payment_method", label: "Payment Method", type: "select", options: ["UPI", "Card", "Net Banking", "COD", "Wallet"] },
      { key: "delivery_pin", label: "Delivery PIN", type: "text" },
    ],
    departments: [
      { name: "Order Support", desc: "Order status & modifications" },
      { name: "Returns & Refunds", desc: "Returns, replacements & refunds" },
      { name: "Logistics & Delivery", desc: "Shipping & delivery issues" },
      { name: "Payments", desc: "Payment failures & disputes" },
    ],
  },
  {
    id: "generic",
    name: "Generic / Other",
    tagline: "A flexible starting point for any support operation.",
    terms: { customer: "Customer", customers: "Customers", ticket: "Ticket", tickets: "Tickets", agent: "Agent", department: "Department" },
    categories: ["General Inquiry", "Complaint", "Request", "Feedback", "Technical Issue", "Billing", "Follow-up"],
    defaultFields: [
      { key: "reference", label: "Reference ID", type: "text" },
      { key: "region", label: "Region", type: "text" },
    ],
    departments: [
      { name: "General Support", desc: "First-line inquiries & requests" },
      { name: "Billing", desc: "Payments & billing queries" },
      { name: "Escalations", desc: "Complex cases & complaints" },
    ],
  },
];

import { useEffect, useState } from "react";

const STORAGE_KEY = "shivai_supportcrm_industry";
const CUSTOM_FIELDS_KEY = "shivai_supportcrm_custom_fields";
const INDUSTRY_EVENT = "shivai:industry-changed";

export function getActiveIndustryId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || "telecom";
  } catch {
    return "telecom";
  }
}

export function setActiveIndustryId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent(INDUSTRY_EVENT));
  } catch {
    /* ignore */
  }
}

export function getActivePreset(): IndustryPreset {
  const id = getActiveIndustryId();
  return INDUSTRY_PRESETS.find((p) => p.id === id) || INDUSTRY_PRESETS[0];
}

export function getCustomFields(): CustomField[] {
  try {
    const raw = localStorage.getItem(CUSTOM_FIELDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomFields(fields: CustomField[]): void {
  try {
    localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(fields));
    window.dispatchEvent(new CustomEvent(INDUSTRY_EVENT));
  } catch {
    /* ignore */
  }
}

/**
 * Hook: returns the active preset + custom fields and re-renders any component
 * when the industry or custom fields change (same tab via custom event).
 */
export function useIndustry() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(INDUSTRY_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(INDUSTRY_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const preset = getActivePreset();
  const customFields = getCustomFields();
  return {
    preset,
    customFields,
    terms: preset.terms,
    categories: preset.categories,
    fields: [...preset.defaultFields, ...customFields],
    activeId: preset.id,
    setIndustry: setActiveIndustryId,
    saveCustomFields,
  };
}
