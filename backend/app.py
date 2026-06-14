import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_pymongo import PyMongo
from config import Config


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for React frontend
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})
    
    # Initialize MongoDB
    mongo = PyMongo(app)
    
    # Make sure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.items import items_bp
    from routes.matching import matching_bp
    from routes.admin import admin_bp
    from routes.notifications import notifications_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(items_bp, url_prefix='/api/items')
    app.register_blueprint(matching_bp, url_prefix='/api/match')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    
    # Serve uploaded images
    @app.route('/uploads/<filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    
    # Health check
    @app.route('/api/health')
    def health():
        return {'status': 'ok'}
    
    return app


if __name__ == '__main__':
    app = create_app()
    print("Starting Lost & Found backend server...")
    app.run(debug=True, port=5000)
