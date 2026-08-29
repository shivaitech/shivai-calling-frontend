/**
 * Universal Outbound Voice Agent — Prompt Shell
 * Master skeleton used when Primary channel = Outbound during AI employee creation.
 */

export type DeploymentMode = "webrtc" | "inbound" | "outbound";

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
  webrtc: [
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
  webrtc: {
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

/**
 * Universal Inbound Voice Agent — Prompt Shell
 * Master skeleton used when Primary channel = Inbound during AI employee creation.
 * Mirrors the outbound shell above, but for a pure call-RECEIVING agent —
 * the customer initiated the call, not the AI.
 */

export type InboundVariant =
  | "customer_support"
  | "appointment_booking"
  | "lead_qualification"
  | "technical_support"
  | "order_status"
  | "billing"
  | "onboarding"
  | "receptionist_routing"
  | "emergency_triage"
  | "claims_intake"
  | "returns_refunds";

/** Map wizard business-process values → inbound variant modules. */
export const businessProcessToInboundVariant = (
  businessProcess: string
): InboundVariant => {
  const key = String(businessProcess || "").toLowerCase();
  if (key.includes("emergency") || key.includes("urgent") || key.includes("priority") || key.includes("triage")) return "emergency_triage";
  if (key.includes("receptionist") || key.includes("routing") || key.includes("call-routing")) return "receptionist_routing";
  if (key.includes("claims") || key.includes("intake")) return "claims_intake";
  if (key.includes("technical") || key.includes("tech-support")) return "technical_support";
  if (key.includes("billing") || key.includes("invoice") || key.includes("payment")) return "billing";
  if (key.includes("order") || key.includes("tracking") || key.includes("status")) return "order_status";
  if (key.includes("onboard")) return "onboarding";
  if (key.includes("return") || key.includes("refund")) return "returns_refunds";
  if (key.includes("appointment") || key.includes("schedul") || key.includes("booking") || key.includes("reschedule")) return "appointment_booking";
  if (key.includes("qualif") || key.includes("lead")) return "lead_qualification";
  if (key.includes("support") || key.includes("customer")) return "customer_support";
  return "customer_support";
};

export const INBOUND_VARIANT_LABELS: Record<InboundVariant, string> = {
  customer_support: "CUSTOMER SUPPORT",
  appointment_booking: "APPOINTMENT BOOKING & RESCHEDULING",
  lead_qualification: "INBOUND LEAD QUALIFICATION",
  technical_support: "TECHNICAL SUPPORT",
  order_status: "ORDER STATUS & TRACKING",
  billing: "BILLING INQUIRIES",
  onboarding: "CUSTOMER ONBOARDING",
  receptionist_routing: "RECEPTIONIST & CALL ROUTING",
  emergency_triage: "URGENT / PRIORITY TRIAGE",
  claims_intake: "CLAIMS & INTAKE",
  returns_refunds: "RETURNS & REFUNDS",
};

const INBOUND_VARIANT_OBJECTIVE_BLOCK: Record<InboundVariant, string> = {
  customer_support: `[CUSTOMER SUPPORT VARIANT]
Resolve the caller's issue on this call wherever possible. Identify the problem → confirm understanding → resolve or explain next step → confirm satisfaction → close.
Never leave a caller without a clear resolution or a clear next step.`,
  appointment_booking: `[APPOINTMENT BOOKING & RESCHEDULING VARIANT]
Confirm what the caller needs → check/offer available slots → lock a specific time → confirm details back to caller → close.
Never invent availability. If nothing is available, offer callback or waitlist.`,
  lead_qualification: `[INBOUND LEAD QUALIFICATION VARIANT]
The caller reached out first — they already have interest. Confirm what prompted the call → qualify (need, timeline, fit) → route to sales/booking or answer directly.
Do not re-pitch something they already asked for; move them forward.`,
  technical_support: `[TECHNICAL SUPPORT VARIANT]
Diagnose before advising. Identify product/issue → ask targeted diagnostic questions one at a time → offer a fix or workaround → confirm it worked → escalate if unresolved.
Never guess at a fix — escalate rather than give unconfirmed technical advice.`,
  order_status: `[ORDER STATUS & TRACKING VARIANT]
Identify the order (order number, email, or phone) → look up / confirm status → explain clearly → offer next step if there's an issue.
Never fabricate a tracking status, delivery date, or carrier detail.`,
  billing: `[BILLING INQUIRIES VARIANT]
Verify identity lightly → understand the billing question → explain charges/invoice clearly → offer resolution (adjustment, payment link, escalation).
Never confirm or discuss account details without appropriate verification. Never invent charges or waive fees without authorization.`,
  onboarding: `[CUSTOMER ONBOARDING VARIANT]
Welcome the caller → confirm what they need help setting up → walk through next steps clearly, one at a time → confirm they're set → offer further help.
Keep it encouraging — this is often a new customer's first live interaction with the company.`,
  receptionist_routing: `[RECEPTIONIST & CALL ROUTING VARIANT]
Greet → identify who/what the caller needs → route to the correct department/person or take a message → confirm next step.
Keep it fast — this call should rarely take more than a minute or two.`,
  emergency_triage: `[URGENT / PRIORITY TRIAGE VARIANT]
Assess urgency immediately → if genuinely urgent, escalate/transfer without delay → if not urgent, handle normally or schedule.
Never make the caller wait through a long script if the situation is time-sensitive.`,
  claims_intake: `[CLAIMS & INTAKE VARIANT]
Capture claim/intake details accurately and completely → confirm each key fact back to the caller → explain what happens next and expected timeline.
Never advise on claim outcome, approval likelihood, or payout — that is decided elsewhere.`,
  returns_refunds: `[RETURNS & REFUNDS VARIANT]
Identify the order/item → confirm eligibility per policy → explain the return/refund process and timeline → capture required details.
Never promise a refund outcome outside stated policy; escalate exceptions.`,
};

/**
 * Instructions injected into metadata template generation for inbound agents.
 * First-message quality matters just as much as outbound — this is the caller's
 * first impression that the AI is actually receiving their call, not chatting on web.
 */
export const buildInboundMetadataInstructions = (opts: {
  employeeName: string;
  companyName: string;
  businessProcess: string;
  industry: string;
  variant: InboundVariant;
}): string => {
  const variantLabel = INBOUND_VARIANT_LABELS[opts.variant];
  return `
═══════════════════════════════════════════════════════════════════
PRIMARY CHANNEL: INBOUND VOICE (PURE INBOUND — NOT OUTBOUND / NOT WEB CHAT)
═══════════════════════════════════════════════════════════════════
Generate PURE INBOUND calling templates only. The customer places the call and the AI answers it — the AI never initiates contact.

Variant for this agent: ${variantLabel}
Business process: ${opts.businessProcess}
Industry: ${opts.industry}

Use the Universal Inbound Voice Agent shell. Every template MUST include:
1. Identity with role + explicit negative boundary (what the agent is NOT — e.g. not a website chatbot, not an outbound caller)
2. Mission as a single inbound sentence
3. Voice & tone for inbound (warm, immediately helpful — the caller wants something now)
4. Primary objective for the ${variantLabel} variant only
5. Call flow: answer/greet → identify need → resolve/route/book → confirm → close
6. Escalation rules + hard guardrails

🔴 FIRST MESSAGE (CRITICAL — must impress on first test call):
- MUST be a natural call-answering greeting, as if picking up a ringing phone
- Pattern: "Thank you for calling ${opts.companyName}, this is ${opts.employeeName}. How can I help you today?"
- Warm, professional, immediately useful — never salesy, never robotic, never an outbound opener ("Hi, this is X calling from…")
- Do not ask permission to continue — the caller already called; get straight to helping

firstMessage examples of quality:
- "Thank you for calling ${opts.companyName}, this is ${opts.employeeName}. How can I help you today?"
- "${opts.companyName}, this is ${opts.employeeName} — what can I do for you?"

conversationExamples MUST be inbound-style (customer initiated, AI answering). Never use outbound openers like "Hi, this is X calling from…" or "Do you have a couple of minutes?"

Both templates must be DIFFERENT inbound focuses within this variant (e.g. straightforward resolution vs. a more complex multi-step case).
`.trim();
};

/**
 * Full system-prompt generation brief for Gemini when channel = inbound.
 * Mirrors buildOutboundSystemPromptBrief's rigor and section structure.
 */
export const buildInboundSystemPromptBrief = (opts: {
  employeeName: string;
  companyName: string;
  templateName: string;
  description: string;
  industry: string;
  businessProcess: string;
  subIndustry?: string;
  manualKnowledge?: string;
  variant: InboundVariant;
}): string => {
  const variantLabel = INBOUND_VARIANT_LABELS[opts.variant];
  const objective = INBOUND_VARIANT_OBJECTIVE_BLOCK[opts.variant];
  const subLine = opts.subIndustry ? `\nSub-industry: ${opts.subIndustry}` : "";
  const kb = opts.manualKnowledge?.trim()
    ? `\n\nCompany Knowledge Block (facts the agent may rely on):\n${opts.manualKnowledge.substring(0, 3000)}`
    : "";

  return `You are an expert inbound voice-agent prompt engineer. Using the Universal Inbound Voice Agent shell below, generate a COMPLETE production system prompt for a PURE INBOUND call-answering voice agent.

Agent Details:
- AI Employee Name: "${opts.employeeName}" (exact — never a placeholder)
- Company: "${opts.companyName}" (exact — never a placeholder)
- Role / template: ${opts.templateName}
- Description: ${opts.description}
- Industry: ${opts.industry}${subLine}
- Business process: ${opts.businessProcess}
- Inbound variant: ${variantLabel}${kb}

Fill every section. Keep section order. Keep hard guardrails. Only include modules relevant to ${variantLabel}.
This is INBOUND: the customer calls in and the agent answers. Never write outbound-initiated behavior or website-chat behavior.

Primary objective for this variant (keep this; adapt details to the business):
${objective}

Write the system prompt using EXACTLY these section headings in this order:

## 1. Identity
Who the agent is, role definition, EXPLICIT negative boundary (what they must NOT do — e.g. not a chatbot, does not place outbound calls), and a single-sentence Mission.

## 2. Voice & Tone
3–5 tone adjectives, conversational register, personalization rules, inbound context awareness (caller wants help right now — be immediately useful, not slow to get to the point), natural filler phrases used sparingly.

## 3. Primary Objective
Only the ${variantLabel} variant objective, adapted to this business. Delete other variants.

## 4. Call Flow
ANSWER / GREETING (impressive first-test quality — sound like a real receptionist/agent picking up)
IDENTIFY CALLER NEED — one open question, then targeted follow-ups
VERIFICATION (if the variant requires it — light identity/order/account check)
RESOLUTION / ROUTING / BOOKING — the core of the call
CONFIRMATION — repeat back key details
IF UNRESOLVED → clear escalation path with a real next step and timeframe
CLOSING

## 5. Information Exchange & Escalation
What facts may be shared; default deflection for anything outside scope; ALWAYS escalate list.

## 6. Hard Guardrails
- Never make false promises or guarantee outcomes not confirmed by company policy.
- Never fabricate order status, account details, availability, or pricing.
- One question per turn. No interrogation pacing.
- Never pretend to be a human if directly asked.
- Verify identity appropriately before sharing sensitive account information.
- If genuinely urgent/emergency, escalate immediately without a long script.

## 7. Relevant Variant Modules
Only modules that apply to ${variantLabel} for this business.

## 8. Company Knowledge Block
Static facts the agent can rely on.

⛔ Do NOT include a "Voice Instructions" section — it is injected externally.
⛔ Do NOT write outbound openers ("Hi, this is X calling from…", "Do you have a couple of minutes?").
⛔ Opening must impress on first customer test: sound like a real, immediately helpful call-answering agent.

Return ONLY the system prompt text. No JSON, no markdown code fences, no explanation.`;
};
