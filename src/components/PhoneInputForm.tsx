import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import CountrySelector from "./CountrySelector";
import PhoneIcon from "./icons/PhoneIcon";
import { formatPhoneNumber, validatePhoneNumber, getInternationalFormat } from "../lib/phoneUtils";

interface PhoneFormData {
  phoneNumber: string;
}

interface PhoneInputFormProps {
  onSubmit?: (data: PhoneFormData) => void;
  className?: string;
}

export default function PhoneInputForm({ onSubmit, className = "" }: PhoneInputFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
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

  const onFormSubmit = useCallback(async (data: PhoneFormData) => {
    setIsLoading(true);
    try {
      if (onSubmit) {
        // Convert to international format before submitting
        const internationalNumber = getInternationalFormat(data.phoneNumber);
        await onSubmit({ phoneNumber: internationalNumber });
      }
    } catch (error) {
      console.error("Failed to submit phone number:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onSubmit]);

  const handlePhoneValidation = (value: string) => {
    const result = validatePhoneNumber(value);
    return result.isValid ? true : result.message;
  };

  return (
    <div className={`flex flex-col items-center w-full max-w-4xl ${className}`}>
      {/* Disclaimer */}
      <p 
        className="text-gray-500 text-center text-[14px] sm:text-[16px] md:text-[18px] lg:text-lg font-normal leading-relaxed mb-6 sm:mb-8 px-4" 
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        We'll only use this once for your demo call, no spam
      </p>

      {/* Phone Input Form */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="w-full max-w-3xl px-4 sm:px-0">
        <div className="w-full h-[56px] sm:h-[64px] md:h-[72px] lg:h-24 bg-white rounded-full border border-gray-200 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between h-full px-4 sm:px-6">
            {/* Country Selector & Phone Input */}
            <div className="flex items-center flex-1 gap-2 sm:gap-3 md:gap-4 lg:gap-8">
              <CountrySelector />

              {/* Phone Number Input */}
              <input
                {...register("phoneNumber", {
                  validate: handlePhoneValidation,
                  onChange: (e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    e.target.value = formatted;
                  },
                })}
                type="tel"
                placeholder="Enter Phone Number"
                className="flex-1 text-[14px] sm:text-[16px] md:text-[18px] lg:text-xl font-normal text-gray-900 placeholder:text-gray-400 bg-transparent border-none outline-none min-w-0 focus:ring-0"
                style={{ fontFamily: 'Poppins, sans-serif' }}
                aria-invalid={errors.phoneNumber ? "true" : "false"}
                aria-describedby={errors.phoneNumber ? "phone-error" : undefined}
              />
            </div>

            {/* Call Button */}
            <button
              type="submit"
              disabled={!isValid || !phoneNumber?.trim() || isLoading}
              className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3 lg:gap-4 h-[40px] sm:h-[48px] md:h-[56px] lg:h-14 px-3 sm:px-4 md:px-5 lg:px-6 bg-black rounded-full hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              aria-label="Call now"
            >
              <PhoneIcon />
              <span 
                className="text-white text-[12px] sm:text-[14px] md:text-[16px] lg:text-xl font-normal" 
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {isLoading ? "Calling..." : "Call"}
              </span>
            </button>
          </div>
        </div>
        
        {/* Error Message */}
        {errors.phoneNumber && (
          <p 
            id="phone-error"
            className="text-red-500 text-sm mt-2 text-center"
            style={{ fontFamily: 'Poppins, sans-serif' }}
            role="alert"
          >
            {errors.phoneNumber.message}
          </p>
        )}
      </form>
    </div>
  );
}