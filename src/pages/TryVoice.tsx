import { useCallback, useState, useEffect } from "react";
import PhoneInputForm from "../components/PhoneInputForm";
import blackAi from "../resources/AiImages/blackAI.png";
import baldAi from "../resources/AiImages/baldAi.png";
import WhiteAi from "../resources/AiImages/whiteAi.png";
import bgNew from "../resources/AiImages/bg.svg";
import voiceIcon from "../resources/AiImages/Animation.png";
import { motion, AnimatePresence } from "framer-motion";
interface PhoneFormData {
  phoneNumber: string;
}

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
  const handlePhoneSubmit = useCallback(async (data: PhoneFormData) => {
    try {
      // TODO: Implement actual phone call functionality
      console.log("Making call to:", data.phoneNumber);

      // Simulate API call - this would be your actual calling service integration
      // For example: await callService.initiateCall(data.phoneNumber);

      // Simulate demo call experience
      console.log(`Demo call initiated to ${data.phoneNumber}`);

      // You can add analytics tracking here
      // analytics.track('demo_call_started', { phoneNumber: data.phoneNumber });
    } catch (error) {
      console.error("Failed to initiate call:", error);
      // You could show an error notification here
    }
  }, []);

  return (
    <div className="bg-[#F0F0F0] font-sans px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12">
      {/* Main Container */}
      <main
        id="demo-content"
        className="relative shadow-xl py-4 sm:py-6 md:py-8 lg:py-0 xl:py-0 lg:top-0 -top-[18vh]  xl:max-w-8xl mx-auto bg-[#FAFAFA] lg:shadow-lg rounded-3xl  lg:rounded-[40px] xl:rounded-[50px] sm:mx-2 md:m-4 lg:m-6 xl:m-8  overflow-hidden"
        role="main"
        aria-labelledby="main-heading"
      >
        <div
          className="absolute inset-0  pointer-events-none"
          style={{
            background: `url(${bgNew})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />

        {/* Main Content */}
        <div className="relative z-10 flex flex-col gap-5 justify-center items-center h-auto px-4 py-2 sm:px-6 md:px-8 lg:px-12 xl:px-16  md:py-12 lg:py-10 xl:py-20 space-y-0  md:space-y-8 lg:space-y-12 xl:space-y-16 min-h-[44vh] md:min-h-[40vh] lg:min-h-[40vh] xl:min-h-[50vh]">
          <div className="relative flex items-center justify-center mb-0 sm:mb-0 md:mb-8 z-20">
            <img
              src={voiceIcon}
              alt="AI fallback"
              className="w-20 h-20 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28"
              style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.18))" }}
            />
          </div>
          <header className="flex flex-col items-center text-center max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl">
            {/* Main Title */}
            <h1
              id="main-heading"
              className="text-white text-wrap lg:text-nowrap text-[32px] sm:text-[36px] md:text-[44px] lg:text-[56px] xl:text-[64px] mb-4 sm:mb-6 md:mb-8 lg:mb-10 xl:mb-12 px-2 md:px-4 lg:px-6"
              style={{
                fontFamily: "Poppins, sans-serif",
                lineHeight: "normal",
                letterSpacing: "-1px",
                fontWeight: 600,
                color: "#FFF",
              }}
            >
              Talk to ShivAI in Your Language
            </h1>

            {/* Subtitle with action buttons */}
            <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 mb-4">
                <div
                  className="flex items-center justify-center px-[14px] sm:px-[18px] py-[8px] sm:py-[10px] gap-[8px] sm:gap-[10px] "
                  style={{
                    display: "flex",
                    padding: "8px 12px",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    borderRadius: "29.89px",
                    border: "0.57px solid #1192bb",
                    backgroundImage: "rgba(255, 255, 255, 0.10)",
                    boxShadow:
                      "0 1.14px 2.28px 0 rgba(74, 58, 255, 0.15), 0 -2.28px 1.14px 0 rgba(0, 66, 137, 0.07) inset, 0 1.14px 1.14px 0 rgba(255, 255, 255, 0.35) inset, 0 3.42px 4.56px 0 rgba(223, 238, 255, 0.3) inset",
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
                    borderRadius: "29.89px",
                    border: "0.57px solid #1192bb",
                    backgroundImage: "rgba(255, 255, 255, 0.10)",
                    boxShadow:
                      "0 1.14px 2.28px 0 rgba(74, 58, 255, 0.15), 0 -2.28px 1.14px 0 rgba(0, 66, 137, 0.07) inset, 0 1.14px 1.14px 0 rgba(255, 255, 255, 0.35) inset, 0 3.42px 4.56px 0 rgba(223, 238, 255, 0.3) inset",
                  }}
                >
                  <span className="text-xs sm:text-sm md:text-base lg:text-lg text-white font-medium">
                    One click, one call, with AI Employee.
                  </span>
                </div>
              </div>

              <p
                className="text-center text-[11px] sm:text-[16px] md:text-[17px] lg:text-[18px] font-normal max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl px-2 md:px-4 lg:px-6"
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
          <PhoneInputForm onSubmit={handlePhoneSubmit} />

          {/* Bottom Description */}
          <section
            className="max-w-5xl md:max-w-6xl lg:max-w-7xl xl:max-w-8xl text-center px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 mt-3 sm:mt-4 md:mt-6 lg:mt-8 xl:mt-10"
            aria-labelledby="description-heading"
          >
            <h2 id="description-heading" className="sr-only">
              ShivAI Features
            </h2>
            <p
              className="text-white text-center text-[14px] md:text-[20px] lg:text-[22px] xl:text-[24px]"
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
