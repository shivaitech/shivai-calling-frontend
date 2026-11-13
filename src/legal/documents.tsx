// The text of ShivAI's legal documents. Plain language on purpose: the DPDP Act (s.5) and Rules
// (r.3) want a notice a person can understand on its own, with every purpose and right spelled out.
// Change the facts (names, emails, version) in company.ts, not here.

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  BRAND,
  DATA_PROTECTION_BOARD,
  GRIEVANCE_OFFICER,
  LEGAL_ENTITY,
  LEGAL_PATHS,
  MIN_AGE,
  POLICY_EFFECTIVE,
  REGISTERED_ADDRESS,
  SITE,
  type LegalDocId,
} from "./company";

export interface LegalSection {
  id: string;
  heading: string;
  body: ReactNode;
}
export interface LegalDoc {
  id: LegalDocId;
  title: string;
  short: string;
  /** One-paragraph summary shown above the sections. */
  summary: string;
  sections: LegalSection[];
}

const Mail = ({ to = GRIEVANCE_OFFICER.email }: { to?: string }) => <a href={`mailto:${to}`}>{to}</a>;
const L = ({ doc, children }: { doc: LegalDocId; children: ReactNode }) => <Link to={LEGAL_PATHS[doc]}>{children}</Link>;
const address = REGISTERED_ADDRESS || "available on request from the Grievance Officer";

// ─── Privacy Notice ─────────────────────────────────────────────────────────────────────────────

const privacy: LegalDoc = {
  id: "privacy",
  title: "Privacy Notice",
  short: "Privacy",
  summary: `How ${BRAND} collects, uses, shares and protects personal data, why, for how long, and the rights you have under India's Digital Personal Data Protection Act, 2023 (DPDP Act) and the DPDP Rules, 2025. We collect only what we need, use it only for the purposes listed here, and you can withdraw consent at any time as easily as you gave it.`,
  sections: [
    {
      id: "who",
      heading: "1. Who we are and our two roles",
      body: (
        <>
          <p>
            {LEGAL_ENTITY} ("{BRAND}", "we") runs {SITE} and the {BRAND} apps: AI voice agents, calling campaigns, CRM tools,
            digital business cards and website tools. Registered office: {address}.
          </p>
          <ul>
            <li>
              <b>Data Fiduciary.</b> For your own account (your name, email, billing and how you use {BRAND}), we decide why and
              how the data is processed. This notice covers that data.
            </li>
            <li>
              <b>Data Processor.</b> When a business uses {BRAND} to call, message or store data about <i>its</i> customers and
              contacts, that business is the Data Fiduciary and we process the data only on its instructions, under our{" "}
              <L doc="dpa">Data Processing Addendum</L>. If a business called you through {BRAND}, contact that business first. You
              can also ask us to stop the calls and pass your request on: see <L doc="grievance">Grievance Redressal</L>.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: "data",
      heading: "2. Personal data we collect",
      body: (
        <>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Examples</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Account</td>
                <td>Name, email, password (stored only as a hash), Google sign-in ID, profile photo</td>
                <td>You, Google (if you sign in with Google)</td>
              </tr>
              <tr>
                <td>Business profile</td>
                <td>Company name, role, phone, address, website, logo, team members you invite</td>
                <td>You</td>
              </tr>
              <tr>
                <td>Digital business card</td>
                <td>Name, title, photo, phone, email, social links, video, documents you choose to publish</td>
                <td>You. A card is public by design.</td>
              </tr>
              <tr>
                <td>Billing</td>
                <td>Plan, invoices, billing address, GST number. Card details go straight to Stripe and never reach us.</td>
                <td>You, Stripe</td>
              </tr>
              <tr>
                <td>Calls and conversations</td>
                <td>Phone numbers, call recordings, transcripts, AI summaries, call outcomes, appointment details</td>
                <td>Calls you or your agents make or receive</td>
              </tr>
              <tr>
                <td>Contacts you upload</td>
                <td>Names, numbers, emails and custom fields in your contact lists and CRMs</td>
                <td>You (as Data Fiduciary; we act as Processor)</td>
              </tr>
              <tr>
                <td>Technical</td>
                <td>IP address, device and browser type, log-in times, security logs</td>
                <td>Your device</td>
              </tr>
              <tr>
                <td>Analytics (only with consent)</td>
                <td>Pages viewed, clicks, approximate location</td>
                <td>Google Analytics cookies</td>
              </tr>
            </tbody>
          </table>
          <p>
            We don't ask for Aadhaar, financial account numbers, health records or other sensitive data. Please don't upload it unless
            your use of {BRAND} truly needs it and you have a lawful basis to share it.
          </p>
        </>
      ),
    },
    {
      id: "purposes",
      heading: "3. Why we use it (purposes and legal basis)",
      body: (
        <>
          <table>
            <thead>
              <tr>
                <th>Purpose</th>
                <th>Basis under the DPDP Act</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Create and secure your account; provide the features you use</td>
                <td>Your consent at sign-up (s.6)</td>
              </tr>
              <tr>
                <td>Run AI calls and campaigns, record and transcribe them, and show you the results</td>
                <td>Your consent, and the instructions of the business you work for (s.6, s.8(2))</td>
              </tr>
              <tr>
                <td>Bill you, issue invoices and keep tax records</td>
                <td>Consent, and compliance with law (s.7(c))</td>
              </tr>
              <tr>
                <td>Detect fraud and abuse, keep logs, protect our systems</td>
                <td>Legitimate use for legal compliance and security (s.7, s.8(5))</td>
              </tr>
              <tr>
                <td>Send service messages (billing, security, policy changes)</td>
                <td>Needed to provide the service you asked for</td>
              </tr>
              <tr>
                <td>Product news and offers</td>
                <td>Optional consent: off unless you switch it on</td>
              </tr>
              <tr>
                <td>Analytics cookies</td>
                <td>Optional consent: off unless you switch it on</td>
              </tr>
              <tr>
                <td>Improve {BRAND} using de-identified usage data</td>
                <td>Optional consent: off unless you switch it on</td>
              </tr>
              <tr>
                <td>Respond to lawful requests from courts and government</td>
                <td>Legal obligation (s.7)</td>
              </tr>
            </tbody>
          </table>
          <p>
            <b>We never sell personal data.</b> We never use your call recordings, transcripts or contact lists to train shared AI
            models. We use data only for the purposes above; a new purpose needs a fresh notice and, where required, fresh consent.
          </p>
        </>
      ),
    },
    {
      id: "sharing",
      heading: "4. Who we share it with",
      body: (
        <>
          <p>Only with service providers who process data for us under written contracts, for the purposes above:</p>
          <ul>
            <li>Cloud hosting and storage (e.g. Amazon Web Services)</li>
            <li>Telephony and voice infrastructure (e.g. Twilio, LiveKit)</li>
            <li>Speech-to-text, text-to-speech and AI language models that power your agents (e.g. Google Gemini, OpenAI, Deepgram, Cartesia, Sarvam)</li>
            <li>Payments (Stripe)</li>
            <li>Email delivery (e.g. Resend) and WhatsApp messaging</li>
            <li>Integrations you connect yourself: Google Calendar, Google Sheets, Zoho, WhatsApp</li>
            <li>Google Analytics, only if you allow analytics cookies</li>
          </ul>
          <p>
            We also share data when the law requires it, to protect people's safety, or as part of a merger or sale, which would
            keep this notice in force. A list of our current sub-processors is available from the Grievance Officer.
          </p>
        </>
      ),
    },
    {
      id: "transfers",
      heading: "5. Transfers outside India",
      body: (
        <p>
          Some providers above process data outside India. We transfer data only to countries the Government of India has not
          restricted under s.16 of the DPDP Act. Each provider is bound to protect it to the standard of this notice.
        </p>
      ),
    },
    {
      id: "retention",
      heading: "6. How long we keep it",
      body: (
        <ul>
          <li>Account and profile: while your account is open, then erased within 30 days of closing it.</li>
          <li>
            Call recordings and transcripts: as long as the business that owns them keeps them, by default 12 months. Businesses
            can set a shorter period.
          </li>
          <li>Invoices and tax records: 8 years, as Indian tax law requires.</li>
          <li>Security and access logs: at least 1 year, as the DPDP Rules require, then deleted.</li>
          <li>Consent records: for as long as needed to show what you agreed to.</li>
          <li>
            Inactive accounts: if you don't sign in for 3 years, we'll email you 48 hours before erasing your account, unless the
            law requires us to keep the data.
          </li>
        </ul>
      ),
    },
    {
      id: "rights",
      heading: "7. Your rights",
      body: (
        <>
          <p>Under the DPDP Act you can:</p>
          <ul>
            <li>
              <b>Access</b> a summary of your personal data, how we process it, and who we've shared it with (s.11).
            </li>
            <li>
              <b>Correct, complete or update</b> it (s.12).
            </li>
            <li>
              <b>Erase</b> it, unless the law requires us to keep it (s.12).
            </li>
            <li>
              <b>Withdraw consent</b> at any time, as easily as you gave it (s.6(4)). Withdrawing doesn't undo processing that
              already happened.
            </li>
            <li>
              <b>Nominate</b> someone to use these rights for you after your death or if you become incapacitated (s.14).
            </li>
            <li>
              <b>Complain</b> to our Grievance Officer, and then to the {DATA_PROTECTION_BOARD.name} (s.13).
            </li>
          </ul>
          <p>
            Signed in? Use <b>Settings → Privacy &amp; data</b>. Otherwise use the form on our{" "}
            <L doc="grievance">Grievance Redressal</L> page, or email <Mail />. We may ask you to verify your identity first.
          </p>
        </>
      ),
    },
    {
      id: "children",
      heading: "8. Children",
      body: (
        <p>
          {BRAND} is for businesses and people aged {MIN_AGE} or over. We don't knowingly process children's data, track them, or
          target advertising at them (s.9). If you think a child has given us data, email <Mail /> and we'll erase it.
          Businesses must not use {BRAND} to call or profile children without verifiable parental consent.
        </p>
      ),
    },
    {
      id: "security",
      heading: "9. Security and breaches",
      body: (
        <>
          <p>
            We protect data with encryption in transit (TLS) and at rest, access controls, least-privilege staff access, logging and
            monitoring, and regular reviews (DPDP Rules, r.6).
          </p>
          <p>
            If a personal data breach affects you, we'll tell you without delay: what happened, what it could mean for you, what
            we're doing and how to protect yourself. We'll report it to the {DATA_PROTECTION_BOARD.name} within 72 hours (r.7).
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      heading: "10. Cookies",
      body: (
        <p>
          We use only essential cookies and storage (sign-in, security, your settings) unless you allow analytics. See our{" "}
          <L doc="cookies">Cookie Policy</L>. You can change your choice at any time from <b>Cookie settings</b> in the site footer.
        </p>
      ),
    },
    {
      id: "contact",
      heading: "11. Grievance Officer and complaints",
      body: (
        <>
          <p>
            {GRIEVANCE_OFFICER.name}
            <br />
            Email: <Mail />
            <br />
            Address: {address}
          </p>
          <p>
            We acknowledge every complaint within {GRIEVANCE_OFFICER.ackHours} hours and resolve it within{" "}
            {GRIEVANCE_OFFICER.resolveDays} days (never more than 90). If you're not satisfied, you can complain to the{" "}
            <a href={DATA_PROTECTION_BOARD.url} target="_blank" rel="noopener noreferrer">
              {DATA_PROTECTION_BOARD.name}
            </a>
            .
          </p>
          <p>
            You can ask for this notice in English or in any language listed in the Eighth Schedule of the Constitution of India by
            writing to the Grievance Officer.
          </p>
        </>
      ),
    },
    {
      id: "changes",
      heading: "12. Changes to this notice",
      body: (
        <p>
          We'll post any change here with a new date. If a change affects what you consented to, we'll tell you in the app or by
          email, and ask again where the law requires it. Effective: {POLICY_EFFECTIVE}.
        </p>
      ),
    },
  ],
};

// ─── Terms of Service ───────────────────────────────────────────────────────────────────────────

const terms: LegalDoc = {
  id: "terms",
  title: "Terms of Service",
  short: "Terms",
  summary: `The agreement between you and ${LEGAL_ENTITY} for using ${BRAND}. If you use ${BRAND} for a business, you accept these terms for that business and confirm you may do so.`,
  sections: [
    {
      id: "accept",
      heading: "1. Accepting these terms",
      body: (
        <p>
          By creating an account or using {BRAND} you agree to these Terms, our <L doc="privacy">Privacy Notice</L>, our{" "}
          <L doc="aup">Acceptable Use &amp; Calling Policy</L> and, for business accounts, our{" "}
          <L doc="dpa">Data Processing Addendum</L>. You must be at least {MIN_AGE} years old.
        </p>
      ),
    },
    {
      id: "account",
      heading: "2. Your account",
      body: (
        <ul>
          <li>Give accurate information and keep it up to date.</li>
          <li>Keep your password safe. You're responsible for activity on your account, including by people you invite.</li>
          <li>Tell us at once at <Mail /> if you think your account has been misused.</li>
        </ul>
      ),
    },
    {
      id: "use",
      heading: "3. Using AI agents and calling",
      body: (
        <>
          <p>When you use {BRAND} to call, message or store data about other people, you are the Data Fiduciary for that data and you are responsible for:</p>
          <ul>
            <li>having a lawful basis (usually consent) for every person you contact or whose data you upload;</li>
            <li>following the DPDP Act, TRAI's Telecom Commercial Communications Customer Preference Regulations (including NCPR/DND), and the IT Act;</li>
            <li>telling people they are speaking to an AI and that the call may be recorded;</li>
            <li>honouring opt-out and erasure requests promptly.</li>
          </ul>
          <p>
            Details are in the <L doc="aup">Acceptable Use &amp; Calling Policy</L>. We may pause campaigns or accounts that break it.
          </p>
        </>
      ),
    },
    {
      id: "ai",
      heading: "4. AI output",
      body: (
        <p>
          AI agents can make mistakes. Review important answers, summaries and actions before relying on them. Don't use {BRAND} as
          the only basis for medical, legal, financial or other decisions with serious effects on people.
        </p>
      ),
    },
    {
      id: "billing",
      heading: "5. Plans, payment and refunds",
      body: (
        <ul>
          <li>Paid plans are billed in advance through Stripe, monthly or yearly, and renew until you cancel.</li>
          <li>A plan is active only after payment succeeds. Without payment, your account stays on the free Essential plan.</li>
          <li>Cancel any time from Billing; your plan runs to the end of the period you paid for.</li>
          <li>Prices include or add taxes (such as GST) as shown at checkout.</li>
          <li>Refunds follow the law and any promise made at checkout; contact <Mail /> about a charge.</li>
        </ul>
      ),
    },
    {
      id: "content",
      heading: "6. Your content",
      body: (
        <p>
          You own what you upload: cards, contacts, recordings, documents. You give us permission to host, process and display it
          only to provide {BRAND} to you. You confirm you have the rights to it. Public content, such as a published business card, is
          visible to anyone with the link.
        </p>
      ),
    },
    {
      id: "ours",
      heading: "7. Our service",
      body: (
        <p>
          {BRAND}, its software, design and brand belong to {LEGAL_ENTITY}. Don't copy, resell, reverse-engineer or overload the
          service, or use it to build a competing product. We may change features; we'll give notice of material changes that affect
          paid plans.
        </p>
      ),
    },
    {
      id: "suspend",
      heading: "8. Suspension and closing your account",
      body: (
        <p>
          You can close your account at any time from Settings → Privacy &amp; data. We may suspend or close an account that breaks
          these Terms, the law, or puts other people at risk, and will tell you why unless the law prevents it. After closing, data is
          handled as described in the <L doc="privacy">Privacy Notice</L>.
        </p>
      ),
    },
    {
      id: "liability",
      heading: "9. Liability",
      body: (
        <p>
          {BRAND} is provided "as is". To the extent the law allows, we're not liable for indirect or consequential loss, and our
          total liability is limited to what you paid us in the 12 months before the claim. Nothing here limits liability that the
          law doesn't allow us to limit. You'll compensate us for claims caused by your unlawful use of {BRAND}, including calls
          made without consent.
        </p>
      ),
    },
    {
      id: "law",
      heading: "10. Governing law and disputes",
      body: (
        <p>
          These Terms are governed by the laws of India. Courts at the place of our registered office have exclusive jurisdiction.
          Please raise any concern with us first at <Mail />; most things can be settled quickly.
        </p>
      ),
    },
    {
      id: "changes",
      heading: "11. Changes",
      body: <p>We'll post changes here and tell you about material ones in advance. Effective: {POLICY_EFFECTIVE}.</p>,
    },
  ],
};

// ─── Cookie Policy ──────────────────────────────────────────────────────────────────────────────

const cookies: LegalDoc = {
  id: "cookies",
  title: "Cookie Policy",
  short: "Cookies",
  summary: `${BRAND} uses only the cookies and browser storage needed to run the site, unless you choose to allow analytics. Nothing optional runs before you choose.`,
  sections: [
    {
      id: "what",
      heading: "1. What we use",
      body: (
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>What it does</th>
              <th>Needs consent?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Essential</td>
              <td>Keeps you signed in, protects against fraud, remembers your settings, theme and cookie choice</td>
              <td>No. The site can't work without it.</td>
            </tr>
            <tr>
              <td>Analytics</td>
              <td>Google Analytics (_ga, _gid): which pages are visited and how. IP anonymised; no advertising features.</td>
              <td>Yes. Off by default.</td>
            </tr>
          </tbody>
        </table>
      ),
    },
    {
      id: "none",
      heading: "2. What we don't use",
      body: <p>No advertising cookies, no cross-site tracking pixels, and no selling of browsing data.</p>,
    },
    {
      id: "choice",
      heading: "3. Changing your choice",
      body: (
        <p>
          Use <b>Cookie settings</b> in the site footer, or <b>Settings → Privacy &amp; data</b> when signed in. Switching analytics
          off stops Google Analytics at once and deletes its cookies. You can also block cookies in your browser.
        </p>
      ),
    },
  ],
};

// ─── Data Processing Addendum ───────────────────────────────────────────────────────────────────

const dpa: LegalDoc = {
  id: "dpa",
  title: "Data Processing Addendum",
  short: "DPA",
  summary: `For businesses using ${BRAND}. When you use ${BRAND} to process personal data of your customers, leads, patients or contacts, you are the Data Fiduciary and ${LEGAL_ENTITY} is your Data Processor (DPDP Act s.8(2)). This addendum forms part of the Terms of Service.`,
  sections: [
    {
      id: "roles",
      heading: "1. Roles and instructions",
      body: (
        <p>
          We process Customer Personal Data only to provide {BRAND} and on your documented instructions: your settings, agents,
          campaigns and requests to support. We'll tell you if we believe an instruction breaks the law.
        </p>
      ),
    },
    {
      id: "you",
      heading: "2. Your obligations as Data Fiduciary",
      body: (
        <ul>
          <li>Give people a notice and obtain valid consent (or another lawful basis) before you upload, call or message them.</li>
          <li>Scrub promotional calling lists against the NCPR (DND) registry and respect each person's preferences.</li>
          <li>Disclose at the start of every call that it's an AI agent and whether it's recorded.</li>
          <li>Handle requests from your Data Principals (access, correction, erasure, opt-out) and tell us when data must be erased.</li>
          <li>Don't upload children's data without verifiable parental consent, or sensitive data you don't need.</li>
        </ul>
      ),
    },
    {
      id: "us",
      heading: "3. Our obligations as Data Processor",
      body: (
        <ul>
          <li>Confidentiality: only staff and sub-processors who need access get it, under confidentiality duties.</li>
          <li>Security: encryption in transit and at rest, access control, logging and monitoring (DPDP Rules, r.6).</li>
          <li>Breaches: we notify you without undue delay, and in any case so you can meet the 72-hour Board deadline, with what we know.</li>
          <li>Assistance: we help you answer Data Principal requests and Board enquiries.</li>
          <li>No other use: we don't sell Customer Personal Data or use it to train shared AI models.</li>
        </ul>
      ),
    },
    {
      id: "subs",
      heading: "4. Sub-processors",
      body: (
        <p>
          You authorise the categories of sub-processors listed in our <L doc="privacy">Privacy Notice</L>. We bind each by contract
          to terms at least as protective as this addendum and stay responsible for them. We'll give notice of new sub-processors;
          you may object on reasonable grounds.
        </p>
      ),
    },
    {
      id: "end",
      heading: "5. Deletion and return",
      body: (
        <p>
          You can export your data at any time. When your account closes, or on your instruction, we delete Customer Personal Data
          within 30 days, except what the law requires us to keep, and confirm deletion on request.
        </p>
      ),
    },
    {
      id: "audit",
      heading: "6. Information and audits",
      body: (
        <p>
          On reasonable written request, we'll provide the information you need to show compliance, including security summaries,
          once a year or after a breach.
        </p>
      ),
    },
  ],
};

// ─── Acceptable Use & Calling Policy ───────────────────────────────────────────────────────────

const aup: LegalDoc = {
  id: "aup",
  title: "Acceptable Use & Calling Policy",
  short: "Calling rules",
  summary: `Rules every ${BRAND} account must follow when using AI agents to call, message or collect data. They keep you and the people you contact on the right side of the DPDP Act, TRAI regulations and the IT Act.`,
  sections: [
    {
      id: "consent",
      heading: "1. Consent and lists",
      body: (
        <ul>
          <li>Call or message only people who agreed to hear from you, or who have an existing relationship with you that permits it.</li>
          <li>Don't buy, rent or scrape contact lists.</li>
          <li>Scrub promotional campaigns against the NCPR (DND) registry and keep your own do-not-call list.</li>
          <li>Keep a record of how each contact gave consent. You may be asked for it.</li>
        </ul>
      ),
    },
    {
      id: "disclose",
      heading: "2. Say it's an AI and say it's recorded",
      body: (
        <>
          <p>Every agent must, in its opening line:</p>
          <ul>
            <li>name your business;</li>
            <li>say the caller is an AI assistant;</li>
            <li>say the call may be recorded and transcribed, and why.</li>
          </ul>
          <p>
            Example: <i>"Hi, this is the AI assistant from Acme Clinic. This call may be recorded to help with your appointment.
            Is now a good time?"</i>
          </p>
        </>
      ),
    },
    {
      id: "hours",
      heading: "3. Calling hours and frequency",
      body: (
        <ul>
          <li>Promotional calls only between 9:00 AM and 9:00 PM in the recipient's time zone.</li>
          <li>Don't call the same person repeatedly or in a way that harasses them.</li>
          <li>Use registered telemarketing headers and numbers where TRAI requires them.</li>
        </ul>
      ),
    },
    {
      id: "optout",
      heading: "4. Opt-out, at once",
      body: (
        <p>
          If someone asks to stop, the agent must accept it on the call, and you must stop contacting them. If someone asks to have
          their data erased, do it, or tell us and we'll help. People can also ask us directly through{" "}
          <L doc="grievance">Grievance Redressal</L>; we'll pass the request to you and stop calls to that number from {BRAND}.
        </p>
      ),
    },
    {
      id: "never",
      heading: "5. Never use ShivAI to",
      body: (
        <ul>
          <li>pretend to be a real person, a government body, a bank or another business;</li>
          <li>collect passwords, OTPs, card numbers or Aadhaar numbers over a call;</li>
          <li>call or profile children, or target vulnerable people;</li>
          <li>make threats, harass, discriminate, spread false information, or promote anything illegal;</li>
          <li>record or process people's data without the notice and consent the law requires;</li>
          <li>send spam, phishing or malware.</li>
        </ul>
      ),
    },
    {
      id: "enforce",
      heading: "6. Enforcement",
      body: (
        <p>
          We may pause a campaign, number or account that breaks this policy, and report illegal activity to the authorities. Report
          misuse to <Mail />.
        </p>
      ),
    },
  ],
};

// ─── Grievance Redressal ────────────────────────────────────────────────────────────────────────

const grievance: LegalDoc = {
  id: "grievance",
  title: "Grievance Redressal",
  short: "Grievances",
  summary: `How to reach our Grievance Officer about your personal data, including if a business called you through ${BRAND} and you want the calls to stop. We acknowledge within ${GRIEVANCE_OFFICER.ackHours} hours and resolve within ${GRIEVANCE_OFFICER.resolveDays} days.`,
  sections: [
    {
      id: "officer",
      heading: "Grievance Officer",
      body: (
        <p>
          {GRIEVANCE_OFFICER.name}
          <br />
          Email: <Mail />
          <br />
          Address: {address}
        </p>
      ),
    },
    {
      id: "how",
      heading: "What happens next",
      body: (
        <ol>
          <li>You send the form below, or email us. You get a reference number.</li>
          <li>We acknowledge within {GRIEVANCE_OFFICER.ackHours} hours and may ask you to verify your identity.</li>
          <li>
            We resolve it within {GRIEVANCE_OFFICER.resolveDays} days (never more than 90, as the DPDP Rules require) and tell you
            what we did.
          </li>
          <li>
            Not satisfied? You can complain to the{" "}
            <a href={DATA_PROTECTION_BOARD.url} target="_blank" rel="noopener noreferrer">
              {DATA_PROTECTION_BOARD.name}
            </a>
            .
          </li>
        </ol>
      ),
    },
    {
      id: "called",
      heading: "A business called you through ShivAI?",
      body: (
        <p>
          That business decides why it called you. You can ask it directly, or choose <b>Stop calls / erase my number</b> below: we'll
          block calls to your number from {BRAND} campaigns and pass your request to the business.
        </p>
      ),
    },
  ],
};

export const LEGAL_DOCS: Record<LegalDocId, LegalDoc> = { privacy, terms, cookies, dpa, aup, grievance };
export const LEGAL_ORDER: LegalDocId[] = ["privacy", "terms", "cookies", "dpa", "aup", "grievance"];
