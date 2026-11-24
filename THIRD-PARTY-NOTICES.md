# Third-party notices

Creator Studio source code is licensed under the MIT License, copyright (c) 2026 TonyDuongg. See [LICENSE](LICENSE).

Third-party components retain their own licenses and notices; the project license does not replace them.

- Electron and Chromium: desktop distributions include `LICENSE.electron.txt` and `LICENSES.chromium.html` beside the executable.
- Eclipse Temurin / OpenJDK: the bundled Java runtime includes `resources/java/legal`, `resources/java/NOTICE`, and its upstream source/version information in `resources/java/SOURCE.json`. Preserve the complete runtime when redistributing the desktop ZIP. Upstream binaries and source are available from https://github.com/adoptium/temurin21-binaries.
- Be Vietnam Pro: distributed under the SIL Open Font License; see `frontend/public/fonts/OFL.txt`. The desktop bundle also includes that notice beside its fonts.
- Java libraries: the executable backend JAR contains its Maven dependencies, including their embedded `META-INF` license and notice files.
- React, Lucide and other JavaScript dependencies: their license metadata remains available in the respective published packages and dependency lockfiles. Vite emits third-party license information with the frontend build when supported by its bundled tooling.

API subscriptions and access to Gemini, RapidAPI and TikTok are governed by those providers' separate terms. The MIT License does not grant API credits or rights to third-party content.
