param([switch]$NoOpen)
$ErrorActionPreference='Stop'
$repo=Split-Path -Parent $PSScriptRoot
$url='http://127.0.0.1:5187/'
if(!(Test-Path -LiteralPath (Join-Path $repo 'dist\index.html'))){
    if(!(Get-Command npm.cmd -ErrorAction SilentlyContinue)){throw 'Install Node.js 22.12+ and run npm ci then npm run build, or use the prebuilt web package.'}
    Push-Location -LiteralPath $repo
    try { & npm.cmd ci; if($LASTEXITCODE -ne 0){throw 'Dependency install failed'}; & npm.cmd run build; if($LASTEXITCODE -ne 0){throw 'Build failed'} } finally {Pop-Location}
}
$ready=$false
try{$response=Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2; $ready=$response.Content -match 'name="theme-color" content="#183e36"'}catch{}
if(!$ready){
    $server=Join-Path $PSScriptRoot 'server.ps1'
    Start-Process powershell.exe -WindowStyle Hidden -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$server+'"'))
    for($i=0;$i -lt 20;$i++){Start-Sleep -Milliseconds 250;try{$response=Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2;if($response.Content -match 'name="theme-color" content="#183e36"'){$ready=$true;break}}catch{}}
}
if(!$ready){throw 'Game server did not start. Port 5187 may be occupied.'}
if(!$NoOpen){Start-Process $url}
Write-Output $url
