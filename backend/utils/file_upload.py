import os
import uuid
from werkzeug.utils import secure_filename


ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}


def allowed_file(filename):
    """Check if a file has an allowed extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_uploaded_file(file, upload_folder):
    """Save an uploaded file with a unique name.
    
    Returns the filename if successful, None otherwise.
    """
    if file and allowed_file(file.filename):
        # Generate a unique filename to avoid collisions
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        filename = secure_filename(filename)
        
        # Make sure upload directory exists
        os.makedirs(upload_folder, exist_ok=True)
        
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        return filename
    
    return None
