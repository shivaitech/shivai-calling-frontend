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
  const navigationItems = ["Demo", "Features", "Pricing", "Customers"];

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative">
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={`fixed top-0 left-0 right-0 z-50  ${
          scrolled ? "backdrop-blur-md shadow-md" : "backdrop-blur-sm bg-[#F0F0F0]"
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
                className="h-5 w-auto sm:h-[22px] lg:h-8 xl:h-10"
              />
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-start space-x-6 xl:space-x-8">
              {navigationItems.map((item, index) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className="text-[#828282] hover:text-[#333333] transition-colors duration-300 text-base lg:text-lg font-normal relative group"
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
                {navigationItems.map((item, index) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="block text-[#828282] hover:text-[#333333] active:text-[#000000] transition-colors duration-300 text-base font-medium py-2 px-2 rounded-lg hover:bg-gray-50 touch-manipulation"
                    onClick={() => {
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
                className="pt-2 mt-2 border-t border-[#828282]/10"
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
                  className="flex items-center space-x-2 text-[#333333] hover:text-[#000000] active:text-black transition-colors duration-300 text-base font-medium py-2 px-2 rounded-lg hover:bg-gray-50 touch-manipulation w-full"
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
