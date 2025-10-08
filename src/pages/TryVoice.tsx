import { useCallback, useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import blackAi from "../resources/AiImages/blackAI.png";
import baldAi from "../resources/AiImages/baldAi.png";
import WhiteAi from "../resources/AiImages/whiteAi.png";
import bgNew from "../resources/AiImages/bg.svg";
import voiceIcon from "../resources/AiImages/Animation.png";
import { motion, AnimatePresence } from "framer-motion";
import PhoneIcon from "../components/icons/PhoneIcon";
import USFlag from "../components/icons/USFlag";
import ChevronDown from "../components/icons/ChevronDown";

import { Country, defaultCountries } from "../types/country";
interface PhoneFormData {
  phoneNumber: string;
}

type CallState = "idle" | "connecting" | "calling" | "ending" | "ended";

const aiImages = [
  { src: blackAi, alt: "Black AI" },
  { src: baldAi, alt: "Bald AI" },
  { src: WhiteAi, alt: "White AI" },
];

function AiImageCarousel() {
  const [index, setIndex] = useState(0);

  // Cycle images every 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % aiImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative top-8  flex items-center justify-center pointer-events-none z-0 h-full  md:h-[240px] lg:h-[280px] xl:h-[320px] mb-4 sm:mb-6 md:mb-8">
      <AnimatePresence mode="wait">
        <motion.img
          key={aiImages[index].src}
          src={aiImages[index].src}
          alt={aiImages[index].alt}
          className="w-[80vw] h-[30vh] lg:w-full lg:h-[70vh] object-cover rounded-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>
    </div>
  );
}

export default function TryVoice() {
  // Call state management
  const [callState, setCallState] = useState<CallState>("idle");
  const [callDuration, setCallDuration] = useState(0);
  
  // Country and phone number state
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    dialCode: "+1",
    example: "(555) 123-4567",
    minLength: 10,
    maxLength: 10,
    pattern: "^[2-9]\\d{2}[2-9]\\d{2}\\d{4}$"
  });

  // Country selector state
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [editingDialCode, setEditingDialCode] = useState(false);
  const [customDialCode, setCustomDialCode] = useState(
    selectedCountry.dialCode
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dialCodeInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<PhoneFormData>({
    mode: "onChange",
    defaultValues: {
      phoneNumber: "",
    },
  });

  const phoneNumber = watch("phoneNumber");

  // Filter countries based on search
  const filteredCountries = defaultCountries.filter(
    (country) =>
      country.name.toLowerCase().includes(countrySearchTerm.toLowerCase()) ||
      country.dialCode.includes(countrySearchTerm) ||
      country.code.toLowerCase().includes(countrySearchTerm.toLowerCase())
  );

  // Update custom dial code when selected country changes
  useEffect(() => {
    setCustomDialCode(selectedCountry.dialCode);
  }, [selectedCountry]);

  // Handle click outside dropdown and body scroll prevention
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryDropdownOpen(false);
        setCountrySearchTerm("");
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCountryDropdownOpen(false);
        setCountrySearchTerm("");
      }
    };

    if (isCountryDropdownOpen) {
      // Prevent body scrolling when dropdown is open
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const scrollY = window.scrollY;

      // Prevent scrolling on both desktop and mobile
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleEscape);

      return () => {
        // Restore original styles and scroll position when dropdown closes
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);

        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isCountryDropdownOpen]);

  // Timer effect for call duration
  useEffect(() => {
    let interval: number;

    if (callState === "calling") {
      interval = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
    };
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Country selector functions
  const handleCountrySelect = useCallback((country: Country) => {
    try {
      setCustomDialCode(country.dialCode);
      setEditingDialCode(false);
      setSelectedCountry(country);
      setIsCountryDropdownOpen(false);
      setCountrySearchTerm("");
    } catch (error) {
      console.error("Error selecting country:", error);
      setIsCountryDropdownOpen(false);
      setCountrySearchTerm("");
    }
  }, []);

  const handleDialCodeEdit = useCallback(() => {
    setEditingDialCode(true);
    setIsCountryDropdownOpen(false);
    setTimeout(() => {
      dialCodeInputRef.current?.focus();
      dialCodeInputRef.current?.select();
    }, 0);
  }, []);

  const handleDialCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;

      if (!value.startsWith("+")) {
        value = "+" + value.replace(/^\+*/, "");
      }

      value = "+" + value.slice(1).replace(/\D/g, "");
      setCustomDialCode(value);
    },
    []
  );

  const handleDialCodeSubmit = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === "Tab") {
        setEditingDialCode(false);

        const matchingCountry = defaultCountries.find(
          (c) => c.dialCode === customDialCode
        );
        if (matchingCountry) {
          setSelectedCountry(matchingCountry);
        } else {
          const customCountry: Country = {
            code: "XX",
            name: "Custom",
            flag: "🌐",
            dialCode: customDialCode,
          };
          setSelectedCountry(customCountry);
        }
      } else if (e.key === "Escape") {
        setEditingDialCode(false);
        setCustomDialCode(selectedCountry.dialCode);
      }
    },
    [customDialCode, selectedCountry]
  );

  const handleDialCodeBlur = useCallback(() => {
    setEditingDialCode(false);

    const matchingCountry = defaultCountries.find(
      (c) => c.dialCode === customDialCode
    );
    if (matchingCountry) {
      setSelectedCountry(matchingCountry);
    } else {
      const customCountry: Country = {
        code: "XX",
        name: "Custom",
        flag: "🌐",
        dialCode: customDialCode,
      };
      setSelectedCountry(customCountry);
    }
  }, [customDialCode]);



  const getFullPhoneNumber = useCallback(
    (phoneNumber: string) => {
      const cleanNumber = phoneNumber.replace(/\D/g, "");
      return `${selectedCountry.dialCode}${cleanNumber}`;
    },
    [selectedCountry]
  );

  const handlePhoneValidation = useCallback(
    (value: string) => {
      if (!value || value.trim().length === 0) {
        return "Phone number is required";
      }

      // Remove all non-digit characters to get just the phone number
      const phoneDigits = value.replace(/\D/g, "");
      
      // Remove country code from digits for validation
      const dialCodeDigits = selectedCountry.dialCode.replace(/\D/g, "");
      let localNumber = phoneDigits;
      
      // If the number starts with the country code, remove it for validation
      if (phoneDigits.startsWith(dialCodeDigits)) {
        localNumber = phoneDigits.substring(dialCodeDigits.length);
      }

      // Use country-specific validation if available
      if (selectedCountry.minLength && selectedCountry.maxLength) {
        if (localNumber.length < selectedCountry.minLength) {
          return `Phone number must be at least ${selectedCountry.minLength} digits for ${selectedCountry.name}`;
        }
        if (localNumber.length > selectedCountry.maxLength) {
          return `Phone number must not exceed ${selectedCountry.maxLength} digits for ${selectedCountry.name}`;
        }
        
        // Apply country-specific pattern validation if available
        if (selectedCountry.pattern) {
          const regex = new RegExp(selectedCountry.pattern);
          if (!regex.test(localNumber)) {
            return `Invalid phone number format for ${selectedCountry.name}. Example: ${selectedCountry.example || 'N/A'}`;
          }
        }
      } else {
        // Fallback validation for countries without specific rules
        if (localNumber.length < 6) {
          return "Phone number is too short";
        }
        if (localNumber.length > 15) {
          return "Phone number is too long";
        }
      }

      return true;
    },
    [selectedCountry]
  );

  const handleEndCall = useCallback(() => {
    setCallState("ending");
    setTimeout(() => {
      setCallState("ended");
      setTimeout(() => {
        setCallState("idle");
      }, 2000);
    }, 1000);
  }, []);

  const handlePhoneSubmit = useCallback(async (data: PhoneFormData) => {
    try {
      // Start call sequence
      setCallState("connecting");

      // Simulate connecting phase
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setCallState("calling");

      // Convert to international format
      const fullPhoneNumber = getFullPhoneNumber(data.phoneNumber);
      console.log("Making call to:", fullPhoneNumber);

      // Simulate demo call experience
      console.log(`Demo call initiated to ${fullPhoneNumber}`);

      // Simulate call duration (demo purposes)
      await new Promise((resolve) => setTimeout(resolve, 8000));

      // End call sequence
      setCallState("ending");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCallState("ended");

      // Reset after 3 seconds
      setTimeout(() => {
        setCallState("idle");
      }, 3000);
    } catch (error) {
      console.error("Failed to initiate call:", error);
      setCallState("idle");
    }
  }, [getFullPhoneNumber]);

  return (
    <div
      style={{
        zIndex: 100,
      }}
      className="bg-[#F0F0F0] font-sans px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 "
    >
      {/* Main Container */}
      <main
        id="demo-content"
        className="relative shadow-xl py-4 sm:py-6 md:py-0 lg:py-0 xl:py-0 lg:top-10 -top-[18vh]  xl:max-w-8xl mx-auto bg-[#FAFAFA] lg:shadow-lg rounded-3xl  lg:rounded-[40px] xl:rounded-[50px] sm:mx-2 md:m-4 lg:m-6 xl:m-8  overflow-hidden"
        role="main"
        aria-labelledby="main-heading"
      >
        <div
          className="absolute inset-0  pointer-events-none"
          style={{
            background: `url(${bgNew})`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          aria-hidden="true"
        />

        {/* Main Content */}
        <div className="relative z-10 flex flex-col gap-5 lg:gap-1 justify-center items-center h-auto px-4 py-2 sm:px-6 md:px-8 lg:px-12 xl:px-16  md:py-12 lg:py-10 xl:py-10 space-y-0  md:space-y-8 lg:space-y-10 min-h-[44vh] md:min-h-[40vh] lg:min-h-[40vh] xl:min-h-[40vh]">
          <div className="relative flex items-center justify-center mb-0 sm:mb-0 md:mb-2 z-20">
            <img
              src={voiceIcon}
              alt="AI fallback"
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28"
              style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.18))" }}
            />
          </div>
          <header className="flex flex-col items-center text-center max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl">
            {/* Main Title */}
            <h1
              id="main-heading"
              className="text-white text-wrap leading-[36px] lg:leading:[normal] lg:text-nowrap text-[32px] sm:text-[36px] md:text-[44px] lg:text-[56px] xl:text-[64px] mb-4 sm:mb-6 md:mb-8 lg:mb-10 xl:mb-12 px-2 md:px-4 lg:px-6"
              style={{
                fontFamily: "Poppins, sans-serif",
                letterSpacing: "-1px",
                fontWeight: 600,
                color: "#FFF",
              }}
            >
              Talk to ShivAI in Your Language
            </h1>

            {/* Subtitle with action buttons */}
            <div className="flex flex-col items-center gap-2 sm:gap-6 md:gap-2">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 md:gap-6 mb-4 lg:mb-0">
                <div
                  className="flex items-center justify-center px-[12px] sm:px-[15px] py-[8px] sm:py-[10px] gap-[8px] sm:gap-[10px] rounded-full bg-gray-800/20 border border-gray-600/30"
                  style={{
                    display: "flex",
                    padding: "8px 12px",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span className="text-xs sm:text-sm md:text-base lg:text-lg text-white font-medium">
                    Enter your number.
                  </span>
                </div>

                <div className="text-white text-base sm:text-lg md:text-xl lg:text-2xl">
                  <span className="block sm:hidden">↓</span>
                  <span className="hidden sm:block">→</span>
                </div>

                <div
                  className="flex items-center justify-center px-[12px] sm:px-[15px] py-[8px] sm:py-[10px] gap-[8px] sm:gap-[10px] rounded-full bg-gray-800/20 border border-gray-600/30"
                  style={{
                    display: "flex",
                    padding: "8px 12px",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span className="text-xs sm:text-sm md:text-base lg:text-lg text-white font-medium">
                    One click, one call, with AI Employee.
                  </span>
                </div>
              </div>

              <p
                className=" text-[#c8c8c8] relative top-0 lg:top-[40px] text-[11px] sm:text-[16px] md:text-[17px] lg:text-[18px] font-normal max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl px-2 md:px-4 lg:px-6"
                style={{
                  fontFamily: "Poppins, sans-serif",
                  color: "rgba(210, 210, 210, 0.50)",
                  textAlign: "center",
                  fontStyle: "normal",
                  fontWeight: 400,
                  lineHeight: "157.3%",
                }}
              >
                We'll only use this once for your demo call, no spam
              </p>
            </div>
          </header>

          {/* Animated Video Icon */}

          {/* Phone Input Form */}
          <div className="flex flex-col items-center w-full max-w-4xl relative">
            <AnimatePresence mode="wait">
              {callState === "idle" && (
                <motion.form
                  key="phone-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit(handlePhoneSubmit)}
                  className="w-full max-w-4xl px-2 sm:px-4 lg:px-0"
                >
                  <div className="w-full h-[50px] sm:h-[60px] md:h-[70px] lg:h-20 xl:h-24 bg-white rounded-full border border-gray-300 shadow-lg relative">
                    <div className="flex items-center justify-between h-full px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
                      {/* Country Selector & Phone Input */}
                      <div className="flex items-center flex-1 gap-2 sm:gap-3 lg:gap-4 min-w-0">
                        <div className="flex-shrink-0 relative z-[100]" ref={dropdownRef}>
                          <div className="flex items-center">
                            {editingDialCode ? (
                              <input
                                ref={dialCodeInputRef}
                                type="text"
                                value={customDialCode}
                                onChange={handleDialCodeChange}
                                onKeyDown={handleDialCodeSubmit}
                                onBlur={handleDialCodeBlur}
                                className="w-[90px] md:w-[80px] lg:w-[90px] xl:w-[100px] h-[38px] sm:h-[44px] md:h-[54px] lg:h-12 xl:h-14 px-1 sm:px-2 md:px-3 text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg font-medium text-gray-900 bg-white border border-gray-300 rounded-full text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setIsCountryDropdownOpen(!isCountryDropdownOpen);
                                }}
                                onDoubleClick={handleDialCodeEdit}
                                className={`flex items-center justify-center gap-1 sm:gap-1 md:gap-1.5 lg:gap-2 w-[60px] sm:w-[70px] md:w-[80px] lg:w-[90px] xl:w-[100px] h-[38px] sm:h-[44px] md:h-[54px] lg:h-12 xl:h-14 bg-white rounded-full border border-gray-300 flex-shrink-0 hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 relative ${
                                  isCountryDropdownOpen
                                    ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50"
                                    : ""
                                }`}
                                title="Click to select country, double-click to edit"
                                aria-expanded={isCountryDropdownOpen}
                                aria-haspopup="listbox"
                              >
                                {selectedCountry.code === "US" ? (
                                  <USFlag className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                                ) : (
                                  <span className="text-[11px] sm:text-xs flex-shrink-0">
                                    {selectedCountry.flag}
                                  </span>
                                )}
                                <ChevronDown
                                  className={`w-4 h-4 sm:w-3 sm:h-3 text-gray-400 transition-transform ${
                                    isCountryDropdownOpen ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            )}
                          </div>

                          {/* Country Dropdown */}
                          {isCountryDropdownOpen && !editingDialCode && (
                            <>
                              <div
                                className=""
                                onClick={() => setIsCountryDropdownOpen(false)}
                                onTouchStart={() => setIsCountryDropdownOpen(false)}
                                style={{ zIndex: 200 }}
                              />
                              <div className="absolute top-full lg:top-[130%] left-0 mt-2 w-[50vw] lg:w-[30vw] max-w-[90vw] h-[300px] lg:h-[220px] bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-hidden">
                                <div className="max-h-64 overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                  {filteredCountries.length > 0 ? (
                                    filteredCountries.map((country) => (
                                      <button
                                        key={country.code}
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleCountrySelect(country);
                                        }}
                                        className={`w-full flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-left hover:bg-blue-50 active:bg-blue-100 transition-all duration-150 ${
                                          selectedCountry.code === country.code
                                            ? "bg-blue-50 border-r-2 border-blue-500"
                                            : ""
                                        }`}
                                        role="option"
                                        aria-selected={selectedCountry.code === country.code}
                                      >
                                        {country.code === "US" ? (
                                          <USFlag className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                        ) : (
                                          <span className="text-sm sm:text-base flex-shrink-0">
                                            {country.flag}
                                          </span>
                                        )}
                                        <div className="flex-1 min-w-0 flex items-center justify-between">
                                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate pr-2">
                                            {country.name}
                                          </p>
                                          <span className="text-xs sm:text-sm font-medium text-gray-600 flex-shrink-0">
                                            {country.dialCode}
                                          </span>
                                        </div>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-3 py-4 text-center text-xs sm:text-sm text-gray-500">
                                      No countries found
                                    </div>
                                  )}
                                  {filteredCountries.length > 12 && (
                                    <div className="px-2 sm:px-3 py-2 text-center text-xs text-gray-400 border-t border-gray-100">
                                      {filteredCountries.length - 12} more results...
                                    </div>
                                  )}
                                </div>

                                <div className="border-t border-gray-100 p-2">
                                  <button
                                    type="button"
                                    onClick={handleDialCodeEdit}
                                    className="w-full flex items-center gap-1.5 text-left text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1.5 rounded transition-colors"
                                  >
                                    <span className="text-sm">🌐</span>
                                    <span>Custom code</span>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Phone Number Input */}
                        <input
                          {...register("phoneNumber", {
                            validate: handlePhoneValidation,
                            maxLength: selectedCountry.maxLength ? selectedCountry.maxLength + selectedCountry.dialCode.length : 20,
                          })}
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder={selectedCountry.example ? `${selectedCountry.dialCode} ${selectedCountry.example}` : `${selectedCountry.dialCode} Enter phone number`}
                          maxLength={selectedCountry.maxLength ? selectedCountry.maxLength + selectedCountry.dialCode.length : 20}
                          className="flex-1 phone-input-custom bg-transparent border-none outline-none min-w-0 focus:ring-0 text-black text-[12px] md:text-[20px] lg:text-[22px] xl:text-[24px]"
                          style={{
                            fontFamily: "Poppins, sans-serif",
                            fontWeight: 400,
                            letterSpacing: "1.2px",
                          }}
                        />
                      </div>

                      {/* Call Button - Optimized for mobile */}
                      <motion.button
                        type="submit"
                        disabled={!isValid || !phoneNumber?.trim()}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center justify-center gap-1 sm:gap-2 md:gap-2.5 lg:gap-3 h-[38px] sm:h-[44px] md:h-[54px] lg:h-12 xl:h-14 px-3 sm:px-4 md:px-5 lg:px-6 xl:px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0 min-w-[70px] sm:min-w-[90px] md:min-w-[100px] lg:min-w-[110px] xl:min-w-[120px] shadow-lg"
                        aria-label="Call now"
                      >
                        <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-white" />
                        <span
                          className="text-white text-[11px] sm:text-[13px] md:text-[15px] lg:text-base xl:text-lg font-medium whitespace-nowrap"
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                          Call
                        </span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {errors.phoneNumber && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      id="phone-error"
                      className="text-red-500 text-sm mt-2 text-center"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                      role="alert"
                    >
                      {errors.phoneNumber.message}
                    </motion.p>
                  )}
                </motion.form>
              )}

              {/* Calling Interface */}
              {(callState === "connecting" || callState === "calling" || callState === "ending") && (
                <motion.div
                  key="calling-interface"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                  className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl px-4 sm:px-0"
                >
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 text-center">
                    {/* Phone Animation */}
                    <div className="relative mb-6">
                      <motion.div
                        animate={
                          callState === "calling"
                            ? {
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0],
                              }
                            : {}
                        }
                        transition={{
                          duration: 2,
                          repeat: callState === "calling" ? Infinity : 0,
                          ease: "easeInOut",
                        }}
                        className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                      >
                        <PhoneIcon className="w-10 h-10 text-white" />
                      </motion.div>

                      {/* Ripple Animation */}
                      {callState === "calling" && (
                        <>
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="absolute inset-0 border-2 border-blue-300 rounded-full"
                              initial={{ scale: 0.8, opacity: 0.7 }}
                              animate={{ scale: 2, opacity: 0 }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.6,
                                ease: "easeOut",
                              }}
                            />
                          ))}
                        </>
                      )}
                    </div>

                    {/* Status Text */}
                    <motion.h3
                      className="text-xl font-semibold text-gray-900 mb-2"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {callState === "connecting" && "Connecting..."}
                      {callState === "calling" && "Call in Progress"}
                      {callState === "ending" && "Ending Call..."}
                    </motion.h3>

                    {/* Phone Number */}
                    <p
                      className="text-gray-600 mb-4"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {getFullPhoneNumber(phoneNumber)}
                    </p>

                    {/* Call Duration */}
                    {callState === "calling" && (
                      <motion.p
                        className="text-2xl font-mono text-blue-600 mb-6"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {formatDuration(callDuration)}
                      </motion.p>
                    )}

                    {/* End Call Button */}
                    {callState === "calling" && (
                      <motion.button
                        onClick={handleEndCall}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-medium transition-colors"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                      >
                        End Call
                      </motion.button>
                    )}

                    {/* Loading dots for connecting/ending */}
                    {(callState === "connecting" || callState === "ending") && (
                      <div className="flex justify-center space-x-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-blue-500 rounded-full"
                            animate={{ y: [0, -8, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: i * 0.2,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Call Ended */}
              {callState === "ended" && (
                <motion.div
                  key="call-ended"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="w-full max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl px-4 sm:px-0"
                >
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                      className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-6"
                    >
                      <svg
                        className="w-10 h-10 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </motion.div>

                    <h3
                      className="text-xl font-semibold text-gray-900 mb-2"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Call Completed
                    </h3>
                    <p
                      className="text-gray-600"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      Thanks for trying ShivAI!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Description */}
          <section
            className="max-w-5xl md:max-w-6xl lg:max-w-7xl xl:max-w-8xl text-center px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 mt-3 sm:mt-4 md:mt-6 lg:mt-8 xl:mt-10"
            aria-labelledby="description-heading"
          >
            <h2 id="description-heading" className="sr-only">
              ShivAI Features
            </h2>
            <p
              className="text-white text-center text-[12px] md:text-[20px] lg:text-[22px] xl:text-[24px]"
              style={{
                fontFamily: "Poppins, sans-serif",
                color: "#FFF",
                textAlign: "center",
                fontStyle: "normal",
                fontWeight: 400,
                lineHeight: "157.3%",
              }}
            >
              ShivAI will ask your{" "}
              <strong className="font-bold text-white">language</strong> of
              choice and{" "}
              <strong className="font-bold text-white">switch</strong>{" "}
              instantly. It{" "}
              <strong className="font-bold text-white">sells</strong>,{" "}
              <strong className="font-bold text-white">supports</strong>, and{" "}
              <strong className="font-bold text-white">books</strong> like your
              real teammate.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
