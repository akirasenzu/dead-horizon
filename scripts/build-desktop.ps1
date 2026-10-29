param([string]$Output="desktop/publish",[string]$Version="")
$ErrorActionPreference="Stop"
$projectRoot=Split-Path -Parent $PSScriptRoot
$assetRoot=Join-Path $projectRoot 'web/game'
$bundlePath=Join-Path $projectRoot 'desktop/Game.bundle.zip'
Compress-Archive -Path (Join-Path $assetRoot '*') -DestinationPath $bundlePath -CompressionLevel Optimal -Force
$env:DOTNET_CLI_TELEMETRY_OPTOUT='1'
if(!$Version){
    [xml]$project=Get-Content (Join-Path $projectRoot 'desktop/DeadHorizon.csproj')
    $Version=[string]$project.Project.PropertyGroup.Version
    if($env:GITHUB_RUN_NUMBER){$parts=$Version.Split('.');$Version="$($parts[0]).$($parts[1]).$env:GITHUB_RUN_NUMBER"}
}
if($Version -notmatch '^\d+\.\d+\.\d+$'){throw 'Version invalide.'}
dotnet publish (Join-Path $projectRoot 'desktop/DeadHorizon.csproj') -c Release -p:Version=$Version -p:InformationalVersion=$Version -o (Join-Path $projectRoot $Output)
if($LASTEXITCODE -ne 0){throw 'Compilation du lanceur impossible.'}

$Version | Set-Content -Encoding utf8 (Join-Path (Join-Path $projectRoot $Output) 'version.txt')
