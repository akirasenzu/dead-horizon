param([string]$Publish='desktop/publish',[string]$Destination='desktop/release')
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$source=Join-Path $projectRoot $Publish
$dest=Join-Path $projectRoot $Destination
$version=(Get-Content -LiteralPath (Join-Path $source 'version.txt') -Raw).Trim()
if($version -notmatch '^\d+\.\d+\.\d+$'){throw 'Version de publication invalide.'}
New-Item -ItemType Directory -Path $dest -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $source 'DeadHorizon.exe') -Destination (Join-Path $dest 'DeadHorizon.exe') -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'desktop/LIRE-MOI.txt') -Destination $dest -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'web/game/MAP-LICENSE.txt') -Destination (Join-Path $dest 'LICENCE-CARTE.txt') -Force
Copy-Item -LiteralPath (Join-Path $projectRoot 'web/game/vendor/THREE-LICENSE.txt') -Destination (Join-Path $dest 'LICENCE-THREE.txt') -Force
$executable=Join-Path $dest 'DeadHorizon.exe'
$checksum=(Get-FileHash -LiteralPath $executable -Algorithm SHA256).Hash.ToLowerInvariant()
"$checksum  DeadHorizon.exe" | Set-Content -LiteralPath (Join-Path $dest 'SHA256SUMS.txt') -Encoding utf8
@{schema=1;version=$version;sha256=$checksum;size=(Get-Item -LiteralPath $executable).Length;url="https://github.com/akirasenzu/dead-horizon/releases/download/pc-v$version/DeadHorizon.exe"} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $dest 'update.json') -Encoding utf8
Compress-Archive -Path (Join-Path $dest '*') -DestinationPath (Join-Path $projectRoot 'desktop/DeadHorizon-Windows.zip') -CompressionLevel Optimal -Force
Write-Output "Version $version prête, fichier et empreinte vérifiés."
