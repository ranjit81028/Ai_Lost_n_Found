from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from models.user import create_user
from utils.auth_helpers import (
    hash_password, check_password, create_token, login_required
)

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Name, email and password are required'}), 400
    
    mongo = current_app.extensions['pymongo']
    
    # Check if email already exists
    existing = mongo.db.users.find_one({'email': data['email']})
    if existing:
        return jsonify({'error': 'Email already registered'}), 400
    
    # Validate password length
    if len(data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Create user
    hashed = hash_password(data['password'])
    user = create_user(data['name'], data['email'], hashed)
    result = mongo.db.users.insert_one(user)
    
    # Generate token
    token = create_token(
        str(result.inserted_id),
        current_app.config['SECRET_KEY']
    )
    
    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': {
            'id': str(result.inserted_id),
            'name': data['name'],
            'email': data['email'],
            'role': 'user'
        }
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login with email and password."""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    mongo = current_app.extensions['pymongo']
    user = mongo.db.users.find_one({'email': data['email']})
    
    if not user or not check_password(data['password'], user['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    token = create_token(
        str(user['_id']),
        current_app.config['SECRET_KEY']
    )
    
    return jsonify({
        'token': token,
        'user': {
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'role': user.get('role', 'user')
        }
    })


@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """Get the currently logged-in user's info."""
    user = request.current_user
    return jsonify({
        'id': str(user['_id']),
        'name': user['name'],
        'email': user['email'],
        'role': user.get('role', 'user')
    })
