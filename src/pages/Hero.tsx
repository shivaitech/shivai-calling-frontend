"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import HeroImage from "../resources/images/HeroAI.svg";

interface HeroProps {
  setAuthMode?: (mode: "signin" | "signup") => void;
  setShowAuthModal?: (show: boolean) => void;
}

const Hero: React.FC<HeroProps> = ({ setAuthMode, setShowAuthModal }) => {
  const [isMounted, setIsMounted] = useState(false);
  const { scrollY } = useScroll();

  // Parallax effects
  const yText = useTransform(scrollY, [0, 300], [0, -50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  useEffect(() => {
    setIsMounted(true);
  }, []); // Animation variants with proper typing

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
    <div className="min-h-[90vh] bg-gray-50 overflow-hidden relative">
      <div className="relative px-4 sm:px-6 lg:px-8">
        {/* Left vertical divider and label (desktop) */}
        <div className="hidden lg:block absolute left-20 top-28 bottom-24">
          <div className="w-px h-[45vh] bg-[#d1d1d1] relative top-[29%]" />
          <div className="absolute -left-[74px] -top-5 -rotate-90">
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
        {/* Main Content */}
        <motion.div
          // style={{ y: yText, opacity }}
          className="relative z-10 pt-4 sm:pt-6 lg:pt-6"
        >
          <div className="max-w-7xl mx-auto">
            {/* Mobile Layout */}
            <div className="lg:hidden relative min-h-[80vh] ">
              {/* Left vertical sidebar text */}
              <div className="absolute left-2 top-0 bottom-0 w-6">
                <div className="h-full flex gap-4 flex-col justify-center">
                  <div className="w-px h-[30vh] bg-[#d1d1d1] relative left-5 -top-[2%]" />

                  <div className="absolute -left-12 top-24 -rotate-90 origin-center">
                    <span className="text-xs text-[#888] tracking-[0.15em] font-light whitespace-nowrap">
                      AI Voice teammates
                    </span>
                  </div>
                  <div className="absolute left-0 top-[70%] -rotate-90 origin-center">
                    <span className="text-xs text-[#888] tracking-[0.15em] font-light whitespace-nowrap">
                      2025
                    </span>
                  </div>
                </div>
              </div>

              {/* Main content area */}
              <div className="ml-12 pt-8 pb-8 ">
                {/* Statistics - Mobile */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex gap-12 mb-2 justify-center"
                >
                  <motion.div variants={statsVariants} className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        duration: 1,
                        delay: 0.8,
                        type: "spring",
                        stiffness: 100,
                      }}
                      className="text-2xl font-light text-[#333] mb-1"
                    >
                      +1M
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="text-xs text-[#666] leading-tight"
                    >
                      Conversations
                      <br />
                      Powered
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
                      className="text-2xl font-light text-[#333] mb-1"
                    >
                      +100
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="text-xs text-[#666] leading-tight"
                    >
                      Industries
                      <br />
                      Usable
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Main Heading with dotted border - Mobile */}
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  className="mb-6 text-center relative"
                >
                  <div className=" p-4 mb-2 inline-block">
                    <motion.h1
                      className="font-normal text-[#333] tracking-tight leading-none text-[5.5rem]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1.2, delay: 0.6 }}
                    >
                      <motion.span
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{
                          duration: 0.8,
                          delay: 0.8,
                          ease: "easeOut",
                        }}
                        className="block"
                      >
                        Hello
                      </motion.span>
                    </motion.h1>
                  </div>

                  <motion.p
                    variants={itemVariants}
                    className=" relative text-xs text-[#666] font-normal leading-relaxed w-[80vw] -top-4"
                  >
                    —ShivAI: your first AI employee Sell,
                    <br />
                    Support, Book, 24/7.
                  </motion.p>
                </motion.div>

                <motion.div
                  className="absolute -left-[26%] w-[125vw] mx-auto top-[39dvh] border-t border-white opacity-90"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <img
                    src={HeroImage}
                    alt="Professional AI Assistant"
                    className=" w-[600px]"
                  />
                </motion.div>

                {/* <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                  className="flex justify-center"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (setAuthMode && setShowAuthModal) {
                        setAuthMode("signup");
                        setShowAuthModal(true);
                      }
                    }}
                    className="bg-blue-600 text-white px-12 py-3.5 rounded-full text-base font-medium shadow-lg hover:bg-blue-700 transition-all duration-300"
                  >
                    Start a Free Trial
                  </motion.button>
                </motion.div> */}
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid grid-cols-2 gap-16 items-center min-h-[70vh] lg:px-10 px-2 xl:px-14  2xl:px-0 ">
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
                  <motion.h1
                    className="font-normal text-[#333333] tracking-[-0.04em] leading-[0.85] text-[clamp(6rem,12vw,12rem)] mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.2, delay: 0.6 }}
                  >
                    <motion.span
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        duration: 0.8,
                        delay: 0.8,
                        ease: "easeOut",
                      }}
                      className="block"
                    >
                      Hello
                    </motion.span>
                  </motion.h1>

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
                <div className="absolute top-0 lg:top-20 xl:top-2 w-[60vw] max-w-[80vw] -right-10 ">
                  <motion.div
                    className="relative overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <img
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
