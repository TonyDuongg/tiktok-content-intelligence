# AI providers and models

Creator Studio supports Google Gemini, OpenAI (GPT), Anthropic (Claude) and xAI (Grok) for script generation. Each provider requires its own API key, permissions and quota. Consumer chat subscriptions do not configure API access in this app.

## Windows

Open **Settings**, choose an AI provider and enter its API key. The app loads that key's model catalog when you finish entering the key, or when you switch to a provider with a saved key. Use **Refresh models** to reload it, choose a model and save. Changing providers preserves the other providers' keys and model choices.

Keys are encrypted for your Windows account. Existing version 1 Gemini/RapidAPI settings migrate to the new format without changing your scripts or research data. The new settings format is intended for version 1.2.0 and later; keep a backup before upgrading rather than opening new settings with an older binary.

## Web

Open **Settings** and select a provider, key and model. Apply the settings, then generate a script. Keys are held only in the current tab's memory, never in localStorage or the database. Reloading clears these keys; the provider/model preference remains. Cancel discards unapplied changes. Different tabs can use different providers.

Requests pass through the site's backend and are sent to the selected provider over HTTPS. Use a trusted deployment. Where a server key is configured, the key field explains that leaving it blank uses that server configuration. Request-specific keys do not replace server configuration or other visitors' keys.

## Discovery and compatibility

Model lists are fetched from the provider, not a bundled list. The app filters for text generation: Gemini `generateContent` models, OpenAI text-model families, Claude models and xAI language models with text output. Image, embedding, speech and live-only models are excluded where metadata or naming identifies them. Catalog access does not guarantee generation permission, quota or compatibility for every model. Provider errors are shown without silently switching models or returning sample content.

The app does not automatically select the first model or send a paid generation to test a key. Choose a model explicitly. If discovery is unavailable, **Enter a model ID manually** provides an alternative; generation permissions and compatibility still apply. Partial catalogs, repeated cursors, invalid responses and provider errors are reported rather than treated as a successful empty catalog.

Generation uses Gemini GenerateContent, OpenAI Responses (`store: false`), Anthropic Messages and xAI Chat Completions. Only completed, valid script structures are persisted. There are no automatic paid retries. AWS Bedrock remains available through server configuration; this release's interactive model discovery covers the four API-key providers above.

## Server defaults

Use `.env.example` as a starting point. Set `AI_PROVIDER` to `gemini`, `openai`, `anthropic` or `xai`, then configure the corresponding key/model pair:

| Provider | Key variable | Model variable |
| --- | --- | --- |
| Gemini | `GEMINI_API_KEY` | `GEMINI_MODEL` |
| OpenAI | `OPENAI_API_KEY` | `OPENAI_MODEL` |
| Anthropic | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL` |
| xAI | `XAI_API_KEY` | `XAI_MODEL` |

The API exposes `GET /api/v1/ai/providers` (IDs, configuration flags and default model IDs; no keys) and `POST /api/v1/ai/models` with `X-AI-Provider` and an optional request-specific `X-AI-Key`. Generation accepts `X-AI-Provider`, `X-AI-Model` and optional `X-AI-Key` headers. Omitting all three preserves the server-default behavior. Supplying credentials or a model without a provider returns HTTP 400. Keys are not placed in URLs, response payloads, saved scripts or application diagnostics.

Provider references: [Gemini models](https://aistudio.google.com/api-reference/models/list-models), [OpenAI models](https://developers.openai.com/api/reference/resources/models/methods/list) and [Responses](https://developers.openai.com/api/reference/resources/responses/methods/create), [Claude models](https://platform.claude.com/docs/en/api/models/list) and [Messages](https://platform.claude.com/docs/en/api/messages/create), [xAI models](https://docs.x.ai/developers/rest-api-reference/inference/models) and [Chat Completions](https://docs.x.ai/developers/rest-api-reference/inference/chat-completions).
