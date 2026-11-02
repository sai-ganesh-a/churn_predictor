from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class DatasetInfo(db.Model):
    __tablename__ = 'dataset_info'
    
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(512), nullable=False)
    total_records = db.Column(db.Integer, nullable=False, default=0)
    total_features = db.Column(db.Integer, nullable=False, default=0)
    target_column = db.Column(db.String(100), nullable=True)
    id_column = db.Column(db.String(100), nullable=True)
    columns_json = db.Column(db.JSON, nullable=True)
    summary_stats = db.Column(db.JSON, nullable=True)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'total_records': self.total_records,
            'total_features': self.total_features,
            'target_column': self.target_column,
            'id_column': self.id_column,
            'columns': self.columns_json,
            'summary_stats': self.summary_stats,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }


class Customer(db.Model):
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_identifier = db.Column(db.String(100), index=True, nullable=False)
    customer_data = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship to predictions
    predictions = db.relationship('Prediction', backref='customer', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'customer_identifier': self.customer_identifier,
            'customer_data': self.customer_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Prediction(db.Model):
    __tablename__ = 'predictions'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    customer_identifier = db.Column(db.String(100), index=True, nullable=False)
    churn_prediction = db.Column(db.String(10), nullable=False)  # 'Yes' or 'No'
    churn_probability = db.Column(db.Float, nullable=False)     # 0.0 to 1.0
    risk_category = db.Column(db.String(20), nullable=False)     # 'Low', 'Medium', 'High'
    model_name = db.Column(db.String(100), nullable=False)
    input_data = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'customer_identifier': self.customer_identifier,
            'churn_prediction': self.churn_prediction,
            'churn_probability': round(self.churn_probability * 100, 2),  # percentage
            'churn_probability_raw': self.churn_probability,
            'risk_category': self.risk_category,
            'model_name': self.model_name,
            'input_data': self.input_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ModelMetrics(db.Model):
    __tablename__ = 'model_metrics'
    
    id = db.Column(db.Integer, primary_key=True)
    model_name = db.Column(db.String(100), nullable=False)
    accuracy = db.Column(db.Float, nullable=False)
    precision = db.Column(db.Float, nullable=False)
    recall = db.Column(db.Float, nullable=False)
    f1_score = db.Column(db.Float, nullable=False)
    confusion_matrix = db.Column(db.JSON, nullable=True)
    classification_report = db.Column(db.JSON, nullable=True)
    is_best = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'model_name': self.model_name,
            'accuracy': round(self.accuracy * 100, 2),
            'precision': round(self.precision * 100, 2),
            'recall': round(self.recall * 100, 2),
            'f1_score': round(self.f1_score * 100, 2),
            'confusion_matrix': self.confusion_matrix,
            'classification_report': self.classification_report,
            'is_best': self.is_best,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

