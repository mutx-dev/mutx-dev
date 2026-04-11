import hashlib
import math
import re
from typing import List


class LocalHashEmbeddings:
    """Deterministic local embeddings for environments without OpenAI credentials."""

    def __init__(self, *, dimensions: int = 1536):
        self.dimensions = max(8, int(dimensions))

    def _embed(self, text: str) -> list[float]:
        tokens = re.findall(r"[\w-]+", text.lower()) or [text.lower().strip() or "empty"]
        vector = [0.0] * self.dimensions

        for token in tokens:
            digest = hashlib.blake2b(token.encode("utf-8"), digest_size=16).digest()
            index = int.from_bytes(digest[:8], "big") % self.dimensions
            sign = 1.0 if digest[8] % 2 == 0 else -1.0
            weight = 1.0 + (digest[9] / 255.0)
            vector[index] += sign * weight

        norm = math.sqrt(sum(value * value for value in vector))
        if norm:
            vector = [round(value / norm, 8) for value in vector]
        return vector

    def embed_documents(self, texts: List[str]) -> List[list[float]]:
        return [self._embed(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        return self._embed(text)
