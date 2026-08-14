/**
 * Universal Outbound Voice Agent — Prompt Shell
 * Master skeleton used when Primary channel = Outbound during AI employee creation.
 */

export type DeploymentMode = "web" | "inbound" | "outbound";

export type OutboundVariant =
  | "qualification"
  | "sales"
  | "filtering"
  | "feedback"
  | "renewal"
  | "promotional"
  | "appointment"
  | "collections"
  | "survey"
  | "reminder"
  | "winback"
  | "demo"
  | "verification";

/** Map wizard business-process values → outbound variant modules. */
export const businessProcessToOutboundVariant = (
  businessProcess: string
): OutboundVariant => {
  const key = String(businessProcess || "").toLowerCase();
  if (key.includes("filter") || key.includes("triage")) return "filtering";
  if (key.includes("nps") || key.includes("survey") || key.includes("csat")) return "survey";
  if (key.includes("feedback")) return "feedback";
  if (key.includes("renewal") || key.includes("retention")) return "renewal";
  if (key.includes("winback") || key.includes("win-back") || key.includes("reactivat")) return "winback";
  if (key.includes("promo") || key.includes("event") || key.includes("announcement")) return "promotional";
  if (key.includes("demo") || key.includes("product-tour")) return "demo";
  if (key.includes("appointment") || key.includes("schedul") || key.includes("booking")) return "appointment";
  if (key.includes("collect") || key.includes("payment") || key.includes("dues") || key.includes("invoice")) return "collections";
  if (key.includes("remind") || key.includes("confirm") || key.includes("follow-up-remind")) return "reminder";
  if (key.includes("verif") || key.includes("kyc") || key.includes("document")) return "verification";
  if (key.includes("sales") || key.includes("marketing") || key.includes("upsell") || key.includes("cross-sell")) return "sales";
  if (key.includes("qualif") || key.includes("lead") || key.includes("discovery")) return "qualification";
  return "qualification";
};

export const OUTBOUND_VARIANT_LABELS: Record<OutboundVariant, string> = {
  qualification: "QUALIFICATION",
  sales: "SALES",
  filtering: "FILTERING/TRIAGE",
  feedback: "FEEDBACK",
  renewal: "RENEWAL / RETENTION",
  promotional: "PROMOTIONAL",
  appointment: "APPOINTMENT SETTING",
  collections: "COLLECTIONS / PAYMENT REMINDER",
  survey: "SURVEY / NPS",
  reminder: "REMINDER / CONFIRMATION",
  winback: "WIN-BACK / REACTIVATION",
  demo: "DEMO BOOKING",
  verification: "VERIFICATION / DOCUMENTATION",
};

/** Step-3 business process options filtered by primary channel. */
export const BUSINESS_PROCESS_BY_CHANNEL: Record<
  DeploymentMode,
  Array<{ value: string; label: string; icon: string }>
> = {
  web: [
    { value: "customer-support", label: "Customer Support", icon: "🎧" },
    { value: "sales-marketing", label: "Sales & Marketing", icon: "💼" },
    { value: "appointment-setting", label: "Appointment Setting", icon: "📅" },
    { value: "lead-qualification", label: "Lead Qualification", icon: "🎯" },
    { value: "technical-support", label: "Technical Support", icon: "🔧" },
    { value: "order-processing", label: "Order Processing", icon: "📦" },
    { value: "billing-inquiries", label: "Billing Inquiries", icon: "💳" },
    { value: "onboarding", label: "Customer Onboarding", icon: "🚀" },
    { value: "product-recommendations", label: "Product Recommendations", icon: "✨" },
    { value: "faq-assistant", label: "FAQ & Knowledge Assistant", icon: "📖" },
    { value: "booking-reschedule", label: "Bookings & Rescheduling", icon: "🗓️" },
    { value: "returns-refunds", label: "Returns & Refunds", icon: "↩️" },
  ],
  inbound: [
    { value: "customer-support", label: "Customer Support", icon: "🎧" },
    { value: "appointment-setting", label: "Appointment Setting", icon: "📅" },
    { value: "lead-qualification", label: "Inbound Lead Qualification", icon: "🎯" },
    { value: "technical-support", label: "Technical Support", icon: "🔧" },
    { value: "order-processing", label: "Order Status & Tracking", icon: "📦" },
    { value: "billing-inquiries", label: "Billing Inquiries", icon: "💳" },
    { value: "onboarding", label: "Customer Onboarding", icon: "🚀" },
    { value: "receptionist-routing", label: "Receptionist & Call Routing", icon: "☎️" },
    { value: "emergency-triage", label: "Urgent / Priority Triage", icon: "🚨" },
    { value: "claims-intake", label: "Claims & Intake", icon: "📋" },
    { value: "booking-reschedule", label: "Bookings & Rescheduling", icon: "🗓️" },
    { value: "returns-refunds", label: "Returns & Refunds", icon: "↩️" },
  ],
  outbound: [
    { value: "lead-qualification", label: "Lead Qualification", icon: "🎯" },
    { value: "sales-marketing", label: "Sales Outreach", icon: "💼" },
    { value: "appointment-setting", label: "Appointment Setting", icon: "📅" },
    { value: "demo-booking", label: "Demo / Walkthrough Booking", icon: "🖥️" },
    { value: "lead-filtering", label: "Lead Filtering / Triage", icon: "⚡" },
    { value: "feedback-collection", label: "Feedback Collection", icon: "💬" },
    { value: "nps-survey", label: "NPS / CSAT Survey", icon: "📊" },
    { value: "renewal-retention", label: "Renewal & Retention", icon: "🔄" },
    { value: "winback-reactivation", label: "Win-back / Reactivation", icon: "🧲" },
    { value: "promotional-outreach", label: "Promotional Outreach", icon: "📣" },
    { value: "event-invitation", label: "Event / Webinar Invite", icon: "🎟️" },
    { value: "payment-reminder", label: "Payment / Invoice Reminder", icon: "💸" },
    { value: "collections-followup", label: "Collections Follow-up", icon: "🏦" },
    { value: "appointment-reminder", label: "Appointment Reminder", icon: "⏰" },
    { value: "delivery-confirmation", label: "Delivery / Visit Confirmation", icon: "🚚" },
    { value: "upsell-cross-sell", label: "Upsell / Cross-sell", icon: "📈" },
    { value: "document-verification", label: "Document / KYC Verification", icon: "✅" },
    { value: "post-purchase-checkin", label: "Post-purchase Check-in", icon: "🤝" },
  ],
};

export const CHANNEL_STEP3_COPY: Record<
  DeploymentMode,
  { title: string; subtitle: string }
> = {
  web: {
    title: "What should your AI Employee do?",
    subtitle:
      "Select the main task your AI will handle on web chat. This shapes how it responds and what skills it prioritizes.",
  },
  inbound: {
    title: "What should your AI Employee do on inbound calls?",
    subtitle:
      "Select the main task for answering customer phone calls. This determines greeting style, routing, and support skills.",
  },
  outbound: {
    title: "What kind of outbound calls will they make?",
    subtitle:
      "Pick one outbound mission. Templates and system prompts are built as pure outbound voice agents for that mission.",
  },
};

const VARIANT_OBJECTIVE_BLOCK: Record<OutboundVariant, string> = {
  qualification: `[QUALIFICATION VARIANT]
Never assume interest. Determine: interest level, intent, timeline, decision-making authority, budget, next action.
Sequence: state purpose → gauge intent → qualify → classify → capture info → route to human.`,
  sales: `[SALES VARIANT]
Move a qualified lead toward a concrete commitment (demo, deposit, signed order, site visit).
Sequence: confirm context → reconfirm need/fit → handle objections → propose next step → get explicit commitment.
Guardrail: no invented pricing, no guaranteed outcomes/ROI, no unauthorized discounts.`,
  filtering: `[FILTERING/TRIAGE VARIANT]
Fast binary/ternary sort only — do not qualify in depth. Determine: real vs. spam/wrong-number, rough interest bucket, correct department to route to.
Sequence: identify callee context → one or two filter questions → route or disqualify. Keep the call short.`,
  feedback: `[FEEDBACK VARIANT]
Do not resolve issues. Capture sentiment and specifics, then hand off.
Sequence: open-ended experience question → specific probes → sentiment classification → close (thank / escalate).`,
  renewal: `[RENEWAL / RETENTION VARIANT]
Confirm current status → gauge satisfaction/usage → identify renewal blockers → offer next step (human callback, renewal link, retention offer within authorized policy).`,
  promotional: `[PROMOTIONAL VARIANT]
Warm outreach about offers/engagement. Gauge brand familiarity, experience, intent to engage. Share promo info only if asked. Never hard-sell.`,
  appointment: `[APPOINTMENT SETTING VARIANT]
Confirm interest → propose times → lock a specific slot or arrange human callback with a clear time. Never invent calendar availability.`,
  collections: `[COLLECTIONS / PAYMENT REMINDER VARIANT]
Be respectful and non-threatening. Confirm identity lightly → state purpose (payment/invoice reminder) → confirm awareness → capture intent to pay / dispute → offer authorized next step (human callback, payment link if pre-approved).
Never invent balances, due dates, penalties, or legal consequences. Escalate disputes immediately.`,
  survey: `[SURVEY / NPS VARIANT]
Keep it short. Ask for overall score → one open reason → optional follow-up probe → thank and close.
Do not resolve complaints on the call — offer escalation if negative. Never pressure for a high score.`,
  reminder: `[REMINDER / CONFIRMATION VARIANT]
Confirm the upcoming appointment/delivery/visit details → ask confirm / reschedule / cancel → capture preference → close.
Never invent times or locations. If details are missing, escalate to a human.`,
  winback: `[WIN-BACK / REACTIVATION VARIANT]
Acknowledge inactivity politely → ask what changed → listen for blockers → offer authorized reactivation path (callback, offer within policy) → classify interest.
Never guilt-trip or invent discounts.`,
  demo: `[DEMO BOOKING VARIANT]
Confirm interest in a product walkthrough → capture use case briefly → propose demo slots or hand off for scheduling → get explicit commitment.
No deep pitching; no invented product capabilities.`,
  verification: `[VERIFICATION / DOCUMENTATION VARIANT]
Confirm identity carefully → explain what documents/info are needed and why → capture status (ready / missing / needs help) → schedule next step or escalate.
Never request OTPs, passwords, or full card numbers. Follow compliance rules for sensitive data.`,
};

/**
 * Instructions injected into metadata template generation for outbound agents.
 * First-message quality is critical for customer impression on first test.
 */
export const buildOutboundMetadataInstructions = (opts: {
  employeeName: string;
  companyName: string;
  businessProcess: string;
  industry: string;
  variant: OutboundVariant;
}): string => {
  const variantLabel = OUTBOUND_VARIANT_LABELS[opts.variant];
  return `
═══════════════════════════════════════════════════════════════════
PRIMARY CHANNEL: OUTBOUND VOICE (PURE OUTBOUND — NOT INBOUND / NOT WEB CHAT)
═══════════════════════════════════════════════════════════════════
Generate PURE OUTBOUND calling templates only. The AI places the call; the customer did not initiate it.

Variant for this agent: ${variantLabel}
Business process: ${opts.businessProcess}
Industry: ${opts.industry}

Use the Universal Outbound Voice Agent shell. Every template MUST include:
1. Identity with role + explicit negative boundary (what the agent is NOT)
2. Mission as a single outbound sentence
3. Voice & tone for outbound (acknowledge they didn't ask for the call)
4. Primary objective for the ${variantLabel} variant only
5. Call flow: opening → busy → voicemail → DNC/opt-out → discovery (one question at a time) → confirmation → close
6. Internal HOT/WARM/COLD classification (never disclosed)
7. Escalation rules + hard guardrails

🔴 FIRST MESSAGE (CRITICAL — must impress on first test call):
- MUST be a natural outbound opening that asks for permission to continue
- Pattern: "Hi {{customer_name if known}}, this is ${opts.employeeName} from ${opts.companyName}. {{one-line reason}}. Do you have a couple of minutes?"
- Warm, confident, concise — not salesy, not robotic, not inbound ("Thanks for calling…")
- Never open with stacked questions or a pitch dump

firstMessage examples of quality:
- "Hi, this is ${opts.employeeName} from ${opts.companyName}. I'm following up on your recent enquiry — do you have a couple of minutes?"
- "Hi, this is ${opts.employeeName} calling from ${opts.companyName}. Hope I'm not catching you at a bad time — this'll only take a minute."

conversationExamples MUST be outbound-style (agent initiated). Never use inbound greetings like "Thank you for calling".

Both templates must be DIFFERENT outbound focuses within this variant (e.g. qualification depth vs. fast filter, or soft sell vs. appointment lock).
`.trim();
};

/**
 * Full system-prompt generation brief for Gemini when channel = outbound.
 * Keeps shell section order for model reliability.
 */
export const buildOutboundSystemPromptBrief = (opts: {
  employeeName: string;
  companyName: string;
  templateName: string;
  description: string;
  industry: string;
  businessProcess: string;
  subIndustry?: string;
  manualKnowledge?: string;
  variant: OutboundVariant;
}): string => {
  const variantLabel = OUTBOUND_VARIANT_LABELS[opts.variant];
  const objective = VARIANT_OBJECTIVE_BLOCK[opts.variant];
  const subLine = opts.subIndustry ? `\nSub-industry: ${opts.subIndustry}` : "";
  const kb = opts.manualKnowledge?.trim()
    ? `\n\nCompany Knowledge Block (facts the agent may rely on):\n${opts.manualKnowledge.substring(0, 3000)}`
    : "";

  return `You are an expert outbound voice-agent prompt engineer. Using the Universal Outbound Voice Agent shell below, generate a COMPLETE production system prompt for a PURE OUTBOUND voice agent.

Agent Details:
- AI Employee Name: "${opts.employeeName}" (exact — never a placeholder)
- Company: "${opts.companyName}" (exact — never a placeholder)
- Role / template: ${opts.templateName}
- Description: ${opts.description}
- Industry: ${opts.industry}${subLine}
- Business process: ${opts.businessProcess}
- Outbound variant: ${variantLabel}${kb}

Fill every section. Keep section order. Keep hard guardrails. Only include modules relevant to ${variantLabel}.
This is OUTBOUND: the agent initiates the call. Never write inbound phone-tree or website-chat behavior.

Primary objective for this variant (keep this; adapt details to the business):
${objective}

Write the system prompt using EXACTLY these section headings in this order:

## 1. Identity
Who the agent is, role definition, EXPLICIT negative boundary (what they must NOT do), and a single-sentence Mission.

## 2. Voice & Tone
3–5 tone adjectives, conversational register, personalization rules, outbound context awareness (customer didn't initiate the call), natural filler phrases used sparingly.

## 3. Primary Objective
Only the ${variantLabel} variant objective, adapted to this business. Delete other variants.

## 4. Call Flow
OPENING (impressive first-test quality — ask for a couple of minutes)
IF BUSY → callback time
IF VOICEMAIL → short professional message
IF DO-NOT-CALL / OPTS OUT → end immediately, no soft re-asks
DISCOVERY / BODY — one question at a time, with branching
CLASSIFICATION CHECKPOINT (internal, silent)
CONFIRMATION BEFORE HANDOFF/CLOSE
CLOSING

## 5. Internal Classification (never disclosed)
HOT / WARM / COLD with criteria and actions appropriate to ${variantLabel}.

## 6. Information Exchange & Escalation
What facts may be shared; default deflection; ALWAYS escalate list.

## 7. Hard Guardrails
- Never make false promises or guarantee outcomes, returns, or ROI.
- Never fabricate availability, pricing, or policy details.
- One question per turn. No interrogation pacing.
- Never disclose internal lead scoring/classification.
- Never pressure a "no" — one graceful re-offer max, then respect it.
- Stop collecting info once sufficient for classification — don't over-qualify.
- Respect DNC / opt-out immediately.

## 8. Relevant Variant Modules
Only modules that apply to ${variantLabel} for this business.

## 9. Company Knowledge Block
Static facts the agent can rely on.

⛔ Do NOT include a "Voice Instructions" section — it is injected externally.
⛔ Do NOT write inbound greetings ("Thank you for calling…").
⛔ Opening must impress on first customer test: warm, clear purpose, ask permission to continue.

Return ONLY the system prompt text. No JSON, no markdown code fences, no explanation.`;
};
