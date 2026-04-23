// Interview status normalisation + UI metadata
// Prisma enum: CREATED | IN_PROGRESS | PAUSED | COMPLETED | ABANDONED

export type InterviewStatus =
  | 'created'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'abandoned';

export interface StatusMeta {
  key: InterviewStatus;
  /** Human label for badges and text */
  label: string;
  /** Tailwind classes for a pill/badge (light + dark) */
  badgeClass: string;
  /** Longer description shown e.g. on the review page banner */
  description: string;
  /** What the next action is — "continue" (go live), "review" (show report), "none" */
  action: 'continue' | 'review' | 'none';
  /** Label for the primary action button */
  actionLabel: string;
  /** Tailwind classes for the primary action button */
  actionClass: string;
}

const META: Record<InterviewStatus, StatusMeta> = {
  created: {
    key: 'created',
    label: 'Not started',
    badgeClass:
      'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300',
    description: 'This interview is ready to begin. Pick up where you left off.',
    action: 'continue',
    actionLabel: 'Start Now',
    actionClass: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  in_progress: {
    key: 'in_progress',
    label: 'In progress',
    badgeClass:
      'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300',
    description: 'You left this interview mid-way. Continue from where you stopped.',
    action: 'continue',
    actionLabel: 'Continue',
    actionClass: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  paused: {
    key: 'paused',
    label: 'Paused',
    badgeClass:
      'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
    description: 'This interview is paused. Resume whenever you are ready.',
    action: 'continue',
    actionLabel: 'Resume',
    actionClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  completed: {
    key: 'completed',
    label: 'Completed',
    badgeClass:
      'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300',
    description: 'This interview is complete. View the detailed review.',
    action: 'review',
    actionLabel: 'View Review',
    actionClass: 'bg-green-600 hover:bg-green-700 text-white',
  },
  abandoned: {
    key: 'abandoned',
    label: 'Abandoned',
    badgeClass:
      'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    description:
      'This interview was abandoned. You can review what was recorded so far.',
    action: 'review',
    actionLabel: 'Open',
    actionClass: 'bg-gray-600 hover:bg-gray-700 text-white',
  },
};

/** Normalise any case, any shape ("CREATED", "in_progress", "  Completed  ") to our key. */
export function normaliseStatus(raw: unknown): InterviewStatus {
  if (!raw || typeof raw !== 'string') return 'created';
  const cleaned = raw.trim().toLowerCase().replace(/-/g, '_');
  if (cleaned in META) return cleaned as InterviewStatus;
  // legacy / alternate names
  if (cleaned === 'pending' || cleaned === 'new') return 'created';
  if (cleaned === 'running' || cleaned === 'active') return 'in_progress';
  if (
    cleaned === 'cancelled' ||
    cleaned === 'canceled' ||
    cleaned === 'failed' ||
    cleaned === 'expired' ||
    cleaned === 'timed_out' ||
    cleaned === 'timeout'
  ) {
    return 'abandoned';
  }
  return 'created';
}

export function getStatusMeta(raw: unknown): StatusMeta {
  return META[normaliseStatus(raw)];
}

/** Where should the user go when they click the row / primary action. */
export function getPrimaryPath(raw: unknown, interviewId: string): string {
  const meta = getStatusMeta(raw);
  if (meta.action === 'continue') return `/interview/${interviewId}`;
  return `/review/${interviewId}`;
}
