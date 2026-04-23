import React from 'react';

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  required?: boolean;
}

export const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({ checked, onChange, label, required = false }) => {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
        required={required}
      />
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
    </label>
  );
};
