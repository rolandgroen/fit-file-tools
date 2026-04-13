import type { FitRecord, MetricKey } from '../types/fit';

export interface BestWindowResult {
  startTime: number;
  endTime: number;
  average: number;
  sampleCount: number;
}

/**
 * Finds the best (highest average) N-second window for a given metric
 * using an O(n) sliding window over elapsed-time-sorted records.
 */
export function findBestWindow(
  records: FitRecord[],
  metric: MetricKey,
  windowSeconds: number,
): BestWindowResult | null {
  if (records.length === 0) return null;

  const totalDuration =
    records[records.length - 1].elapsedTime - records[0].elapsedTime;
  if (totalDuration < windowSeconds) return null;

  // Check that at least one record has data for this metric
  if (!records.some((r) => r[metric] !== null)) return null;

  let bestAvg = -Infinity;
  let bestStart = 0;
  let bestEnd = 0;
  let bestSum = 0;
  let bestCount = 0;

  let sum = 0;
  let count = 0;
  let left = 0;

  for (let right = 0; right < records.length; right++) {
    const val = records[right][metric];
    if (val !== null) {
      sum += val as number;
      count++;
    }

    // Shrink window from left until it fits within windowSeconds
    while (
      records[right].elapsedTime - records[left].elapsedTime > windowSeconds
    ) {
      const leftVal = records[left][metric];
      if (leftVal !== null) {
        sum -= leftVal as number;
        count--;
      }
      left++;
    }

    // Check if current window spans exactly windowSeconds
    if (
      records[right].elapsedTime - records[left].elapsedTime >= windowSeconds &&
      count > 0
    ) {
      const avg = sum / count;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestStart = records[left].elapsedTime;
        bestEnd = records[right].elapsedTime;
        bestSum = sum;
        bestCount = count;
      }
    }
  }

  if (bestCount === 0) return null;

  return {
    startTime: bestStart,
    endTime: bestEnd,
    average: bestSum / bestCount,
    sampleCount: bestCount,
  };
}
