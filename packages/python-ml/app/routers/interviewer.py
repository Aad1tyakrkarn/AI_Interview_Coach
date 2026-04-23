from fastapi import APIRouter

from app.schemas.interviewer import (
    AcknowledgeResponse,
    AdaptDifficultyRequest,
    AdaptDifficultyResponse,
    AnswerFeedbackRequest,
    AnswerFeedbackResponse,
    ClosingResponse,
    CoachingFeedbackRequest,
    CoachingFeedbackResponse,
    DynamicQuestionRequest,
    DynamicQuestionResponse,
    EncourageResponse,
    FollowUpRequest,
    FollowUpResponse,
    GenerateQuestionRequest,
    GenerateQuestionResponse,
    IntroRequest,
    IntroResponse,
    QuestionMetadata,
    RephraseRequest,
    RephraseResponse,
    ResumeQuestionRequest,
    ResumeQuestionResponse,
    SkipAckResponse,
)
from app.services.interview_memory import InterviewMemory
from app.services.question_generator import QuestionGenerator

router = APIRouter(prefix="/ml/interviewer", tags=["interviewer"])

# Shared instance
_generator = QuestionGenerator()


def _build_memory(data: dict | None) -> InterviewMemory | None:
    """Build InterviewMemory from request dict, or None."""
    if not data:
        return None
    return InterviewMemory.from_dict(data)


@router.post("/generate-question", response_model=GenerateQuestionResponse)
async def generate_question(request: GenerateQuestionRequest):
    """Generate an interview question based on role and context."""
    memory = _build_memory(request.interview_memory)
    result = _generator.generate(
        role=request.job_role,
        difficulty=request.difficulty,
        context=request.context,
        resume_data=request.resume_data,
        memory=memory,
    )
    return GenerateQuestionResponse(
        question=result.question,
        metadata=QuestionMetadata(
            topic=result.topic,
            skill_area=result.skill_area,
            expected_duration_seconds=result.expected_duration,
            difficulty=result.difficulty,
        ),
    )


@router.post("/follow-up", response_model=FollowUpResponse)
async def generate_follow_up(request: FollowUpRequest):
    """Generate a follow-up question based on previous Q&A."""
    followup, rationale = _generator.generate_followup(
        question=request.previous_question,
        answer=request.answer,
        context=request.context,
    )
    return FollowUpResponse(
        follow_up_question=followup,
        rationale=rationale,
    )


@router.post("/adapt-difficulty", response_model=AdaptDifficultyResponse)
async def adapt_difficulty(request: AdaptDifficultyRequest):
    """Adapt interview difficulty based on candidate performance."""
    new_difficulty, reason = _generator.adapt_difficulty(
        scores=request.scores,
        current_difficulty=request.current_difficulty,
    )
    return AdaptDifficultyResponse(
        new_difficulty=new_difficulty,
        reason=reason,
    )


@router.post("/acknowledge", response_model=AcknowledgeResponse)
async def acknowledge():
    """Get an acknowledgement message for the candidate's answer."""
    return AcknowledgeResponse(message=_generator.get_acknowledgement())


@router.post("/encourage", response_model=EncourageResponse)
async def encourage():
    """Get an encouragement message for the candidate."""
    return EncourageResponse(message=_generator.get_encouragement())


@router.post("/closing", response_model=ClosingResponse)
async def closing():
    """Get a closing message for the interview session."""
    return ClosingResponse(message=_generator.get_closing_message())


@router.post("/skip-ack", response_model=SkipAckResponse)
async def skip_ack():
    """Get an acknowledgement message when skipping a question."""
    return SkipAckResponse(message=_generator.get_skip_acknowledgement())


@router.post("/generate-dynamic", response_model=DynamicQuestionResponse)
async def generate_dynamic_question(request: DynamicQuestionRequest):
    """Generate a dynamic question based on conversation history."""
    history = [{"role": e.role, "content": e.content} for e in request.conversation_history]
    memory = _build_memory(request.interview_memory)
    result = _generator.generate_dynamic(
        role=request.job_role,
        difficulty=request.difficulty,
        conversation_history=history,
        resume_data=request.resume_data,
        memory=memory,
    )
    return DynamicQuestionResponse(
        question=result.question,
        metadata=QuestionMetadata(
            topic=result.topic,
            skill_area=result.skill_area,
            expected_duration_seconds=result.expected_duration,
            difficulty=result.difficulty,
        ),
    )


@router.post("/rephrase", response_model=RephraseResponse)
async def rephrase(request: RephraseRequest):
    """Rephrase a question to be clearer."""
    return RephraseResponse(
        rephrased_question=_generator.rephrase_question(request.question),
    )


# ---------------------------------------------------------------------------
# Practice Coach / Mock Interview mode endpoints
# ---------------------------------------------------------------------------


@router.post("/intro", response_model=IntroResponse)
async def generate_intro(request: IntroRequest):
    """Generate Sarah's mode-appropriate opening introduction."""
    intro_text, follow_up = _generator.generate_intro(
        mode=request.mode,
        user_name=request.user_name,
        resume_data=request.resume_data,
        target_role=request.target_role,
        duration_minutes=request.duration_minutes,
    )
    return IntroResponse(intro_text=intro_text, follow_up_prompt=follow_up)


@router.post("/coaching-feedback", response_model=CoachingFeedbackResponse)
async def coaching_feedback(request: CoachingFeedbackRequest):
    """Return real-time coaching tips based on camera and voice metrics (Practice mode)."""
    tips, priority_tip = _generator.generate_coaching_feedback(
        eye_contact=request.eye_contact,
        posture_score=request.posture_score,
        lighting_quality=request.lighting_quality,
        speaking_rate=request.speaking_rate,
        filler_count=request.filler_count,
        blink_rate=request.blink_rate,
    )
    # Determine tone based on how many issues were found
    if not tips:
        tone = "encouraging"
    elif len(tips) == 1:
        tone = "gentle"
    else:
        tone = "neutral"
    return CoachingFeedbackResponse(tips=tips, priority_tip=priority_tip, tone=tone)


@router.post("/answer-feedback", response_model=AnswerFeedbackResponse)
async def answer_feedback(request: AnswerFeedbackRequest):
    """Generate post-answer coaching feedback (Practice mode only)."""
    result = _generator.generate_answer_feedback(
        question=request.question,
        answer=request.answer,
        eye_contact=request.eye_contact,
        posture_score=request.posture_score,
        speaking_rate=request.speaking_rate,
        filler_count=request.filler_count,
        answer_duration_seconds=request.answer_duration_seconds,
    )
    return AnswerFeedbackResponse(
        feedback_text=result["feedback_text"],
        strengths=result["strengths"],
        improvements=result["improvements"],
        transition=result["transition"],
    )


@router.post("/resume-question", response_model=ResumeQuestionResponse)
async def resume_question(request: ResumeQuestionRequest):
    """Generate a question based on the candidate's resume."""
    history = [{"role": e.role, "content": e.content} for e in request.conversation_history]
    result = _generator.generate_resume_question(
        resume_data=request.resume_data,
        conversation_history=history,
        difficulty=request.difficulty,
        target_role=request.target_role,
    )
    return ResumeQuestionResponse(
        question=result["question"],
        metadata=QuestionMetadata(
            topic=result["topic"],
            skill_area=result["skill_area"],
            expected_duration_seconds=result["expected_duration"],
            difficulty=result["difficulty"],
        ),
        resume_context=result["resume_context"],
    )
