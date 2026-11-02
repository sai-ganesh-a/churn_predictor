from flask import Blueprint, jsonify, current_app
from app.models import DatasetInfo, Prediction
from app.ml.preprocessor import clean_dataset
import pandas as pd
import os

analytics_bp = Blueprint('analytics', __name__)

def get_current_df():
    from app.config import Config
    from pathlib import Path
    dataset = DatasetInfo.query.order_by(DatasetInfo.uploaded_at.desc()).first()
    filepath = dataset.filepath if dataset and os.path.exists(dataset.filepath) else None
    
    if not filepath:
        candidates = [
            Config.UPLOAD_FOLDER / 'WA_Fn-UseC_-Telco-Customer-Churn.csv',
            Path(__file__).resolve().parent.parent.parent.parent / 'dataset' / 'WA_Fn-UseC_-Telco-Customer-Churn.csv',
            Path('dataset/WA_Fn-UseC_-Telco-Customer-Churn.csv').resolve(),
            Path('../dataset/WA_Fn-UseC_-Telco-Customer-Churn.csv').resolve(),
        ]
        for p in candidates:
            if os.path.exists(p):
                filepath = str(p)
                break

    if not filepath or not os.path.exists(filepath):
        return None
    df_raw = pd.read_csv(filepath)
    return clean_dataset(df_raw)

@analytics_bp.route('/overview', methods=['GET'])
def get_analytics_overview():
    """Return top-level KPIs from dataset and prediction history."""
    df = get_current_df()
    if df is None:
        return jsonify({"has_data": False, "message": "No dataset found."}), 200

    total_customers = len(df)
    churn_counts = df['Churn'].value_counts()
    churned = int(churn_counts.get('Yes', 0))
    retained = int(churn_counts.get('No', 0))
    churn_rate = round((churned / total_customers) * 100, 2) if total_customers > 0 else 0.0

    # Prediction system stats
    total_predictions = Prediction.query.count()
    high_risk_predictions = Prediction.query.filter_by(risk_category='High').count()

    return jsonify({
        "has_data": True,
        "total_customers": total_customers,
        "churned_customers": churned,
        "retained_customers": retained,
        "churn_rate": churn_rate,
        "total_predictions": total_predictions,
        "high_risk_predictions": high_risk_predictions
    }), 200

@analytics_bp.route('/churn-distribution', methods=['GET'])
def get_churn_distribution():
    """Return churn vs retained counts and percentages for charts."""
    df = get_current_df()
    if df is None:
        return jsonify({"has_data": False}), 200

    churn_counts = df['Churn'].value_counts()
    churned = int(churn_counts.get('Yes', 0))
    retained = int(churn_counts.get('No', 0))

    return jsonify({
        "distribution": [
            {"name": "Retained", "value": retained, "color": "#10b981"},
            {"name": "Churned", "value": churned, "color": "#ef4444"}
        ]
    }), 200

@analytics_bp.route('/churn-factors', methods=['GET'])
def get_churn_factors():
    """Return multi-dimensional churn breakdown across key customer dimensions."""
    df = get_current_df()
    if df is None:
        return jsonify({"has_data": False}), 200

    # 1. Churn by Contract
    contract_df = df.groupby(['Contract', 'Churn']).size().unstack(fill_value=0)
    contract_stats = []
    for contract in contract_df.index:
        no_count = int(contract_df.loc[contract].get('No', 0))
        yes_count = int(contract_df.loc[contract].get('Yes', 0))
        total = no_count + yes_count
        rate = round((yes_count / total) * 100, 2) if total > 0 else 0.0
        contract_stats.append({
            "contract": contract,
            "retained": no_count,
            "churned": yes_count,
            "churn_rate": rate
        })

    # 2. Churn by Tenure Cohort
    bins = [0, 12, 24, 36, 48, 60, 72]
    labels = ['0-12m', '13-24m', '25-36m', '37-48m', '49-60m', '61-72m']
    df['tenure_group'] = pd.cut(df['tenure'], bins=bins, labels=labels, include_lowest=True)
    tenure_df = df.groupby(['tenure_group', 'Churn'], observed=False).size().unstack(fill_value=0)
    tenure_stats = []
    for t_grp in labels:
        if t_grp in tenure_df.index:
            no_count = int(tenure_df.loc[t_grp].get('No', 0))
            yes_count = int(tenure_df.loc[t_grp].get('Yes', 0))
            total = no_count + yes_count
            rate = round((yes_count / total) * 100, 2) if total > 0 else 0.0
            tenure_stats.append({
                "tenure_group": t_grp,
                "retained": no_count,
                "churned": yes_count,
                "churn_rate": rate
            })

    # 3. Churn by Payment Method
    payment_df = df.groupby(['PaymentMethod', 'Churn']).size().unstack(fill_value=0)
    payment_stats = []
    for pm in payment_df.index:
        no_count = int(payment_df.loc[pm].get('No', 0))
        yes_count = int(payment_df.loc[pm].get('Yes', 0))
        total = no_count + yes_count
        rate = round((yes_count / total) * 100, 2) if total > 0 else 0.0
        payment_stats.append({
            "payment_method": pm,
            "retained": no_count,
            "churned": yes_count,
            "churn_rate": rate
        })

    # 4. Churn by Internet Service
    internet_df = df.groupby(['InternetService', 'Churn']).size().unstack(fill_value=0)
    internet_stats = []
    for iserv in internet_df.index:
        no_count = int(internet_df.loc[iserv].get('No', 0))
        yes_count = int(internet_df.loc[iserv].get('Yes', 0))
        total = no_count + yes_count
        rate = round((yes_count / total) * 100, 2) if total > 0 else 0.0
        internet_stats.append({
            "internet_service": iserv,
            "retained": no_count,
            "churned": yes_count,
            "churn_rate": rate
        })

    return jsonify({
        "by_contract": contract_stats,
        "by_tenure": tenure_stats,
        "by_payment_method": payment_stats,
        "by_internet_service": internet_stats
    }), 200
