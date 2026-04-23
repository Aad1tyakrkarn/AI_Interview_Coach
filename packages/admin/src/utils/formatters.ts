/**
 * Format a date string or Date object into a human-readable format.
 */
export const formatDate = (
  value: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
};

/**
 * Format a numeric score as a percentage string.
 */
export const formatScore = (score: number, decimals = 1): string => {
  if (score < 0 || score > 100) return '--';
  return `${score.toFixed(decimals)}%`;
};

/**
 * Format a duration in minutes into a human-readable string.
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 0) return '--';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
};
