# Creator Studio for Windows

Download the Windows x64 ZIP from [GitHub Releases](https://github.com/TonyDuongg/tiktok-content-intelligence/releases/latest). Extract the entire archive and open `Creator Studio.exe`. Windows 10/11 x64 is required. Java is included; Node.js, PostgreSQL and Docker are not required.

## First launch

Open **Settings**, choose Gemini, OpenAI, Anthropic or xAI and enter its API key. Choose a model from the live provider catalog, or refresh the list. Keys/model choices are preserved separately per provider. Add RapidAPI for TikTok research, which requires a TikTok Scraper7 subscription. Provider quotas and charges apply. No app account or login is required. See [AI provider setup](AI_PROVIDERS.md).

Scripts, research profiles and saved channels remain on your computer. Generating scripts and collecting TikTok data require Internet access. The desktop window keeps navigation and primary actions visible; long results scroll inside their panes.

The interface, built-in guidance and newly generated scripts use English. Your existing scripts, profiles, briefs and original TikTok captions retain their language.

## Data, backups and upgrades

Data is stored in `%APPDATA%\Creator Studio`. Open **Application → Open data folder** or **Settings → Data folder** to find the database and logs. API keys are encrypted for your Windows account; they cannot be transferred to another Windows account by copying settings.

Close the app before backing up the `data` folder. To move to another computer, copy this folder into the new installation's data directory and enter your API keys again. Desktop and web databases do not synchronize automatically.

To upgrade, close the old app, back up data, extract the entire new ZIP into a separate folder and launch the new executable. Existing data and settings remain in the same AppData directory. Do not replace files while the app is running. Automatic updates are not implemented.

## Troubleshooting

- If a key is rejected, check its permissions, subscription and quota in the provider dashboard.
- If startup fails, check the logs in the data folder and confirm the full ZIP was extracted.
- Paths with non-ASCII characters use a private Java runtime cache in the Windows temporary directory. If the temporary path is also incompatible with Java, the app reports how to use an ASCII path.
- Windows builds are unsigned. Code signing and macOS/Linux packages are not currently available.

## Build from source

Use Node.js 24, JDK 21 and PowerShell on Windows:

```powershell
npm ci
npm --prefix frontend ci
npm run desktop:build
```

The build runs desktop tests, frontend checks and Maven verification, downloads a pinned checksum-verified Eclipse Temurin JRE 21, and creates `release/Creator-Studio-<version>-Windows-x64.zip`. Package verification checks required components and excludes personal keys and development data. The archive includes `README.txt`, `resources/DESKTOP.md`, `resources/RESEARCH.md`, the MIT license and third-party notices. Java licenses are under `resources/java`.

For development, prepare the runtime with `npm run desktop:prepare`, then use `npm run desktop:dev`. The backend is local to the desktop app and its lifecycle is managed by Electron.
