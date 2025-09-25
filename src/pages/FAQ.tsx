import { useState } from "react";
import { Plus, Minus } from "lucide-react";

// FAQ data matching the Figma design
const faqData = [
  {
    id: 1,
    question: "What services does Triloe offer?",
    answer: "We offer branding, digital marketing, performance campaigns, and content strategy tailored to your business goals",
    isOpen: true // First item is open by default as shown in Figma
  },
  {
    id: 2,
    question: "How does the process work?",
    answer: "Our process starts with understanding your business needs, followed by strategy development, implementation, and continuous optimization to ensure the best results for your campaigns.",
    isOpen: false
  },
  {
    id: 3,
    question: "Who are your ideal clients?",
    answer: "We work with small to medium businesses, startups, and established companies looking to enhance their digital presence and achieve measurable growth through strategic marketing initiatives.",
    isOpen: false
  },
  {
    id: 4,
    question: "How long does a project usually take?",
    answer: "Project timelines vary depending on scope and complexity. Typical projects range from 2-12 weeks, with ongoing campaigns and optimization continuing as needed to meet your business objectives.",
    isOpen: false
  }
];

export const FAQ = () => {
  const [faqs, setFaqs] = useState(faqData);

  const toggleFAQ = (id: number) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, isOpen: !faq.isOpen } : faq
    ));
  };

  return (
    <div className="w-full bg-gray-50">
      {/* FAQ Section */}
      <div className="px-4 py-8 md:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 md:mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Frequently Asked Question
            </h2>
            <p className="text-gray-600 text-sm md:text-base lg:text-lg max-w-2xl">
              Find quick answers to the most common questions about our services, process, and support.
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
                  className="w-full px-6 py-5 md:px-8 md:py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
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
          <div className="bg-black rounded-2xl md:rounded-3xl px-6 py-8 md:px-12 md:py-16 lg:px-16 lg:py-20 text-center relative overflow-hidden">
            {/* Background Pattern/Decoration */}
           

            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight">
                Ready to transform your customer experience?
              </h2>
              <p className="text-gray-300 text-sm md:text-base lg:text-lg mb-6 md:mb-8 max-w-2xl mx-auto">
                Join thousands of businesses already using ShivAI to create natural voice conversations.
              </p>

              {/* CTA Button */}
              <button className="bg-white text-black px-6 py-3 md:px-8 md:py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 text-sm md:text-base">
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
