import os
from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from models.item import create_item, CATEGORIES
from utils.auth_helpers import login_required
from utils.file_upload import save_uploaded_file
from services.image_matcher import extract_features
from services.text_matcher import get_text_embedding

items_bp = Blueprint('items', __name__)


@items_bp.route('', methods=['POST'])
@login_required
def create_new_item():
    """Create a new lost or found item."""
    # Get form data (multipart because of file upload)
    item_type = request.form.get('type')
    title = request.form.get('title')
    description = request.form.get('description')
    category = request.form.get('category')
    location = request.form.get('location')
    date_reported = request.form.get('date_reported')
    
    # Validate
    if not all([item_type, title, description, category, location]):
        return jsonify({'error': 'All fields are required'}), 400
    
    if item_type not in ['lost', 'found']:
        return jsonify({'error': 'Type must be lost or found'}), 400
    
    if category not in CATEGORIES:
        return jsonify({'error': f'Invalid category. Must be one of: {", ".join(CATEGORIES)}'}), 400
    
    # Handle image upload
    image_path = None
    image_features = None
    
    if 'image' in request.files:
        file = request.files['image']
        if file.filename:
            filename = save_uploaded_file(file, current_app.config['UPLOAD_FOLDER'])
            if filename:
                image_path = filename
                # Extract image features for matching
                full_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                image_features = extract_features(full_path)
    
    # Generate text embedding for matching
    text_embedding = get_text_embedding(title, description)
    
    # Create item document
    user_id = str(request.current_user['_id'])
    item = create_item(
        user_id=user_id,
        item_type=item_type,
        title=title,
        description=description,
        category=category,
        location=location,
        date_reported=date_reported or "",
        image_path=image_path,
        image_features=image_features,
        text_embedding=text_embedding
    )
    
    mongo = current_app.extensions['pymongo']
    result = mongo.db.items.insert_one(item)
    
    return jsonify({
        'message': 'Item reported successfully',
        'item_id': str(result.inserted_id)
    }), 201


@items_bp.route('', methods=['GET'])
def get_items():
    """Get all items with optional filters."""
    mongo = current_app.extensions['pymongo']
    
    # Build query from filter params
    query = {"status": "active"}
    
    item_type = request.args.get('type')
    if item_type in ['lost', 'found']:
        query['type'] = item_type
    
    category = request.args.get('category')
    if category:
        query['category'] = category
    
    location = request.args.get('location')
    if location:
        query['location'] = {'$regex': location, '$options': 'i'}
    
    search = request.args.get('search')
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}}
        ]
    
    # Pagination
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 12))
    skip = (page - 1) * per_page
    
    items = list(mongo.db.items.find(query)
                 .sort('created_at', -1)
                 .skip(skip)
                 .limit(per_page))
    
    total = mongo.db.items.count_documents(query)
    
    # Convert ObjectId to string and remove embedding data from response
    items_list = []
    for item in items:
        items_list.append({
            'id': str(item['_id']),
            'user_id': item['user_id'],
            'type': item['type'],
            'title': item['title'],
            'description': item['description'],
            'category': item['category'],
            'location': item['location'],
            'date_reported': item.get('date_reported', ''),
            'image_path': item.get('image_path'),
            'status': item['status'],
            'created_at': item['created_at'].isoformat() if item.get('created_at') else None
        })
    
    return jsonify({
        'items': items_list,
        'total': total,
        'page': page,
        'pages': (total + per_page - 1) // per_page
    })


@items_bp.route('/<item_id>', methods=['GET'])
def get_item(item_id):
    """Get a single item by ID."""
    try:
        mongo = current_app.extensions['pymongo']
        item = mongo.db.items.find_one({'_id': ObjectId(item_id)})
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        # Get the user who posted this item
        user = mongo.db.users.find_one({'_id': ObjectId(item['user_id'])})
        
        return jsonify({
            'id': str(item['_id']),
            'user_id': item['user_id'],
            'user_name': user['name'] if user else 'Unknown',
            'type': item['type'],
            'title': item['title'],
            'description': item['description'],
            'category': item['category'],
            'location': item['location'],
            'date_reported': item.get('date_reported', ''),
            'image_path': item.get('image_path'),
            'status': item['status'],
            'created_at': item['created_at'].isoformat() if item.get('created_at') else None
        })
    except Exception:
        return jsonify({'error': 'Invalid item ID'}), 400


@items_bp.route('/my', methods=['GET'])
@login_required
def get_my_items():
    """Get all items posted by the current user."""
    mongo = current_app.extensions['pymongo']
    user_id = str(request.current_user['_id'])
    
    items = list(mongo.db.items.find({'user_id': user_id}).sort('created_at', -1))
    
    items_list = []
    for item in items:
        items_list.append({
            'id': str(item['_id']),
            'type': item['type'],
            'title': item['title'],
            'description': item['description'],
            'category': item['category'],
            'location': item['location'],
            'date_reported': item.get('date_reported', ''),
            'image_path': item.get('image_path'),
            'status': item['status'],
            'created_at': item['created_at'].isoformat() if item.get('created_at') else None
        })
    
    return jsonify({'items': items_list})


@items_bp.route('/<item_id>', methods=['PUT'])
@login_required
def update_item(item_id):
    """Update an item (only by the owner)."""
    try:
        mongo = current_app.extensions['pymongo']
        item = mongo.db.items.find_one({'_id': ObjectId(item_id)})
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        # Only the owner can update
        if item['user_id'] != str(request.current_user['_id']):
            return jsonify({'error': 'Not authorized'}), 403
        
        data = request.get_json()
        update_fields = {}
        
        for field in ['title', 'description', 'category', 'location', 'status']:
            if field in data:
                update_fields[field] = data[field]
        
        if update_fields:
            mongo.db.items.update_one(
                {'_id': ObjectId(item_id)},
                {'$set': update_fields}
            )
        
        return jsonify({'message': 'Item updated successfully'})
    except Exception:
        return jsonify({'error': 'Invalid item ID'}), 400


@items_bp.route('/<item_id>', methods=['DELETE'])
@login_required
def delete_item(item_id):
    """Delete an item (only by the owner)."""
    try:
        mongo = current_app.extensions['pymongo']
        item = mongo.db.items.find_one({'_id': ObjectId(item_id)})
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        if item['user_id'] != str(request.current_user['_id']):
            return jsonify({'error': 'Not authorized'}), 403
        
        mongo.db.items.delete_one({'_id': ObjectId(item_id)})
        
        # Also delete the image file if it exists
        if item.get('image_path'):
            img_path = os.path.join(current_app.config['UPLOAD_FOLDER'], item['image_path'])
            if os.path.exists(img_path):
                os.remove(img_path)
        
        return jsonify({'message': 'Item deleted successfully'})
    except Exception:
        return jsonify({'error': 'Invalid item ID'}), 400


@items_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get the list of available categories."""
    return jsonify({'categories': CATEGORIES})
