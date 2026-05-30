import logging
import threading
from typing import List, Tuple, Optional
import numpy as np
import faiss
from app.database.mongodb import resume_collection

logger = logging.getLogger(__name__)

EMBEDDING_DIM = 384


class FaissIndexManager:
    """Manages the FAISS index for high-speed candidate semantic vector search."""
    
    def __init__(self):
        self._index: Optional[faiss.IndexFlatIP] = None
        self._id_map: List[str] = []
        self._lock = threading.Lock()
        self._initialized = False

    async def initialize(self):
        """Build the index by fetching all existing resume embeddings from MongoDB."""
        await self.rebuild_index()

    async def rebuild_index(self) -> bool:
        """Rebuilds the FAISS index from scratch using all embeddings stored in MongoDB."""
        with self._lock:
            try:
                logger.info("Rebuilding FAISS index from MongoDB embeddings...")
                
                cursor = resume_collection.find(
                    {"embedding": {"$exists": True, "$ne": None}},
                    {"_id": 1, "embedding": 1}
                )
                
                documents = await cursor.to_list(length=100000)
                
                if not documents:
                    logger.warning("No resume embeddings found in database. Initializing empty FAISS index.")
                    self._index = faiss.IndexFlatIP(EMBEDDING_DIM)
                    self._id_map = []
                    self._initialized = True
                    return True

                embeddings_list = []
                id_map = []
                
                for doc in documents:
                    emb = doc.get("embedding")
                    if emb and len(emb) == EMBEDDING_DIM:
                        embeddings_list.append(emb)
                        id_map.append(str(doc["_id"]))

                if not embeddings_list:
                    self._index = faiss.IndexFlatIP(EMBEDDING_DIM)
                    self._id_map = []
                    self._initialized = True
                    return True

                vectors = np.array(embeddings_list, dtype=np.float32)
                faiss.normalize_L2(vectors)
                
                index = faiss.IndexFlatIP(EMBEDDING_DIM)
                index.add(vectors)
                
                self._index = index
                self._id_map = id_map
                self._initialized = True
                
                logger.info(f"FAISS index successfully rebuilt with {len(id_map)} candidates.")
                return True
                
            except Exception as e:
                logger.error(f"Error rebuilding FAISS index: {str(e)}")
                return False

    def add_resume(self, resume_id: str, embedding: List[float]):
        """Add a single resume embedding to the FAISS index dynamically."""
        if len(embedding) != EMBEDDING_DIM:
            logger.error(f"Invalid embedding dimension: {len(embedding)}. Expected {EMBEDDING_DIM}.")
            return

        with self._lock:
            try:
                if not self._initialized or self._index is None:
                    self._index = faiss.IndexFlatIP(EMBEDDING_DIM)
                    self._id_map = []
                    self._initialized = True
                
                if resume_id in self._id_map:
                    logger.info(f"Resume {resume_id} already exists in FAISS index; skipping.")
                    return

                vec = np.array([embedding], dtype=np.float32)
                faiss.normalize_L2(vec)
                
                self._index.add(vec)
                self._id_map.append(resume_id)
                logger.info(f"Dynamically added resume {resume_id} to FAISS index.")
                
            except Exception as e:
                logger.error(f"Failed to add resume {resume_id} to FAISS index: {str(e)}")

    def search(self, query_vector: np.ndarray, top_k: int = 10) -> List[Tuple[str, float]]:
        """
        Perform high-speed cosine similarity search against index.
        
        Returns:
            List of tuples containing (resume_id, similarity_percentage).
        """
        if not self._initialized or self._index is None or not self._id_map:
            logger.warning("FAISS index is not initialized. Returning empty results.")
            return []

        try:
            query = query_vector.copy().astype(np.float32).reshape(1, -1)
            faiss.normalize_L2(query)
            
            actual_k = min(top_k, len(self._id_map))
            if actual_k <= 0:
                return []

            similarities, indices = self._index.search(query, actual_k)
            
            results = []
            for idx, similarity in zip(indices[0], similarities[0]):
                if 0 <= idx < len(self._id_map):
                    resume_id = self._id_map[int(idx)]
                    sim_percentage = round(float(similarity) * 100, 2)
                    results.append((resume_id, sim_percentage))
            
            return results
        except Exception as e:
            logger.error(f"Error during FAISS search: {str(e)}")
            return []


# Global FAISS manager instance
faiss_manager = FaissIndexManager()
