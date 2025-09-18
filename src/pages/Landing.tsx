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
      } else {
        await login(formData.email, formData.password);
      }
      setShowAuthModal(false);
      navigate("/dashboard");
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
    <div className="min-h-screen bg-white overflow-hidden">
      {/* <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrollY > 50
          ? 'bg-white/95 backdrop-blur-xl border-b border-gray-100/50 shadow-lg shadow-gray-900/5'
          : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300 group-hover:scale-105">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                ShivAI
              </span>
            </div>

            <div className="hidden lg:flex items-center">
              <div className="flex items-center space-x-1 bg-gray-50/80 backdrop-blur-sm rounded-full p-1 border border-gray-200/50">
                <a href="#demo" className="relative px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-all duration-200 rounded-full hover:bg-white hover:shadow-sm group">
                  <span className="relative z-10">Demo</span>
                </a>
                <a href="#features" className="relative px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-all duration-200 rounded-full hover:bg-white hover:shadow-sm group">
                  <span className="relative z-10">Features</span>
                </a>
                <a href="#pricing" className="relative px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-all duration-200 rounded-full hover:bg-white hover:shadow-sm group">
                  <span className="relative z-10">Pricing</span>
                </a>
                <a href="#customers" className="relative px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-all duration-200 rounded-full hover:bg-white hover:shadow-sm group">
                  <span className="relative z-10">Customers</span>
                </a>
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-4">
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="text-gray-700 hover:text-emerald-600 transition-all duration-200 font-medium px-5 py-2.5 rounded-full hover:bg-emerald-50"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2.5 rounded-full hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 font-medium shadow-lg hover:shadow-emerald-500/25 hover:scale-105"
              >
                Get Started
              </button>
            </div>

            <div className="flex items-center space-x-3 lg:hidden">
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="text-gray-700 hover:text-emerald-600 transition-colors font-medium text-sm"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {showMobileMenu && (
            <div className="lg:hidden border-t border-gray-100/50 bg-white/98 backdrop-blur-xl shadow-lg">
              <div className="px-4 py-6 space-y-1">
                <a href="#demo" className="block px-4 py-3 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 font-medium rounded-xl">Demo</a>
                <a href="#features" className="block px-4 py-3 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 font-medium rounded-xl">Features</a>
                <a href="#pricing" className="block px-4 py-3 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 font-medium rounded-xl">Pricing</a>
                <a href="#customers" className="block px-4 py-3 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 font-medium rounded-xl">Customers</a>
              </div>
              <div className="pt-4 mt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="block w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 font-medium text-center shadow-lg"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </av>n

      <section className="relative pt-36 pb-16 px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50"></div>
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-100 rounded-full text-sm text-emerald-700 mb-6 border border-emerald-200">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">Trusted by 50,000+ businesses worldwide</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
              Conversational AI
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Voice Agents</span>
              <span className="block text-3xl lg:text-4xl text-gray-600 font-normal mt-2">
                that sound human
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Add natural voice conversations to your website or app with one line of code.
              Your customers will think they're talking to a human.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setShowAuthModal(true);
                }}
                className="bg-gray-900 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-all duration-200 flex items-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center space-x-3 px-8 py-4 border border-gray-300 text-gray-700 rounded-full text-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Play className="w-5 h-5" />
                <span>Try Demo</span>
              </button>
            </div>
          </div>
        </div>
      </section> */}

      <Navbar
        setAuthMode={setAuthMode}
        setShowAuthModal={setShowAuthModal}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
      />
      <Hero 
        setAuthMode={setAuthMode}
        setShowAuthModal={setShowAuthModal}
      />

      {/* Interactive Voice Demo */}
      <section id="demo" className="py-2 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Try Our Voice AI Demo
            </h2>
            <p className="text-xl text-gray-600">
              Experience natural conversation with our AI voice agent
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12 border border-gray-100">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Voice Controls */}
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Choose Voice
                  </label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {(voices[selectedLanguage] || voices["English (US)"]).map(
                      (voice) => (
                        <option key={voice} value={voice}>
                          {voice}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Demo Text
                  </label>
                  <textarea
                    value={demoText}
                    onChange={(e) => setDemoText(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Enter text for the AI to speak..."
                  />
                </div>

                <button
                  onClick={handlePlayDemo}
                  disabled={!demoText.trim()}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl"
                >
                  {isPlaying ? (
                    <>
                      <Volume2 className="w-6 h-6 animate-pulse" />
                      <span>Playing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6" />
                      <span>Play Voice Demo</span>
                    </>
                  )}
                </button>
              </div>

              {/* Visual Demo */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div
                    className={`w-64 h-64 rounded-full border-8 border-emerald-500 flex items-center justify-center transition-all duration-300 ${
                      isPlaying ? "scale-110 border-emerald-400" : "scale-100"
                    }`}
                  >
                    <div
                      className={`w-48 h-48 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center transition-all duration-300 ${
                        isPlaying ? "animate-pulse" : ""
                      }`}
                    >
                      <Headphones className="w-24 h-24 text-white" />
                    </div>
                  </div>
                  {isPlaying && (
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping"></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything you need for voice AI
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features that make implementing voice AI simple,
              scalable, and secure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:border-emerald-200"
              >
                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-200 transition-colors duration-300">
                  <feature.icon className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Choose the perfect plan for your business. All plans include
              unlimited integrations and 24/7 support.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-1 shadow-sm">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  billingCycle === "monthly"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-700 hover:text-emerald-600"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  billingCycle === "yearly"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-700 hover:text-emerald-600"
                }`}
              >
                Yearly
                <span className="ml-2 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-semibold">
                  Save 17%
                </span>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-xl p-8 border-2 transition-all duration-300 hover:shadow-2xl ${
                  plan.popular
                    ? "border-emerald-500 scale-105"
                    : "border-gray-100 hover:border-emerald-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div
                    className={`w-16 h-16 mx-auto rounded-xl bg-gradient-to-r from-${plan.color}-500 to-${plan.color}-600 flex items-center justify-center mb-4`}
                  >
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-6">{plan.tagline}</p>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center space-x-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price[billingCycle]}
                      </span>
                      <span className="text-gray-600">
                        /{billingCycle === "monthly" ? "mo" : "year"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="line-through">
                        {plan.originalPrice[billingCycle]}
                      </span>
                      <span className="ml-2 text-emerald-600 font-medium">
                        Save {billingCycle === "monthly" ? "$30" : "$300"}
                      </span>
                    </div>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-start space-x-3"
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    setAuthMode("signup");
                    setShowAuthModal(true);
                  }}
                  className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    plan.popular
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl"
                      : "border border-gray-300 text-gray-700 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  Start Free Trial
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="customers" className="py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Loved by thousands of businesses
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how companies are transforming their customer experience with
              ShivAI
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-yellow-400 fill-current"
                    />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </blockquote>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-8 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to transform your customer experience?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using ShivAI to create natural
            voice conversations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => {
                setAuthMode("signup");
                setShowAuthModal(true);
              }}
              className="bg-white text-emerald-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="text-emerald-100 text-sm">
              No credit card required • 14-day free trial
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">ShivAI</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-sm">
                The leading voice AI platform for businesses worldwide.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between">
            <div className="text-gray-400 text-sm">
              © 2025 ShivAI. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 mt-4 sm:mt-0">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="sr-only">GitHub</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

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
