import { BreachedService, RiskLevel } from '../types';

export const checkBreaches = async (email: string, usernames: string[] = []): Promise<BreachedService[]> => {
  const accountsToCheck = [email, ...usernames].filter(Boolean);
  const allBreaches: BreachedService[] = [];
  const seenNames = new Set<string>();

  for (const account of accountsToCheck) {
    try {
      const response = await fetch('/api/pwned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account }),
      });

      if (!response.ok) {
        console.error(`Failed to fetch breaches for ${account}:`, response.statusText);
        continue;
      }

      const data = await response.json();

      for (const breach of data) {
        if (!seenNames.has(breach.Name)) {
          seenNames.add(breach.Name);
          allBreaches.push({
            name: breach.Name,
            domain: breach.Domain,
            breachDate: breach.BreachDate,
            description: breach.Description,
            dataClasses: breach.DataClasses,
            riskLevel: mapToRiskLevel(breach.DataClasses),
          });
        }
      }
    } catch (error) {
      console.error(`Error checking breaches for ${account}:`, error);
    }
  }

  return allBreaches;
};

// Helper function to map data classes to a risk level
function mapToRiskLevel(dataClasses: string[]): RiskLevel {
  const criticalData = ['Passwords', 'Credit cards', 'Bank account numbers', 'Social security numbers', 'Passports'];
  const highData = ['Email addresses', 'Physical addresses', 'Phone numbers', 'Dates of birth', 'Biometric data'];

  if (dataClasses.some(dc => criticalData.includes(dc))) {
    return RiskLevel.CRITICAL;
  }

  if (dataClasses.some(dc => highData.includes(dc))) {
    return RiskLevel.HIGH;
  }

  return RiskLevel.MEDIUM;
}
