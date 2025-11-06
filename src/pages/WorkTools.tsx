import React, { useState } from "react";

// Define the integrations data based on the image
import bgImage from "../resources/images/bg2.svg";
// Import SVG icons
import whatsappIcon from "../resources/Icon/whatsapp.svg";
import zohoIcon from "../resources/Icon/zoho.svg";
import odooIcon from "../resources/Icon/odoo.svg";
import hubspotIcon from "../resources/Icon/hubspot.svg";
import freshworkIcon from "../resources/Icon/freshwork.svg";
import googleDriveIcon from "../resources/Icon/googleDrive.svg";
import calendlyIcon from "../resources/Icon/calendly.svg";
import shopifyIcon from "../resources/Icon/shopify.svg";
import stripeIcon from "../resources/Icon/stripe.svg";
import twilioIcon from "../resources/Icon/twilio.svg";
import zendeskIcon from "../resources/Icon/zendesk.svg";
import quickbooksIcon from "../resources/Icon/quickbooks.svg";
import { rgba } from "framer-motion";
const integrations = [
  {
    id: 1,
    name: "WhatsApp Business",
    description: "Sync contacts & chats instantly",
    icon: "whatsapp",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    id: 2,
    name: "Zoho CRM",
    description: "Capture leads & log calls",
    icon: "zoho",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: 3,
    name: "Odoo",
    description: "Sync orders & CRM data",
    icon: "odoo",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    id: 4,
    name: "HubSpot",
    description: "Qualify & capture new leads",
    icon: "hubspot",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: 5,
    name: "Freshworks",
    description: "Auto-log support tickets",
    icon: "freshworks",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: 6,
    name: "Google Drive",
    description: "Save files to cloud easily",
    icon: "googledrive",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: 7,
    name: "Calendly",
    description: "Schedule meetings from calls",
    icon: "calendly",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: 8,
    name: "Shopify",
    description: "Manage orders by voice",
    icon: "shopify",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    id: 9,
    name: "Stripe",
    description: "Collect secure payments",
    icon: "stripe",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: 10,
    name: "Twilio",
    description: "Power voice & SMS calls",
    icon: "twilio",
    bgColor: "bg-red-50",
    iconColor: "text-red-600",
  },
  {
    id: 11,
    name: "Zendesk",
    description: "Create tickets from calls",
    icon: "zendesk",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    id: 12,
    name: "QuickBooks Online",
    description: "Record invoices & payments",
    icon: "quickbooks",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
];

export const WorkTools = () => {
  const [showMore, setShowMore] = useState(false);

  const getServiceIcon = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      whatsapp: whatsappIcon,
      zoho: zohoIcon,
      odoo: odooIcon,
      hubspot: hubspotIcon,
      freshworks: freshworkIcon,
      googledrive: googleDriveIcon,
      calendly: calendlyIcon,
      shopify: shopifyIcon,
      stripe: stripeIcon,
      twilio: twilioIcon,
      zendesk: zendeskIcon,
      quickbooks: quickbooksIcon,
    };
    return iconMap[iconName] || whatsappIcon; // fallback to whatsapp icon
  };

  return (
    <div className="w-full py-12 lg:py-16  relative -top-7 lg:top-0 ">
      <div className="mx-auto px-0 lg:px-0">
        <div
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
          className="text-center mb-4 w-full relative px-2 lg:px-0 pb-12 lg:pb-2 pt-0 py-0 lg:py-20"
        >
          <h2
            className="text-[34px] lg:text-[64px] font-[600] text-[#333] mb-2 leading-[normal] "
            style={{ letterSpacing: "-1.9px" }}
          >
            Works With Everything You Already Use.
          </h2>

          <p className="text-[14px]  lg:text-lg text-[#5A5A59] max-w-[70vw] font-[300] mx-auto mb-0 lg:mb-12">
            Integrates into your stack. Extends your superpowers.
          </p>
        </div>

        {/* Integration Grid */}
        <div className="max-w-8xl mx-auto px-6 relative -top-[30px] lg:top-0 lg:px-10">
          <div
            className={`relative ${
              !showMore ? "max-h-[310px] lg:max-h-full overflow-hidden" : ""
            }`}
          >
            {/* Blur effect overlay for mobile */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  style={{
                    borderRadius: "16.477px",
                    border: "1px solid #E2E2E4",
                    backdropFilter: "blur(40px)",
                  }}
                  className="bg-white/50  hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                >
                  {/* Icon and Name Row */}
                  <div className="flex items-center ">
                    {/* Service Icon */}
                    <div
                      className={`w-[65px] rounded-lg flex items-center justify-center  flex-shrink-0  `}
                    >
                      <img
                        src={getServiceIcon(integration.icon)}
                        alt={integration.name}
                        className="w-8 h-8"
                      />
                    </div>
                    <div className="flex-1 bg-white px-4 lg:px-6 py-3 lg:py-4 rounded-r-2xl">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {integration.name}
                      </h3>
                      <p className="text-gray-600 text-sm lg:text-sm leading-relaxed text-wrap lg:text-nowrap">
                        {integration.description}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                </div>
              ))}
            </div>

            {/* Show More Button - only visible on mobile */}
          </div>
        </div>
      </div>
      {!showMore && (
        <div className="absolute inset-x-0 top-[84%] h-10 bg-gradient-to-b from-[#]/80 via-white/60 to-transparent backdrop-blur-[2px] z-10 pointer-events-none lg:hidden" />
      )}

      {!showMore && (
        <div className="absolute inset-x-0 bottom-2 flex items-end justify-center pb-4 lg:hidden">
          <button
            onClick={() => setShowMore(true)}
            style={{
              color: "#000",
              fontFamily: "Poppins",
              fontSize: "16px",
              fontStyle: "normal",
              fontWeight: 400,
              lineHeight: "normal",
              textDecorationLine: "underline",
              textDecorationStyle: "solid",
              textDecorationSkipInk: "auto",
              textDecorationThickness: "auto",
              textUnderlineOffset: "auto",
              textUnderlinePosition: "from-font",
            }}
          >
            Show More
          </button>
        </div>
      )}
    </div>
  );
};
