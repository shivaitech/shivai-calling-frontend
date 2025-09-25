import React from "react";
import Shivlogo from "../resources/images/LogoFooter.svg"

const Footer = () => {
  return (
    <footer className="relative bg-black text-white px-6 md:py-10  py-0  overflow-hidden">
      {/* Upper Section */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8 z-10 relative">
        <div>
          <p className="mb-4">
            From Idea to Impact — in 30 Days. We design,
            <br /> build, and launch AI-first MVPs with fixed <br /> pricing and
            post-launch support.
          </p>
          Architected in the US. Built by a handpicked global team.
          {/* Social Media Icons */}
          <div className="flex space-x-4 mt-2">
            {/* Facebook */}
            <a
              href="#"
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-[#01ACFF]  transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M11.6719 19.3812H8.00315V10.2599H5.50391V7.29015H8.00305V5.17699C8.00305 2.67288 9.10842 0.876953 12.7673 0.876953C13.5411 0.876953 14.756 1.03251 14.756 1.03251V3.79006H13.48C12.1798 3.79006 11.6721 4.18449 11.6721 5.27497V7.29015H14.7073L14.4371 10.2599H11.672L11.6719 19.3812Z"
                  fill="black"
                />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="#"
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-[#01ACFF] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M6.8131 10.1291C6.8131 8.42587 8.19345 7.04479 9.89665 7.04479C11.5999 7.04479 12.9809 8.42587 12.9809 10.1291C12.9809 11.8323 11.5999 13.2134 9.89665 13.2134C8.19345 13.2134 6.8131 11.8323 6.8131 10.1291ZM5.1458 10.1291C5.1458 12.753 7.27275 14.8799 9.89665 14.8799C12.5205 14.8799 14.6475 12.753 14.6475 10.1291C14.6475 7.50517 12.5205 5.37822 9.89665 5.37822C7.27275 5.37822 5.1458 7.50517 5.1458 10.1291ZM13.7253 5.18985C13.7252 5.40943 13.7903 5.62412 13.9122 5.80675C14.0341 5.98938 14.2075 6.13175 14.4103 6.21586C14.6131 6.29998 14.8364 6.32205 15.0517 6.2793C15.2671 6.23655 15.465 6.13088 15.6203 5.97567C15.7757 5.82046 15.8815 5.62268 15.9244 5.40733C15.9673 5.19198 15.9454 4.96873 15.8615 4.76583C15.7775 4.56292 15.6353 4.38946 15.4528 4.2674C15.2702 4.14533 15.0556 4.08012 14.836 4.08004H14.8356C14.5412 4.08017 14.259 4.19713 14.0508 4.40522C13.8426 4.6133 13.7256 4.89551 13.7253 5.18985V5.18985ZM6.15879 17.6601C5.25675 17.619 4.76646 17.4687 4.44064 17.3418C4.00868 17.1736 3.70047 16.9733 3.37642 16.6497C3.05238 16.3261 2.85179 16.0182 2.68436 15.5863C2.55735 15.2606 2.4071 14.7702 2.36609 13.8681C2.32124 12.8929 2.31228 12.5999 2.31228 10.1291C2.31228 7.65839 2.32198 7.36624 2.36609 6.39018C2.40717 5.48814 2.55854 4.99866 2.68436 4.67202C2.85253 4.24006 3.05282 3.93186 3.37642 3.60781C3.70002 3.28376 4.00794 3.08318 4.44064 2.91575C4.76631 2.78874 5.25675 2.63848 6.15879 2.59748C7.13404 2.55262 7.427 2.54367 9.89665 2.54367C12.3663 2.54367 12.6596 2.55336 13.6356 2.59748C14.5377 2.63856 15.0271 2.78992 15.3538 2.91575C15.7857 3.08318 16.0939 3.28421 16.418 3.60781C16.742 3.93141 16.9419 4.24006 17.11 4.67202C17.2371 4.9977 17.3873 5.48814 17.4283 6.39018C17.4732 7.36624 17.4821 7.65839 17.4821 10.1291C17.4821 12.5999 17.4732 12.8921 17.4283 13.8681C17.3872 14.7702 17.2362 15.2604 17.11 15.5863C16.9419 16.0182 16.7416 16.3264 16.418 16.6497C16.0944 16.9731 15.7857 17.1736 15.3538 17.3418C15.0281 17.4688 14.5377 17.6191 13.6356 17.6601C12.6604 17.7049 12.3674 17.7139 9.89665 17.7139C7.42589 17.7139 7.13374 17.7049 6.15879 17.6601V17.6601ZM6.08219 0.932984C5.09724 0.977838 4.42421 1.13401 3.83644 1.36273C3.22772 1.59891 2.71242 1.91578 2.19748 2.4299C1.68254 2.94402 1.36649 3.46014 1.1303 4.06886C0.901592 4.657 0.745416 5.32967 0.700562 6.31461C0.654968 7.30111 0.644531 7.61649 0.644531 10.1291C0.644531 12.6417 0.654968 12.957 0.700562 13.9435C0.745416 14.9286 0.901592 15.6011 1.1303 16.1893C1.36649 16.7976 1.68262 17.3143 2.19748 17.8282C2.71234 18.3421 3.22772 18.6586 3.83644 18.8954C4.42532 19.1241 5.09724 19.2803 6.08219 19.3252C7.0692 19.37 7.38407 19.3812 9.89665 19.3812C12.4092 19.3812 12.7246 19.3708 13.7111 19.3252C14.6961 19.2803 15.3687 19.1241 15.9569 18.8954C16.5652 18.6586 17.0809 18.3424 17.5958 17.8282C18.1108 17.3141 18.4261 16.7976 18.663 16.1893C18.8917 15.6011 19.0486 14.9285 19.0927 13.9435C19.1376 12.9563 19.148 12.6417 19.148 10.1291C19.148 7.61649 19.1376 7.30111 19.0927 6.31461C19.0479 5.32959 18.8917 4.65663 18.663 4.06886C18.4261 3.46052 18.1099 2.94484 17.5958 2.4299C17.0817 1.91497 16.5652 1.59891 15.9576 1.36273C15.3687 1.13401 14.6961 0.977098 13.7119 0.932984C12.7254 0.88813 12.41 0.876953 9.89739 0.876953C7.38481 0.876953 7.0692 0.88739 6.08219 0.932984Z"
                  fill="black"
                />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="#"
              className="w-8 h-8 bg-white  rounded-full flex items-center justify-center hover:bg-[#01ACFF]  transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="20"
                viewBox="0 0 19 20"
                fill="none"
              >
                <path
                  d="M10.0724 16.6427L6.27602 16.5719C5.04679 16.5472 3.81455 16.5965 2.60948 16.3407C0.776213 15.9586 0.646344 14.0848 0.510435 12.513C0.323181 10.3033 0.395667 8.05346 0.749031 5.86222C0.948365 4.63254 1.73362 3.89904 2.94774 3.81891C7.04617 3.52921 11.1718 3.56312 15.2611 3.69872C15.693 3.71105 16.1279 3.77885 16.5538 3.8559C18.6559 4.23189 18.7072 6.35532 18.8431 8.14283C18.979 9.94883 18.9216 11.7641 18.6619 13.5577C18.4535 15.0432 18.0548 16.2883 16.3726 16.4085C14.2645 16.5657 12.2047 16.692 10.0905 16.652C10.0905 16.6427 10.0785 16.6427 10.0724 16.6427V16.6427ZM7.84049 12.8828C9.42912 11.9521 10.9875 11.0367 12.5671 10.1122C10.9755 9.18144 9.42006 8.26611 7.84049 7.34154V12.8828Z"
                  fill="black"
                />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="#"
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-[#01ACFF] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="20"
                viewBox="0 0 19 20"
                fill="none"
              >
                <g clipPath="url(#clip0_1134_178)">
                  <path
                    d="M18.6733 19.3795V19.3787H18.6779V12.5923C18.6779 9.27229 17.9632 6.71484 14.0819 6.71484C12.2161 6.71484 10.9639 7.73875 10.4528 8.70945H10.3988V7.02479H6.71875V19.3787H10.5507V13.2615C10.5507 11.6509 10.856 10.0934 12.8506 10.0934C14.8159 10.0934 14.8452 11.9315 14.8452 13.3648V19.3795H18.6733Z"
                    fill="black"
                  />
                  <path
                    d="M0.476562 7.02734H4.31311V19.3812H0.476562V7.02734Z"
                    fill="black"
                  />
                  <path
                    d="M2.39393 0.876953C1.16725 0.876953 0.171875 1.87233 0.171875 3.099C0.171875 4.32568 1.16725 5.34187 2.39393 5.34187C3.6206 5.34187 4.61598 4.32568 4.61598 3.099C4.61521 1.87233 3.61983 0.876953 2.39393 0.876953V0.876953Z"
                    fill="black"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_1134_178">
                    <rect
                      width="18.5042"
                      height="18.5042"
                      fill="white"
                      transform="translate(0.171875 0.876953)"
                    />
                  </clipPath>
                </defs>
              </svg>
            </a>
          </div>
        </div>

        {/* Mobile: 2 columns + full width, Desktop: 3 columns */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div>
            <h4 className="font-bold mb-2 text-sm sm:text-base">Quick Links</h4>
            <ul className="space-y-1 text-xs sm:text-sm lg:text-base">
              <li className="hover:text-gray-300 transition-colors cursor-pointer">
                Works
              </li>
              <li className="hover:text-gray-300 transition-colors cursor-pointer">
                Why us
              </li>
              <li className="hover:text-gray-300 transition-colors cursor-pointer">
                Process
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-2 text-sm sm:text-base">Contact</h4>
            <ul className="space-y-1 text-xs sm:text-sm lg:text-base">
              <li className="hover:text-gray-300 transition-colors break-all">
                hello@shivaitech.com
              </li>
              <li className="hover:text-gray-300 transition-colors">
                (1234) 567-890
              </li>
            </ul>
          </div>

          <div className="col-span-2 lg:col-span-1">
            <h4 className="font-bold mb-2 text-sm sm:text-base">Legal</h4>
            <ul className="space-y-1 text-xs sm:text-sm lg:text-base">
              <li className="hover:text-gray-300 transition-colors cursor-pointer">
                Terms of Service
              </li>
              <li className="hover:text-gray-300 transition-colors cursor-pointer">
                Privacy Policy
              </li>
              <li className="hover:text-gray-300 transition-colors cursor-pointer">
                Careers
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <div className="relative z-10 mt-8 text-xs text-gray-400 text-center">
        © 2025 ShivAi Tech. All rights reserved.
      </div>

      <footer className="relative bg-black text-white px-6 py-10 flex justify-center items-center">
        <div className="relative w-full max-w-[400px] sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px] overflow-hidden">
          {/* Blur overlay with gradient */}
          <div
            className="absolute bottom-0 left-0 w-full h-1/2 
                    bg-gradient-to-t from-black/50 to-transparent 
                    backdrop-blur-lg z-0"
          ></div>

          <img
            src={Shivlogo}
            alt="ShivAi Logo"
            className="w-full h-auto object-contain relative z-10"
          />
        </div>
      </footer>
    </footer>
  );
};

export default Footer;
