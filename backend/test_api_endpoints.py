import sys
import json
sys.path.insert(0, '.')

from app import create_app, db
from app.models import DatasetInfo, ModelMetrics, Prediction, Customer

app = create_app()
client = app.test_client()

def test_all():
    print("=== TESTING REST API ENDPOINTS ===")
    
    # 1. Health Check
    res = client.get('/api/health')
    print("1. /api/health:", res.status_code, res.get_json())
    assert res.status_code == 200

    # 2. Dataset Info
    res = client.get('/api/dataset/info')
    print("2. /api/dataset/info:", res.status_code, res.get_json().get('total_records'), "records")
    assert res.status_code == 200

    # 3. Dataset Preview
    res = client.get('/api/dataset/preview?limit=3')
    print("3. /api/dataset/preview:", res.status_code, f"{len(res.get_json().get('records', []))} preview rows")
    assert res.status_code == 200

    # 4. Analytics Overview
    res = client.get('/api/analytics/overview')
    print("4. /api/analytics/overview:", res.status_code, res.get_json())
    assert res.status_code == 200

    # 5. Analytics Churn Distribution
    res = client.get('/api/analytics/churn-distribution')
    print("5. /api/analytics/churn-distribution:", res.status_code, res.get_json())
    assert res.status_code == 200

    # 6. Analytics Factors
    res = client.get('/api/analytics/churn-factors')
    print("6. /api/analytics/churn-factors:", res.status_code, f"{len(res.get_json().get('by_contract', []))} contract types")
    assert res.status_code == 200

    # 7. Model Metrics
    res = client.get('/api/model/metrics')
    metrics_data = res.get_json()
    print("7. /api/model/metrics:", res.status_code, f"Best Model: {metrics_data.get('model_name')}, Recall: {metrics_data.get('recall')}%, F1: {metrics_data.get('f1_score')}%")
    assert res.status_code == 200

    # 8. Model Comparison
    res = client.get('/api/model/comparison')
    comp_data = res.get_json()
    print("8. /api/model/comparison:", res.status_code, f"{len(comp_data.get('models', []))} models evaluated")
    assert res.status_code == 200

    # 9. Predict Single (Individual Customer)
    customer_payload = {
        'customerID': 'TEST-9999',
        'gender': 'Male',
        'SeniorCitizen': '0',
        'Partner': 'No',
        'Dependents': 'No',
        'tenure': 3,
        'PhoneService': 'Yes',
        'MultipleLines': 'No',
        'InternetService': 'Fiber optic',
        'OnlineSecurity': 'No',
        'OnlineBackup': 'No',
        'DeviceProtection': 'No',
        'TechSupport': 'No',
        'StreamingTV': 'Yes',
        'StreamingMovies': 'Yes',
        'Contract': 'Month-to-month',
        'PaperlessBilling': 'Yes',
        'PaymentMethod': 'Electronic check',
        'MonthlyCharges': 89.50,
        'TotalCharges': 268.50
    }
    res = client.post('/api/predict', json=customer_payload)
    pred_data = res.get_json()
    print("9. /api/predict:", res.status_code, pred_data)
    assert res.status_code == 200
    assert pred_data.get('churn_prediction') in ['Yes', 'No']

    # 10. Predict Batch (Run across dataset and populate SQLite)
    res = client.post('/api/predict/batch')
    batch_data = res.get_json()
    print("10. /api/predict/batch:", res.status_code, batch_data)
    assert res.status_code == 200

    # 11. Predictions List (Paginated)
    res = client.get('/api/predictions?page=1&per_page=5')
    preds_page = res.get_json()
    print("11. /api/predictions:", res.status_code, f"Total: {preds_page.get('total')}, Page count: {len(preds_page.get('predictions', []))}")
    assert res.status_code == 200

    # 12. High Risk Customers
    res = client.get('/api/predictions/high-risk?limit=5')
    high_risk_data = res.get_json()
    print("12. /api/predictions/high-risk:", res.status_code, f"High risk count: {high_risk_data.get('total_high_risk')}")
    assert res.status_code == 200

    print("\n ALL 12 API ENDPOINTS VERIFIED AND PASSING!")

if __name__ == '__main__':
    test_all()

