import bcrypt
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app


def hash_password(password):
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt)


def check_password(password, hashed):
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed)


def create_token(user_id, secret_key, expiry_hours=24):
    """Generate a JWT token for a user."""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(hours=expiry_hours),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, secret_key, algorithm='HS256')


def decode_token(token, secret_key):
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def login_required(f):
    """Decorator to protect routes that need authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check for token in Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Login required'}), 401
        
        user_id = decode_token(token, current_app.config['SECRET_KEY'])
        if not user_id:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Get user from database
        from bson.objectid import ObjectId
        mongo = current_app.extensions['pymongo']
        user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        # Pass user to the route function
        request.current_user = user
        return f(*args, **kwargs)
    
    return decorated


def admin_required(f):
    """Decorator for admin-only routes."""
    @wraps(f)
    @login_required
    def decorated(*args, **kwargs):
        if request.current_user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    
    return decorated
