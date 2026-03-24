import { render, screen } from '@testing-library/react';
import type { FitRecord } from '../../types/fit';
import { SelectionSummary } from '../inspect/SelectionSummary';

function makeRecord(overrides: Partial<FitRecord> = {}): FitRecord {
  return {
    timestamp: new Date('2024-01-01T10:00:00Z'),
    elapsedTime: 0,
    heartRate: null,
    power: null,
    cadence: null,
    speed: null,
    altitude: null,
    distance: null,
    latitude: null,
    longitude: null,
    temperature: null,
    extraFields: {},
    ...overrides,
  };
}

describe('SelectionSummary', () => {
  it('renders stats for full record set when timeRange is null', () => {
    const records = [
      makeRecord({ elapsedTime: 0, heartRate: 100, distance: 0 }),
      makeRecord({ elapsedTime: 60, heartRate: 120, distance: 1 }),
      makeRecord({ elapsedTime: 120, heartRate: 140, distance: 2 }),
    ];
    render(<SelectionSummary records={records} timeRange={null} />);
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('Avg HR')).toBeInTheDocument();
  });

  it('filters records when timeRange is provided and highlights cards', () => {
    const records = [
      makeRecord({ elapsedTime: 0, heartRate: 100, distance: 0 }),
      makeRecord({ elapsedTime: 60, heartRate: 120, distance: 1 }),
      makeRecord({ elapsedTime: 120, heartRate: 140, distance: 2 }),
      makeRecord({ elapsedTime: 180, heartRate: 160, distance: 3 }),
    ];
    const { container } = render(
      <SelectionSummary records={records} timeRange={{ startTime: 60, endTime: 120 }} />,
    );
    // Cards should have highlight styling (border-blue-300)
    const cards = container.querySelectorAll('[class*="border-blue-300"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('returns null when no records match', () => {
    const records = [
      makeRecord({ elapsedTime: 0 }),
      makeRecord({ elapsedTime: 60 }),
    ];
    const { container } = render(
      <SelectionSummary records={records} timeRange={{ startTime: 200, endTime: 300 }} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows speed when available', () => {
    const records = [
      makeRecord({ elapsedTime: 0, speed: 25.0, distance: 0 }),
      makeRecord({ elapsedTime: 60, speed: 30.0, distance: 1 }),
    ];
    render(<SelectionSummary records={records} timeRange={null} />);
    expect(screen.getByText('Avg Speed')).toBeInTheDocument();
  });

  it('shows power when available', () => {
    const records = [
      makeRecord({ elapsedTime: 0, power: 200, distance: 0 }),
      makeRecord({ elapsedTime: 60, power: 250, distance: 1 }),
    ];
    render(<SelectionSummary records={records} timeRange={null} />);
    expect(screen.getByText('Avg Power')).toBeInTheDocument();
  });

  it('shows cadence when available', () => {
    const records = [
      makeRecord({ elapsedTime: 0, cadence: 85, distance: 0 }),
      makeRecord({ elapsedTime: 60, cadence: 90, distance: 1 }),
    ];
    render(<SelectionSummary records={records} timeRange={null} />);
    expect(screen.getByText('Avg Cadence')).toBeInTheDocument();
  });
});
