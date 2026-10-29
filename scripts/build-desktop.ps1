param([string]$Output="desktop/publish")
$ErrorActionPreference="Stop"
$projectRoot=Split-Path -Parent $PSScriptRoot
$assetRoot=Join-Path $projectRoot 'web/game'
$bundlePath=Join-Path $projectRoot 'desktop/Game.bundle.zip'
Compress-Archive -Path (Join-Path $assetRoot '*') -DestinationPath $bundlePath -CompressionLevel Optimal -Force
$env:DOTNET_CLI_TELEMETRY_OPTOUT='1'
dotnet publish (Join-Path $projectRoot 'desktop/DeadHorizon.csproj') -c Release -o (Join-Path $projectRoot $Output)
if($LASTEXITCODE -ne 0){throw 'Compilation du lanceur impossible.'}
