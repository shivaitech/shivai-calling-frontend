import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, QrCode, UserRound } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useAgent } from "../contexts/AgentContext";
import { useInstalledApps } from "../marketplace/useInstalledApps";
import { useInlineAuth } from "../hooks/useInlineAuth";
import AuthModel from "../components/AuthModel";
import SEO from "../components/SEO";
import Navbar from "./Website/Navbar";
import CardForm, { type CardPatch } from "../ClientDashboard/apps/DigitalCard/CardForm";
import CardView from "../ClientDashboard/apps/DigitalCard/CardView";
import { CardData } from "../ClientDashboard/apps/DigitalCard/types";
import { clearDraft, loadDraft, saveDraft } from "../ClientDashboard/apps/DigitalCard/draft";
import { validateCard } from "../ClientDashboard/apps/DigitalCard/validate";
import { fileToDataUrl, type ImageKind, resolveCardImages } from "../ClientDashboard/apps/DigitalCard/photo";
import { BusinessCardError, businessCardAPI, cardErrorMessage } from "../services/businessCardAPI";
import { DIGITAL_CARD_CREATE } from "./digitalCardRoutes";
import CreatePlanPicker from "./digitalCardCreatePlan";
import { foundingOfferActive, isFoundingFree } from "./foundingOffer";
import { complimentaryPlan, complimentarySavePlan } from "./complimentaryPlans";
import { pendingPlanHref, savePendingPlan } from "../ClientDashboard/Billing/pendingPlan";
import { handlePlanLimit } from "../ClientDashboard/Billing/planLimit";
import { createWithUsername } from "../ClientDashboard/apps/DigitalCard/autoUsername";
import { PLANS, money, usePlans, type PlanId } from "./digitalCardPricing";
import "../ClientDashboard/apps/DigitalCard/digitalCard.css";
import { USER_BASE_DBC } from "../permissions/dbcAccess";

const CREATE_ROUTE = DIGITAL_CARD_CREATE;

/** ?plan=&billing= from the pricing page, when it's a real paid plan; otherwise {}. */
const paidPlanQuery = (params: URLSearchParams): Record<string, string> => {
  const plan = params.get("plan");
  if (plan !== "essential" && plan !== "signature" && plan !== "prestige") return {};
  return { plan, billing: params.get("billing") === "monthly" ? "monthly" : "annual" };
};

/**
 * DIGITAL_CARD_CREATE — public. The visitor builds their card with no account
 * (everything is autosaved to localStorage). Saving asks them to sign in or
 * sign up; afterwards they see a preview, and "Save card" calls the API and
 * sends them to the dashboard.
 *
 *   edit  ──Save & continue──▶ (sign in / sign up if needed) ──▶ review ──Save card──▶ /dashboard
 */
const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

export default function DigitalCardCreatePage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { agents, isLoading: agentsLoading, refreshAgents } = useAgent();
  const { install } = useInstalledApps();

  // Right after signing in, context state can lag the stored tokens by a tick.
  const hasSession = isAuthenticated || !!localStorage.getItem("auth_tokens");

  const [form, setForm] = useState<CardData>(() => loadDraft("public"));
  // The plan picked on the pricing page (or here): sets the preview look and the checkout after saving.
  const chosen = paidPlanQuery(params);
  const chosenPlan = (chosen.plan as PlanId | undefined) ?? null;
  const chosenBilling = chosen.billing === "monthly" ? "monthly" : "annual";
  const livePlans = usePlans();
  const chosenPlanInfo = livePlans.find((p) => p.id === chosenPlan);
  // Complimentary accounts: their plan (or Signature, if picked) with no payment step.
  const comp = complimentaryPlan(user?.email);
  const compPlan = complimentarySavePlan(comp, chosenPlan);
  const lookTier = compPlan ?? chosenPlan ?? undefined;
  const needsPayment = !comp && !!chosenPlan && !isFoundingFree(chosenPlan);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const step: "edit" | "review" = params.get("step") === "review" ? "review" : "edit";
  const wantsReview = useRef(false); // the visitor pressed "Save & continue" before signing in

  const set = (patch: CardPatch) => setForm((f) => ({ ...f, ...(typeof patch === "function" ? patch(f) : patch) }));

  const goStep = (next: "edit" | "review") => {
    const p = new URLSearchParams(params);
    if (next === "review") p.set("step", "review");
    else p.delete("step");
    setParams(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const auth = useInlineAuth({
    userBase: USER_BASE_DBC,
    // Keep the plan picked on the pricing page through the Google round trip.
    googleReturn: `${CREATE_ROUTE}?${new URLSearchParams({ ...paidPlanQuery(params), step: "review" })}`,
    onSuccess: () => {
      if (wantsReview.current) {
        wantsReview.current = false;
        goStep("review");
      }
    },
  });

  // Autosave the draft on every change — until the card is created, then never write it back.
  const created = useRef(false);
  useEffect(() => {
    if (!created.current) saveDraft("public", form);
  }, [form]);

  // Agents only for a real signed-in user (same test as the rest of the app). A leftover
  // token without a user would otherwise list that account's agents to a "logged out" visitor.
  useEffect(() => {
    if (isAuthenticated && agents.length === 0) refreshAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // The review step needs a valid card and a session (e.g. after a Google round trip or a reload).
  useEffect(() => {
    if (step !== "review" || authLoading) return;
    const v = validateCard(form);
    if (Object.keys(v).length) {
      setErrors(v);
      goStep("edit");
      return;
    }
    if (!hasSession) {
      wantsReview.current = true;
      goStep("edit");
      auth.open("signup", { name: form.full_name, email: form.email });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, authLoading, hasSession]);

  // No account yet: keep picked images in the browser; they're uploaded when the card is saved.
  const onImageFile = async (file: File, kind: ImageKind) => {
    try {
      return await fileToDataUrl(file, kind);
    } catch (e: any) {
      toast.error(e?.message || "Couldn’t use that image");
      return null;
    }
  };

  const saveAndContinue = () => {
    const v = validateCard(form);
    setErrors(v);
    if (Object.keys(v).length) return toast.error("Fix the highlighted fields");
    if (hasSession) {
      goStep("review");
    } else {
      wantsReview.current = true;
      auth.open("signup", { name: form.full_name, email: form.email });
    }
  };

  const saveCard = async () => {
    setSaving(true);
    try {
      const ready = await resolveCardImages(form); // uploads a locally-picked photo/logos first
      await createWithUsername(ready); // no plan with the card: it comes from billing only
      created.current = true;
      clearDraft();
      // Shows as installed immediately (the app page sends non-installers to the marketplace);
      // the server call finishes in the background — a failure just leaves it uninstalled.
      install("digital-card").catch(() => {});
      toast.success("Your digital card is ready!", { duration: 5000 });
      // A paid plan chosen on the pricing page → straight on to pay for it. It's also remembered,
      // so if they leave before paying, Billing and the Digital Card app ask them to finish later.
      // Founding Member is only a tag on free Essential: a paid plan is still paid for.
      if (needsPayment && chosenPlan) {
        savePendingPlan(chosenPlan, chosenBilling);
        navigate(pendingPlanHref({ plan: chosenPlan as "signature" | "prestige", billing: chosenBilling }), { replace: true });
      } else {
        navigate("/app/digital-card?section=cards", { replace: true });
      }
    } catch (e: any) {
      const be = e as BusinessCardError;
      if (handlePlanLimit(be)) {
        // This account already has as many cards as its plan allows: the upgrade dialog explains.
        // The draft is kept, so nothing typed is lost.
      } else if (be.status === 401) {
        wantsReview.current = true;
        toast.error("Your session expired — please sign in to save your card.");
        auth.open("signin", { email: form.email });
      } else if (be.status === 403) {
        toast.error("This account type can’t create business cards (admin and tenant accounts only).");
      } else if (be.status === 422) {
        setErrors(be.fieldErrors);
        toast.error(cardErrorMessage(be));
        goStep("edit");
        // Bring the first problem into view once the form is back.
        setTimeout(() => {
          const first = document.querySelector<HTMLElement>(".dc .form .err");
          first?.closest(".field, .panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
      } else {
        toast.error(cardErrorMessage(be, "Couldn’t save your card. Please try again."));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-slate-900">
      <SEO
        title="Create your digital business card | ShivAI"
        description="Build a digital business card in minutes and share it with one link or QR code."
        path={CREATE_ROUTE}
      />
      <Navbar setAuthMode={auth.setAuthMode} setShowAuthModal={auth.setShowAuthModal} showLinks={false} />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-24 sm:pt-28 lg:pt-32 pb-16">
        <div className="mb-6 flex items-center justify-between gap-4 overflow-hidden">
          <div className="min-w-0">
            <h1 className="text-[28px] leading-[1.1] sm:text-4xl font-bold tracking-tight text-[#171717]">
              {step === "review" ? (
                "Preview your card"
              ) : (
                <>
                  Create your
                  <br className="sm:hidden" /> digital business card
                </>
              )}
            </h1>
            <p className="mt-2 text-[13px] sm:text-base text-[#777] max-w-xl">
              {step === "review"
                ? "This is how people will see your card. Happy with it? Save it."
                : "One link for everything: your profile, contact, payments and more. Your progress is saved on this device."}
            </p>
          </div>
          {/* A mini card with the name and title being typed, in the plan's look (phones and tablets;
              desktop has the full preview beside the form). */}
          {step === "edit" && (
            <div className="dc lg:hidden flex-none" aria-hidden="true">
              <div className={`create-chip${lookTier === "signature" || lookTier === "prestige" ? ` is-${lookTier}` : ""}`}>
                <div className="create-chip-photo">
                  {form.image_url ? <img src={form.image_url} alt="" /> : initialsOf(form.full_name) || <UserRound size={18} strokeWidth={1.8} />}
                </div>
                <p className="create-chip-name">{form.full_name.trim() || "Your name"}</p>
                <p className="create-chip-role">{form.job_title.trim() || form.company_name.trim() || "Your title"}</p>
                <div className="create-chip-foot">
                  <span>{lookTier === "prestige" ? "Prestige" : lookTier === "signature" ? "Signature" : "Digital card"}</span>
                  <QrCode size={13} strokeWidth={1.8} />
                </div>
              </div>
            </div>
          )}
        </div>

        {step === "edit" ? (
          <CreatePlanPicker
            plan={chosenPlan}
            billing={chosenBilling}
            onChange={(p, b) => {
              const next = new URLSearchParams(params);
              next.set("plan", p);
              next.set("billing", b);
              setParams(next, { replace: true });
            }}
          />
        ) : compPlan ? (
          <p className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Plan: <strong className="text-slate-900">{PLANS.find((p) => p.id === compPlan)?.name}</strong> · Free on your account. No payment needed.
          </p>
        ) : (
          chosenPlan && (
            <p className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              Plan: <strong className="text-slate-900">{chosenPlanInfo?.name}</strong> ·{" "}
              {isFoundingFree(chosenPlan)
                ? "Free for life with the Founding Member offer. No payment needed."
                : <>
                    {chosenPlanInfo && (chosenBilling === "annual" ? `${money(chosenPlanInfo.yearly, chosenPlanInfo.currency)}/year` : `${money(chosenPlanInfo.monthly, chosenPlanInfo.currency)}/month`)}. You'll confirm payment right
                    after saving.
                  </>}
            </p>
          )
        )}

        <div className="dc">
          {step === "edit" ? (
            <div className="grid">
              <div className="form">
                <CardForm
                  cardName={lookTier === "signature" || lookTier === "prestige"}
                  form={form}
                  set={set}
                  errors={errors}
                  onImageFile={onImageFile}
                  agents={isAuthenticated ? agents.map((a) => ({ id: a.id, name: a.name, status: a.status })) : null}
                  agentsLoading={agentsLoading}
                  onDocumentFile={hasSession ? (file) => businessCardAPI.uploadDocument(file) : undefined}
                  onVideoFile={hasSession ? (file, onProgress) => businessCardAPI.uploadVideo(file, onProgress) : undefined}
                  videoLocked={lookTier !== "signature" && lookTier !== "prestige"}
                  onRefreshAgents={isAuthenticated ? () => void refreshAgents() : undefined}
                  onDocumentError={(m) => toast.error(m)}
                />
                <div className="savebar">
                  <button className="btn" onClick={saveAndContinue}>Save &amp; continue</button>
                  <button type="button" className="btn ghost preview-jump" onClick={() => document.querySelector(".dc .preview")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                    <Eye size={17} aria-hidden="true" /> Preview
                  </button>
                </div>
              </div>
              <aside className="preview">
                <div className="preview-head">
                  <span className="fsec-ico" aria-hidden="true">
                    <Eye size={19} strokeWidth={1.8} />
                  </span>
                  <span>
                    <strong>Preview your card</strong>
                    <small>Updates as you type</small>
                  </span>
                </div>
                <div className="phone-frame"><CardView card={form} placeholders tier={lookTier} foundingMember={foundingOfferActive() && !comp && (!chosenPlan || chosenPlan === "essential")} /></div>
              </aside>
            </div>
          ) : (
            <div className="grid">
              <div className="form">
                <section className="panel">
                  <h3>Ready to save?</h3>
                  <p className="muted">
                    We’ll create your public link from your name and company, and add the card to your account. You can edit it any time from
                    Digital Business Card → My Cards.
                  </p>
                  <div className="btns">
                    <button className="btn" disabled={saving} onClick={saveCard}>{saving ? "Saving…" : needsPayment ? "Save card & continue to payment" : "Save card"}</button>
                    <button className="btn ghost" disabled={saving} onClick={() => goStep("edit")}>← Edit details</button>
                  </div>
                </section>
              </div>
              <aside className="preview">
                <div className="phone-frame"><CardView card={form} tier={lookTier} /></div>
              </aside>
            </div>
          )}
        </div>
      </main>

      {auth.showAuthModal && <AuthModel {...auth.modalProps} />}
    </div>
  );
}
