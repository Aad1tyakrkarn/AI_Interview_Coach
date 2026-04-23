import React from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  if (!isVisible) return null;

  const colorMap = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  return (
    <div className={`fixed bottom-4 right-4 ${colorMap[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50`}>
      <span>{message}</span>
      <button onClick={onClose} className="text-white/80 hover:text-white">&times;</button>
    </div>
  );
};
