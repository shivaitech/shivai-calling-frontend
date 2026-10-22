import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { QrCode, Share2, Smartphone, Sparkles, UserPlus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import AuthModel from "../components/AuthModel";
import SEO from "../components/SEO";
import CardView from "../ClientDashboard/apps/DigitalCard/CardView";
import { sampleCard } from "../ClientDashboard/apps/DigitalCard/types";
import "../ClientDashboard/apps/DigitalCard/digitalCard.css";

/** Where signed-in users land: the app's install page in the marketplace. */
export const DIGITAL_CARD_INSTALL_ROUTE = "/marketplace/digital-card";
/** Read by GoogleCallback so OAuth sign-in also ends on the install page. */
export const POST_AUTH_RETURN_KEY = "post_auth_return";

const FEATURES = [
  { icon: Smartphone, title: "Looks great on every phone", text: "A clean profile with call, WhatsApp, email and social buttons." },
  { icon: Share2, title: "One link to share anywhere", text: "Send it on WhatsApp, email or your bio — no app needed to view it." },
  { icon: QrCode, title: "QR code included", text: "Print it on a card or show it on screen. Scanning opens your profile." },
  { icon: UserPlus, title: "Save Contact in one tap", text: "Visitors add you to their phone's contacts as a .vcf file." },
];

/**
 * Public entry for the Digital Business Card app — meant to be shared
 * (e.g. on WhatsApp): /digital-card
 *   signed out → landing + the main site's sign-in / sign-up modal
 *   signed in  → straight to the app's install page
 */
export default function DigitalCardInvitePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, login, register, completeOnboarding, getGoogleAuthUrl, isLoading, error, clearError } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "", name: "" });

  // Already signed in → skip everything and open the install page.
  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(DIGITAL_CARD_INSTALL_ROUTE, { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  // Signed out → ask them to sign up / sign in right away.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) setShowAuthModal(true);
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!showAuthModal) {
      setFormData({ email: "", password: "", name: "", confirmPassword: "" });
      clearError();
    }
  }, [showAuthModal, clearError]);

  const open = (mode: "signin" | "signup") => {
    setAuthMode(mode);
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
      } else {
        const response = await login(formData.email, formData.password);
        localStorage.setItem("auth_tokens", JSON.stringify(response.tokens));
        localStorage.setItem("auth_user", JSON.stringify(response.user));
      }
      setShowAuthModal(false);
      navigate(DIGITAL_CARD_INSTALL_ROUTE, { replace: true });
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const next: Record<string, string> = {};
        err.response.data.errors.forEach((item: any) => {
          next[item.field] = item.message;
        });
        setFieldErrors(next);
      }
      throw err;
    }
  };

  const handleSocialAuth = async (provider: string) => {
    if (provider !== "google") return;
    try {
      // Google sends the user away and back through /auth/google/callback —
      // remember where to finish.
      sessionStorage.setItem(POST_AUTH_RETURN_KEY, DIGITAL_CARD_INSTALL_ROUTE);
      window.location.href = await getGoogleAuthUrl();
    } catch {
      sessionStorage.removeItem(POST_AUTH_RETURN_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-slate-900">
      <SEO
        title="Free Digital Business Card — Share Your Profile on WhatsApp | ShivAI"
        description="Create a digital business card in minutes. Share one link or QR code — people can call, WhatsApp, email and save your contact in one tap."
        path="/digital-card"
      />

      <header className="max-w-6xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
        <a href="/" className="text-sm font-bold tracking-wide">ShivAI</a>
        <button onClick={() => open("signin")} className="text-sm font-medium text-slate-600 hover:text-slate-900">
          Sign in
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 pt-4 lg:pt-10 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
        <section>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200">
            <Sparkles className="w-3.5 h-3.5" /> Free for every ShivAI account
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
            Your business card,<br />now one link.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl">
            Build a professional digital profile in minutes, share it on WhatsApp or as a QR code, and let people save your contact in one tap.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={() => open("signup")}
              className="px-6 py-3.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-[0.99] transition"
            >
              Get started — it’s free
            </button>
            <button
              onClick={() => open("signin")}
              className="px-6 py-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50 transition"
            >
              I already have an account
            </button>
          </div>

          <ul className="mt-10 grid sm:grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 grid place-items-center flex-none">
                  <Icon className="w-5 h-5 text-slate-700" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-sm text-slate-600 mt-0.5">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="hidden lg:block">
          <div className="dc">
            <div className="phone-frame" style={{ maxWidth: 400, margin: "0 auto", pointerEvents: "none" }} aria-hidden="true">
              <CardView card={sampleCard()} />
            </div>
          </div>
        </aside>
      </main>

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
}
