from flask import Blueprint, jsonify, current_app, send_from_directory
from app.models import db, ModelMetrics
from app.ml.train import train_and_evaluate_models
from app.ml.predictor import ChurnPredictor
from app.config import Config
import os

model_bp = Blueprint('model', __name__)

@model_bp.route('/plots/<path:filename>', methods=['GET'])
def get_model_plot(filename):
    """Serve generated confusion matrix or feature importance plots."""
    return send_from_directory(Config.MODEL_FOLDER, filename)

@model_bp.route('/train', methods=['POST'])
def train_model():
    """Trigger model training and evaluation across all candidate algorithms."""
    try:
        current_app.logger.info("Starting model training and evaluation...")
        result = train_and_evaluate_models()
        # Reload predictor instance with newly trained model
        ChurnPredictor.reload()
        
        return jsonify({
            "status": "success",
            "message": f"Successfully trained and evaluated models. Best model: {result['best_model']['model_name']}",
            "best_model": result['best_model'],
            "comparison": result['comparison']
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error during training: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Model training failed: {str(e)}"
        }), 500

@model_bp.route('/metrics', methods=['GET'])
def get_model_metrics():
    """Retrieve best model metrics and artifacts."""
    best_model = ModelMetrics.query.filter_by(is_best=True).first()
    if not best_model:
        return jsonify({
            "trained": False,
            "message": "No model has been trained yet. Please train a model first."
        }), 200

    predictor = ChurnPredictor.get_instance()
    metadata = predictor.metadata

    # Find feature importances for best model from metadata
    feature_importances = []
    for m in metadata.get('models_comparison', []):
        if m.get('model_name') == best_model.model_name:
            feature_importances = m.get('feature_importances', [])
            break

    data = best_model.to_dict()
    data['trained'] = True
    data['feature_importances'] = feature_importances
    data['risk_thresholds'] = metadata.get('risk_thresholds', {'low': 0.35, 'high': 0.65})

    return jsonify(data), 200

@model_bp.route('/comparison', methods=['GET'])
def get_model_comparison():
    """Retrieve performance metrics for all evaluated models."""
    models = ModelMetrics.query.all()
    if not models:
        return jsonify({
            "trained": False,
            "models": [],
            "message": "No models trained yet."
        }), 200

    # Sort descending by recall (prioritizing churn detection)
    sorted_models = sorted([m.to_dict() for m in models], key=lambda x: (x['recall'], x['f1_score']), reverse=True)
    return jsonify({
        "trained": True,
        "models": sorted_models
    }), 200
