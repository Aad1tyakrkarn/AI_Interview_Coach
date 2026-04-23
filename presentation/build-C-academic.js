// VARIATION C — Academic SDLC Report
// Audience: college faculty / traditional project viva
// Focus: abstract, objectives, literature gap, methodology, modules, testing, results, conclusion
const pptxgen = require("pptxgenjs");
const { makeShadow, titleBar, footer } = require("./helpers");

const theme = {
  header: "Georgia",
  body: "Calibri",
  primary: "1E2761",      // navy
  accent: "B5651D",       // academic brown-gold
  bgDark: "0B1437",
  bgLight: "FAFAF7",      // warm paper feel
  cardBg: "FFFFFF",
  cardBorder: "CFD4E6",
  text: "1E2761",
  muted: "5C6B95",
  titleOnDark: "FFFFFF",
  subtitleOnDark: "CADCFC",
  mutedOnDark: "9FB0DC",
};

const FOOTER = "AI Interview Platform · Project Report";

function sectionNumber(slide, n) {
  slide.addShape("rect", { x: 0.5, y: 0.45, w: 0.45, h: 0.35, fill: { color: theme.primary }, line: { color: theme.primary } });
  slide.addText(`${n}`, { x: 0.5, y: 0.45, w: 0.45, h: 0.35, fontFace: theme.header, fontSize: 14, color: theme.titleOnDark, bold: true, align: "center", valign: "middle", margin: 0 });
}

function formalHeader(slide, number, title, subtitle) {
  sectionNumber(slide, number);
  slide.addText(title, {
    x: 1.1, y: 0.4, w: 9, h: 0.55, fontFace: theme.header, fontSize: 26, color: theme.text, bold: true, margin: 0,
  });
  slide.addShape("rect", { x: 1.1, y: 0.98, w: 0.6, h: 0.04, fill: { color: theme.accent }, line: { color: theme.accent } });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 1.1, y: 1.05, w: 9, h: 0.3, fontFace: theme.body, fontSize: 12, color: theme.muted, italic: true, margin: 0,
    });
  }
}

function titleSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };

  // Top and bottom formal bars
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.4, fill: { color: theme.primary }, line: { color: theme.primary } });
  s.addShape("rect", { x: 0, y: 0.4, w: 10, h: 0.04, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addShape("rect", { x: 0, y: 5.225, w: 10, h: 0.04, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addShape("rect", { x: 0, y: 5.265, w: 10, h: 0.36, fill: { color: theme.primary }, line: { color: theme.primary } });

  s.addText("PROJECT REPORT · EVALUATION", {
    x: 0.5, y: 0.08, w: 9, h: 0.25, fontFace: theme.body, fontSize: 11, color: theme.titleOnDark, bold: true, charSpacing: 4, align: "center", margin: 0,
  });

  // Main title
  s.addText("A Voice-First AI Platform\nfor Interview Preparation", {
    x: 0.8, y: 1.2, w: 8.4, h: 1.7, fontFace: theme.header, fontSize: 36, color: theme.primary, bold: true, align: "center", margin: 0,
  });
  s.addShape("rect", { x: 4.5, y: 2.95, w: 1.0, h: 0.06, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addText("Using Large Language Models, Retrieval-Augmented Generation,\nand Real-Time Multimodal Feedback", {
    x: 0.8, y: 3.1, w: 8.4, h: 0.8, fontFace: theme.body, fontSize: 14, color: theme.muted, italic: true, align: "center", margin: 0,
  });

  // Info block
  s.addShape("rect", { x: 2, y: 4.1, w: 6, h: 0.95, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 } });
  s.addText([
    { text: "Submitted by: ", options: { bold: true, color: theme.primary } },
    { text: "Vivek", options: { color: theme.text, breakLine: true } },
    { text: "Course: ", options: { bold: true, color: theme.primary } },
    { text: "B.Tech / Final Project", options: { color: theme.text, breakLine: true } },
    { text: "Submitted for: ", options: { bold: true, color: theme.primary } },
    { text: "Mid-project Evaluation", options: { color: theme.text } },
  ], {
    x: 2.2, y: 4.2, w: 5.6, h: 0.8, fontFace: theme.body, fontSize: 12, margin: 0,
  });

  s.addText("Project Report · Evaluation Stage", {
    x: 0.5, y: 5.31, w: 9, h: 0.25, fontFace: theme.body, fontSize: 11, color: theme.titleOnDark, charSpacing: 3, align: "center", margin: 0,
  });
}

function abstractSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  formalHeader(s, "01", "Abstract", "Brief summary of the project");

  // Left vertical accent
  s.addShape("rect", { x: 0.5, y: 1.55, w: 0.1, h: 3.6, fill: { color: theme.accent }, line: { color: theme.accent } });

  s.addText(
    "This project presents an AI-based interview preparation platform designed to help students and job seekers practice mock interviews in a realistic way. Unlike traditional text-based tools, the proposed system uses voice, camera, and resume data to simulate a complete interview experience.",
    { x: 0.8, y: 1.55, w: 8.8, h: 1.1, fontFace: theme.body, fontSize: 13, color: theme.text, margin: 0 },
  );
  s.addText(
    "A Large Language Model (Groq LLaMA 3.3) acts as the AI interviewer. A Retrieval-Augmented Generation (RAG) pipeline is used to compare candidate answers with ideal answers. Facial and pose analysis give feedback on eye contact and posture.",
    { x: 0.8, y: 2.75, w: 8.8, h: 1.0, fontFace: theme.body, fontSize: 13, color: theme.text, margin: 0 },
  );
  s.addText(
    "The platform follows the Agile SDLC model and is built as a three-tier microservice architecture. It is intended to serve as a low-cost, always-available practice tool for placement preparation.",
    { x: 0.8, y: 3.85, w: 8.8, h: 1.2, fontFace: theme.body, fontSize: 13, color: theme.text, margin: 0 },
  );

  // Keywords
  s.addShape("rect", { x: 0.5, y: 4.85, w: 9, h: 0.35, fill: { color: "EEF1F9" }, line: { color: theme.cardBorder } });
  s.addText([
    { text: "Keywords: ", options: { bold: true, color: theme.primary } },
    { text: "LLM, RAG, FAISS, SDLC, MediaPipe, Interview Preparation, Voice Interface", options: { color: theme.text, italic: true } },
  ], { x: 0.65, y: 4.88, w: 8.8, h: 0.3, fontFace: theme.body, fontSize: 11, margin: 0 });

  footer(s, theme, FOOTER, 2);
}

function problemObjectivesSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  formalHeader(s, "02", "Problem Statement & Objectives");

  // Left: problem
  s.addShape("rect", { x: 0.5, y: 1.55, w: 4.4, h: 3.6, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 } });
  s.addShape("rect", { x: 0.5, y: 1.55, w: 4.4, h: 0.45, fill: { color: theme.primary }, line: { color: theme.primary } });
  s.addText("Problem Statement", { x: 0.65, y: 1.63, w: 4.1, h: 0.3, fontFace: theme.header, fontSize: 13, color: theme.titleOnDark, bold: true, margin: 0 });
  s.addText(
    "Students preparing for interviews have limited access to realistic practice. Human mock interviews are expensive and hard to schedule. Existing online tools rely on typed text, do not read the candidate's resume, and cannot give feedback on voice or body language. This leaves a gap between preparation and the actual interview experience.",
    { x: 0.7, y: 2.15, w: 4.0, h: 2.9, fontFace: theme.body, fontSize: 12, color: theme.text, margin: 0 },
  );

  // Right: objectives (numbered)
  s.addShape("rect", { x: 5.1, y: 1.55, w: 4.4, h: 3.6, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 } });
  s.addShape("rect", { x: 5.1, y: 1.55, w: 4.4, h: 0.45, fill: { color: theme.primary }, line: { color: theme.primary } });
  s.addText("Objectives", { x: 5.25, y: 1.63, w: 4.1, h: 0.3, fontFace: theme.header, fontSize: 13, color: theme.titleOnDark, bold: true, margin: 0 });

  const objectives = [
    "Build an AI interviewer that asks personalised questions from a user's resume.",
    "Enable natural voice interaction using speech-to-text and neural text-to-speech.",
    "Provide real-time feedback on posture, eye contact, and speaking rate.",
    "Score answers using a weighted rubric across five skill categories.",
    "Offer both Practice and Mock modes with different interaction rules.",
  ];
  objectives.forEach((o, i) => {
    const y = 2.15 + i * 0.58;
    s.addText(`(${i + 1})`, { x: 5.3, y, w: 0.45, h: 0.3, fontFace: theme.header, fontSize: 12, color: theme.accent, bold: true, margin: 0 });
    s.addText(o, { x: 5.75, y, w: 3.65, h: 0.55, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
  });

  footer(s, theme, FOOTER, 3);
}

function literatureSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  formalHeader(s, "03", "Literature Review", "Existing systems and the gap we address");

  // Table
  const rows = [
    ["System",                "Input",        "Feedback",               "Resume-aware", "Cost"],
    ["InterviewBuddy",         "Video call",   "Human-only",             "No",           "High"],
    ["Pramp",                  "Peer call",    "Peer subjective",        "No",           "Free"],
    ["MockRabbit",             "Typed text",   "Keyword matching",       "No",           "Low"],
    ["Interview Warmup (G)",   "Voice",        "Only transcript review", "No",           "Free"],
    ["This work",              "Voice + camera", "LLM + RAG + MediaPipe",  "Yes",          "Free"],
  ];
  const startX = 0.5, startY = 1.55;
  const cellWs = [2.2, 1.7, 2.4, 1.4, 1.3];
  rows.forEach((r, ri) => {
    const y = startY + ri * 0.55;
    r.forEach((cell, ci) => {
      const x = startX + cellWs.slice(0, ci).reduce((a, b) => a + b, 0);
      const isHeader = ri === 0;
      const isUs = ri === rows.length - 1;
      s.addShape("rect", {
        x, y, w: cellWs[ci], h: 0.5,
        fill: { color: isHeader ? theme.primary : (isUs ? "EEF1F9" : theme.cardBg) },
        line: { color: theme.cardBorder, width: 0.5 },
      });
      s.addText(cell, {
        x: x + 0.1, y: y + 0.12, w: cellWs[ci] - 0.2, h: 0.3,
        fontFace: isHeader ? theme.header : theme.body,
        fontSize: isHeader ? 11 : 10,
        bold: isHeader || isUs,
        color: isHeader ? theme.titleOnDark : (isUs ? theme.primary : theme.text),
        margin: 0,
      });
    });
  });

  // Research gap note
  s.addShape("rect", { x: 0.5, y: 4.9, w: 9, h: 0.3, fill: { color: theme.accent, transparency: 70 }, line: { color: theme.accent, transparency: 50 } });
  s.addText([
    { text: "Research Gap: ", options: { bold: true, color: theme.primary } },
    { text: "No existing tool combines resume-aware LLM questions with real-time multimodal coaching.", options: { color: theme.text, italic: true } },
  ], { x: 0.65, y: 4.93, w: 8.8, h: 0.25, fontFace: theme.body, fontSize: 10, margin: 0 });

  footer(s, theme, FOOTER, 4);
}

function requirementsSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  formalHeader(s, "04", "Software Requirements", "Functional and non-functional");

  // Two columns
  s.addShape("rect", { x: 0.5, y: 1.55, w: 4.4, h: 3.55, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 } });
  s.addShape("rect", { x: 0.5, y: 1.55, w: 4.4, h: 0.4, fill: { color: theme.primary }, line: { color: theme.primary } });
  s.addText("4.1 Functional Requirements", { x: 0.65, y: 1.6, w: 4.1, h: 0.3, fontFace: theme.header, fontSize: 12, color: theme.titleOnDark, bold: true, margin: 0 });

  const fr = [
    "FR1 — User registration with email verification",
    "FR2 — Secure login with session token",
    "FR3 — Resume upload and skill extraction",
    "FR4 — Interview setup (mode, role, duration)",
    "FR5 — Dynamic question generation via LLM",
    "FR6 — Voice-based candidate interaction",
    "FR7 — Real-time camera-based feedback",
    "FR8 — Automated answer scoring and report",
  ];
  fr.forEach((t, i) => {
    s.addText(t, { x: 0.7, y: 2.05 + i * 0.37, w: 4.1, h: 0.33, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
  });

  s.addShape("rect", { x: 5.1, y: 1.55, w: 4.4, h: 3.55, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 } });
  s.addShape("rect", { x: 5.1, y: 1.55, w: 4.4, h: 0.4, fill: { color: theme.primary }, line: { color: theme.primary } });
  s.addText("4.2 Non-Functional Requirements", { x: 5.25, y: 1.6, w: 4.1, h: 0.3, fontFace: theme.header, fontSize: 12, color: theme.titleOnDark, bold: true, margin: 0 });

  const nfr = [
    "NFR1 — TTS response under 3 seconds",
    "NFR2 — Passwords hashed using Argon2id",
    "NFR3 — Stateless JWT-based authentication",
    "NFR4 — Graceful fallback if Redis is down",
    "NFR5 — Dark mode and responsive layout",
    "NFR6 — Auto-save of user answers",
    "NFR7 — User can delete account and data",
    "NFR8 — HTTPS-only on all deployments",
  ];
  nfr.forEach((t, i) => {
    s.addText(t, { x: 5.3, y: 2.05 + i * 0.37, w: 4.1, h: 0.33, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
  });

  footer(s, theme, FOOTER, 5);
}

function designSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  formalHeader(s, "05", "System Design", "High-level architecture diagram");

  // 3 service boxes in a row
  const svc = (x, label, items) => {
    s.addShape("rect", { x, y: 1.55, w: 2.9, h: 1.65, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 }, shadow: makeShadow(0.1) });
    s.addShape("rect", { x, y: 1.55, w: 2.9, h: 0.35, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addText(label, { x: x + 0.1, y: 1.59, w: 2.7, h: 0.28, fontFace: theme.header, fontSize: 11, color: theme.titleOnDark, bold: true, margin: 0 });
    items.forEach((it, i) => {
      s.addText(`\u2022  ${it}`, { x: x + 0.15, y: 2.0 + i * 0.3, w: 2.7, h: 0.28, fontFace: theme.body, fontSize: 10, color: theme.text, margin: 0 });
    });
  };
  svc(0.5, "Presentation Layer", ["React 18", "Tailwind CSS", "Zustand", "WebSpeech / MediaPipe"]);
  svc(3.55, "Application Layer", ["Express.js", "Prisma ORM", "JWT (JOSE)", "REST API"]);
  svc(6.6, "AI / ML Layer", ["FastAPI", "Groq LLaMA 3.3", "FAISS + spaCy", "Edge-TTS"]);

  // Arrows
  s.addShape("rightArrow", { x: 3.4, y: 2.25, w: 0.2, h: 0.3, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addShape("rightArrow", { x: 6.45, y: 2.25, w: 0.2, h: 0.3, fill: { color: theme.accent }, line: { color: theme.accent } });

  // Data layer
  s.addShape("rect", { x: 0.5, y: 3.5, w: 9, h: 0.95, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 }, shadow: makeShadow(0.1) });
  s.addShape("rect", { x: 0.5, y: 3.5, w: 9, h: 0.35, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addText("Data Layer", { x: 0.6, y: 3.54, w: 8.8, h: 0.28, fontFace: theme.header, fontSize: 11, color: theme.bgDark, bold: true, margin: 0 });
  s.addText("PostgreSQL (Neon serverless) for persistent data · Redis (with in-memory fallback) for cache and rate-limit", {
    x: 0.6, y: 3.95, w: 8.8, h: 0.4, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0,
  });

  // Down arrows to data
  [2.0, 5.0, 8.0].forEach((x) => {
    s.addShape("downArrow", { x: x - 0.08, y: 3.22, w: 0.16, h: 0.2, fill: { color: theme.accent }, line: { color: theme.accent } });
  });

  s.addText("Figure 5.1 — Three-tier microservice architecture with shared data layer", {
    x: 0.5, y: 4.65, w: 9, h: 0.3, fontFace: theme.body, fontSize: 10, color: theme.muted, italic: true, align: "center", margin: 0,
  });

  footer(s, theme, FOOTER, 6);
}

function methodologySlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  formalHeader(s, "06", "Methodology", "Agile SDLC in six incremental phases");

  const phases = [
    { n: "I",   name: "Requirement\nAnalysis" },
    { n: "II",  name: "System\nDesign" },
    { n: "III", name: "Implementation" },
    { n: "IV",  name: "Unit\nTesting" },
    { n: "V",   name: "Integration\n& QA" },
    { n: "VI",  name: "Evaluation\n& Report" },
  ];
  const startX = 0.5, w = 1.5, gap = 0.08, y = 1.85;
  phases.forEach((p, i) => {
    const x = startX + i * (w + gap);
    s.addShape("rect", { x, y, w, h: 1.2, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 }, shadow: makeShadow(0.1) });
    s.addShape("rect", { x, y, w, h: 0.35, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addText(`Phase ${p.n}`, { x, y: y + 0.05, w, h: 0.25, fontFace: theme.header, fontSize: 10, color: theme.titleOnDark, bold: true, align: "center", charSpacing: 1, margin: 0 });
    s.addText(p.name, { x: x + 0.05, y: y + 0.45, w: w - 0.1, h: 0.7, fontFace: theme.body, fontSize: 11, color: theme.text, align: "center", margin: 0 });
  });

  // Status bar below
  s.addText("STATUS", { x: 0.5, y: 3.35, w: 9, h: 0.3, fontFace: theme.header, fontSize: 11, color: theme.accent, bold: true, charSpacing: 3, margin: 0 });
  const statuses = [
    { label: "Phases I–III  ",  v: 100, note: "Completed" },
    { label: "Phase IV (Unit)", v: 80,  note: "Mostly done" },
    { label: "Phase V (QA)",    v: 55,  note: "In progress" },
    { label: "Phase VI",        v: 40,  note: "Active now" },
  ];
  statuses.forEach((st, i) => {
    const ry = 3.75 + i * 0.36;
    s.addText(st.label, { x: 0.5, y: ry, w: 2.2, h: 0.28, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
    s.addShape("rect", { x: 2.8, y: ry + 0.08, w: 5.5, h: 0.15, fill: { color: "E5E7EB" }, line: { color: "E5E7EB" } });
    s.addShape("rect", { x: 2.8, y: ry + 0.08, w: 5.5 * (st.v / 100), h: 0.15, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addText(`${st.v}% · ${st.note}`, { x: 8.4, y: ry, w: 1.2, h: 0.28, fontFace: theme.body, fontSize: 10, color: theme.muted, italic: true, margin: 0 });
  });

  footer(s, theme, FOOTER, 7);
}

function modulesSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  formalHeader(s, "07", "Implementation Modules", "Major modules and their responsibilities");

  const modules = [
    { n: "M1", t: "Authentication Module", d: "Registration, OTP verification, login, password reset, account deletion." },
    { n: "M2", t: "Resume Module",         d: "PDF parsing, skill extraction using spaCy en_core_web_trf." },
    { n: "M3", t: "Interview Module",      d: "Session setup, consent flow, question generation via Groq LLM." },
    { n: "M4", t: "Voice Module",          d: "Browser STT, Edge-TTS neural voice, silence detection, auto-submit." },
    { n: "M5", t: "Camera Module",         d: "MediaPipe face mesh and pose, live eye-contact and posture scoring." },
    { n: "M6", t: "Evaluation Module",     d: "RAG comparison with ideal answers, weighted rubric scoring, report generation." },
  ];
  modules.forEach((m, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.5 + col * 4.6, y = 1.55 + row * 1.25;
    s.addShape("rect", { x, y, w: 4.4, h: 1.15, fill: { color: theme.cardBg }, line: { color: theme.cardBorder, width: 1 }, shadow: makeShadow(0.08) });
    s.addShape("rect", { x, y, w: 0.7, h: 1.15, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addText(m.n, { x, y: y + 0.35, w: 0.7, h: 0.45, fontFace: theme.header, fontSize: 18, color: theme.accent, bold: true, align: "center", margin: 0 });
    s.addText(m.t, { x: x + 0.85, y: y + 0.15, w: 3.5, h: 0.35, fontFace: theme.header, fontSize: 12, color: theme.primary, bold: true, margin: 0 });
    s.addText(m.d, { x: x + 0.85, y: y + 0.48, w: 3.5, h: 0.62, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
  });

  footer(s, theme, FOOTER, 8);
}

function testingSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  formalHeader(s, "08", "Testing & Evaluation", "How we checked that things work");

  const rows = [
    ["Test Type",        "Scope",                            "Tool",               "Result"],
    ["Unit Tests",       "Services and utilities",           "Jest / Vitest",      "Partial"],
    ["API Tests",        "REST endpoints, auth flow",        "Manual + Postman",   "Pass"],
    ["UI Smoke Tests",   "Critical user paths",              "Manual walkthrough", "Pass"],
    ["TTS / STT Latency","Response time measurement",        "Browser dev tools",  "Under 3s"],
    ["Scoring Accuracy", "Compared with human-rated answers","Manual benchmark",   "Reasonable"],
    ["Security Review",  "Auth, hashing, rate limiting",     "Manual audit",       "Pass"],
  ];
  const startX = 0.5, startY = 1.55;
  const cellWs = [2.2, 3.2, 2.0, 1.6];
  rows.forEach((r, ri) => {
    const y = startY + ri * 0.5;
    r.forEach((cell, ci) => {
      const x = startX + cellWs.slice(0, ci).reduce((a, b) => a + b, 0);
      const isHeader = ri === 0;
      s.addShape("rect", {
        x, y, w: cellWs[ci], h: 0.45,
        fill: { color: isHeader ? theme.primary : (ri % 2 === 0 ? theme.cardBg : "F5F5F7") },
        line: { color: theme.cardBorder, width: 0.5 },
      });
      s.addText(cell, {
        x: x + 0.1, y: y + 0.08, w: cellWs[ci] - 0.2, h: 0.3,
        fontFace: isHeader ? theme.header : theme.body,
        fontSize: isHeader ? 11 : 11,
        bold: isHeader,
        color: isHeader ? theme.titleOnDark : theme.text,
        margin: 0,
      });
    });
  });

  s.addText("Note: Automated end-to-end test suite is planned but not yet implemented.", {
    x: 0.5, y: 5.0, w: 9, h: 0.3, fontFace: theme.body, fontSize: 10, color: theme.muted, italic: true, align: "center", margin: 0,
  });

  footer(s, theme, FOOTER, 9);
}

function resultsSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  formalHeader(s, "09", "Results & Progress", "What is working on the dev environment");

  // Big stats
  const stats = [
    { n: "85%", l: "Project complete" },
    { n: "06", l: "Modules implemented" },
    { n: "31", l: "Seed questions" },
    { n: "200+", l: "Skills detected" },
  ];
  stats.forEach((st, i) => {
    const x = 0.5 + i * 2.4, y = 1.55;
    s.addShape("rect", { x, y, w: 2.2, h: 1.1, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addShape("rect", { x, y, w: 2.2, h: 0.06, fill: { color: theme.accent }, line: { color: theme.accent } });
    s.addText(st.n, { x, y: y + 0.15, w: 2.2, h: 0.55, fontFace: theme.header, fontSize: 28, color: theme.titleOnDark, bold: true, align: "center", margin: 0 });
    s.addText(st.l, { x, y: y + 0.7, w: 2.2, h: 0.3, fontFace: theme.body, fontSize: 11, color: theme.subtitleOnDark, align: "center", italic: true, margin: 0 });
  });

  // Completed features
  s.addText("Completed Features", { x: 0.5, y: 2.95, w: 9, h: 0.3, fontFace: theme.header, fontSize: 13, color: theme.accent, bold: true, charSpacing: 2, margin: 0 });
  const done = [
    "Authentication flow (register, OTP verify, login)",
    "Resume upload and skill extraction",
    "Live voice interview with Sarah (Groq LLM)",
    "Real-time camera coaching and metrics",
    "Answer evaluation using RAG and rubric",
    "Admin dashboard with charts and logs",
  ];
  const half = Math.ceil(done.length / 2);
  done.slice(0, half).forEach((t, i) => {
    s.addText(`(${i + 1}) ${t}`, { x: 0.5, y: 3.4 + i * 0.38, w: 4.5, h: 0.3, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
  });
  done.slice(half).forEach((t, i) => {
    s.addText(`(${half + i + 1}) ${t}`, { x: 5.2, y: 3.4 + i * 0.38, w: 4.5, h: 0.3, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
  });

  footer(s, theme, FOOTER, 10);
}

function futureScopeSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  formalHeader(s, "10", "Limitations & Future Scope");

  // Limitations
  s.addShape("rect", { x: 0.5, y: 1.55, w: 4.4, h: 3.55, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 } });
  s.addShape("rect", { x: 0.5, y: 1.55, w: 4.4, h: 0.4, fill: { color: theme.primary }, line: { color: theme.primary } });
  s.addText("Limitations", { x: 0.65, y: 1.6, w: 4.1, h: 0.3, fontFace: theme.header, fontSize: 13, color: theme.titleOnDark, bold: true, margin: 0 });

  const lims = [
    "Only English is supported at this time.",
    "Browser-based STT depends on the browser engine.",
    "Not yet deployed to a production server.",
    "Automated end-to-end tests are not in place.",
    "Mobile layout needs polishing for small screens.",
    "Voice pipeline assumes a stable microphone.",
  ];
  lims.forEach((t, i) => {
    s.addText(`\u2022  ${t}`, { x: 0.7, y: 2.1 + i * 0.48, w: 4.15, h: 0.4, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
  });

  // Future
  s.addShape("rect", { x: 5.1, y: 1.55, w: 4.4, h: 3.55, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 } });
  s.addShape("rect", { x: 5.1, y: 1.55, w: 4.4, h: 0.4, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addText("Future Scope", { x: 5.25, y: 1.6, w: 4.1, h: 0.3, fontFace: theme.header, fontSize: 13, color: theme.bgDark, bold: true, margin: 0 });

  const fut = [
    "Production deployment with CI/CD pipeline.",
    "Android and iOS app using React Native.",
    "Hindi and regional language support.",
    "Saving of interview session videos.",
    "Payment gateway integration for premium tier.",
    "Automated benchmark against real HR interviews.",
  ];
  fut.forEach((t, i) => {
    s.addText(`\u2022  ${t}`, { x: 5.3, y: 2.1 + i * 0.48, w: 4.15, h: 0.4, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
  });

  footer(s, theme, FOOTER, 11);
}

function conclusionSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  formalHeader(s, "11", "Conclusion");

  // Paragraph conclusion
  s.addShape("rect", { x: 0.5, y: 1.55, w: 9, h: 2.3, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 } });
  s.addShape("rect", { x: 0.5, y: 1.55, w: 0.1, h: 2.3, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addText(
    "This project proposes and implements an AI-based interview preparation platform that addresses the gap in realistic, low-cost practice tools. The system successfully integrates a Large Language Model for dynamic question generation, a RAG pipeline for objective answer evaluation, and real-time multimodal feedback using MediaPipe. All major software requirements have been realised in the development environment. The remaining work is focused on production deployment, automated testing, and additional language support.",
    { x: 0.75, y: 1.65, w: 8.65, h: 2.1, fontFace: theme.body, fontSize: 13, color: theme.text, margin: 0 },
  );

  // References box
  s.addShape("rect", { x: 0.5, y: 4.05, w: 9, h: 1.1, fill: { color: "EEF1F9" }, line: { color: theme.cardBorder } });
  s.addText("Selected References", { x: 0.65, y: 4.1, w: 8.7, h: 0.3, fontFace: theme.header, fontSize: 12, color: theme.primary, bold: true, margin: 0 });
  s.addText([
    { text: "[1] Lewis et al., \u201CRetrieval-Augmented Generation for Knowledge-Intensive NLP,\u201D NeurIPS 2020.", options: { breakLine: true, color: theme.text } },
    { text: "[2] Lugaresi et al., \u201CMediaPipe: A Framework for Building Perception Pipelines,\u201D arXiv 2019.", options: { breakLine: true, color: theme.text } },
    { text: "[3] Touvron et al., \u201CLLaMA: Open and Efficient Foundation Language Models,\u201D 2023.", options: { color: theme.text } },
  ], { x: 0.65, y: 4.42, w: 8.7, h: 0.7, fontFace: theme.body, fontSize: 10, margin: 0 });

  footer(s, theme, FOOTER, 12);
}

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Vivek";
  pres.title = "AI Interview Platform — Project Report";

  titleSlide(pres);
  abstractSlide(pres);
  problemObjectivesSlide(pres);
  literatureSlide(pres);
  requirementsSlide(pres);
  designSlide(pres);
  methodologySlide(pres);
  modulesSlide(pres);
  testingSlide(pres);
  resultsSlide(pres);
  futureScopeSlide(pres);
  conclusionSlide(pres);

  await pres.writeFile({ fileName: "V_C_Academic_Report.pptx" });
  console.log("Built V_C_Academic_Report.pptx");
}

main().catch((e) => { console.error(e); process.exit(1); });
