from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from utils.auth_helpers import login_required
from services.match_engine import find_matches

matching_bp = Blueprint('matching', __name__)


@matching_bp.route('/<item_id>', methods=['GET'])
@login_required
def get_matches(item_id):
    """Find potential matches for an item.
    
    Uses both image similarity (ResNet) and text similarity (BERT)
    to find items that could be a match.
    """
    try:
        mongo = current_app.extensions['pymongo']
        item = mongo.db.items.find_one({'_id': ObjectId(item_id)})
        
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        # Only the owner can request matches
        if item['user_id'] != str(request.current_user['_id']):
            return jsonify({'error': 'Not authorized'}), 403
        
        # Run the matching algorithm
        config = {
            'IMAGE_WEIGHT': current_app.config.get('IMAGE_WEIGHT', 0.4),
            'TEXT_WEIGHT': current_app.config.get('TEXT_WEIGHT', 0.6),
            'MATCH_THRESHOLD': current_app.config.get('MATCH_THRESHOLD', 0.5),
            'MAX_MATCHES': current_app.config.get('MAX_MATCHES', 10)
        }
        
        matches = find_matches(item, mongo.db, config)
        
        return jsonify({
            'item_id': item_id,
            'matches': matches,
            'total_matches': len(matches)
        })
    
    except Exception as e:
        print(f"Matching error: {e}")
        return jsonify({'error': 'Error finding matches'}), 500
