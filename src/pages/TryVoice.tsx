import bgNew from "../resources/AiImages/bg.svg";
import voiceIcon from "../resources/AiImages/Animation.png";
import { motion } from "framer-motion";
import { Orb,oceanDepthsPreset ,galaxyPreset } from "react-ai-orb";
export default function TryVoice() {
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
          className="absolute inset-0  pointer-events-none "
          style={{
            background: `url(${bgNew})`,
            backgroundPosition: "center",
            backgroundRepeat: "repeat",
          }}
          aria-hidden="true"
        />

        {/* Main Content */}
        <div className="relative z-10 flex flex-col gap-5 lg:gap-1 justify-center items-center h-auto px-4 py-2 sm:px-6 md:px-8 lg:px-12 xl:px-16  md:py-12 lg:py-10 xl:py-10 space-y-0  md:space-y-8 lg:space-y-10 min-h-[44vh] md:min-h-[40vh] lg:min-h-[40vh] xl:min-h-[40vh]">
            <div className="relative flex items-center justify-center mb-0 sm:mb-0 md:mb-2 z-20">
            {/* Glow effect */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[120px] h-[120px] rounded-full bg-white opacity-30 blur-2xl" />
            </div>
            <Orb {...oceanDepthsPreset} />
            </div>
          <header className="flex flex-col items-center text-center max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl">
            {/* Main Title */}
            <h1
              id="main-heading"
              className="text-white text-wrap leading-[36px] lg:leading:[normal] lg:text-nowrap text-[32px] sm:text-[36px] md:text-[44px] lg:text-[56px] xl:text-[64px] mb-2 sm:mb-6 md:mb-6 lg:mb-6 px-2 md:px-4 lg:px-6"
              style={{
                fontFamily: "Poppins, sans-serif",
                letterSpacing: "-1px",
                fontWeight: 600,
                color: "#FFF",
              }}
            >
              Talk to ShivAI in Your Language
            </h1>
          </header>

          {/* Animated Video Icon */}

          {/* AI Employee Features Widget */}
          <div className="flex flex-col items-center w-full max-w-4xl relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 md:p-8 text-center"
            >
              <h3
                className="text-white text-lg md:text-xl lg:text-2xl font-semibold mb-3"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Your AI Employee, Always On
              </h3>
              <p
                className="text-white/90 text-sm md:text-base mb-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Handles calls in 56+ languages, sells, supports, and books 24/7.
              </p>
              <p
                className="text-white/80 text-xs md:text-sm mb-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                One-line deploy • No setup • Works instantly
              </p>
              <p
                className="text-white/70 text-xs md:text-sm"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                ShivAI talks, thinks, and works like your smartest teammate.
              </p>
            </motion.div>
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
