import { useCallback, useState, useEffect } from "react";
import PhoneInputForm from "../components/PhoneInputForm";
import blackAi from "../resources/AiImages/blackAI.png";
import baldAi from "../resources/AiImages/baldAi.png";
import WhiteAi from "../resources/AiImages/whiteAi.png";
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
          className="absolute inset-0 opacity-80 pointer-events-none"
          style={{
            background:
              "linear-gradient(106deg, rgba(23, 183, 234, 0.22) 24.86%, rgba(215, 167, 255, 0.22) 39.56%, rgba(175, 250, 255, 0.22) 54.91%)",
            filter: "blur(60px)",
            transform: "translateY(60%)",
          }}
          aria-hidden="true"
        />

        {/* Main Content */}
        <div className="relative z-10 flex flex-col gap-5 justify-center items-center h-auto px-4 py-2 sm:px-6 md:px-8 lg:px-12 xl:px-16  md:py-12 lg:py-10 xl:py-20 space-y-4  md:space-y-8 lg:space-y-12 xl:space-y-16 min-h-[44vh] md:min-h-[40vh] lg:min-h-[40vh] xl:min-h-[50vh]">
          <header className="flex flex-col items-center text-center max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl">
            {/* Main Title */}
            <h1
              id="main-heading"
              className="text-[#333] text-wrap lg:text-nowrap font-normal text-[26px] sm:text-[32px] md:text-[42px] lg:text-5xl xl:text-6xl 2xl:text-7xl mb-4 sm:mb-6 md:mb-8 lg:mb-10 xl:mb-12 px-2 md:px-4 lg:px-6"
              style={{
                fontFamily: "Poppins, sans-serif",
                lineHeight: "1.1",
                letterSpacing: "-0.5px",
                fontWeight: 600,
              }}
            >
              Talk to ShivAI in Your Language
            </h1>

            {/* Subtitle */}
            <p
              className="text-[#666] text-wrap text-[12px] sm:text-[16px] md:text-[18px] lg:text-xl xl:text-2xl font-normal leading-relaxed max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl px-2 md:px-4 lg:px-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Enter your number to try the demo here no spam, just experience
              your AI Employee live.
            </p>
          </header>

          {/* AI Image Carousel */}
          {/* <AiImageCarousel /> */}

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
              className="text-gray-700 text-[13px] sm:text-[16px] md:text-[18px] lg:text-xl xl:text-2xl leading-relaxed md:leading-relaxed lg:leading-relaxed xl:leading-loose"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              ShivAI will ask your{" "}
              <strong className="font-bold text-blue-600">language</strong> of
              choice and{" "}
              <strong className="font-bold text-purple-600">switch</strong>{" "}
              instantly. It{" "}
              <strong className="font-bold text-green-600">sells</strong>,{" "}
              <strong className="font-bold text-orange-600">supports</strong>,
              and <strong className="font-bold text-pink-600">books</strong>{" "}
              like your real teammate.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
