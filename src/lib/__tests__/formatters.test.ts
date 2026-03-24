import {
  formatDuration,
  formatElapsedTime,
  formatDistance,
  formatDate,
  formatFileSize,
  formatNumber,
} from '../formatters';

describe('formatDuration', () => {
  it('formats 0 seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('formats seconds only', () => {
    expect(formatDuration(59)).toBe('0:59');
  });

  it('formats exact minute', () => {
    expect(formatDuration(60)).toBe('1:00');
  });

  it('formats hours, minutes, seconds', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('pads minutes and seconds in hour format', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
  });
});

describe('formatElapsedTime', () => {
  it('delegates to formatDuration', () => {
    expect(formatElapsedTime(3661)).toBe(formatDuration(3661));
    expect(formatElapsedTime(0)).toBe(formatDuration(0));
  });
});

describe('formatDistance', () => {
  it('formats sub-km distances in meters', () => {
    expect(formatDistance(0.5)).toBe('500 m');
  });

  it('formats distances >= 1km in km', () => {
    expect(formatDistance(1)).toBe('1.00 km');
    expect(formatDistance(42.195)).toBe('42.20 km');
  });

  it('handles 0', () => {
    expect(formatDistance(0)).toBe('0 m');
  });
});

describe('formatDate', () => {
  it('formats a known date', () => {
    const date = new Date(2024, 0, 15, 14, 30); // Jan 15, 2024 14:30
    expect(formatDate(date)).toBe('Jan 15, 2024 14:30');
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });
});

describe('formatNumber', () => {
  it('returns dash for null', () => {
    expect(formatNumber(null)).toBe('—');
  });

  it('formats with 0 decimals by default', () => {
    expect(formatNumber(42)).toBe('42');
  });

  it('formats with 1 decimal', () => {
    expect(formatNumber(3.14159, 1)).toBe('3.1');
  });

  it('formats with 2 decimals', () => {
    expect(formatNumber(3.14159, 2)).toBe('3.14');
  });
});
