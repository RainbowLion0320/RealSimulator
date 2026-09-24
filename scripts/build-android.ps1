param([string]$ToolsRoot = 'G:\tools\tabletop-android')
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repo
if ($env:MING_ANDROID_TOOLS) { $ToolsRoot = $env:MING_ANDROID_TOOLS }
$jdk = Join-Path $ToolsRoot 'jdk\jdk-21.0.12.1+1'
$sdk = Join-Path $ToolsRoot 'sdk'
$gradle = Join-Path $ToolsRoot 'gradle\gradle-8.14.3\bin\gradle.bat'
foreach ($path in @("$jdk\bin\java.exe", "$sdk\platforms\android-36\android.jar", $gradle)) { if (!(Test-Path -LiteralPath $path)) { throw "Missing Android build tool: $path. See docs/BUILD.md." } }
$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:GRADLE_USER_HOME = Join-Path $ToolsRoot 'gradle-cache'
Set-Content -LiteralPath android/local.properties -Value ('sdk.dir=' + $sdk.Replace('\','/')) -Encoding ascii
function Check([string]$what) { if ($LASTEXITCODE -ne 0) { throw "$what failed: $LASTEXITCODE" } }
& npm.cmd run build
Check 'Web build'
& npx.cmd cap sync android
Check 'Android assets sync'
& $gradle --no-daemon -p android :app:assembleRelease
Check 'Android release build'
$keyDir = Join-Path $env:LOCALAPPDATA 'RealSimulator\signing'
$key = Join-Path $keyDir 'ming-release.p12'
$pass = Join-Path $keyDir 'password.txt'
if ((Test-Path -LiteralPath $key) -ne (Test-Path -LiteralPath $pass)) { throw 'Signing backup is incomplete. Restore the original key; do not replace it.' }
if (!(Test-Path -LiteralPath $key)) {
    New-Item -ItemType Directory -Path $keyDir -Force | Out-Null
    $bytes = New-Object byte[] 36
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes); $rng.Dispose()
    [IO.File]::WriteAllText($pass, [Convert]::ToBase64String($bytes), (New-Object Text.UTF8Encoding($false)))
    & "$jdk\bin\keytool.exe" -genkeypair -keystore $key -storetype PKCS12 -alias ming -keyalg RSA -keysize 3072 -validity 10000 -storepass:file $pass -keypass:file $pass -dname 'CN=Ming Dynasty, O=Rainbowlion, C=CN'
    Check 'Create signing key'
}
New-Item -ItemType Directory -Path output/apk -Force | Out-Null
$version = (Get-Content -Raw -Encoding UTF8 (Join-Path $repo 'package.json') | ConvertFrom-Json).version
$apkName = "Ming-Dynasty-1582-$version.apk"
$apk = Join-Path $repo (Join-Path 'output\apk' $apkName)
& "$sdk\build-tools\36.0.0\zipalign.exe" -f -p 4 android/app/build/outputs/apk/release/app-release-unsigned.apk output/apk/aligned.apk
Check 'Align APK'
& "$sdk\build-tools\36.0.0\apksigner.bat" sign --ks $key --ks-key-alias ming --ks-pass "file:$pass" --out $apk output/apk/aligned.apk
Check 'Sign APK'
& "$sdk\build-tools\36.0.0\apksigner.bat" verify --verbose $apk
Check 'Verify APK'
$hashAlgorithm = [Security.Cryptography.SHA256]::Create()
$apkStream = [IO.File]::OpenRead($apk)
try { $hash = ([BitConverter]::ToString($hashAlgorithm.ComputeHash($apkStream))).Replace('-','').ToLowerInvariant() }
finally { $apkStream.Dispose(); $hashAlgorithm.Dispose() }
[IO.File]::WriteAllText("$apk.sha256", "$hash  $apkName`n", (New-Object Text.UTF8Encoding($false)))
Write-Output "APK: $apk"
