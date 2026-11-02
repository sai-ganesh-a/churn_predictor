import logging
import os
from pathlib import Path
from flask import Flask, send_from_directory
from flask_cors import CORS
from app.config import Config, BASE_DIR
from app.models import db

def create_app(config_class=Config):
    frontend_dist = BASE_DIR.parent / 'frontend' / 'dist'
    if frontend_dist.exists():
        app = Flask(__name__, static_folder=str(frontend_dist), static_url_path='')
    else:
        app = Flask(__name__)

    app.config.from_object(config_class)
    
    # Ensure directories
    config_class.init_app()
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    )
    
    # Initialize extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register blueprints
    from app.routes import (
        general_bp,
        dataset_bp,
        analytics_bp,
        model_bp,
        prediction_bp
    )
    
    app.register_blueprint(general_bp, url_prefix='/api')
    app.register_blueprint(dataset_bp, url_prefix='/api/dataset')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(model_bp, url_prefix='/api/model')
    app.register_blueprint(prediction_bp, url_prefix='/api')
    
    # Frontend SPA Route (serving React production bundle)
    if frontend_dist.exists():
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_spa(path):
            if path and (frontend_dist / path).exists():
                return send_from_directory(str(frontend_dist), path)
            return send_from_directory(str(frontend_dist), 'index.html')

    # Create database tables
    with app.app_context():
        db.create_all()
        app.logger.info("Database initialized successfully.")
        
    return app

