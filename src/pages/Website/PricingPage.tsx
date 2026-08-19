import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight, Rocket, TrendingUp, Building2 } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AuthModel from "../../components/AuthModel";
import QuoteModal from "../../components/QuoteModal";
import SEO from "../../components/SEO";
import { useAuth } from "../../contexts/AuthContext";
import { getHomeRoute } from "../../utils/homeRoute";
import toast from "react-hot-toast";

const PLANS = [
  {
    name: "Starter",
    icon: Rocket,
    tagline: "For small businesses testing AI calling",
    highlights: [
      "1 AI Employee",
      "Website & app integration",
      "Email support",
      "Basic voice analytics",
    ],
  },
  {
    name: "Growth",
    icon: TrendingUp,
    tagline: "For teams scaling call volume across channels",
    highlights: [
      "Multiple AI Employees",
      "Advanced integrations (CRM, calendars, payments)",
      "Priority support",
      "Custom voice branding",
    ],
    featured: true,
  },
  {
    name: "Enterprise",
    icon: Building2,
    tagline: "For large organizations with compliance needs",
    highlights: [
      "Unlimited AI Employees",
      "Dedicated success manager & SLA",
      "On-premises or hybrid deployment",
      "Full white-label solution",
    ],
  },
];

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, completeOnboarding, getGoogleAuthUrl, isLoading, error, clearError } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "", name: "" });
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteContext, setQuoteContext] = useState<string | undefined>(undefined);

  const openSignup = () => {
    setAuthMode("signup");
    setShowAuthModal(true);
  };

  const openQuoteModal = (planName?: string) => {
    setQuoteContext(planName ? `${planName} plan` : undefined);
    setShowQuoteModal(true);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFieldErrors({});
    try {
      if (authMode === "signup") {
        await register(formData.name, formData.email, formData.password, formData.confirmPassword);
        completeOnboarding();
        toast.success("Account created successfully! Welcome aboard.");
        setShowAuthModal(false);
        navigate(getHomeRoute());
      } else {
        const response = await login(formData.email, formData.password);
        setShowAuthModal(false);
        localStorage.setItem("auth_tokens", JSON.stringify(response.tokens));
        localStorage.setItem("auth_user", JSON.stringify(response.user));
        navigate(getHomeRoute());
      }
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        err.response.data.errors.forEach((fe: any) => {
          backendErrors[fe.field] = fe.message;
        });
        setFieldErrors(backendErrors);
      }
      throw err;
    }
  };

  const handleSocialAuth = async (provider: string) => {
    if (provider === "google") {
      try {
        const url = await getGoogleAuthUrl();
        window.location.href = url;
      } catch {}
    }
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How is ShivAI priced?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ShivAI pricing is based on your call volume, number of AI Employees, languages required, and integrations needed. Request a custom quote and we'll size a plan to your usage.",
        },
      },
      {
        "@type": "Question",
        name: "Is there a free trial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, ShivAI offers a free trial with no credit card required so you can test AI calling before committing to a plan.",
        },
      },
      {
        "@type": "Question",
        name: "Can I change plans as my business grows?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, ShivAI plans are flexible. You can upgrade, downgrade, or customize your plan at any time as your call volume and needs change.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] overflow-x-hidden">
      <SEO
        title="ShivAI Pricing — Plans for AI Calling & Voice Agents"
        description="ShivAI plans scale with your call volume, number of AI Employees, languages, and integrations. Request a custom quote and start with a free trial — no credit card required."
        path="/pricing"
        jsonLd={faqJsonLd}
      />
      <Navbar setAuthMode={setAuthMode} setShowAuthModal={setShowAuthModal} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <header className="text-center mb-16 lg:mb-24">
          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#1192BB] mb-3">
            Pricing
          </p>
          <h1 className="text-[30px] lg:text-[64px] font-semibold text-[#333333] tracking-tight lg:text-nowrap mb-2">
            Plans That Scale With You
          </h1>
          <p className="text-[14px] lg:text-lg text-[#5A5A59] font-light max-w-2xl mx-auto mt-4">
            ShivAI is priced around your usage — call volume, number of AI Employees, languages, storage, and
            integrations. Tell us your needs and we'll put together a plan, or start free and see it in action first.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white opacity-[0.9] rounded-2xl p-8 flex flex-col transition-all duration-300 hover:shadow-xl cursor-pointer border ${
                plan.featured
                  ? "border-[#1192BB] shadow-lg md:-translate-y-2"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {plan.featured && (
                <span className="self-start text-[11px] font-semibold tracking-wide uppercase bg-[#1192BB]/10 text-[#1192BB] px-3 py-1 rounded-full mb-4">
                  Most popular
                </span>
              )}
              <div className="mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#F0F0F0] flex items-center justify-center shadow-md">
                  <plan.icon className="w-7 h-7 text-[#1192BB]" />
                </div>
              </div>
              <h2 className="text-[22px] lg:text-[26px] font-semibold text-[#000000] mb-2">{plan.name}</h2>
              <p
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400, color: "#6E6E6E" }}
                className="font-light text-[14px] lg:text-[16px] leading-relaxed mb-6"
              >
                {plan.tagline}
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-[14px] text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-[#1192BB] mt-0.5 flex-shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openQuoteModal(plan.name)}
                className={`w-full py-3 rounded-full font-medium text-sm transition-colors ${
                  plan.featured
                    ? "bg-[#1192BB] text-white hover:bg-[#0f7fa3]"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }`}
              >
                Request a quote
              </button>
            </div>
          ))}
        </div>

        <div className="bg-black rounded-3xl px-8 py-12 md:px-16 md:py-16 text-center mb-20 relative overflow-hidden">
          {/* Fine grid-line texture */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
            aria-hidden="true"
          />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-4xl font-semibold text-white mb-4">
              Not sure which plan fits?
            </h2>
            <p className="text-gray-300 mb-8 max-w-xl mx-auto">
              Start free — no credit card required — and talk to ShivAI yourself before choosing a plan.
            </p>
            <button
              onClick={openSignup}
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <section className="max-w-3xl mx-auto">
          <h2 className="text-[30px] lg:text-[36px] font-semibold text-[#333333] tracking-tight text-center mb-8">
            Pricing Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-white opacity-[0.9] rounded-2xl border border-gray-200 p-6">
              <h3 className="text-[18px] font-semibold text-[#000000] mb-2">How is ShivAI priced?</h3>
              <p
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400, color: "#6E6E6E" }}
                className="font-light text-[14px] leading-relaxed"
              >
                Pricing is based on your call volume, number of AI Employees, languages required, storage, and
                integrations. Request a custom quote and we'll size a plan to your usage.
              </p>
            </div>
            <div className="bg-white opacity-[0.9] rounded-2xl border border-gray-200 p-6">
              <h3 className="text-[18px] font-semibold text-[#000000] mb-2">Is there a free trial?</h3>
              <p
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400, color: "#6E6E6E" }}
                className="font-light text-[14px] leading-relaxed"
              >
                Yes — no credit card required. You can test AI calling before committing to a plan.
              </p>
            </div>
            <div className="bg-white opacity-[0.9] rounded-2xl border border-gray-200 p-6">
              <h3 className="text-[18px] font-semibold text-[#000000] mb-2">Can I change plans as my business grows?</h3>
              <p
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400, color: "#6E6E6E" }}
                className="font-light text-[14px] leading-relaxed"
              >
                Yes. Plans are flexible — upgrade, downgrade, or customize at any time as your needs change.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {showAuthModal && (
        <AuthModel
          closeModal={() => setShowAuthModal(false)}
          authMode={authMode}
          setAuthMode={setAuthMode}
          error={error}
          handleAuth={handleAuth}
          handleSocialAuth={handleSocialAuth}
          formData={formData}
          setFormData={setFormData}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          isLoading={isLoading}
          fieldErrors={fieldErrors}
        />
      )}

      <QuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        context={quoteContext}
      />
    </div>
  );
};

export default PricingPage;
