import os
from pathlib import Path
import joblib
import pandas as pd
import numpy as np
from app.config import Config
from app.ml.preprocessor import (
    clean_dataset,
    NUMERICAL_FEATURES,
    CATEGORICAL_FEATURES,
    ID_COLUMN
)

class ChurnPredictor:
    _instance = None
    _pipeline = None
    _metadata = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ChurnPredictor()
        return cls._instance

    @classmethod
    def reload(cls):
        """Force reloading of the model from disk (e.g., after retraining)."""
        cls._pipeline = None
        cls._metadata = None
        return cls.get_instance().load()

    def load(self):
        model_path = Config.MODEL_FOLDER / 'best_model.joblib'
        meta_path = Config.MODEL_FOLDER / 'model_metadata.joblib'
        
        if not model_path.exists() or not meta_path.exists():
            return False

        try:
            self._pipeline = joblib.load(model_path)
            self._metadata = joblib.load(meta_path)
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False

    @property
    def is_ready(self):
        if self._pipeline is None:
            self.load()
        return self._pipeline is not None

    @property
    def metadata(self):
        if self._metadata is None:
            self.load()
        return self._metadata or {}

    def get_risk_category(self, prob: float) -> str:
        """Classify churn risk based on probability thresholds."""
        low_thresh = self.metadata.get('risk_thresholds', {}).get('low', Config.RISK_THRESHOLD_LOW)
        high_thresh = self.metadata.get('risk_thresholds', {}).get('high', Config.RISK_THRESHOLD_HIGH)
        
        if prob >= high_thresh:
            return 'High'
        elif prob >= low_thresh:
            return 'Medium'
        else:
            return 'Low'

    def generate_explanation(self, data: dict, prob: float) -> str:
        """Generate a concise, human-readable insight based on key risk drivers."""
        reasons = []
        contract = data.get('Contract', '')
        tenure = float(data.get('tenure', 0))
        monthly = float(data.get('MonthlyCharges', 0))
        tech = data.get('TechSupport', '')
        internet = data.get('InternetService', '')
        payment = data.get('PaymentMethod', '')

        if contract == 'Month-to-month':
            reasons.append("month-to-month contract (higher flexibility to leave)")
        if tenure <= 12:
            reasons.append(f"short tenure ({int(tenure)} months)")
        if monthly > 70:
            reasons.append(f"above-average monthly charges (${monthly:.2f})")
        if tech == 'No':
            reasons.append("lack of tech support subscription")
        if payment == 'Electronic check':
            reasons.append("payment via electronic check")
        if internet == 'Fiber optic':
            reasons.append("fiber optic service tier with high churn sensitivity")

        if not reasons:
            if prob < 0.35:
                return "Customer demonstrates strong retention indicators (long-term contract, bundled services, or long tenure)."
            return "Customer metrics reflect standard profile patterns."

        prefix = "Higher risk driven by: " if prob >= 0.5 else "Retention factors balanced by: "
        return prefix + "; ".join(reasons[:3]) + "."

    def predict_single(self, input_data: dict) -> dict:
        """
        Validate input, apply pipeline, and return prediction, probability, risk level, and explanation.
        """
        if not self.is_ready:
            raise RuntimeError("Model is not trained yet. Please train the model first.")

        # Ensure all expected columns are present
        cleaned_input = {}
        for feat in NUMERICAL_FEATURES:
            val = input_data.get(feat, 0.0)
            try:
                cleaned_input[feat] = float(val)
            except (ValueError, TypeError):
                cleaned_input[feat] = 0.0

        for feat in CATEGORICAL_FEATURES:
            cleaned_input[feat] = str(input_data.get(feat, 'No'))

        # Special logic: if tenure == 0 and TotalCharges is 0, keep 0.0
        if cleaned_input.get('tenure', 0) == 0:
            cleaned_input['TotalCharges'] = 0.0

        df_single = pd.DataFrame([cleaned_input])

        # Prediction
        prediction_val = int(self._pipeline.predict(df_single)[0])
        probabilities = self._pipeline.predict_proba(df_single)[0]
        churn_prob = float(probabilities[1])
        prediction_label = "Yes" if prediction_val == 1 else "No"
        risk_category = self.get_risk_category(churn_prob)
        explanation = self.generate_explanation(cleaned_input, churn_prob)

        return {
            "churn_prediction": prediction_label,
            "churn_probability": round(churn_prob * 100, 2),
            "churn_probability_raw": round(churn_prob, 4),
            "risk_category": risk_category,
            "explanation": explanation,
            "model_name": self.metadata.get('best_model_name', 'Trained Classifier'),
            "features_evaluated": cleaned_input
        }

    def predict_batch(self, df: pd.DataFrame) -> list:
        """Run batch predictions on an entire dataframe."""
        if not self.is_ready:
            raise RuntimeError("Model is not trained yet. Please train the model first.")

        df_clean = clean_dataset(df)
        id_series = df_clean[ID_COLUMN] if ID_COLUMN in df_clean.columns else pd.Series([f"CUST-{i}" for i in range(len(df_clean))])
        
        # Prepare feature matrix
        feature_cols = [c for c in df_clean.columns if c not in [ID_COLUMN, 'Churn']]
        X = df_clean[feature_cols]

        preds = self._pipeline.predict(X)
        probs = self._pipeline.predict_proba(X)[:, 1]

        results = []
        for cid, pred, prob, (_, row) in zip(id_series, preds, probs, df_clean.iterrows()):
            risk = self.get_risk_category(prob)
            results.append({
                'customer_identifier': str(cid),
                'churn_prediction': "Yes" if pred == 1 else "No",
                'churn_probability': round(float(prob) * 100, 2),
                'churn_probability_raw': round(float(prob), 4),
                'risk_category': risk,
                'tenure': int(row.get('tenure', 0)),
                'contract': str(row.get('Contract', '')),
                'monthly_charges': float(row.get('MonthlyCharges', 0.0)),
                'total_charges': float(row.get('TotalCharges', 0.0)),
                'model_name': self.metadata.get('best_model_name', 'Trained Classifier')
            })

        return results

