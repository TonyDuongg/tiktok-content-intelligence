# Creator Studio

A desktop and web tool for researching public TikTok channels and writing video scripts with Gemini, OpenAI (GPT), Anthropic (Claude) or xAI (Grok). AWS Bedrock remains an optional server integration. No app login is required.

[Download for Windows](https://github.com/TonyDuongg/tiktok-content-intelligence/releases/latest) · [User guide](docs/CREATOR_STUDIO.md) · [Research methodology](docs/RESEARCH.md) · [Publishing](docs/PUBLISHING.md)

## Windows portable

Download the Windows x64 ZIP, extract the entire archive and open `Creator Studio.exe`. Java is bundled; Node.js, PostgreSQL and Docker are not required. Choose an AI provider in **Settings**, add your API key and select a model from its live catalog. Add RapidAPI for TikTok research. See [AI provider setup](docs/AI_PROVIDERS.md). Provider requests require Internet access, appropriate subscriptions and available quota.

Data and encrypted settings live in `%APPDATA%\Creator Studio`, separately from the executable. To upgrade, close the old app and extract the new ZIP into a separate folder. Back up data before upgrading. The Windows package is unsigned and has no automatic updater. See [desktop instructions](docs/DESKTOP.md).

## Features

- Write scripts targeting 15 seconds to 10 minutes, with dialogue, filming notes, calls to action and hashtags. Requested duration and the AI estimate remain separate.
- Save browser briefs and a persistent script library; search, favorite, archive, restore, copy and export scripts.
- Fetch public channel profiles and video samples through RapidAPI. Select up to five reference videos for a script.
- Save reusable channel and target-audience profiles, including offering, goals, keywords and owner-supplied analytics notes.
- Reopen saved channels without another scraper request. Compare keyword relevance, repeated hashtags, duration groups and measured view-count growth; export JSON reports with supporting evidence.
- Keep desktop navigation and actions within the window while long content scrolls inside its pane.

The UI, built-in guidance, errors, documentation and release notes use English. New AI scripts are requested in English. Existing scripts, user-entered profiles and original TikTok content retain their language. Production uses live providers and does not substitute sample data when they fail.

Content overlap is not verified audience overlap. Public metrics do not reveal another channel's private demographics. Experiments are suggestions to test, not guarantees or calibrated forecasts of virality. See [research methodology and limits](docs/RESEARCH.md).

## Run the web app locally

Use Node.js and JDK 21. Copy `.env.example` to `.env`, configure live provider keys, and run `start.bat` or `./start.ps1`. The launcher checks configuration, starts services hidden and writes logs to `logs/`. Use `./start.ps1 -NoBrowser` to skip opening a browser.

The local profile supports persistent H2 storage. Docker PostgreSQL uses host port `15432` by default. S3 archiving, SQS processing and LocalStack are optional and disabled in the direct workflow. A web deployment uses one shared workspace without accounts; desktop installations have separate local data. Hosting is a separate step and is pending while Railway billing is unavailable.

## Build and verify

Use Node.js 24 and JDK 21 for Windows packaging:

```powershell
npm ci
npm --prefix frontend ci
npm run desktop:build
```

The build runs language checks, desktop tests, frontend lint/tests/build and backend verification, then packages and verifies the Windows ZIP. CI also checks source changes. Test doubles and isolated H2 databases are used for automated tests; paid provider calls are separate manual checks.

See [the API specification](docs/api/API_SPECIFICATION.md), [architecture](docs/architecture/ARCHITECTURE.md), [roadmap](docs/plan/ROADMAP.md), [verification record](docs/VERIFICATION-v1.2.0.md) and [contribution guidelines](CONTRIBUTING.md). Larger deployments still need explicit database migrations, server-side pagination, provider budgets and additional concurrency/PostgreSQL/AWS testing.

## License

MIT License, copyright © 2026 [TonyDuongg](https://github.com/TonyDuongg). Keep the [license](LICENSE) and copyright notice when redistributing. Bundled components retain their own licenses; see [third-party notices](THIRD-PARTY-NOTICES.md).
