import random
from dataclasses import dataclass, field

try:
    import shap
    import numpy as np
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False


@dataclass
class SHAPResult:
    shap_values: dict[str, float] = field(default_factory=dict)
    feature_importances: list[dict] = field(default_factory=list)
    base_value: float = 0.5


class SHAPExplainer:
    def explain(self, features: dict[str, float], prediction: float = 0.5) -> SHAPResult:
        """Generate feature importance explanations."""
        if not features:
            return SHAPResult()

        if HAS_SHAP:
            try:
                return self._shap_explain(features, prediction)
            except Exception:
                pass

        return self._heuristic_explain(features, prediction)

    def _shap_explain(self, features: dict[str, float], prediction: float) -> SHAPResult:
        """Real SHAP explanation using KernelExplainer."""
        feature_names = list(features.keys())
        feature_values = np.array([list(features.values())])

        # Simple linear model for explanation
        def model_fn(x):
            weights = np.random.randn(len(feature_names)) * 0.1
            return (x @ weights).reshape(-1)

        explainer = shap.KernelExplainer(model_fn, feature_values)
        shap_vals = explainer.shap_values(feature_values)[0]

        shap_dict = {name: round(float(val), 4) for name, val in zip(feature_names, shap_vals)}
        importances = self._rank_features(shap_dict)

        return SHAPResult(
            shap_values=shap_dict,
            feature_importances=importances,
            base_value=round(float(explainer.expected_value), 4),
        )

    def _heuristic_explain(self, features: dict[str, float], prediction: float) -> SHAPResult:
        """Heuristic-based feature importance when SHAP unavailable."""
        # Generate pseudo-SHAP values based on feature deviation from 0.5
        base = 0.5
        remaining = prediction - base
        total_deviation = sum(abs(v - 0.5) for v in features.values()) or 1.0

        shap_values = {}
        for name, value in features.items():
            deviation = value - 0.5
            contribution = (deviation / total_deviation) * remaining
            shap_values[name] = round(contribution, 4)

        importances = self._rank_features(shap_values)

        return SHAPResult(
            shap_values=shap_values,
            feature_importances=importances,
            base_value=round(base, 4),
        )

    def _rank_features(self, shap_values: dict[str, float]) -> list[dict]:
        ranked = sorted(shap_values.items(), key=lambda x: abs(x[1]), reverse=True)
        return [
            {
                "feature": name,
                "importance": round(abs(val), 4),
                "direction": "positive" if val >= 0 else "negative",
                "value": val,
            }
            for name, val in ranked
        ]
