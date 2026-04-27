import React, { useState } from 'react';
import { ResolutionData } from '../services/resolutionService';
import { ExternalLink, X, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';

const platforms = [
  { name: 'Tumblr', url: 'https://tumblr.com/privacy' },
  { name: 'MySpace', url: 'https://myspace.com/pages/privacy' },
  { name: 'X (Twitter)', url: 'https://twitter.com/en/privacy' },
  { name: 'Facebook', url: 'https://www.facebook.com/privacy/policy' }
];

export default function AccountResolution() {
  const [selectedPlatform, setSelectedPlatform] = useState<{name: string, url: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolutionData, setResolutionData] = useState<ResolutionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleResolve = async (platform: {name: string, url: string}) => {
    setSelectedPlatform(platform);
    setLoading(true);
    setError(null);
    setResolutionData(null);
    setIsModalOpen(true);

    try {
      const response = await fetch('http://localhost:3001/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: platform.url })
      });
      if (!response.ok) {
         throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setResolutionData(data);
    } catch (err) {
      setError('Failed to fetch resolution details.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setResolutionData(null);
    setSelectedPlatform(null);
  };

  return (
    <div className="bg-cyber-900 border border-cyber-700 rounded-xl overflow-hidden mt-8">
      <div className="p-6 border-b border-cyber-800 bg-gradient-to-r from-cyber-900 to-cyber-800">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="text-red-500" />
          Account Resolution
        </h2>
        <p className="text-gray-400 mt-2">
          Identify and permanently delete old or unused accounts that may expose your personal data.
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform) => (
            <div key={platform.name} className="flex items-center justify-between p-4 rounded-lg bg-cyber-800/50 border border-cyber-700 hover:border-cyber-500 transition-colors">
              <div className="font-semibold text-white">{platform.name}</div>
              <button
                onClick={() => handleResolve(platform)}
                className="px-4 py-2 bg-cyber-600 hover:bg-cyber-500 text-white rounded font-medium transition-colors flex items-center gap-2 text-sm"
              >
                Resolve
              </button>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-cyber-900 border border-cyber-700 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-4 border-b border-cyber-800 bg-cyber-800/30">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {selectedPlatform?.name} Resolution
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 min-h-[200px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-cyber-400 space-y-4 py-12">
                  <Loader2 size={40} className="animate-spin" />
                  <p>Analyzing {selectedPlatform?.name} policies...</p>
                </div>
              ) : error ? (
                <div className="text-red-400 text-center py-8">
                  <ShieldAlert size={48} className="mx-auto mb-4 opacity-50" />
                  <p>{error}</p>
                </div>
              ) : resolutionData ? (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                      <CheckCircle2 size={18} />
                      Steps to Delete
                    </h4>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      {resolutionData.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-cyber-500 font-mono text-xs mt-0.5">{idx + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href={resolutionData.deletionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-900/20"
                  >
                    Take Me to Deletion Page <ExternalLink size={18} />
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
