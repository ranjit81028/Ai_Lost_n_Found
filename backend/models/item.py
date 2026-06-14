from datetime import datetime


def create_item(user_id, item_type, title, description, category,
                location, date_reported, image_path=None,
                image_features=None, text_embedding=None):
    """Create an item document for MongoDB.
    
    item_type should be 'lost' or 'found'
    """
    return {
        "user_id": user_id,
        "type": item_type,
        "title": title,
        "description": description,
        "category": category,
        "location": location,
        "date_reported": date_reported,
        "image_path": image_path,
        "image_features": image_features,  # ResNet feature vector
        "text_embedding": text_embedding,   # BERT embedding
        "status": "active",
        "created_at": datetime.utcnow()
    }


# Fixed categories for the dropdown
CATEGORIES = [
    "Electronics",
    "Documents",
    "Clothing",
    "Accessories",
    "Keys",
    "Books",
    "Bags",
    "Other"
]
