from bson.objectid import ObjectId
from services.image_matcher import compute_image_similarity
from services.text_matcher import compute_text_similarity
from models.notification import create_notification


def find_matches(item, db, config):
    """Find potential matches for a given item.
    
    If the item is 'lost', we search through 'found' items and vice versa.
    Combines image similarity and text similarity with configurable weights.
    
    Returns a list of matches sorted by score (highest first).
    """
    # Search the opposite type
    search_type = "found" if item["type"] == "lost" else "lost"
    
    # Only match against active items in the same category (if available)
    query = {"type": search_type, "status": "active"}
    if item.get("category"):
        query["category"] = item["category"]
    
    candidates = list(db.items.find(query))
    matches = []
    
    image_weight = config.get('IMAGE_WEIGHT', 0.4)
    text_weight = config.get('TEXT_WEIGHT', 0.6)
    threshold = config.get('MATCH_THRESHOLD', 0.5)
    max_matches = config.get('MAX_MATCHES', 10)
    
    for candidate in candidates:
        # Skip if it's the same user's item
        if str(candidate["user_id"]) == str(item["user_id"]):
            continue
        
        # Calculate image similarity
        img_score = 0.0
        if item.get("image_features") and candidate.get("image_features"):
            img_score = compute_image_similarity(
                item["image_features"],
                candidate["image_features"]
            )
        
        # Calculate text similarity
        txt_score = 0.0
        if item.get("text_embedding") and candidate.get("text_embedding"):
            txt_score = compute_text_similarity(
                item["text_embedding"],
                candidate["text_embedding"]
            )
        
        # Weighted combined score
        # If only one modality is available, use it fully
        if item.get("image_features") and candidate.get("image_features"):
            combined = (image_weight * img_score) + (text_weight * txt_score)
        else:
            combined = txt_score  # fallback to text only
        
        if combined >= threshold:
            matches.append({
                "item_id": str(candidate["_id"]),
                "title": candidate["title"],
                "description": candidate["description"],
                "category": candidate["category"],
                "location": candidate["location"],
                "image_path": candidate.get("image_path"),
                "type": candidate["type"],
                "image_score": round(img_score, 3),
                "text_score": round(txt_score, 3),
                "combined_score": round(combined, 3),
                "date_reported": candidate.get("date_reported", ""),
                "user_id": str(candidate["user_id"])
            })
    
    # Sort by combined score, highest first
    matches.sort(key=lambda x: x["combined_score"], reverse=True)
    matches = matches[:max_matches]
    
    # Send notifications for good matches
    if matches:
        _notify_matches(item, matches, db)
    
    return matches


def _notify_matches(item, matches, db):
    """Create notifications for the item owner and match owners."""
    item_owner_id = str(item["user_id"])
    
    # Notify the item owner
    if matches:
        best = matches[0]
        msg = f"We found {len(matches)} potential match(es) for your {item['type']} item '{item['title']}'!"
        notif = create_notification(
            user_id=item_owner_id,
            message=msg,
            item_id=str(item["_id"]),
            match_id=best["item_id"]
        )
        db.notifications.insert_one(notif)
    
    # Notify owners of matched items (top 3 only to avoid spam)
    for match in matches[:3]:
        msg = f"Your {match['type']} item '{match['title']}' might match a recently reported item!"
        notif = create_notification(
            user_id=match["user_id"],
            message=msg,
            item_id=match["item_id"],
            match_id=str(item["_id"])
        )
        db.notifications.insert_one(notif)
