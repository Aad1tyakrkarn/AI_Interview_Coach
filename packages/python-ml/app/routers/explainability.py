from fastapi import APIRouter

from app.schemas.explainability import (
    SHAPExplainRequest,
    SHAPExplainResponse,
    FeatureImportance,
    FeatureImportanceRequest,
    FeatureImportanceResponse,
)
from app.services.shap_explainer import SHAPExplainer

router = APIRouter(prefix="/ml/explain", tags=["explainability"])

_explainer = SHAPExplainer()


@router.post("/shap", response_model=SHAPExplainResponse)
async def explain_shap(request: SHAPExplainRequest):
    """Generate SHAP explanations for an evaluation."""
    result = _explainer.explain(features=request.features, prediction=request.prediction)
    return SHAPExplainResponse(
        shap_values=result.shap_values,
        feature_importances=[
            FeatureImportance(
                feature=fi["feature"],
                importance=fi["importance"],
                direction=fi["direction"],
                value=fi["value"],
            )
            for fi in result.feature_importances
        ],
        base_value=result.base_value,
    )


@router.post("/feature-importance", response_model=FeatureImportanceResponse)
async def get_feature_importance(request: FeatureImportanceRequest):
    """Get ranked feature importances."""
    result = _explainer.explain(features=request.features, prediction=request.prediction)
    return FeatureImportanceResponse(
        feature_importances=[
            FeatureImportance(
                feature=fi["feature"],
                importance=fi["importance"],
                direction=fi["direction"],
                value=fi["value"],
            )
            for fi in result.feature_importances
        ],
    )
