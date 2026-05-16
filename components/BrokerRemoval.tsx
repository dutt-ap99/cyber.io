
import React, { useState, useEffect } from 'react';
import { BrokerGuide, BrokerStatus } from '../types';
import { generateRemovalInstructions, generateDeletionEmail } from '../services/geminiService';
import { 
  Trash2, Clock, BarChart3, ChevronDown, ChevronUp, Mail, FileText, 
  CheckCircle2, ExternalLink, AlertTriangle, XCircle, Loader2, CircleDashed 
} from 'lucide-react';

interface Props {
  brokers: BrokerGuide[];
  userData: { name: string; email: string; location: string };
}

const isValidUrl = (url: string) => {
  return url.startsWith('http://') || url.startsWith('https://');
};

const BrokerRemoval: React.FC<Props> = ({ brokers, userData }) => {
  const [localBrokers, setLocalBrokers] = useState<BrokerGuide[]>([]);
  
  useEffect(() => {
    // Initialize with pending if not set
    setLocalBrokers(brokers.map(b => ({ ...b, status: b.status || 'pending' })));
  }, [brokers]);

  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string>('');
  const [emailTemplate, setEmailTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'guide' | 'email'>('guide');

  const [instructionsCache, setInstructionsCache] = useState<Record<string, string>>({});
  const [emailCache, setEmailCache] = useState<Record<string, string>>({});

  const handleBrokerClick = async (broker: BrokerGuide) => {
    if (selectedBroker === broker.name) {
      setSelectedBroker(null);
      return;
    }
    
    setSelectedBroker(broker.name);
    setMode('guide');

    if (instructionsCache[broker.name]) {
      setInstructions(instructionsCache[broker.name]);
      setEmailTemplate(emailCache[broker.name] || '');
      return;
    }

    setLoading(true);
    setInstructions('');
    setEmailTemplate('');

    try {
      const guide = await generateRemovalInstructions(broker.name);
      setInstructions(guide);
      setInstructionsCache(prev => ({ ...prev, [broker.name]: guide }));
    } catch (e) {
      console.error(e);
      setInstructions("Failed to load instructions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadEmail = async (brokerName: string) => {
    setMode('email');
    if (emailCache[brokerName]) {
      setEmailTemplate(emailCache[brokerName]);
      return;
    }

    if (!emailTemplate) {
      setLoading(true);
      const email = await generateDeletionEmail(brokerName, { 
        name: userData.name, 
        email: userData.email || '[Insert Email]', 
        address: userData.location 
      });
      setEmailTemplate(email);
      setEmailCache(prev => ({ ...prev, [brokerName]: email }));
      setLoading(false);
    }
  };

  const updateStatus = (brokerName: string, newStatus: BrokerStatus) => {
    setLocalBrokers(prev => prev.map(b => {
      if (b.name === brokerName) {
        return { ...b, status: newStatus };
      }
      return b;
    }));
  };

  const getStatusConfig = (status?: BrokerStatus) => {
    switch (status) {
      case 'completed':
        return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', icon: CheckCircle2, label: 'Removed' };
      case 'processing':
        return { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/50', icon: Loader2, label: 'Processing' };
      case 'escalated':
        return { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/50', icon: AlertTriangle, label: 'Escalated' };
      case 'failed':
        return { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/50', icon: XCircle, label: 'Failed' };
      default: // pending
        return { color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-600/50', icon: CircleDashed, label: 'Pending' };
    }
  };

  // Calculate Progress
  const completedCount = localBrokers.filter(b => b.status === 'completed').length;
  const inProgressCount = localBrokers.filter(b => b.status === 'processing' || b.status === 'escalated').length;
  const progress = localBrokers.length > 0 ? (completedCount / localBrokers.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Trash2 className="text-red-400" />
          Data Removal Workflow
        </h2>
        
        {/* Progress Bar */}
        <div className="w-full md:w-64 space-y-2">
           <div className="flex justify-between text-xs font-mono text-gray-400">
             <span>PROGRESS</span>
             <span>{Math.round(progress)}% REMOVED</span>
           </div>
           <div className="bg-cyber-800 border border-cyber-700 rounded-full h-2 w-full overflow-hidden flex">
             <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(completedCount / localBrokers.length) * 100}%` }}></div>
             <div className="h-full bg-blue-500/50 transition-all duration-500" style={{ width: `${(inProgressCount / localBrokers.length) * 100}%` }}></div>
           </div>
        </div>
      </div>
      
      <div className="grid gap-4">
        {localBrokers.length === 0 && (
          <div className="text-gray-500 italic p-4 text-center border border-dashed border-gray-700 rounded-lg">
            No specific brokers identified yet. Run a scan first.
          </div>
        )}

        {localBrokers.map((broker) => {
          const statusConfig = getStatusConfig(broker.status);
          const StatusIcon = statusConfig.icon;
          
          return (
            <div 
              key={broker.name} 
              className={`bg-cyber-800 border rounded-lg overflow-hidden transition-all duration-300
                ${selectedBroker === broker.name ? 'border-cyber-500 shadow-lg shadow-cyber-500/10' : 'border-cyber-700'}
                ${broker.status === 'completed' ? 'opacity-75' : 'opacity-100'}
              `}
            >
              {/* Header */}
              <div className="flex items-stretch min-h-[5rem]">
                 {/* Status Strip */}
                 <div className={`w-12 flex flex-col items-center justify-center border-r border-cyber-700/50 transition-colors ${statusConfig.bg}`}>
                   <StatusIcon className={`w-6 h-6 ${statusConfig.color} ${broker.status === 'processing' ? 'animate-spin' : ''}`} />
                 </div>

                 {/* Main Click Area */}
                 <div 
                    onClick={() => handleBrokerClick(broker)}
                    className="flex-1 p-4 flex items-center justify-between cursor-pointer hover:bg-cyber-700/50 transition-colors"
                 >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-sm bg-cyber-900 border-cyber-700 text-gray-300`}>
                        {broker.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className={`font-bold transition-all ${broker.status === 'completed' ? 'text-emerald-500 line-through decoration-2' : 'text-white'}`}>
                            {broker.name}
                          </h3>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${statusConfig.border} ${statusConfig.color} ${statusConfig.bg} bg-opacity-20`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {broker.timeToComplete}</span>
                          <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {broker.difficulty}</span>
                          <span className="bg-cyber-900 px-2 py-0.5 rounded text-gray-300 border border-cyber-700/50">{broker.category}</span>
                        </div>
                      </div>
                    </div>
                    {selectedBroker === broker.name ? <ChevronUp className="text-cyber-500" /> : <ChevronDown className="text-gray-500" />}
                 </div>
              </div>

              {/* Expanded Content */}
              {selectedBroker === broker.name && (
                <div className="border-t border-cyber-700 bg-cyber-900/50 p-6 animate-fade-in">
                  
                  {/* Status Selection Toolbar */}
                  <div className="mb-6 bg-black/20 p-3 rounded-lg border border-cyber-700/50">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Update Status</span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {(['pending', 'processing', 'escalated', 'failed', 'completed'] as BrokerStatus[]).map((s) => {
                        const cfg = getStatusConfig(s);
                        const Icon = cfg.icon;
                        const isActive = broker.status === s;
                        return (
                          <button
                            key={s}
                            onClick={() => updateStatus(broker.name, s)}
                            className={`flex flex-col items-center justify-center p-2 rounded border transition-all
                              ${isActive 
                                ? `${cfg.bg} ${cfg.border} ${cfg.color} ring-1 ring-inset ring-current` 
                                : 'border-transparent hover:bg-white/5 text-gray-500'
                              }
                            `}
                          >
                            <Icon className={`w-5 h-5 mb-1 ${isActive ? '' : 'grayscale opacity-50'}`} />
                            <span className="text-[10px] font-bold uppercase">{cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-4 mb-6 border-b border-cyber-700 pb-2">
                     <button 
                       onClick={() => setMode('guide')}
                       className={`pb-2 px-1 text-sm font-bold flex items-center gap-2 transition-colors ${mode === 'guide' ? 'text-cyber-400 border-b-2 border-cyber-400' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                       <FileText className="w-4 h-4" /> AI Removal Guide
                     </button>
                     <button 
                       onClick={() => handleLoadEmail(broker.name)}
                       className={`pb-2 px-1 text-sm font-bold flex items-center gap-2 transition-colors ${mode === 'email' ? 'text-cyber-400 border-b-2 border-cyber-400' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                       <Mail className="w-4 h-4" /> Legal Deletion Request
                     </button>
                  </div>

                  {loading ? (
                     <div className="py-8 flex flex-col items-center text-gray-400 animate-pulse">
                       <Loader2 className="w-8 h-8 text-cyber-500 animate-spin mb-2" />
                       <p className="font-mono text-sm">Consulting Privacy Database...</p>
                     </div>
                  ) : (
                    <>
                      {mode === 'guide' && (
                        <div className="space-y-6">
                           <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                             {instructions ? instructions.split('\n').map((line, i) => (
                               <p key={i} className={line.startsWith('#') ? 'font-bold text-white text-base mt-4' : 'mb-2 leading-relaxed'}>
                                 {line.replace(/^#+\s/, '')}
                               </p>
                             )) : <p className="italic text-gray-500">Select a broker to load removal instructions.</p>}
                           </div>
                           
                           <div className="pt-4 border-t border-cyber-700">
                             <a 
                               href={isValidUrl(broker.url) ? broker.url : '#'}
                               target="_blank" 
                               rel="noopener noreferrer"
                               className={`block w-full text-center bg-cyber-500 text-cyber-900 px-4 py-3 rounded font-bold hover:bg-cyber-400 transition-colors flex items-center justify-center gap-2 ${!isValidUrl(broker.url) ? 'opacity-50 cursor-not-allowed' : ''}`}
                               onClick={(e) => { if (!isValidUrl(broker.url)) e.preventDefault(); }}
                             >
                               Open {broker.name} Opt-Out Page <ExternalLink className="w-4 h-4" />
                             </a>
                           </div>
                        </div>
                      )}

                      {mode === 'email' && (
                        <div className="relative animate-fade-in">
                          <div className="mb-4 text-xs text-gray-400 bg-blue-500/10 border border-blue-500/20 p-3 rounded">
                            <strong className="text-blue-400">Tip:</strong> Send this email to <u>privacy@{broker.url.replace('https://', '').replace('http://', '').split('/')[0]}</u> or look for a "Privacy Contact" on their site.
                          </div>
                          <textarea 
                            readOnly 
                            className="w-full h-64 bg-black/50 border border-cyber-700 rounded p-4 text-gray-300 font-mono text-sm focus:ring-1 focus:ring-cyber-500 outline-none resize-none"
                            value={emailTemplate}
                          />
                          <button 
                            onClick={() => navigator.clipboard.writeText(emailTemplate)}
                            className="absolute top-14 right-4 bg-cyber-800 hover:bg-cyber-700 text-xs px-3 py-1 rounded border border-cyber-600 flex items-center gap-1 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BrokerRemoval;
