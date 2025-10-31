import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";
import bgImage from "../resources/images/lines.svg";
import bgImage2 from "../resources/images/curved.svg";

interface FAQProps {
  setAuthMode?: (mode: "signin" | "signup") => void;
  setShowAuthModal?: (show: boolean) => void;
}

// FAQ data for ShivAI
const faqData = [
  {
    id: 1,
    question: "Is ShivAI a chatbot or a live agent?",
    answer:
      "Unlike chatbots, ShivAI uses real-time voice AI to hold natural conversations, capture intent, and take actions.",
    isOpen: true, // First item is open by default
  },
  {
    id: 2,
    question: "Can ShivAI handle multiple callers at once?",
    answer:
      "Yes. Your AI Employee scales infinitely managing thousands of calls simultaneously without wait times.",
    isOpen: false,
  },
  {
    id: 3,
    question: "Do I need special hardware or phone systems?",
    answer:
      "No. ShivAI runs fully on the cloud. You can add it to your website, app, social pages, or any digital footprint in minutes.",
    isOpen: false,
  },
  {
    id: 4,
    question: "How does ShivAI learn my business?",
    answer:
      "We train it with your FAQs, workflows, and product/service details. It continuously improves with every call.",
    isOpen: false,
  },
  {
    id: 5,
    question: "Can ShivAI work alongside my human team?",
    answer:
      "Absolutely. ShivAI answers and qualifies first, then escalates complex calls to your staff when needed.",
    isOpen: false,
  },
  {
    id: 6,
    question: "What happens if a caller speaks an unsupported language?",
    answer:
      "ShivAI politely acknowledges, notes the language, and routes/escalates while also flagging it for your team.",
    isOpen: false,
  },
  {
    id: 7,
    question: "Does ShivAI work for inbound and outbound calls?",
    answer:
      "Inbound is live now; outbound campaigns (reminders, promotions, renewals) can be activated in upcoming phases.",
    isOpen: false,
  },
  {
    id: 8,
    question: "How does ShivAI ensure caller trust?",
    answer:
      "By using human-like natural speech, introducing itself clearly, and always asking for consent before collecting sensitive data.",
    isOpen: false,
  },
  {
    id: 9,
    question: "Can I brand the AI Employee with my company's name?",
    answer:
      "Yes. ShivAI can greet callers with your brand identity, making it feel like your employee, not a generic bot.",
    isOpen: false,
  },
  {
    id: 10,
    question: "What support do I get after going live?",
    answer:
      "You get ongoing training updates, analytics dashboards, and human support to refine workflows as your needs evolve.",
    isOpen: false,
  },
];

export const FAQ: React.FC<FAQProps> = ({ setAuthMode, setShowAuthModal }) => {
  const [faqs, setFaqs] = useState(faqData);

  const toggleFAQ = (id: number) => {
    setFaqs(
      faqs.map((faq) => ({
        ...faq,
        isOpen: faq.id === id ? !faq.isOpen : false,
      }))
    );
  };

  return (
    <div
      style={{
        backgroundImage: `url('${bgImage}')`,
        backgroundPosition: "center",
      }}
      className="w-full px-6 lg:px-10 pt-0 md:pt-16 lg:pt-[100px]"
    >
      {/* FAQ Section */}
      <div className="px-2 py-8 md:py-0 lg:py-24">
        <div className="max-w-8xl mx-auto">
          {/* Header */}
          <div className="mb-8 md:mb-12 flex lg:flex-row flex-col items-center  justify-between">
            <h2 className="text-[38px] font-[600] md:text-4xl lg:text-6xl text-center lg:text-start  text-balance text-[#333] mb-6 leading-tight">
              Frequently Asked Question
            </h2>
            <p className="text-[#5A5A59] text-[14px] text-center lg:text-start  md:text-base font-light lg:text-lg max-w-2xl">
              Find quick answers to the most common questions about our
              services, process, and support.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white rounded-[14px] shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-5 md:px-8 md:py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
                >
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0 border rounded-full p-[6px] hover:bg-gray-100 transition-colors duration-200">
                    {faq.isOpen ? (
                      <Minus className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Plus className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                </button>

                {/* Answer Content */}
                {faq.isOpen && (
                  <div className="px-6 pb-5 md:px-8 md:pb-6">
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-2 pb-8 md:pb-16 lg:pb-24">
        <div className="max-w-8xl mx-auto">
          <div className="bg-[#000] rounded-[16px] flex justify-center md:rounded-3xl px-6 py-8 md:px-12 md:py-16 lg:px-16 lg:py-20 text-center relative overflow-hidden">
            {/* Background Pattern/Decoration */}
            <div className="absolute inset-0 ">
              {/* Flowing curved organic shapes */}
              <img
                src={bgImage2}
                alt="Background Decoration"
                className="w-full h-full object-fill"
              />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center">
              <h2
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 600,
                  lineHeight: "130%",
                  letterSpacing: "-2%",
                }}
                className="text-[32px] md:text-[60px] lg:text-[75px] xl:text-[80px] font-semibold text-white mb-4 md:mb-6 leading-tight"
              >
                Ready to transform your customer experience?
              </h2>
              <p className="text-gray-300 text-sm md:text-base lg:text-lg mb-6 md:mb-8 max-w-2xl mx-auto">
                ShivAI is the new frontline. Own it now before your competition
                does.
              </p>

              {/* CTA Button */}
              <button 
                onClick={() => {
                  if (setAuthMode && setShowAuthModal) {
                    setAuthMode("signup");
                    setShowAuthModal(true);
                  }
                }}
                className="bwhiteBgGradient shadow-md bg-white  px-6 py-3 md:px-12 md:py-4 rounded-[60px]  hover:bg-gray-100 transition-colors duration-200 "
              >
                Start Free Trial
              </button>

              {/* No Credit Card Text */}
              <div className="flex items-center justify-center mt-4 text-gray-400 text-xs md:text-sm">
                <div className="w-4 h-4 mr-2 flex items-center justify-center">
                  <div className="w-2 h-2 border border-gray-400 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
                No credit card required • 14-day free trial
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
