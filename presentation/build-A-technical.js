// VARIATION A — Technical Deep Dive
// Audience: technical panel / engineering reviewers
// Focus: architecture, code, infra, data model, APIs, performance
const pptxgen = require("pptxgenjs");
const { makeShadow, titleBar, footer } = require("./helpers");

const theme = {
  header: "Consolas",
  body: "Calibri",
  primary: "36454F",      // charcoal
  accent: "F5B700",       // amber (engineering)
  bgDark: "1A1F24",
  bgLight: "F7F8FA",
  cardBg: "FFFFFF",
  cardBorder: "D4D9DF",
  text: "1F2937",
  muted: "6B7280",
  titleOnDark: "FFFFFF",
  subtitleOnDark: "D1D5DB",
  mutedOnDark: "9CA3AF",
  codeBg: "0F1419",
  codeText: "D4D4D4",
  codeKeyword: "C586C0",
  codeString: "CE9178",
  codeComment: "6A9955",
};

const FOOTER = "AI Interview Platform · Technical Overview";

function titleSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgDark };

  s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.15, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addShape("rect", { x: 0, y: 5.475, w: 10, h: 0.15, fill: { color: theme.accent }, line: { color: theme.accent } });

  // Mock terminal window
  s.addShape("rect", {
    x: 6, y: 1.1, w: 3.7, h: 3.2,
    fill: { color: theme.codeBg }, line: { color: theme.primary, width: 1 },
    shadow: makeShadow(0.35),
  });
  s.addShape("ellipse", { x: 6.15, y: 1.25, w: 0.18, h: 0.18, fill: { color: "FF5F56" }, line: { color: "FF5F56" } });
  s.addShape("ellipse", { x: 6.4, y: 1.25, w: 0.18, h: 0.18, fill: { color: "FFBD2E" }, line: { color: "FFBD2E" } });
  s.addShape("ellipse", { x: 6.65, y: 1.25, w: 0.18, h: 0.18, fill: { color: "27C93F" }, line: { color: "27C93F" } });

  s.addText([
    { text: "$ npm run dev", options: { color: theme.accent, breakLine: true, bold: true } },
    { text: "→ node-api   :4000 ready", options: { color: theme.codeText, breakLine: true } },
    { text: "→ python-ml  :8000 ready", options: { color: theme.codeText, breakLine: true } },
    { text: "→ frontend   :5173 ready", options: { color: theme.codeText, breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "// Sarah is listening...", options: { color: theme.codeComment, italic: true } },
  ], { x: 6.2, y: 1.6, w: 3.5, h: 2.5, fontFace: "Consolas", fontSize: 11, margin: 0 });

  s.addText("TECHNICAL OVERVIEW", {
    x: 0.6, y: 1.3, w: 5, h: 0.35,
    fontFace: theme.body, fontSize: 12, color: theme.accent, bold: true, charSpacing: 4, margin: 0,
  });
  s.addText("AI Interview\nPreparation Platform", {
    x: 0.6, y: 1.75, w: 5.5, h: 2,
    fontFace: theme.header, fontSize: 38, color: theme.titleOnDark, bold: true, margin: 0,
  });
  s.addShape("rect", { x: 0.6, y: 3.85, w: 1, h: 0.08, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addText("A deep dive into the architecture, code, and engineering choices.", {
    x: 0.6, y: 4.0, w: 5.2, h: 0.5,
    fontFace: theme.body, fontSize: 14, color: theme.subtitleOnDark, italic: true, margin: 0,
  });
  s.addText("Presented by Vivek  ·  Project Evaluation", {
    x: 0.6, y: 4.8, w: 6, h: 0.3,
    fontFace: theme.body, fontSize: 11, color: theme.mutedOnDark, margin: 0,
  });
}

function architectureSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "System Architecture", "Three-service split with a shared data layer");

  // Boxes: Frontend → NodeAPI → PythonML, with DB/Redis below
  const box = (x, y, w, h, label, desc) => {
    s.addShape("rect", { x, y, w, h, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1.5 }, shadow: makeShadow(0.12) });
    s.addShape("rect", { x, y, w, h: 0.25, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addText(label, { x: x + 0.08, y: y + 0.02, w: w - 0.16, h: 0.22, fontFace: theme.header, fontSize: 11, color: theme.titleOnDark, bold: true, margin: 0 });
    s.addText(desc, { x: x + 0.1, y: y + 0.33, w: w - 0.2, h: h - 0.4, fontFace: theme.body, fontSize: 10, color: theme.text, margin: 0 });
  };

  box(0.5, 1.55, 2.9, 1.6, "FRONTEND (React)", "• Vite 6 + TypeScript\n• Zustand store\n• Tailwind CSS\n• WebSpeech API");
  box(3.55, 1.55, 2.9, 1.6, "NODE API (Express)", "• REST endpoints\n• Prisma ORM\n• JOSE JWT\n• Rate limiting");
  box(6.6, 1.55, 2.9, 1.6, "PYTHON ML (FastAPI)", "• Groq LLaMA 3.3\n• FAISS vector store\n• spaCy parser\n• Edge-TTS");

  // Arrows between boxes
  s.addShape("rightArrow", { x: 3.4, y: 2.25, w: 0.2, h: 0.3, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addShape("rightArrow", { x: 6.45, y: 2.25, w: 0.2, h: 0.3, fill: { color: theme.accent }, line: { color: theme.accent } });

  // Data layer (full width)
  s.addShape("rect", { x: 0.5, y: 3.5, w: 9, h: 1.2, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1.5 }, shadow: makeShadow(0.12) });
  s.addShape("rect", { x: 0.5, y: 3.5, w: 9, h: 0.25, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addText("DATA LAYER", { x: 0.58, y: 3.52, w: 8.8, h: 0.22, fontFace: theme.header, fontSize: 11, color: theme.bgDark, bold: true, margin: 0 });
  s.addText("PostgreSQL (Neon serverless) — users, interviews, answers, scores, audit logs", {
    x: 0.6, y: 3.85, w: 8.8, h: 0.3, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0,
  });
  s.addText("Redis (with in-memory fallback) — sessions, rate-limit counters, TTS audio cache", {
    x: 0.6, y: 4.2, w: 8.8, h: 0.3, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0,
  });

  // Down arrows from each service to data layer
  [2.0, 5.0, 8.0].forEach((x) => {
    s.addShape("downArrow", { x: x - 0.1, y: 3.2, w: 0.2, h: 0.25, fill: { color: theme.accent }, line: { color: theme.accent } });
  });

  footer(s, theme, FOOTER, 2);
}

function frontendSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "Frontend Engineering", "React 18 + Vite + TypeScript monorepo");

  // Left: key libraries table
  s.addText("KEY LIBRARIES", { x: 0.5, y: 1.5, w: 4, h: 0.3, fontFace: theme.header, fontSize: 11, color: theme.accent, bold: true, charSpacing: 2, margin: 0 });
  const rows = [
    ["Build", "Vite 6 + SWC"],
    ["State", "Zustand (slices)"],
    ["Router", "React Router 6"],
    ["Styling", "Tailwind CSS + dark mode"],
    ["HTTP", "Axios + React Query"],
    ["Media", "WebSpeech / MediaPipe"],
  ];
  rows.forEach((r, i) => {
    const y = 1.85 + i * 0.45;
    s.addShape("rect", { x: 0.5, y, w: 4.3, h: 0.4, fill: { color: i % 2 === 0 ? theme.cardBg : "EEF1F4" }, line: { color: theme.cardBorder, width: 0.5 } });
    s.addText(r[0], { x: 0.6, y: y + 0.06, w: 1.3, h: 0.3, fontFace: theme.header, fontSize: 11, color: theme.primary, bold: true, margin: 0 });
    s.addText(r[1], { x: 1.95, y: y + 0.06, w: 2.8, h: 0.3, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
  });

  // Right: code snippet
  s.addShape("rect", { x: 5.1, y: 1.5, w: 4.5, h: 3.4, fill: { color: theme.codeBg }, line: { color: theme.primary, width: 1 }, shadow: makeShadow(0.15) });
  s.addText("useConversationalInterview.ts", {
    x: 5.25, y: 1.6, w: 4.2, h: 0.3, fontFace: "Consolas", fontSize: 10, color: theme.mutedOnDark, italic: true, margin: 0,
  });
  s.addText([
    { text: "const", options: { color: theme.codeKeyword, breakLine: false } },
    { text: " startInterview = ", options: { color: theme.codeText, breakLine: false } },
    { text: "async", options: { color: theme.codeKeyword, breakLine: false } },
    { text: " () => {", options: { color: theme.codeText, breakLine: true } },
    { text: "  await storeStart(id);", options: { color: theme.codeText, breakLine: true } },
    { text: "  await tts.speak(intro);", options: { color: theme.codeText, breakLine: true } },
    { text: "  listenToUser();", options: { color: theme.codeText, breakLine: true } },
    { text: "};", options: { color: theme.codeText, breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "// auto-submit on 3s silence", options: { color: theme.codeComment, italic: true, breakLine: true } },
    { text: "if (silenceMs > 3000) submit();", options: { color: theme.codeText } },
  ], { x: 5.25, y: 1.95, w: 4.2, h: 2.8, fontFace: "Consolas", fontSize: 11, margin: 0 });

  footer(s, theme, FOOTER, 3);
}

function backendSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "Backend Engineering", "Layered Express service with Prisma");

  // Layered diagram on left
  const layers = [
    { name: "Routes", desc: "HTTP entry, validation (Zod)" },
    { name: "Controllers", desc: "Request → service calls" },
    { name: "Services", desc: "Business logic, transactions" },
    { name: "Prisma ORM", desc: "Type-safe DB access" },
    { name: "PostgreSQL", desc: "Neon serverless" },
  ];
  layers.forEach((l, i) => {
    const y = 1.55 + i * 0.65;
    s.addShape("rect", { x: 0.5, y, w: 4.5, h: 0.55, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 }, shadow: makeShadow(0.08) });
    s.addShape("rect", { x: 0.5, y, w: 0.1, h: 0.55, fill: { color: theme.accent }, line: { color: theme.accent } });
    s.addText(l.name, { x: 0.7, y: y + 0.07, w: 1.6, h: 0.3, fontFace: theme.header, fontSize: 12, color: theme.primary, bold: true, margin: 0 });
    s.addText(l.desc, { x: 2.3, y: y + 0.1, w: 2.6, h: 0.3, fontFace: theme.body, fontSize: 10, color: theme.text, margin: 0 });
  });

  // Right: endpoints list
  s.addText("REST ENDPOINTS (sample)", { x: 5.3, y: 1.5, w: 4, h: 0.3, fontFace: theme.header, fontSize: 11, color: theme.accent, bold: true, charSpacing: 2, margin: 0 });
  const endpoints = [
    ["POST", "/auth/register"],
    ["POST", "/auth/login"],
    ["POST", "/interviews"],
    ["POST", "/interviews/:id/start"],
    ["POST", "/interviews/:id/answer"],
    ["GET",  "/interviews/:id/score"],
    ["GET",  "/admin/metrics"],
  ];
  endpoints.forEach((e, i) => {
    const y = 1.9 + i * 0.4;
    s.addShape("rect", { x: 5.3, y, w: 0.7, h: 0.32, fill: { color: e[0] === "POST" ? theme.accent : theme.primary }, line: { color: "FFFFFF" } });
    s.addText(e[0], { x: 5.3, y: y + 0.03, w: 0.7, h: 0.26, fontFace: theme.header, fontSize: 9, color: e[0] === "POST" ? theme.bgDark : theme.titleOnDark, bold: true, align: "center", margin: 0 });
    s.addText(e[1], { x: 6.1, y: y + 0.03, w: 3.5, h: 0.28, fontFace: "Consolas", fontSize: 11, color: theme.text, margin: 0 });
  });

  footer(s, theme, FOOTER, 4);
}

function mlSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "ML & AI Pipeline", "From user voice to scored answer");

  // Horizontal pipeline: Voice → STT → Groq → RAG → Score
  const stages = [
    { label: "Audio in", desc: "Mic stream" },
    { label: "STT", desc: "WebSpeech" },
    { label: "Sarah LLM", desc: "Groq LLaMA 3.3" },
    { label: "RAG match", desc: "FAISS vector" },
    { label: "Score", desc: "Weighted rubric" },
  ];
  const startX = 0.5, w = 1.75, gap = 0.1, y = 1.65;
  stages.forEach((st, i) => {
    const x = startX + i * (w + gap);
    s.addShape("rect", { x, y, w, h: 1.0, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 }, shadow: makeShadow(0.1) });
    s.addShape("ellipse", { x: x + w / 2 - 0.2, y: y + 0.1, w: 0.4, h: 0.4, fill: { color: theme.accent }, line: { color: theme.accent } });
    s.addText(String(i + 1), { x: x + w / 2 - 0.2, y: y + 0.1, w: 0.4, h: 0.4, fontFace: theme.header, fontSize: 13, color: theme.bgDark, bold: true, align: "center", valign: "middle", margin: 0 });
    s.addText(st.label, { x: x + 0.08, y: y + 0.55, w: w - 0.16, h: 0.25, fontFace: theme.header, fontSize: 11, color: theme.primary, bold: true, align: "center", margin: 0 });
    s.addText(st.desc, { x: x + 0.08, y: y + 0.78, w: w - 0.16, h: 0.22, fontFace: theme.body, fontSize: 9, color: theme.muted, align: "center", margin: 0 });
    if (i < stages.length - 1) {
      s.addShape("rightArrow", { x: x + w + 0.005, y: y + 0.4, w: 0.1, h: 0.2, fill: { color: theme.accent }, line: { color: theme.accent } });
    }
  });

  // Below: scoring rubric weights
  s.addText("SCORING RUBRIC (weighted)", { x: 0.5, y: 3.1, w: 9, h: 0.3, fontFace: theme.header, fontSize: 11, color: theme.accent, bold: true, charSpacing: 2, margin: 0 });
  const rubric = [
    { k: "Technical",       v: 30 },
    { k: "Communication",   v: 20 },
    { k: "Problem Solving", v: 20 },
    { k: "Relevance",       v: 15 },
    { k: "Depth",           v: 15 },
  ];
  rubric.forEach((r, i) => {
    const y2 = 3.5 + i * 0.35;
    s.addText(r.k, { x: 0.5, y: y2, w: 2, h: 0.3, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
    const barMax = 6.5;
    s.addShape("rect", { x: 2.6, y: y2 + 0.06, w: barMax, h: 0.2, fill: { color: "E5E7EB" }, line: { color: "E5E7EB" } });
    s.addShape("rect", { x: 2.6, y: y2 + 0.06, w: barMax * (r.v / 30), h: 0.2, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addText(`${r.v}%`, { x: 9.2, y: y2, w: 0.7, h: 0.3, fontFace: theme.header, fontSize: 11, color: theme.primary, bold: true, align: "right", margin: 0 });
  });

  footer(s, theme, FOOTER, 5);
}

function voiceCameraSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "Voice + Camera Pipeline", "Real-time feedback without leaving the browser");

  // 2 columns: Voice | Camera
  const column = (x, title, items) => {
    s.addShape("rect", { x, y: 1.55, w: 4.4, h: 3.5, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 }, shadow: makeShadow(0.12) });
    s.addShape("rect", { x, y: 1.55, w: 4.4, h: 0.5, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addText(title, { x: x + 0.15, y: 1.63, w: 4.1, h: 0.35, fontFace: theme.header, fontSize: 14, color: theme.titleOnDark, bold: true, margin: 0 });
    items.forEach((t, i) => {
      const y = 2.25 + i * 0.45;
      s.addShape("rect", { x: x + 0.2, y: y + 0.12, w: 0.12, h: 0.12, fill: { color: theme.accent }, line: { color: theme.accent } });
      s.addText(t, { x: x + 0.42, y, w: 3.85, h: 0.4, fontFace: theme.body, fontSize: 12, color: theme.text, margin: 0 });
    });
  };

  column(0.5, "VOICE PIPELINE", [
    "WebSpeech API — browser STT (no server)",
    "Silence detector — 3s auto-submit",
    "Edge-TTS — neural voice (server-side)",
    "Volume meter — detects user interrupt",
    "WPM + filler-word counter",
    "Mutes mic while Sarah speaks",
  ]);
  column(5.1, "CAMERA PIPELINE", [
    "getUserMedia — browser-native",
    "MediaPipe FaceMesh — eye contact score",
    "Pose detection — posture score",
    "Smile detector — confidence signal",
    "Runs locally (no video upload)",
    "Metrics streamed to coaching panel",
  ]);

  footer(s, theme, FOOTER, 6);
}

function dataModelSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "Data Model", "Simplified Prisma schema view");

  const table = (x, y, title, cols) => {
    s.addShape("rect", { x, y, w: 2.9, h: 0.45 + cols.length * 0.32, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 }, shadow: makeShadow(0.1) });
    s.addShape("rect", { x, y, w: 2.9, h: 0.4, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addText(title, { x: x + 0.1, y: y + 0.05, w: 2.7, h: 0.3, fontFace: theme.header, fontSize: 12, color: theme.titleOnDark, bold: true, margin: 0 });
    cols.forEach((c, i) => {
      s.addText(c, { x: x + 0.15, y: y + 0.45 + i * 0.3, w: 2.7, h: 0.28, fontFace: "Consolas", fontSize: 10, color: theme.text, margin: 0 });
    });
  };

  table(0.5, 1.55, "User", ["id  String @id", "email String @unique", "passwordHash String", "isActive  Boolean", "resume   Resume?"]);
  table(3.55, 1.55, "Interview", ["id  String @id", "userId  String", "mode  Mode", "status  Status", "durationMinutes Int"]);
  table(6.6, 1.55, "InterviewQuestion", ["id  String @id", "interviewId  String", "questionText  String", "answerText   String?", "score  Float?"]);
  table(0.5, 3.75, "Score", ["interviewId  String @id", "technical   Float", "communication  Float", "problemSolving  Float", "overall  Float"]);
  table(3.55, 3.75, "AuditLog", ["id  String @id", "userId  String", "action  String", "createdAt DateTime"]);

  s.addText("All tables use CUID2 IDs · soft deletes via isActive flag", {
    x: 6.6, y: 4.15, w: 3, h: 0.4, fontFace: theme.body, fontSize: 11, color: theme.muted, italic: true, margin: 0,
  });

  footer(s, theme, FOOTER, 7);
}

function securitySlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "Security & Auth", "Modern primitives over legacy choices");

  const items = [
    { k: "Password hashing", old: "bcrypt", now: "Argon2id", why: "Memory-hard, winner of PHC" },
    { k: "JWT library",      old: "jsonwebtoken", now: "jose",   why: "Modern, promise-based, WebCrypto" },
    { k: "Session cache",    old: "node memory",  now: "Redis (ioredis)",  why: "Clusterable, TTL built-in" },
    { k: "Rate limiting",    old: "none",         now: "rate-limit-redis",  why: "Distributed counters" },
    { k: "Email verification", old: "skipped",    now: "Nodemailer + OTP",  why: "Prevents fake signups" },
    { k: "HTTPS",            old: "http",         now: "enforced",          why: "TLS 1.3 on all env" },
  ];

  s.addShape("rect", { x: 0.5, y: 1.55, w: 9, h: 0.4, fill: { color: theme.primary }, line: { color: theme.primary } });
  s.addText("Area",  { x: 0.6, y: 1.6, w: 2.1, h: 0.3, fontFace: theme.header, fontSize: 11, color: theme.titleOnDark, bold: true, margin: 0 });
  s.addText("Before", { x: 2.8, y: 1.6, w: 1.8, h: 0.3, fontFace: theme.header, fontSize: 11, color: theme.titleOnDark, bold: true, margin: 0 });
  s.addText("Now",    { x: 4.7, y: 1.6, w: 2.0, h: 0.3, fontFace: theme.header, fontSize: 11, color: theme.titleOnDark, bold: true, margin: 0 });
  s.addText("Why",    { x: 6.8, y: 1.6, w: 2.7, h: 0.3, fontFace: theme.header, fontSize: 11, color: theme.titleOnDark, bold: true, margin: 0 });

  items.forEach((it, i) => {
    const y = 1.97 + i * 0.48;
    s.addShape("rect", { x: 0.5, y, w: 9, h: 0.44, fill: { color: i % 2 === 0 ? theme.cardBg : "EEF1F4" }, line: { color: theme.cardBorder, width: 0.5 } });
    s.addText(it.k,   { x: 0.6, y: y + 0.07, w: 2.1, h: 0.3, fontFace: theme.body, fontSize: 11, color: theme.text, bold: true, margin: 0 });
    s.addText(it.old, { x: 2.8, y: y + 0.07, w: 1.8, h: 0.3, fontFace: "Consolas", fontSize: 10, color: theme.muted, strike: true, margin: 0 });
    s.addText(it.now, { x: 4.7, y: y + 0.07, w: 2.0, h: 0.3, fontFace: "Consolas", fontSize: 10, color: theme.primary, bold: true, margin: 0 });
    s.addText(it.why, { x: 6.8, y: y + 0.07, w: 2.7, h: 0.3, fontFace: theme.body, fontSize: 10, color: theme.text, margin: 0 });
  });

  footer(s, theme, FOOTER, 8);
}

function performanceSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "Performance & Reliability", "Measured on dev machine");

  // Stat tiles
  const stats = [
    { n: "< 3s", l: "TTS round trip", sub: "Groq intro + Edge-TTS" },
    { n: "~120ms", l: "STT latency", sub: "WebSpeech streaming" },
    { n: "30 fps", l: "Camera analysis", sub: "MediaPipe on-device" },
    { n: "99%", l: "Auto-save success", sub: "On each answer submit" },
  ];
  stats.forEach((st, i) => {
    const x = 0.5 + i * 2.4;
    s.addShape("rect", { x, y: 1.55, w: 2.2, h: 1.3, fill: { color: theme.primary }, line: { color: theme.primary }, shadow: makeShadow(0.2) });
    s.addShape("rect", { x, y: 1.55, w: 2.2, h: 0.08, fill: { color: theme.accent }, line: { color: theme.accent } });
    s.addText(st.n, { x, y: 1.7, w: 2.2, h: 0.55, fontFace: theme.header, fontSize: 26, color: theme.titleOnDark, bold: true, align: "center", margin: 0 });
    s.addText(st.l, { x, y: 2.28, w: 2.2, h: 0.3, fontFace: theme.body, fontSize: 11, color: theme.accent, bold: true, align: "center", charSpacing: 1, margin: 0 });
    s.addText(st.sub, { x, y: 2.58, w: 2.2, h: 0.3, fontFace: theme.body, fontSize: 9, color: theme.subtitleOnDark, align: "center", margin: 0 });
  });

  // Reliability notes
  s.addText("RELIABILITY MECHANISMS", { x: 0.5, y: 3.2, w: 9, h: 0.3, fontFace: theme.header, fontSize: 11, color: theme.accent, bold: true, charSpacing: 2, margin: 0 });
  const notes = [
    "Auto-save after every answer — if tab crashes, progress is kept",
    "Redis has an in-memory fallback for dev or when Redis is down",
    "Backward-compat login: old bcrypt hashes auto-upgrade to Argon2id",
    "Python ML service has health endpoint; Node API retries on cold start",
  ];
  notes.forEach((n, i) => {
    const y = 3.6 + i * 0.38;
    s.addShape("rect", { x: 0.5, y: y + 0.12, w: 0.12, h: 0.12, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addText(n, { x: 0.7, y, w: 9, h: 0.35, fontFace: theme.body, fontSize: 12, color: theme.text, margin: 0 });
  });

  footer(s, theme, FOOTER, 9);
}

function engineeringProgressSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "Engineering Progress", "What is shipped, tested, and running");

  const done = [
    "Auth flow: register, OTP verify, login, forgot password",
    "Interview flow: setup → consent → live voice → complete",
    "Sarah persona + dynamic question generation via Groq",
    "RAG pipeline (FAISS) with 31 seed questions + ideal answers",
    "Resume parser (spaCy + pdfplumber), 200+ skills dictionary",
    "Camera + voice coaching panel with live metrics",
    "Admin dashboard with charts and audit logs",
    "Dark mode across frontend and admin",
  ];

  const half = Math.ceil(done.length / 2);
  const col1 = done.slice(0, half);
  const col2 = done.slice(half);

  const makeCol = (arr, x) => {
    arr.forEach((t, i) => {
      const y = 1.6 + i * 0.5;
      s.addShape("ellipse", { x, y: y + 0.05, w: 0.3, h: 0.3, fill: { color: theme.primary }, line: { color: theme.primary } });
      s.addText("\u2713", { x, y: y + 0.05, w: 0.3, h: 0.3, fontFace: theme.header, fontSize: 13, color: theme.titleOnDark, bold: true, align: "center", valign: "middle", margin: 0 });
      s.addText(t, { x: x + 0.4, y: y + 0.08, w: 4.2, h: 0.35, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
    });
  };
  makeCol(col1, 0.5);
  makeCol(col2, 5.2);

  footer(s, theme, FOOTER, 10);
}

function techDebtSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "Known Gaps & Tech Debt", "What an engineer would flag");

  const items = [
    { sev: "HIGH",   k: "E2E tests",       d: "No Playwright/Cypress suite yet — relying on manual testing" },
    { sev: "HIGH",   k: "Production deploy", d: "Only dev environment configured; no CI/CD to prod hosts" },
    { sev: "MED",    k: "Error tracking",  d: "No Sentry or similar; errors only in console" },
    { sev: "MED",    k: "Observability",   d: "No structured logs, metrics, or traces yet" },
    { sev: "LOW",    k: "Mobile layout",   d: "Interview page optimized for desktop; mobile needs polish" },
    { sev: "LOW",    k: "i18n",           d: "Strings hardcoded in English only" },
  ];

  items.forEach((it, i) => {
    const y = 1.55 + i * 0.6;
    s.addShape("rect", { x: 0.5, y, w: 9, h: 0.52, fill: { color: theme.cardBg }, line: { color: theme.cardBorder, width: 0.5 } });
    const sevColor = it.sev === "HIGH" ? "DC2626" : it.sev === "MED" ? "F59E0B" : "6B7280";
    s.addShape("rect", { x: 0.5, y, w: 0.9, h: 0.52, fill: { color: sevColor }, line: { color: sevColor } });
    s.addText(it.sev, { x: 0.5, y: y + 0.12, w: 0.9, h: 0.3, fontFace: theme.header, fontSize: 11, color: "FFFFFF", bold: true, align: "center", margin: 0 });
    s.addText(it.k, { x: 1.55, y: y + 0.07, w: 2.5, h: 0.3, fontFace: theme.header, fontSize: 12, color: theme.primary, bold: true, margin: 0 });
    s.addText(it.d, { x: 4.1, y: y + 0.1, w: 5.4, h: 0.35, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
  });

  footer(s, theme, FOOTER, 11);
}

function qaSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgDark };

  s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.15, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addShape("rect", { x: 0, y: 5.475, w: 10, h: 0.15, fill: { color: theme.accent }, line: { color: theme.accent } });

  s.addText("Questions?", {
    x: 0.6, y: 1.8, w: 9, h: 1.2,
    fontFace: theme.header, fontSize: 60, color: theme.titleOnDark, bold: true, margin: 0,
  });
  s.addShape("rect", { x: 0.6, y: 3.15, w: 1.2, h: 0.08, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addText("Happy to dive deeper into any layer — frontend, backend, ML, infra.", {
    x: 0.6, y: 3.3, w: 9, h: 0.5,
    fontFace: theme.body, fontSize: 16, color: theme.subtitleOnDark, italic: true, margin: 0,
  });

  // Repo-style footer
  s.addText([
    { text: "$ git log --oneline | head", options: { color: theme.accent, bold: true, breakLine: true } },
    { text: "feat: sarah dynamic questions", options: { color: theme.codeText, breakLine: true } },
    { text: "feat: rag scoring pipeline", options: { color: theme.codeText, breakLine: true } },
    { text: "chore: argon2 migration", options: { color: theme.codeText } },
  ], { x: 0.6, y: 4.1, w: 9, h: 1.2, fontFace: "Consolas", fontSize: 11, margin: 0 });
}

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Vivek";
  pres.title = "AI Interview Platform — Technical Overview";

  titleSlide(pres);
  architectureSlide(pres);
  frontendSlide(pres);
  backendSlide(pres);
  mlSlide(pres);
  voiceCameraSlide(pres);
  dataModelSlide(pres);
  securitySlide(pres);
  performanceSlide(pres);
  engineeringProgressSlide(pres);
  techDebtSlide(pres);
  qaSlide(pres);

  await pres.writeFile({ fileName: "V_A_Technical_DeepDive.pptx" });
  console.log("Built V_A_Technical_DeepDive.pptx");
}

main().catch((e) => { console.error(e); process.exit(1); });
