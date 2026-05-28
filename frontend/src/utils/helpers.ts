/**
 * Shared utility functions used across the application.
 */

/** Format a WPM number to 1 decimal place. */
export function formatWpm(wpm: number): string {
  return wpm.toFixed(1);
}

/** Format accuracy as a percentage string. */
export function formatAccuracy(accuracy: number): string {
  return `${(accuracy * 100).toFixed(1)}%`;
}

/** Format a duration in seconds to mm:ss. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Debounce a function — returns a debounced version. */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

/** Sleep for n milliseconds (useful in tests and Celery tasks). */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generate a random element from an array. */
export function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Capitalise the first letter of a string. */
export function capitalise(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
