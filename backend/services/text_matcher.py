from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


# Load the sentence transformer model once
# all-MiniLM-L6-v2 is a lightweight but effective model
print("Loading sentence transformer model...")
model = SentenceTransformer('all-MiniLM-L6-v2')


def get_text_embedding(title, description):
    """Generate an embedding for an item's text content.
    
    Combines title and description into a single string,
    then encodes it using the BERT-based model.
    
    Returns a list of floats (384-dimensional vector).
    """
    try:
        # Combine title and description for better context
        text = f"{title}. {description}"
        embedding = model.encode(text)
        return embedding.tolist()
    
    except Exception as e:
        print(f"Error generating text embedding: {e}")
        return None


def compute_text_similarity(embedding1, embedding2):
    """Compute cosine similarity between two text embeddings.
    
    Returns a float between 0 and 1.
    """
    if embedding1 is None or embedding2 is None:
        return 0.0
    
    vec1 = np.array(embedding1).reshape(1, -1)
    vec2 = np.array(embedding2).reshape(1, -1)
    
    similarity = cosine_similarity(vec1, vec2)[0][0]
    return max(0.0, float(similarity))
