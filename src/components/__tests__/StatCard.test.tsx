import { render, screen } from '@testing-library/react';
import { StatCard } from '../inspect/ActivitySummary';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Avg HR" value="150" />);
    expect(screen.getByText('Avg HR')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('renders unit when provided', () => {
    render(<StatCard label="Power" value="250" unit="W" />);
    expect(screen.getByText('W')).toBeInTheDocument();
  });

  it('does not render unit when not provided', () => {
    const { container } = render(<StatCard label="Duration" value="1:30:00" />);
    const spans = container.querySelectorAll('span');
    // No unit span should be present
    const unitSpans = Array.from(spans).filter((s) => s.classList.contains('text-xs'));
    expect(unitSpans).toHaveLength(0);
  });

  it('applies highlight styling when highlight=true', () => {
    const { container } = render(<StatCard label="HR" value="160" highlight={true} />);
    const card = container.firstElementChild!;
    expect(card.className).toContain('border-blue-300');
    expect(card.className).toContain('bg-blue-50');
  });

  it('applies default styling when highlight is not set', () => {
    const { container } = render(<StatCard label="HR" value="160" />);
    const card = container.firstElementChild!;
    expect(card.className).toContain('border-gray-200');
    expect(card.className).toContain('bg-white');
  });
});
