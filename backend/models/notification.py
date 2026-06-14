from datetime import datetime


def create_notification(user_id, message, item_id=None, match_id=None):
    """Create a notification document."""
    return {
        "user_id": user_id,
        "message": message,
        "item_id": item_id,
        "match_id": match_id,
        "read": False,
        "created_at": datetime.utcnow()
    }
