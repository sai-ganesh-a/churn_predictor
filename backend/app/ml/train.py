import os
from pathlib import Path
import json
import joblib
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server environments
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

from app.ml.preprocessor import (
    clean_dataset,
    build_preprocessor,
    NUMERICAL_FEATURES,
    CATEGORICAL_FEATURES,
    TARGET_COLUMN,
    ID_COLUMN
)
from app.config import Config
from app.models import db, ModelMetrics, DatasetInfo

def get_transformed_feature_names(preprocessor):
    """Extract human-readable feature names from the fitted preprocessor."""
    try:
        num_names = NUMERICAL_FEATURES
        cat_encoder = preprocessor.named_transformers_['cat'].named_steps['encoder']
        cat_names = list(cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES))
        return num_names + cat_names
    except Exception:
        return []

def plot_confusion_matrix(cm, model_name, save_path):
    """Generate and save confusion matrix heatmap."""
    plt.figure(figsize=(5, 4))
    sns.heatmap(
        cm,
        annot=True,
        fmt='d',
        cmap='Blues',
        xticklabels=['Retained (No)', 'Churned (Yes)'],
        yticklabels=['Retained (No)', 'Churned (Yes)']
    )
    plt.title(f'Confusion Matrix: {model_name}', fontsize=12, fontweight='bold', pad=12)
    plt.ylabel('Actual Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig(save_path, dpi=200)
    plt.close()

def plot_feature_importance(feature_names, importances, model_name, save_path, top_n=12):
    """Generate and save top feature importances chart."""
    if not feature_names or not len(importances):
        return
    df_imp = pd.DataFrame({'feature': feature_names, 'importance': importances})
    df_imp = df_imp.sort_values('importance', ascending=False).head(top_n)
    
    plt.figure(figsize=(8, 5))
    sns.barplot(data=df_imp, x='importance', y='feature', hue='feature', palette='Blues_r', legend=False)
    plt.title(f'Top {top_n} Influential Features: {model_name}', fontsize=12, fontweight='bold', pad=12)
    plt.xlabel('Importance (Coeff Magnitude / Gini)')
    plt.ylabel('Feature')
    plt.tight_layout()
    plt.savefig(save_path, dpi=200)
    plt.close()

def train_and_evaluate_models(dataset_path: str = None):
    """
    Main training and evaluation routine:
    - Loads and cleans dataset.
    - Fits Scikit-learn pipelines only on training data (preventing leakage).
    - Compares standard and balanced variants of Logistic Regression, Decision Tree, Random Forest.
    - Selects the best model based on Churn class Recall and F1-score.
    - Serializes pipeline and artifacts using Joblib.
    - Updates SQLite database with model metrics.
    """
    if dataset_path is None:
        # Check standard locations
        candidates = [
            Config.UPLOAD_FOLDER / 'WA_Fn-UseC_-Telco-Customer-Churn.csv',
            Path(__file__).resolve().parent.parent.parent.parent / 'dataset' / 'WA_Fn-UseC_-Telco-Customer-Churn.csv',
            Path('dataset/WA_Fn-UseC_-Telco-Customer-Churn.csv').resolve(),
            Path('../dataset/WA_Fn-UseC_-Telco-Customer-Churn.csv').resolve(),
        ]
        for p in candidates:
            if os.path.exists(p):
                dataset_path = str(p)
                break

    if dataset_path is None or not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset file not found at: {dataset_path}")

    # 1. Load and clean dataset
    df_raw = pd.read_csv(dataset_path)
    df = clean_dataset(df_raw)

    # 2. Extract identifiers, features and target
    id_series = df[ID_COLUMN] if ID_COLUMN in df.columns else pd.Series(range(len(df)))
    y = df[TARGET_COLUMN].map({'No': 0, 'Yes': 1}).astype(int)
    X = df.drop(columns=[col for col in [ID_COLUMN, TARGET_COLUMN] if col in df.columns])

    # 3. Stratified Train-Test Split (80/20) with fixed seed
    X_train, X_test, y_train, y_test, id_train, id_test = train_test_split(
        X, y, id_series, test_size=0.20, random_state=42, stratify=y
    )

    # 4. Define candidate models
    candidates = {
        'Logistic Regression': LogisticRegression(
            max_iter=1000,
            random_state=42
        ),
        'Logistic Regression (Balanced)': LogisticRegression(
            max_iter=1000,
            class_weight='balanced',
            random_state=42
        ),
        'Decision Tree': DecisionTreeClassifier(
            max_depth=5,
            random_state=42
        ),
        'Decision Tree (Balanced)': DecisionTreeClassifier(
            max_depth=5,
            class_weight='balanced',
            random_state=42
        ),
        'Random Forest': RandomForestClassifier(
            n_estimators=150,
            max_depth=10,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        ),
        'Random Forest (Balanced)': RandomForestClassifier(
            n_estimators=150,
            max_depth=10,
            min_samples_leaf=2,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )
    }

    results = []
    fitted_pipelines = {}
    metrics_records = []

    # 5. Train each pipeline and record metrics
    for name, clf in candidates.items():
        preprocessor = build_preprocessor()
        pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('classifier', clf)
        ])
        
        # Fit on training data only
        pipeline.fit(X_train, y_train)
        fitted_pipelines[name] = pipeline

        # Evaluate on test set
        y_pred = pipeline.predict(X_test)
        
        # Probability for positive class (ROC-AUC)
        if hasattr(pipeline, "predict_proba"):
            y_prob = pipeline.predict_proba(X_test)[:, 1]
            roc_auc = float(roc_auc_score(y_test, y_prob))
        else:
            roc_auc = 0.0

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, pos_label=1, zero_division=0))
        rec = float(recall_score(y_test, y_pred, pos_label=1, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, pos_label=1, zero_division=0))
        cm = confusion_matrix(y_test, y_pred).tolist()
        report = classification_report(y_test, y_pred, output_dict=True)

        # Feature importances / coefficients
        feature_names = get_transformed_feature_names(pipeline.named_steps['preprocessor'])
        importances = []
        if hasattr(clf, 'feature_importances_'):
            importances = clf.feature_importances_.tolist()
        elif hasattr(clf, 'coef_'):
            importances = np.abs(clf.coef_[0]).tolist()

        feature_importance_list = []
        if feature_names and importances and len(feature_names) == len(importances):
            for fname, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)[:15]:
                feature_importance_list.append({"feature": fname, "importance": round(float(imp), 4)})

        # Save visualization plots
        clean_filename = name.lower().replace(' ', '_').replace('(', '').replace(')', '')
        cm_plot_path = Config.MODEL_FOLDER / f'cm_{clean_filename}.png'
        plot_confusion_matrix(np.array(cm), name, cm_plot_path)

        if feature_names and importances:
            imp_plot_path = Config.MODEL_FOLDER / f'imp_{clean_filename}.png'
            plot_feature_importance(feature_names, importances, name, imp_plot_path)

        model_stat = {
            'model_name': name,
            'accuracy': acc,
            'precision': prec,
            'recall': rec,
            'f1_score': f1,
            'roc_auc': roc_auc,
            'confusion_matrix': cm,
            'classification_report': report,
            'feature_importances': feature_importance_list
        }
        results.append(model_stat)

    # 6. Model Selection:
    # We prioritize Churn class Recall and F1-score because missing at-risk customers (False Negatives)
    # is much more costly to retention than false alarms.
    # Score formula: 0.6 * Recall + 0.4 * F1
    for r in results:
        r['selection_score'] = round(0.6 * r['recall'] + 0.4 * r['f1_score'], 4)

    results.sort(key=lambda x: x['selection_score'], reverse=True)
    best_candidate = results[0]
    best_model_name = best_candidate['model_name']

    # Mark is_best
    for r in results:
        r['is_best'] = (r['model_name'] == best_model_name)

    # 7. Save Best Pipeline and Metadata
    best_pipeline = fitted_pipelines[best_model_name]
    best_model_path = Config.MODEL_FOLDER / 'best_model.joblib'
    metadata_path = Config.MODEL_FOLDER / 'model_metadata.joblib'

    joblib.dump(best_pipeline, best_model_path)
    joblib.dump({
        'best_model_name': best_model_name,
        'models_comparison': results,
        'feature_names': get_transformed_feature_names(best_pipeline.named_steps['preprocessor']),
        'target_classes': ['No', 'Yes'],
        'risk_thresholds': {
            'low': Config.RISK_THRESHOLD_LOW,
            'high': Config.RISK_THRESHOLD_HIGH
        }
    }, metadata_path)

    # 8. Store / Update in SQLite database via SQLAlchemy
    # Clear old metrics if any
    ModelMetrics.query.delete()
    for r in results:
        mm = ModelMetrics(
            model_name=r['model_name'],
            accuracy=r['accuracy'],
            precision=r['precision'],
            recall=r['recall'],
            f1_score=r['f1_score'],
            confusion_matrix=r['confusion_matrix'],
            classification_report=r['classification_report'],
            is_best=r['is_best']
        )
        db.session.add(mm)
    db.session.commit()

    return {
        'best_model': best_candidate,
        'comparison': results,
        'best_model_path': str(best_model_path)
    }
