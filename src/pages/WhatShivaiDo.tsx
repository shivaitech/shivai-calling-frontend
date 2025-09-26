import React, { useState, useRef, useEffect } from "react";
import integration from "../resources/images/02.svg";
import voice from "../resources/images/03.svg";
import language from "../resources/images/04.svg";
import security from "../resources/images/01.svg";
import learning from "../resources/images/05.svg";

const features = [
  {
    id: 1,
    title: "One-Line Integration",
    description:
      "Go live in minutes, not months. Add ShivAI to your site, app or phone line with a single line of code. No heavy IT lift, no complex setup.",
    illustration: "integration",
  },
  {
    id: 2,
    title: "Natural Voice Processing",
    description:
      "AI that truly understands not just hears. ShivAI recognises context, intent, and emotions in real time, delivering conversations that feel human, not scripted.",
    illustration: "voice",
  },
  {
    id: 3,
    title: "Multi-Language Support",
    description:
      "Talk to your customers in their language of choice. ShivAI already supports 50+ global and regional languages with native-quality pronunciation.",
    illustration: "language",
  },
  {
    id: 4,
    title: "Enterprise Security",
    description:
      "End-to-end encrypted and SOC 2 compliant. Every call, every transcript, and every customer interaction stays protected and private.",
    illustration: "security",
  },
  {
    id: 5,
    title: "Smart Learning",
    description:
      "Your AI employee gets better with every call. ShivAI continuously learns from conversations to sharpen accuracy, context, and results.",
    illustration: "learning",
  },
];

export const WhatShivaiDo = () => {
  const infiniteFeatures = [...features, ...features, ...features];
  const [currentSlide, setCurrentSlide] = useState(features.length + 1);
  const [isAnimating, setIsAnimating] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getIllustration = (type: string) => {
    try {
      let src;
      switch (type) {
        case "integration":
          src = integration;
          break;
        case "voice":
          src = voice;
          break;
        case "language":
          src = language;
          break;
        case "security":
          src = security;
          break;
        case "learning":
          src = learning;
          break;
        default:
          src = voice; // fallback
          break;
      }

      return (
        <div className="w-full h-full max-h-[220px] max-w-screen-sm flex items-center justify-center rounded-sm">
          <img
            src={src}
            alt={type}
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>
      );
    } catch {
      return null;
    }
  };

  // Handle seamless transitions for infinite loop
  useEffect(() => {
    if (sliderRef.current) {
      // Disable transition temporarily for seamless jumps
      if (
        currentSlide >= features.length * 2 ||
        currentSlide < features.length
      ) {
        const slider = sliderRef.current;
        slider.style.transition = "none";

        // Re-enable transition after a brief delay
        setTimeout(() => {
          slider.style.transition = "transform 300ms ease-out";
        }, 50);
      }
    }
  }, [currentSlide]);

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setCurrentSlide((prev) => {
      const nextSlide = prev + 1;

      // If we're at the end of the third set, seamlessly jump to start of second set
      if (nextSlide >= features.length * 2) {
        setTimeout(() => {
          setCurrentSlide(features.length);
        }, 300);
      }

      return nextSlide;
    });

    setTimeout(() => setIsAnimating(false), 300);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    setCurrentSlide((prev) => {
      const prevSlide = prev - 1;

      // If we're at the start of the first set, seamlessly jump to end of second set
      if (prevSlide < features.length) {
        setTimeout(() => {
          setCurrentSlide(features.length * 2 - 1);
        }, 200);
      }

      return prevSlide;
    });

    setTimeout(() => setIsAnimating(false), 300);
  };

  const goToSlide = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    // Map the feature index to the middle set of infinite array
    setCurrentSlide(index + features.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Helper function to get the actual feature index from infinite array position
  const getFeatureIndex = (slideIndex: number) => {
    return slideIndex % features.length;
  };

  return (
    <div className="w-full py-0 lg:py-0 pt-0 lg:pt-20 relative -top-[10vh] lg:top-0">
      <div className="max-w-8xl mx-auto px-0 sm:px lg:px-0">
        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-[36px] lg:text-[64px] font-semibold text-[#333333] tracking-tight mb-4 text-nowrap">
            What ShivAI Can Do
          </h2>
        </div>

        {/* Mobile View - Simple Single Card */}
        <div className="md:hidden">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 py-6 pt-7 px-4">
              <div className="w-full h-full max-h-[40vh] flex items-center justify-center">
                {getIllustration(infiniteFeatures[currentSlide].illustration)}
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {infiniteFeatures[currentSlide].title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {infiniteFeatures[currentSlide].description}
                </p>
              </div>
            </div>

            {/* Mobile Navigation Dots */}
            <div className="flex justify-center space-x-2">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    getFeatureIndex(currentSlide) === index
                      ? "bg-gray-900 scale-125"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Desktop View - Horizontal Slider with Blur Effect */}
        <div className="hidden md:block relative">
          <div className="relative overflow-hidden py-8 ">
            {/* Left Blur Overlay - Gradient Spread */}
            <div className="absolute left-0 top-0 w-20 lg:w-44 xl:w-55 h-full z-10 pointer-events-none">
              <div
                className="w-full h-full bg-gradient-to-r from-[#F0F0F0] via-[#F0F0F0]/20 to-transparent backdrop-blur-[1px]"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 25%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.3) 75%, transparent 100%)",
                }}
              />
            </div>
            {/* Right Blur Overlay - Gradient Spread */}
            <div className="absolute right-0 top-0 w-20 lg:w-44 xl:w-55 h-full z-10 pointer-events-none">
              <div
                className="w-full h-full bg-gradient-to-l from-[#F0F0F0] via-[#F0F0F0]/80 to-transparent backdrop-blur-[2px]"
                style={{
                  background:
                    "linear-gradient(270deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 25%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.3) 75%, transparent 100%)",
                }}
              />
            </div>

            {/* Slider Container */}
            <div
              ref={sliderRef}
              className="flex gap-6 will-change-transform"
              style={{
                transition: isAnimating
                  ? "transform 0.3s cubic-bezier(0.4,0,0.2,1)"
                  : "none",
                transform: `translate3d(calc(-${
                  currentSlide * 344
                }px + 50vw - 172px), 0, 0)`,
              }}
            >
              {infiniteFeatures.map((feature, index) => {
                const isCenter = index === currentSlide;
                const distance = Math.abs(index - currentSlide);

                return (
                  <div
                    key={`${feature.id}-${index}`}
                    className={`flex-none w-80 transition-all duration-300 ease-out cursor-pointer will-change-transform ${
                      isCenter
                        ? "opacity-100 z-20"
                        : distance === 1
                        ? "opacity-85 z-10"
                        : "opacity-50 z-0"
                    }`}
                    onClick={() => {
                      if (!isAnimating) {
                        setIsAnimating(true);
                        setCurrentSlide(index);
                        setTimeout(() => setIsAnimating(false), 300);
                      }
                    }}
                  >
                    <div
                      className={`bg-white rounded-2xl w-full overflow-hidden transition-all duration-300 ease-out will-change-transform ${
                        isCenter
                          ? "shadow-2xl shadow-blue-500/20  transform scale-105  "
                          : distance === 1
                          ? "shadow-xl shadow-gray-400/30 border border-gray-200 "
                          : "shadow-lg shadow-gray-400/20 border border-gray-100"
                      } h-content p-3`}
                    >
                      {/* Card Illustration Area */}
                      <div className=" relative ">
                        {getIllustration(feature.illustration)}
                      </div>

                      {/* Card Content */}
                      <div className="px-2 pt-4 text-center">
                        <h3 className="text-[20px] font-semibold text-[#000000] mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-[10px] leading-relaxed mb-4">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Arrows */}
            {/* <button
              onClick={handlePrev}
              disabled={isAnimating}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg rounded-full p-3 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700 group-hover:text-gray-900 transition-colors" />
            </button>

            <button
              onClick={handleNext}
              disabled={isAnimating}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg rounded-full p-3 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <ChevronRight className="w-6 h-6 text-gray-700 group-hover:text-gray-900 transition-colors" />
            </button> */}
          </div>

          {/* Desktop Navigation Dots */}
          {/* <div className="flex justify-center space-x-3 mt-8">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isAnimating}
                className={`transition-all duration-300 rounded-full ${
                  getFeatureIndex(currentSlide) === index
                    ? "w-8 h-3 bg-gray-900"
                    : "w-3 h-3 bg-gray-300 hover:bg-gray-400"
                } disabled:cursor-not-allowed`}
              />
            ))}
          </div> */}
        </div>
      </div>
    </div>
  );
};
