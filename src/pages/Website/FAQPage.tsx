import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Minus, ArrowRight } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import AuthModel from "../../components/AuthModel";
import QuoteModal from "../../components/QuoteModal";
import SEO from "../../components/SEO";
import { useAuth } from "../../contexts/AuthContext";
import { getHomeRoute } from "../../utils/homeRoute";
import toast from "react-hot-toast";

const faqData = [
  {
    question: "Is ShivAI a chatbot or a live agent?",
    answer:
      "Unlike chatbots, ShivAI uses real-time voice AI to hold natural conversations, capture intent, and take actions.",
  },
  {
    question: "Can ShivAI handle multiple callers at once?",
    answer:
      "Yes. Your AI Employee scales infinitely, managing thousands of calls simultaneously without wait times.",
  },
  {
    question: "Do I need special hardware or phone systems?",
    answer:
      "No. ShivAI runs fully on the cloud. You can add it to your website, app, social pages, or any digital footprint in minutes.",
  },
  {
    question: "How does ShivAI learn my business?",
    answer:
      "We train it with your FAQs, workflows, and product/service details. It continuously improves with every call.",
  },
  {
    question: "Can ShivAI work alongside my human team?",
    answer:
      "Absolutely. ShivAI answers and qualifies first, then escalates complex calls to your staff when needed.",
  },
  {
    question: "What happens if a caller speaks an unsupported language?",
    answer:
      "ShivAI politely acknowledges, notes the language, and routes/escalates while also flagging it for your team.",
  },
  {
    question: "Does ShivAI work for inbound and outbound calls?",
    answer:
      "Inbound is live via web and voice. Outbound through WhatsApp, email, and SMS. Voice calling is available for enterprise plans.",
  },
  {
    question: "How does ShivAI ensure caller trust?",
    answer:
      "By using human-like natural speech, introducing itself clearly, and always asking for consent before collecting sensitive data.",
  },
  {
    question: "Can I brand the AI Employee with my company's name?",
    answer:
      "Yes. ShivAI can greet callers with your brand identity, making it feel like your employee, not a generic bot.",
  },
  {
    question: "What support do I get after going live?",
    answer:
      "You get ongoing training updates, analytics dashboards, and human support to refine workflows as your needs evolve.",
  },
  {
    question: "How many languages does ShivAI support?",
    answer:
      "ShivAI handles calls in 56+ languages with native-quality pronunciation, so you can serve customers in their language of choice.",
  },
  {
    question: "How quickly can I go live with ShivAI?",
    answer:
      "Most businesses go live in minutes, not months — ShivAI integrates with a single line of code, no heavy IT lift required.",
  },
];

const FAQPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, completeOnboarding, getGoogleAuthUrl, isLoading, error, clearError } = useAuth();
  const [openId, setOpenId] = useState<number | null>(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "", name: "" });
  const [showQuoteModal, setShowQuoteModal] = useState(false);

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
    mainEntity: faqData.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] overflow-x-hidden">
      <SEO
        title="ShivAI FAQ — Common Questions About AI Calling & Voice Agents"
        description="Answers to common questions about ShivAI's AI voice agents: languages supported, call handling, setup time, security, and how it works alongside your team."
        path="/faq"
        jsonLd={faqJsonLd}
      />
      <Navbar setAuthMode={setAuthMode} setShowAuthModal={setShowAuthModal} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <header className="text-center mb-12">
          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#1192BB] mb-3">FAQ</p>
          <h1 className="text-[32px] sm:text-[42px] lg:text-[52px] font-semibold text-[#333333] leading-tight mb-4">
            Frequently asked questions
          </h1>
          <p className="text-[#5A5A59] text-base lg:text-lg">
            Everything you need to know about ShivAI's AI voice agents before you get started.
          </p>
        </header>

        <div className="space-y-4 mb-16">
          {faqData.map((faq, i) => (
            <div key={faq.question} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => setOpenId(openId === i ? null : i)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <h2 className="text-base md:text-lg font-semibold text-gray-900 pr-4">{faq.question}</h2>
                <div className="flex-shrink-0 border rounded-full p-1.5">
                  {openId === i ? <Minus className="w-4 h-4 text-gray-600" /> : <Plus className="w-4 h-4 text-gray-600" />}
                </div>
              </button>
              {openId === i && (
                <div className="px-6 pb-5">
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-gray-600 text-sm md:text-base leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-black rounded-3xl px-8 py-12 md:px-16 md:py-16 text-center">
          <h2 className="text-2xl md:text-4xl font-semibold text-white mb-4">Still have questions?</h2>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">
            Try ShivAI yourself — no credit card required for the free trial.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setAuthMode("signup");
                setShowAuthModal(true);
              }}
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

export default FAQPage;
