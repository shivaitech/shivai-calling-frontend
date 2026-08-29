import React, { useState } from "react";
import { X, ArrowRight, CheckCircle } from "lucide-react";

const SALES_WHATSAPP_NUMBER = "919211490707";

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional context prefixed into the WhatsApp message, e.g. "Growth plan" or "Healthcare & Wellness". */
  context?: string;
}

const iCls = (err?: string) =>
  `w-full px-4 py-3 rounded-xl text-[14px] border ${
    err ? "border-red-400" : "border-gray-200"
  } bg-gray-50 focus:bg-white focus:outline-none focus:border-[#1192BB] transition-colors text-[#333333] placeholder:text-gray-400`;

const QuoteModal: React.FC<QuoteModalProps> = ({ isOpen, onClose, context }) => {
  const [step, setStep] = useState<"form" | "success">("form");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const reset = () => {
    setStep("form");
    setFormData({ name: "", email: "", phone: "", message: "" });
    setErrors({});
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) errs.email = "Valid email required";
    if (!formData.phone.trim()) errs.phone = "Phone number is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const lines = [
      "Hi ShivAI! I'd like to request a quote.",
      "",
      context ? `*Interested in:* ${context}` : null,
      `*Name:* ${formData.name}`,
      `*Email:* ${formData.email}`,
      `*Phone:* ${formData.phone}`,
      formData.message.trim() ? `*Message:* ${formData.message.trim()}` : null,
    ].filter((line) => line !== null);

    const whatsappUrl = `https://wa.me/${SALES_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setStep("success");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl bg-white my-auto"
        style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.28)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-7 sm:p-8">
          {step === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#F0F0F0] mx-auto mb-4 flex items-center justify-center shadow-md">
                  <ArrowRight className="w-6 h-6 text-[#1192BB]" />
                </div>
                <h2 className="text-[22px] font-semibold text-[#000000]">Request a Quote</h2>
                <p
                  style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400, color: "#6E6E6E" }}
                  className="font-light text-[14px] mt-1"
                >
                  {context ? `Tell us about your team and we'll size a plan for ${context}.` : "Tell us about your team and we'll size a plan that fits."}
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#5A5A59] mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className={iCls(errors.name)}
                />
                {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#5A5A59] mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  className={iCls(errors.email)}
                />
                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#5A5A59] mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  className={iCls(errors.phone)}
                />
                {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#5A5A59] mb-1">
                  What do you need? <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  placeholder="Call volume, languages, integrations…"
                  value={formData.message}
                  onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                  rows={3}
                  className={iCls() + " resize-none"}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full text-[14px] font-medium text-white bg-[#1192BB] hover:bg-[#0f7fa3] active:scale-[0.98] transition-all mt-1"
              >
                Send on WhatsApp →
              </button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div
                className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
              >
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-[20px] font-semibold text-[#111827]">Quote request sent!</h2>
              <p
                style={{ fontFamily: "Poppins, sans-serif", fontWeight: 400, color: "#6E6E6E" }}
                className="font-light text-[14px]"
              >
                We opened WhatsApp with your details filled in — just hit send and our team will get back to you shortly.
              </p>
              <button
                onClick={handleClose}
                className="mt-2 px-8 py-2.5 rounded-full text-[14px] font-medium text-white bg-[#1192BB] hover:bg-[#0f7fa3]"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteModal;
