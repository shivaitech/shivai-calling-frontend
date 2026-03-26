import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import AuthModel from "../../components/AuthModel";
import Hero from "./Hero";
import Navbar from "./Navbar";

// Below-fold sections — load only when needed
const TryVoice = lazy(() => import("./TryVoice"));
const WhatShivaiDo = lazy(() => import("./WhatShivaiDo").then(m => ({ default: m.WhatShivaiDo })));
const WhatWeWork = lazy(() => import("./WhatWeWork").then(m => ({ default: m.WhatWeWork })));
const WorkTools = lazy(() => import("./WorkTools").then(m => ({ default: m.WorkTools })));
const ShivaiSubsPlan = lazy(() => import("./ShivaiSubsPlan").then(m => ({ default: m.ShivaiSubsPlan })));
const FAQ = lazy(() => import("./FAQ").then(m => ({ default: m.FAQ })));
const Footer = lazy(() => import("./Footer"));

/**
 * Per-section skeleton placeholder.
 * Uses a dark-to-light shimmer so it's visible against both light and dark
 * page backgrounds. Height should approximate the real section height so the
 * scroll position doesn't jump when the section swaps in.
 */
function SectionSkeleton({ minHeight = "60vh", dark = false }: { minHeight?: string; dark?: boolean }) {
  return (
    <div
      className={`w-full relative overflow-hidden ${dark ? "bg-slate-800" : "bg-gray-100"}`}
      style={{ minHeight }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    login,
    register,
    completeOnboarding,
    getGoogleAuthUrl,
    isLoading,
    error,
    clearError,
  } = useAuth();

  // UI State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "", // Add this
    name: "",
  });
  let token = localStorage.getItem("auth_tokens");
  useEffect(() => {
    if (token) {
      navigate("/dashboard");
    }
  }, [token, navigate]);

  // Show error from URL params (OAuth failures)
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "oauth_failed") {
      setShowAuthModal(true);
    }
  }, [searchParams]);

  // Scroll handler — throttled to avoid unnecessary re-renders
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        rafRef.current = null;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
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
        completeOnboarding();
        toast.success("Account created successfully! Welcome aboard.");
        setShowAuthModal(false);
        navigate("/dashboard");
      } else {
        const response = await login(formData.email, formData.password);
        setShowAuthModal(false);
        localStorage.setItem("auth_tokens", JSON.stringify(response.tokens));
        localStorage.setItem("auth_user", JSON.stringify(response.user));
        navigate("/dashboard");
      }
    } catch (error: any) {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;

        const fieldErrorsObj: Record<string, string> = {};
        backendErrors.forEach((err: any) => {
          fieldErrorsObj[err.field] = err.message;
        });

        setFieldErrors(fieldErrorsObj);
      }
      throw error;
    }
  };

  const handleSocialAuth = async (provider: string) => {
    if (provider === "google") {
      try {
        const url = await getGoogleAuthUrl();
        window.location.href = url;
      } catch (error) {}
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!showAuthModal) {
      setFormData({ email: "", password: "", name: "", confirmPassword: "" });
      clearError();
    }
  }, [showAuthModal, clearError]);

  return (
    <div className="min-h-screen bg-[#F0F0F0] overflow-x-hidden">
      <Navbar
        setAuthMode={setAuthMode}
        setShowAuthModal={setShowAuthModal}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
      />
      <section id="" className="">
        <Hero setAuthMode={setAuthMode} setShowAuthModal={setShowAuthModal} />
      </section>
      <Suspense fallback={<SectionSkeleton minHeight="55vh" dark />}>
        <section id="demo" className="py-0 px-3 lg:px-0 mt-6 sm:mt-8 md:mt-10 lg:mt-5 h-auto ">
          <TryVoice />
        </section>
      </Suspense>
      <Suspense fallback={<SectionSkeleton minHeight="80vh" />}>
        <section id="features" className="py-0 px-2 lg:px-0">
          <WhatShivaiDo />
        </section>
      </Suspense>
      <Suspense fallback={<SectionSkeleton minHeight="70vh" />}>
        <section id="features" className="py-0 px-0 lg:px-0">
          <WhatWeWork />
        </section>
      </Suspense>
      <Suspense fallback={<SectionSkeleton minHeight="60vh" />}>
        <section id="features" className="py-0 px-0 lg:px-0">
          <WorkTools />
        </section>
      </Suspense>
      <Suspense fallback={<SectionSkeleton minHeight="80vh" />}>
        <section id="pricing" className="py-0 px-6 lg:px-0">
          <ShivaiSubsPlan />
        </section>
      </Suspense>
      <Suspense fallback={<SectionSkeleton minHeight="50vh" />}>
        <section id="features" className="py-0 px-0 lg:px-0">
          <FAQ setAuthMode={setAuthMode} setShowAuthModal={setShowAuthModal} />
        </section>
      </Suspense>
      <Suspense fallback={<SectionSkeleton minHeight="30vh" dark />}>
        <section
          id="footer"
          className="relative w-[100vw] py-0 px-0 lg:px-0 bg-black"
        >
          <Footer />
        </section>
      </Suspense>

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
