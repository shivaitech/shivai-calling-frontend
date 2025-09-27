import { useState } from "react";
import blackHeart from "../resources/Icon/blackHeart.svg";
import blueHeart from "../resources/Icon/blueHear.svg";
import custom from "../resources/Icon/custom.svg";
import circleCheck from "../resources/Icon/correctCircle.svg";
// Subscription plans data matching the Figma design exactly
const subscriptionPlans = [
  {
    id: "starter",
    name: "Starter",
    subtitle: "Perfect for small businesses",
    price: 49,
    period: "per month",
    popular: false,
    buttonText: "Get Started",
    features: [
      "100 voice conversations/month (2 min each)",
      "1 AI Employee",
      "5 GB storage",
      "Website & app integration",
      "Email support",
      "Email/SMS workflows",
      "Basic voice analytics",
    ],
    roiFeatures: [
      "3 calls/day coverage",
      "Even 1 extra booking/day @ $20-30 = $600-900/month",
      "12–18x monthly; 20x+ annual.",
    ],
    additionalInfo: "ROI Snapshot",
  },
  {
    id: "professional",
    name: "Professional",
    subtitle: "For Growing Teams & Small Businesses",
    price: 149,
    period: "per month",
    popular: true,
    buttonText: "Get Started",
    features: [
      "300 voice conversations/month (2 min each)",
      "5 AI Employees",
      "50 GB storage",
      "Advanced integrations (CRM, payments, calendars)",
      "Priority support",
      "API access",
      "Custom voice branding",
      "Advanced analytics",
    ],
    roiFeatures: [
      "10 calls/day coverage",
      "At 10% conversion → 1 deal/day @ $50 = $1,500/month",
      "10x+ monthly; 15–18x annual",
    ],
    additionalInfo: "ROI Snapshot",
  },
  {
    id: "business",
    name: "Business",
    subtitle: "For Scaling Companies & Mid-Sized Teams",
    price: 299,
    period: "per month",
    popular: false,
    buttonText: "Get Started",
    features: [
      "1000 voice conversations/month (2 min each)",
      "15 AI Employees",
      "200 GB storage",
      "White-label option (your brand)",
      "Dedicated success manager",
      "SLA guarantee",
      "Premium integrations (ERP, call centers)",
      "Regional / on-prem deployment option",
    ],
    roiFeatures: [
      "30 calls/day coverage",
      "5 new deals/week @ $100 = $2,000/month",
      "6–7x monthly; 10x+ annual",
    ],
    additionalInfo: "ROI Snapshot",
  },
  {
    id: "custom",
    name: "Custom",
    subtitle: "For Large Organizations & Enterprises",
    price: "Custom",
    period: "",
    popular: false,
    buttonText: "Get Started",
    features: [
      "Unlimited conversations & AI Employees",
      "1 TB+ storage",
      "Full white-label solution",
      "SLA guarantee",
      "On-premises or hybrid deployment",
      "Compliance & governance",
    ],
    roiFeatures: [],
    additionalInfo: "",
  },
];

export const ShivaiSubsPlan = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );

  return (
    <div className="w-full py-0  lg:py-0">
      <div className="max-w-8xl mx-auto px-0 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-2 lg:mb-12">
          <h2
            style={{ letterSpacing: "-5%" }}
            className="text-[30px] lg:text-[64px] font-semibold text-[#333333] tracking-tight mb-2 lg:mb-6 "
          >
            Call ShivAI Subscription Plans
          </h2>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-200 rounded-full p-1 mb-2">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "annual"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
            </button>
          </div>
        </div>
        {billingCycle === "annual" && (
          <div className="flex justify-center mb-2">
            <span className="text-sm text-gray-600">
              Save 16%. Setup Waived. +1 Month Free
            </span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {subscriptionPlans?.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl transition-all duration-300 hover:shadow-lg ${
                plan.popular
                  ? "shadow-2xl scale-105 p-1 border-1 border"
                  : "bg-white border-gray-200 hover:border-gray-300 border-2 p-6"
              }`}
              style={
                plan.popular
                  ? {
                      background:
                        "linear-gradient(135deg, #00CEDB 0%, #1192BB 50%, #A233FF 100%)",

                      borderRadius: "16px",
                    }
                  : {}
              }
            >
              <div
                className={
                  plan.popular
                    ? "bg-gradient-to-b from-white/95 via-white/90 to-white/85 rounded-2xl p-6 h-full relative"
                    : "h-full"
                }
              >
                {plan.popular && (
                  <div
                    className="absolute top-0 left-0 right-0 h-20 rounded-t-2xl"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(240,248,255,0.6) 50%, transparent 100%)",
                    }}
                  ></div>
                )}

                <div className="relative z-10">
                  {plan.popular && (
                    <div
                      style={{
                        background:
                          "linear-gradient(253.64deg, #1192BB 24.86%, #A233FF 46.26%, #00CEDB 54.91%)",
                        borderRadius: "9999px",
                      }}
                      className="absolute  right-2 z-20"
                    >
                      <div className=" text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                        Most popular
                      </div>
                    </div>
                  )}

                  {/* Plan Icon */}
                  <div className="mb-4">
                    <div
                      className={`w-[48px] h-[48px] rounded-full flex items-center justify-center ${
                        plan.popular
                          ? ""
                          : plan.id === "starter"
                          ? "bg-gray-800"
                          : plan.id === "business"
                          ? "bg-gray-800"
                          : plan.id === "custom"
                          ? "bg-gray-800"
                          : "bg-gray-800"
                      }`}
                    >
                      <img
                        src={
                          plan.id === "starter"
                            ? blackHeart
                            : plan.id === "professional"
                            ? blueHeart
                            : plan.id === "business"
                            ? blackHeart
                            : blackHeart
                        }
                        alt={plan.id}
                        className={` ${
                          plan.popular
                            ? "w-[42px] h-[42px]"
                            : "w-[24px] h-[24px]"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Plan Name & Subtitle */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-1 text-gray-900">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-gray-600">{plan.subtitle}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900">
                        {typeof plan.price === "number"
                          ? `$${plan.price}`
                          : plan.price}
                      </span>
                      {plan.period && (
                        <span className="ml-1 text-sm text-gray-600">
                          {plan.period}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Get Started Button */}
                  <button
                    style={
                      plan.popular
                        ? {
                            background:
                              "linear-gradient(0deg, #0A0A0A 0%, #000000 100%)",
                            boxShadow:
                              "0px 12.4px 18.6px -9.3px #00000040, 0px -6.2px 9.3px 0px #171717 inset, 0px 3.49px 0.77px 0px #5E5E5E inset, 0px 1.55px 0.77px 0px #33332F inset",
                            opacity: 1,
                            borderRadius: "1549.79px",
                          }
                        : {
                            background:
                              "linear-gradient(151.44deg, #FFFFFF -62.65%, #FBFBFE 83.01%)",
                            borderRadius: "1549.79px",
                          }
                    }
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all mb-6 ${
                      plan.popular
                        ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-white hover:from-cyan-500 hover:to-blue-600"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {plan.buttonText}
                  </button>

                  {/* What you will get */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold mb-3 text-gray-900">
                      What you will get
                    </h4>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start text-sm text-gray-600"
                        >
                          <img
                            src={circleCheck}
                            alt={plan.id}
                            className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* ROI Snapshot Section */}
                  {plan.additionalInfo && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold mb-3 text-gray-900">
                        {plan.additionalInfo}
                      </h4>
                      {plan.roiFeatures && plan.roiFeatures.length > 0 && (
                        <ul className="space-y-2">
                          {plan.roiFeatures.map((feature, index) => (
                            <li
                              key={`roi-${index}`}
                              className="flex items-start text-sm text-gray-600"
                            >
                              <img
                                src={circleCheck}
                                alt={plan.id}
                                className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                              />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
