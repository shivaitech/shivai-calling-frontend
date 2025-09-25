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
    roiFeatures: ["10 calls/day coverage"],
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
    roiFeatures: ["30 calls/day coverage"],
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
    <div className="w-full py-0  lg:py-24">
      <div className="max-w-8xl mx-auto px-0 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            style={{ letterSpacing: "-5%" }}
            className="text-[34px] lg:text-5xl font-bold text-[#333333] mb-4"
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
            <span className="ml-3 text-sm text-gray-600">
              Save 16%. Setup Waived. +1 Month Free
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {subscriptionPlans?.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl transition-all duration-300 hover:shadow-lg ${
                plan.popular
                  ? "shadow-2xl scale-105 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-400 p-6"
                  : "bg-white border-gray-200 hover:border-gray-300 border-2 p-6"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="bg-white text-blue-600 px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan Icon */}
              <div className="mb-4">
                <div
                  className={`w-[48px] h-[48px] rounded-full flex items-center justify-center ${
                    plan.id === "starter"
                      ? "bg-gray-800"
                      : plan.id === "business"
                      ? "bg-gray-800"
                      : plan.id === "custom"
                      ? "bg-gray-800"
                      : ""
                  }`}
                >
                  <span>
                    <img
                      src={
                        plan.id === "starter"
                          ? blackHeart
                          : plan.id === "professional"
                          ? blueHeart
                          : plan.id === "business"
                          ? blackHeart
                          : custom
                      }
                      alt={plan.id}
                      className="w-[24px] h-[24px]"
                    />
                  </span>
                </div>
              </div>

              {/* Plan Name & Subtitle */}
              <div className="mb-4">
                <h3
                  className={`text-xl font-bold mb-1 ${
                    plan.popular ? "text-white" : "text-gray-900"
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm ${
                    plan.popular ? "text-white/80" : "text-gray-600"
                  }`}
                >
                  {plan.subtitle}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span
                    className={`text-3xl font-bold ${
                      plan.popular ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {typeof plan.price === "number"
                      ? `$${plan.price}`
                      : plan.price}
                  </span>
                  {plan.period && (
                    <span
                      className={`ml-1 text-sm ${
                        plan.popular ? "text-white/80" : "text-gray-600"
                      }`}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              {/* Get Started Button */}
              <button
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all mb-6 ${
                  plan.popular
                    ? "bg-black text-white hover:bg-gray-800"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {plan.buttonText}
              </button>

              {/* What you will get */}
              <div className="mb-6">
                <h4
                  className={`text-sm font-semibold mb-3 ${
                    plan.popular ? "text-white" : "text-gray-900"
                  }`}
                >
                  What you will get
                </h4>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className={`flex items-start text-sm ${
                        plan.popular ? "text-white/90" : "text-gray-600"
                      }`}
                    >
                      <img
                        src={circleCheck}
                        alt={plan.id}
                        className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        style={
                          plan.popular
                            ? { filter: "brightness(0) invert(1)" }
                            : {}
                        }
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ROI Snapshot Section */}
              {plan.additionalInfo && (
                <div className="mb-4">
                  <h4
                    className={`text-sm font-semibold mb-3 ${
                      plan.popular ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.additionalInfo}
                  </h4>
                  {plan.roiFeatures && plan.roiFeatures.length > 0 && (
                    <ul className="space-y-2">
                      {plan.roiFeatures.map((feature, index) => (
                        <li
                          key={`roi-${index}`}
                          className={`flex items-start text-sm ${
                            plan.popular ? "text-white/90" : "text-gray-600"
                          }`}
                        >
                          <img
                            src={circleCheck}
                            alt={plan.id}
                            className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                            style={
                              plan.popular
                                ? { filter: "brightness(0) invert(1)" }
                                : {}
                            }
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
