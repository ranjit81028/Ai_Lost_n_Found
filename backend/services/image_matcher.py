import torch
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


# Load ResNet model once when the module is imported
# We remove the last classification layer to get feature vectors
print("Loading ResNet-18 model...")
resnet = models.resnet18(pretrained=True)
resnet.eval()

# Remove the final fully connected layer
# This gives us a 512-dimensional feature vector
feature_extractor = torch.nn.Sequential(*list(resnet.children())[:-1])

# Standard ImageNet preprocessing
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


def extract_features(image_path):
    """Extract feature vector from an image using ResNet-18.
    
    Returns a list of floats (512-dimensional vector) or None if error.
    """
    try:
        img = Image.open(image_path).convert('RGB')
        img_tensor = transform(img).unsqueeze(0)  # Add batch dimension
        
        with torch.no_grad():
            features = feature_extractor(img_tensor)
        
        # Flatten to 1D vector and convert to list for MongoDB storage
        feature_vector = features.squeeze().numpy().tolist()
        return feature_vector
    
    except Exception as e:
        print(f"Error extracting image features: {e}")
        return None


def compute_image_similarity(features1, features2):
    """Compute cosine similarity between two image feature vectors.
    
    Returns a float between 0 and 1 (higher = more similar).
    """
    if features1 is None or features2 is None:
        return 0.0
    
    vec1 = np.array(features1).reshape(1, -1)
    vec2 = np.array(features2).reshape(1, -1)
    
    similarity = cosine_similarity(vec1, vec2)[0][0]
    
    # Cosine similarity can be negative, clamp to [0, 1]
    return max(0.0, float(similarity))
