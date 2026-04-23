from fastapi import APIRouter, HTTPException

from app.schemas.resume import ResumeParseRequest, ResumeParseResponse
from app.services.resume_parser import ResumeParser

router = APIRouter(prefix="/ml/resume", tags=["resume"])
parser = ResumeParser()


@router.post("/parse", response_model=ResumeParseResponse)
async def parse_resume(request: ResumeParseRequest):
    """Parse a resume file and extract structured data."""
    try:
        result = await parser.parse(
            request.file_url,
            request.file_type,
            file_content_base64=request.file_content_base64,
        )
        return ResumeParseResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(e)}")
