import re
from collections import Counter


STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "and", "but", "or",
    "not", "no", "so", "if", "then", "than", "too", "very", "just",
    "about", "up", "out", "it", "its", "this", "that", "these", "those",
    "i", "me", "my", "we", "our", "you", "your", "he", "she", "they",
    "them", "his", "her", "what", "which", "who", "when", "where", "how",
}


def tokenize(text: str) -> list[str]:
    """Tokenize text into a list of tokens."""
    text = text.lower()
    tokens = re.findall(r"\b[a-zA-Z][a-zA-Z0-9]*(?:'[a-z]+)?\b", text)
    return tokens


def clean_text(text: str) -> str:
    """Clean and normalize text."""
    text = re.sub(r"[^\w\s.,!?;:'-]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_keywords(text: str, top_n: int = 10) -> list[str]:
    """Extract the most relevant keywords from text."""
    tokens = tokenize(text)
    filtered = [t for t in tokens if t not in STOP_WORDS and len(t) > 2]
    counts = Counter(filtered)
    return [word for word, _ in counts.most_common(top_n)]
