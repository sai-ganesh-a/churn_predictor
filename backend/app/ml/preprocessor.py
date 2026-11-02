import pandas as pd
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

NUMERICAL_FEATURES = ['tenure', 'MonthlyCharges', 'TotalCharges']

CATEGORICAL_FEATURES = [
    'gender',
    'SeniorCitizen',
    'Partner',
    'Dependents',
    'PhoneService',
    'MultipleLines',
    'InternetService',
    'OnlineSecurity',
    'OnlineBackup',
    'DeviceProtection',
    'TechSupport',
    'StreamingTV',
    'StreamingMovies',
    'Contract',
    'PaperlessBilling',
    'PaymentMethod'
]

TARGET_COLUMN = 'Churn'
ID_COLUMN = 'customerID'

def clean_dataset(df_raw: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans raw dataframe:
    - Retains original dataframe immutability by creating a copy.
    - Handles whitespace in TotalCharges by converting to float.
    - Sets TotalCharges = 0.0 for tenure == 0 records.
    - Leaves customerID intact for record keeping.
    """
    df = df_raw.copy()
    
    # Handle TotalCharges: coerce all non-numerics and spaces to numeric
    if 'TotalCharges' in df.columns:
        # Strip string whitespace and coerce errors to NaN
        df['TotalCharges'] = pd.to_numeric(df['TotalCharges'].astype(str).str.strip(), errors='coerce')
        # For tenure == 0, TotalCharges is 0.0
        df.loc[df['tenure'] == 0, 'TotalCharges'] = 0.0
        # For any remaining NaNs, fill with 0.0
        df['TotalCharges'] = df['TotalCharges'].fillna(0.0)

    # Ensure SeniorCitizen is treated as categorical
    if 'SeniorCitizen' in df.columns:
        df['SeniorCitizen'] = df['SeniorCitizen'].astype(str)

    return df

def build_preprocessor() -> ColumnTransformer:
    """
    Constructs Scikit-learn ColumnTransformer:
    - Numerical: Median imputer + StandardScaler
    - Categorical: Most frequent imputer + OneHotEncoder (drop='first', ignore unknown)
    """
    num_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    cat_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('encoder', OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore'))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_pipeline, NUMERICAL_FEATURES),
            ('cat', cat_pipeline, CATEGORICAL_FEATURES)
        ],
        remainder='drop'
    )
    
    return preprocessor
