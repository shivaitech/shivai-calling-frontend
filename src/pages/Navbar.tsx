import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import Logo from "../resources/images/ShivaiLogo.svg";
import bar from "../resources/images/appMenu.svg";

interface NavbarProps {
  setAuthMode?: (mode: "signin" | "signup") => void;
  setShowAuthModal?: (show: boolean) => void;
  showMobileMenu?: boolean;
  setShowMobileMenu?: (show: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  setAuthMode,
  setShowAuthModal,
  showMobileMenu,
  setShowMobileMenu,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigationItems = ["Demo", "Features", "Pricing", "Contact Us"];

  // Enhanced smooth scroll function with easing and specific demo targeting
  const smoothScrollToSection = (sectionId: string) => {
    try {
      let targetElement = document.getElementById(sectionId);

      // For demo section, target the specific demo content for better visual positioning
      if (sectionId === "demo") {
        const demoContent = document.getElementById("demo-content");
        if (demoContent) {
          targetElement = demoContent;
        }
      } else if (sectionId === "features") {
        const featuresContent = document.getElementById("work-content");
        if (featuresContent) {
          targetElement = featuresContent;
        }
      } else if (sectionId === "pricing") {
        const pricingContent = document.getElementById("pricing-content");
        if (pricingContent) {
          targetElement = pricingContent;
        }
      }
      // If "contact us" is clicked, scroll to footer and show it if hidden
      if (sectionId === "contact us") {
        const footer = document.getElementById("footer");
        if (footer) {
          footer.style.display = "block";
          targetElement = footer;
        }
      }

      // Fallback to basic scroll if element not found
      if (!targetElement) {
        console.warn(`Section with id "${sectionId}" not found`);
        return;
      }

      if (targetElement) {
        const navbarHeight = 80;
        let additionalOffset = 60; // Default offset

        if (sectionId === "demo") {
          additionalOffset = 35; // Reduced offset for demo for better positioning
        } else if (sectionId === "pricing") {
          additionalOffset = 30;
        } else if (sectionId === "features") {
          additionalOffset = 30;
        }

        const targetPosition =
          targetElement.offsetTop - navbarHeight - additionalOffset;

        // Enhanced smooth scrolling with custom easing
        const startPosition = window.pageYOffset;
        const distance = Math.max(0, targetPosition) - startPosition;
        const duration = Math.min(1200, Math.abs(distance) * 0.5); // Dynamic duration based on distance
        let startTime: number | null = null;

        const easeInOutCubic = (t: number): number => {
          return t < 0.5
            ? 4 * t * t * t
            : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        };

        const animation = (currentTime: number) => {
          if (startTime === null) startTime = currentTime;
          const timeElapsed = currentTime - startTime;
          const progress = Math.min(timeElapsed / duration, 1);
          const easedProgress = easeInOutCubic(progress);

          window.scrollTo(0, startPosition + distance * easedProgress);

          if (progress < 1) {
            requestAnimationFrame(animation);
          }
        };

        requestAnimationFrame(animation);
      }
    } catch (error) {
      console.error("Error during smooth scroll:", error);
      // Fallback to basic scroll
      const targetElement = document.getElementById(sectionId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const handleNavClick = (item: string, event: React.MouseEvent) => {
    event.preventDefault();
    const sectionId = item.toLowerCase();

    // Add a subtle visual feedback
    const target = event.currentTarget as HTMLElement;
    target.style.transform = "scale(0.95)";
    setTimeout(() => {
      target.style.transform = "scale(1)";
    }, 150);

    smoothScrollToSection(sectionId);

    // Close mobile menu if it's open
    if (setShowMobileMenu && showMobileMenu) {
      setShowMobileMenu(false);
    } else if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledHandleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", throttledHandleScroll);
    };
  }, []);

  return (
    <div className="relative">
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-50  ${
          scrolled
            ? "backdrop-blur-md shadow-md"
            : "backdrop-blur-sm bg-[#F0F0F0]"
        }`}
      >
        <div className=" mx-auto px-6 sm:px-8 lg:px-8 py-2.5 sm:py-3 lg:py-4">
          <div className="flex items-center justify-between h-10 sm:h-12 lg:h-14">
            {/* Logo */}
            <motion.div
              onClick={() => {
                window.location.href = "/";
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center flex-shrink-0"
            >
              <img
                src={Logo}
                alt="ShivAi Logo"
                className="h-6 w-auto  lg:h-8 xl:h-10"
              />
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-start space-x-6 xl:space-x-8">
              {navigationItems.map((item, index) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={(e) => handleNavClick(item, e)}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className="text-[#828282] hover:text-[#333333] transition-colors duration-300 text-base lg:text-lg font-normal relative group cursor-pointer"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#333333] transition-all duration-300 group-hover:w-full"></span>
                </motion.a>
              ))}
            </div>

            {/* Desktop Sign In Button */}
            <div className="hidden lg:flex items-center">
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (setAuthMode && setShowAuthModal) {
                    setAuthMode("signin");
                    setShowAuthModal(true);
                  }
                }}
                className="flex items-center space-x-2 text-[#333333] hover:text-[#000000] transition-colors duration-300 text-base lg:text-lg font-normal border-b border-[#cfcfcf] pb-0.5 hover:border-[#333333]"
              >
                <span>Sign In</span>
                <ArrowUpRight className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              onClick={() => {
                if (setShowMobileMenu && showMobileMenu !== undefined) {
                  setShowMobileMenu(!showMobileMenu);
                } else {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }
              }}
              className="lg:hidden p-1.5 -mr-1.5 rounded-lg text-[#333333] hover:text-[#000000] hover:bg-gray-50 transition-all duration-300 flex-shrink-0 touch-manipulation"
              aria-label="Toggle mobile menu"
            >
              {(
                showMobileMenu !== undefined ? showMobileMenu : isMobileMenuOpen
              ) ? (
                <X className="w-5 h-5" />
              ) : (
                <img
                  src={bar}
                  alt="Menu"
                  className="w-5 h-[24px] object-contain"
                />
              )}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {(showMobileMenu !== undefined ? showMobileMenu : isMobileMenuOpen) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed top-[3rem] sm:top-[3.5rem] left-0 right-0 bg-white/98 backdrop-blur-sm border-b border-[#828282]/20 z-40 shadow-lg"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
              <div className="space-y-0.5">
                {navigationItems?.map((item, index) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="block text-[#828282] hover:text-[#333333] active:text-[#000000] transition-colors duration-300 text-base font-medium py-2 px-2 rounded-lg hover:bg-gray-50 touch-manipulation cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item, e);
                      if (setShowMobileMenu) {
                        setShowMobileMenu(false);
                      } else {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                  >
                    {item}
                  </motion.a>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="pt-2 mt-2 border-t border-[#828282]/10 "
              >
                <motion.button
                  onClick={() => {
                    if (setAuthMode && setShowAuthModal) {
                      setAuthMode("signin");
                      setShowAuthModal(true);
                    }
                    if (setShowMobileMenu) {
                      setShowMobileMenu(false);
                    } else {
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className="flex w-auto  items-center space-x-2 bg-[#333333] text-white hover:text-[#000000] active:text-black transition-colors duration-300 text-base font-medium py-2 px-6 rounded-lg hover:bg-gray-50 touch-manipulation "
                >
                  <span>Sign In</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from being hidden behind fixed navbar */}
    </div>
  );
};

export default Navbar;
