import sys
import io
import os
import pandas as pd
sys.path.insert(0, '.')

from app import create_app, db
from app.models import DatasetInfo

app = create_app()
client = app.test_client()

def run_verification():
    print("====================================================")
    print("STEP 1: VERIFYING ORIGINAL IBM TELCO DATASET (7,043)")
    print("====================================================")
    
    # 1. Overview on original dataset
    res = client.get('/api/analytics/overview')
    assert res.status_code == 200, f"Overview API failed: {res.status_code}"
    data = res.get_json()
    print("Overview Response (Original):", data)
    
    assert data['total_customers'] == 7043, f"Expected 7043 total, got {data['total_customers']}"
    assert data['retained_customers'] == 5174, f"Expected 5174 retained, got {data['retained_customers']}"
    assert data['churned_customers'] == 1869, f"Expected 1869 churned, got {data['churned_customers']}"
    assert round(data['churn_rate'], 2) == 26.54, f"Expected 26.54% churn rate, got {data['churn_rate']}"
    print(" STEP 1 PASSED: Original IBM Telco dataset correctly displays 7,043 customers, 5,174 retained, 1,869 churned, and 26.54% churn rate.\n")

    print("====================================================")
    print("STEP 2: UPLOAD 20-RECORD SYNTHETIC TESTING CSV")
    print("====================================================")
    # Generate 20-record test CSV: 12 Retained ('No') and 8 Churned ('Yes')
    records = []
    for i in range(12):
        records.append({
            'customerID': f'TEST-RET-{i+1}',
            'gender': 'Male',
            'SeniorCitizen': 0,
            'Partner': 'Yes',
            'Dependents': 'Yes',
            'tenure': 45,
            'PhoneService': 'Yes',
            'MultipleLines': 'No',
            'InternetService': 'DSL',
            'OnlineSecurity': 'Yes',
            'OnlineBackup': 'Yes',
            'DeviceProtection': 'Yes',
            'TechSupport': 'Yes',
            'StreamingTV': 'No',
            'StreamingMovies': 'No',
            'Contract': 'One year',
            'PaperlessBilling': 'No',
            'PaymentMethod': 'Bank transfer (automatic)',
            'MonthlyCharges': 50.00,
            'TotalCharges': 2250.00,
            'Churn': 'No'
        })
    for i in range(8):
        records.append({
            'customerID': f'TEST-CHURN-{i+1}',
            'gender': 'Female',
            'SeniorCitizen': 1,
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
            'MonthlyCharges': 95.00,
            'TotalCharges': 285.00,
            'Churn': 'Yes'
        })
    df_synthetic = pd.DataFrame(records)
    csv_bytes = io.BytesIO()
    df_synthetic.to_csv(csv_bytes, index=False)
    csv_bytes.seek(0)

    upload_res = client.post(
        '/api/dataset/upload',
        data={'file': (csv_bytes, 'synthetic_test_20.csv')},
        content_type='multipart/form-data'
    )
    assert upload_res.status_code == 201, f"Upload failed: {upload_res.status_code} - {upload_res.get_json()}"
    print("Upload Response:", upload_res.get_json().get('message'))

    # Verify overview dynamically reflects the 20-record dataset
    res_synth = client.get('/api/analytics/overview')
    assert res_synth.status_code == 200
    data_synth = res_synth.get_json()
    print("Overview Response (Synthetic 20):", data_synth)

    assert data_synth['total_customers'] == 20, f"Expected 20 total, got {data_synth['total_customers']}"
    assert data_synth['retained_customers'] == 12, f"Expected 12 retained, got {data_synth['retained_customers']}"
    assert data_synth['churned_customers'] == 8, f"Expected 8 churned, got {data_synth['churned_customers']}"
    assert round(data_synth['churn_rate'], 2) == 40.00, f"Expected 40.00% churn rate, got {data_synth['churn_rate']}"
    print(" STEP 2 PASSED: Synthetic dataset dynamically updates dashboard to 20 customers, 12 retained, 8 churned, and 40.0% churn rate.\n")

    print("====================================================")
    print("STEP 3: RESTORE ORIGINAL IBM TELCO DATASET")
    print("====================================================")
    with app.app_context():
        # Remove the synthetic upload entry so IBM Telco dataset becomes active again
        synth_entry = DatasetInfo.query.filter_by(filename='synthetic_test_20.csv').first()
        if synth_entry:
            db.session.delete(synth_entry)
            db.session.commit()
            print("Reset active dataset back to original IBM Telco dataset.")

    res_restored = client.get('/api/analytics/overview')
    assert res_restored.status_code == 200
    data_restored = res_restored.get_json()
    print("Overview Response (Restored Original):", data_restored)

    assert data_restored['total_customers'] == 7043
    assert data_restored['retained_customers'] == 5174
    assert data_restored['churned_customers'] == 1869
    assert round(data_restored['churn_rate'], 2) == 26.54
    print(" STEP 3 PASSED: Dashboard accurately restores to 7,043 customers, 5,174 retained, 1,869 churned, and 26.54% churn rate.\n")

    print("====================================================")
    print("ALL VERIFICATION CHECKS COMPLETED AND VERIFIED!")
    print("====================================================")

if __name__ == '__main__':
    run_verification()

