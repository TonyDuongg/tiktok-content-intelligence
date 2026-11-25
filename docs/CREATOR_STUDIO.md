# Creator Studio guide

## Workflow

1. **Channel research:** enter a TikTok username or full profile URL, select a category and fetch 10, 20 or 50 videos. Rankings apply only to the fetched sample.
2. **References:** choose up to five videos. Their IDs, available content and metrics inform the prompt and are saved with the script. Captions are not spoken-word transcripts. Open original videos to inspect their filming and storytelling.
3. **Script studio:** enter a topic, target audience, tone and duration. Presets cover 15, 30 and 60 seconds, and 2 or 3 minutes. Custom durations support seconds or minutes from 15 seconds to 10 minutes, in whole seconds; 1.5 minutes equals 90 seconds. The draft remembers your selection.
4. **Script library:** search by title or audience, filter drafts/favorites/archives, reopen or restore scripts, and copy or download `.txt` from the preview.
5. **My profiles:** save a target audience, offering, goals and keywords. Open saved channels without another scraper request, compare content overlap and export JSON reports. See [research methodology](RESEARCH.md).

New AI scripts and built-in text use English. User-entered content and existing records retain their original language. Known legacy tone choices migrate to their English equivalents without changing your brief.

## Live providers

- `SCRAPER_PROVIDER=rapidapi` requires `RAPIDAPI_KEY` and an active compatible subscription.
- Choose Gemini, OpenAI (GPT), Anthropic (Claude) or xAI (Grok) in Settings and load the model catalog for your key. Windows stores encrypted per-provider keys; the web holds personal keys in tab memory. Server defaults use `AI_PROVIDER` and matching key/model variables. See [AI providers](AI_PROVIDERS.md). AWS Bedrock remains an optional server alternative.
- Provider failures, exhausted quotas and incomplete AI results return errors. The app does not silently substitute sample content. Mock clients load only under the automated `test` profile.
- Gemini has a 120-second response timeout. The browser waits 150 seconds for the backend result. Requests are not automatically retried. Refresh the library after a timeout before generating again: the backend may have finished after the browser disconnected.
- `/api/v1/workspace/status` reports configuration, not provider health, and never returns API keys.
- Run `start.bat` or `./start.ps1` for local web development; `-NoBrowser` skips opening a browser. The launcher reads `.env`, validates live-provider configuration, starts services hidden and writes logs to `logs/`.
- S3 archiving and the SQS worker are disabled by default. AWS and the optional Compose `aws-local` profile are not required for the direct web workflow.

## Storage and access

The app uses one shared workspace without registration, login or session tokens. Legacy Authorization headers do not select another workspace; `/api/v1/auth/*` endpoints are absent. An internal owner record preserves existing foreign keys and is not a login account.

Briefs are saved in browser localStorage without keys. The `local` profile uses persistent H2 under `backend/data/creator-studio`. Docker PostgreSQL uses host port `15432` by default (`jdbc:postgresql://127.0.0.1:15432/tiktok_intelligence`); override with `SPRING_DATASOURCE_URL`. The desktop version keeps a separate local H2 database.

Script generation accepts an integer `requestedDurationSeconds` from 15 to 600, defaulting to 60 for older clients. The requested duration and AI estimate are stored and exported separately. Existing scripts without a requested duration remain readable. The prompt budgets dialogue and timestamps, but actual recording time depends on delivery and transitions. Read the script aloud before filming.

## Verification

```powershell
npm test
npm --prefix frontend ci
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
cd backend
.\mvnw.cmd verify
```

CI uses isolated H2 databases and test-only providers without paid AI calls. Regression coverage includes workspace access without tokens, ignored legacy authorization, absent auth routes, profile CRUD, content-match methodology, observation windows, duration limits, upstream errors and HTTP validation. Automated tests do not replace live-provider, PostgreSQL, concurrency or complete AWS end-to-end checks.

## Remaining development work

- The optional SQS path needs idempotent processing/refunds, transaction boundaries across bean calls, dispatch after persistence and separate handling per job type. Some job filter fields are not fully applied.
- Add workspace-wide concurrency limits, caching and provider budgets. Frontend handling of HTTP 429 does not implement backend rate limiting.
- Move library pagination and search to the server for large libraries; avoid per-script reference queries.
- Preserve an unknown publication time when the scraper omits it; the current fallback uses collection time.
- Add script editing/version history and stronger checks for scene timestamps and spoken-word length. Valid JSON does not establish factual accuracy.
- Replace automatic Hibernate schema updates with versioned migrations before larger deployments. Test PostgreSQL upgrades and load separately.
