"""Interview Memory — tracks full interview state across questions.

Replaces the 'last 6 messages' approach with structured context
that captures topics, skills, strengths, weaknesses, and a rolling
conversation summary.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field


@dataclass
class InterviewMemory:
    candidate_name: str = ""
    target_role: str = ""
    mode: str = "PRACTICE"
    topics_covered: list[str] = field(default_factory=list)
    skills_mentioned: list[str] = field(default_factory=list)
    strengths_observed: list[str] = field(default_factory=list)
    weaknesses_observed: list[str] = field(default_factory=list)
    difficulty_history: list[str] = field(default_factory=list)
    question_count: int = 0
    total_score: float = 0.0
    conversation_summary: str = ""
    resume_highlights: list[str] = field(default_factory=list)
    last_question: str = ""
    last_answer: str = ""

    # ── public helpers ──────────────────────────────────────────────

    @property
    def avg_score(self) -> float:
        if self.question_count == 0:
            return 0.0
        return round(self.total_score / self.question_count, 2)

    def update_after_answer(
        self,
        question: str,
        answer: str,
        score: float = 0.0,
        topics: list[str] | None = None,
        skills: list[str] | None = None,
        strengths: list[str] | None = None,
        weaknesses: list[str] | None = None,
        difficulty: str = "medium",
    ) -> None:
        """Update memory state after a Q&A exchange."""
        self.question_count += 1
        self.total_score += score
        self.last_question = question
        self.last_answer = answer
        self.difficulty_history.append(difficulty)

        if topics:
            for t in topics:
                t_lower = t.lower().strip()
                if t_lower and t_lower not in self.topics_covered:
                    self.topics_covered.append(t_lower)

        if skills:
            for s in skills:
                s_lower = s.lower().strip()
                if s_lower and s_lower not in self.skills_mentioned:
                    self.skills_mentioned.append(s_lower)

        if strengths:
            for s in strengths:
                if s and s not in self.strengths_observed:
                    self.strengths_observed.append(s)
            # Keep only last 5
            self.strengths_observed = self.strengths_observed[-5:]

        if weaknesses:
            for w in weaknesses:
                if w and w not in self.weaknesses_observed:
                    self.weaknesses_observed.append(w)
            self.weaknesses_observed = self.weaknesses_observed[-5:]

    def set_resume_highlights(self, resume_data: dict | None) -> None:
        """Extract key highlights from parsed resume for prompt injection."""
        if not resume_data:
            return
        highlights = []

        skills = resume_data.get("skills", [])
        if skills:
            highlights.append(f"Skills: {', '.join(skills[:15])}")

        for exp in (resume_data.get("experience") or [])[:2]:
            company = exp.get("company", "")
            title = exp.get("title", "")
            if company and title:
                highlights.append(f"Worked as {title} at {company}")

        for edu in (resume_data.get("education") or [])[:1]:
            degree = edu.get("degree", "")
            institution = edu.get("institution", "")
            if degree and institution:
                highlights.append(f"{degree} from {institution}")

        summary = resume_data.get("summary", "")
        if summary:
            highlights.append(f"Summary: {summary[:150]}")

        self.resume_highlights = highlights

    def summarize_conversation(self, conversation_history: list[dict]) -> str:
        """Summarize conversation history via Groq for concise context."""
        if len(conversation_history) < 4:
            # Too short to summarize — use raw
            return self._raw_summary(conversation_history)

        from app.services.groq_client import chat

        conv_text = "\n".join(
            f"{'Sarah' if e.get('role') == 'interviewer' else 'Candidate'}: "
            f"{e.get('content', '')[:200]}"
            for e in conversation_history[-12:]  # Last 12 messages max
        )

        result = chat(
            system_prompt=(
                "Summarize this interview conversation in 100-150 words. "
                "Focus on: topics discussed, candidate's key points, "
                "areas of strength and weakness. Be factual and concise."
            ),
            user_prompt=conv_text,
            temperature=0.3,
            max_tokens=300,
        )

        if result and result.strip():
            self.conversation_summary = result.strip()
        else:
            self.conversation_summary = self._raw_summary(conversation_history)

        return self.conversation_summary

    def to_context_prompt(self) -> str:
        """Generate concise context string for injection into Groq prompts."""
        parts = []

        parts.append(f"Candidate: {self.candidate_name or 'Unknown'} ({self.target_role or 'Software Engineer'})")
        parts.append(f"Mode: {self.mode} | Questions asked: {self.question_count} | Avg score: {self.avg_score:.0%}")

        if self.topics_covered:
            parts.append(f"Topics covered: {', '.join(self.topics_covered[-10:])}")

        if self.skills_mentioned:
            parts.append(f"Skills mentioned: {', '.join(self.skills_mentioned[-10:])}")

        if self.strengths_observed:
            parts.append(f"Strengths: {'; '.join(self.strengths_observed[-3:])}")

        if self.weaknesses_observed:
            parts.append(f"Weaknesses to probe: {'; '.join(self.weaknesses_observed[-3:])}")

        if self.resume_highlights:
            parts.append(f"Resume: {' | '.join(self.resume_highlights[:3])}")

        if self.conversation_summary:
            parts.append(f"Conversation so far: {self.conversation_summary[:300]}")

        if self.last_question and self.last_answer:
            parts.append(f"Last Q: {self.last_question[:100]}")
            parts.append(f"Last A: {self.last_answer[:150]}")

        return "\n".join(parts)

    def to_dict(self) -> dict:
        """Serialize to dict for API transport."""
        return {
            "candidate_name": self.candidate_name,
            "target_role": self.target_role,
            "mode": self.mode,
            "topics_covered": self.topics_covered,
            "skills_mentioned": self.skills_mentioned,
            "strengths_observed": self.strengths_observed,
            "weaknesses_observed": self.weaknesses_observed,
            "difficulty_history": self.difficulty_history,
            "question_count": self.question_count,
            "avg_score": self.avg_score,
            "conversation_summary": self.conversation_summary,
            "resume_highlights": self.resume_highlights,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "InterviewMemory":
        """Deserialize from API transport dict."""
        mem = cls()
        mem.candidate_name = data.get("candidate_name", "")
        mem.target_role = data.get("target_role", "")
        mem.mode = data.get("mode", "PRACTICE")
        mem.topics_covered = data.get("topics_covered", [])
        mem.skills_mentioned = data.get("skills_mentioned", [])
        mem.strengths_observed = data.get("strengths_observed", [])
        mem.weaknesses_observed = data.get("weaknesses_observed", [])
        mem.difficulty_history = data.get("difficulty_history", [])
        mem.question_count = data.get("question_count", 0)
        mem.total_score = data.get("avg_score", 0.0) * mem.question_count
        mem.conversation_summary = data.get("conversation_summary", "")
        mem.resume_highlights = data.get("resume_highlights", [])
        return mem

    # ── private ─────────────────────────────────────────────────────

    def _raw_summary(self, history: list[dict]) -> str:
        parts = []
        for e in history[-6:]:
            role = "Sarah" if e.get("role") == "interviewer" else "Candidate"
            parts.append(f"{role}: {e.get('content', '')[:100]}")
        return " | ".join(parts)
