# Contributing

Use English for product UI, accessible labels, validation/provider errors, built-in examples, generated report guidance, documentation, commit summaries, pull requests and release notes. New generated scripts are requested in English. Preserve user content, proper names, source captions and existing stored records in their original language. Keep multilingual fixtures and normalization support when testing these contracts.

Before submitting, run `npm run check:language`, desktop tests, frontend lint/tests/build and backend verification. Do not commit `.env`, keys, logs, databases or generated runtime/release artifacts. Run the secret scans before pushing.

Release changes need a new package version and an English `docs/RELEASE-v<version>.md`. Build and verify the Windows archive, test it with isolated data and preserve previous release assets. See [publishing instructions](docs/PUBLISHING.md).
