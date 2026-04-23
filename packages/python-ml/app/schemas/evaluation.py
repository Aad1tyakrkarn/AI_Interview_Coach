from pydantic import BaseModel, Field


class AnswerEvaluateRequest(BaseModel):
    question: str = Field(..., description="The interview question")
    answer: str = Field(..., description="The candidate's answer")
    expected_topics: list[str] = Field(default_factory=list, description="Expected topics to cover")
    resume_data: dict | None = Field(None, description="Parsed resume data for alignment check")


class AnswerEvaluateResponse(BaseModel):
    correctness: float = Field(..., ge=0.0, le=1.0, description="Answer correctness score")
    similarity: float = Field(..., ge=0.0, le=1.0, description="Semantic similarity to expected answer")
    concepts_covered: list[str] = Field(default_factory=list, description="Topics covered in answer")
    concepts_missed: list[str] = Field(default_factory=list, description="Topics missed in answer")
    concept_coverage_ratio: float = Field(..., ge=0.0, le=1.0, description="Ratio of topics covered")
    resume_alignment: float = Field(..., ge=0.0, le=1.0, description="Alignment with resume/experience")
    label: str = Field(..., description="Overall label: strong, acceptable, needs_improvement")
    feedback: str = Field("", description="Feedback text")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence")
    communication_score: float = Field(..., ge=0.0, le=1.0, description="Communication quality score")
    technical_score: float = Field(..., ge=0.0, le=1.0, description="Technical depth score")
    completeness: float = Field(..., ge=0.0, le=1.0, description="Answer completeness score")


class SimilarityRequest(BaseModel):
    text_a: str = Field(..., description="First text")
    text_b: str = Field(..., description="Second text")


class SimilarityResponse(BaseModel):
    similarity: float = Field(..., ge=0.0, le=1.0, description="Similarity score")


class ConceptCoverageRequest(BaseModel):
    answer: str = Field(..., description="The candidate's answer")
    expected_topics: list[str] = Field(..., description="Expected topics to check")


class ConceptCoverageResponse(BaseModel):
    concepts_covered: list[str] = Field(default_factory=list)
    concepts_missed: list[str] = Field(default_factory=list)
    coverage_ratio: float = Field(..., ge=0.0, le=1.0)


class CommunicationRequest(BaseModel):
    answer: str = Field(..., description="The candidate's answer")


class CommunicationResponse(BaseModel):
    communication_score: float = Field(..., ge=0.0, le=1.0)


class CompletenessRequest(BaseModel):
    answer: str = Field(..., description="The candidate's answer")
    expected_topics: list[str] = Field(default_factory=list, description="Expected topics")


class CompletenessResponse(BaseModel):
    completeness: float = Field(..., ge=0.0, le=1.0)
