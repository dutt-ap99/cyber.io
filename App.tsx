
import React, { useState } from 'react';
import Scanner from './components/Scanner';
import BrokerRemoval from './components/BrokerRemoval';
import { ScanResult } from './types';
import { ShieldCheck, EyeOff, LayoutDashboard, Terminal, Printer } from 'lucide-react';

export default function App() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [userData, setUserData] = useState({ name: '', location: '', email: '' });

  // Handle scan completion and capture user details
  const handleScanComplete = (result: ScanResult, formData: { name: string; location: string; email: string }) => {
    setScanResult(result);
    setUserData(formData);
  };

  const handleResetScan = () => {
    setScanResult(null);
  };

  const handlePrintReport = () => {
    window.print();
  };
  
  return (
    <div className="min-h-screen bg-cyber-900 text-gray-200 font-sans selection:bg-cyber-500 selection:text-white pb-20">
      
      {/* Navbar */}
      <nav className="border-b border-yellow-600 bg-yellow-500/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyber-900 rounded flex items-center justify-center text-yellow-500">
              <EyeOff size={20} strokeWidth={2.5} />
            </div>
            <span className="font-mono font-bold text-lg tracking-tight text-cyber-900">
              GHOST<span className="text-cyber-800">PROTOCOL</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-cyber-800">
            <a href="#" className="hover:text-cyber-900 transition-colors flex items-center gap-1">
              <LayoutDashboard size={14} /> Dashboard
            </a>
            <a href="#" className="hover:text-cyber-900 transition-colors flex items-center gap-1">
              <Terminal size={14} /> Tools
            </a>
            <div className="h-4 w-px bg-yellow-600"></div>
            <span className="text-xs font-mono text-cyber-900 bg-cyber-900/10 px-2 py-0.5 rounded border border-cyber-900/20">
              v2.5.0 BETA
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-12">
        
        {/* Header Hero */}
        {!scanResult && (
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Reclaim Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-400 to-blue-500">Digital Privacy</span>
            </h1>
            <p className="text-lg text-gray-400">
              Analyze your vulnerability surface, generate legal opt-out requests, and disappear from data brokers using AI-driven intelligence.
            </p>
          </div>
        )}

        {/* Scanner Component */}
        <Scanner onScanComplete={handleScanComplete} scanCompleted={!!scanResult} onResetScan={handleResetScan} />

        {/* Post-Scan Actions */}
        {scanResult && (
          <div className="animate-fade-in-up">
            <div className="flex justify-end mb-6 print:hidden">
              <button
                onClick={handlePrintReport}
                className="flex items-center gap-2 bg-cyber-800 hover:bg-cyber-700 text-cyber-400 px-4 py-2 rounded border border-cyber-600 transition-colors"
              >
                <Printer size={18} />
                Export / Print Report
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Column: Broker Removal */}
              <div className="lg:col-span-2">
                <BrokerRemoval 
                  brokers={scanResult.recommendedBrokers} 
                  userData={userData} 
                />
              </div>

              {/* Sidebar: Educational / Tips */}
              <div className="space-y-6">
                 <div className="bg-gradient-to-br from-cyber-800 to-cyber-900 border border-cyber-700 rounded-xl p-6">
                    <h3 className="text-white font-bold flex items-center gap-2 mb-4">
                      <ShieldCheck className="text-cyber-500" />
                      Proactive Defense
                    </h3>
                    <ul className="space-y-3 text-sm text-gray-400">
                      <li className="flex items-start gap-2">
                        <span className="text-cyber-500 mt-1">•</span>
                        Use a burner email (e.g., ProtonMail) for non-essential signups.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyber-500 mt-1">•</span>
                        Enable 2FA on all financial and social accounts immediately.
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyber-500 mt-1">•</span>
                        Regularly run the Google Dorks provided to check for new leaks.
                      </li>
                    </ul>
                 </div>
                 
                 <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                   <h4 className="text-blue-400 font-bold text-sm mb-2">Did you know?</h4>
                   <p className="text-xs text-blue-200/70 leading-relaxed">
                     Data brokers often scrape public government records. Changing your voter registration to "confidential" (if allowed in your state) can reduce your footprint significantly.
                   </p>
                 </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-cyber-800 bg-cyber-900 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
          <p>© 2024 GhostProtocol. Powered by Gemini 2.5 Flash.</p>
          <p className="mt-2 text-xs text-gray-600">
            Disclaimer: This tool provides guidance and templates. It does not provide legal advice or guarantee complete data removal.
          </p>
        </div>
      </footer>
    </div>
  );
}
