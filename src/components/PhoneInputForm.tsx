import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import CountrySelector from "./CountrySelector";
import PhoneIcon from "./icons/PhoneIcon";
import { formatPhoneNumber, validatePhoneNumber } from "../lib/phoneUtils";
import { Country } from "../types/country";

interface PhoneFormData {
  phoneNumber: string;
}

interface PhoneInputFormProps {
  onSubmit?: (data: PhoneFormData) => void;
  className?: string;
}

type CallState = 'idle' | 'connecting' | 'calling' | 'ending' | 'ended';

export default function PhoneInputForm({ onSubmit, className = "" }: PhoneInputFormProps) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: "US",
    name: "United States", 
    flag: "🇺🇸",
    dialCode: "+1"
  });
  
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

  // Timer effect for call duration
  useEffect(() => {
    let interval: number;
    
    if (callState === 'calling') {
      interval = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
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
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCountryChange = useCallback((country: Country) => {
    setSelectedCountry(country);
  }, []);

  const formatPhoneWithCountry = useCallback((phoneNumber: string) => {
    if (selectedCountry.dialCode === "+1") {
      // Use existing US formatting
      return formatPhoneNumber(phoneNumber);
    } else {
      // For other countries, just clean and return digits
      const digits = phoneNumber.replace(/\D/g, "");
      return digits;
    }
  }, [selectedCountry]);

  const getFullPhoneNumber = useCallback((phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    return `${selectedCountry.dialCode}${cleanNumber}`;
  }, [selectedCountry]);

  const onFormSubmit = useCallback(async (data: PhoneFormData) => {
    try {
      // Start call sequence
      setCallState('connecting');
      
      // Simulate connecting phase
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCallState('calling');
      
      if (onSubmit) {
        // Convert to international format before submitting
        const fullPhoneNumber = getFullPhoneNumber(data.phoneNumber);
        await onSubmit({ phoneNumber: fullPhoneNumber });
      }
      
      // Simulate call duration (demo purposes)
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // End call sequence
      setCallState('ending');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCallState('ended');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setCallState('idle');
      }, 3000);
      
    } catch (error) {
      console.error("Failed to submit phone number:", error);
      setCallState('idle');
    }
  }, [onSubmit]);

  const handleEndCall = useCallback(() => {
    setCallState('ending');
    setTimeout(() => {
      setCallState('ended');
      setTimeout(() => {
        setCallState('idle');
      }, 2000);
    }, 1000);
  }, []);

  const handlePhoneValidation = useCallback((value: string) => {
    if (!value || value.trim().length === 0) {
      return "Phone number is required";
    }
    
    const digits = value.replace(/\D/g, "");
    
    if (selectedCountry.dialCode === "+1") {
      // Use existing US validation
      const result = validatePhoneNumber(value);
      return result.isValid ? true : result.message;
    } else {
      // For other countries, basic validation
      if (digits.length < 6) {
        return "Phone number is too short";
      }
      if (digits.length > 15) {
        return "Phone number is too long";
      }
    }
    
    return true;
  }, [selectedCountry]);

  return (
    <div className={`flex flex-col items-center w-full max-w-4xl relative ${className}`}>
      {/* Disclaimer */}
      <div className="text-center mb-6 sm:mb-8 px-4">
        <p 
          className="text-gray-500 text-[14px] sm:text-[16px] md:text-[18px] lg:text-lg font-normal leading-relaxed mb-2" 
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          We'll only use this once for your demo call, no spam
        </p>
        <p 
          className="text-gray-400 text-[12px] sm:text-[14px] md:text-[16px] font-normal" 
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          💡 Double-click the country code to type a custom one
        </p>
      </div>

      <AnimatePresence mode="wait">
        {callState === 'idle' && (
          <motion.form 
            key="phone-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit(onFormSubmit)} 
            className="w-full max-w-3xl px-4 sm:px-0"
          >
            <div className="w-full h-[56px] sm:h-[64px] md:h-[72px] lg:h-24 bg-white rounded-full border border-gray-200 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between h-full px-3 sm:px-4 lg:px-6">
                {/* Country Selector & Phone Input */}
                <div className="flex items-center flex-1 gap-2 sm:gap-3 lg:gap-4 min-w-0">
                  <div className="flex-shrink-0">
                    <CountrySelector 
                      selectedCountry={selectedCountry}
                      onCountryChange={handleCountryChange}
                    />
                  </div>

                  {/* Phone Number Input */}
                  <input
                    {...register("phoneNumber", {
                      validate: handlePhoneValidation,
                      onChange: (e) => {
                        const formatted = formatPhoneWithCountry(e.target.value);
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

                {/* Call Button - Improved mobile visibility */}
                <motion.button
                  type="submit"
                  disabled={!isValid || !phoneNumber?.trim()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-1 sm:gap-2 lg:gap-3 h-[40px] sm:h-[48px] md:h-[56px] lg:h-14 px-2 sm:px-3 md:px-4 lg:px-6 bg-black rounded-full hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-shrink-0 min-w-[60px] sm:min-w-[80px] md:min-w-[100px]"
                  aria-label="Call now"
                >
                  <PhoneIcon />
                  <span 
                    className="text-white text-[10px] sm:text-[12px] md:text-[14px] lg:text-lg font-normal whitespace-nowrap" 
                    style={{ fontFamily: 'Poppins, sans-serif' }}
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
                style={{ fontFamily: 'Poppins, sans-serif' }}
                role="alert"
              >
                {errors.phoneNumber.message}
              </motion.p>
            )}
          </motion.form>
        )}

        {/* Calling Interface */}
        {(callState === 'connecting' || callState === 'calling' || callState === 'ending') && (
          <motion.div
            key="calling-interface"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md px-4 sm:px-0"
          >
            <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-8 text-center">
              {/* Phone Animation */}
              <div className="relative mb-6">
                <motion.div
                  animate={callState === 'calling' ? {
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: callState === 'calling' ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                  className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                >
                  <PhoneIcon className="w-10 h-10 text-white" />
                </motion.div>
                
                {/* Ripple Animation */}
                {callState === 'calling' && (
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
                          ease: "easeOut"
                        }}
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Status Text */}
              <motion.h3 
                className="text-xl font-semibold text-gray-900 mb-2"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {callState === 'connecting' && 'Connecting...'}
                {callState === 'calling' && 'Call in Progress'}
                {callState === 'ending' && 'Ending Call...'}
              </motion.h3>

              {/* Phone Number */}
              <p className="text-gray-600 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {getFullPhoneNumber(phoneNumber)}
              </p>

              {/* Call Duration */}
              {callState === 'calling' && (
                <motion.p 
                  className="text-2xl font-mono text-blue-600 mb-6"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {formatDuration(callDuration)}
                </motion.p>
              )}

              {/* End Call Button */}
              {callState === 'calling' && (
                <motion.button
                  onClick={handleEndCall}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-medium transition-colors"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  End Call
                </motion.button>
              )}

              {/* Loading dots for connecting/ending */}
              {(callState === 'connecting' || callState === 'ending') && (
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
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Call Ended */}
        {callState === 'ended' && (
          <motion.div
            key="call-ended"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md px-4 sm:px-0"
          >
            <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-6"
              >
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Call Completed
              </h3>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Thanks for trying ShivAI!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}