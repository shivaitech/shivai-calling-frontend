import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AuthModel from "../../components/AuthModel";
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
        const response = await login(formData.email, formData.password);
        setShowAuthModal(false);
        if (response.codeVerified === false || response.user?.isOnboarded) {
          localStorage.setItem("auth_tokens", JSON.stringify(response.tokens));
          localStorage.setItem("auth_user", JSON.stringify(response.user));
          navigate("/dashboard");
        } else if (
          response.user?.isOnboarded === false ||
          response.codeVerified
        ) {
          localStorage.setItem(
            "pending_auth_tokens",
            JSON.stringify(response.tokens)
          );
          localStorage.setItem(
            "pending_auth_user",
            JSON.stringify(response.user)
          );
          navigate("/onboarding", { state: response?.onboarding });
        }
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

  const handleSignupSuccess = () => {
    setShowAuthModal(false);
    navigate("/onboarding");
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
    <div className="min-h-screen bg-[#F0F0F0] overflow-hidden">
      <Navbar
        setAuthMode={setAuthMode}
        setShowAuthModal={setShowAuthModal}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
      />
      <section id="" className="">
        <Hero setAuthMode={setAuthMode} setShowAuthModal={setShowAuthModal} />
      </section>
      <section id="demo" className="py-0 px-3 lg:px-0 mt-40 lg:mt-5 h-auto ">
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
        <FAQ setAuthMode={setAuthMode} setShowAuthModal={setShowAuthModal} />
      </section>

      <section
        id="footer"
        className="relative w-[100vw] py-0 px-0 lg:px-0 bg-black"
      >
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
          onSignupSuccess={handleSignupSuccess}
        />
      )}
    </div>
  );
};

export default Landing;
