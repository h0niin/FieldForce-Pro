from __future__ import annotations

import logging
from typing import Any, AsyncGenerator

logger = logging.getLogger(__name__)

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False


class LLMClient:
    """Unified LLM client supporting OpenAI and Anthropic."""

    def __init__(
        self,
        openai_api_key: str = "",
        openai_model: str = "gpt-4o",
        anthropic_api_key: str = "",
        anthropic_model: str = "claude-sonnet-4-20250514",
        provider: str = "openai",
    ) -> None:
        self.provider = provider
        self.openai_client: Any = None
        self.anthropic_client: Any = None

        if OPENAI_AVAILABLE and openai_api_key:
            self.openai_client = openai.AsyncOpenAI(api_key=openai_api_key)
            self.openai_model = openai_model

        if ANTHROPIC_AVAILABLE and anthropic_api_key:
            self.anthropic_client = anthropic.AsyncAnthropic(api_key=anthropic_api_key)
            self.anthropic_model = anthropic_model

    async def complete(
        self,
        prompt: str,
        system: str = "",
        max_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> str:
        if self.provider == "openai" and self.openai_client:
            return await self._openai_complete(prompt, system, max_tokens, temperature)
        elif self.provider == "anthropic" and self.anthropic_client:
            return await self._anthropic_complete(prompt, system, max_tokens, temperature)
        return f"LLM not configured (provider={self.provider}) — placeholder response"

    async def _openai_complete(
        self,
        prompt: str,
        system: str,
        max_tokens: int,
        temperature: float,
    ) -> str:
        messages: list[dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        response = await self.openai_client.chat.completions.create(
            model=self.openai_model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content or ""

    async def _anthropic_complete(
        self,
        prompt: str,
        system: str,
        max_tokens: int,
        temperature: float,
    ) -> str:
        kwargs: dict[str, Any] = {
            "model": self.anthropic_model,
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system:
            kwargs["system"] = system

        response = await self.anthropic_client.messages.create(**kwargs)
        return response.content[0].text if response.content else ""

    async def embed(self, text: str, model: str = "text-embedding-3-small") -> list[float]:
        if self.openai_client:
            response = await self.openai_client.embeddings.create(
                model=model, input=text
            )
            return response.data[0].embedding
        return []

    async def stream(
        self,
        prompt: str,
        system: str = "",
        max_tokens: int = 1024,
    ) -> AsyncGenerator[str, None]:
        if self.provider == "openai" and self.openai_client:
            messages: list[dict[str, str]] = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.append({"role": "user", "content": prompt})

            stream = await self.openai_client.chat.completions.create(
                model=self.openai_model,
                messages=messages,
                max_tokens=max_tokens,
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        else:
            yield "Streaming not available — placeholder"
