import React from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/common/ThemeToggle';

// ─── Navbar ───────────────────────────────────────────────────────────────
const Navbar: React.FC = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </div>
        <span className="text-lg font-bold text-gray-900 dark:text-white">InterviewAI</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <a href="#features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
        <a href="#how-it-works" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">How It Works</a>
        <a href="#tech" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Tech Stack</a>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link to="/login" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-2">
          Login
        </Link>
        <Link to="/register" className="text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 px-5 py-2 rounded-full transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40">
          Get Started
        </Link>
      </div>
    </div>
  </nav>
);

// ─── Hero ─────────────────────────────────────────────────────────────────
const Hero: React.FC = () => (
  <section className="pt-32 pb-20 px-6 relative overflow-hidden">
    {/* Background gradient orbs */}
    <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
    <div className="absolute top-40 right-1/4 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl" />

    <div className="max-w-5xl mx-auto text-center relative z-10">
      <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full px-4 py-1.5 mb-8">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Powered by LLaMA 3.3 70B + Real-Time AI</span>
      </div>

      <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tight">
        Practice Interviews
        <br />
        <span className="bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent">
          with AI Coach Sarah
        </span>
      </h1>

      <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
        Get real-time feedback on your answers, body language, eye contact, and speaking pace.
        Dynamic questions adapt to your skills. Resume-based preparation. Detailed scoring report.
      </p>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link to="/register" className="group inline-flex items-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 px-8 py-3.5 rounded-full transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]">
          Start Practicing Free
          <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
        <a href="#how-it-works" className="inline-flex items-center gap-2 text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-8 py-3.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-750 transition-all">
          <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          See How It Works
        </a>
      </div>

      {/* Mock interview UI */}
      <div className="mt-16 max-w-4xl mx-auto">
        <div className="rounded-2xl bg-gray-900 dark:bg-gray-800 border border-gray-700/50 shadow-2xl shadow-black/20 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700/50">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
            <span className="ml-4 text-xs text-gray-500">Practice Coach — Interview Session</span>
          </div>
          <div className="flex">
            <div className="w-[30%] bg-gray-950 p-4 flex items-center justify-center border-r border-gray-700/50">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 mx-auto flex items-center justify-center mb-2">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                  </svg>
                </div>
                <div className="flex justify-center gap-2">
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Eye 85%</span>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Posture 92%</span>
                </div>
              </div>
            </div>
            <div className="w-[45%] p-4 space-y-3">
              <div className="flex gap-2">
                <div className="h-7 w-7 rounded-full bg-emerald-600/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-emerald-300">S</span>
                </div>
                <div className="bg-gray-800/60 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-gray-200 leading-relaxed">
                  I see you worked on HobbyMet with MongoDB GeoJSON. How did you implement the geospatial queries for event discovery?
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="bg-indigo-600/20 rounded-xl rounded-tr-sm px-3 py-2 text-xs text-gray-200 leading-relaxed">
                  I used MongoDB's $near operator with 2dsphere indexing...
                </div>
                <div className="h-7 w-7 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-indigo-300">U</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-7 w-7 rounded-full bg-emerald-600/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-emerald-300">S</span>
                </div>
                <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-emerald-200 leading-relaxed">
                  Great answer! You explained the indexing well. Try mentioning query optimization techniques next time.
                </div>
              </div>
            </div>
            <div className="w-[25%] bg-gray-900/50 p-3 border-l border-gray-700/50">
              <p className="text-[10px] font-semibold text-emerald-400 mb-2">Coaching Panel</p>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span className="text-[10px] text-gray-500">Eye Contact</span><span className="text-[10px] text-green-400">85%</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-gray-500">Posture</span><span className="text-[10px] text-green-400">92%</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-gray-500">Voice</span><span className="text-[10px] text-green-400">142 wpm</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-gray-500">Fillers</span><span className="text-[10px] text-green-400">1</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Features ─────────────────────────────────────────────────────────────
const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    title: 'AI Interviewer Sarah',
    desc: 'Dynamic, context-aware questions that adapt to your answers. Sarah remembers what you said and digs deeper — just like a real interviewer.',
    color: 'emerald',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: 'Resume-Based Questions',
    desc: 'Upload your resume — spaCy NLP extracts skills, projects, and experience. Sarah asks about YOUR background, not generic textbook questions.',
    color: 'blue',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Real-Time Body Language',
    desc: 'Camera tracks eye contact, posture, blink rate, and lighting. Voice analysis measures WPM, filler words, and speaking confidence.',
    color: 'purple',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: 'RAG-Powered Evaluation',
    desc: 'Answers compared against ideal references using FAISS vector search. Weighted scoring rubric: Technical (30%), Communication (20%), Problem Solving (20%).',
    color: 'amber',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
      </svg>
    ),
    title: 'Practice & Mock Modes',
    desc: 'Practice Coach: real-time tips, pause/skip, encouraging feedback. Mock Interview: timed, no hints, professional evaluation — just like the real thing.',
    color: 'rose',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: 'Detailed Score Report',
    desc: 'Per-question scoring with strengths, improvements, and concept coverage. Track your progress across multiple interviews over time.',
    color: 'cyan',
  },
];

const colorMap: Record<string, string> = {
  emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-500',
  blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-500',
  purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-500',
  amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-500',
  rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-500',
  cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-500',
};

const Features: React.FC = () => (
  <section id="features" className="py-20 px-6">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <span className="text-sm font-semibold text-emerald-500 uppercase tracking-wider">Features</span>
        <h2 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Everything you need to ace interviews</h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">AI-powered preparation that goes beyond flashcards and mock questions</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div key={i} className="group rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-all hover:shadow-lg dark:hover:shadow-black/20">
            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colorMap[f.color]} border flex items-center justify-center mb-4`}>
              {f.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── How It Works ─────────────────────────────────────────────────────────
const steps = [
  { num: '01', title: 'Upload Your Resume', desc: 'spaCy NLP + pdfplumber extract your skills, projects, education, and experience automatically.', icon: '📄' },
  { num: '02', title: 'Start Interview', desc: 'Sarah asks dynamic questions based on your resume and target role. Voice + camera active for real-time coaching.', icon: '🎙️' },
  { num: '03', title: 'Get Detailed Report', desc: 'Weighted scoring across technical accuracy, communication, problem-solving. RAG-powered ideal answer comparison.', icon: '📊' },
];

const HowItWorks: React.FC = () => (
  <section id="how-it-works" className="py-20 px-6 bg-gray-50 dark:bg-gray-900/50">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <span className="text-sm font-semibold text-emerald-500 uppercase tracking-wider">How It Works</span>
        <h2 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Three steps to interview confidence</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-4xl mb-4">{s.icon}</div>
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Step {s.num}</span>
            <h3 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{s.title}</h3>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{s.desc}</p>
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2">
                <svg className="w-6 h-6 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Tech Stack ───────────────────────────────────────────────────────────
const techItems = [
  { name: 'React 18', cat: 'Frontend' },
  { name: 'TypeScript', cat: 'Language' },
  { name: 'FastAPI', cat: 'ML Backend' },
  { name: 'Groq LLaMA 3.3 70B', cat: 'AI Engine' },
  { name: 'spaCy Transformer', cat: 'NLP' },
  { name: 'FAISS', cat: 'Vector Search' },
  { name: 'PostgreSQL', cat: 'Database' },
  { name: 'Prisma', cat: 'ORM' },
  { name: 'Argon2id', cat: 'Security' },
  { name: 'Redis', cat: 'Cache' },
  { name: 'MediaPipe', cat: 'Computer Vision' },
  { name: 'Edge TTS', cat: 'Voice' },
  { name: 'Whisper', cat: 'Speech-to-Text' },
  { name: 'Socket.io', cat: 'Real-Time' },
  { name: 'Tailwind CSS', cat: 'Styling' },
  { name: 'Docker', cat: 'Deployment' },
];

const TechStack: React.FC = () => (
  <section id="tech" className="py-20 px-6">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <span className="text-sm font-semibold text-emerald-500 uppercase tracking-wider">Tech Stack</span>
        <h2 className="mt-3 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Built with cutting-edge technology</h2>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {techItems.map((t, i) => (
          <div key={i} className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-colors">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5">{t.cat}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── CTA ──────────────────────────────────────────────────────────────────
const CTA: React.FC = () => (
  <section className="py-20 px-6">
    <div className="max-w-3xl mx-auto text-center">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-500/10 to-blue-600/10 dark:from-emerald-500/5 dark:to-blue-600/5 border border-emerald-500/20 dark:border-emerald-500/10 p-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Ready to ace your next interview?</h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Start practicing with Sarah today. No credit card required.</p>
        <Link to="/register" className="inline-flex items-center gap-2 mt-8 text-base font-semibold text-white bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 px-8 py-3.5 rounded-full transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]">
          Create Free Account
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  </section>
);

// ─── Footer ───────────────────────────────────────────────────────────────
const Footer: React.FC = () => (
  <footer className="border-t border-gray-200 dark:border-gray-800 py-8 px-6">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">Built by Vivek Ranjan</span>
      </div>
      <div className="flex items-center gap-6">
        <Link to="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Privacy</Link>
        <Link to="/terms" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Terms</Link>
        <a href="https://github.com/vivekranjan0144" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">GitHub</a>
      </div>
    </div>
  </footer>
);

// ─── Landing Page ─────────────────────────────────────────────────────────
export const LandingPage: React.FC = () => (
  <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors scroll-smooth">
    <Navbar />
    <Hero />
    <Features />
    <HowItWorks />
    <TechStack />
    <CTA />
    <Footer />
  </div>
);
