import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Slider from "react-slick";
import integration from "../../resources/images/02.svg";
import voice from "../../resources/images/03.svg";
import language from "../../resources/images/04.svg";
import security from "../../resources/images/01.svg";
import learning from "../../resources/images/05.svg";

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

export const WhatShivaiDo = React.memo(() => {
  // Memoize infinite features array to prevent recreation on every render
  const infiniteFeatures = useMemo(() => [...features, ...features, ...features], []);
  
  const [currentSlide, setCurrentSlide] = useState(features.length);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const mobileSliderRef = useRef<any>(null);
  const intervalRef = useRef<number | null>(null);

  // Desktop swipe state
  const [isDesktopSwiping, setIsDesktopSwiping] = useState(false);
  const [desktopTouchStart, setDesktopTouchStart] = useState({ x: 0, y: 0 });
  const [desktopTouchEnd, setDesktopTouchEnd] = useState({ x: 0, y: 0 });

  // Memoize illustration mapping to prevent recalculation
  const illustrationMap = useMemo(() => ({
    integration,
    voice,
    language,
    security,
    learning
  }), []);

  // Preload images for better performance
  useEffect(() => {
    const preloadImages = () => {
      Object.values(illustrationMap).forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    };
    
    // Preload images after component mounts
    const timeoutId = setTimeout(preloadImages, 100);
    return () => clearTimeout(timeoutId);
  }, [illustrationMap]);

  const getIllustration = useCallback((type: string) => {
    try {
      const src = illustrationMap[type as keyof typeof illustrationMap] || voice;

      return (
        <div className="h-[60%] w-[90%] lg:w-full lg:h-full max-w-screen-sm flex items-center justify-center mt-4 lg:mt-1">
          <img
            src={src}
            alt={type}
            className="w-full h-full object-contain"
            draggable={false}
            loading="eager"
            decoding="async"
            style={{ imageRendering: 'auto' }}
          />
        </div>
      );
    } catch {
      return null;
    }
  }, [illustrationMap]);

  // Track if we need seamless transition
  const [needsSeamlessJump, setNeedsSeamlessJump] = useState(false);

  // Handle seamless transitions for infinite loop with reduced DOM manipulation
  useEffect(() => {
    if (
      currentSlide >= features.length * 2 ||
      currentSlide < features.length
    ) {
      setNeedsSeamlessJump(true);
      // Re-enable smooth transition after a brief delay
      const timeoutId = setTimeout(() => {
        setNeedsSeamlessJump(false);
      }, 50);

      return () => clearTimeout(timeoutId);
    }
  }, [currentSlide]);

  // Throttled handleNext to prevent performance issues
  const handleNext = useCallback(() => {
    if (isAnimating) return;
    
    // Clear any existing interval to prevent multiple timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
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
  }, [isAnimating]);

  // Add handlePrev function for desktop swipe
  const handlePrev = useCallback(() => {
    if (isAnimating) return;
    
    // Clear any existing interval to prevent multiple timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsAnimating(true);

    setCurrentSlide((prev) => {
      const prevSlide = prev - 1;

      // If we're at the beginning of the first set, seamlessly jump to end of second set
      if (prevSlide < features.length) {
        setTimeout(() => {
          setCurrentSlide(features.length * 2 - 1);
        }, 300);
      }

      return prevSlide;
    });

    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating]);

  // Desktop touch/swipe handlers
  const handleDesktopTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDesktopSwiping(true);
    setDesktopTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  }, []);

  const handleDesktopTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDesktopSwiping) return;
    setDesktopTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  }, [isDesktopSwiping]);

  const handleDesktopTouchEnd = useCallback(() => {
    if (!isDesktopSwiping) return;
    
    setIsDesktopSwiping(false);
    
    const deltaX = desktopTouchStart.x - desktopTouchEnd.x;
    const deltaY = Math.abs(desktopTouchStart.y - desktopTouchEnd.y);
    
    // Only trigger swipe if horizontal movement is significant and vertical is minimal
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0) {
        handleNext(); // Swipe left -> next
      } else {
        handlePrev(); // Swipe right -> prev
      }
    }
  }, [isDesktopSwiping, desktopTouchStart, desktopTouchEnd, handleNext, handlePrev]);

  // Mouse drag handlers for desktop
  const [isDesktopDragging, setIsDesktopDragging] = useState(false);
  const [desktopMouseStart, setDesktopMouseStart] = useState({ x: 0, y: 0 });

  const handleDesktopMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDesktopDragging(true);
    setDesktopMouseStart({
      x: e.clientX,
      y: e.clientY
    });
  }, []);

  const handleDesktopMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDesktopDragging) return;
    e.preventDefault();
  }, [isDesktopDragging]);

  const handleDesktopMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDesktopDragging) return;
    
    setIsDesktopDragging(false);
    
    const deltaX = desktopMouseStart.x - e.clientX;
    const deltaY = Math.abs(desktopMouseStart.y - e.clientY);
    
    // Only trigger swipe if horizontal movement is significant and vertical is minimal
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0) {
        handleNext(); // Drag left -> next
      } else {
        handlePrev(); // Drag right -> prev
      }
    }
  }, [isDesktopDragging, desktopMouseStart, handleNext, handlePrev]);

  // Auto-scroll disabled for better user control
  // useEffect(() => {
  //   intervalRef.current = setInterval(() => {
  //     handleNext();
  //   }, 4000) as unknown as number;

  //   return () => {
  //     if (intervalRef.current) {
  //       clearInterval(intervalRef.current);
  //     }
  //   };
  // }, [handleNext]);





  // Debounced click handler to prevent rapid clicking
  const debouncedSlideClick = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating]);

  // Keep goToSlide for desktop functionality
  const goToSlide = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    // Map the feature index to the middle set of infinite array
    setCurrentSlide(index + features.length);
    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating]);

  // Helper function to get the actual feature index from infinite array position
  const getFeatureIndex = useCallback((slideIndex: number) => {
    return slideIndex % features.length;
  }, []);

  // Memoize transform calculation to prevent recalculation on every render
  const transformStyle = useMemo(() => ({
    transition: needsSeamlessJump
      ? "none" 
      : isAnimating
      ? "transform 0.3s cubic-bezier(0.4,0,0.2,1)"
      : "none",
    transform: `translate3d(calc(-${
      currentSlide * 344
    }px + 50vw - 172px), 0, 0)`,
  }), [currentSlide, isAnimating, needsSeamlessJump]);

  // Memoized card component to prevent unnecessary re-renders
  const FeatureCard = React.memo(({ 
    feature, 
    isCenter, 
    distance, 
    onClick 
  }: { 
    feature: typeof features[0]; 
    isCenter: boolean; 
    distance: number; 
    onClick: () => void; 
  }) => (
    <div
      className={`flex-none w-80 transition-all duration-300 ease-out cursor-pointer will-change-transform ${
        isCenter
          ? "opacity-100 z-20 pt-2 "
          : distance === 1
          ? "opacity-85 z-10 w-72 pt-6"
          : "opacity-50 z-0 w-68 pt-10"
      }`}
      onClick={onClick}
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
  ));

  // Safety check to prevent crashes
  if (!infiniteFeatures || infiniteFeatures.length === 0) {
    return <div className="w-full py-20 text-center">Loading...</div>;
  }

  return (
    <div className="w-full py-0 lg:py-0 pt-0 lg:pt-20 relative -top-[12vh] lg:top-0">
      <div className="max-w-8xl mx-auto px-0  lg:px-0">
        {/* Title */}
        <div className="text-center mb-4 lg:mb-4">
          <h2 className="text-[30px] lg:text-[64px] font-semibold text-[#333333] tracking-tight ">
            What ShivAI Can Do
          </h2>
        </div>

        {/* Mobile View - React Slick Carousel */}
        <div className="md:hidden">
          <div className="px-4">
            <Slider
              ref={mobileSliderRef}
              dots={false}
              infinite={true}
              speed={500}
              slidesToShow={1}
              slidesToScroll={1}
              swipeToSlide={true}
              touchThreshold={10}
              swipe={true}
              arrows={false}
              autoplay={false}
              pauseOnHover={true}
              className="mobile-carousel"
              beforeChange={(current, next) => {
                const normalizedIndex = next % features.length;
                setCurrentMobileSlide(normalizedIndex);
              }}
              afterChange={(index) => {
                const normalizedIndex = index % features.length;
                setCurrentMobileSlide(normalizedIndex);
                setCurrentSlide(normalizedIndex + features.length);
              }}
              responsive={[
                {
                  breakpoint: 480,
                  settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    swipeToSlide: true,
                    touchThreshold: 8,
                  }
                }
              ]}
            >
              {features.map((feature) => (
                <div key={feature.id} className="px-2">
                  <div className="bg-white rounded-[20px] overflow-hidden shadow-lg">
                    <div className="w-full h-full max-h-[40vh] flex items-center justify-center rounded-[18px]">
                      {getIllustration(feature.illustration)}
                    </div>
                    <div className="p-6 text-center">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
            
            {/* Swipe Indicator */}
            <div className="flex justify-between items-center mt-4 px-6">
              {/* Left swipe hint */}
              <div 
                className={`flex items-center space-x-2 transition-opacity duration-300 cursor-pointer ${
                  currentMobileSlide > 0 ? 'opacity-70 hover:opacity-100' : 'opacity-30'
                }`}
                onClick={() => {
                  if (currentMobileSlide > 0 && mobileSliderRef.current) {
                    mobileSliderRef.current.slickPrev();
                  }
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-600"
                >
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs text-gray-600 font-medium">Swipe</span>
              </div>

              {/* Progress indicators */}
              <div className="flex items-center space-x-1">
                {features.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                      index === currentMobileSlide
                        ? 'w-8 bg-gray-900'
                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                    }`}
                    onClick={() => {
                      if (mobileSliderRef.current) {
                        mobileSliderRef.current.slickGoTo(index);
                      }
                    }}
                  />
                ))}
              </div>

              {/* Right swipe hint */}
              <div 
                className={`flex items-center space-x-2 transition-opacity duration-300 cursor-pointer ${
                  currentMobileSlide < features.length - 1 ? 'opacity-70 hover:opacity-100' : 'opacity-30'
                }`}
                onClick={() => {
                  if (currentMobileSlide < features.length - 1 && mobileSliderRef.current) {
                    mobileSliderRef.current.slickNext();
                  }
                }}
              >
                <span className="text-xs text-gray-600 font-medium">Swipe</span>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-gray-600"
                >
                  <path
                    d="M9 18l6-6-6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop View - Horizontal Slider with Swipe & Indicators */}
        <div className="hidden md:block relative py-8 space-y-6">
          <div 
            className="relative overflow-hidden pb-10 cursor-grab active:cursor-grabbing select-none"
            onTouchStart={handleDesktopTouchStart}
            onTouchMove={handleDesktopTouchMove}
            onTouchEnd={handleDesktopTouchEnd}
            onMouseDown={handleDesktopMouseDown}
            onMouseMove={handleDesktopMouseMove}
            onMouseUp={handleDesktopMouseUp}
            onMouseLeave={handleDesktopMouseUp}
          >
            {/* Left Glass Effect Overlay */}
            <div className="absolute left-0  w-32 xl:w-44 h-[82%] top-10 z-10 pointer-events-none">
              <div
                className="absolute inset-0 w-full h-full backdrop-blur-[10px] backdrop-saturate-[1.8] backdrop-brightness-[1]"
                style={{
                  background: `
                    linear-gradient(90deg, 
                      rgba(255,255,255,0.05) 0%,
                      rgba(255,255,255,0.03) 20%,
                      rgba(255,255,255,0.01) 40%,
                      transparent 60%
                    )
                  `,
                  maskImage: 'linear-gradient(to right, black 0%, black 60%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to right, black 0%, black 60%, transparent 100%)'
                }}
              />
            </div>
            {/* Right Glass Effect Overlay */}
            <div className="absolute right-0 top-10 w-32 xl:w-44 h-[82%] z-10 pointer-events-none">
              <div
                className="absolute inset-0 w-full h-full backdrop-blur-[10px] backdrop-saturate-[1.8] backdrop-brightness-[1]"
                style={{
                  background: `
                    linear-gradient(270deg, 
                      rgba(255,255,255,0.05) 0%,
                      rgba(255,255,255,0.03) 20%,
                      rgba(255,255,255,0.01) 40%,
                      transparent 60%
                    )
                  `,
                  maskImage: 'linear-gradient(to left, black 0%, black 60%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to left, black 0%, black 60%, transparent 100%)'
                }}
              />
            </div>

            {/* Slider Container */}
            <div
              ref={sliderRef}
              className="flex gap-6 will-change-transform"
              style={transformStyle}
            >
              {infiniteFeatures.map((feature, index) => {
                const isCenter = index === currentSlide;
                const distance = Math.abs(index - currentSlide);

                return (
                  <FeatureCard
                    key={`${feature.id}-${index}`}
                    feature={feature}
                    isCenter={isCenter}
                    distance={distance}
                    onClick={() => debouncedSlideClick(index)}
                  />
                );
              })}
            </div>

            
          </div>

          {/* Desktop Swipe Indicators */}
          <div className="flex justify-between items-center mt-8 px-8">
            {/* Left swipe hint */}
            <div 
              className={`flex items-center space-x-3 transition-opacity duration-300 cursor-pointer ${
                getFeatureIndex(currentSlide) > 0 ? 'opacity-70 hover:opacity-100' : 'opacity-30'
              }`}
              onClick={handlePrev}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                className="text-gray-600"
              >
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm text-gray-600 font-medium">Swipe or Drag</span>
            </div>

            {/* Progress indicators */}
            <div className="flex items-center space-x-2">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`h-3 rounded-full transition-all duration-300 cursor-pointer hover:scale-110 ${
                    getFeatureIndex(currentSlide) === index
                      ? 'w-10 bg-gray-900 shadow-lg'
                      : 'w-3 bg-gray-300 hover:bg-gray-500'
                  }`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>

            {/* Right swipe hint */}
            <div 
              className={`flex items-center space-x-3 transition-opacity duration-300 cursor-pointer ${
                getFeatureIndex(currentSlide) < features.length - 1 ? 'opacity-70 hover:opacity-100' : 'opacity-30'
              }`}
              onClick={handleNext}
            >
              <span className="text-sm text-gray-600 font-medium">Swipe or Drag</span>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                className="text-gray-600"
              >
                <path
                  d="M9 18l6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Desktop Gesture Hint */}
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">
              💡 Click cards to navigate • Swipe or drag to browse • Use arrow keys
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
