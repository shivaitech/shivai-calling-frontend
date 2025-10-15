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
        console.warn(`Section with id "${sectionId}" not found`);
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
      console.error("Error during smooth scroll:", error);
      // Fallback to basic scroll
      const targetElement = document.getElementById(sectionId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <footer className="relative bg-black text-white py-8 md:py-12 px-6 overflow-hidden h-auto lg:h-[110vh]">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 md:gap-8 mb-8 md:mb-12">
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
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
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
          <div className="">
            <h4 className="font-[400] text-white mb-2 text-sm">Our Offices</h4>
            <div className="space-y-4 font-[400] text-[14px] lg:text-[14px] text-[#FFFFFF99]/60">
              {/* India Office */}
              <div className="hover:text-white transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <img
                    src={indiaFlag}
                    alt="India Flag"
                    className="w-4 h-3 object-cover rounded-sm border border-gray-600"
                  />
                  <span className="text-[14px] md:text-[16px] lg:text-sm text-[#FFFFFF99]/60">
                    India
                  </span>
                  {"•"}
                  <a
                    href="https://wa.me/919211490707"
                    className=" hover:text-white transition-colors text-[11px] flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3 h-3 inline-block"
                      viewBox="0 0 32 32"
                      fill="#25D366"
                    >
                      <path d="M16 3C9.373 3 4 8.373 4 15c0 2.637.77 5.13 2.227 7.3L4 29l7.012-2.227A12.93 12.93 0 0016 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22.917c-2.25 0-4.45-.67-6.32-1.933l-.45-.287-4.167 1.325 1.367-4.067-.293-.47A10.93 10.93 0 015.083 15c0-6.033 4.884-10.917 10.917-10.917S26.917 8.967 26.917 15 22.033 25.917 16 25.917zm5.417-7.417c-.3-.15-1.767-.867-2.04-.967-.273-.1-.473-.15-.673.15-.2.3-.767.967-.94 1.167-.173.2-.347.225-.647.075-.3-.15-1.267-.467-2.417-1.483-.893-.797-1.497-1.783-1.673-2.083-.173-.3-.018-.462.13-.612.134-.133.3-.347.45-.52.15-.173.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.673-1.625-.92-2.225-.242-.583-.487-.5-.673-.508l-.573-.012c-.2 0-.525.075-.8.375-.273.3-1.04 1.017-1.04 2.483 0 1.467 1.067 2.883 1.217 3.083.15.2 2.103 3.217 5.1 4.383.713.275 1.267.438 1.7.562.713.227 1.362.195 1.875.118.573-.085 1.767-.722 2.017-1.42.25-.697.25-1.295.175-1.42-.075-.125-.273-.2-.573-.35z" />
                    </svg>
                    +91 921 149 0707
                  </a>
                </div>
                <div className="text-[11px] mt-1">
                  <span className="text-[#FFFFFF99]/60">Email us: </span>
                  <a
                    href="mailto:hello@callshivai.com"
                    className="hover:text-white transition-colors"
                  >
                    hello@callshivai.com
                  </a>
                </div>
              </div>

              {/* UAE Office */}
              <div className="hover:text-white transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <img
                    src={uaeFlag}
                    alt="UAE Flag"
                    className="w-4 h-3 object-cover rounded-sm border border-gray-600"
                  />
                  <span className="text-[14px] md:text-[16px] lg:text-sm text-[#FFFFFF99]/60">
                    UAE
                  </span>
                  {"•"}
                  <a
                    href="https://wa.me/971566180707"
                    className=" hover:text-white transition-colors text-[11px] flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3 h-3 inline-block"
                      viewBox="0 0 32 32"
                      fill="#25D366"
                    >
                      <path d="M16 3C9.373 3 4 8.373 4 15c0 2.637.77 5.13 2.227 7.3L4 29l7.012-2.227A12.93 12.93 0 0016 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22.917c-2.25 0-4.45-.67-6.32-1.933l-.45-.287-4.167 1.325 1.367-4.067-.293-.47A10.93 10.93 0 015.083 15c0-6.033 4.884-10.917 10.917-10.917S26.917 8.967 26.917 15 22.033 25.917 16 25.917zm5.417-7.417c-.3-.15-1.767-.867-2.04-.967-.273-.1-.473-.15-.673.15-.2.3-.767.967-.94 1.167-.173.2-.347.225-.647.075-.3-.15-1.267-.467-2.417-1.483-.893-.797-1.497-1.783-1.673-2.083-.173-.3-.018-.462.13-.612.134-.133.3-.347.45-.52.15-.173.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.673-1.625-.92-2.225-.242-.583-.487-.5-.673-.508l-.573-.012c-.2 0-.525.075-.8.375-.273.3-1.04 1.017-1.04 2.483 0 1.467 1.067 2.883 1.217 3.083.15.2 2.103 3.217 5.1 4.383.713.275 1.267.438 1.7.562.713.227 1.362.195 1.875.118.573-.085 1.767-.722 2.017-1.42.25-.697.25-1.295.175-1.42-.075-.125-.273-.2-.573-.35z" />
                    </svg>
                    +971 56 618 0707
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

              {/* USA Office */}
              <div className="hover:text-white transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <img
                    src={usaFlag}
                    alt="USA Flag"
                    className="w-4 h-3 object-cover rounded-sm border border-gray-600"
                  />
                  <span className="text-[14px] md:text-[16px] lg:text-sm text-[#FFFFFF99]/60">
                    USA
                  </span>
                  {"•"}
                  <a
                    href="https://wa.me/13154440707"
                    className=" hover:text-white transition-colors text-[11px] flex items-center gap-1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-3 h-3 inline-block"
                      viewBox="0 0 32 32"
                      fill="#25D366"
                    >
                      <path d="M16 3C9.373 3 4 8.373 4 15c0 2.637.77 5.13 2.227 7.3L4 29l7.012-2.227A12.93 12.93 0 0016 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22.917c-2.25 0-4.45-.67-6.32-1.933l-.45-.287-4.167 1.325 1.367-4.067-.293-.47A10.93 10.93 0 015.083 15c0-6.033 4.884-10.917 10.917-10.917S26.917 8.967 26.917 15 22.033 25.917 16 25.917zm5.417-7.417c-.3-.15-1.767-.867-2.04-.967-.273-.1-.473-.15-.673.15-.2.3-.767.967-.94 1.167-.173.2-.347.225-.647.075-.3-.15-1.267-.467-2.417-1.483-.893-.797-1.497-1.783-1.673-2.083-.173-.3-.018-.462.13-.612.134-.133.3-.347.45-.52.15-.173.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.673-1.625-.92-2.225-.242-.583-.487-.5-.673-.508l-.573-.012c-.2 0-.525.075-.8.375-.273.3-1.04 1.017-1.04 2.483 0 1.467 1.067 2.883 1.217 3.083.15.2 2.103 3.217 5.1 4.383.713.275 1.267.438 1.7.562.713.227 1.362.195 1.875.118.573-.085 1.767-.722 2.017-1.42.25-.697.25-1.295.175-1.42-.075-.125-.273-.2-.573-.35z" />
                    </svg>
                    +1 315 444 0707
                  </a>
                </div>
                <div className="text-[11px] mt-1">
                  <span className="text-[#FFFFFF99]/60">Email us: </span>
                  <a
                    href="mailto:hello@callshivai.com"
                    className="hover:text-white transition-colors"
                  >
                    hello@callshivai.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-2 mb-20 mt-2 lg:mt-8 border-t border-gray-800">
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
      <div className="absolute px-4 bottom-0 left-1/2 -translate-x-1/2 flex justify-center w-full opacity-110 pointer-events-none ">
        <img
          src={Shivlogo}
          alt="ShivAI Background"
          className="mx-auto w-[400px] lg:w-[1260px] object-contain"
        />
      </div>
    </footer>
  );
};

export default Footer;
