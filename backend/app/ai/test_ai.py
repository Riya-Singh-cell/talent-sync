import unittest
import time
import numpy as np
from app.ai.embedding_model import generate_embedding
from app.ai.similarity_engine import (
    calculate_similarity,
    calculate_similarity_from_embeddings,
    calculate_similarities_batch
)
from app.ai.skill_extractor import extract_skills


class TestAIComponents(unittest.TestCase):
    
    def test_embedding_lazy_loading(self):
        """Test that the embedding model loads and generates correct shape."""
        # Generates a valid embedding of size 384
        emb = generate_embedding("Python developer with React experience")
        self.assertIsInstance(emb, np.ndarray)
        self.assertEqual(emb.shape, (384,))
        
        # Test empty input fallback
        empty_emb = generate_embedding("")
        self.assertEqual(empty_emb.shape, (384,))
        self.assertTrue(np.all(empty_emb == 0.0))
        
    def test_similarity_engine(self):
        """Test similarity calculations including single, precomputed, and batch."""
        res_text = "Experienced python developer skilled in web services and AWS cloud"
        jd_text = "Seeking a python developer with AWS experience"
        
        # Test single similarity
        sim = calculate_similarity(res_text, jd_text)
        self.assertIsInstance(sim, float)
        self.assertGreater(sim, 0.0)
        self.assertLessEqual(sim, 100.0)
        
        # Test precomputed similarity
        emb1 = generate_embedding(res_text)
        emb2 = generate_embedding(jd_text)
        sim_pre = calculate_similarity_from_embeddings(emb1, emb2)
        self.assertEqual(sim, sim_pre)
        
        # Test empty input
        self.assertEqual(calculate_similarity("", jd_text), 0.0)
        
        # Test batch similarity
        resumes = [
            "Experienced python developer skilled in web services and AWS cloud",
            "Java engineer focused on spring boot applications",
            "React frontend developer with design system experience",
            "" # Empty resume check
        ]
        batch_sims = calculate_similarities_batch(jd_text, resumes)
        self.assertEqual(len(batch_sims), 4)
        self.assertGreater(batch_sims[0], batch_sims[1]) # Python resume should be more similar than Java
        self.assertGreater(batch_sims[0], batch_sims[2]) # Python resume should be more similar than React
        self.assertEqual(batch_sims[3], 0.0) # Empty resume similarity should be 0.0
        
    def test_skill_extractor_special_characters(self):
        """Test that skill extractor correctly matches special character skills."""
        # Test normal skills
        text = "I write code in Python, Java, and JavaScript."
        skills = extract_skills(text)
        self.assertIn("python", skills)
        self.assertIn("java", skills)
        self.assertIn("javascript", skills)
        
        # Test special character skills (the critical bug we fixed)
        text_special = "Expert in C++, C#, and Node.js developer."
        skills_special = extract_skills(text_special)
        self.assertIn("c++", skills_special)
        self.assertIn("c#", skills_special)
        self.assertIn("node.js", skills_special)
        
    def test_skill_extractor_synonyms_and_duplicates(self):
        """Test synonym resolving and duplication prevention."""
        text = "I do Node.js, nodejs, and Node development."
        skills = extract_skills(text)
        # Should only contain 'node.js' once and not 'nodejs' or 'node' separately
        self.assertIn("node.js", skills)
        self.assertNotIn("nodejs", skills)
        self.assertNotIn("node", skills)
        self.assertEqual(skills.count("node.js"), 1)
        
    def test_skill_extractor_performance(self):
        """Benchmark skill extraction speed."""
        large_text = "Python react aws java docker kubernetes git mysql postgresql " * 100
        
        t0 = time.time()
        skills = extract_skills(large_text)
        duration = time.time() - t0
        
        print(f"\nSkill extraction duration: {duration:.4f}s for {len(large_text)} chars.")
        self.assertLess(duration, 0.05)  # Should take under 50ms (usually under 5ms)
        self.assertIn("python", skills)
        self.assertIn("react", skills)
        self.assertIn("aws", skills)


if __name__ == "__main__":
    unittest.main()
