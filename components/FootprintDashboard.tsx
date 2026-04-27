import React from 'react';
import { ShieldAlert, ShieldCheck, Database, Calendar } from 'lucide-react';
import { BreachedService, RiskLevel } from '../types';

interface FootprintDashboardProps {
  breaches: BreachedService[];
}

const FootprintDashboard: React.FC<FootprintDashboardProps> = ({ breaches }) => {
  if (!breaches || breaches.length === 0) {
    return (
      <div className="bg-cyber-800 border border-cyber-700 rounded-xl p-8 text-center animate-fade-in-up mt-8">
        <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Known Breaches Found</h3>
        <p className="text-gray-400">
          Good news! The provided email and usernames do not appear in our known public data breaches database.
          Remember to always use unique passwords and 2FA.
        </p>
      </div>
    );
  }

  const getRiskColor = (risk: RiskLevel) => {
    switch (risk) {
      case RiskLevel.CRITICAL: return 'border-red-500/50 bg-red-500/10 text-red-400';
      case RiskLevel.HIGH: return 'border-orange-500/50 bg-orange-500/10 text-orange-400';
      case RiskLevel.MEDIUM: return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
      case RiskLevel.LOW: return 'border-cyber-500/50 bg-cyber-500/10 text-cyber-400';
      default: return 'border-gray-500/50 bg-gray-500/10 text-gray-400';
    }
  };

  const getRiskLabel = (risk: RiskLevel) => {
    switch (risk) {
      case RiskLevel.CRITICAL: return 'Breached';
      case RiskLevel.HIGH: return 'Compromised';
      case RiskLevel.MEDIUM: return 'Inactive';
      case RiskLevel.LOW: return 'Minor Exposure';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6 mt-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Database className="w-6 h-6 text-cyber-500" />
          Breach Footprint
        </h2>
        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold border border-red-500/30 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          {breaches.length} Exposures Detected
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {breaches.map((breach, idx) => (
          <div key={idx} className={`rounded-xl border p-6 flex flex-col gap-4 relative overflow-hidden group transition-all hover:-translate-y-1 hover:shadow-lg ${getRiskColor(breach.riskLevel)}`}>
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -z-10"></div>

            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-xl text-white group-hover:text-current transition-colors">{breach.name}</h3>
                <a href={`https://${breach.domain}`} target="_blank" rel="noopener noreferrer" className="text-xs opacity-70 hover:opacity-100 transition-opacity">
                  {breach.domain}
                </a>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full border border-current opacity-90 uppercase tracking-wider">
                {getRiskLabel(breach.riskLevel)}
              </span>
            </div>

            <div className="text-sm opacity-80 line-clamp-3" dangerouslySetInnerHTML={{ __html: breach.description }} />

            <div className="mt-auto space-y-3 pt-4 border-t border-current/20">
              <div className="flex items-center gap-2 text-xs opacity-90">
                <Calendar className="w-4 h-4" />
                <span>Breached: {breach.breachDate}</span>
              </div>

              <div className="flex flex-wrap gap-1">
                {breach.dataClasses.slice(0, 3).map((dc, i) => (
                  <span key={i} className="text-[10px] bg-black/30 px-2 py-0.5 rounded border border-current/20">
                    {dc}
                  </span>
                ))}
                {breach.dataClasses.length > 3 && (
                  <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded border border-current/20">
                    +{breach.dataClasses.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FootprintDashboard;
