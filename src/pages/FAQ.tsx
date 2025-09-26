import { useState } from "react";
import { Plus, Minus } from "lucide-react";

// FAQ data matching the Figma design
const faqData = [
  {
    id: 1,
    question: "What services does Triloe offer?",
    answer:
      "We offer branding, digital marketing, performance campaigns, and content strategy tailored to your business goals",
    isOpen: true, // First item is open by default as shown in Figma
  },
  {
    id: 2,
    question: "How does the process work?",
    answer:
      "Our process starts with understanding your business needs, followed by strategy development, implementation, and continuous optimization to ensure the best results for your campaigns.",
    isOpen: false,
  },
  {
    id: 3,
    question: "Who are your ideal clients?",
    answer:
      "We work with small to medium businesses, startups, and established companies looking to enhance their digital presence and achieve measurable growth through strategic marketing initiatives.",
    isOpen: false,
  },
  {
    id: 4,
    question: "How long does a project usually take?",
    answer:
      "Project timelines vary depending on scope and complexity. Typical projects range from 2-12 weeks, with ongoing campaigns and optimization continuing as needed to meet your business objectives.",
    isOpen: false,
  },
];

export const FAQ = () => {
  const [faqs, setFaqs] = useState(faqData);

  const toggleFAQ = (id: number) => {
    setFaqs(
      faqs.map((faq) => (faq.id === id ? { ...faq, isOpen: !faq.isOpen } : faq))
    );
  };

  return (
    <div className="w-full">
      {/* FAQ Section */}
      <div className="px-2 py-8 md:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 md:mb-12 flex lg:flex-row flex-col items-center  justify-between">
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-[500] text-balance text-gray-900 mb-4 leading-tight">
              Frequently Asked Question
            </h2>
            <p className="text-gray-600 text-sm md:text-base font-light lg:text-lg max-w-2xl">
              Find quick answers to the most common questions about our
              services, process, and support.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-5 md:px-8 md:py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
                >
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0">
                    {faq.isOpen ? (
                      <Minus className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-600" />
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
      <div className="px-4 pb-8 md:pb-16 lg:pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="bg-black rounded-2xl flex justify-center md:rounded-3xl px-6 py-8 md:px-12 md:py-16 lg:px-16 lg:py-20 text-center relative overflow-hidden">
            {/* Background Pattern/Decoration */}
            <div className="absolute inset-0 opacity-30">
              {/* Flowing curved organic shapes */}
              <svg 
                className="absolute top-0 left-0 w-full h-full" 
                viewBox="0 0 800 400" 
                preserveAspectRatio="none"
              >
                {/* Left flowing curved shape */}
                <path
                  d="M-50,0 C50,80 20,160 80,240 C140,320 100,400 0,400 L-50,400 Z"
                  fill="rgba(255,255,255,0.15)"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="2"
                />
                
                {/* Right flowing curved shape */}
                <path
                  d="M850,0 C750,80 780,160 720,240 C660,320 700,400 800,400 L850,400 Z"
                  fill="rgba(255,255,255,0.15)"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="2"
                />
                
                {/* Center flowing element */}
                <path
                  d="M200,50 C300,100 500,80 600,150 C700,220 500,280 400,350 C300,320 250,200 200,50 Z"
                  fill="rgba(255,255,255,0.08)"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1.5"
                />
                
                {/* Additional organic shapes */}
                <ellipse
                  cx="150"
                  cy="300"
                  rx="80"
                  ry="40"
                  fill="rgba(255,255,255,0.06)"
                  transform="rotate(-20 150 300)"
                />
                
                <ellipse
                  cx="650"
                  cy="100"
                  rx="60"
                  ry="30"
                  fill="rgba(255,255,255,0.06)"
                  transform="rotate(25 650 100)"
                />
              </svg>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-5xl">
              <h2
                style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 600,
                  lineHeight: "130%",
                  letterSpacing: "-2%",
                }}
                className="text-2xl md:text-3xl lg:text-4xl xl:text-[80px] font-semibold text-white mb-4 md:mb-6 leading-tight"
              >
                Ready to transform your customer experience?
              </h2>
              <p className="text-gray-300 text-sm md:text-base lg:text-lg mb-6 md:mb-8 max-w-2xl mx-auto">
                Join thousands of businesses already using ShivAI to create
                natural voice conversations.
              </p>

              {/* CTA Button */}
              <button className="bg-white text-black px-6 py-3 md:px-12 md:py-4 rounded-[60px] font-semibold hover:bg-gray-100 transition-colors duration-200 text-sm md:text-base">
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
