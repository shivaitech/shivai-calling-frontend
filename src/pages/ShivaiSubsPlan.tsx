import { useState } from "react";
import blackHeart from "../resources/Icon/blackHeart.svg";
import blueHeart from "../resources/Icon/blueHear.svg";
import custom from "../resources/Icon/custom.svg";
import circleCheck from "../resources/Icon/correctCircle.svg";

// Plan interface
interface Plan {
  id: string;
  name: string;
  subtitle: string;
  price: number | string;
  originalPrice?: number;
  discount?: string;
  period: string;
  popular: boolean;
  buttonText: string;
  features: string[];
  roiFeatures: string[];
  additionalInfo: string;
}

// Subscription plans data matching the Figma design exactly
const subscriptionPlans = [
  {
    id: "starter",
    name: "Starter",
    subtitle: "Perfect for small businesses",
    price: 49,
    period: "mo",
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
    originalPrice: 179,
    discount: "Save $30",
    period: "mo",
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
      "10x+ monthly, 15–18x annual",
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
    <div className="w-full py-0  lg:py-0 -top-[3px] lg:top-[60px] relative">
      <div
        id="pricing-content"
        className="max-w-8xl mx-auto px-0 sm:px-6 lg:px-8"
      >
        {/* Header */}
        <div className="text-center mb-6 lg:mb-12">
          <h2
            style={{ letterSpacing: "-5%" }}
            className="text-[38px] lg:text-[64px] font-semibold text-[#333333] tracking-tight mb-4 lg:mb-6 "
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
                  : "text-gray-600 hover:text-[#000]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "annual"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:text-[#000]"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {subscriptionPlans?.map((plan) => (
            <div
              key={plan.id}
              className={`relative transition-all duration-300 hover:shadow-lg 
                ${
                  plan.popular
                    ? "  p-[4px]"
                    : "bg-white border-[0.886px] border-[#E7EBFF] shadow-[0_23.045px_35.454px_0_rgba(188,202,255,0.13)] rounded-[23.045px] p-6"
                }`}
              style={
                plan.popular
                  ? {
                      background:
                        "linear-gradient(135deg, #00CEDB 0%, #A233FF 50%, #1192BB 100%)",
                      borderRadius: "25px",
                      padding: "2px",
                    }
                  : {}
              }
            >
              <div
                className={
                  plan.popular
                    ? "bg-white rounded-[23.045px] p-6 h-full relative"
                    : "h-full"
                }
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-20 rounded-t-2xl"></div>
                )}

                <div className="relative z-10">
                  {plan.popular && (
                    <div className="absolute right-0  z-20">
                      <div className="text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg smbtn-gradient2">
                        Most popular
                      </div>
                    </div>
                  )}

                  {/* Plan Icon */}
                  <div className="mb-4">
                    <div
                      className={`w-[48px] h-[48px] rounded-full flex items-center justify-center  ${
                        plan.popular
                          ? ""
                          : plan.id === "starter"
                          ? "bg-blackGradient"
                          : plan.id === "business"
                          ? "bg-blackGradient"
                          : plan.id === "custom"
                          ? "bg-blackGradient"
                          : "bg-blackGradient"
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
                            ? "w-[44px] h-[44px]"
                            : "w-[24px] h-[24px]"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Plan Name & Subtitle */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-1 text-[#000]">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-[#000000CC]">{plan.subtitle}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-[#000]">
                        {typeof plan.price === "number"
                          ? `$${plan.price}`
                          : plan.price}
                      </span>
                      {plan.period && (
                        <span className="ml-1 text-sm text-[#000000CC]">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                    {/* Show original price and discount for popular plan */}
                    {plan.popular && plan.originalPrice && plan.discount && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-red-500 line-through">
                          ${plan.originalPrice}
                        </span>
                        <span className="text-sm text-green-600 font-medium">
                          {plan.discount}
                        </span>
                      </div>
                    )}
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
                        : "bg-gray-100 text-[#000] hover:bg-gray-200 border border-gray-300 hover:border-gray-400 button-gradient2"
                    }`}
                  >
                    {plan.buttonText}
                  </button>

                  {/* What you will get */}
                  <div className="mb-6">
                    <h4 className="text-sm lg:text-sm font-[500] mb-3 text-[#000]">
                      What you will get
                    </h4>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start text-[13px] lg:text-sm font-[400] text-[#000000CC]"
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
                    <div className="border-t border-gray-200 pt-4 mt-8 relative">
                      <h4 className="text-sm font-semibold mb-3 text-[#000] bg-white absolute -top-3 left-1/2 -translate-x-1/2 px-6">
                        {plan.additionalInfo}
                      </h4>
                      {plan.roiFeatures && plan.roiFeatures.length > 0 && (
                        <ul className="space-y-2 mt-4">
                          {plan.roiFeatures.map((feature, index) => (
                            <li
                              key={`roi-${index}`}
                              className="flex items-start text-xs text-[#000000CC] leading-relaxed"
                            >
                              <img
                                src={circleCheck}
                                alt="check"
                                className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0"
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
