# Version 1.1.1 verification

Checked on Windows x64 on November 25, 2026.

- 55 backend tests, 16 frontend tests and 6 desktop tests passed (77 total).
- Frontend lint and production build passed. Windows package verification and ZIP integrity checks passed.
- Language checks cover product-authored copy and release documentation, while preserving explicit compatibility rules and multilingual test/source fixtures.
- A live Gemini request generated an English 30-second script. The result was reopened from the library and downloaded as UTF-8 text with English section labels and separate target/estimated durations.
- Browser checks covered studio, profiles, saved-channel comparison, profile create/delete and text export. A 390-pixel mobile viewport had no horizontal page overflow.
- The packaged Electron app opened with fresh isolated data and with a copy of previously saved multilingual research data plus the generated script. English Settings, script preview and reports were checked visually.
- Desktop checks at 1280×780 and 820×620 found no whole-page overflow. The Generate script action remained within the viewport; long content scrolled inside its pane.
- Repository and packaged-file checks found no developer API keys or personal databases in the distribution.

These checks do not establish complete defect coverage. Live Bedrock, SQS, S3, PostgreSQL upgrades, load/concurrency and every possible Windows configuration were not retested for this language release. TikTok reports used previously collected public data; no fresh paid scraper request was needed. Previous release archives remain unchanged and retain their original interface language.
