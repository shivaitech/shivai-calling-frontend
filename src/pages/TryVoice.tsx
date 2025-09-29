import { useCallback } from "react";
import PhoneInputForm from "../components/PhoneInputForm";

interface PhoneFormData {
  phoneNumber: string;
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
    <div className="bg-[#F0F0F0] font-sans px-2 sm:px-4">
      {/* Main Container */}
      <main
        className="relative py-6 sm:py-8 lg:py-4 lg:top-0 -top-[12vh] sm:-top-[16vh] max-w-8xl mx-auto bg-[#FAFAFA] shadow-none lg:shadow-lg rounded-2xl sm:rounded-3xl lg:rounded-[40px] sm:mx-2 md:m-4 lg:m-8 sm:h-auto sm:min-h-[300px] md:min-h-[600px] overflow-hidden"
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
        <div className="relative z-10 flex flex-col items-center justify-center h-auto px-3 py-6 sm:px-6 md:px-8 lg:px-8 sm:py-8 lg:py-16 space-y-4 sm:space-y-6 md:space-y-8 lg:space-y-16 min-h-[60vh]">
          <header className="flex flex-col items-center text-center max-w-4xl">
            {/* Main Title */}
            <h1
              id="main-heading"
              className="text-[#333] text-wrap font-normal text-[22px] sm:text-[28px] md:text-[40px] lg:text-5xl xl:text-6xl mb-4 sm:mb-6 px-2"
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
              className="text-[#666] text-wrap text-[12px] sm:text-[14px] md:text-[18px] lg:text-xl font-normal leading-relaxed max-w-2xl px-2 mb-3 sm:mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Enter your number to try the demo here — no spam, just experience your AI Employee live.
            </p>
          </header>

          {/* Phone Input Form */}
          <PhoneInputForm onSubmit={handlePhoneSubmit} />

          {/* Bottom Description */}
          <section
            className="max-w-5xl text-center px-2 sm:px-3 mt-3 sm:mt-4 lg:mt-6"
            aria-labelledby="description-heading"
          >
            <h2 id="description-heading" className="sr-only">
              ShivAI Features
            </h2>
            <p
              className="text-gray-700 text-[13px] sm:text-[15px] md:text-[18px] lg:text-xl leading-relaxed"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              ShivAI will ask your{" "}
              <strong className="font-bold text-blue-600">language</strong> of choice and{" "}
              <strong className="font-bold text-purple-600">switch</strong> instantly. It{" "}
              <strong className="font-bold text-green-600">sells</strong>,{" "}
              <strong className="font-bold text-orange-600">supports</strong>, and{" "}
              <strong className="font-bold text-pink-600">books</strong> like your real
              teammate.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
