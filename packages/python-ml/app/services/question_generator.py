import json
import random
from dataclasses import dataclass

from app.services.interview_memory import InterviewMemory


@dataclass
class GeneratedQuestion:
    question: str
    topic: str
    skill_area: str
    difficulty: str
    expected_duration: int = 120


# ---------------------------------------------------------------------------
# Sarah's persistent persona — injected into ALL Groq prompts
# ---------------------------------------------------------------------------

SARAH_PERSONA = (
    "You are Sarah, a senior technical interviewer at a top tech company.\n\n"
    "Personality:\n"
    "- Warm but professional. You use the candidate's name naturally.\n"
    "- You listen carefully and reference what they said earlier.\n"
    "- In Practice mode: encouraging coach who gives actionable tips.\n"
    "- In Mock mode: professional interviewer who evaluates silently.\n\n"
    "Interview Style:\n"
    "- Start broad, then drill into specifics based on answers.\n"
    "- Mix behavioral ('Tell me about a time...') with technical ('How would you design...').\n"
    "- Ask ONE question at a time. Never combine multiple questions.\n"
    "- Keep questions under 30 words. Be conversational, not textbook.\n"
    "- If candidate struggles, simplify. If they ace it, go deeper.\n\n"
    "NEVER:\n"
    "- Ask generic questions like 'Tell me about yourself' after the intro.\n"
    "- Repeat a question topic already covered.\n"
    "- Break character or mention you're an AI.\n"
)

# ---------------------------------------------------------------------------
# Role-specific context — injected based on target role
# ---------------------------------------------------------------------------

ROLE_CONTEXTS = {
    "frontend": (
        "Focus areas: React/component patterns, state management, CSS layout, "
        "performance optimization, accessibility, browser APIs, TypeScript, testing."
    ),
    "backend": (
        "Focus areas: API design, database modeling, authentication, caching, "
        "message queues, microservices, system design, error handling, testing."
    ),
    "fullstack": (
        "Focus areas: End-to-end architecture, API integration, database design, "
        "frontend patterns, deployment, DevOps basics, full-stack trade-offs."
    ),
    "full stack": (
        "Focus areas: End-to-end architecture, API integration, database design, "
        "frontend patterns, deployment, DevOps basics, full-stack trade-offs."
    ),
    "data_science": (
        "Focus areas: ML algorithms, data pipelines, feature engineering, "
        "model evaluation, statistical analysis, Python ecosystem, SQL."
    ),
    "data science": (
        "Focus areas: ML algorithms, data pipelines, feature engineering, "
        "model evaluation, statistical analysis, Python ecosystem, SQL."
    ),
    "devops": (
        "Focus areas: CI/CD, containerization, infrastructure-as-code, "
        "monitoring, cloud services, security practices, Linux, networking."
    ),
    "mobile": (
        "Focus areas: React Native/Flutter, mobile UI patterns, offline support, "
        "performance optimization, platform-specific APIs, app deployment."
    ),
}


def _get_role_context(role: str) -> str:
    """Get role-specific context string."""
    role_lower = role.lower().strip()
    for key, ctx in ROLE_CONTEXTS.items():
        if key in role_lower:
            return ctx
    return ROLE_CONTEXTS.get("fullstack", "")


def _build_system_prompt(extra: str = "", role: str = "") -> str:
    """Build a system prompt with Sarah persona + role context + extra instructions."""
    parts = [SARAH_PERSONA]
    role_ctx = _get_role_context(role)
    if role_ctx:
        parts.append(f"Role Context: {role_ctx}")
    if extra:
        parts.append(extra)
    return "\n\n".join(parts)


# ---------------------------------------------------------------------------
# Conversation fillers (not interview questions — kept as-is)
# ---------------------------------------------------------------------------

ACKNOWLEDGEMENTS = [
    "That's a really thoughtful answer.",
    "I hadn't thought of it that way, nice.",
    "Okay, that makes sense. Good explanation.",
    "Right, that's exactly what I was looking for.",
    "Hmm, interesting approach. I like it.",
    "Great, you clearly have experience with this.",
    "Fair point. Let's move on to something else.",
    "That covers it well, thank you.",
    "That's a solid explanation, I like how you connected the pieces.",
    "Good, I can tell you've worked with this before.",
    "Nice, that's a really practical way to think about it.",
    "Interesting perspective. I appreciate the detail.",
    "Okay, that's a well-rounded answer.",
    "Good stuff. You explained that really clearly.",
    "I like that you gave a concrete example, that helps a lot.",
    "Right, that makes total sense.",
    "Great answer. You hit all the key points there.",
    "That's a really clean way to explain it.",
    "Okay cool, I can see you've thought about this.",
    "Nice breakdown. That was easy to follow.",
]

ENCOURAGEMENTS = [
    "Take your time, no rush at all.",
    "It's okay to think about it for a moment.",
    "Would it help if I gave you a hint?",
    "Don't worry, just share what comes to mind.",
    "There's no wrong answer here, just think out loud.",
    "Feel free to start with what you know, and we can go from there.",
    "It's totally fine to take a few seconds to gather your thoughts.",
    "No pressure — just share your initial thinking.",
    "Would you like me to rephrase that question?",
    "Even a partial answer is great — just talk me through what you're thinking.",
    "Take a deep breath. You've got this.",
    "Sometimes it helps to think about a specific example from your experience.",
]

CLOSING_MESSAGES = [
    "Alright, that wraps up our session! Really appreciate you taking the time — you did a great job. Your detailed feedback will be ready for you shortly.",
    "And that's a wrap! Thanks so much for chatting with me today. I thought you gave some really strong answers. Your performance report will be available soon.",
    "We've covered everything I had planned. Thanks for being so thoughtful with your responses — it was a great conversation. Your results will be ready for review shortly.",
    "Okay, I think we're all done here. Really enjoyed our conversation. You should feel good about how that went. Check back soon for your detailed feedback.",
    "That's the last question from me! Thanks for sticking with it — you brought some really good insights. Your scores and feedback will be generated in just a moment.",
]

SKIP_ACKNOWLEDGEMENTS = [
    "No worries at all, let's move on to something else.",
    "Totally fine — let's try a different one.",
    "Sure thing, no problem. Here's the next question.",
    "That's okay! Let's see what else we've got for you.",
    "No stress — we'll skip that and keep going.",
    "All good. Let's switch to a different topic.",
]


class QuestionGenerator:
    """Generates interview questions using Groq (LLaMA 3.3 70B)."""

    # -- Main public methods ------------------------------------------------

    def generate(
        self,
        role: str,
        difficulty: str,
        context: dict | None = None,
        resume_data: dict | None = None,
        memory: InterviewMemory | None = None,
    ) -> GeneratedQuestion:
        """Generate a question based on role and difficulty using Groq."""
        asked_questions = None
        if context and "asked_questions" in context:
            asked_questions = context["asked_questions"]

        result = self._generate_with_groq(role, difficulty, asked_questions, resume_data, memory)
        if result:
            return result

        return GeneratedQuestion(
            question="Tell me about your experience with this role.",
            topic="general",
            skill_area="experience",
            difficulty=self._normalize_difficulty(difficulty),
            expected_duration=120,
        )

    def generate_followup(
        self, question: str, answer: str, context: dict | None = None
    ) -> tuple[str, str]:
        """Generate a follow-up question using Groq. Returns (question, rationale)."""
        result = self._generate_followup_with_groq(question, answer)
        if result:
            return result

        return (
            "Can you tell me more about that? I'd love to hear a specific example.",
            "Following up on candidate response for more depth.",
        )

    def generate_dynamic(
        self,
        role: str,
        difficulty: str,
        conversation_history: list[dict],
        resume_data: dict | None = None,
        memory: InterviewMemory | None = None,
    ) -> GeneratedQuestion:
        """Generate a contextually relevant question based on conversation history using Groq."""
        # Update memory summary every 3 questions
        if memory and memory.question_count > 0 and memory.question_count % 3 == 0:
            memory.summarize_conversation(conversation_history)

        result = self._generate_dynamic_with_groq(
            conversation_history, role, difficulty, resume_data, memory
        )
        if result:
            return result

        return GeneratedQuestion(
            question="What has been the most interesting technical challenge you've faced recently?",
            topic="general",
            skill_area="experience",
            difficulty=self._normalize_difficulty(difficulty),
            expected_duration=120,
        )

    def generate_intro(
        self,
        mode: str,
        user_name: str = "",
        resume_data: dict | None = None,
        target_role: str = "",
        duration_minutes: int = 20,
    ) -> tuple[str, str]:
        """Generate Sarah's opening introduction using Groq.

        Returns ``(intro_text, follow_up_prompt)``.
        """
        result = self._generate_intro_with_groq(
            mode, user_name, resume_data, target_role, duration_minutes
        )
        if result:
            return result

        name = user_name.strip() or "there"
        if mode.upper() == "PRACTICE":
            return (
                f"Hey {name}! I'm Sarah, your interview coach today. Let's get started!",
                "Tell me about yourself and what role you're preparing for.",
            )
        return (
            f"Hello {name}. I'm Sarah, and I'll be conducting your interview today. We have about {duration_minutes} minutes.",
            "Shall we begin?",
        )

    def generate_answer_feedback(
        self,
        question: str,
        answer: str,
        eye_contact: float = 0,
        posture_score: float = 0,
        speaking_rate: float = 0,
        filler_count: int = 0,
        answer_duration_seconds: float = 0,
    ) -> dict:
        """Generate post-answer coaching for Practice mode using Groq.

        Returns a dict with keys: feedback_text, strengths, improvements, transition.
        """
        result = self._generate_answer_feedback_with_groq(
            question,
            answer,
            camera_metrics={
                "eye_contact": eye_contact / 100 if eye_contact else 0,
                "posture_score": posture_score / 100 if posture_score else 0,
            },
            voice_metrics={
                "speaking_rate": speaking_rate,
                "filler_count": filler_count,
            },
        )
        if result:
            return result

        return {
            "feedback_text": "Good effort! Let's keep going.",
            "strengths": [],
            "improvements": [],
            "transition": "Ready for the next question?",
        }

    def generate_resume_question(
        self,
        resume_data: dict,
        conversation_history: list[dict] | None = None,
        difficulty: str = "medium",
        target_role: str = "",
    ) -> dict:
        """Generate a question grounded in the candidate's resume using Groq.

        Returns dict with keys: question, topic, skill_area, difficulty,
        expected_duration, resume_context.
        """
        result = self._generate_resume_question_with_groq(
            resume_data, conversation_history, difficulty, target_role
        )
        if result:
            return result

        diff_key = self._normalize_difficulty(difficulty)
        return {
            "question": "Looking at your resume, what project are you most proud of and why?",
            "topic": "general",
            "skill_area": "Resume",
            "difficulty": diff_key,
            "expected_duration": self._get_duration(diff_key),
            "resume_context": "General resume question",
        }

    # -- Difficulty adaptation (not template-based) -------------------------

    def adapt_difficulty(
        self, scores: list[float], current_difficulty: str
    ) -> tuple[str, str]:
        """Adapt difficulty based on recent scores."""
        if not scores:
            return current_difficulty, "No scores available yet."

        avg_score = sum(scores) / len(scores)
        recent_trend = scores[-3:] if len(scores) >= 3 else scores
        avg_recent = sum(recent_trend) / len(recent_trend)

        diff_levels = ["easy", "medium", "hard"]
        current_idx = diff_levels.index(self._normalize_difficulty(current_difficulty))

        if avg_recent >= 0.8 and current_idx < 2:
            new_diff = diff_levels[current_idx + 1]
            reason = f"Candidate scoring well (avg {avg_recent:.0%}), increasing difficulty."
        elif avg_recent <= 0.4 and current_idx > 0:
            new_diff = diff_levels[current_idx - 1]
            reason = f"Candidate finding it challenging (avg {avg_recent:.0%}), reducing difficulty."
        else:
            new_diff = current_difficulty
            reason = f"Current difficulty is appropriate (avg {avg_recent:.0%})."

        return new_diff, reason

    # -- Conversation fillers -----------------------------------------------

    def get_acknowledgement(self) -> str:
        return random.choice(ACKNOWLEDGEMENTS)

    def get_encouragement(self) -> str:
        return random.choice(ENCOURAGEMENTS)

    def get_closing_message(self) -> str:
        return random.choice(CLOSING_MESSAGES)

    def get_skip_acknowledgement(self) -> str:
        return random.choice(SKIP_ACKNOWLEDGEMENTS)

    # -- Rephrase (Groq-based) ---------------------------------------------

    def rephrase_question(self, question: str) -> str:
        """Rephrase a question using Groq."""
        from app.services.groq_client import chat

        system_prompt = (
            "You are Sarah, an interviewer. Rephrase the following question "
            "in a more casual, conversational way. Keep the same intent.\n"
            "Return ONLY the rephrased question text, no JSON."
        )

        result = chat(system_prompt, question, temperature=0.8)
        if result and result.strip():
            return result.strip()

        # Minimal fallback — just soften the original
        return f"Let me put that differently — {question}"

    # -- Real-time coaching feedback (not template-based) -------------------

    def generate_coaching_feedback(
        self,
        eye_contact: float = 0,
        posture_score: float = 0,
        lighting_quality: str = "unknown",
        speaking_rate: float = 0,
        filler_count: int = 0,
        blink_rate: float = 0,
    ) -> tuple[list[str], str]:
        """Return (tips, priority_tip) based on live metrics.

        Only the top 1-2 most important tips are returned so the
        candidate isn't overwhelmed.
        """
        candidates: list[tuple[int, str]] = []  # (priority, tip)

        if 0 < eye_contact < 50:
            variations = [
                "Quick tip — try looking directly at the camera lens, it shows confidence.",
                "Try to make more eye contact with the camera. It makes a huge difference in how confident you come across.",
                "I noticed you're looking away quite a bit — aim for the camera lens, like you're talking to a friend.",
            ]
            candidates.append((1, random.choice(variations)))

        if 0 < posture_score < 60:
            variations = [
                "I noticed your posture dropped a bit — sit up straight, it'll help your confidence too.",
                "Quick posture check! Roll your shoulders back and sit tall — you'll feel and look more confident.",
                "Hey, straighten up a little! Good posture actually changes how people perceive your answers.",
            ]
            candidates.append((2, random.choice(variations)))

        if filler_count > 3:
            variations = [
                f"You've used filler words like 'um' about {filler_count} times — try pausing silently instead, it actually sounds more professional.",
                f"I counted around {filler_count} filler words. A quiet pause is way more powerful than an 'um' or 'uh'.",
                f"Heads up — you've said 'um' or 'uh' about {filler_count} times. Try taking a breath instead; silence is totally okay.",
            ]
            candidates.append((1, random.choice(variations)))

        if speaking_rate > 180:
            variations = [
                "You're speaking a bit fast — slow down and take a breath between points. It'll land better.",
                "Try to pace yourself a little. You're rushing, and slowing down will make your answers clearer.",
                "Hey, take it easy on the speed! A slower pace helps the interviewer absorb what you're saying.",
            ]
            candidates.append((2, random.choice(variations)))

        if 0 < speaking_rate < 100:
            variations = [
                "Try to pick up the pace slightly — you want to sound energetic and engaged.",
                "You're speaking a bit slowly. A touch more energy in your delivery will keep the interviewer engaged.",
                "Try adding a little more energy to your delivery — it helps you sound more enthusiastic.",
            ]
            candidates.append((3, random.choice(variations)))

        if lighting_quality in ("dim", "poor", "too_dark"):
            variations = [
                "The room lighting is a bit dim — if you can, turn on another light so I can see you better.",
                "Your lighting could be better. Face a window or add a desk lamp if possible — it makes a big difference on camera.",
                "It's a little dark on your end. If there's a light nearby, try positioning it in front of you.",
            ]
            candidates.append((3, random.choice(variations)))

        if blink_rate > 30:
            variations = [
                "You're blinking quite frequently — try to relax and take a deep breath.",
                "I notice a lot of blinking — totally normal when you're nervous. Take a slow breath, it helps.",
                "Quick tip: you're blinking a lot, which can signal nervousness. A couple of deep breaths will calm that right down.",
            ]
            candidates.append((4, random.choice(variations)))

        candidates.sort(key=lambda c: c[0])
        top_tips = [tip for _, tip in candidates[:2]]
        priority_tip = top_tips[0] if top_tips else ""

        return top_tips, priority_tip

    # -- Groq-powered generation (private) ----------------------------------

    def _generate_with_groq(
        self,
        role: str,
        difficulty: str,
        asked_questions: list[str] | None = None,
        resume_data: dict | None = None,
        memory: InterviewMemory | None = None,
    ) -> GeneratedQuestion | None:
        """Generate a question using Groq. Returns None on failure."""
        from app.services.groq_client import chat

        system_prompt = _build_system_prompt(
            extra=(
                "Generate exactly ONE interview question.\n"
                "Rules:\n"
                "- Match the difficulty level\n"
                "- Don't repeat topics already covered\n"
                "- If resume/memory provided, reference candidate's background\n"
                '- Return JSON: {"question": "...", "topic": "...", "skill_area": "...", '
                '"expected_duration_seconds": 120}'
            ),
            role=role,
        )

        memory_ctx = memory.to_context_prompt() if memory else ""
        user_prompt = (
            f"Role: {role}\n"
            f"Difficulty: {difficulty}\n"
            f"Already asked: {asked_questions or []}\n"
        )
        if memory_ctx:
            user_prompt += f"\n{memory_ctx}\n"
        elif resume_data:
            user_prompt += f"Resume: {json.dumps(resume_data)}\n"
        user_prompt += "\nGenerate one interview question. Return ONLY valid JSON."

        result = chat(system_prompt, user_prompt, temperature=0.8)
        if not result:
            return None

        try:
            data = json.loads(result.strip().strip("```json").strip("```"))
            return GeneratedQuestion(
                question=data["question"],
                topic=data.get("topic", "general"),
                skill_area=data.get("skill_area", "technical"),
                difficulty=self._normalize_difficulty(difficulty),
                expected_duration=data.get("expected_duration_seconds", 120),
            )
        except Exception:
            return None

    def _generate_followup_with_groq(
        self, question: str, answer: str
    ) -> tuple[str, str] | None:
        """Generate a follow-up using Groq. Returns None on failure."""
        from app.services.groq_client import chat

        system_prompt = _build_system_prompt(
            extra=(
                "Based on the candidate's answer, generate a relevant follow-up question.\n"
                "Rules:\n"
                "- Dig deeper into something specific they said\n"
                "- Reference their exact words or example\n"
                "- Don't ask a completely new topic — build on what they said\n"
                '- Return JSON: {"follow_up_question": "...", "rationale": "..."}'
            ),
        )

        user_prompt = (
            f"Previous question: {question}\n"
            f"Candidate's answer: {answer}\n\n"
            "Generate a follow-up question. Return ONLY valid JSON."
        )

        result = chat(system_prompt, user_prompt, temperature=0.7)
        if not result:
            return None

        try:
            data = json.loads(result.strip().strip("```json").strip("```"))
            followup = data.get("follow_up_question", "")
            rationale = data.get("rationale", "Following up on candidate response.")
            if followup:
                return followup, rationale
            return None
        except Exception:
            return None

    def _generate_dynamic_with_groq(
        self,
        conversation_history: list[dict],
        role: str,
        difficulty: str,
        resume_data: dict | None = None,
        memory: InterviewMemory | None = None,
    ) -> GeneratedQuestion | None:
        """Generate a dynamic question using Groq with interview memory."""
        from app.services.groq_client import chat

        system_prompt = _build_system_prompt(
            extra=(
                "Generate the NEXT question based on the interview context.\n"
                "Rules:\n"
                "- Reference what the candidate said earlier\n"
                "- Target topics NOT yet covered\n"
                "- If weaknesses identified, probe those areas\n"
                "- Mix technical deep-dives and behavioral questions\n"
                "- Adjust complexity based on candidate's performance\n"
                '- Return JSON: {"question": "...", "topic": "...", "skill_area": "...", '
                '"expected_duration_seconds": 120}'
            ),
            role=role,
        )

        # Use memory context if available, otherwise fall back to last messages
        if memory and memory.conversation_summary:
            context_text = memory.to_context_prompt()
        else:
            recent = conversation_history[-6:]
            context_text = "Recent conversation:\n" + "\n".join(
                f"{'Sarah' if e.get('role', '') == 'interviewer' else 'Candidate'}: {e.get('content', '')}"
                for e in recent
            )
            if resume_data:
                context_text += f"\nResume: {json.dumps(resume_data)}"

        user_prompt = (
            f"Role: {role}\n"
            f"Difficulty: {difficulty}\n\n"
            f"{context_text}\n\n"
            "Generate the next interview question. Return ONLY valid JSON."
        )

        result = chat(system_prompt, user_prompt, temperature=0.8)
        if not result:
            return None

        try:
            data = json.loads(result.strip().strip("```json").strip("```"))
            return GeneratedQuestion(
                question=data["question"],
                topic=data.get("topic", "general"),
                skill_area=data.get("skill_area", "technical"),
                difficulty=self._normalize_difficulty(difficulty),
                expected_duration=data.get("expected_duration_seconds", 120),
            )
        except Exception:
            return None

    def _generate_intro_with_groq(
        self,
        mode: str,
        user_name: str = "",
        resume_data: dict | None = None,
        target_role: str = "",
        duration_minutes: int = 20,
    ) -> tuple[str, str] | None:
        """Generate an intro using Groq. Returns None on failure."""
        from app.services.groq_client import chat

        mode_extra = (
            "You are in PRACTICE COACH mode. Be warm, encouraging, and mention you'll give tips along the way."
            if mode.upper() == "PRACTICE"
            else "You are in SERIOUS INTERVIEW mode. Be professional and composed."
        )

        system_prompt = _build_system_prompt(
            extra=(
                f"{mode_extra}\n"
                "Generate a natural opening introduction.\n"
                "If resume data provided, briefly acknowledge their background (1 specific detail).\n"
                'Return JSON: {"intro_text": "...", "follow_up_prompt": "..."}'
            ),
            role=target_role,
        )

        # Concise resume context instead of full JSON dump
        resume_ctx = "Not provided"
        if resume_data:
            parts = []
            if resume_data.get("contact", {}).get("name"):
                parts.append(f"Name: {resume_data['contact']['name']}")
            skills = resume_data.get("skills", [])[:10]
            if skills:
                parts.append(f"Skills: {', '.join(skills)}")
            for exp in (resume_data.get("experience") or [])[:1]:
                if exp.get("company") and exp.get("title"):
                    parts.append(f"Latest: {exp['title']} at {exp['company']}")
            resume_ctx = " | ".join(parts) if parts else "Not provided"

        user_prompt = (
            f"Candidate name: {user_name or 'the candidate'}\n"
            f"Target role: {target_role or 'software engineer'}\n"
            f"Duration: {duration_minutes} minutes\n"
            f"Resume highlights: {resume_ctx}\n\n"
            "Generate your intro. Return ONLY valid JSON."
        )

        result = chat(system_prompt, user_prompt, temperature=0.8)
        if not result:
            return None

        try:
            data = json.loads(result.strip().strip("```json").strip("```"))
            intro_text = data.get("intro_text", "")
            follow_up = data.get("follow_up_prompt", "")
            if intro_text and follow_up:
                return intro_text, follow_up
            return None
        except Exception:
            return None

    def _generate_answer_feedback_with_groq(
        self,
        question: str,
        answer: str,
        camera_metrics: dict | None = None,
        voice_metrics: dict | None = None,
    ) -> dict | None:
        """Generate answer feedback using Groq. Returns None on failure."""
        from app.services.groq_client import chat

        metrics_text = ""
        if camera_metrics:
            metrics_text += f"\nEye contact: {camera_metrics.get('eye_contact', 0) * 100:.0f}%"
            metrics_text += f"\nPosture: {camera_metrics.get('posture_score', 0) * 100:.0f}%"
        if voice_metrics:
            metrics_text += f"\nSpeaking rate: {voice_metrics.get('speaking_rate', 0)} WPM"
            metrics_text += f"\nFiller words: {voice_metrics.get('filler_count', 0)}"

        system_prompt = _build_system_prompt(
            extra=(
                "You are giving post-answer coaching feedback in Practice mode.\n"
                "Rules:\n"
                "- Lead with something specific they did well (not generic praise)\n"
                "- Give 1-2 actionable improvements with examples\n"
                "- If body language metrics show issues, give natural tips\n"
                "- Keep feedback under 100 words — conversational, not a lecture\n"
                "- End with a smooth transition to the next question\n"
                'Return JSON: {"feedback_text": "...", "strengths": [...], "improvements": [...], "transition": "..."}'
            ),
        )

        # RAG: get ideal answer for comparison
        rag_context = ""
        try:
            from app.services.rag_service import get_rag_service
            rag = get_rag_service()
            rag_context = rag.get_evaluation_context(question, answer)
        except Exception:
            pass

        user_prompt = (
            f"Question: {question}\n"
            f"Candidate's Answer: {answer}\n"
            f"{metrics_text}\n"
        )
        if rag_context:
            user_prompt += f"\n{rag_context}\n"
        user_prompt += "\nGive coaching feedback. Return ONLY valid JSON."

        result = chat(system_prompt, user_prompt, temperature=0.7)
        if not result:
            return None

        try:
            data = json.loads(result.strip().strip("```json").strip("```"))
            feedback_text = data.get("feedback_text", "")
            strengths = data.get("strengths", [])
            improvements = data.get("improvements", [])
            transition = data.get("transition", "Ready for the next question?")
            if feedback_text:
                return {
                    "feedback_text": feedback_text,
                    "strengths": strengths if isinstance(strengths, list) else [],
                    "improvements": improvements if isinstance(improvements, list) else [],
                    "transition": transition,
                }
            return None
        except Exception:
            return None

    def _generate_resume_question_with_groq(
        self,
        resume_data: dict,
        conversation_history: list[dict] | None = None,
        difficulty: str = "medium",
        target_role: str = "",
    ) -> dict | None:
        """Generate a resume-based question using Groq. Returns None on failure."""
        from app.services.groq_client import chat

        system_prompt = _build_system_prompt(
            extra=(
                "Generate a question based on the candidate's resume.\n"
                "Rules:\n"
                "- Reference a SPECIFIC skill, project, or company from their resume\n"
                "- Don't ask about something already discussed\n"
                "- Sound like you genuinely read their resume\n"
                "- Example: 'I see you worked on HobbyMet with MongoDB GeoJSON — how did you handle...'\n"
                '- Return JSON: {"question": "...", "metadata": {"topic": "...", "skill_area": "...", '
                '"difficulty": "...", "expected_duration_seconds": 120}, "resume_context": "..."}'
            ),
            role=target_role,
        )

        already_discussed = json.dumps(
            [
                e.get("content", "")[:50]
                for e in (conversation_history or [])
                if e.get("role") == "interviewer"
            ]
        )

        user_prompt = (
            f"Resume data: {json.dumps(resume_data)}\n"
            f"Target role: {target_role}\n"
            f"Difficulty: {difficulty}\n"
            f"Already discussed: {already_discussed}\n\n"
            "Generate a resume-based question. Return ONLY valid JSON."
        )

        result = chat(system_prompt, user_prompt, temperature=0.8)
        if not result:
            return None

        try:
            data = json.loads(result.strip().strip("```json").strip("```"))
            question = data.get("question", "")
            if not question:
                return None
            metadata = data.get("metadata", {})
            diff_key = self._normalize_difficulty(difficulty)
            return {
                "question": question,
                "topic": metadata.get("topic", "resume"),
                "skill_area": metadata.get("skill_area", "Resume"),
                "difficulty": diff_key,
                "expected_duration": metadata.get(
                    "expected_duration_seconds", self._get_duration(diff_key)
                ),
                "resume_context": data.get("resume_context", "Resume-based question"),
            }
        except Exception:
            return None

    # -- Helpers ------------------------------------------------------------

    def _normalize_difficulty(self, difficulty: str) -> str:
        d = difficulty.lower()
        if d in ("easy", "beginner"):
            return "easy"
        elif d in ("hard", "advanced", "expert"):
            return "hard"
        return "medium"

    def _get_duration(self, difficulty: str) -> int:
        return {"easy": 90, "medium": 120, "hard": 180}.get(difficulty, 120)
