import React from "react";
import { QrCode, X } from "lucide-react";
import QRCode from "react-qr-code";

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
  const agentUrl = `https://widget.callshivai.com/agent/${agent.id}`;

  const handleDownload = () => {
    // Create a canvas from the SVG QR code
    const svg = document.getElementById('qr-code-svg') as any;
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const data = (new XMLSerializer()).serializeToString(svg);
    const DOMURL = window.URL || (window as any).webkitURL || window;

    const img = new Image();
    const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = DOMURL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      
      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw QR code
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      DOMURL.revokeObjectURL(url);

      // Download
      const link = document.createElement('a');
      link.download = `${agent.name}-qr-code.png`;
      link.href = canvas.toDataURL();
      link.click();
    };

    img.src = url;
  };

  const handleCopyURL = () => {
    navigator.clipboard.writeText(agentUrl);
    
    // Show success feedback
    const button = document.getElementById('copy-url-btn');
    if (button) {
      const originalText = button.innerHTML;
      button.innerHTML = `
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        Copied!
      `;
      setTimeout(() => {
        button.innerHTML = originalText;
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 -top-8 ">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden relative border border-slate-200 dark:border-slate-700">
        {/* Close button */}
     

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600 px-6 py-4 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Share Agent</h3>
                <p className="text-white/80 text-sm">Scan to start conversation</p>
              </div>
            </div>
          </div>

             <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 bg-white rounded-lg transition-colors z-10 "
        >
          <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </button>
        </div>

        <div className="grid grid-cols-5 gap-6 p-6">
          <div className="col-span-2">
            <div className="bg-white rounded-xl p-6 flex items-center justify-center shadow-lg border-2 border-slate-100 dark:border-slate-700 relative">
              <div className="relative bg-white p-4 rounded-lg shadow-inner">
                <div className="bg-white p-3 rounded-lg border border-slate-100">
                  <QRCode
                    id="qr-code-svg"
                    value={agentUrl}
                    size={180}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                  />
                </div>
                
                {/* Smaller ShivAI Logo in center */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-1.5 shadow-xl border-2 border-white">
                  <div className="w-5 h-5 bg-gradient-to-br from-gray-500 to-gray-600 rounded-md flex items-center justify-center shadow-md relative overflow-hidden">
                    <span className="text-white font-bold text-xs relative z-10">AI</span>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  </div>
                </div>
              </div>
              
              {/* Corner decorations */}
              <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-gray-400 rounded-tl-md"></div>
              <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-gray-400 rounded-tr-md"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-gray-400 rounded-bl-md"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-gray-400 rounded-br-md"></div>
            </div>
          </div>

          {/* Right Side - Agent Info */}
          <div className="col-span-3 flex flex-col justify-between">
            {/* Agent Info Card */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-900/50 dark:to-gray-800/20 rounded-xl p-5 border border-slate-200 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">{agent.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-white text-lg">{agent.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        agent.status === "Published"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : agent.status === "Training"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mr-1.5 ${
                        agent.status === "Published" ? "bg-green-500" : 
                        agent.status === "Training" ? "bg-yellow-500" : "bg-slate-500"
                      }`}></div>
                      {agent.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-600">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1 uppercase tracking-wide">
                  Widget URL
                </p>
                <p className="font-mono text-sm text-gray-600 dark:text-gray-400 break-all bg-gray-100 dark:bg-gray-800/20 px-2 py-1.5 rounded">
                  {agentUrl}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownload}
                className="group bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <div className="w-4 h-4 transition-transform group-hover:scale-110">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                </div>
                Download QR
              </button>
              <button
                id="copy-url-btn"
                onClick={handleCopyURL}
                className="group bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2"
              >
                <div className="w-4 h-4 transition-transform group-hover:scale-110">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                Copy Link
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-4 text-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Share this QR code or link to let users instantly chat with your AI agent
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentQRModal;
