from pydantic import BaseModel, Field


class ContactInfo(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    linkedin: str | None = None
    location: str | None = None


class Education(BaseModel):
    institution: str
    degree: str
    field_of_study: str | None = None
    start_year: int | None = None
    end_year: int | None = None
    gpa: float | None = None


class Experience(BaseModel):
    company: str
    title: str
    start_date: str | None = None
    end_date: str | None = None
    description: str | None = None
    highlights: list[str] = Field(default_factory=list)


class ResumeParseRequest(BaseModel):
    file_url: str = Field(..., description="URL of the resume file to parse")
    file_type: str = Field(..., description="File type: pdf, docx, or txt")
    file_content_base64: str | None = Field(
        None,
        description="Base64-encoded file content. When provided, file_url download is skipped.",
    )


class ResumeParseResponse(BaseModel):
    skills: list[str] = Field(default_factory=list)
    experience: list[Experience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    contact: ContactInfo | None = None
    summary: str | None = None
    raw_text: str | None = None
