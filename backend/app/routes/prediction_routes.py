from flask import Blueprint, jsonify, request, current_app
from app.models import db, Prediction, Customer, DatasetInfo
from app.ml.predictor import ChurnPredictor
from app.ml.preprocessor import clean_dataset
import pandas as pd
import os

prediction_bp = Blueprint('prediction', __name__)

@prediction_bp.route('/predict', methods=['POST'])
def predict():
    """Predict churn for an individual customer."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    predictor = ChurnPredictor.get_instance()
    if not predictor.is_ready:
        return jsonify({
            "error": "Machine learning model is not trained yet. Please train the model before making predictions."
        }), 400

    try:
        result = predictor.predict_single(data)
        customer_id = data.get('customerID', data.get('customer_identifier', f"CUST-{int(pd.Timestamp.now().timestamp())}"))

        # Save customer if not exists
        customer = Customer.query.filter_by(customer_identifier=customer_id).first()
        if not customer:
            customer = Customer(
                customer_identifier=customer_id,
                customer_data=data
            )
            db.session.add(customer)
            db.session.flush()

        # Save prediction
        prediction = Prediction(
            customer_id=customer.id if customer else None,
            customer_identifier=customer_id,
            churn_prediction=result['churn_prediction'],
            churn_probability=result['churn_probability_raw'],
            risk_category=result['risk_category'],
            model_name=result['model_name'],
            input_data=data
        )
        db.session.add(prediction)
        db.session.commit()

        result['id'] = prediction.id
        result['customer_identifier'] = customer_id
        return jsonify(result), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Prediction failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

@prediction_bp.route('/predict/batch', methods=['POST'])
def predict_batch():
    """Run batch prediction across the current uploaded dataset and store results."""
    predictor = ChurnPredictor.get_instance()
    if not predictor.is_ready:
        return jsonify({"error": "Machine learning model is not trained yet."}), 400

    dataset = DatasetInfo.query.order_by(DatasetInfo.uploaded_at.desc()).first()
    filepath = dataset.filepath if dataset and os.path.exists(dataset.filepath) else None

    if not filepath:
        from pathlib import Path
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

    if not os.path.exists(filepath):
        return jsonify({"error": f"Dataset file not found at {filepath}"}), 404

    try:
        df = pd.read_csv(filepath)
        results = predictor.predict_batch(df)

        # Clear existing predictions if batch re-run
        Prediction.query.delete()
        
        # Bulk insert
        predictions_to_insert = [
            Prediction(
                customer_identifier=r['customer_identifier'],
                churn_prediction=r['churn_prediction'],
                churn_probability=r['churn_probability_raw'],
                risk_category=r['risk_category'],
                model_name=r['model_name'],
                input_data={
                    'tenure': r['tenure'],
                    'contract': r['contract'],
                    'monthly_charges': r['monthly_charges'],
                    'total_charges': r['total_charges']
                }
            )
            for r in results
        ]

        db.session.bulk_save_objects(predictions_to_insert)
        db.session.commit()

        high_risk_count = sum(1 for r in results if r['risk_category'] == 'High')
        med_risk_count = sum(1 for r in results if r['risk_category'] == 'Medium')
        low_risk_count = sum(1 for r in results if r['risk_category'] == 'Low')

        return jsonify({
            "status": "success",
            "total_predicted": len(results),
            "high_risk_count": high_risk_count,
            "medium_risk_count": med_risk_count,
            "low_risk_count": low_risk_count
        }), 200

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Batch prediction failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"Batch prediction failed: {str(e)}"}), 500

@prediction_bp.route('/predictions', methods=['GET'])
def get_predictions():
    """Get paginated list of predictions."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    risk_filter = request.args.get('risk_category', None)
    search = request.args.get('search', None)

    query = Prediction.query

    if risk_filter and risk_filter.lower() != 'all':
        query = query.filter(Prediction.risk_category == risk_filter.capitalize())

    if search:
        query = query.filter(Prediction.customer_identifier.ilike(f'%{search}%'))

    pagination = query.order_by(Prediction.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "predictions": [p.to_dict() for p in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    }), 200

@prediction_bp.route('/predictions/high-risk', methods=['GET'])
def get_high_risk_predictions():
    """Get high-risk customers with sorting and filtering options."""
    sort_by = request.args.get('sort_by', 'churn_probability')
    order = request.args.get('order', 'desc')
    limit = request.args.get('limit', 100, type=int)
    search = request.args.get('search', None)

    query = Prediction.query.filter_by(risk_category='High')

    if search:
        query = query.filter(Prediction.customer_identifier.ilike(f'%{search}%'))

    if order == 'asc':
        query = query.order_by(Prediction.churn_probability.asc())
    else:
        query = query.order_by(Prediction.churn_probability.desc())

    records = query.limit(limit).all()

    return jsonify({
        "total_high_risk": len(records),
        "predictions": [p.to_dict() for p in records]
    }), 200
