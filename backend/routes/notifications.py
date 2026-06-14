from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from utils.auth_helpers import login_required

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('', methods=['GET'])
@login_required
def get_notifications():
    """Get all notifications for the current user."""
    mongo = current_app.extensions['pymongo']
    user_id = str(request.current_user['_id'])
    
    notifications = list(
        mongo.db.notifications.find({'user_id': user_id})
        .sort('created_at', -1)
        .limit(50)
    )
    
    notif_list = []
    for n in notifications:
        notif_list.append({
            'id': str(n['_id']),
            'message': n['message'],
            'item_id': n.get('item_id'),
            'match_id': n.get('match_id'),
            'read': n['read'],
            'created_at': n['created_at'].isoformat() if n.get('created_at') else None
        })
    
    return jsonify({'notifications': notif_list})


@notifications_bp.route('/<notif_id>/read', methods=['PUT'])
@login_required
def mark_as_read(notif_id):
    """Mark a notification as read."""
    try:
        mongo = current_app.extensions['pymongo']
        user_id = str(request.current_user['_id'])
        
        result = mongo.db.notifications.update_one(
            {'_id': ObjectId(notif_id), 'user_id': user_id},
            {'$set': {'read': True}}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Notification not found'}), 404
        
        return jsonify({'message': 'Marked as read'})
    except Exception:
        return jsonify({'error': 'Invalid notification ID'}), 400


@notifications_bp.route('/unread-count', methods=['GET'])
@login_required
def get_unread_count():
    """Get the count of unread notifications."""
    mongo = current_app.extensions['pymongo']
    user_id = str(request.current_user['_id'])
    
    count = mongo.db.notifications.count_documents({
        'user_id': user_id,
        'read': False
    })
    
    return jsonify({'unread_count': count})
