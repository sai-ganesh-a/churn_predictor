import sys
sys.path.insert(0, '.')

from app import create_app, db
from app.ml.train import train_and_evaluate_models
from app.ml.predictor import ChurnPredictor
from app.models import ModelMetrics

app = create_app()
with app.app_context():
    print("Starting ML training...")
    results = train_and_evaluate_models()
    print("\n=== BEST MODEL SELECTED ===")
    print("Best Model:", results['best_model']['model_name'])
    print("Accuracy:", results['best_model']['accuracy'])
    print("Precision (Churn):", results['best_model']['precision'])
    print("Recall (Churn):", results['best_model']['recall'])
    print("F1-score (Churn):", results['best_model']['f1_score'])
    print("ROC-AUC:", results['best_model']['roc_auc'])
    print("Confusion Matrix:", results['best_model']['confusion_matrix'])

    print("\n=== ALL MODELS COMPARISON ===")
    header = f"{'Model Name':<32} | {'Accuracy':<9} | {'Precision':<9} | {'Recall':<9} | {'F1-Score':<9} | {'ROC-AUC':<9} | {'Score':<7}"
    print(header)
    print("-" * len(header))
    for m in results['comparison']:
        print(f"{m['model_name']:<32} | {m['accuracy']:<9.4f} | {m['precision']:<9.4f} | {m['recall']:<9.4f} | {m['f1_score']:<9.4f} | {m['roc_auc']:<9.4f} | {m['selection_score']:<7.4f}")

    print("\n=== TESTING PREDICTOR ===")
    predictor = ChurnPredictor.get_instance()
    
    # 1. At-risk customer sample
    sample_risk = {
        'gender': 'Female',
        'SeniorCitizen': '0',
        'Partner': 'No',
        'Dependents': 'No',
        'tenure': 2,
        'PhoneService': 'Yes',
        'MultipleLines': 'No',
        'InternetService': 'Fiber optic',
        'OnlineSecurity': 'No',
        'OnlineBackup': 'No',
        'DeviceProtection': 'No',
        'TechSupport': 'No',
        'StreamingTV': 'No',
        'StreamingMovies': 'No',
        'Contract': 'Month-to-month',
        'PaperlessBilling': 'Yes',
        'PaymentMethod': 'Electronic check',
        'MonthlyCharges': 75.35,
        'TotalCharges': 150.70
    }
    pred_risk = predictor.predict_single(sample_risk)
    print("\nAt-Risk Customer Prediction:")
    for k, v in pred_risk.items():
        if k != 'features_evaluated':
            print(f"  {k}: {v}")

    # 2. Loyal customer sample
    sample_loyal = {
        'gender': 'Male',
        'SeniorCitizen': '0',
        'Partner': 'Yes',
        'Dependents': 'Yes',
        'tenure': 65,
        'PhoneService': 'Yes',
        'MultipleLines': 'Yes',
        'InternetService': 'DSL',
        'OnlineSecurity': 'Yes',
        'OnlineBackup': 'Yes',
        'DeviceProtection': 'Yes',
        'TechSupport': 'Yes',
        'StreamingTV': 'No',
        'StreamingMovies': 'No',
        'Contract': 'Two year',
        'PaperlessBilling': 'No',
        'PaymentMethod': 'Credit card (automatic)',
        'MonthlyCharges': 55.00,
        'TotalCharges': 3500.00
    }
    pred_loyal = predictor.predict_single(sample_loyal)
    print("\nLoyal Customer Prediction:")
    for k, v in pred_loyal.items():
        if k != 'features_evaluated':
            print(f"  {k}: {v}")

