"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import * as React from "react";
import { cn } from "../lib/utils";

// Array of "Hello" in different languages with optimized sizing
const greetings = [
  { text: "Hello", language: "English" },
  { text: "Hola", language: "Spanish" },
  { text: "Bonjour", language: "French" },
  { text: "Hallo", language: "German" },
  { text: "Ciao", language: "Italian" },
  { text: "Olá", language: "Portuguese" },
  { text: "नमस्ते", language: "Hindi" },

  //   { text: "Привет", language: "Russian" },
  //   { text: "你好", language: "Chinese" },
  //   { text: "السلام عليكم", language: "Arabic" },
];

// StaggeredFade Animation Component for Main Words
type TextStaggeredFadeProps = {
  text: string;
  className?: string;
};

export const StaggeredFade: React.FC<TextStaggeredFadeProps> = ({
  text,
  className = "",
}) => {
  const variants = {
    hidden: { opacity: 0 },
    show: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: { delay: i * 0.15, duration: 0.8 },
    }),
  };

  // Special handling for complex scripts like Hindi
  const isHindi = /[\u0900-\u097F]/.test(text);
  const isArabic = /[\u0600-\u06FF]/.test(text);
  const isChinese = /[\u4E00-\u9FFF]/.test(text);

  let letters;
  if (isHindi || isArabic || isChinese) {
    // For complex scripts, animate the whole word to preserve character integrity
    letters = [text];
  } else {
    // For Latin scripts, use character-by-character animation
    letters = Array.from(text);
  }

  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "show" : ""}
      variants={variants}
      viewport={{ once: true }}
      className={cn(className)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        margin: 0,
        padding: 0,
        lineHeight: 1,
      }}
    >
      {letters.map((letter, i) => (
        <motion.span key={`${letter}-${i}`} variants={variants} custom={i}>
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

// Main TextAnimations Component with Multi-language Support
interface TextAnimationsProps {
  isMobile?: boolean;
  className?: string;
}

export function TextAnimations({
  isMobile = false,
  className = "",
}: TextAnimationsProps) {
  const [currentLanguageIndex, setCurrentLanguageIndex] = React.useState(0);
  const [displayText, setDisplayText] = React.useState("Hello");
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Multi-language fade animation with optimized timing
  React.useEffect(() => {
    if (!isMounted) return;

    // Set the current text immediately
    const currentGreeting = greetings[currentLanguageIndex];
    setDisplayText(currentGreeting.text);

    // Change to next language after 4 seconds
    const timeout = setTimeout(() => {
      setCurrentLanguageIndex((prev) => (prev + 1) % greetings.length);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [isMounted, currentLanguageIndex]);

  // Dynamic text size based on text length
  const getTextSize = (text: string, isMobile: boolean) => {
    const textLength = text.length;

    if (isMobile) {
      // Mobile sizes - optimized for readability
      if (textLength <= 5) return "text-[120px]"; // Short text like "Hello", "Ciao"
      if (textLength <= 8) return "text-[80px]"; // Medium text like "Bonjour", "Привет"
      if (textLength <= 12) return "text-[60px]"; // Long text like "こんにちは", "नमस्ते"
      return "text-[50px]"; // Very long text like "السلام عليكم"
    } else {
      // Desktop sizes - responsive and scalable
      if (textLength <= 5) return "text-[clamp(7rem,12vw,12rem)]"; // Short text
      if (textLength <= 8) return "text-[clamp(5rem,10vw,10rem)]"; // Medium text
      if (textLength <= 12) return "text-[clamp(4rem,8vw,8rem)]"; // Long text
      return "text-[clamp(3rem,6vw,6rem)]"; // Very long text
    }
  };

  const textSizeClass = getTextSize(displayText, isMobile);

  return (
    <div className="relative inline-block">
      <AnimatePresence mode="wait">
        <div key={currentLanguageIndex}>
          <StaggeredFade
            text={displayText}
            className={cn(
              "font-light text-[#333333] leading-none whitespace-nowrap m-0 p-0",
              textSizeClass,
              className
            )}
          />
        </div>
      </AnimatePresence>
    </div>
  );
}

// Export both components
export default TextAnimations;
