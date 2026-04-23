import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

interface RegisterFormProps {
  onSubmit: (data: { firstName: string; lastName: string; email: string; password: string }) => void;
  isLoading?: boolean;
  error?: string | null;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isLoading = false, error }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const errors: FormErrors = {};
    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), email, password });
    }
  };

  const clearError = (field: keyof FormErrors) => {
    setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const inputClass = (field: keyof FormErrors) =>
    `w-full px-4 py-2.5 border rounded-lg outline-none transition-colors focus:ring-2
    bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
    placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-60
    ${validationErrors[field]
      ? 'border-red-500 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/50'
      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-900/50'}`;

  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1';

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className={labelClass}>
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => { setFirstName(e.target.value); clearError('firstName'); }}
            placeholder="John"
            className={inputClass('firstName')}
            disabled={isLoading}
          />
          {validationErrors.firstName && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.firstName}</p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => { setLastName(e.target.value); clearError('lastName'); }}
            placeholder="Doe"
            className={inputClass('lastName')}
            disabled={isLoading}
          />
          {validationErrors.lastName && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="reg-email" className={labelClass}>
          Email Address
        </label>
        <input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
          placeholder="you@example.com"
          className={inputClass('email')}
          disabled={isLoading}
          autoComplete="email"
        />
        {validationErrors.email && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="reg-password" className={labelClass}>
          Password
        </label>
        <div className="relative">
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
            placeholder="Create a strong password"
            className={`${inputClass('password')} pr-10`}
            disabled={isLoading}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {validationErrors.password && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.password}</p>
        )}
        <PasswordStrengthMeter password={password} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className={labelClass}>
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
          placeholder="Confirm your password"
          className={inputClass('confirmPassword')}
          disabled={isLoading}
          autoComplete="new-password"
        />
        {validationErrors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.confirmPassword}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800
          text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2
          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      >
        {isLoading && (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {isLoading ? 'Creating account...' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
};
