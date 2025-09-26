import React from "react";

// Import SVG icons
import heartIcon from "../resources/Icon/heart.svg";
import eComIcon from "../resources/Icon/eCom.svg";
import planeIcon from "../resources/Icon/plane.svg";
import financeIcon from "../resources/Icon/finance.svg";
import talentIcon from "../resources/Icon/talent.svg";
import edTechIcon from "../resources/Icon/edTech.svg";
import locationIcon from "../resources/Icon/location.svg";
import realStateIcon from "../resources/Icon/realState.svg";
import customIcon from "../resources/Icon/custom.svg";

// Industry data matching the image
const industries = [
  {
    id: 1,
    title: "Healthcare & Wellness",
    description:
      "Streamline patient care, schedule appointments, and enable seamless HIPAA-aligned communications with your care team.",
    icon: heartIcon,
    color: "bg-blue-50 hover:bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: 2,
    title: "E-commerce & Retail",
    description:
      "Instantly respond with real-time product info, help customers complete purchases, and provide customer support around the clock.",
    color: "bg-orange-50 hover:bg-orange-100",
    iconColor: "text-orange-600",
    icon: eComIcon,
  },
  {
    id: 3,
    title: "Hospitality & Travel",
    description:
      "Help bookings, service enquiries and provide around-the-clock multilingual guest support around the clock.",
    icon: planeIcon,
    color: "bg-purple-50 hover:bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    id: 4,
    title: "Finance & Fintech",
    description:
      "Assist with transactions, loan applications, regulatory compliance, and always secure, always compliant.",
    icon: financeIcon,
    color: "bg-blue-50 hover:bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    id: 5,
    title: "Talent & Hiring",
    description:
      "Screen candidates with adaptive questioning, process resumes, coordinate interviews and automate recruiting processes anytime.",
    icon: talentIcon,
    color: "bg-gray-50 hover:bg-gray-100",
    iconColor: "text-gray-600",
  },
  {
    id: 6,
    title: "EdTech & Learning",
    description:
      "Guide students through coursework and provide education and support credentialed anytime.",
    icon: edTechIcon,
    color: "bg-teal-50 hover:bg-teal-100",
    iconColor: "text-teal-600",
  },
  {
    id: 7,
    title: "Logistics & Supply Chain",
    description:
      "Track shipments, update customers with real-time delivery updates and resolve with your human commercial team.",
    icon: locationIcon,
    color: "bg-red-50 hover:bg-red-100",
    iconColor: "text-red-600",
  },
  {
    id: 8,
    title: "Real Estate & Property",
    description:
      "Qualify and schedule key property leads, local markets and schedule appointments with agents/brokers, and serve follow up on new property preferences.",
    icon: realStateIcon,
    color: "bg-orange-50 hover:bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    id: 9,
    title: "Custom",
    description:
      "Enterprise-class customizations for any industry you need. Call us discuss to experience and tailor voice agents tailored to your specific needs.",
    icon: customIcon,
    color: "bg-gray-50 hover:bg-gray-100",
    iconColor: "text-gray-600",
  },
];

export const WhatWeWork = () => {
  return (
    <div className="w-full py-0 lg:py-0 pt-0 lg:pt-6 relative -top-8% lg:top-0 ">
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-0">
        <div className="text-center mb-4">
          <h2 className="text-[36px] lg:text-[64px] font-semibold text-[#333333] tracking-tight mb-6 text-nowrap">
            Where ShivAI Works
          </h2>
        </div>

        {/* Industry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {industries.map((industry) => {
            return (
              <div
                key={industry.id}
                className={`bg-white rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer border border-gray-200 hover:border-gray-300`}
              >
                {/* Icon */}
                <div className="mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#F0F0F0] flex items-center justify-center shadow-md">
                    <img
                      src={industry.icon}
                      alt={industry.title}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-[22px] lg:text-[26px] font-semibold text-[#000000] mb-2">
                    {industry.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontWeight: 400,
                      verticalAlign: "middle",
                      color: "#6E6E6E",
                    }}
                    className="font-light text-[14px] lg:text-[16px] leading-relaxed"
                  >
                    {industry.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
