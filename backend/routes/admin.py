from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from utils.auth_helpers import admin_required

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    """Get dashboard statistics."""
    mongo = current_app.extensions['pymongo']
    
    total_users = mongo.db.users.count_documents({})
    total_items = mongo.db.items.count_documents({})
    lost_items = mongo.db.items.count_documents({'type': 'lost'})
    found_items = mongo.db.items.count_documents({'type': 'found'})
    active_items = mongo.db.items.count_documents({'status': 'active'})
    resolved_items = mongo.db.items.count_documents({'status': 'resolved'})
    
    return jsonify({
        'total_users': total_users,
        'total_items': total_items,
        'lost_items': lost_items,
        'found_items': found_items,
        'active_items': active_items,
        'resolved_items': resolved_items
    })


@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    """Get all registered users."""
    mongo = current_app.extensions['pymongo']
    users = list(mongo.db.users.find())
    
    users_list = []
    for user in users:
        users_list.append({
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'role': user.get('role', 'user'),
            'created_at': user['created_at'].isoformat() if user.get('created_at') else None
        })
    
    return jsonify({'users': users_list})


@admin_bp.route('/items', methods=['GET'])
@admin_required
def get_all_items():
    """Get all items (including inactive) for admin review."""
    mongo = current_app.extensions['pymongo']
    
    items = list(mongo.db.items.find().sort('created_at', -1))
    
    items_list = []
    for item in items:
        # Get poster's name
        user = mongo.db.users.find_one({'_id': ObjectId(item['user_id'])})
        
        items_list.append({
            'id': str(item['_id']),
            'user_id': item['user_id'],
            'user_name': user['name'] if user else 'Unknown',
            'type': item['type'],
            'title': item['title'],
            'description': item['description'],
            'category': item['category'],
            'location': item['location'],
            'image_path': item.get('image_path'),
            'status': item['status'],
            'created_at': item['created_at'].isoformat() if item.get('created_at') else None
        })
    
    return jsonify({'items': items_list})


@admin_bp.route('/items/<item_id>/status', methods=['PUT'])
@admin_required
def update_item_status(item_id):
    """Update an item's status (admin action)."""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['active', 'resolved', 'removed']:
            return jsonify({'error': 'Invalid status'}), 400
        
        mongo = current_app.extensions['pymongo']
        result = mongo.db.items.update_one(
            {'_id': ObjectId(item_id)},
            {'$set': {'status': new_status}}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Item not found'}), 404
        
        return jsonify({'message': f'Item status updated to {new_status}'})
    except Exception:
        return jsonify({'error': 'Invalid item ID'}), 400


@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """Delete a user account (admin action)."""
    try:
        mongo = current_app.extensions['pymongo']
        
        # Don't let admin delete themselves
        if str(request.current_user['_id']) == user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        result = mongo.db.users.delete_one({'_id': ObjectId(user_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({'message': 'User deleted successfully'})
    except Exception:
        return jsonify({'error': 'Invalid user ID'}), 400
