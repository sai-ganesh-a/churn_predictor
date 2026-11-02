import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'churn-prediction-secret-key-2026')
    
    # Database
    DB_PATH = BASE_DIR / 'database' / 'churn.db'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', f'sqlite:///{DB_PATH}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # File Storage
    UPLOAD_FOLDER = BASE_DIR / 'uploads'
    MODEL_FOLDER = BASE_DIR / 'saved_models'
    MAX_CONTENT_LENGTH = 32 * 1024 * 1024  # 32 MB max
    ALLOWED_EXTENSIONS = {'csv'}
    
    # Risk Classification Thresholds (configurable)
    # probability < 0.35: Low Risk
    # 0.35 <= probability < 0.65: Medium Risk
    # probability >= 0.65: High Risk
    RISK_THRESHOLD_LOW = float(os.environ.get('RISK_THRESHOLD_LOW', 0.35))
    RISK_THRESHOLD_HIGH = float(os.environ.get('RISK_THRESHOLD_HIGH', 0.65))

    @classmethod
    def init_app(cls):
        """Ensure necessary directories exist."""
        (BASE_DIR / 'database').mkdir(parents=True, exist_ok=True)
        cls.UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
        cls.MODEL_FOLDER.mkdir(parents=True, exist_ok=True)

