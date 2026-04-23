import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface PolicySection {
  id: string;
  title: string;
  content: string;
}

const policySections: PolicySection[] = [
  {
    id: 'collection',
    title: '1. Information We Collect',
    content:
      'We collect information you provide directly, including your name, email address, and resume data when you create an account. During interview practice sessions, we collect audio and video recordings, transcripts, and performance metrics. We also collect usage data such as browser type, IP address, and interaction patterns to improve our services.',
  },
  {
    id: 'usage',
    title: '2. How We Use Your Information',
    content:
      'Your information is used to provide and improve our AI-powered interview practice platform. This includes generating performance evaluations, providing personalized feedback, and improving our machine learning models. We do not sell your personal information to third parties. AI evaluations are used solely for educational feedback purposes.',
  },
  {
    id: 'storage',
    title: '3. Data Storage & Security',
    content:
      'All data is encrypted at rest and in transit using industry-standard encryption protocols (AES-256, TLS 1.2+). Interview recordings and personal data are stored securely and subject to our data retention policy. We implement access controls, audit logging, and regular security assessments to protect your information.',
  },
  {
    id: 'retention',
    title: '4. Data Retention',
    content:
      'Interview recordings and snapshots are automatically deleted after 7 days unless you choose to save them. Account data is retained while your account is active. Audit logs are retained for 90 days. You may request immediate deletion of your data at any time through the account settings or by contacting support.',
  },
  {
    id: 'rights',
    title: '5. Your Rights',
    content:
      'You have the right to access, correct, or delete your personal data. You may request a copy of all data we hold about you (data portability). You can withdraw consent for data processing at any time. You have the right to lodge a complaint with a supervisory authority. To exercise these rights, visit your account security settings or contact our support team.',
  },
  {
    id: 'cookies',
    title: '6. Cookies & Tracking',
    content:
      'We use essential cookies for authentication and session management. Analytics cookies help us understand how the platform is used. You can manage cookie preferences in your browser settings. We do not use third-party advertising cookies or cross-site tracking.',
  },
  {
    id: 'ai',
    title: '7. AI & Automated Processing',
    content:
      'Our platform uses artificial intelligence to evaluate interview performance. AI-generated scores and feedback are for educational purposes only and do not constitute hiring recommendations. You have the right to understand how AI evaluations are generated, and we provide explanations with each score. No automated decisions with legal or significant effects are made based on AI processing.',
  },
  {
    id: 'sharing',
    title: '8. Information Sharing',
    content:
      'We do not share your personal information with employers or recruiters. Data may be shared with service providers who assist in operating our platform (e.g., cloud hosting), subject to strict data processing agreements. We may disclose information if required by law or to protect our legal rights.',
  },
  {
    id: 'children',
    title: '9. Children\'s Privacy',
    content:
      'Our platform is not intended for users under 16 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will delete it promptly.',
  },
  {
    id: 'changes',
    title: '10. Changes to This Policy',
    content:
      'We may update this privacy policy from time to time. We will notify you of significant changes via email or a prominent notice on our platform. Your continued use of the platform after changes constitutes acceptance of the updated policy.',
  },
  {
    id: 'contact',
    title: '11. Contact Us',
    content:
      'If you have questions about this privacy policy or wish to exercise your data rights, please contact us through the support section in your account settings or email our data protection team.',
  },
];

export const PrivacyPolicyPage: React.FC = () => {
  const { accessToken } = useAuthStore();
  const isAuthenticated = !!accessToken;

  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [activeSection, setActiveSection] = useState(policySections[0].id);
  const [error, setError] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Check acceptance status
  useEffect(() => {
    if (!isAuthenticated) return;
    apiClient
      .get('/security/privacy-policy/status')
      .then((res) => setAccepted(res.data.accepted))
      .catch(() => setAccepted(false));
  }, [isAuthenticated]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;

    // Check if scrolled to bottom (within 50px tolerance)
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    if (isAtBottom) setHasScrolledToBottom(true);

    // Determine active section
    for (let i = policySections.length - 1; i >= 0; i--) {
      const section = policySections[i];
      const sectionEl = sectionRefs.current[section.id];
      if (sectionEl) {
        const rect = sectionEl.getBoundingClientRect();
        const containerRect = el.getBoundingClientRect();
        if (rect.top <= containerRect.top + 100) {
          setActiveSection(section.id);
          break;
        }
      }
    }
  }, []);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      await apiClient.post('/security/privacy-policy/accept', { version: '1.0.0' });
      setAccepted(true);
    } catch {
      setError('Failed to record acceptance. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const el = sectionRefs.current[sectionId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500">
            Last updated: January 1, 2026 &middot; Version 1.0.0
          </p>
          {accepted === true && (
            <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
              <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              You have accepted this privacy policy
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Table of Contents Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="sticky top-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Table of Contents
              </h3>
              <ul className="space-y-1">
                {policySections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => scrollToSection(section.id)}
                      className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        activeSection === section.id
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div
              ref={contentRef}
              onScroll={handleScroll}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 max-h-[70vh] overflow-y-auto"
            >
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  This Privacy Policy describes how we collect, use, store, and protect your personal
                  information when you use our AI-powered interview practice platform. We are committed
                  to protecting your privacy and ensuring the security of your data.
                </p>

                {policySections.map((section) => (
                  <section
                    key={section.id}
                    ref={(el) => {
                      sectionRefs.current[section.id] = el;
                    }}
                    className="mb-8"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{section.title}</h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{section.content}</p>
                  </section>
                ))}
              </div>
            </div>

            {/* Accept Button */}
            {isAuthenticated && accepted === false && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {!hasScrolledToBottom && (
                  <p className="text-sm text-amber-600 mb-3">
                    Please scroll to the bottom of the policy to enable the accept button.
                  </p>
                )}
                {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}
                <button
                  onClick={handleAccept}
                  disabled={!hasScrolledToBottom || accepting}
                  className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                    hasScrolledToBottom && !accepting
                      ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {accepting ? 'Recording acceptance...' : 'I Accept the Privacy Policy'}
                </button>
              </div>
            )}

            {!isAuthenticated && (
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Sign in to accept the privacy policy and manage your data preferences.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
