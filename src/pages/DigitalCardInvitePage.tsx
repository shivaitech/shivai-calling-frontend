import { useNavigate } from "react-router-dom";
import { QrCode, Share2, Smartphone, Sparkles, UserPlus } from "lucide-react";
import { useInlineAuth } from "../hooks/useInlineAuth";
import AuthModel from "../components/AuthModel";
import SEO from "../components/SEO";
import Navbar from "./Website/Navbar";
import CardView from "../ClientDashboard/apps/DigitalCard/CardView";
import { sampleCard } from "../ClientDashboard/apps/DigitalCard/types";
import "../ClientDashboard/apps/DigitalCard/digitalCard.css";

/** Where "Create now" leads: the card builder (no account needed to start). */
const CREATE_ROUTE = "/digital-card/create";

const FEATURES = [
  { icon: Smartphone, title: "Looks great on every phone", text: "A clean profile with call, WhatsApp, email and social buttons." },
  { icon: Share2, title: "One link to share anywhere", text: "Send it on WhatsApp, email or your bio — no app needed to view it." },
  { icon: QrCode, title: "QR code included", text: "Print it on a card or show it on screen. Scanning opens your profile." },
  { icon: UserPlus, title: "Save Contact in one tap", text: "Visitors add you to their phone's contacts as a .vcf file." },
];

/**
 * Public entry for the Digital Business Card app — meant to be shared
 * (e.g. on WhatsApp): /digital-card
 *   "Create now" → /digital-card/create (build the card first, sign up when saving)
 */
export default function DigitalCardInvitePage() {
  const navigate = useNavigate();
  const auth = useInlineAuth({ googleReturn: CREATE_ROUTE, onSuccess: () => navigate(CREATE_ROUTE) });

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-slate-900">
      <SEO
        title="Free Digital Business Card — Share Your Profile on WhatsApp | ShivAI"
        description="Create a digital business card in minutes. Share one link or QR code — people can call, WhatsApp, email and save your contact in one tap."
        path="/digital-card"
      />

      {/* Same header as the main website (logo, fixed bar, Sign In) */}
      <Navbar setAuthMode={auth.setAuthMode} setShowAuthModal={auth.setShowAuthModal} showLinks={false} />

      <main className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 pt-24 sm:pt-28 lg:pt-36 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 sm:gap-12 lg:gap-16 items-center">
        <section>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200">
            <Sparkles className="w-3.5 h-3.5" /> Free for every ShivAI account
          </span>
          <h1 className="mt-5 text-[2.1rem] leading-[1.1] sm:text-5xl lg:text-6xl font-semibold tracking-tight lg:leading-[1.05]">
            Your business card,<br className="hidden sm:block" /> now one link.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl">
            Build a professional digital profile in minutes, share it on WhatsApp or as a QR code, and let people save your contact in one tap.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
            <button
              onClick={() => navigate(CREATE_ROUTE)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-[0.99] transition"
            >
              Create now
            </button>
            <button
              onClick={() => auth.open("signin")}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold hover:bg-slate-50 transition"
            >
              I already have an account
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">No sign-up needed to start — you’ll create an account when you save your card.</p>

          <ul className="mt-8 sm:mt-10 grid sm:grid-cols-2 gap-4 sm:gap-5">
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

        <aside className="w-full">
          <div className="dc">
            <div className="phone-frame" style={{ maxWidth: 400, margin: "0 auto", pointerEvents: "none" }} aria-hidden="true">
              <CardView card={sampleCard()} />
            </div>
          </div>
        </aside>
      </main>

      {auth.showAuthModal && <AuthModel {...auth.modalProps} />}
    </div>
  );
}
