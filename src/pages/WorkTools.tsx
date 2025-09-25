import React from "react";

// Define the integrations data based on the image
import bgImage from "../resources/images/bg2.svg";
const integrations = [
  {
    id: 1,
    name: "WhatsApp Business API",
    description: "Sync contacts, conversations, identity, and workflows",
    icon: "whatsapp",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    id: 2,
    name: "Zoho CRM",
    description: "Capture leads, update contacts, and log calls",
    icon: "zoho",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: 3,
    name: "Odoo",
    description: "Sync orders, invoices, and CRM workflows",
    icon: "odoo",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    id: 4,
    name: "HubSpot",
    description: "Capture and qualify new leads",
    icon: "hubspot",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: 5,
    name: "Freshworks",
    description: "Log support automatically",
    icon: "freshworks",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: 6,
    name: "Google Drive",
    description: "Save to Google & cloud",
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
    description: "Manage orders via voice",
    icon: "shopify",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    id: 9,
    name: "Stripe",
    description: "Collect secure payments during",
    icon: "stripe",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: 10,
    name: "Twilio",
    description: "Power voice and voice calls",
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
    description: "Record invoices & payment confirmations",
    icon: "quickbooks",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
];

export const WorkTools = () => {
  const getServiceIcon = (iconName: string) => {
    const iconMap: { [key: string]: string } = {
      whatsapp: "WA",
      zoho: "Z",
      odoo: "O",
      hubspot: "H",
      freshworks: "F",
      googledrive: "GD",
      calendly: "C",
      shopify: "S",
      stripe: "ST",
      twilio: "T",
      zendesk: "ZD",
      quickbooks: "QB",
    };
    return iconMap[iconName] || "?";
  };

  return (
    <div
      className="w-full py-16 lg:py-10 relative -top-5% "
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            ShivAI Works With Your Tools
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
            Integrates into your stack. Extends your superpowers.
          </p>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="bg-white rounded-2xl px-6 py-3 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-gray-100"
            >
              {/* Icon and Name Row */}
              <div className="flex items-center space-x-4 ">
                {/* Service Icon */}
                <div
                  className={`w-10 h-10 rounded-lg ${integration.bgColor} flex items-center justify-center flex-shrink-0`}
                >
                  <span
                    className={`text-sm font-bold ${integration.iconColor}`}
                  >
                    {getServiceIcon(integration.icon)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {integration.name}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed text-wrap lg:text-nowrap">
                    {integration.description}
                  </p>
                </div>
              </div>

              {/* Description */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
