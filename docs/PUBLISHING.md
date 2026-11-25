# Publishing Creator Studio

The project is licensed under MIT, copyright © 2026 TonyDuongg. Keep the copyright and license in redistributed copies and retain third-party notices. All product UI, errors, documentation and release notes must be written in English. User content can use any supported language.

## GitHub and Windows

The public repository is [TonyDuongg/tiktok-content-intelligence](https://github.com/TonyDuongg/tiktok-content-intelligence). Build on Windows with Node.js 24 and JDK 21:

```powershell
npm ci
npm --prefix frontend ci
npm run desktop:build
```

Bump the package version and lockfile for each binary release. Write English notes in `docs/RELEASE-v<version>.md`. Generate a SHA-256 checksum for the resulting ZIP. Check the archive, launch it with isolated data, and run secret scans before publishing. Never include `.env`, API keys, databases, logs or developer caches.

The **Windows release** GitHub Actions workflow builds and verifies the package. Its optional publish input creates a new release with the version's checked-in notes, ZIP, checksum, license and third-party notices. Never replace a published archive silently; issue a new version. Historical binaries retain their original interface language even when their release descriptions are translated.

Users download from [GitHub Releases](https://github.com/TonyDuongg/tiktok-content-intelligence/releases/latest), extract the full ZIP and launch `Creator Studio.exe`. The portable build is unsigned and does not auto-update. See [Windows instructions](DESKTOP.md).

## Hosting the web version

Windows distribution and web hosting are separate. A public repository or release does not automatically create a live website. Railway requires an eligible account with billing/usage available; deployment is pending while that requirement is unmet.

For Railway, connect the repository, add PostgreSQL and configure the app service's server-side variables:

```dotenv
SPRING_PROFILES_ACTIVE=production
SPRING_DATASOURCE_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
SPRING_DATASOURCE_USERNAME=${{Postgres.PGUSER}}
SPRING_DATASOURCE_PASSWORD=${{Postgres.PGPASSWORD}}
AI_PROVIDER=gemini
GEMINI_API_KEY=<site-owner-key>
GEMINI_MODEL=<authorized-model>
SCRAPER_PROVIDER=rapidapi
RAPIDAPI_KEY=<site-owner-key>
S3_ARCHIVE_ENABLED=false
SQS_WORKER_ENABLED=false
```

Use the repository Dockerfile and Railway configuration. Verify the deployment health endpoint returns `UP`, confirm the service uses Railway's injected `PORT`, then generate a public domain. Use the production profile online; the desktop profile is for a local app.

The web deployment has a shared workspace without login. Its owner supplies provider keys and pays for requests. Plan workspace quotas, backups and concurrency limits before broad distribution. Set secrets in the hosting provider's environment, never in frontend `VITE_*` variables or source control. Desktop users instead supply their own keys in Settings.
