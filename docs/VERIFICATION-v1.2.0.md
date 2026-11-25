# Version 1.2.0 verification

Checked on Windows x64 on November 25, 2026.

- 65 backend tests, 18 frontend tests and 7 desktop tests passed (90 total). Frontend lint and production build passed.
- Provider contract tests cover Gemini pagination and modality filtering, Claude pagination/version headers, OpenAI Responses and xAI Chat Completions, completed-text extraction, request-scoped credential isolation, malformed/incomplete outputs and sanitized provider errors.
- API checks cover unauthenticated provider discovery, missing/invalid configuration, credential headers and CORS. Selected-provider scripts retain the actual returned model instead of using the default client.
- Desktop tests cover per-provider key/model preservation, clearing one provider without affecting others, encrypted round trips, legacy settings migration and isolation from developer environment variables.
- Browser checks exercised all four provider selections using controlled catalog responses, restored per-provider choices and verified that personal keys do not enter localStorage or survive page reloads. Mobile settings were inspected at 390 pixels wide.
- Live Gemini model discovery was checked with an authorized key; the final desktop catalog returned 20 filtered text models for that key at the time of testing. A selected-model web request generated and saved a real English script.
- The packaged Windows app was tested with isolated data. First-run catalog loading, Windows-encrypted key persistence, backend restart, model/key preservation across provider switches and a real rejected OpenAI fixture key were checked. A rejected generation left the saved script count unchanged.
- Package verification excludes developer keys, personal data and logs, includes the provider guide and license notices, and the ZIP integrity check passed.

Successful live generation with OpenAI, Anthropic and xAI was not verified because authorized keys for those providers were not available. Their request/response contracts were tested with controlled responses; the OpenAI negative check does not establish successful generation. Provider catalogs and permissions can change, and listing a model does not prove it has sufficient quota or supports every request. PostgreSQL migration, load/concurrency, optional AWS integrations and every Windows configuration were not retested for this release.
