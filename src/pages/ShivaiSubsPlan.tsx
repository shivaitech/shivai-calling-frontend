import { useState, useEffect } from "react";
import blackHeart from "../resources/Icon/blackHeart.svg";
import blueHeart from "../resources/Icon/blueHear.svg";
import circleCheck from "../resources/Icon/correctCircle.svg";

// Types for location data
interface Country {
  name: string;
  iso2: string;
  iso3: string;
}

interface State {
  name: string;
  iso2: string;
  country_code: string;
}

interface City {
  name: string;
  country_code: string;
  state_code: string;
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
      "Dedicated success manager",
      "SLA guarantee",
      "Premium integrations (ERP, call centers)",
      "Regional deployment option",
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
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<"form" | "success">("form");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    countryCode: "",
    state: "",
    stateCode: "",
    city: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Location data states
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Search states
  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // API Functions
  const fetchCountries = async () => {
    try {
      const response = await fetch(
        "https://restcountries.com/v3.1/all?fields=name,cca2,cca3"
      );
      const data = await response.json();
      const countryList = data
        .map((country: any) => ({
          name: country.name.common,
          iso2: country.cca2,
          iso3: country.cca3,
        }))
        .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
      setCountries(countryList);
    } catch (error) {
    }
  };

  const fetchStates = async (countryCode: string) => {
    setLoadingStates(true);
    try {
      const response = await fetch(
        `https://api.countrystatecity.in/v1/countries/${countryCode}/states`,
        {
          headers: {
            "X-CSCAPI-KEY":
              "NHhvOEcyWk50N2Vna3VFTE00bFp3MjFKR0ZEOUhkZlg4RTk1MlJlaA==",
          },
        }
      );
      const data = await response.json();
      setStates(data || []);
    } catch (error) {
      setStates([]);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchCities = async (countryCode: string, stateCode: string) => {
    setLoadingCities(true);
    try {
      const response = await fetch(
        `https://api.countrystatecity.in/v1/countries/${countryCode}/states/${stateCode}/cities`,
        {
          headers: {
            "X-CSCAPI-KEY":
              "NHhvOEcyWk50N2Vna3VFTE00bFp3MjFKR0ZEOUhkZlg4RTk1MlJlaA==", // Free API key
          },
        }
      );
      const data = await response.json();
      setCities(data || []);
    } catch (error) {
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  // Load countries on component mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".location-dropdown")) {
        setShowCountryDropdown(false);
        setShowStateDropdown(false);
        setShowCityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle country selection
  const handleCountrySelect = (country: Country) => {
    setFormData((prev) => ({
      ...prev,
      country: country.name,
      countryCode: country.iso2,
      state: "",
      stateCode: "",
      city: "",
    }));
    setCountrySearch(country.name);
    setShowCountryDropdown(false);
    setStates([]);
    setCities([]);
    fetchStates(country.iso2);
  };

  // Handle state selection
  const handleStateSelect = (state: State) => {
    setFormData((prev) => ({
      ...prev,
      state: state.name,
      stateCode: state.iso2,
      city: "",
    }));
    setStateSearch(state.name);
    setShowStateDropdown(false);
    setCities([]);
    if (formData.countryCode) {
      fetchCities(formData.countryCode, state.iso2);
    }
  };

  // Handle city selection
  const handleCitySelect = (city: City) => {
    setFormData((prev) => ({ ...prev, city: city.name }));
    setCitySearch(city.name);
    setShowCityDropdown(false);
  };

  // Filter functions
  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredStates = states.filter((state) =>
    state.name.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const filteredCities = cities.filter((city) =>
    city.name.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleGetStarted = () => {
    setShowModal(true);
    setModalStep("form");
    setFormData({
      name: "",
      email: "",
      country: "",
      countryCode: "",
      state: "",
      stateCode: "",
      city: "",
    });
    setFormErrors({});
    setCountrySearch("");
    setStateSearch("");
    setCitySearch("");
    setShowCountryDropdown(false);
    setShowStateDropdown(false);
    setShowCityDropdown(false);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalStep("form");
    setFormData({
      name: "",
      email: "",
      country: "",
      countryCode: "",
      state: "",
      stateCode: "",
      city: "",
    });
    setFormErrors({});
    setCountrySearch("");
    setStateSearch("");
    setCitySearch("");
    setShowCountryDropdown(false);
    setShowStateDropdown(false);
    setShowCityDropdown(false);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple validation
    const errors: any = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email))
      errors.email = "Valid email required";
    if (!formData.country.trim()) errors.country = "Country is required";
    if (!formData.state.trim()) errors.state = "State is required";
    if (!formData.city.trim()) errors.city = "City is required";
    setFormErrors(errors);
    if (Object.keys(errors).length === 0) {
      setModalStep("success");
    }
  };

  return (
    <div
      id="pricing-content"
      className="w-full py-0  lg:py-0 -top-[15px] lg:top-[60px] relative"
    >
      <div className="max-w-8xl mx-auto px-0 sm:px-6 lg:px-10">
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
                          ? billingCycle === "annual"
                            ? `$${Math.round(plan.price * 12 * 0.84)}` // 16% discount
                            : `$${plan.price}`
                          : plan.price}
                      </span>
                      {plan.period && (
                        <span className="ml-1 text-sm text-[#000000CC]">
                          /{billingCycle === "annual" ? "year" : plan.period}
                        </span>
                      )}
                    </div>
                    {/* Show original price and discount */}
                    {billingCycle === "annual" &&
                      typeof plan.price === "number" && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-red-500 line-through">
                            ${plan.price * 12}
                          </span>
                          <span className="text-sm text-green-600 font-medium">
                            Save 16% + 1 Month Free
                          </span>
                        </div>
                      )}
                    {/* Show original price and discount for popular plan in monthly */}
                    {billingCycle === "monthly" &&
                      plan.popular &&
                      plan.originalPrice &&
                      plan.discount && (
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
                    onClick={handleGetStarted}
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
                    
                    {/* Setup fee information for monthly plans */}
                    {billingCycle === "monthly" && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-normal">
                          {plan.id === "starter" && "Setup fee $100, waived on annual plan."}
                          {plan.id === "professional" && "Setup fee $150, waived on annual plan."}
                          {plan.id === "business" && "Setup fee $200, waived on annual plan."}
                          {plan.id === "custom" && "Contact us for setup details."}
                        </p>
                      </div>
                    )}
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
      {/* Enhanced Modal for Get Started */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div
            className="bg-[#f8fafc] rounded-3xl shadow-2xl max-w-lg w-full relative overflow-hidden transform transition-all duration-300 scale-100"
            style={{
              minWidth: 320,
              background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)",
            }}
          >
            {/* Header gradient */}
            {/* <div className="h-1 bg-gradient-to-r from-gray-500 via-gray-900 to-white"></div> */}

            {/* Close button */}
            <button
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-200 z-10"
              onClick={handleModalClose}
              aria-label="Close"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="p-8">
              {modalStep === "form" ? (
                <div className="space-y-6">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="mb-4 w-full flex justify-center">
                      <div
                        className={`w-[48px] h-[48px] rounded-full flex items-center justify-center  ${""}`}
                      >
                        <img
                          src={blueHeart}
                          alt={blueHeart}
                          className={` ${"w-[44px] h-[44px]"}`}
                        />
                      </div>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      Get Started with ShivAI
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Enter your details and our team will reach out very soon.
                    </p>
                  </div>

                  {/* Form */}
                  <form
                    onSubmit={handleModalSubmit}
                    className="space-y-4"
                    autoComplete="off"
                  >
                    <div className="space-y-3">
                      <div>
                        <input
                          className="w-full px-3 py-3 sm:py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 bg-gray-50 focus:bg-white text-sm touch-manipulation"
                          type="text"
                          placeholder="Full Name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((f) => ({ ...f, name: e.target.value }))
                          }
                          autoFocus
                          autoComplete="off"
                        />
                        {formErrors["name"] && (
                          <p className="text-red-500 text-xs mt-1">
                            {formErrors["name"]}
                          </p>
                        )}
                      </div>

                      <div>
                        <input
                          className="w-full px-3 py-3 sm:py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 bg-gray-50 focus:bg-white text-sm touch-manipulation"
                          type="email"
                          placeholder="Email Address"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              email: e.target.value,
                            }))
                          }
                          autoComplete="off"
                        />
                        {formErrors["email"] && (
                          <p className="text-red-500 text-xs mt-1">
                            {formErrors["email"]}
                          </p>
                        )}
                      </div>

                      {/* Country Selection */}
                      <div className="relative location-dropdown">
                        <input
                          className="w-full px-3 py-3 sm:py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 bg-gray-50 focus:bg-white text-sm touch-manipulation"
                          type="text"
                          placeholder="Search and select country"
                          value={countrySearch}
                          onChange={(e) => {
                            setCountrySearch(e.target.value);
                            setShowCountryDropdown(true);
                          }}
                          onFocus={() => setShowCountryDropdown(true)}
                          autoComplete="off"
                        />
                        {formErrors["country"] && (
                          <p className="text-red-500 text-xs mt-1">
                            {formErrors["country"]}
                          </p>
                        )}

                        {showCountryDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {filteredCountries.length > 0 ? (
                              filteredCountries.map((country) => (
                                <div
                                  key={country.iso2}
                                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                  onClick={() => handleCountrySelect(country)}
                                >
                                  {country.name}
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-gray-500 text-sm">
                                No countries found
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* State Selection */}
                        <div className="relative location-dropdown">
                          <input
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 bg-gray-50 focus:bg-white text-sm"
                            type="text"
                            placeholder={
                              loadingStates
                                ? "Loading states..."
                                : "Search and select state"
                            }
                            value={stateSearch}
                            onChange={(e) => {
                              setStateSearch(e.target.value);
                              setShowStateDropdown(true);
                            }}
                            onFocus={() =>
                              states.length > 0 && setShowStateDropdown(true)
                            }
                            disabled={!formData.countryCode || loadingStates}
                            autoComplete="off"
                          />
                          {formErrors["state"] && (
                            <p className="text-red-500 text-xs mt-1">
                              {formErrors["state"]}
                            </p>
                          )}

                          {showStateDropdown && states.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredStates.length > 0 ? (
                                filteredStates.map((state) => (
                                  <div
                                    key={state.iso2}
                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                    onClick={() => handleStateSelect(state)}
                                  >
                                    {state.name}
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-gray-500 text-sm">
                                  No states found
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* City Selection */}
                        <div className="relative location-dropdown">
                          <input
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 bg-gray-50 focus:bg-white text-sm"
                            type="text"
                            placeholder={
                              loadingCities
                                ? "Loading cities..."
                                : "Search and select city"
                            }
                            value={citySearch}
                            onChange={(e) => {
                              setCitySearch(e.target.value);
                              setShowCityDropdown(true);
                            }}
                            onFocus={() =>
                              cities.length > 0 && setShowCityDropdown(true)
                            }
                            disabled={!formData.stateCode || loadingCities}
                            autoComplete="off"
                          />
                          {formErrors["city"] && (
                            <p className="text-red-500 text-xs mt-1">
                              {formErrors["city"]}
                            </p>
                          )}

                          {showCityDropdown && cities.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredCities.length > 0 ? (
                                filteredCities.map((city, index) => (
                                  <div
                                    key={`${city.name}-${index}`}
                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                    onClick={() => handleCitySelect(city)}
                                  >
                                    {city.name}
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-gray-500 text-sm">
                                  No cities found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      style={{
                        background:
                          "linear-gradient(0deg, #0A0A0A 0%, #000000 100%)",
                        boxShadow:
                          "0px 12.4px 18.6px -9.3px #00000040, 0px -6.2px 9.3px 0px #171717 inset, 0px 3.49px 0.77px 0px #5E5E5E inset, 0px 1.55px 0.77px 0px #33332F inset",
                        opacity: 1,
                        borderRadius: "1549.79px",
                      }}
                      className="w-full py-3 px-4 font-medium transition-all text-white hover:transform hover:scale-105"
                    >
                      Get Started Now
                    </button>
                  </form>

                  {/* Trust indicators */}
                  <div className="text-center pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      🔒 Your information is secure and will never be shared
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  {/* Success icon with animation */}
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-green-500"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="currentColor"
                        fillOpacity="0.1"
                      />
                      <path
                        d="M8 12.5l2.5 2.5L16 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Thank You!
                  </h2>
                  <p className="text-gray-600 text-sm mb-2 max-w-sm">
                    We've received your information. Our team will reach out to
                    you within 24 hours.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 mb-4">
                    <p className="text-blue-800 text-xs font-medium">
                      💡 Check your email for our getting-started-guide!
                    </p>
                  </div>
                  <button
                    onClick={handleModalClose}
                    style={{
                      background:
                        "linear-gradient(0deg, #0A0A0A 0%, #000000 100%)",
                      boxShadow:
                        "0px 12.4px 18.6px -9.3px #00000040, 0px -6.2px 9.3px 0px #171717 inset, 0px 3.49px 0.77px 0px #5E5E5E inset, 0px 1.55px 0.77px 0px #33332F inset",
                      opacity: 1,
                      borderRadius: "1549.79px",
                    }}
                    className="w-full py-3 px-4 font-medium transition-all text-white hover:transform hover:scale-105"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
