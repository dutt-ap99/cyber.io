import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { test, expect, vi, describe, beforeEach } from 'vitest';
import Scanner from './Scanner';
import { analyzeDigitalFootprint } from '../services/geminiService';
import { RiskLevel } from '../types';

vi.mock('../services/geminiService');

describe('Scanner component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('renders form correctly', () => {
    render(<Scanner onScanComplete={vi.fn()} />);
    expect(screen.getByText('Vulnerability Scanner')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. San Francisco, CA')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('For deeper analysis')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Initiate Scan/i })).toBeInTheDocument();
  });

  test('handles input changes', () => {
    render(<Scanner onScanComplete={vi.fn()} />);

    const nameInput = screen.getByPlaceholderText('e.g. John Doe') as HTMLInputElement;
    const locationInput = screen.getByPlaceholderText('e.g. San Francisco, CA') as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText('For deeper analysis') as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    expect(nameInput.value).toBe('Test User');

    fireEvent.change(locationInput, { target: { value: 'Test City' } });
    expect(locationInput.value).toBe('Test City');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  test('does not submit if required fields are empty', async () => {
    const mockOnScanComplete = vi.fn();
    render(<Scanner onScanComplete={mockOnScanComplete} />);

    const submitButton = screen.getByRole('button', { name: /Initiate Scan/i });
    fireEvent.click(submitButton);

    expect(analyzeDigitalFootprint).not.toHaveBeenCalled();
    expect(mockOnScanComplete).not.toHaveBeenCalled();
  });

  test('submits form and displays results correctly', async () => {
    const mockOnScanComplete = vi.fn();
    const mockResult = {
      riskScore: 85,
      summary: 'High risk detected in public records.',
      dorks: [
        {
          title: 'Basic Search',
          query: '"Test User"',
          description: 'Find exact matches',
          risk: RiskLevel.LOW
        }
      ],
      recommendedBrokers: []
    };

    (analyzeDigitalFootprint as any).mockResolvedValue(mockResult);

    render(<Scanner onScanComplete={mockOnScanComplete} />);

    const nameInput = screen.getByPlaceholderText('e.g. John Doe');
    const locationInput = screen.getByPlaceholderText('e.g. San Francisco, CA');
    const emailInput = screen.getByPlaceholderText('For deeper analysis');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(locationInput, { target: { value: 'Test City' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /Initiate Scan/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/Initializing Deep Scan.../i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(analyzeDigitalFootprint).toHaveBeenCalledWith('Test User', 'Test City', 'test@example.com');
    });

    await waitFor(() => {
      expect(mockOnScanComplete).toHaveBeenCalledWith(mockResult, {
        name: 'Test User',
        location: 'Test City',
        email: 'test@example.com'
      });
    });

    expect(screen.getByText('85/100')).toBeInTheDocument();
    expect(screen.getByText('High risk detected in public records.')).toBeInTheDocument();
    expect(screen.getByText('Basic Search')).toBeInTheDocument();
    expect(screen.getByText('"Test User"')).toBeInTheDocument();
  });

  test('handles submission errors gracefully', async () => {
    const mockOnScanComplete = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (analyzeDigitalFootprint as any).mockRejectedValue(new Error('API Error'));

    render(<Scanner onScanComplete={mockOnScanComplete} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. John Doe'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. San Francisco, CA'), { target: { value: 'Test City' } });

    fireEvent.click(screen.getByRole('button', { name: /Initiate Scan/i }));

    await waitFor(() => {
      expect(analyzeDigitalFootprint).toHaveBeenCalled();
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Initiate Scan/i })).not.toBeDisabled();

    consoleErrorSpy.mockRestore();
  });

  test('displays correct styling for different risk levels and charts', async () => {
    const mockOnScanComplete = vi.fn();
    const mockResult = {
      riskScore: 30, // Emerald
      summary: 'Low risk.',
      dorks: [
        { title: 'Critical', query: 'q1', description: 'd1', risk: RiskLevel.CRITICAL },
        { title: 'High', query: 'q2', description: 'd2', risk: RiskLevel.HIGH },
        { title: 'Medium', query: 'q3', description: 'd3', risk: RiskLevel.MEDIUM },
        { title: 'Low', query: 'q4', description: 'd4', risk: RiskLevel.LOW },
      ],
      recommendedBrokers: []
    };

    (analyzeDigitalFootprint as any).mockResolvedValue(mockResult);

    render(<Scanner onScanComplete={mockOnScanComplete} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. John Doe'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. San Francisco, CA'), { target: { value: 'Test City' } });
    fireEvent.click(screen.getByRole('button', { name: /Initiate Scan/i }));

    await waitFor(() => {
      expect(screen.getByText('30/100')).toBeInTheDocument();
    });

    // Check specific risk text colors are applied based on risk level
    // Looking up from the title to the parent container
    const criticalContainer = screen.getByText('Critical').closest('.border');
    expect(criticalContainer).toHaveClass('text-red-500');

    const highContainer = screen.getByText('High').closest('.border');
    expect(highContainer).toHaveClass('text-orange-500');

    const mediumContainer = screen.getByText('Medium').closest('.border');
    expect(mediumContainer).toHaveClass('text-yellow-500');

    const lowContainer = screen.getByText('Low').closest('.border');
    expect(lowContainer).toHaveClass('text-cyber-500');
  });

  test('copy to clipboard functionality works', async () => {
    // Setup clipboard mock
    const writeTextMock = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const mockOnScanComplete = vi.fn();
    const mockResult = {
      riskScore: 50,
      summary: 'Summary',
      dorks: [{ title: 'Dork', query: '"My Secret Query"', description: 'Desc', risk: RiskLevel.LOW }],
      recommendedBrokers: []
    };

    (analyzeDigitalFootprint as any).mockResolvedValue(mockResult);

    render(<Scanner onScanComplete={mockOnScanComplete} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. John Doe'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. San Francisco, CA'), { target: { value: 'Test City' } });
    fireEvent.click(screen.getByRole('button', { name: /Initiate Scan/i }));

    await waitFor(() => {
      expect(screen.getByText('"My Secret Query"')).toBeInTheDocument();
    });

    const copyButton = screen.getByTitle('Copy Query');
    fireEvent.click(copyButton);

    expect(writeTextMock).toHaveBeenCalledWith('"My Secret Query"');
  });
});
