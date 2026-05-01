import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import BrokerRemoval from '../components/BrokerRemoval';
import { generateRemovalInstructions, generateDeletionEmail } from '../services/geminiService';

vi.mock('../services/geminiService', () => ({
  generateRemovalInstructions: vi.fn(),
  generateDeletionEmail: vi.fn(),
}));

describe('BrokerRemoval', () => {
  const mockUserData = { name: 'John Doe', email: 'john@example.com', location: 'New York' };
  const mockBrokers = [
    {
      name: 'Spokeo',
      url: 'https://www.spokeo.com/optout',
      difficulty: 'Easy' as const,
      timeToComplete: '5 mins',
      category: 'People Search' as const,
      status: 'pending' as const
    },
    {
      name: 'Whitepages',
      url: 'https://www.whitepages.com/suppression-requests',
      difficulty: 'Medium' as const,
      timeToComplete: '10 mins',
      category: 'People Search' as const,
      status: 'pending' as const
    }
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(generateRemovalInstructions).mockResolvedValue('Default instructions');
    vi.mocked(generateDeletionEmail).mockResolvedValue('Default email');
  });

  it('renders "No specific brokers identified" when broker list is empty', () => {
    render(<BrokerRemoval brokers={[]} userData={mockUserData} />);
    expect(screen.getByText('Data Removal Workflow')).toBeTruthy();
    expect(screen.getByText('No specific brokers identified yet. Run a scan first.')).toBeTruthy();
  });

  it('renders a list of brokers correctly', () => {
    render(<BrokerRemoval brokers={mockBrokers} userData={mockUserData} />);
    expect(screen.getByText('Spokeo')).toBeTruthy();
    expect(screen.getByText('Whitepages')).toBeTruthy();
    expect(screen.queryByText('No specific brokers identified yet. Run a scan first.')).toBeNull();
  });

  it('fetches and displays AI removal guide when a broker is clicked', async () => {
    vi.mocked(generateRemovalInstructions).mockResolvedValue('# Step 1: Go to optout page\n# Step 2: Submit form');

    render(<BrokerRemoval brokers={mockBrokers} userData={mockUserData} />);

    // Click on Spokeo broker
    fireEvent.click(screen.getByText('Spokeo'));

    // Wait for the loading state to finish and the text to appear
    await waitFor(() => {
      expect(generateRemovalInstructions).toHaveBeenCalledWith('Spokeo');
    });

    expect(await screen.findByText('Step 1: Go to optout page')).toBeTruthy();
    expect(await screen.findByText('Step 2: Submit form')).toBeTruthy();

    // Check if the link is present
    const link = screen.getByText(/Open Spokeo Opt-Out Page/i);
    expect(link.getAttribute('href')).toBe('https://www.spokeo.com/optout');
  });

  it('handles error when fetching AI removal guide fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(generateRemovalInstructions).mockRejectedValue(new Error('API failure'));

    render(<BrokerRemoval brokers={[mockBrokers[0]]} userData={mockUserData} />);
    fireEvent.click(screen.getByText('Spokeo'));

    await waitFor(() => {
      expect(generateRemovalInstructions).toHaveBeenCalled();
    });

    expect(await screen.findByText('Failed to load instructions. Please try again.')).toBeTruthy();
    consoleSpy.mockRestore();
  });

  it('fetches and displays Legal Deletion Request email', async () => {
    vi.mocked(generateDeletionEmail).mockResolvedValue('Dear Spokeo, please delete my data.');

    render(<BrokerRemoval brokers={[mockBrokers[0]]} userData={mockUserData} />);
    fireEvent.click(screen.getByText('Spokeo'));

    // Wait for instructions to finish (since it opens guide by default)
    await waitFor(() => expect(generateRemovalInstructions).toHaveBeenCalled());

    // Click on Legal Deletion Request tab
    fireEvent.click(screen.getByText(/Legal Deletion Request/i));

    await waitFor(() => {
      expect(generateDeletionEmail).toHaveBeenCalledWith('Spokeo', {
        name: 'John Doe',
        email: 'john@example.com',
        address: 'New York'
      });
    });

    // Check if the text area contains the email template
    const textArea = await screen.findByRole('textbox');
    expect(textArea).toBeTruthy();
    expect((textArea as HTMLTextAreaElement).value).toBe('Dear Spokeo, please delete my data.');
  });

  it('allows updating broker status', async () => {
    render(<BrokerRemoval brokers={[mockBrokers[0]]} userData={mockUserData} />);

    fireEvent.click(screen.getByText('Spokeo'));

    // Check default status label
    // Note: multiple span elements might have the text, but let's just verify update works by looking at the UI changes
    // Wait for expansion
    await waitFor(() => expect(screen.getByText('Update Status')).toBeTruthy());

    // Click 'completed' status button
    const completedButton = screen.getByRole('button', { name: /removed/i }); // getStatusConfig maps 'completed' to 'Removed'
    fireEvent.click(completedButton);

    // Check if progress bar updated or visual style changed (e.g. text-emerald-500)
    // The name "Spokeo" should have text-emerald-500 class when completed
    const brokerName = screen.getByText('Spokeo');
    expect(brokerName.className).toContain('text-emerald-500');
  });
});
