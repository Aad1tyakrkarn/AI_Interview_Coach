/**
 * Format a Date object to a human-readable string.
 * @param date - The date to format
 * @param locale - The locale string (default: 'en-US')
 * @returns Formatted date string
 */
export function formatDate(date: Date, locale: string = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format a duration in seconds to a human-readable string (e.g., "1h 23m 45s").
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return '0s';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Get a relative time string (e.g., "5 minutes ago", "2 hours ago").
 * @param date - The date to compare against now
 * @returns Relative time string
 */
export function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  if (diffSeconds < 2592000) {
    const days = Math.floor(diffSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  if (diffSeconds < 31536000) {
    const months = Math.floor(diffSeconds / 2592000);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
  const years = Math.floor(diffSeconds / 31536000);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}
