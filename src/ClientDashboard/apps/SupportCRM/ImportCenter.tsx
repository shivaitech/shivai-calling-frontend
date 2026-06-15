import React, { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "../../../components/GlassCard";
import {
  FileSpreadsheet, FileText, Webhook, Plug, UploadCloud, ArrowLeft, ArrowRight,
  Check, Copy, RefreshCw, CheckCircle2, AlertTriangle, Loader2, Database,
  ChevronRight, X,
} from "lucide-react";
import {
  IMPORT_HISTORY, importSourceMeta, importStatusMeta, ImportSource,
} from "./mockData";
import { useIndustry } from "./industryConfig";
import { SectionTitle } from "./ui";

type View = "home" | ImportSource;

const SOURCES: { id: ImportSource; icon: React.ElementType; title: string; desc: string; tone: string }[] = [
  { id: "csv", icon: FileText, title: "CSV File", desc: "Upload a .csv export of customers or tickets", tone: "from-emerald-500 to-green-400" },
  { id: "excel", icon: FileSpreadsheet, title: "Excel File", desc: "Upload an .xlsx / .xls spreadsheet", tone: "from-green-600 to-emerald-500" },
  { id: "webhook", icon: Webhook, title: "Webhook", desc: "Stream new records in real time via a webhook", tone: "from-violet-500 to-purple-400" },
  { id: "api", icon: Plug, title: "API / Integration", desc: "Sync from Zendesk, Freshdesk, or a custom API", tone: "from-blue-500 to-sky-400" },
];

export const ImportCenter: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { terms } = useIndustry();
  const [view, setView] = useState<View>("home");

  if (view === "csv" || view === "excel") return <FileImport source={view} onBack={() => setView("home")} />;
  if (view === "webhook") return <WebhookImport onBack={() => setView("home")} />;
  if (view === "api") return <ApiImport onBack={() => setView("home")} />;

  return (
    <div className="space-y-5">
      {onBack && (
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to {terms.customers.toLowerCase()}
        </button>
      )}
      <SectionTitle title={`Import ${terms.customers} & Data`} subtitle={`Bring your existing ${terms.customers.toLowerCase()} & ${terms.tickets.toLowerCase()} into ShivAI — from files, webhooks, or APIs`} />

      {/* Source picker */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Choose a source</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SOURCES.map((s, i) => (
            <motion.button
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              onClick={() => setView(s.id)}
              className="group text-left rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.tone} flex items-center justify-center shadow-lg mb-3`}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-slate-800 dark:text-white">{s.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{s.desc}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 mt-3 group-hover:gap-2 transition-all">
                Set up <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* History */}
      <GlassCard>
        <div className="p-4 sm:p-6">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">Recent Imports</h3>
          <div className="space-y-2">
            {IMPORT_HISTORY.map((j) => {
              const sm = importSourceMeta(j.source);
              const st = importStatusMeta(j.status);
              return (
                <div key={j.id} className="flex items-center gap-3 sm:gap-4 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <span className="w-9 h-9 rounded-lg common-bg-icons flex items-center justify-center flex-shrink-0">
                    {j.status === "processing" ? <Loader2 className={`w-4 h-4 animate-spin ${sm.cls}`} /> : <Database className={`w-4 h-4 ${sm.cls}`} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{j.fileName}</p>
                      <span className={`text-[10px] font-semibold ${sm.cls}`}>{sm.label}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{j.date} · by {j.by}</p>
                  </div>
                  <div className="hidden sm:block text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{j.imported.toLocaleString()}<span className="text-slate-400 font-normal"> / {j.records.toLocaleString()}</span></p>
                    {j.failed > 0 && <p className="text-[11px] text-amber-600 dark:text-amber-400">{j.failed} failed</p>}
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${st.cls}`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

// ── File import flow (CSV / Excel): upload → map → preview → done ─────────────
const SAMPLE_COLUMNS = ["Full Name", "Mobile", "Email Address", "City", "Issue / Subject", "Status", "Created Date"];
const FILE_FIELD_TARGETS = [
  { key: "name", label: "Name", auto: "Full Name" },
  { key: "phone", label: "Phone", auto: "Mobile" },
  { key: "email", label: "Email", auto: "Email Address" },
  { key: "location", label: "Location", auto: "City" },
  { key: "subject", label: "Ticket Subject", auto: "Issue / Subject" },
  { key: "status", label: "Status", auto: "Status" },
  { key: "created", label: "Created Date", auto: "Created Date" },
];
const PREVIEW_ROWS = [
  ["Rajesh Kumar", "+91 98xxxxxx01", "rajesh.k@email.com", "Delhi", "Billing query", "Open", "12 Mar 2026"],
  ["Priya Sharma", "+91 98xxxxxx02", "priya.s@email.com", "Mumbai", "Network issue", "Resolved", "10 Mar 2026"],
  ["Amit Patel", "+91 98xxxxxx03", "amit.p@email.com", "Ahmedabad", "Plan upgrade", "In Progress", "09 Mar 2026"],
];

const FileImport: React.FC<{ source: "csv" | "excel"; onBack: () => void }> = ({ source, onBack }) => {
  const { terms } = useIndustry();
  const [step, setStep] = useState(0); // 0 upload, 1 map, 2 preview, 3 done
  const [fileName, setFileName] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>(
    Object.fromEntries(FILE_FIELD_TARGETS.map((t) => [t.key, t.auto]))
  );
  const accept = source === "csv" ? ".csv" : ".xlsx,.xls";
  const label = source === "csv" ? "CSV" : "Excel";

  const steps = ["Upload", "Map Columns", "Preview", "Done"];

  return (
    <div className="space-y-5 max-w-4xl">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Import options
      </button>
      <SectionTitle title={`Import from ${label}`} subtitle={`Bring ${terms.customers.toLowerCase()} and ${terms.tickets.toLowerCase()} from a ${label} file`} />

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${i <= step ? "" : "opacity-40"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${i < step ? "bg-emerald-500 text-white" : i === step ? "common-button-bg !p-0 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 hidden sm:inline">{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-px ${i < step ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"}`} />}
          </React.Fragment>
        ))}
      </div>

      <GlassCard>
        <div className="p-5 sm:p-6">
          {step === 0 && (
            <div>
              <label className="block">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-10 text-center cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-colors">
                  <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Drag & drop your {label} file here</p>
                  <p className="text-xs text-slate-400 mt-1">or click to browse · {accept}</p>
                  <input type="file" accept={accept} className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name || `sample_${source}_import.${source === "csv" ? "csv" : "xlsx"}`)} />
                </div>
              </label>
              {fileName && (
                <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <FileText className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{fileName}</span>
                  <button onClick={() => setFileName(null)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
              )}
              <div className="flex justify-end mt-5">
                <button disabled={!fileName} onClick={() => setStep(1)}
                  className="common-button-bg flex items-center gap-1.5 !px-4 !py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Match the columns in your file to ShivAI fields. We auto-detected these — adjust if needed.</p>
              <div className="space-y-2.5">
                {FILE_FIELD_TARGETS.map((t) => (
                  <div key={t.key} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300">{t.label}</div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <select value={mapping[t.key]} onChange={(e) => setMapping((m) => ({ ...m, [t.key]: e.target.value }))}
                      className="px-3 py-2 rounded-lg text-sm common-bg-icons">
                      <option value="">— Skip —</option>
                      {SAMPLE_COLUMNS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-5">
                <button onClick={() => setStep(0)} className="common-button-bg2 !px-4 !py-2 rounded-lg text-sm">Back</button>
                <button onClick={() => setStep(2)} className="common-button-bg flex items-center gap-1.5 !px-4 !py-2 rounded-lg text-sm">Preview <ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Preview of the first rows. <span className="font-medium text-slate-700 dark:text-slate-300">4,820 records</span> detected.</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                      {SAMPLE_COLUMNS.map((c) => <th key={c} className="text-left px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {PREVIEW_ROWS.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                        {row.map((cell, j) => <td key={j} className="px-3 py-2 text-slate-600 dark:text-slate-400 whitespace-nowrap">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 4,791 valid · <AlertTriangle className="w-4 h-4 text-amber-500" /> 29 rows need attention
              </div>
              <div className="flex justify-between mt-5">
                <button onClick={() => setStep(1)} className="common-button-bg2 !px-4 !py-2 rounded-lg text-sm">Back</button>
                <button onClick={() => setStep(3)} className="common-button-bg flex items-center gap-1.5 !px-4 !py-2 rounded-lg text-sm"><Database className="w-4 h-4" /> Import 4,820 records</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </motion.div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Import complete</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">4,791 records imported · 29 skipped. Your {terms.customers.toLowerCase()} are now in ShivAI.</p>
              <div className="flex items-center justify-center gap-2 mt-5">
                <button onClick={onBack} className="common-button-bg2 !px-4 !py-2 rounded-lg text-sm">Done</button>
                <button onClick={() => setStep(0)} className="common-button-bg !px-4 !py-2 rounded-lg text-sm">Import another file</button>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

// ── Webhook setup ─────────────────────────────────────────────────────────────
const WebhookImport: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [copied, setCopied] = useState(false);
  // Placeholder values for the mockup. The real endpoint + signing secret are
  // generated server-side and shown here once the webhook is created — never
  // hardcoded. These are obvious dummies so secret scanners don't flag them.
  const url = "https://api.callshivai.com/v1/ingest/<your-webhook-id>";
  const secret = "•••••••••• generated after you save ••••••••••";
  const copy = (text: string) => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="space-y-5 max-w-3xl">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Import options
      </button>
      <SectionTitle title="Webhook" subtitle="Push new records into ShivAI in real time from your own systems" />

      <GlassCard>
        <div className="p-5 sm:p-6 space-y-5">
          <Field label="Webhook URL" hint="Send POST requests with JSON records to this endpoint.">
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 truncate">{url}</code>
              <button onClick={() => copy(url)} className="common-button-bg2 !p-2 rounded-lg">{copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}</button>
            </div>
          </Field>
          <Field label="Signing Secret" hint="Verify the X-Shivai-Signature header to trust incoming payloads.">
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 truncate">{secret}</code>
              <button onClick={() => copy(secret)} className="common-button-bg2 !p-2 rounded-lg"><Copy className="w-4 h-4" /></button>
            </div>
          </Field>
          <Field label="Record Type" hint="What this webhook delivers.">
            <select className="w-full px-3 py-2 rounded-lg text-sm common-bg-icons">
              <option>Customers</option>
              <option>Tickets</option>
              <option>Both (auto-detect)</option>
            </select>
          </Field>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/15 border border-blue-200/60 dark:border-blue-800/40">
            <Webhook className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">Listening for events. New records will appear in your CRM automatically.</p>
          </div>
          <div className="flex justify-end">
            <button onClick={onBack} className="common-button-bg !px-4 !py-2 rounded-lg text-sm">Save webhook</button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

// ── API / integration setup ───────────────────────────────────────────────────
const ApiImport: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { terms } = useIndustry();
  const [provider, setProvider] = useState("zendesk");
  return (
    <div className="space-y-5 max-w-3xl">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Import options
      </button>
      <SectionTitle title="API / Integration" subtitle={`Sync ${terms.customers.toLowerCase()} & ${terms.tickets.toLowerCase()} from another platform or a custom API`} />

      <GlassCard>
        <div className="p-5 sm:p-6 space-y-5">
          <Field label="Provider">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "zendesk", label: "Zendesk" },
                { id: "freshdesk", label: "Freshdesk" },
                { id: "salesforce", label: "Salesforce" },
                { id: "custom", label: "Custom API" },
              ].map((p) => (
                <button key={p.id} onClick={() => setProvider(p.id)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${provider === p.id ? "common-bg-icons border-slate-300 dark:border-slate-500" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </Field>
          {provider === "custom" && (
            <Field label="API Base URL">
              <input placeholder="https://api.yourcompany.com/v2" className="w-full px-3 py-2 rounded-lg text-sm common-bg-icons" />
            </Field>
          )}
          <Field label="API Key / Token" hint="Stored encrypted. Used to pull records on a schedule.">
            <input type="password" placeholder="••••••••••••••••••••" className="w-full px-3 py-2 rounded-lg text-sm common-bg-icons" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sync">
              <select className="w-full px-3 py-2 rounded-lg text-sm common-bg-icons">
                <option>Customers & Tickets</option>
                <option>Customers only</option>
                <option>Tickets only</option>
              </select>
            </Field>
            <Field label="Frequency">
              <select className="w-full px-3 py-2 rounded-lg text-sm common-bg-icons">
                <option>Every 15 minutes</option>
                <option>Hourly</option>
                <option>Daily</option>
                <option>One-time import</option>
              </select>
            </Field>
          </div>
          <div className="flex items-center justify-between pt-1">
            <button className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <RefreshCw className="w-4 h-4" /> Test connection
            </button>
            <button onClick={onBack} className="common-button-bg flex items-center gap-1.5 !px-4 !py-2 rounded-lg text-sm"><Plug className="w-4 h-4" /> Connect & sync</button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
    {children}
    {hint && <p className="text-xs text-slate-400 mt-1.5">{hint}</p>}
  </div>
);
