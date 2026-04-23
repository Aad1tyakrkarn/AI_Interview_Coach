"""RAG Service — Retrieval-Augmented Generation for interview evaluation.

Uses FAISS for fast vector similarity search + sentence-transformers for embeddings.
Falls back to NumPy cosine similarity if FAISS is not installed.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

# Lazy-loaded globals
_model = None
_rag_instance = None

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
QUESTION_BANK_PATH = DATA_DIR / "question_bank.json"


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def get_rag_service() -> "RAGService":
    """Singleton accessor."""
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = RAGService()
        _rag_instance.load_knowledge_base()
    return _rag_instance


class RAGService:
    """FAISS-powered vector store for interview question bank."""

    def __init__(self):
        self.question_bank: list[dict] = []
        self.question_texts: list[str] = []
        self.faiss_index = None  # faiss.IndexFlatIP
        self._loaded = False

    def load_knowledge_base(self) -> None:
        """Load question bank from JSON and build FAISS index."""
        if self._loaded:
            return

        if not QUESTION_BANK_PATH.exists():
            print(f"[RAG] Question bank not found at {QUESTION_BANK_PATH}")
            self._loaded = True
            return

        with open(QUESTION_BANK_PATH, "r", encoding="utf-8") as f:
            self.question_bank = json.load(f)

        if not self.question_bank:
            self._loaded = True
            return

        self.question_texts = [q["question"] for q in self.question_bank]

        model = _get_model()
        embeddings = model.encode(
            self.question_texts, convert_to_numpy=True, show_progress_bar=False
        ).astype(np.float32)

        # Normalize for cosine similarity (inner product on normalized = cosine)
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        norms[norms == 0] = 1
        embeddings = embeddings / norms
        self.embeddings = embeddings

        # Build FAISS index
        import faiss
        dimension = embeddings.shape[1]
        self.faiss_index = faiss.IndexFlatIP(dimension)  # Inner Product (cosine on normalized)
        self.faiss_index.add(embeddings)
        print(f"[RAG] FAISS index built: {len(self.question_bank)} questions, dim={dimension}")

        self._loaded = True

    def find_similar_questions(
        self, query: str, role: str = "", top_k: int = 3
    ) -> list[dict]:
        """Find semantically similar questions using FAISS."""
        if self.faiss_index is None or len(self.question_bank) == 0:
            return []

        model = _get_model()
        query_emb = model.encode([query], convert_to_numpy=True).astype(np.float32)

        # Normalize query
        norm = np.linalg.norm(query_emb, axis=1, keepdims=True)
        if norm[0, 0] > 0:
            query_emb = query_emb / norm

        # FAISS search
        search_k = min(top_k * 3, len(self.question_bank))
        distances, indices = self.faiss_index.search(query_emb, search_k)
        similarities = distances[0]
        candidate_indices = indices[0]

        # Role filtering + threshold
        role_lower = role.lower().strip()
        results = []
        for i, idx in enumerate(candidate_indices):
            idx = int(idx)
            if idx < 0 or idx >= len(self.question_bank):
                continue
            score = float(similarities[i])

            # Role boost/penalty
            if role_lower:
                entry_roles = [r.lower() for r in self.question_bank[idx].get("roles", [])]
                if role_lower not in entry_roles:
                    score *= 0.5

            if score > 0.3:
                entry = self.question_bank[idx].copy()
                entry["similarity_score"] = round(score, 4)
                results.append(entry)

            if len(results) >= top_k:
                break

        return results

    def get_ideal_answer(self, question: str, role: str = "") -> str | None:
        """Get the ideal answer for the most similar question."""
        similar = self.find_similar_questions(question, role=role, top_k=1)
        if similar and similar[0].get("similarity_score", 0) > 0.6:
            return similar[0].get("ideal_answer")
        return None

    def get_key_concepts(self, question: str, role: str = "") -> list[str]:
        """Get key concepts to check for the most similar question."""
        similar = self.find_similar_questions(question, role=role, top_k=1)
        if similar and similar[0].get("similarity_score", 0) > 0.5:
            return similar[0].get("key_concepts", [])
        return []

    def get_evaluation_context(self, question: str, answer: str, role: str = "") -> str:
        """Build evaluation context with retrieved ideal answers and concepts."""
        similar = self.find_similar_questions(question, role=role, top_k=2)

        if not similar:
            return ""

        parts = []
        best = similar[0]
        ideal = best.get("ideal_answer", "")
        concepts = best.get("key_concepts", [])

        if ideal:
            parts.append(f"Reference Answer (use as guide, not exact match):\n{ideal[:500]}")

        if concepts:
            parts.append(f"Key Concepts to Check: {', '.join(concepts)}")

        if len(similar) > 1 and similar[1].get("similarity_score", 0) > 0.5:
            extra_concepts = similar[1].get("key_concepts", [])
            if extra_concepts:
                new = [c for c in extra_concepts if c not in concepts]
                if new:
                    parts.append(f"Additional Concepts: {', '.join(new)}")

        return "\n\n".join(parts)
