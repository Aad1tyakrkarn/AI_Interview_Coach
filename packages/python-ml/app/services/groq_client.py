"""Thin wrapper around the Groq Python SDK for LLaMA 3 chat completions."""

from groq import Groq

from app.config import settings

_client: Groq | None = None


def get_groq_client() -> Groq | None:
    """Return a cached Groq client, or *None* if no API key is configured."""
    global _client
    if not settings.groq_api_key:
        return None
    if _client is None:
        _client = Groq(api_key=settings.groq_api_key)
    return _client


def chat(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> str | None:
    """Send a chat completion request to Groq (LLaMA 3.3 70B).

    Returns the assistant message content, or *None* if the client is
    unavailable or the request fails.
    """
    client = get_groq_client()
    if not client:
        return None
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"[Groq] Error: {e}")
        return None


def chat_with_history(
    system_prompt: str,
    messages: list[dict],
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> str | None:
    """Send a multi-turn chat completion to Groq.

    ``messages`` should be a list of ``{"role": "...", "content": "..."}``
    dicts (user/assistant turns).  The *system_prompt* is prepended
    automatically.
    """
    client = get_groq_client()
    if not client:
        return None
    try:
        all_messages = [{"role": "system", "content": system_prompt}] + messages
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=all_messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"[Groq] Error: {e}")
        return None


def estimate_tokens(text: str) -> int:
    """Rough token estimate (~4 chars per token for English)."""
    return len(text) // 4
