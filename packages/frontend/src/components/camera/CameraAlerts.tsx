import React, { useState, useEffect, useCallback } from 'react';

export interface CameraAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  dismissable?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface CameraAlertsProps {
  alerts: CameraAlert[];
  onDismiss?: (id: string) => void;
  autoDismissMs?: number;
}

const alertStyles: Record<CameraAlert['type'], { container: string; icon: string }> = {
  error: {
    container: 'bg-red-900/90 border-red-500 text-red-100',
    icon: 'text-red-300',
  },
  warning: {
    container: 'bg-yellow-900/90 border-yellow-500 text-yellow-100',
    icon: 'text-yellow-300',
  },
  info: {
    container: 'bg-blue-900/90 border-blue-500 text-blue-100',
    icon: 'text-blue-300',
  },
};

const AlertIcon: React.FC<{ type: CameraAlert['type'] }> = ({ type }) => {
  if (type === 'error') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );
  }
  if (type === 'warning') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
};

const AlertItem: React.FC<{
  alert: CameraAlert;
  onDismiss?: (id: string) => void;
  autoDismissMs: number;
}> = ({ alert, onDismiss, autoDismissMs }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoDismissMs > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onDismiss?.(alert.id), 300);
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [alert.id, autoDismissMs, onDismiss]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => onDismiss?.(alert.id), 300);
  }, [alert.id, onDismiss]);

  const styles = alertStyles[alert.type];

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all duration-300 ${styles.container} ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      role="alert"
    >
      <div className={styles.icon}>
        <AlertIcon type={alert.type} />
      </div>
      <p className="flex-1 text-sm font-medium">{alert.message}</p>
      {alert.action && (
        <button
          onClick={alert.action.onClick}
          className="rounded-md bg-white dark:bg-gray-800/20 px-3 py-1 text-xs font-semibold transition-colors hover:bg-white/30"
        >
          {alert.action.label}
        </button>
      )}
      {(alert.dismissable !== false) && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 rounded-full p-0.5 transition-colors hover:bg-white/20"
          aria-label="Dismiss alert"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export const CameraAlerts: React.FC<CameraAlertsProps> = ({
  alerts,
  onDismiss,
  autoDismissMs = 5000,
}) => {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {alerts.map(alert => (
        <AlertItem
          key={alert.id}
          alert={alert}
          onDismiss={onDismiss}
          autoDismissMs={autoDismissMs}
        />
      ))}
    </div>
  );
};
