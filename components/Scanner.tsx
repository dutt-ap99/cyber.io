
import React, { useState } from 'react';
import { Search, ShieldAlert, ExternalLink, Lock, Copy, Check } from 'lucide-react';
import { analyzeDigitalFootprint } from '../services/geminiService';
import { ScanResult, RiskLevel } from '../types';

interface ScannerProps {
  onScanComplete: (result: ScanResult, formData: { name: string; location: string; email: string }) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanComplete }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '', email: '' });
  const [result, setResult] = useState<ScanResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location) return;

    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeDigitalFootprint(formData.name, formData.location, formData.email);
      setResult(data);
      // Pass both result and user data up to App
      onScanComplete(data, formData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case RiskLevel.CRITICAL: return 'text-red-500 border-red-500/30 bg-red-500/10';
      case RiskLevel.HIGH: return 'text-orange-500 border-orange-500/30 bg-orange-500/10';
      case RiskLevel.MEDIUM: return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
      case RiskLevel.LOW: return 'text-cyber-500 border-cyber-500/30 bg-cyber-500/10';
    }
  };

  const getChartColor = (score: number) => {
    if (score > 70) return '#ef4444'; // Red
    if (score > 40) return '#f97316'; // Orange
    return '#10b981'; // Emerald
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Input Section */}
      <div className="bg-cyber-800 border border-cyber-700 rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
        
        <h2 className="text-2xl font-mono font-bold text-white mb-6 flex items-center gap-3">
          <Search className="w-6 h-6 text-cyber-400" />
          Vulnerability Scanner
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="target-name" className="text-xs font-bold text-cyber-400 uppercase tracking-wider">Target Name</label>
            <input
              id="target-name"
              type="text"
              required
              autoComplete="name"
              placeholder="e.g. John Doe"
              className="w-full bg-cyber-900 border border-cyber-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyber-500 focus:border-transparent outline-none transition-all placeholder-cyber-700"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="target-location" className="text-xs font-bold text-cyber-400 uppercase tracking-wider">Location</label>
            <input
              id="target-location"
              type="text"
              required
              placeholder="e.g. San Francisco, CA"
              className="w-full bg-cyber-900 border border-cyber-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyber-500 focus:border-transparent outline-none transition-all placeholder-cyber-700"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="target-email" className="text-xs font-bold text-cyber-400 uppercase tracking-wider">Email (Optional)</label>
            <input
              id="target-email"
              type="email"
              autoComplete="email"
              placeholder="For deeper analysis"
              className="w-full bg-cyber-900 border border-cyber-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyber-500 focus:border-transparent outline-none transition-all placeholder-cyber-700"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="md:col-span-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-lg font-bold text-lg tracking-widest uppercase transition-all flex items-center justify-center gap-2
                ${loading ? 'bg-cyber-700 text-gray-400 cursor-not-allowed' : 'bg-cyber-500 hover:bg-cyber-400 text-cyber-900 shadow-lg shadow-cyber-500/20'}`}
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                  Initializing Deep Scan...
                </>
              ) : (
                <>
                  <ShieldAlert className="w-5 h-5" />
                  Initiate Scan
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {result && (
        <div className="animate-fade-in-up space-y-6">
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Risk Score */}
            <div className="bg-cyber-800 border border-cyber-700 rounded-xl p-6 relative overflow-hidden">
               <h3 className="text-gray-400 text-sm font-mono mb-4">ESTIMATED EXPOSURE</h3>
               <div className="flex items-center justify-between">
                 <div className="text-5xl font-bold text-white font-mono">{result.riskScore}/100</div>
                 <div className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                      style={{
                        background: `conic-gradient(${getChartColor(result.riskScore)} ${result.riskScore}%, #1e293b 0)`
                      }}>
                    {/* Inner circle to make it a donut */}
                    <div className="w-10 h-10 bg-cyber-800 rounded-full"></div>
                 </div>
               </div>
               <p className={`mt-2 text-sm ${result.riskScore > 70 ? 'text-red-400' : 'text-cyber-400'}`}>
                 {result.riskScore > 70 ? 'CRITICAL LEVELS DETECTED' : 'MODERATE EXPOSURE'}
               </p>
            </div>

            {/* Summary */}
            <div className="md:col-span-2 bg-cyber-800 border border-cyber-700 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm font-mono mb-2">INTELLIGENCE BRIEF</h3>
              <p className="text-lg text-gray-200 leading-relaxed">{result.summary}</p>
            </div>
          </div>

          {/* Dorks / Self-Audit */}
          <div className="bg-cyber-800 border border-cyber-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <Lock className="w-5 h-5 text-orange-400" />
                 Self-Audit Queries (Google Dorks)
               </h3>
               <span className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full border border-orange-500/30">
                 Run these to check exposure
               </span>
            </div>
            
            <div className="grid gap-4">
              {result.dorks.map((dork, idx) => (
                <div key={idx} className={`p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${getRiskColor(dork.risk as RiskLevel)}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold font-mono">{dork.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-current opacity-70">
                        {dork.risk}
                      </span>
                    </div>
                    <p className="text-sm opacity-80 mb-2">{dork.description}</p>
                    <code className="block bg-black/30 p-2 rounded text-xs font-mono break-all border border-current/20">
                      {dork.query}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyToClipboard(dork.query, idx)}
                      className="p-2 hover:bg-black/20 rounded-lg transition-colors"
                      title="Copy Query"
                    >
                      {copiedIndex === idx ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <a 
                      href={`https://www.google.com/search?q=${encodeURIComponent(dork.query)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-black/20 rounded-lg transition-colors"
                      title="Run Search"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
