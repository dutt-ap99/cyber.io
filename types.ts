
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface GoogleDork {
  title: string;
  query: string;
  description: string;
  risk: RiskLevel;
}

export type BrokerStatus = 'pending' | 'processing' | 'escalated' | 'failed' | 'completed';

export interface BrokerGuide {
  name: string;
  url: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeToComplete: string;
  category: 'People Search' | 'Marketing' | 'Financial' | 'Social';
  status?: BrokerStatus;
}

export interface ScanResult {
  riskScore: number;
  summary: string;
  dorks: GoogleDork[];
  recommendedBrokers: BrokerGuide[];
}

