"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import HeroImage from "../resources/images/HeroAI.svg";
import HeroImage2 from "../resources/images/HeroChar.png";
import RightArrow from "../resources/images/rightArr.svg";
import { TextAnimations } from "../components/TextAnimations";
interface HeroProps {
  setAuthMode?: (mode: "signin" | "signup") => void;
  setShowAuthModal?: (show: boolean) => void;
}

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = "", 
  placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3C/svg%3E"
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let observer: IntersectionObserver;
    
    if (imageRef && imageSrc === placeholder) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imageRef);
            }
          });
        },
        { threshold: 0.1, rootMargin: '50px' }
      );
      observer.observe(imageRef);
    }

    return () => {
      if (observer && imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, imageSrc, placeholder, src]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={`transition-all duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      decoding="async"
    />
  );
};

const Hero: React.FC<HeroProps> = ({ setAuthMode, setShowAuthModal }) => {
  const [isMounted, setIsMounted] = useState(false);



  useEffect(() => {
    setIsMounted(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.6,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  };

  const statsVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1,
        ease: "easeOut" as const,
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 1.1 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut" as const,
      },
    },
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen lg:min-h-screen sm:min-h-[80vh] bg-[#F0F0F0] overflow-hidden relative mb-8 sm:mb-2 mt-14">
      <div className="relative px-4 sm:px-6 lg:px-8">
        <div className="hidden lg:block absolute left-20 top-28 bottom-24">
          <div className="w-px h-[42vh] bg-[#d1d1d1] relative top-[28%]" />
          <div className="absolute -left-[83px] -top-2 -rotate-90">
            <span className="text-xs text-[#828282]  tracking-[0.2em] font-normal whitespace-nowrap">
              AI Voice teammates
            </span>
          </div>
          <div className="absolute -left-[20px] top-[60vh] -rotate-90">
            <span className="text-xs text-[#828282]  tracking-[0.2em] font-normal whitespace-nowrap">
              2025
            </span>
          </div>
        </div>

        <motion.div
          className="relative z-10 pt-1 sm:pt-4 lg:pt-6"
        >
          <div className="max-w-7xl mx-auto">
            <div className="lg:hidden md:hidden relative min-h-[80vh] ">
              {/* Left vertical sidebar text */}
              <div className="absolute left-0 top-0 bottom-0 w-6">
                <div className="h-full flex gap-4 flex-col justify-center">
                  <div className="w-px h-[30vh] bg-[#d1d1d1] relative left-[20px] -top-[1%]" />

                  <div className="absolute -left-[57px] top-[87px] -rotate-90 origin-center">
                    <span className="text-xs text-[#828282] tracking-[0.15em] font-light whitespace-nowrap">
                      AI Voice teammates
                    </span>
                  </div>

                  <div className="absolute left-0 top-[70%] -rotate-90 origin-center">
                    <span className="text-xs text-[#828282] tracking-[0.15em] font-light whitespace-nowrap">
                      2025
                    </span>
                  </div>
                </div>
              </div>

              {/* Main content area */}
              <div className="relative  min-h-[80vh] ">
                <div className="ml-14 pt-8 pb-8  px-2">
                  {/* Statistics - Mobile */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex gap-8 mb-2 justify-start"
                  >
                    <motion.div
                      variants={statsVariants}
                      className="text-start relative -left-[6px]"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          duration: 1,
                          delay: 0.8,
                          type: "spring",
                          stiffness: 100,
                        }}
                        className="text-3xl font-extralight text-[#333] mb-1"
                      >
                        +1M
                      </motion.div>
                      <motion.div
                        variants={itemVariants}
                        className="text-[11px] text-[#666]  text-nowrap font-extralight relative -top-2 left-[15px]"
                      >
                        Conversations Powered
                      </motion.div>
                    </motion.div>

                    <motion.div variants={statsVariants} className="text-left">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          duration: 1,
                          delay: 1,
                          type: "spring",
                          stiffness: 100,
                        }}
                        className="text-3xl font-extralight text-[#333] mb-1"
                      >
                        +100
                      </motion.div>
                      <motion.div
                        variants={itemVariants}
                        className="text-[11px] text-[#666]  text-nowrap font-extralight relative -top-2 left-[15.5px]"
                      >
                        Industries Usable
                      </motion.div>
                    </motion.div>
                  </motion.div>

                  {/* Main Heading with dotted border - Mobile */}
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mb-6 text-start relative"
                  >
                    <div className="mb-2 inline-block ml-1 mt-2">
                      <TextAnimations isMobile={true} />
                    </div>

                    <motion.p
                      variants={itemVariants}
                      className="left-2 relative text-[11px] text-[#333333] font-normal leading-relaxed w-[80vw] -top-2"
                    >
                      ShivAI: your first AI employee Sell, Support, Book, 24/7.
                    </motion.p>
                  </motion.div>
                </div>

                <motion.div
                  className="absolute -left-[44%] w-[140vw]  mx-auto border-none opacity-100 bottom-0"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <img
                    src={HeroImage2}
                    alt={""}
                    className=" w-[700px] "
                  />
                  <div className="w-[320px] mx-auto absolute left-[32vw] right-0 bottom-0 mb-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 1.2 }}
                      className="mt-8 px-2 "
                    >
                      <div className="bg-white/98 backdrop-blur-sm rounded-full p-2 border border-white/20 shadow-2xl">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              if (setAuthMode && setShowAuthModal) {
                                setAuthMode("signup");
                                setShowAuthModal(true);
                              }
                            }}
                            className="text-[14px] flex items-center justify-center gap-2 bg-white text-[#333333] px-8 py-2 rounded-full  font-medium shadow-lg hover:bg-[#1d4ed8] transition-all duration-300 "
                          >
                            <span>Try it now</span>
                            <div className="flex gap-1">
                              <LazyImage
                                src={RightArrow}
                                alt="Right Arrow"
                                className="w-3 h-3"
                              />
                            </div>
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              if (setAuthMode && setShowAuthModal) {
                                setAuthMode("signin");
                                setShowAuthModal(true);
                              }
                            }}
                            className=" text-[14px] flex items-center justify-center bg-white text-[#333] px-2 py-1 rounded-full  font-medium hover:bg-gray-50 transition-all duration-300 flex-1"
                          >
                            Get Started
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Medium Screen Layout (Tablet) */}
            <div className="hidden md:block lg:hidden relative min-h-[85vh]">
              {/* Left vertical sidebar text for medium screens */}
              <div className="absolute left-0 top-0 bottom-0 w-8">
                <div className="h-full flex gap-4 flex-col justify-center">
                  <div className="w-px h-[35vh] bg-[#d1d1d1] relative left-[24px] top-[5%]" />

                  <div className="absolute -left-[60px] top-32 -rotate-90 origin-center">
                    <span className="text-sm text-[#828282] tracking-[0.15em] font-light whitespace-nowrap">
                      AI Voice teammates
                    </span>
                  </div>

                  <div className="absolute -left-[8px] top-[75%] -rotate-90 origin-center">
                    <span className="text-sm text-[#828282] tracking-[0.15em] font-light whitespace-nowrap">
                      2025
                    </span>
                  </div>
                </div>
              </div>

              {/* Main content area for medium screens */}
              <div className="rela
              tive min-h-[85vh] flex flex-col">
                <div className="ml-20 pt-12 pb-8 px-4 flex-1">
                  {/* Statistics - Medium */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex gap-12 mb-6 justify-start"
                  >
                    <motion.div variants={statsVariants} className="text-start">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          duration: 1,
                          delay: 0.8,
                          type: "spring",
                          stiffness: 100,
                        }}
                        className="text-4xl font-extralight text-[#333] mb-2"
                      >
                        +1M
                      </motion.div>
                      <motion.div
                        variants={itemVariants}
                        className="text-sm text-[#666] font-extralight"
                      >
                        Conversations Powered
                      </motion.div>
                    </motion.div>

                    <motion.div variants={statsVariants} className="text-left">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          duration: 1,
                          delay: 1,
                          type: "spring",
                          stiffness: 100,
                        }}
                        className="text-4xl font-extralight text-[#333] mb-2"
                      >
                        +100
                      </motion.div>
                      <motion.div
                        variants={itemVariants}
                        className="text-sm text-[#666] font-extralight"
                      >
                        Industries Usable
                      </motion.div>
                    </motion.div>
                  </motion.div>

                  {/* Main Heading - Medium */}
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mb-8 text-start relative"
                  >
                    <div className="mb-4 inline-block">
                      <TextAnimations isMobile={false} />
                    </div>

                    <motion.p
                      variants={itemVariants}
                      className="text-base text-[#333333] font-normal leading-relaxed max-w-2xl"
                    >
                      ShivAI: your first AI employee Sell, Support, Book, 24/7.
                    </motion.p>
                  </motion.div>

                
                </div>

                {/* Hero Image for medium screens */}
                <motion.div
                  className="absolute -right-[10%] w-[70vw] bottom-0"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <LazyImage
                    src={HeroImage2}
                    alt="Professional AI Assistant"
                    className="w-full h-auto"
                  />
                </motion.div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid  grid-cols-2 gap-16 items-center min-h-[80vh] lg:px-10 px-2 xl:px-14  2xl:px-0 w-[100vw] overflow-hidden">
              {/* Left Column - Desktop */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-12"
              >
                {/* Statistics - Desktop */}
                <motion.div
                  variants={containerVariants}
                  className="flex gap-8 ml-16"
                >
                  <motion.div variants={statsVariants} className="text-left">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        duration: 1,
                        delay: 0.8,
                        type: "spring",
                        stiffness: 100,
                      }}
                      className="text-3xl xl:text-4xl font-normal text-[#333333] mb-2"
                    >
                      +1M
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="text-sm text-[#828282] tracking-wide"
                    >
                      Conversations Powered
                    </motion.div>
                  </motion.div>

                  <motion.div variants={statsVariants} className="text-left">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        duration: 1,
                        delay: 1,
                        type: "spring",
                        stiffness: 100,
                      }}
                      className="text-3xl xl:text-4xl font-normal text-[#333333] mb-2"
                    >
                      +100
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="text-sm text-[#828282] tracking-wide"
                    >
                      Industries Usable
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Main Heading - Desktop */}
                <motion.div variants={itemVariants} className="ml-16 text-left">
                  <div className="mb-6">
                    <TextAnimations isMobile={false} />
                  </div>

                  <motion.p
                    variants={itemVariants}
                    className="text-lg text-[#828282] font-semibold max-w-md leading-relaxed text-nowrap"
                  >
                    — ShivAI: your first AI employee Sell, Support, Book, 24/7.
                  </motion.p>
                </motion.div>
              </motion.div>

              {/* Right Column - Image Desktop */}
              <motion.div
                // style={{ y: yImage }}
                variants={imageVariants}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="flex"
              >
                <div className="absolute -bottom- xl:-bottom-30 w-[70vw] max-w-[80vw] md:-bottom-20 md:w-[58vw] -right-5 ">
                  <motion.div
                    className="relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <LazyImage
                      src={HeroImage}
                      alt="Professional AI Assistant"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Scroll Indicator (bottom-left) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.6 }}
              className="hidden lg:block absolute left-28 -bottom-10"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }} 
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex items-center gap-2 text-[#828282] cursor-pointer hover:text-[#333333] transition-colors duration-300"
              >
                <span className="text-sm tracking-wide">Scroll Down</span>
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
