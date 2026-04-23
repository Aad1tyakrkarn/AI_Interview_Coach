from pydantic import BaseModel, Field


class GenerateQuestionRequest(BaseModel):
    job_role: str = Field(..., description="Target job role")
    difficulty: str = Field(..., description="Difficulty level: easy, medium, hard")
    context: dict | None = Field(None, description="Interview context and history")
    resume_data: dict | None = Field(None, description="Parsed resume data")
    interview_memory: dict | None = Field(None, description="Interview memory state for context")


class QuestionMetadata(BaseModel):
    topic: str
    skill_area: str
    expected_duration_seconds: int = Field(default=120)
    difficulty: str


class GenerateQuestionResponse(BaseModel):
    question: str = Field(..., description="Generated interview question")
    metadata: QuestionMetadata


class FollowUpRequest(BaseModel):
    previous_question: str = Field(..., description="The previous question asked")
    answer: str = Field(..., description="Candidate's answer to the previous question")
    context: dict | None = Field(None, description="Interview context")


class FollowUpResponse(BaseModel):
    follow_up_question: str = Field(..., description="Generated follow-up question")
    rationale: str | None = Field(None, description="Why this follow-up was chosen")


class AdaptDifficultyRequest(BaseModel):
    scores: list[float] = Field(..., description="Recent evaluation scores")
    current_difficulty: str = Field(..., description="Current difficulty level")


class AdaptDifficultyResponse(BaseModel):
    new_difficulty: str = Field(..., description="Adjusted difficulty level")
    reason: str = Field(..., description="Reason for the adjustment")


class AcknowledgeResponse(BaseModel):
    message: str = Field(..., description="Acknowledgement message for the candidate")


class EncourageResponse(BaseModel):
    message: str = Field(..., description="Encouragement message for the candidate")


class ClosingResponse(BaseModel):
    message: str = Field(..., description="Closing message for the interview session")


class SkipAckResponse(BaseModel):
    message: str = Field(..., description="Acknowledgement message when skipping a question")


class RephraseRequest(BaseModel):
    question: str = Field(..., description="The question to rephrase")


class RephraseResponse(BaseModel):
    rephrased_question: str = Field(..., description="The rephrased version of the question")


class ConversationEntry(BaseModel):
    role: str = Field(..., description="'interviewer' or 'candidate'")
    content: str = Field(..., description="The message content")


class DynamicQuestionRequest(BaseModel):
    job_role: str = Field(..., description="Target job role")
    difficulty: str = Field(..., description="Difficulty level: easy, medium, hard")
    conversation_history: list[ConversationEntry] = Field(
        default_factory=list,
        description="Full conversation history for context",
    )
    resume_data: dict | None = Field(None, description="Parsed resume data")
    interview_memory: dict | None = Field(None, description="Interview memory state for context")


class DynamicQuestionResponse(BaseModel):
    question: str = Field(..., description="Dynamically generated interview question")
    metadata: QuestionMetadata


# ---------------------------------------------------------------------------
# Practice Coach / Mock Interview mode schemas
# ---------------------------------------------------------------------------

class IntroRequest(BaseModel):
    mode: str = Field(..., description="Interview mode: 'PRACTICE' or 'MOCK'")
    user_name: str = Field(default="", description="User's first name")
    resume_data: dict | None = Field(None, description="Parsed resume data")
    target_role: str = Field(default="", description="Target job role")
    duration_minutes: int = Field(default=20, description="Planned interview duration")


class IntroResponse(BaseModel):
    intro_text: str = Field(..., description="Sarah's opening introduction")
    follow_up_prompt: str = Field(
        ...,
        description="Follow-up prompt like 'Tell me about yourself' or 'Shall we begin?'",
    )


class CoachingFeedbackRequest(BaseModel):
    eye_contact: float = Field(default=0, description="Eye contact percentage (0-100)")
    posture_score: float = Field(default=0, description="Posture score (0-100)")
    lighting_quality: str = Field(default="unknown", description="Lighting quality assessment")
    speaking_rate: float = Field(default=0, description="Words per minute")
    filler_count: int = Field(default=0, description="Number of filler words detected")
    blink_rate: float = Field(default=0, description="Blinks per minute")
    answer_duration_seconds: float = Field(default=0, description="Duration of the answer")


class CoachingFeedbackResponse(BaseModel):
    tips: list[str] = Field(default_factory=list, description="List of coaching tips")
    priority_tip: str = Field(default="", description="The single most important tip")
    tone: str = Field(
        default="encouraging",
        description="Tone of the feedback: encouraging, gentle, or neutral",
    )


class AnswerFeedbackRequest(BaseModel):
    question: str = Field(..., description="The question that was asked")
    answer: str = Field(..., description="The candidate's answer")
    eye_contact: float = Field(default=0, description="Eye contact percentage (0-100)")
    posture_score: float = Field(default=0, description="Posture score (0-100)")
    speaking_rate: float = Field(default=0, description="Words per minute")
    filler_count: int = Field(default=0, description="Number of filler words detected")
    answer_duration_seconds: float = Field(default=0, description="Duration of the answer")
    interview_memory: dict | None = Field(None, description="Interview memory state for context")


class AnswerFeedbackResponse(BaseModel):
    feedback_text: str = Field(..., description="Full coaching feedback paragraph")
    strengths: list[str] = Field(default_factory=list, description="What the candidate did well")
    improvements: list[str] = Field(
        default_factory=list, description="Specific areas to improve"
    )
    transition: str = Field(
        ..., description="Natural transition phrase leading to the next question"
    )


class ResumeQuestionRequest(BaseModel):
    resume_data: dict = Field(..., description="Parsed resume data")
    conversation_history: list[ConversationEntry] = Field(
        default_factory=list, description="Conversation so far"
    )
    difficulty: str = Field(default="medium", description="Difficulty level")
    target_role: str = Field(default="", description="Target job role")


class ResumeQuestionResponse(BaseModel):
    question: str = Field(..., description="Generated question based on resume")
    metadata: QuestionMetadata
    resume_context: str = Field(
        ..., description="Which part of the resume triggered this question"
    )
