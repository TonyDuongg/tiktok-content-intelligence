module.exports = {
  appId: 'vn.creatorstudio.desktop',
  productName: 'Creator Studio',
  copyright: 'Copyright © 2026 TonyDuongg',
  directories: { output: 'release', buildResources: 'desktop/resources' },
  files: [
    'desktop/main.cjs', 'desktop/preload.cjs', 'desktop/settings-preload.cjs',
    'desktop/lib.cjs', 'desktop/windows-runtime.cjs', 'desktop/ui/**/*', 'desktop/resources/icon.png', 'package.json', 'LICENSE',
    { from: 'frontend/public/fonts', to: 'desktop/ui/fonts', filter: ['*.woff2', 'OFL.txt'] },
  ],
  extraResources: [
    { from: 'desktop/.runtime/backend.jar', to: 'backend.jar' },
    { from: 'desktop/.runtime/java', to: 'java' },
    { from: 'docs/DESKTOP.md', to: 'HUONG-DAN.md' },
    { from: 'docs/RESEARCH.md', to: 'RESEARCH.md' },
  ],
  extraFiles: [
    { from: 'desktop/.runtime/README.txt', to: 'HUONG-DAN.txt' },
    { from: 'LICENSE', to: 'LICENSE.txt' },
    { from: 'THIRD-PARTY-NOTICES.md', to: 'THIRD-PARTY-NOTICES.md' },
  ],
  asar: true,
  npmRebuild: false,
  win: { icon: 'desktop/resources/icon.ico', signExecutable: false },
  artifactName: 'Creator-Studio-${version}-Windows-${arch}.${ext}',
  nsis: { oneClick: false, perMachine: false, allowToChangeInstallationDirectory: true, deleteAppDataOnUninstall: false },
};
