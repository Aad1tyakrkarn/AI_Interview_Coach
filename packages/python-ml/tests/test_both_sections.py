"""Quick smoke test: resume with BOTH Experience and Projects sections."""
import sys
from pathlib import Path

# Ensure the app package is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.resume_parser import ResumeParser


SAMPLE_RESUME = """\
Vivek Ranjan
vivek@example.com | +91 9876543210

SUMMARY
Software engineer with 2+ years of experience in full-stack development.

EXPERIENCE

Software Engineer
Acme Corp | Jan 2023 - Present
• Built an internal analytics dashboard used by 50+ sales reps
• Reduced page load time by 40% through code splitting
• Mentored two junior engineers on React best practices

Junior Developer
Beta Solutions | Jun 2022 - Dec 2022
• Developed REST APIs using Node.js and Express
• Implemented JWT-based authentication

PROJECTS

AI Interview Platform                      View Code | Live Demo
Tech used: React, FastAPI, PostgreSQL, Groq LLaMA
• Real-time voice-based mock interview system with AI coaching
• Implemented RAG pipeline using FAISS for answer evaluation
• Integrated MediaPipe for live posture and eye-contact feedback

Campus Food Ordering App                   GitHub
Tech stack: Next.js, Supabase, Stripe
• Full-stack ordering platform for 500+ daily users
• Implemented real-time order tracking using Supabase subscriptions

Smart Attendance System
Tech used: Python, OpenCV, Flask
• Face-recognition-based attendance tracker for classrooms

EDUCATION
B.Tech Computer Science
IIT Delhi | 2019 - 2023

SKILLS
Python, JavaScript, React, Node.js, PostgreSQL
"""


def main():
    parser = ResumeParser()
    result = parser._extract_experience(
        SAMPLE_RESUME,
        parser.nlp(SAMPLE_RESUME),
        parser._detect_sections(SAMPLE_RESUME),
    )

    print(f"\n=== Got {len(result)} total entries ===\n")

    exp_entries = [e for e in result if e.get("kind") == "experience"]
    proj_entries = [e for e in result if e.get("kind") == "project"]

    print(f"Experience entries: {len(exp_entries)}")
    for i, e in enumerate(exp_entries, 1):
        print(f"  {i}. {e.get('title')} @ {e.get('company')}")
        print(f"     dates: {e.get('start_date')}")
        print(f"     highlights: {len(e.get('highlights', []))} bullets")

    print(f"\nProject entries: {len(proj_entries)}")
    for i, p in enumerate(proj_entries, 1):
        print(f"  {i}. {p.get('company')}  [{p.get('title')}]")
        print(f"     tech: {p.get('description')}")
        print(f"     highlights: {len(p.get('highlights', []))} bullets")

    # Assertions
    assert len(exp_entries) >= 2, f"expected >=2 experience entries, got {len(exp_entries)}"
    assert len(proj_entries) >= 2, f"expected >=2 project entries, got {len(proj_entries)}"
    assert any("AI Interview" in (p.get("company") or "") for p in proj_entries), \
        "AI Interview Platform project missing"
    assert any("Campus Food" in (p.get("company") or "") for p in proj_entries), \
        "Campus Food Ordering App project missing"

    print("\n=== ALL CHECKS PASSED ===")


if __name__ == "__main__":
    main()
