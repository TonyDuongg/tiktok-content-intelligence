Choose Google Gemini, OpenAI (GPT), Anthropic (Claude) or xAI (Grok) for script generation with your own API key.

- Load available text models directly from the selected provider and refresh the catalog when needed.
- Keep a separate model and encrypted key for each provider in Windows Settings. Existing Gemini/RapidAPI settings migrate automatically.
- Web AI settings keep personal keys in tab memory and save only provider/model preferences.
- Use a manual model ID when catalog discovery is unavailable. Provider permissions, compatibility, billing and quota still apply.
- Invalid keys, rate limits and incomplete outputs produce clear errors without changing providers or substituting samples.

See `docs/AI_PROVIDERS.md` for configuration, API contracts and limitations. Live model listing does not guarantee that every listed model can generate a script with the selected key.

Validation: 90 automated tests passed, with live Gemini model discovery and generation checked. Successful live calls to OpenAI, Anthropic and xAI require authorized provider keys and were not verified in this release; their API contracts were tested with controlled responses. See `docs/VERIFICATION-v1.2.0.md`.

**Windows upgrade:** close the old app, back up `%APPDATA%\Creator Studio`, extract the entire new ZIP into a separate folder and open `Creator Studio.exe`. Your scripts and research data remain in AppData. The new encrypted settings format requires version 1.2.0 or later. Windows builds are unsigned and do not auto-update.

MIT License, © 2026 TonyDuongg.
