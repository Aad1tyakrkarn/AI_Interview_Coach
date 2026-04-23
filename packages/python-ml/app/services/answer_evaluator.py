import json
from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# Structured scoring rubric — injected into evaluation prompts
# ---------------------------------------------------------------------------

SCORING_RUBRIC = (
    "Score each dimension from 0.0 to 1.0 using this rubric:\n\n"
    "Technical Accuracy (weight: 0.30):\n"
    "  0.0-0.3: Major factual errors or no relevant content\n"
    "  0.4-0.6: Partially correct, missing key concepts\n"
    "  0.7-0.9: Correct with good depth\n"
    "  1.0: Expert-level, covers edge cases\n\n"
    "Communication (weight: 0.20):\n"
    "  Structure: Uses STAR method or clear intro/body/conclusion\n"
    "  Conciseness: 60-120 seconds ideal answer length\n"
    "  Examples: Specific real-world examples > generic theory\n\n"
    "Problem Solving (weight: 0.20):\n"
    "  Approach: Shows systematic thinking\n"
    "  Trade-offs: Mentions alternatives considered\n"
    "  Scalability: Thinks beyond immediate solution\n\n"
    "Relevance (weight: 0.15):\n"
    "  Directly answers the question asked\n"
    "  Stays on topic without tangents\n\n"
    "Depth (weight: 0.15):\n"
    "  Goes beyond surface-level explanation\n"
    "  Shows real-world experience, not textbook knowledge\n"
)


@dataclass
class EvalResult:
    correctness: float = 0.0
    similarity: float = 0.0
    concepts_covered: list[str] = field(default_factory=list)
    concepts_missed: list[str] = field(default_factory=list)
    concept_coverage_ratio: float = 0.0
    resume_alignment: float = 0.0
    label: str = "needs_improvement"  # strong, acceptable, needs_improvement
    feedback: str = ""
    confidence: float = 0.0
    communication_score: float = 0.0
    technical_score: float = 0.0
    completeness: float = 0.0


class AnswerEvaluator:
    """Answer evaluator using Groq (LLaMA 3.3 70B) with scoring rubric and RAG."""

    def evaluate(self, question: str, answer: str, expected_topics: list[str],
                 resume_data: dict | None = None, role: str = "") -> EvalResult:
        """Evaluate an interview answer using Groq with rubric + RAG context."""
        if not answer or not answer.strip():
            return EvalResult(label="needs_improvement", feedback="No answer provided.")

        # Get RAG context (ideal answer + key concepts)
        rag_context = ""
        rag_concepts: list[str] = []
        try:
            from app.services.rag_service import get_rag_service
            rag = get_rag_service()
            rag_context = rag.get_evaluation_context(question, answer, role=role)
            rag_concepts = rag.get_key_concepts(question, role=role)
        except Exception:
            pass

        # Merge RAG concepts with expected topics
        all_topics = list(set((expected_topics or []) + rag_concepts))

        groq_result = self._evaluate_with_groq(question, answer, all_topics, rag_context)
        if groq_result:
            covered = groq_result.get('covered_topics', [])
            missed = groq_result.get('missed_topics', [])
            total_topics = len(covered) + len(missed)
            return EvalResult(
                correctness=round(float(groq_result.get('correctness', 0.5)), 3),
                similarity=round(float(groq_result.get('relevance', 0.5)), 3),
                concepts_covered=covered,
                concepts_missed=missed,
                concept_coverage_ratio=round(len(covered) / max(total_topics, 1), 3),
                resume_alignment=0.0,
                label=groq_result.get('label', 'acceptable'),
                feedback=groq_result.get('feedback', ''),
                confidence=0.9,
                communication_score=round(float(groq_result.get('communication', 0.5)), 3),
                technical_score=round(float(groq_result.get('technical_depth', 0.5)), 3),
                completeness=round(float(groq_result.get('completeness', 0.5)), 3),
            )

        # Minimal fallback if Groq is completely down
        word_count = len(answer.split())
        return EvalResult(
            correctness=0.5,
            similarity=0.5,
            label="acceptable" if word_count > 20 else "needs_improvement",
            feedback="Evaluation service temporarily unavailable. Basic assessment based on response length.",
            confidence=0.3,
            communication_score=min(1.0, word_count / 100),
            technical_score=0.5,
            completeness=min(1.0, word_count / 80),
        )

    def _evaluate_with_groq(self, question: str, answer: str,
                            expected_topics: list[str] | None = None,
                            rag_context: str = "") -> dict | None:
        """Evaluate using Groq with scoring rubric and RAG reference."""
        from app.services.groq_client import chat

        system_prompt = (
            "You are an expert interview evaluator.\n\n"
            f"{SCORING_RUBRIC}\n"
            "If a reference answer is provided, use it as a GUIDE — the candidate\n"
            "may use different valid approaches. Don't penalize for different but correct methods.\n\n"
            "Return JSON with these fields:\n"
            "- correctness, completeness, communication, technical_depth, relevance: (0.0-1.0 each)\n"
            "- overall_score: weighted average using rubric weights\n"
            '- label: "strong" (>0.7), "acceptable" (0.4-0.7), "needs_improvement" (<0.4)\n'
            "- feedback: 2-3 sentences of constructive feedback\n"
            "- covered_topics: topics the candidate covered\n"
            "- missed_topics: important topics they missed\n"
            "- strengths: 2-3 specific strengths\n"
            "- improvements: 2-3 specific areas to improve\n\n"
            "Return ONLY valid JSON."
        )

        user_prompt = f"Question: {question}\nCandidate's Answer: {answer}\n"

        if expected_topics:
            user_prompt += f"\nKey Concepts to Check: {', '.join(expected_topics)}\n"

        if rag_context:
            user_prompt += f"\n{rag_context}\n"

        user_prompt += "\nEvaluate this answer. Return ONLY valid JSON."

        result = chat(system_prompt, user_prompt, temperature=0.3, max_tokens=1500)
        if not result:
            return None

        try:
            data = json.loads(result.strip().strip('```json').strip('```'))
            if 'overall_score' in data or 'correctness' in data:
                return data
            return None
        except Exception:
            return None

    def compute_similarity(self, text_a: str, text_b: str) -> float:
        """Compute similarity using Groq."""
        from app.services.groq_client import chat

        result = chat(
            "Return ONLY a number between 0.0 and 1.0 representing semantic similarity.",
            f"Text A: {text_a}\nText B: {text_b}\n\nSimilarity score (just the number):",
            temperature=0.1,
            max_tokens=10,
        )
        if result:
            try:
                return max(0.0, min(1.0, float(result.strip())))
            except ValueError:
                pass
        return 0.5
