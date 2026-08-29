import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap, Mic2, Globe2, ShieldCheck, Brain } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AuthModel from "../../components/AuthModel";
import QuoteModal from "../../components/QuoteModal";
import SEO from "../../components/SEO";
import { useAuth } from "../../contexts/AuthContext";
import { getHomeRoute } from "../../utils/homeRoute";
import toast from "react-hot-toast";

import heartIcon from "../../resources/Icon/heart.svg";
import eComIcon from "../../resources/Icon/eCom.svg";
import planeIcon from "../../resources/Icon/plane.svg";
import financeIcon from "../../resources/Icon/finance.svg";
import edTechIcon from "../../resources/Icon/edTech.svg";
import locationIcon from "../../resources/Icon/location.svg";
import realStateIcon from "../../resources/Icon/realState.svg";
import governmentIcon from "../../resources/Icon/government.svg";

const industries = [
  {
    title: "Healthcare & Wellness",
    description:
      "Streamline patient care, schedule appointments, and enable seamless HIPAA-aligned communications with your care team.",
    icon: heartIcon,
  },
  {
    title: "E-commerce & Retail",
    description:
      "Instantly respond with real-time product info, help customers complete purchases, and provide customer support around the clock.",
    icon: eComIcon,
  },
  {
    title: "Hospitality & Travel",
    description:
      "Handle bookings, service enquiries, and provide around-the-clock multilingual guest support.",
    icon: planeIcon,
  },
  {
    title: "Finance & Fintech",
    description:
      "Handle transactions, KYC, compliance, and customer queries with secure multilingual voice support.",
    icon: financeIcon,
  },
  {
    title: "EdTech & Learning",
    description:
      "Support enrolments, admissions, and coursework guidance for learners and parents across schools, universities, and EdTech platforms.",
    icon: edTechIcon,
  },
  {
    title: "Logistics & Supply Chain",
    description:
      "Track shipments, deliver real-time updates to customers, and route complex issues to your human commercial team.",
    icon: locationIcon,
  },
  {
    title: "Real Estate & Property",
    description:
      "Qualify leads, schedule property visits, assist with broker coordination, and follow up on buyer preferences.",
    icon: realStateIcon,
  },
  {
    title: "Government & Public Services",
    description:
      "Assist citizens with enquiries, automate service requests, schedule appointments, and provide multilingual support for public programs and compliance.",
    icon: governmentIcon,
  },
];

const capabilities = [
  {
    icon: Zap,
    title: "One-line integration",
    description: "Go live in minutes, not months. Add ShivAI to your site, app, or phone line with a single line of code.",
  },
  {
    icon: Mic2,
    title: "Natural voice processing",
    description: "ShivAI recognises context, intent, and emotion in real time, delivering conversations that feel human.",
  },
  {
    icon: Globe2,
    title: "56+ languages",
    description: "Talk to your customers in their language of choice, with native-quality pronunciation.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise security",
    description: "End-to-end encrypted and SOC 2 aligned. Every call, transcript, and interaction stays protected.",
  },
  {
    icon: Brain,
    title: "Smart learning",
    description: "Your AI Employee improves with every call, sharpening accuracy, context, and results over time.",
  },
];

const SolutionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, completeOnboarding, getGoogleAuthUrl, isLoading, error, clearError } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "", name: "" });
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const openSignup = () => {
    setAuthMode("signup");
    setShowAuthModal(true);
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: industries.map((ind, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `AI calling for ${ind.title}`,
      description: ind.description,
    })),
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] overflow-x-hidden">
      <SEO
        title="ShivAI Solutions — AI Calling for Every Industry"
        description="See how ShivAI's AI voice agents handle sales, support, and appointment booking across healthcare, e-commerce, real estate, finance, hospitality, and more."
        path="/solutions"
        jsonLd={jsonLd}
      />
      <Navbar setAuthMode={setAuthMode} setShowAuthModal={setShowAuthModal} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <header className="text-center mb-16 lg:mb-24">
          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#1192BB] mb-3">Solutions</p>
          <h1 className="text-[26px] sm:text-[30px] lg:text-[64px] font-semibold text-[#333333] tracking-tight lg:text-nowrap mb-2">
            One AI Employee, Built for You
          </h1>
          <p className="text-[14px] lg:text-lg text-[#5A5A59] font-light max-w-2xl mx-auto mt-4">
            ShivAI answers calls, qualifies leads, books appointments, and supports customers 24/7 — trained on your
            business and tuned to how your industry actually works.
          </p>
        </header>

        <section aria-label="AI calling by industry" className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {industries.map((ind) => (
              <div
                key={ind.title}
                className="bg-white opacity-[0.9] rounded-2xl p-8 transition-all duration-300 hover:shadow-xl cursor-pointer border border-gray-200 hover:border-gray-300"
              >
                <div className="mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#F0F0F0] flex items-center justify-center shadow-md">
                    <img src={ind.icon} alt={ind.title} className="w-12 h-12 object-contain" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[22px] lg:text-[26px] font-semibold text-[#000000] mb-2">{ind.title}</h3>
                  <p
                    style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400, color: "#6E6E6E" }}
                    className="font-light text-[14px] lg:text-[16px] leading-relaxed"
                  >
                    {ind.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="capabilities-heading" className="mb-20">
          <h2
            id="capabilities-heading"
            className="text-[30px] lg:text-[64px] font-semibold text-[#333333] tracking-tight text-center mb-7"
          >
            What Makes ShivAI Work
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 mb-6 lg:mb-8">
            {capabilities.slice(0, 2).map((cap) => (
              <div
                key={cap.title}
                className="bg-white opacity-[0.9] rounded-2xl p-8 transition-all duration-300 hover:shadow-xl cursor-pointer border border-gray-200 hover:border-gray-300"
              >
                <div className="mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#F0F0F0] flex items-center justify-center shadow-md">
                    <cap.icon className="w-7 h-7 text-[#1192BB]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[20px] lg:text-[22px] font-semibold text-[#000000] mb-2">{cap.title}</h3>
                  <p
                    style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400, color: "#6E6E6E" }}
                    className="font-light text-[14px] lg:text-[15px] leading-relaxed"
                  >
                    {cap.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {capabilities.slice(2).map((cap) => (
              <div
                key={cap.title}
                className="bg-white opacity-[0.9] rounded-2xl p-8 transition-all duration-300 hover:shadow-xl cursor-pointer border border-gray-200 hover:border-gray-300"
              >
                <div className="mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#F0F0F0] flex items-center justify-center shadow-md">
                    <cap.icon className="w-7 h-7 text-[#1192BB]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[20px] lg:text-[22px] font-semibold text-[#000000] mb-2">{cap.title}</h3>
                  <p
                    style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400, color: "#6E6E6E" }}
                    className="font-light text-[14px] lg:text-[15px] leading-relaxed"
                  >
                    {cap.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-black rounded-3xl px-8 py-12 md:px-16 md:py-16 text-center relative overflow-hidden">
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
            Don't see your industry?
          </h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">
            ShivAI is trained on your specific business, not a generic script. Start free and see it adapt to your use case.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={openSignup}
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowQuoteModal(true)}
              className="inline-flex items-center gap-2 bg-transparent border border-white/30 text-white px-8 py-3 rounded-full font-medium hover:bg-white/10 transition-colors"
            >
              Talk to sales
            </button>
          </div>
          </div>
        </div>
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

      <QuoteModal isOpen={showQuoteModal} onClose={() => setShowQuoteModal(false)} />
    </div>
  );
};

export default SolutionsPage;
