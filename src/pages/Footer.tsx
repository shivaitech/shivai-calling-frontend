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
  return (
    <footer className="relative bg-black text-white py-12 px-6 overflow-hidden min-h-screen">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <img
                src={ShivAi}
                alt="ShivAI Logo"
                className="h-10 w-auto"
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <p className="text-[#ffffff]/60 text-[15px] lg:text-[18px] font-[400] leading-relaxed mt-4">
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
            <h4 className="font-[400] text-white mb-4">Product</h4>
            <ul className="space-y-2  font-[400] text-[16px] lg:text-sm text-[#FFFFFF99]/60">
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
            <h4 className="font-[400] text-white mb-4">Company</h4>
            <ul className="space-y-2  font-[400] text-[16px] lg:text-sm text-[#FFFFFF99]/60">
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
            <h4 className="font-[400] text-white mb-4">Support</h4>
            <ul className="space-y-2  font-[400] text-[16px] lg:text-sm text-[#FFFFFF99]/60">
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

          {/* Office Locations Column */}
          <div>
            <h4 className="font-[400] text-white mb-4">Our Offices</h4>
            <ul className="space-y-2 font-[400] text-[16px] lg:text-sm text-[#FFFFFF99]/60">
              <li className="flex items-center gap-3 hover:text-white transition-colors">
                <img
                  src={uaeFlag}
                  alt="UAE Flag"
                  className="w-6 h-4 object-cover rounded-sm border border-gray-600"
                />
                United Arab Emirates
              </li>
              <li className="flex items-center gap-3 hover:text-white transition-colors">
                <img
                  src={indiaFlag}
                  alt="India Flag"
                  className="w-6 h-4 object-cover rounded-sm border border-gray-600"
                />
                India
              </li>
              <li className="flex items-center gap-3 hover:text-white transition-colors">
                <img
                  src={usaFlag}
                  alt="USA Flag"
                  className="w-6 h-4 object-cover rounded-sm border border-gray-600"
                />
                United States
              </li>
            </ul>
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
          className="mx-auto w-[400px] lg:w-[1220px] object-contain"
        />
      </div>
    </footer>
  );
};

export default Footer;
