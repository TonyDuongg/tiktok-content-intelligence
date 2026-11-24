$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
Set-Location -LiteralPath (Join-Path $root 'backend')
& (Join-Path $root 'backend/mvnw.cmd') -Pdesktop clean verify
exit $LASTEXITCODE
