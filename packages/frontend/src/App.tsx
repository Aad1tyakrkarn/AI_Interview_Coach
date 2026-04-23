import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { useUiStore } from './store/uiStore';
import { useAuthStore } from './store/authStore';

// Landing page
import { LandingPage } from './pages/LandingPage';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { TwoFactorSetupPage } from './pages/auth/TwoFactorSetupPage';

// Dashboard pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { InterviewHistoryPage } from './pages/dashboard/InterviewHistoryPage';

// Profile pages
import { ProfilePage } from './pages/profile/ProfilePage';
import { ResumePage } from './pages/profile/ResumePage';
import { SecurityPage } from './pages/profile/SecurityPage';

// Interview pages
import { InterviewSetupPage } from './pages/interview/InterviewSetupPage';
import { InterviewPage } from './pages/interview/InterviewPage';
import { InterviewCompletePage } from './pages/interview/InterviewCompletePage';
import { ConsentPage } from './pages/interview/ConsentPage';

// Review pages
import { ReviewPage } from './pages/review/ReviewPage';
import { TranscriptPage } from './pages/review/TranscriptPage';
import { ScorePage } from './pages/review/ScorePage';
import { ReportPage } from './pages/review/ReportPage';

// Legal pages
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage';
import { TermsPage } from './pages/legal/TermsPage';

// Error pages
import { NotFoundPage } from './pages/errors/NotFoundPage';

export const App: React.FC = () => {
  const theme = useUiStore((s) => s.theme);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }, [theme]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Landing page — unauthenticated: landing, authenticated: dashboard */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />

          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Protected routes — standalone (no navbar/sidebar) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/interview/:id" element={<InterviewPage />} />
          </Route>

          {/* Protected routes — with layout (navbar/sidebar) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/history" element={<InterviewHistoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/resumes" element={<ResumePage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/2fa-setup" element={<TwoFactorSetupPage />} />
              <Route path="/interview/setup" element={<InterviewSetupPage />} />
              <Route path="/interview/:id/complete" element={<InterviewCompletePage />} />
              <Route path="/interview/:id/consent" element={<ConsentPage />} />
              <Route path="/review/:id" element={<ReviewPage />} />
              <Route path="/review/:id/transcript" element={<TranscriptPage />} />
              <Route path="/review/:id/score" element={<ScorePage />} />
              <Route path="/review/:id/report" element={<ReportPage />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};
