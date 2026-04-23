from pydantic import BaseModel, Field


class SHAPExplainRequest(BaseModel):
    features: dict[str, float] = Field(..., description="Input features for explanation")
    prediction: float = Field(0.5, description="Model prediction value")


class FeatureImportance(BaseModel):
    feature: str
    importance: float
    direction: str = Field(..., description="positive or negative contribution")
    value: float


class SHAPExplainResponse(BaseModel):
    shap_values: dict[str, float] = Field(
        default_factory=dict, description="SHAP values per feature"
    )
    feature_importances: list[FeatureImportance] = Field(default_factory=list)
    base_value: float = Field(..., description="Model base/expected value")


class FeatureImportanceRequest(BaseModel):
    features: dict[str, float] = Field(..., description="Input features")
    prediction: float = Field(0.5, description="Model prediction value")


class FeatureImportanceResponse(BaseModel):
    feature_importances: list[FeatureImportance] = Field(default_factory=list)
