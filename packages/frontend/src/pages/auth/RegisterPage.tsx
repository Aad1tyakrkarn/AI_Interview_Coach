import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { ThemeToggle } from '../../components/common/ThemeToggle';

export const RegisterPage: React.FC = () => {
  const { register, isLoading, error, clearError } = useAuthStore();
  const [success, setSuccess] = useState(false);

  const handleRegister = async (data: { firstName: string; lastName: string; email: string; password: string }) => {
    clearError();
    try {
      await register(data);
      setSuccess(true);
    } catch {
      // error is set in store
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center px-4 py-8 transition-colors relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create an Account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Get started with your interview preparation</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Check Your Email</h2>
              <p className="text-gray-500 dark:text-gray-400">
                We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
              </p>
              <Link
                to="/login"
                className="inline-block mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <RegisterForm onSubmit={handleRegister} isLoading={isLoading} error={error} />
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link to="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">Privacy Policy</Link>
          <span className="mx-2">|</span>
          <Link to="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
};
