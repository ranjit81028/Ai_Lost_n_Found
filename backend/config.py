import os

class Config:
    """Basic app configuration."""
    
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
    
    # MongoDB
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/lost_and_found')
    
    # File uploads
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    
    # JWT token expiry (in hours)
    JWT_EXPIRY_HOURS = 24
    
    # Matching thresholds
    MATCH_THRESHOLD = 0.5
    IMAGE_WEIGHT = 0.4
    TEXT_WEIGHT = 0.6
    MAX_MATCHES = 10
