import logging
import threading
from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Thread-safe lazy loading of the model
_model = None
_model_lock = threading.Lock()
MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384


def get_embedding_model() -> SentenceTransformer:
    """Retrieve the SentenceTransformer model singleton instance with lazy initialization."""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                logger.info(f"Loading SentenceTransformer model: {MODEL_NAME}...")
                try:
                    _model = SentenceTransformer(MODEL_NAME)
                    logger.info(f"Successfully loaded {MODEL_NAME}")
                except Exception as e:
                    logger.error(f"Failed to load embedding model: {str(e)}")
                    raise RuntimeError(f"Error loading embedding model {MODEL_NAME}: {str(e)}")
    return _model


def generate_embedding(text: str) -> np.ndarray:
    """Generate a dense vector representation (embedding) for the given text."""
    if not text or not isinstance(text, str) or not text.strip():
        logger.warning("Empty or invalid text provided for embedding; returning zero vector.")
        return np.zeros(EMBEDDING_DIM, dtype=np.float32)
    
    try:
        model = get_embedding_model()
        embedding = model.encode(text, convert_to_numpy=True)
        return np.array(embedding, dtype=np.float32)
    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}")
        return np.zeros(EMBEDDING_DIM, dtype=np.float32)


def generate_embeddings_batch(texts: List[str]) -> List[np.ndarray]:
    """Generate embeddings for multiple texts efficiently."""
    if not texts:
        return []
    
    try:
        model = get_embedding_model()
        embeddings = model.encode(texts, convert_to_numpy=True)
        return [np.array(emb, dtype=np.float32) for emb in embeddings]
    except Exception as e:
        logger.error(f"Error generating batch embeddings: {str(e)}")
        return [np.zeros(EMBEDDING_DIM, dtype=np.float32) for _ in texts]
