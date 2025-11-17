import React from "react";
import Shivlogo from "../resources/images/LogoFooter.svg";
import ShivAi from "../resources/images/ShivaiLogo.svg";
import twitterIcon from "../resources/Icon/twitter.svg";
import fbIcon from "../resources/Icon/fb.svg";
import instaIcon from "../resources/Icon/insta.svg";
import linkedinIcon from "../resources/Icon/linkin.svg";
import uaeFlag from "../resources/Icon/uae-flag.svg";
import indiaFlag from "../resources/Icon/india-flag.svg";
import usaFlag from "../resources/Icon/usa-flag.svg";

const Footer = () => {
  // Enhanced smooth scroll function (same as navbar)
  const smoothScrollToSection = (sectionId: string) => {
    try {
      let targetElement = document.getElementById(sectionId);

      if (sectionId === "features") {
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

      if (!targetElement) {
        return;
      }

      if (targetElement) {
        const navbarHeight = 80;
        let additionalOffset = 60; // Default offset

        if (sectionId === "pricing") {
          additionalOffset = 100; // Increased offset for pricing to prevent going too far up
        } else if (sectionId === "features") {
          additionalOffset = 20;
        }

        const targetPosition =
          targetElement.offsetTop - navbarHeight - additionalOffset;

        // Enhanced smooth scrolling with custom easing
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
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
      const targetElement = document.getElementById(sectionId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <footer className="relative bg-black text-white py-8 md:py-12 px-6 lg:px-20 xl:px-24 overflow-hidden h-auto ">
      {/* Main Content */}
      <div className="w-full mx-auto relative z-10 pr-4 md:pr-6">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-8 mb-8 md:mb-12 pt-0 lg:pt-8">
          {/* Logo and Description */}
          <div className="col-span-2 md:col-span-2">
            <div className="mb-3 md:mb-4">
              <img
                src={ShivAi}
                alt="ShivAI Logo"
                className="h-8 md:h-10 w-auto"
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <p className="text-[#ffffff]/60 text-[13px] md:text-[15px] lg:text-[18px] font-[400] leading-relaxed mt-2 md:mt-4">
                The leading voice AI platform for businesses worldwide.
              </p>
            </div>
            {/* Social Media Icons */}
            <div className="flex space-x-2 md:space-x-3">
              <a
                href="#"
                className="w-8 h-8 md:w-12 md:h-12 bg-black border border-gray-800 rounded-full p-1.5 md:p-3 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <img
                  src={twitterIcon}
                  alt="Twitter"
                  className="w-full h-full object-contain"
                />
              </a>
              <a
                href="#"
                className="w-8 h-8 md:w-12 md:h-12 bg-black border border-gray-800 rounded-full p-1.5 md:p-3 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <img
                  src={fbIcon}
                  alt="Facebook"
                  className="w-full h-full object-contain"
                />
              </a>
              <a
                href="#"
                className="w-8 h-8 md:w-12 md:h-12 bg-black border border-gray-800 rounded-full p-1.5 md:p-3 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <img
                  src={instaIcon}
                  alt="Instagram"
                  className="w-full h-full object-contain"
                />
              </a>
              <a
                href="#"
                className="w-8 h-8 md:w-12 md:h-12 bg-black border border-gray-800 rounded-full p-1.5 md:p-3 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <img
                  src={linkedinIcon}
                  alt="LinkedIn"
                  className="w-full h-full object-contain"
                />
              </a>
            </div>
          </div>

          {/* Combined Links Column */}
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-2">
            {/* Product Column */}
            <div>
              <h4 className="font-[400] text-white mb-2 md:mb-4 text-sm md:text-base">
                Product
              </h4>
              <ul className="space-y-1 md:space-y-2 font-[400] text-[14px] md:text-[16px] lg:text-sm text-[#FFFFFF99]/60">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      smoothScrollToSection("features");
                    }}
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      smoothScrollToSection("pricing");
                    }}
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="/api" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
                <li>
                  <a
                    href="/documentation"
                    className="hover:text-white transition-colors"
                  >
                    Documentation
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="font-[400] text-white mb-2 md:mb-4 text-sm md:text-base">
                Company
              </h4>
              <ul className="space-y-1 md:space-y-2 font-[400] text-[14px] md:text-[16px] lg:text-sm text-[#FFFFFF99]/60">
                <li>
                  <a
                    href="/about"
                    className="hover:text-white transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="/blog"
                    className="hover:text-white transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="/careers"
                    className="hover:text-white transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="font-[400] text-white mb-2 md:mb-4 text-sm md:text-base">
                Support
              </h4>
              <ul className="space-y-1 md:space-y-2 font-[400] text-[14px] md:text-[16px] lg:text-sm text-[#FFFFFF99]/60">
                <li>
                  <a
                    href="/help"
                    className="hover:text-white transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="/community"
                    className="hover:text-white transition-colors"
                  >
                    Community
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Office Locations Column */}
          <div className="relative -left-10 md:-left-0 lg:-left-10 xl:-left-10">
            <h4 className="font-[400] text-white mb-2 text-sm">Our Offices</h4>
            <div className="space-y-3 font-[400] text-[14px] lg:text-[14px] text-[#FFFFFF99]/60">
              {/* India Office */}
             

                <div className="bwhiteDarkGradient rounded-full px-4 py-3 hover:bg-gray-700/50 transition-colors">
                <a
                  href="https://wa.me/919211490707"
                  className="flex items-center justify-between w-full hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={indiaFlag}
                      alt="UAE Flag"
                      className="w-6 h-5 object-cover rounded-sm border border-gray-600 flag"
                    />
                    <div>
                      <div className="text-white text-sm font-medium">India</div>
                                         <div className="text-gray-300 text-xs">+91 921 149 0707</div>

                    </div>
                  </div>
                  <div className=" rounded-full p-2">
                    <img
                      src="/whatsapp.svg"
                      alt="WhatsApp"
                      className="w-4 h-4 object-contain whatsapp"
                    />
                  </div>
                </a>
              </div>

              {/* UAE Office */}
              <div className="bwhiteDarkGradient rounded-full px-4 py-3 hover:bg-gray-700/50 transition-colors">
                <a
                  href="https://wa.me/971566180707"
                  className="flex items-center justify-between w-full hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={uaeFlag}
                      alt="UAE Flag"
                      className="w-6 h-5 object-cover rounded-sm border border-gray-600 flag"
                    />
                    <div>
                      <div className="text-white text-sm font-medium">UAE</div>
                      <div className="text-gray-300 text-xs">+971 56 618 0707</div>
                    </div>
                  </div>
                  <div className=" rounded-full p-2">
                    <img
                      src="/whatsapp.svg"
                      alt="WhatsApp"
                      className="w-4 h-4 object-contain whatsapp"
                    />
                  </div>
                </a>
              </div>

              {/* USA Office */}
              <div className="bwhiteDarkGradient rounded-full px-4 py-3 hover:bg-gray-700/50 transition-colors">
                <a
                  href="https://wa.me/13154440707"
                  className="flex items-center justify-between w-full hover:text-white transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={usaFlag}
                      alt="USA Flag"
                      className="w-6 h-5 object-cover rounded-sm border border-gray-600 flag"
                    />
                    <div>
                      <div className="text-white text-sm font-medium">USA</div>
                      <div className="text-gray-300 text-xs">+1 315 444 0707</div>
                    </div>
                  </div>
                  <div className=" rounded-full p-2">
                    <img
                      src="/whatsapp.svg"
                      alt="WhatsApp"
                      className="w-4 h-4 object-contain whatsapp"
                    />
                  </div>
                </a>
              </div>
              <div className="text-[11px] mt-1">
                <span className="text-[#FFFFFF99]/60">Email us: </span>
                <a
                  href="mailto:hel</svg>lo@callshivai.com"
                  className="hover:text-white transition-colors"
                >
                  hello@callshivai.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-2 mb-0 lg:mb-10 mt-2 lg:mt-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm mb-2 md:mb-0">
            © 2025 ShivAI. All rights reserved.
          </p>
          <div className="flex items-center">
            <a
              href="#"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Back to top ↑
            </a>
          </div>
        </div>
      </div>

      {/* Large Background Logo */}
      <div className="relative px-4 -bottom-8 lg:-bottom-12 left-1/2 -translate-x-1/2 flex justify-center w-full opacity-110 pointer-events-none ">
        <img
          src={Shivlogo}
          alt="ShivAI Background"
          className="mx-auto w-[400px] md:w-[800px] lg:w-[1260px] xl:w-[1320px] object-contain relative -left-5"
        />
      </div>
    </footer>
  );
};

export default Footer;
