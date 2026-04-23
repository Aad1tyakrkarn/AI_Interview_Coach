// VARIATION B — Product & User Journey
// Audience: product / non-technical reviewers
// Focus: problem, users, features, journey, screens, outcomes
const pptxgen = require("pptxgenjs");
const { makeShadow, titleBar, footer } = require("./helpers");

const theme = {
  header: "Trebuchet MS",
  body: "Calibri",
  primary: "028090",      // teal
  accent: "F97316",       // orange
  bgDark: "042A2B",
  bgLight: "F3FAFA",
  cardBg: "FFFFFF",
  cardBorder: "BCE5E8",
  text: "0F3C42",
  muted: "4F7A80",
  titleOnDark: "FFFFFF",
  subtitleOnDark: "B2EBE8",
  mutedOnDark: "7FC4C2",
};

const FOOTER = "AI Interview Platform · Product Overview";

function titleSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgDark };

  // big background circle
  s.addShape("ellipse", { x: 6.5, y: -2, w: 6, h: 6, fill: { color: theme.primary, transparency: 40 }, line: { color: theme.primary, transparency: 40 } });
  s.addShape("ellipse", { x: 7.5, y: 3, w: 3, h: 3, fill: { color: theme.accent, transparency: 60 }, line: { color: theme.accent, transparency: 60 } });

  s.addText("PRODUCT SHOWCASE", {
    x: 0.6, y: 1.2, w: 6, h: 0.4, fontFace: theme.body, fontSize: 13, color: theme.accent, bold: true, charSpacing: 4, margin: 0,
  });
  s.addText("Meet Sarah.", {
    x: 0.6, y: 1.7, w: 7, h: 1.0,
    fontFace: theme.header, fontSize: 48, color: theme.titleOnDark, bold: true, italic: true, margin: 0,
  });
  s.addText("Your AI interview coach that listens, watches, and helps you grow.", {
    x: 0.6, y: 2.8, w: 7, h: 0.8,
    fontFace: theme.body, fontSize: 18, color: theme.subtitleOnDark, margin: 0,
  });
  s.addShape("rect", { x: 0.6, y: 3.8, w: 1.5, h: 0.08, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addText("A voice-first mock interview platform — built end to end.", {
    x: 0.6, y: 3.95, w: 7, h: 0.5, fontFace: theme.body, fontSize: 13, color: theme.mutedOnDark, italic: true, margin: 0,
  });
  s.addText("Presented by Vivek  ·  Project Evaluation", {
    x: 0.6, y: 4.9, w: 6, h: 0.3, fontFace: theme.body, fontSize: 11, color: theme.mutedOnDark, margin: 0,
  });
}

function problemSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "The Problem", "Why practicing interviews is still hard");

  // Big quote-style block
  s.addShape("rect", {
    x: 0.5, y: 1.55, w: 4.2, h: 3.6,
    fill: { color: theme.primary }, line: { color: theme.primary }, shadow: makeShadow(0.2),
  });
  s.addText("\u201C", { x: 0.6, y: 1.5, w: 1.5, h: 1.2, fontFace: "Georgia", fontSize: 90, color: theme.accent, bold: true, margin: 0 });
  s.addText("I don't know what I sound like in an interview.\n\nI only find out what I did wrong after I've failed.", {
    x: 0.8, y: 2.4, w: 3.7, h: 2.5,
    fontFace: theme.body, fontSize: 16, color: theme.titleOnDark, italic: true, margin: 0,
  });
  s.addText("— Every student before placement season", {
    x: 0.8, y: 4.75, w: 3.7, h: 0.3, fontFace: theme.body, fontSize: 10, color: theme.subtitleOnDark, margin: 0,
  });

  // Right: pain points
  s.addText("PAIN POINTS", { x: 5.1, y: 1.55, w: 4.5, h: 0.3, fontFace: theme.header, fontSize: 12, color: theme.accent, bold: true, charSpacing: 3, margin: 0 });
  const pains = [
    { n: "01", t: "Expensive human mocks", d: "Career coaches cost thousands per hour." },
    { n: "02", t: "No body-language feedback", d: "Text-based tools can't see you." },
    { n: "03", t: "Generic questions", d: "Existing tools don't read your resume." },
    { n: "04", t: "Late feedback", d: "You learn mistakes only after rejection." },
  ];
  pains.forEach((p, i) => {
    const y = 1.95 + i * 0.8;
    s.addText(p.n, { x: 5.1, y, w: 0.6, h: 0.4, fontFace: theme.header, fontSize: 22, color: theme.accent, bold: true, margin: 0 });
    s.addText(p.t, { x: 5.8, y, w: 3.8, h: 0.3, fontFace: theme.header, fontSize: 13, color: theme.primary, bold: true, margin: 0 });
    s.addText(p.d, { x: 5.8, y: y + 0.3, w: 3.8, h: 0.35, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
  });

  footer(s, theme, FOOTER, 2);
}

function usersSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "Who is this for?", "Three real personas we designed for");

  const users = [
    {
      emoji: "A",
      name: "Aditi · Final year student",
      want: "Wants to practice for campus placements but can't afford a coach.",
      use: "Uses Practice mode daily for 30 minutes.",
    },
    {
      emoji: "R",
      name: "Rahul · Working professional",
      want: "Preparing for a senior role switch. Has only 30 min after work.",
      use: "Uses Mock mode for realistic pressure.",
    },
    {
      emoji: "P",
      name: "Priya · Career returner",
      want: "Returning after a break. Nervous about speaking confidently.",
      use: "Uses coaching panel to fix filler words and posture.",
    },
  ];
  users.forEach((u, i) => {
    const x = 0.5 + i * 3.2;
    s.addShape("rect", { x, y: 1.55, w: 3.0, h: 3.4, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 }, shadow: makeShadow(0.12) });
    s.addShape("ellipse", { x: x + 1.05, y: 1.8, w: 0.9, h: 0.9, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addText(u.emoji, { x: x + 1.05, y: 1.8, w: 0.9, h: 0.9, fontFace: theme.header, fontSize: 32, color: theme.titleOnDark, bold: true, align: "center", valign: "middle", margin: 0 });
    s.addText(u.name, { x: x + 0.15, y: 2.85, w: 2.7, h: 0.4, fontFace: theme.header, fontSize: 13, color: theme.primary, bold: true, align: "center", margin: 0 });
    s.addShape("rect", { x: x + 1.3, y: 3.25, w: 0.4, h: 0.04, fill: { color: theme.accent }, line: { color: theme.accent } });
    s.addText(u.want, { x: x + 0.15, y: 3.4, w: 2.7, h: 0.8, fontFace: theme.body, fontSize: 11, color: theme.text, align: "center", italic: true, margin: 0 });
    s.addText(u.use, { x: x + 0.15, y: 4.25, w: 2.7, h: 0.6, fontFace: theme.body, fontSize: 11, color: theme.accent, bold: true, align: "center", margin: 0 });
  });

  footer(s, theme, FOOTER, 3);
}

function modesSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "Two Modes, One Sarah", "Same AI coach, very different experiences");

  // Practice mode
  s.addShape("rect", { x: 0.5, y: 1.55, w: 4.4, h: 3.55, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 }, shadow: makeShadow(0.15) });
  s.addShape("rect", { x: 0.5, y: 1.55, w: 4.4, h: 0.55, fill: { color: theme.primary }, line: { color: theme.primary } });
  s.addText("PRACTICE & LEARN", { x: 0.65, y: 1.68, w: 4.1, h: 0.35, fontFace: theme.header, fontSize: 14, color: theme.titleOnDark, bold: true, charSpacing: 2, margin: 0 });
  s.addText("Guided coaching mode", { x: 0.65, y: 2.2, w: 4.1, h: 0.3, fontFace: theme.body, fontSize: 11, color: theme.muted, italic: true, margin: 0 });

  const pFeatures = [
    "Live coaching panel — eye contact, WPM, filler words",
    "Unlimited pauses and retries",
    "Hints available on demand",
    "Sarah is encouraging and explains things",
    "No time pressure — focus on learning",
  ];
  pFeatures.forEach((t, i) => {
    const y = 2.6 + i * 0.45;
    s.addShape("rect", { x: 0.7, y: y + 0.12, w: 0.1, h: 0.1, fill: { color: theme.accent }, line: { color: theme.accent } });
    s.addText(t, { x: 0.85, y, w: 4, h: 0.4, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
  });

  // Mock mode
  s.addShape("rect", { x: 5.1, y: 1.55, w: 4.4, h: 3.55, fill: { color: theme.cardBg }, line: { color: theme.accent, width: 2 }, shadow: makeShadow(0.15) });
  s.addShape("rect", { x: 5.1, y: 1.55, w: 4.4, h: 0.55, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addText("MOCK INTERVIEW", { x: 5.25, y: 1.68, w: 4.1, h: 0.35, fontFace: theme.header, fontSize: 14, color: theme.bgDark, bold: true, charSpacing: 2, margin: 0 });
  s.addText("Simulate the real thing", { x: 5.25, y: 2.2, w: 4.1, h: 0.3, fontFace: theme.body, fontSize: 11, color: theme.muted, italic: true, margin: 0 });

  const mFeatures = [
    "No coaching — Sarah evaluates silently",
    "Strict time limit",
    "No hints, no skipping",
    "Full scorecard + report at the end",
    "Shareable review page",
  ];
  mFeatures.forEach((t, i) => {
    const y = 2.6 + i * 0.45;
    s.addShape("rect", { x: 5.3, y: y + 0.12, w: 0.1, h: 0.1, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addText(t, { x: 5.45, y, w: 4, h: 0.4, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
  });

  footer(s, theme, FOOTER, 4);
}

function journeySlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "User Journey", "From signup to report — in one sitting");

  const steps = [
    { n: "1", t: "Sign up", d: "Email + OTP verification" },
    { n: "2", t: "Upload resume", d: "Parser extracts skills" },
    { n: "3", t: "Pick mode", d: "Practice or Mock" },
    { n: "4", t: "Live interview", d: "Talk to Sarah" },
    { n: "5", t: "Get report", d: "Scores + review transcript" },
  ];

  const startX = 0.5, w = 1.75, gap = 0.2, y = 1.85;
  steps.forEach((st, i) => {
    const x = startX + i * (w + gap);
    // connecting line (behind circles)
    if (i < steps.length - 1) {
      s.addShape("rect", { x: x + w, y: y + 0.9, w: gap, h: 0.04, fill: { color: theme.primary, transparency: 50 }, line: { color: theme.primary, transparency: 50 } });
    }
    s.addShape("ellipse", { x, y: y + 0.45, w: 0.95, h: 0.95, fill: { color: theme.primary }, line: { color: theme.primary }, shadow: makeShadow(0.2) });
    s.addText(st.n, { x, y: y + 0.45, w: 0.95, h: 0.95, fontFace: theme.header, fontSize: 28, color: theme.titleOnDark, bold: true, align: "center", valign: "middle", margin: 0 });
    s.addText(st.t, { x: x - 0.3, y: y + 1.55, w: 1.55, h: 0.35, fontFace: theme.header, fontSize: 13, color: theme.primary, bold: true, align: "center", margin: 0 });
    s.addText(st.d, { x: x - 0.3, y: y + 1.9, w: 1.55, h: 0.5, fontFace: theme.body, fontSize: 10, color: theme.muted, align: "center", margin: 0 });
  });

  // Callout banner under
  s.addShape("rect", { x: 0.5, y: 4.55, w: 9, h: 0.65, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addText("Total time: around 20 minutes from signup to scored report.", {
    x: 0.5, y: 4.55, w: 9, h: 0.65, fontFace: theme.header, fontSize: 14, color: theme.bgDark, bold: true, align: "center", valign: "middle", margin: 0,
  });

  footer(s, theme, FOOTER, 5);
}

function featuresSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "Key Features", "What makes it feel like a real interview");

  const features = [
    { icon: "\u266A", t: "Voice-first", d: "Speak naturally, no typing" },
    { icon: "\u25A0", t: "Smart camera", d: "Reads posture and eye contact" },
    { icon: "\u25C6", t: "Dynamic questions", d: "Based on your resume" },
    { icon: "\u2605", t: "Real coaching", d: "Tips while you talk" },
    { icon: "\u25B2", t: "Smart scoring", d: "5 weighted categories" },
    { icon: "\u25CF", t: "Full report", d: "Shareable transcript" },
  ];
  const cardW = 2.9, cardH = 1.55, gap = 0.2;
  features.forEach((f, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 0.5 + col * (cardW + gap), y = 1.55 + row * (cardH + gap);
    s.addShape("rect", { x, y, w: cardW, h: cardH, fill: { color: theme.cardBg }, line: { color: theme.cardBorder, width: 1 }, shadow: makeShadow(0.1) });
    s.addShape("ellipse", { x: x + 0.25, y: y + 0.3, w: 0.75, h: 0.75, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addText(f.icon, { x: x + 0.25, y: y + 0.3, w: 0.75, h: 0.75, fontFace: theme.header, fontSize: 24, color: theme.accent, bold: true, align: "center", valign: "middle", margin: 0 });
    s.addText(f.t, { x: x + 1.1, y: y + 0.35, w: 1.7, h: 0.35, fontFace: theme.header, fontSize: 14, color: theme.primary, bold: true, margin: 0 });
    s.addText(f.d, { x: x + 1.1, y: y + 0.7, w: 1.7, h: 0.75, fontFace: theme.body, fontSize: 11, color: theme.text, margin: 0 });
  });

  footer(s, theme, FOOTER, 6);
}

function differentiatorSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "How are we different?", "Where we beat existing tools");

  // Comparison table: us vs typical tools
  const cols = ["Feature", "Typical tools", "Our platform"];
  const rows = [
    ["Input mode",      "Typed text",            "Voice (speak naturally)"],
    ["Camera feedback", "None",                  "Eye contact + posture"],
    ["Questions",       "Static list",           "Resume-aware, dynamic"],
    ["Coaching",        "After the fact",        "Real-time during answer"],
    ["Modes",           "One size fits all",     "Practice and Mock separate"],
  ];

  // Header row
  const headY = 1.55, rowH = 0.55;
  const cellWs = [2.4, 3.3, 3.3];
  const startX = 0.5;
  cols.forEach((c, i) => {
    const x = startX + cellWs.slice(0, i).reduce((a, b) => a + b, 0);
    s.addShape("rect", { x, y: headY, w: cellWs[i], h: 0.5, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addText(c, { x: x + 0.15, y: headY + 0.1, w: cellWs[i] - 0.3, h: 0.3, fontFace: theme.header, fontSize: 12, color: theme.titleOnDark, bold: true, margin: 0 });
  });
  rows.forEach((r, ri) => {
    const y = headY + 0.55 + ri * rowH;
    r.forEach((cell, ci) => {
      const x = startX + cellWs.slice(0, ci).reduce((a, b) => a + b, 0);
      const isHighlight = ci === 2;
      s.addShape("rect", { x, y, w: cellWs[ci], h: rowH - 0.05, fill: { color: isHighlight ? "FFF7ED" : theme.cardBg }, line: { color: theme.cardBorder, width: 0.5 } });
      if (isHighlight) {
        s.addShape("rect", { x, y, w: 0.08, h: rowH - 0.05, fill: { color: theme.accent }, line: { color: theme.accent } });
      }
      s.addText(cell, {
        x: x + 0.15, y: y + 0.12, w: cellWs[ci] - 0.3, h: rowH - 0.25,
        fontFace: ci === 0 ? theme.header : theme.body,
        fontSize: 11, bold: ci === 0,
        color: isHighlight ? theme.accent : theme.text,
        margin: 0,
      });
    });
  });

  footer(s, theme, FOOTER, 7);
}

function screensSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "Inside the App", "Three key screens — built and working");

  // 3 mock screens
  const screen = (x, label, drawInterior) => {
    // frame
    s.addShape("rect", { x, y: 1.55, w: 3.0, h: 3.6, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1.5 }, shadow: makeShadow(0.15) });
    // browser bar
    s.addShape("rect", { x, y: 1.55, w: 3.0, h: 0.3, fill: { color: theme.bgLight }, line: { color: theme.primary, width: 1.5 } });
    [0.12, 0.3, 0.48].forEach((off, i) => {
      const col = ["FF5F56", "FFBD2E", "27C93F"][i];
      s.addShape("ellipse", { x: x + off, y: 1.65, w: 0.1, h: 0.1, fill: { color: col }, line: { color: col } });
    });
    drawInterior(x);
    // caption
    s.addShape("rect", { x: x + 0.9, y: 5.22, w: 1.2, h: 0.04, fill: { color: theme.accent }, line: { color: theme.accent } });
    s.addText(label, { x, y: 5.3, w: 3.0, h: 0.3, fontFace: theme.header, fontSize: 11, color: theme.primary, bold: true, align: "center", margin: 0 });
  };

  screen(0.5, "Setup & Consent", (x) => {
    // stepper
    [1, 2, 3].forEach((n, i) => {
      s.addShape("ellipse", { x: x + 0.5 + i * 0.8, y: 2.1, w: 0.35, h: 0.35, fill: { color: i === 0 ? theme.primary : theme.cardBorder }, line: { color: theme.primary } });
      s.addText(String(n), { x: x + 0.5 + i * 0.8, y: 2.1, w: 0.35, h: 0.35, fontFace: theme.header, fontSize: 10, color: i === 0 ? theme.titleOnDark : theme.muted, bold: true, align: "center", valign: "middle", margin: 0 });
    });
    [2.75, 3.1, 3.45, 3.8].forEach((y) => s.addShape("rect", { x: x + 0.3, y, w: 2.4, h: 0.2, fill: { color: "E5F4F6" }, line: { color: "E5F4F6" } }));
    s.addShape("rect", { x: x + 0.3, y: 4.5, w: 2.4, h: 0.35, fill: { color: theme.accent }, line: { color: theme.accent } });
    s.addText("Begin", { x: x + 0.3, y: 4.5, w: 2.4, h: 0.35, fontFace: theme.header, fontSize: 10, color: theme.bgDark, bold: true, align: "center", valign: "middle", margin: 0 });
  });

  screen(3.65, "Live Interview", (x) => {
    // camera box
    s.addShape("rect", { x: x + 0.2, y: 2.0, w: 1.1, h: 0.85, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addText("CAM", { x: x + 0.2, y: 2.0, w: 1.1, h: 0.85, fontFace: theme.header, fontSize: 11, color: theme.titleOnDark, bold: true, align: "center", valign: "middle", margin: 0 });
    // chat bubbles
    s.addShape("rect", { x: x + 1.4, y: 2.0, w: 1.4, h: 0.35, fill: { color: "E5F4F6" }, line: { color: "E5F4F6" } });
    s.addShape("rect", { x: x + 1.4, y: 2.45, w: 1.4, h: 0.35, fill: { color: theme.accent, transparency: 40 }, line: { color: theme.accent, transparency: 40 } });
    // coaching panel
    s.addShape("rect", { x: x + 0.2, y: 3.05, w: 2.6, h: 2.05, fill: { color: "F0F9FA" }, line: { color: theme.cardBorder } });
    ["Eye contact 82%", "WPM 135", "Filler words: 2"].forEach((t, i) => {
      s.addText(t, { x: x + 0.3, y: 3.2 + i * 0.3, w: 2.4, h: 0.25, fontFace: theme.body, fontSize: 9, color: theme.primary, bold: true, margin: 0 });
    });
  });

  screen(6.8, "Final Report", (x) => {
    // score circle
    s.addShape("ellipse", { x: x + 0.95, y: 2.0, w: 1.1, h: 1.1, fill: { color: theme.primary }, line: { color: theme.primary } });
    s.addText("78", { x: x + 0.95, y: 2.0, w: 1.1, h: 1.1, fontFace: theme.header, fontSize: 28, color: theme.accent, bold: true, align: "center", valign: "middle", margin: 0 });
    // bars
    [60, 85, 70, 75, 80].forEach((v, i) => {
      const y = 3.3 + i * 0.28;
      s.addShape("rect", { x: x + 0.3, y, w: 2.4, h: 0.15, fill: { color: "E5F4F6" }, line: { color: "E5F4F6" } });
      s.addShape("rect", { x: x + 0.3, y, w: 2.4 * (v / 100), h: 0.15, fill: { color: theme.primary }, line: { color: theme.primary } });
    });
  });

  footer(s, theme, FOOTER, 8);
}

function outcomesSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "What Users Get", "Outcomes after one practice session");

  const outcomes = [
    { t: "Specific score", d: "Not just 'good job' — a number per category." },
    { t: "Transcript review", d: "Replay your own answers and find filler words." },
    { t: "Improvement tips", d: "Sarah suggests one concrete thing to fix." },
    { t: "Growth over time", d: "Dashboard shows your score trend across sessions." },
  ];
  outcomes.forEach((o, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.5 + col * 4.6, y = 1.65 + row * 1.75;
    s.addShape("rect", { x, y, w: 4.4, h: 1.55, fill: { color: theme.cardBg }, line: { color: theme.cardBorder, width: 1 }, shadow: makeShadow(0.1) });
    s.addShape("rect", { x, y, w: 4.4, h: 0.1, fill: { color: theme.accent }, line: { color: theme.accent } });
    s.addText(o.t, { x: x + 0.25, y: y + 0.25, w: 4.0, h: 0.4, fontFace: theme.header, fontSize: 15, color: theme.primary, bold: true, margin: 0 });
    s.addText(o.d, { x: x + 0.25, y: y + 0.75, w: 4.0, h: 0.7, fontFace: theme.body, fontSize: 12, color: theme.text, margin: 0 });
  });

  footer(s, theme, FOOTER, 9);
}

function builtSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "What's Built", "Working today, end to end");

  // big stat + items
  s.addShape("rect", { x: 0.5, y: 1.55, w: 3.4, h: 3.55, fill: { color: theme.primary }, line: { color: theme.primary }, shadow: makeShadow(0.2) });
  s.addText("85%", { x: 0.5, y: 2.0, w: 3.4, h: 1.0, fontFace: theme.header, fontSize: 72, color: theme.accent, bold: true, align: "center", margin: 0 });
  s.addText("of the product", { x: 0.5, y: 3.1, w: 3.4, h: 0.3, fontFace: theme.body, fontSize: 12, color: theme.subtitleOnDark, align: "center", charSpacing: 2, margin: 0 });
  s.addText("is built and working", { x: 0.5, y: 3.35, w: 3.4, h: 0.3, fontFace: theme.body, fontSize: 12, color: theme.subtitleOnDark, align: "center", charSpacing: 2, margin: 0 });
  s.addShape("rect", { x: 1.7, y: 3.75, w: 1.0, h: 0.06, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addText("on the dev environment", { x: 0.5, y: 3.85, w: 3.4, h: 0.3, fontFace: theme.body, fontSize: 11, color: theme.mutedOnDark, align: "center", italic: true, margin: 0 });

  // right side list
  const built = [
    "Sign-up, login, OTP email verification",
    "Profile + resume upload",
    "Interview setup (mode, role, source)",
    "Live voice interview with Sarah",
    "Camera analysis + voice metrics",
    "Answer scoring with AI + RAG",
    "Admin dashboard & audit logs",
    "Landing page + dark mode",
  ];
  built.forEach((b, i) => {
    const y = 1.6 + i * 0.44;
    s.addShape("ellipse", { x: 4.2, y: y + 0.08, w: 0.28, h: 0.28, fill: { color: theme.accent }, line: { color: theme.accent } });
    s.addText("\u2713", { x: 4.2, y: y + 0.08, w: 0.28, h: 0.28, fontFace: theme.header, fontSize: 12, color: theme.bgDark, bold: true, align: "center", valign: "middle", margin: 0 });
    s.addText(b, { x: 4.6, y: y + 0.1, w: 5, h: 0.35, fontFace: theme.body, fontSize: 12, color: theme.text, margin: 0 });
  });

  footer(s, theme, FOOTER, 10);
}

function roadmapSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgLight };
  titleBar(s, theme, "Roadmap", "What comes next");

  const phases = [
    { label: "NEXT", items: ["Production deployment", "Stripe payments for premium", "Shareable result page"] },
    { label: "SOON", items: ["Mobile app (React Native)", "Multi-language interviews (Hindi)", "Video recording"] },
    { label: "LATER", items: ["Team / enterprise mode", "Role-specific question packs", "HR analytics dashboard"] },
  ];
  phases.forEach((p, i) => {
    const x = 0.5 + i * 3.2, y = 1.55;
    s.addShape("rect", { x, y, w: 3.0, h: 3.5, fill: { color: theme.cardBg }, line: { color: theme.primary, width: 1 }, shadow: makeShadow(0.12) });
    const colors = [theme.accent, theme.primary, theme.muted];
    s.addShape("rect", { x, y, w: 3.0, h: 0.5, fill: { color: colors[i] }, line: { color: colors[i] } });
    s.addText(p.label, { x, y: y + 0.1, w: 3.0, h: 0.3, fontFace: theme.header, fontSize: 14, color: theme.titleOnDark, bold: true, align: "center", charSpacing: 3, margin: 0 });
    p.items.forEach((it, j) => {
      const iy = y + 0.75 + j * 0.65;
      s.addShape("rect", { x: x + 0.2, y: iy + 0.15, w: 0.1, h: 0.1, fill: { color: colors[i] }, line: { color: colors[i] } });
      s.addText(it, { x: x + 0.35, y: iy, w: 2.55, h: 0.55, fontFace: theme.body, fontSize: 12, color: theme.text, margin: 0 });
    });
  });

  footer(s, theme, FOOTER, 11);
}

function closingSlide(pres) {
  const s = pres.addSlide();
  s.background = { color: theme.bgDark };

  s.addShape("ellipse", { x: -2, y: 2, w: 6, h: 6, fill: { color: theme.primary, transparency: 50 }, line: { color: theme.primary, transparency: 50 } });
  s.addShape("ellipse", { x: 7, y: -1, w: 5, h: 5, fill: { color: theme.accent, transparency: 60 }, line: { color: theme.accent, transparency: 60 } });

  s.addText("Thank you.", {
    x: 0.6, y: 1.6, w: 9, h: 1.3, fontFace: theme.header, fontSize: 60, color: theme.titleOnDark, bold: true, italic: true, margin: 0,
  });
  s.addShape("rect", { x: 0.6, y: 3.05, w: 1.2, h: 0.08, fill: { color: theme.accent }, line: { color: theme.accent } });
  s.addText("A real product — from idea, to design, to working code.", {
    x: 0.6, y: 3.2, w: 9, h: 0.5, fontFace: theme.body, fontSize: 18, color: theme.subtitleOnDark, italic: true, margin: 0,
  });
  s.addText("Ready to demo live.", {
    x: 0.6, y: 4.0, w: 9, h: 0.4, fontFace: theme.body, fontSize: 14, color: theme.mutedOnDark, margin: 0,
  });
  s.addText("Vivek · Project Evaluation", {
    x: 0.6, y: 4.9, w: 9, h: 0.3, fontFace: theme.body, fontSize: 11, color: theme.mutedOnDark, margin: 0,
  });
}

async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Vivek";
  pres.title = "AI Interview Platform — Product Overview";

  titleSlide(pres);
  problemSlide(pres);
  usersSlide(pres);
  modesSlide(pres);
  journeySlide(pres);
  featuresSlide(pres);
  differentiatorSlide(pres);
  screensSlide(pres);
  outcomesSlide(pres);
  builtSlide(pres);
  roadmapSlide(pres);
  closingSlide(pres);

  await pres.writeFile({ fileName: "V_B_Product_Journey.pptx" });
  console.log("Built V_B_Product_Journey.pptx");
}

main().catch((e) => { console.error(e); process.exit(1); });
