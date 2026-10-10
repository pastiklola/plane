# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.app.views.external import base as external_base


def _patch_config(monkeypatch, api_key, provider, model, base_url, system_prompt=None):
    monkeypatch.setattr(
        external_base,
        "get_configuration_value",
        lambda keys: (api_key, provider, model, base_url, system_prompt),
    )


@pytest.mark.unit
class TestGetLLMConfigBaseURL:
    """Custom OpenAI-compatible endpoints must bypass the provider allowlists."""

    def test_base_url_returns_custom_model_and_strips_trailing_slash(self, monkeypatch):
        _patch_config(monkeypatch, "sk-test", "openai", "llama3.1:8b", "http://localhost:11434/v1/")
        api_key, model, provider, base_url, _ = external_base.get_llm_config()
        assert (api_key, model, provider, base_url) == ("sk-test", "llama3.1:8b", "openai", "http://localhost:11434/v1")

    def test_base_url_allows_empty_api_key(self, monkeypatch):
        # Keyless endpoints (e.g. local Ollama) are valid when base_url is set
        _patch_config(monkeypatch, None, "openai", "llama3.1:8b", "http://localhost:11434/v1")
        api_key, model, provider, base_url, _ = external_base.get_llm_config()
        assert api_key is None
        assert base_url == "http://localhost:11434/v1"

    def test_without_base_url_model_allowlist_still_applies(self, monkeypatch):
        _patch_config(monkeypatch, "sk-test", "openai", "not-a-real-model", None)
        assert external_base.get_llm_config()[:4] == (None, None, None, None)

    def test_without_base_url_known_model_still_works(self, monkeypatch):
        _patch_config(monkeypatch, "sk-test", "openai", "gpt-4o-mini", None)
        api_key, model, provider, base_url, _ = external_base.get_llm_config()
        assert (api_key, model, provider, base_url) == ("sk-test", "gpt-4o-mini", "openai", None)


@pytest.mark.unit
class TestGetLLMConfigSystemPrompt:
    """LLM_SYSTEM_PROMPT overrides the built-in default; empty falls back."""

    def test_custom_system_prompt_passes_through(self, monkeypatch):
        _patch_config(monkeypatch, "sk-test", "openai", "gpt-4o-mini", None, "Be a pirate.")
        *_, system_prompt = external_base.get_llm_config()
        assert system_prompt == "Be a pirate."

    def test_empty_system_prompt_falls_back_to_default(self, monkeypatch):
        _patch_config(monkeypatch, "sk-test", "openai", "gpt-4o-mini", None, "")
        *_, system_prompt = external_base.get_llm_config()
        assert system_prompt == external_base.DEFAULT_LLM_SYSTEM_PROMPT

    def test_none_system_prompt_falls_back_to_default(self, monkeypatch):
        _patch_config(monkeypatch, "sk-test", "openai", "gpt-4o-mini", "http://localhost:11434/v1", None)
        *_, system_prompt = external_base.get_llm_config()
        assert system_prompt == external_base.DEFAULT_LLM_SYSTEM_PROMPT
