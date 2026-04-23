from fastapi import APIRouter

from app.schemas.evaluation import (
    AnswerEvaluateRequest,
    AnswerEvaluateResponse,
    SimilarityRequest,
    SimilarityResponse,
    ConceptCoverageRequest,
    ConceptCoverageResponse,
    CommunicationRequest,
    CommunicationResponse,
    CompletenessRequest,
    CompletenessResponse,
)
from app.services.answer_evaluator import AnswerEvaluator

router = APIRouter(prefix="/ml/evaluate", tags=["evaluation"])

_evaluator = AnswerEvaluator()


@router.post("/answer", response_model=AnswerEvaluateResponse)
async def evaluate_answer(request: AnswerEvaluateRequest):
    """Evaluate an interview answer using Groq LLaMA 3.3 70B."""
    result = _evaluator.evaluate(
        question=request.question,
        answer=request.answer,
        expected_topics=request.expected_topics,
        resume_data=request.resume_data,
    )
    return AnswerEvaluateResponse(
        correctness=result.correctness,
        similarity=result.similarity,
        concepts_covered=result.concepts_covered,
        concepts_missed=result.concepts_missed,
        concept_coverage_ratio=result.concept_coverage_ratio,
        resume_alignment=result.resume_alignment,
        label=result.label,
        feedback=result.feedback,
        confidence=result.confidence,
        communication_score=result.communication_score,
        technical_score=result.technical_score,
        completeness=result.completeness,
    )


@router.post("/similarity", response_model=SimilarityResponse)
async def compute_similarity(request: SimilarityRequest):
    """Compute semantic similarity using Groq."""
    score = _evaluator.compute_similarity(request.text_a, request.text_b)
    return SimilarityResponse(similarity=round(score, 3))


@router.post("/concepts", response_model=ConceptCoverageResponse)
async def check_concepts(request: ConceptCoverageRequest):
    """Check concept coverage using Groq evaluation."""
    # Use full evaluation to get concept coverage
    result = _evaluator.evaluate(
        question=f"Topics to cover: {', '.join(request.expected_topics)}",
        answer=request.answer,
        expected_topics=request.expected_topics,
    )
    return ConceptCoverageResponse(
        concepts_covered=result.concepts_covered,
        concepts_missed=result.concepts_missed,
        coverage_ratio=result.concept_coverage_ratio,
    )


@router.post("/communication", response_model=CommunicationResponse)
async def evaluate_communication(request: CommunicationRequest):
    """Evaluate communication quality using Groq."""
    result = _evaluator.evaluate(
        question="Evaluate the communication quality of this response",
        answer=request.answer,
        expected_topics=[],
    )
    return CommunicationResponse(communication_score=result.communication_score)


@router.post("/completeness", response_model=CompletenessResponse)
async def evaluate_completeness(request: CompletenessRequest):
    """Evaluate completeness using Groq."""
    result = _evaluator.evaluate(
        question=f"Topics: {', '.join(request.expected_topics)}",
        answer=request.answer,
        expected_topics=request.expected_topics,
    )
    return CompletenessResponse(completeness=result.completeness)


@router.post("/model-answer")
async def generate_model_answer(request: dict):
    """Generate an ideal model answer for a given interview question using Groq."""
    from app.services.groq_client import chat

    question = request.get("question", "")
    role = request.get("role", "software engineer")

    if not question.strip():
        return {"model_answer": "Model answer not available."}

    result = chat(
        f"You are an expert {role}. Provide a concise ideal answer (3-5 sentences) to this interview question. Give only the answer itself, no preamble.",
        f"Question: {question}\n\nProvide a model answer:",
        temperature=0.5,
        max_tokens=300,
    )

    return {"model_answer": result or "Model answer not available."}
