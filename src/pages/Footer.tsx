import React from "react";
import Shivlogo from "../resources/images/LogoFooter.svg";
import ShivAi from "../resources/images/ShivaiLogo.svg";
import twitterIcon from "../resources/Icon/twitter.svg";
import fbIcon from "../resources/Icon/fb.svg";
import instaIcon from "../resources/Icon/insta.svg";
import linkedinIcon from "../resources/Icon/linkin.svg";

const Footer = () => {
  return (
    <footer className="relative bg-black text-white py-12 px-6 overflow-hidden min-h-screen">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="mb-6">
              <img
                src={ShivAi}
                alt="ShivAI Logo"
                className="h-10 w-auto"
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <p className="text-[#ffffff]/60 text-sm lg:text-[18px] leading-relaxed mt-4">
                The leading voice AI platform for businesses worldwide.
              </p>
            </div>
            {/* Social Media Icons */}
            <div className="flex space-x-3">
              <a
                href="#"
                className="w-12 h-12 bg-black border border-gray-800 rounded-full p-3 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <img
                  src={twitterIcon}
                  alt="Facebook"
                  className="w-10 h-10 object-contain"
                />
              </a>
              <a
                href="#"
                className="w-12 h-12 bg-black border border-gray-800 rounded-full p-3 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <img
                  src={fbIcon}
                  alt="Facebook"
                  className="w-10 h-10 object-contain"
                />
              </a>
              <a
                href="#"
                className="w-12 h-12 bg-black border border-gray-800 rounded-full p-3 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <img
                  src={instaIcon}
                  alt="Instagram"
                  className="w-10 h-10 object-contain"
                />
              </a>
              <a
                href="#"
                className="w-12 h-12 bg-black border border-gray-800 rounded-full p-3 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <img
                  src={linkedinIcon}
                  alt="LinkedIn"
                  className="w-10 h-10 object-contain"
                />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  API
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-2 mb-12 mt-2 lg:mt-8 border-t border-gray-800">
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
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex justify-center w-full opacity-110 pointer-events-none">
        <img
          src={Shivlogo}
          alt="ShivAI Background"
          className="mx-auto w-[1270px] object-contain"
        />
      </div>
    </footer>
  );
};

export default Footer;
