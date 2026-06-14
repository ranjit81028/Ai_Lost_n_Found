from datetime import datetime


def create_user(name, email, hashed_password, role="user"):
    """Create a user document for MongoDB."""
    return {
        "name": name,
        "email": email,
        "password": hashed_password,
        "role": role,
        "created_at": datetime.utcnow()
    }
