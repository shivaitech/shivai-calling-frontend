import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowRight,
  Play,
  CheckCircle,
  Star,
  Zap,
  Shield,
  Users,
  Mic,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  Crown,
  Rocket,
  Volume2,
  Headphones,
  Brain,
  Code,
  Smartphone,
  Globe,
  X,
} from "lucide-react";
import AuthModel from "../components/AuthModel";
import Hero from "./Hero";
import Navbar from "./Navbar";
import TryVoice from "./TryVoice";
import { WhatShivaiDo } from "./WhatShivaiDo";
import { WhatWeWork } from "./WhatWeWork";
import { WorkTools } from "./WorkTools";
import { ShivaiSubsPlan } from "./ShivaiSubsPlan";
import { FAQ } from "./FAQ";
import Footer from "./Footer";

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    login,
    register,
    getGoogleAuthUrl,
    isLoading,
    error,
    clearError,
    isAuthenticated,
  } = useAuth();

  // UI State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English (US)");
  const [selectedVoice, setSelectedVoice] = useState("Sarah - Professional");
  const [demoText, setDemoText] = useState(
    "Hi! I'm your AI assistant. How can I help you today?"
  );
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "", // Add this
    name: "",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Show error from URL params (OAuth failures)
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "oauth_failed") {
      setShowAuthModal(true);
    }
  }, [searchParams]);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFieldErrors({});

    try {
      if (authMode === "signup") {
        await register(
          formData.name,
          formData.email,
          formData.password,
          formData.confirmPassword
        );
        setShowAuthModal(false);
        navigate("/onboarding");
      } else {
        await login(formData.email, formData.password);
        setShowAuthModal(false);
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Authentication failed:", error.response.data.errors);

      // Handle your specific 422 validation error format
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;

        // Convert backend error format to field mapping
        const fieldErrorsObj: Record<string, string> = {};
        backendErrors.forEach((err: any) => {
          fieldErrorsObj[err.field] = err.message;
        });

        setFieldErrors(fieldErrorsObj);
      }
    }
  };

  const handleSocialAuth = async (provider: string) => {
    if (provider === "google") {
      try {
        const authUrl = await getGoogleAuthUrl();
        window.location.href = authUrl;
      } catch (error) {
        console.error("Failed to get Google auth URL:", error);
      }
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!showAuthModal) {
      setFormData({ email: "", password: "", name: "", confirmPassword: "" });
      clearError();
    }
  }, [showAuthModal, clearError]);

  // Static data
  const languages = [
    "English (US)",
    "English (UK)",
    "Hindi",
    "Spanish",
    "French",
    "German",
    "Chinese (Mandarin)",
    "Japanese",
    "Arabic",
    "Portuguese",
    "Italian",
    "Dutch",
  ];

  const voices: Record<string, string[]> = {
    "English (US)": [
      "Sarah - Professional",
      "Michael - Friendly",
      "Emma - Warm",
    ],
    "English (UK)": [
      "James - Sophisticated",
      "Charlotte - Elegant",
      "Oliver - Crisp",
    ],
    Hindi: ["Arjun - Friendly", "Priya - Professional", "Raj - Warm"],
    Spanish: ["Carlos - Professional", "Sofia - Friendly", "Diego - Warm"],
    French: [
      "Pierre - Sophisticated",
      "Marie - Elegant",
      "Antoine - Professional",
    ],
    German: [
      "Hans - Professional",
      "Greta - Friendly",
      "Klaus - Authoritative",
    ],
  };

  const handlePlayDemo = () => {
    if (!demoText.trim()) {
      setDemoText("Hi! I'm your AI assistant. How can I help you today?");
    }
    setIsPlaying(!isPlaying);
    setTimeout(() => setIsPlaying(false), 3000);
  };

  const plans = [
    {
      name: "Starter",
      tagline: "Perfect for small businesses",
      price: { monthly: "$49", yearly: "$490" },
      originalPrice: { monthly: "$79", yearly: "$790" },
      features: [
        "5,000 voice conversations/month",
        "2 voice agents",
        "10GB storage",
        "Website & app integration",
        "Email support",
        "Basic voice analytics",
      ],
      popular: false,
      color: "emerald",
      icon: Zap,
    },
    {
      name: "Professional",
      tagline: "Most popular choice",
      price: { monthly: "$149", yearly: "$1490" },
      originalPrice: { monthly: "$199", yearly: "$1990" },
      features: [
        "25,000 voice conversations/month",
        "10 voice agents",
        "100GB storage",
        "Advanced integrations",
        "Priority support",
        "Custom voice branding",
        "API access",
        "Advanced analytics",
      ],
      popular: true,
      color: "blue",
      icon: Crown,
    },
    {
      name: "Enterprise",
      tagline: "Unlimited scale",
      price: { monthly: "$399", yearly: "$3990" },
      originalPrice: { monthly: "$499", yearly: "$4990" },
      features: [
        "Unlimited voice conversations",
        "Unlimited voice agents",
        "1TB storage",
        "White-label solution",
        "Dedicated success manager",
        "Custom integrations",
        "SLA guarantee",
        "On-premise deployment",
      ],
      popular: false,
      color: "violet",
      icon: Rocket,
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "VP of Customer Experience",
      company: "Stripe",
      content:
        "ShivAI's voice agents transformed our customer support. Integration took 5 minutes, and our customers love the natural phone conversations.",
      rating: 5,
      avatar: "SC",
    },
    {
      name: "Marcus Rodriguez",
      role: "Head of Operations",
      company: "Shopify",
      content:
        "The voice integration was seamless. Our conversion rates increased 300% with natural voice interactions on our website.",
      rating: 5,
      avatar: "MR",
    },
    {
      name: "Priya Sharma",
      role: "Founder & CEO",
      company: "Razorpay",
      content:
        "One line of code gave us enterprise-grade voice AI. Our customers can't tell they're talking to AI - it's that natural.",
      rating: 5,
      avatar: "PS",
    },
  ];

  const features = [
    {
      icon: Mic,
      title: "Natural Voice Processing",
      description:
        "Advanced AI that understands context, emotions, and intent in real-time conversations.",
    },
    {
      icon: Code,
      title: "One-Line Integration",
      description:
        "Add voice capabilities to any platform with a single line of code. No complex setup required.",
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description:
        "Support for 50+ languages and dialects with native-quality pronunciation.",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description:
        "SOC 2 compliant with end-to-end encryption for all voice data and conversations.",
    },
    {
      icon: Brain,
      title: "Smart Learning",
      description:
        "AI agents learn from every conversation to provide increasingly better responses.",
    },
    {
      icon: Smartphone,
      title: "Cross-Platform",
      description:
        "Works seamlessly across web, mobile apps, phone systems, and IoT devices.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F0F0F0] overflow-hidden">
      <Navbar
        setAuthMode={setAuthMode}
        setShowAuthModal={setShowAuthModal}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
      />
      <Hero setAuthMode={setAuthMode} setShowAuthModal={setShowAuthModal} />
      <section id="demo" className="py-0 px-3 lg:px-0 mt-40 h-auto">
        <TryVoice />
      </section>
      <section id="features" className="py-0 px-2 lg:px-0">
        <WhatShivaiDo />
      </section>
      <section id="features" className="py-0 px-0 lg:px-0">
        <WhatWeWork />
      </section>
      <section id="features" className="py-0 px-0 lg:px-0">
        <WorkTools />
      </section>
      <section id="pricing" className="py-0 px-6 lg:px-0">
        <ShivaiSubsPlan />
      </section>

      <section id="features" className="py-0 px-0 lg:px-0">
        <FAQ />
      </section>

      <section id="footer" className="relative w-[100vw] py-0 px-0 lg:px-0 bg-black">
        <Footer />
      </section>

      {/* Authentication Modal */}
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
    </div>
  );
};

export default Landing;
