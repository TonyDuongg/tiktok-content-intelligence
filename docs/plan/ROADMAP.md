# Development roadmap

## Available now

- Direct script generation with Gemini, OpenAI, Anthropic or xAI, live model discovery, per-provider key/model choices, structured previews and `.txt` export. Bedrock remains an optional server integration.
- Duration targets from 15 seconds to 10 minutes, browser draft recovery and a persistent script library.
- Public channel research through RapidAPI, saved channels and up to five script references.
- Reusable channel/audience profiles, keyword relevance reports, evidence links, repeated hashtags, duration groups and measured view-count growth.
- Windows x64 portable distribution with bundled Java, local storage and encrypted API keys.
- English UI, errors, documentation and release notes; multilingual user/source content remains supported.
- MIT license credited to TonyDuongg; no login or production sample mode.

## Next improvements

1. Add script editing, version history and stronger timing/word-budget validation.
2. Add server-side library pagination/search and reduce reference-query overhead.
3. Preserve unknown source publication times and improve scraper-contract coverage.
4. Introduce explicit database migrations and PostgreSQL upgrade tests.
5. Add workspace-wide provider budgets, caching, concurrency controls and operational metrics.
6. Harden optional SQS processing with idempotency, transaction boundaries and implemented job filters before enabling it broadly.
7. Add signed Windows releases and an explicit update strategy.
8. Deploy the public web service when hosting billing is available, then verify production health, backups and quotas.

Research improvements must keep content relevance separate from verified audience demographics. Any future forecasting model needs representative historical data, evaluation and clearly reported uncertainty. Current experiments do not guarantee virality.
