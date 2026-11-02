from flask import Blueprint, jsonify, request, current_app
from werkzeug.utils import secure_filename
from app.models import db, DatasetInfo
from app.config import Config
from app.ml.preprocessor import clean_dataset
import pandas as pd
import os
import shutil
from pathlib import Path

dataset_bp = Blueprint('dataset', __name__)

def get_or_register_default_dataset():
    """Ensure existing dataset is registered in DatasetInfo table."""
    existing = DatasetInfo.query.order_by(DatasetInfo.uploaded_at.desc()).first()
    if existing and os.path.exists(existing.filepath):
        return existing
    
    candidates = [
        Path(__file__).resolve().parent.parent.parent.parent / 'dataset' / 'WA_Fn-UseC_-Telco-Customer-Churn.csv',
        Path('dataset/WA_Fn-UseC_-Telco-Customer-Churn.csv').resolve(),
        Path('../dataset/WA_Fn-UseC_-Telco-Customer-Churn.csv').resolve(),
    ]
    default_csv = None
    for p in candidates:
        if os.path.exists(p):
            default_csv = str(p)
            break

    if default_csv and os.path.exists(default_csv):
        # Copy to uploads folder
        dest_filename = 'WA_Fn-UseC_-Telco-Customer-Churn.csv'
        dest_path = str(Config.UPLOAD_FOLDER / dest_filename)
        shutil.copyfile(default_csv, dest_path)
        
        df_raw = pd.read_csv(dest_path)
        df_clean = clean_dataset(df_raw)
        
        summary = {
            "missing_values": int(df_clean.isnull().sum().sum()),
            "duplicates": int(df_clean.duplicated().sum()),
            "numerical_columns": ['tenure', 'MonthlyCharges', 'TotalCharges'],
            "categorical_columns": [c for c in df_clean.columns if c not in ['tenure', 'MonthlyCharges', 'TotalCharges', 'customerID', 'Churn']]
        }

        info = DatasetInfo(
            filename=dest_filename,
            filepath=dest_path,
            total_records=len(df_clean),
            total_features=len(df_clean.columns),
            target_column='Churn',
            id_column='customerID',
            columns_json=list(df_clean.columns),
            summary_stats=summary
        )
        db.session.add(info)
        db.session.commit()
        return info

    return None

@dataset_bp.route('/info', methods=['GET'])
def get_dataset_info():
    """Get metadata and schema for the active dataset."""
    info = get_or_register_default_dataset()
    if not info:
        return jsonify({
            "has_dataset": False,
            "message": "No dataset uploaded yet."
        }), 200

    data = info.to_dict()
    data['has_dataset'] = True
    return jsonify(data), 200

@dataset_bp.route('/preview', methods=['GET'])
def get_dataset_preview():
    """Preview top N rows of the dataset."""
    info = get_or_register_default_dataset()
    if not info or not os.path.exists(info.filepath):
        return jsonify({"message": "No dataset available for preview", "records": []}), 200

    limit = request.args.get('limit', default=10, type=int)
    try:
        df = pd.read_csv(info.filepath, nrows=limit)
        df = df.fillna('')
        return jsonify({
            "filename": info.filename,
            "total_records": info.total_records,
            "columns": list(df.columns),
            "records": df.to_dict(orient='records')
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to preview dataset: {str(e)}"}), 500

@dataset_bp.route('/upload', methods=['POST'])
def upload_dataset():
    """Upload a new CSV dataset."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not file.filename.lower().endswith('.csv'):
        return jsonify({"error": "Invalid file format. Only CSV files are permitted."}), 400

    try:
        filename = secure_filename(file.filename)
        dest_path = str(Config.UPLOAD_FOLDER / filename)
        file.save(dest_path)

        df_raw = pd.read_csv(dest_path)
        if len(df_raw) == 0:
            os.remove(dest_path)
            return jsonify({"error": "The uploaded CSV file is empty."}), 400

        # Check for Churn target column
        churn_candidates = [c for c in df_raw.columns if 'churn' in c.lower()]
        target_col = churn_candidates[0] if churn_candidates else None
        
        # Check for ID column
        id_candidates = [c for c in df_raw.columns if 'id' in c.lower()]
        id_col = id_candidates[0] if id_candidates else None

        df_clean = clean_dataset(df_raw)
        summary = {
            "missing_values": int(df_clean.isnull().sum().sum()),
            "duplicates": int(df_clean.duplicated().sum()),
            "numerical_columns": [c for c in ['tenure', 'MonthlyCharges', 'TotalCharges'] if c in df_clean.columns],
            "categorical_columns": [c for c in df_clean.columns if c not in ['tenure', 'MonthlyCharges', 'TotalCharges', id_col, target_col]]
        }

        info = DatasetInfo(
            filename=filename,
            filepath=dest_path,
            total_records=len(df_clean),
            total_features=len(df_clean.columns),
            target_column=target_col,
            id_column=id_col,
            columns_json=list(df_clean.columns),
            summary_stats=summary
        )
        db.session.add(info)
        db.session.commit()

        return jsonify({
            "status": "success",
            "message": f"Successfully uploaded and validated {filename}",
            "dataset": info.to_dict()
        }), 201

    except Exception as e:
        current_app.logger.error(f"Upload failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to process uploaded file: {str(e)}"}), 500
