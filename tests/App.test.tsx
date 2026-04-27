import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock child components
vi.mock('../components/Scanner', () => {
  return {
    default: ({ onScanComplete }: { onScanComplete: any }) => (
      <div data-testid="mock-scanner">
        <button
          data-testid="trigger-scan"
          onClick={() => onScanComplete({ recommendedBrokers: [{ name: 'TestBroker' }] }, { name: 'Test', location: 'TestCity', email: '' })}
        >
          Mock Scan
        </button>
      </div>
    )
  };
});

vi.mock('../components/BrokerRemoval', () => {
  return {
    default: ({ brokers, userData }: any) => (
      <div data-testid="mock-broker-removal">
        {brokers.map((b: any) => <span key={b.name}>{b.name}</span>)}
        <span>User: {userData.name}</span>
      </div>
    )
  };
});

describe('App Component', () => {
  it('renders the initial layout with Hero and Scanner', () => {
    render(<App />);

    // Check navigation
    expect(screen.getAllByText(/GHOST/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/PROTOCOL/i).length).toBeGreaterThan(0);

    // Check Hero
    expect(screen.getByText(/Reclaim Your/i)).toBeInTheDocument();

    // Check Scanner is rendered
    expect(screen.getByTestId('mock-scanner')).toBeInTheDocument();

    // Check Post-Scan stuff is NOT rendered initially
    expect(screen.queryByTestId('mock-broker-removal')).not.toBeInTheDocument();
  });

  it('renders post-scan components when scan completes', () => {
    render(<App />);

    // Trigger scan complete
    fireEvent.click(screen.getByTestId('trigger-scan'));

    // Hero should be gone
    expect(screen.queryByText(/Reclaim Your/i)).not.toBeInTheDocument();

    // Post-Scan sections should appear
    expect(screen.getByTestId('mock-broker-removal')).toBeInTheDocument();
    expect(screen.getByText('TestBroker')).toBeInTheDocument();
    expect(screen.getByText('User: Test')).toBeInTheDocument();

    // Educational sidebar should appear
    expect(screen.getByText('Proactive Defense')).toBeInTheDocument();
  });
});
