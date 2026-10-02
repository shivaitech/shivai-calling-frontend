import React, { useState } from "react";
import { ArrowRight, Mail, MapPin, MessageSquare } from "lucide-react";
import QuoteModal from "../../components/QuoteModal";

const presenceBg = "/ChatGPT Image Oct 1, 2026, 04_49_34 PM.png";

/** Authentic WhatsApp glyph — lucide-react has no brand icons, so this is
 * inlined rather than pulling in a whole icon-pack dependency for one mark. */
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
    <path d="M16.004 2.667c-7.364 0-13.333 5.97-13.333 13.333 0 2.351.615 4.646 1.784 6.665L2.667 29.333l6.84-1.794a13.27 13.27 0 0 0 6.497 1.694h.006c7.363 0 13.333-5.97 13.333-13.333s-5.97-13.233-13.339-13.233zm0 24.4a11.03 11.03 0 0 1-5.624-1.541l-.403-.24-4.06 1.065 1.084-3.96-.263-.407a11.05 11.05 0 0 1-1.7-5.917c0-6.114 4.977-11.09 11.092-11.09 2.963 0 5.75 1.154 7.845 3.251a11.02 11.02 0 0 1 3.246 7.846c-.003 6.114-4.98 11.093-11.217 10.993zm6.082-8.302c-.333-.167-1.97-.973-2.276-1.083-.306-.113-.528-.167-.751.166-.223.334-.862 1.084-1.057 1.307-.195.224-.389.251-.722.084-.333-.167-1.405-.518-2.676-1.65-.989-.883-1.657-1.973-1.852-2.306-.195-.333-.021-.513.146-.679.15-.149.333-.389.5-.584.167-.195.223-.333.333-.556.111-.223.056-.417-.028-.584-.083-.167-.75-1.809-1.028-2.477-.271-.65-.546-.563-.75-.573a14.4 14.4 0 0 0-.639-.012c-.223 0-.584.084-.89.417-.306.333-1.167 1.14-1.167 2.782s1.195 3.228 1.362 3.451c.167.223 2.351 3.589 5.695 5.034.796.343 1.417.549 1.901.703.799.254 1.527.218 2.102.132.641-.096 1.97-.805 2.248-1.583.278-.779.278-1.446.195-1.584-.084-.138-.306-.222-.639-.389z" />
  </svg>
);

interface Office {
  /** ISO 3166-1 alpha-2 country code, lowercase — used for the flagcdn.com image. */
  flagCode: string;
  countryLabel: string;
  name: string;
  addressLines: string[];
  whatsapp: string;
  mapsUrl: string;
}

const OFFICES: Office[] = [
  {
    flagCode: "ae",
    countryLabel: "UAE",
    name: "Call Shiv AI Developing Services",
    addressLines: ["Office 109, Metropolis Towers", "Business Bay, Dubai", "United Arab Emirates"],
    whatsapp: "+971 56 618 0707",
    mapsUrl: "https://maps.google.com/?q=Metropolis+Towers+Business+Bay+Dubai",
  },
  {
    flagCode: "in",
    countryLabel: "India",
    name: "ShivAI Tech Pvt. Ltd.",
    addressLines: ["Gold Tower, Wave One", "1600, Sector 18", "Noida, U.P. 201301, India"],
    whatsapp: "+91 971 709 0703",
    mapsUrl: "https://maps.google.com/?q=Gold+Tower+Wave+One+Sector+18+Noida+UP+201301",
  },
  {
    flagCode: "us",
    countryLabel: "USA",
    name: "ShivAI Labs",
    addressLines: ["San Francisco, CA", "United States"],
    whatsapp: "+1 315 444 0707",
    mapsUrl: "https://maps.google.com/?q=San+Francisco+CA+United+States",
  },
  {
    flagCode: "au",
    countryLabel: "Australia",
    name: "ShivAI Partners",
    addressLines: ["193, Pennant Hills Rd", "Thornleigh - 2120 Sydney", "NSW, Australia"],
    whatsapp: "+61 44 909 6625",
    mapsUrl: "https://maps.google.com/?q=193+Pennant+Hills+Rd+Thornleigh+2120+Sydney+NSW+Australia",
  },
];

const waLink = (phone: string) => `https://wa.me/${phone.replace(/[^\d]/g, "")}`;

export const GlobalPresence: React.FC = () => {
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  return (
    <div className="relative w-full overflow-hidden bg-white px-5 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-24">
      {/* Designed background — gives the glass cards something to actually
          refract, otherwise backdrop-blur is invisible on flat white. Faded
          top/bottom edges via mask so it blends into the white page instead
          of showing a hard rectangular seam against the sections above/below. */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('${presenceBg}')`,
          maskImage: "linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-8xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-10 mb-10 sm:mb-12 lg:mb-16">
          <div className="max-w-xl">
            <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.16em] uppercase text-[#5A5A59]">
              Our Presence
            </p>
            <h2 className="mt-2 text-[28px] sm:text-[34px] lg:text-[42px] xl:text-[60px] font-bold text-[#1a1a1a] leading-[1.1] text-balance">
              Your Nearest
              <br />
              ShivAI Team.
            </h2>
          </div>

          <div className="flex gap-4 lg:gap-6 lg:pt-2 lg:max-w-sm">
            <div className="w-px bg-gray-200 flex-shrink-0 hidden lg:block" />
            <p className="text-[13px] sm:text-[14px] lg:text-[15px] font-[300] text-[#5A5A59] leading-relaxed">
              From Dubai to San Francisco, ShivAI is backed by local teams who understand
              your market — not just a support ticket queue. Reach the office closest to
              you, any time.
            </p>
          </div>
        </div>

        {/* ── Office cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5" style={{ perspective: "1200px" }}>
          {OFFICES.map((office) => (
            <div
              key={office.countryLabel}
              className="group/card relative flex flex-col rounded-2xl p-5 sm:p-6 bg-white/50 backdrop-blur-xl border border-white/60 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:[transform:rotateX(2deg)_rotateY(-2deg)_translateY(-6px)]"
              style={{
                boxShadow:
                  "0 1px 1px rgba(255,255,255,0.8) inset, 0 -1px 1px rgba(0,0,0,0.04) inset, 0 8px 24px -8px rgba(31,41,55,0.12), 0 2px 6px -2px rgba(31,41,55,0.08)",
              }}
            >
              {/* Glass sheen — soft highlight along the top edge */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 rounded-t-2xl bg-gradient-to-b from-white/70 to-transparent" />
              {/* Hover glow */}
              <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/40 via-transparent to-violet-100/30" />

              <div className="relative w-14 h-10 sm:w-16 sm:h-11 rounded-lg bg-white flex-shrink-0 overflow-hidden ring-1 ring-black/5 shadow-[0_4px_10px_-2px_rgba(31,41,55,0.2)] transition-transform duration-300 group-hover/card:scale-105">
                <img
                  src={`https://flagcdn.com/w80/${office.flagCode}.png`}
                  srcSet={`https://flagcdn.com/w160/${office.flagCode}.png 2x`}
                  alt={`${office.countryLabel} flag`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={80}
                  height={40}
                />
              </div>

              <p className="relative mt-4 text-[10px] font-semibold tracking-[0.14em] uppercase text-[#8a8a88]">
                {office.countryLabel}
              </p>
              <h3 className="relative mt-1 text-[16px] sm:text-[17px] font-semibold text-[#1a1a1a] leading-snug min-h-[2.6em]">
                {office.name}
              </h3>
              <p className="relative mt-2 text-[13px] font-[300] text-[#5A5A59] leading-relaxed flex-1">
                {office.addressLines.map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < office.addressLines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>

              <div className="relative mt-5 pt-4 border-t border-black/5 space-y-2">
                <a
                  href={waLink(office.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 w-full pl-2.5 pr-3.5 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-white/80 shadow-[0_2px_8px_-3px_rgba(31,41,55,0.12)] transition-all duration-200 hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_6px_14px_-4px_rgba(31,41,55,0.18)] active:scale-[0.98] active:translate-y-0"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-gradient-to-b from-[#2fdb73] to-[#20bd5f] flex items-center justify-center flex-shrink-0 shadow-[0_3px_8px_-2px_rgba(32,189,95,0.6)]">
                      <WhatsAppIcon className="w-4 h-4 text-white" />
                    </span>
                    <span className="flex flex-col items-start leading-tight min-w-0">
                      <span className="text-[10px] font-medium text-[#9A9A98]">WhatsApp</span>
                      <span className="text-[14px] font-semibold text-[#1a1a1a] truncate">{office.whatsapp}</span>
                    </span>
                  </span>
                  <ArrowRight className="w-4 h-4 flex-shrink-0 text-[#1a1a1a] transition-transform duration-200 group-hover:translate-x-0.5" />
                </a>

                <a
                  href={office.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-2 w-full px-3.5 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm border border-white/80 text-[#1a1a1a] text-[13px] font-medium shadow-[0_2px_6px_-2px_rgba(31,41,55,0.1)] transition-all duration-200 hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-[0_4px_10px_-2px_rgba(31,41,55,0.15)] active:scale-[0.98] active:translate-y-0"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-[#5A5A59]" />
                    <span className="truncate">View on Maps</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-[#5A5A59] transition-transform duration-200 group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* ── Footer strip: email on the left, general enquiries on the right ── */}
        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <a href="mailto:hello@shivaitech.com" className="group flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-[#FAFAFA] border border-gray-100 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-gray-100">
              <Mail className="w-4 h-4 text-[#5A5A59]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#9A9A98]">Email Us</p>
              <p className="text-[14px] sm:text-[15px] font-semibold text-[#1a1a1a] flex items-center gap-1.5">
                hello@shivaitech.com
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </p>
            </div>
          </a>

          <button
            type="button"
            onClick={() => setShowQuoteModal(true)}
            className="group flex items-center gap-3.5 sm:flex-row-reverse sm:text-right"
          >
            <div className="w-10 h-10 rounded-full bg-[#FAFAFA] border border-gray-100 flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-gray-100">
              <MessageSquare className="w-4 h-4 text-[#5A5A59]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[#9A9A98]">General Enquiries</p>
              <p className="text-[14px] sm:text-[15px] font-semibold text-[#1a1a1a] flex items-center gap-1.5 sm:flex-row-reverse">
                Contact Form
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </p>
            </div>
          </button>
        </div>
      </div>

      <QuoteModal isOpen={showQuoteModal} onClose={() => setShowQuoteModal(false)} context="Global Presence — General Enquiry" />
    </div>
  );
};

export default GlobalPresence;
