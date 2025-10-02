import React, { useState } from "react";

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
      "Handle transactions, KYC, compliance, and customer queries with secure multilingual voice support.",
    icon: financeIcon,
    color: "bg-blue-50 hover:bg-blue-100",
    iconColor: "text-blue-600",
  },

  {
    id: 6,
    title: "EdTech & Learning",
    description:
      "Support enrolments, admissions, and coursework guidance for learners & parents using EdTech platforms, schools, and universities worldwide.",
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
      "Qualify leads, schedule property visits, assist with broker coordination, and follow-up on buyer preferences.",
    icon: realStateIcon,
    color: "bg-orange-50 hover:bg-orange-100",
    iconColor: "text-orange-600",
  },
  {
    id: 9,
    title: "Custom",
    description:
      "Enterprise-ready customizations enabling ShivAI to fit your workflows and deliver outcomes. Schedule a call to explore.",
    icon: customIcon,
    color: "bg-gray-50 hover:bg-gray-100",
    iconColor: "text-gray-600",
  },
];

export const WhatWeWork = () => {
  const [showMore, setShowMore] = useState(false);

  return (
    <div
      id="work-content"
      className="w-full py-0 lg:py-0 pt-0 lg:pt-6 relative -top-[7vh] lg:top-0 px-6 lg:px-0"
    >
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-0">
        <div className="text-center mb-7">
          <h2 className="text-[30px] lg:text-[64px] font-semibold text-[#333333] tracking-tight  text-nowrap">
            Where ShivAI Works
          </h2>
        </div>

        {/* Industry Grid */}
        <div
          className={`relative ${
            !showMore ? "max-h-[920px] lg:max-h-full overflow-hidden" : ""
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {industries?.map((industry) => {
              return (
                <div
                  key={industry.id}
                  className={`bg-white opacity-[0.9] rounded-2xl p-8 transition-all duration-300 hover:shadow-xl  cursor-pointer border border-gray-200 hover:border-gray-300`}
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
      {!showMore && (
        <div className="absolute inset-x-0 top-[97%] h-10 bg-gradient-to-b from-[#]/80 via-white/60 to-transparent backdrop-blur-[3px] z-10 pointer-events-none lg:hidden" />
      )}
      {!showMore && (
        <div className="absolute inset-x-0 -bottom-14 flex items-end justify-center pb-4 lg:hidden z-10">
          <button
            onClick={() => setShowMore(true)}
            style={{
              color: "#000",
              fontFamily: "Poppins",
              fontSize: "16px",
              fontStyle: "normal",
              fontWeight: 400,
              lineHeight: "normal",
              textDecorationLine: "underline",
              textDecorationStyle: "solid",
              textDecorationSkipInk: "auto",
              textDecorationThickness: "auto",
              textUnderlineOffset: "auto",
              textUnderlinePosition: "from-font",
            }}
          >
            Show More
          </button>
        </div>
      )}
    </div>
  );
};
