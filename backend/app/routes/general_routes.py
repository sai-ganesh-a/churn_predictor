from flask import Blueprint, jsonify
from app.models import db

general_bp = Blueprint('general', __name__)

@general_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify backend and database status."""
    try:
        # Check database connection
        db.session.execute(db.text('SELECT 1'))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return jsonify({
        "status": "healthy",
        "service": "Customer Churn Prediction API",
        "version": "1.0.0",
        "database": db_status
    }), 200

