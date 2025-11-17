import React from "react";
import { QrCode, X } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  status: string;
}

interface AgentQRModalProps {
  agent: Agent;
  onClose: () => void;
}

const AgentQRModal: React.FC<AgentQRModalProps> = ({ agent, onClose }) => {
  const handleDownload = () => {
    alert("QR Code download feature - integrate QR library like qrcode.react");
  };

  const handleCopyURL = () => {
    navigator.clipboard.writeText(`https://shivai.app/agent/${agent.id}`);
    alert("Agent URL copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 common-bg-icons rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              Agent QR Code
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Scan this QR code to quickly access {agent.name}
          </p>
        </div>

        {/* QR Code Display */}
        <div className="bg-white rounded-xl p-6 mb-6 flex items-center justify-center border-2 border-slate-200 dark:border-slate-700">
          <div className="w-64 h-64 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
            {/* Placeholder QR Code - In production, use a QR code library */}
            <div className="grid grid-cols-8 gap-1 p-4">
              {Array.from({ length: 64 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 ${
                    Math.random() > 0.5
                      ? "bg-slate-800 dark:bg-white"
                      : "bg-transparent"
                  } rounded-sm`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Agent Info */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 dark:text-slate-400 mb-1">
                Agent Name
              </p>
              <p className="font-medium text-slate-800 dark:text-white">
                {agent.name}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 mb-1">Status</p>
              <span
                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  agent.status === "Published"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : agent.status === "Training"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {agent.status}
              </span>
            </div>
            <div className="col-span-2">
              <p className="text-slate-500 dark:text-slate-400 mb-1">
                Agent URL
              </p>
              <p className="font-mono text-xs text-blue-600 dark:text-blue-400 break-all">
                https://shivai.app/agent/{agent.id}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 common-button-bg flex items-center justify-center gap-2 px-4 py-3 rounded-xl"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download QR
          </button>
          <button
            onClick={handleCopyURL}
            className="flex-1 common-button-bg2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy URL
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentQRModal;
