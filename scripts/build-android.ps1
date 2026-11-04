param([switch]$SkipWebBuild)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$portableTools = 'C:\misscellenious\mymp-build-tools'
if (Test-Path "$portableTools\jdk21") {
  $env:JAVA_HOME = (Get-ChildItem "$portableTools\jdk21" -Directory | Select-Object -First 1).FullName
}
if (-not $env:ANDROID_HOME -and (Test-Path "$portableTools\android-sdk")) { $env:ANDROID_HOME = "$portableTools\android-sdk" }
if (-not $env:JAVA_HOME -or -not $env:ANDROID_HOME) { throw 'Set JAVA_HOME to JDK 21 and ANDROID_HOME to an Android SDK with platform 36.' }
Push-Location $projectRoot
try {
  if (-not $SkipWebBuild) {
    & npm run android:sync
    if ($LASTEXITCODE -ne 0) { throw 'Android asset preparation failed.' }
  }
  & .\android\gradlew.bat -p android assembleRelease lintRelease --no-daemon --console=plain
  if ($LASTEXITCODE -ne 0) { throw 'Android compilation or lint failed.' }
  $signingDir = Join-Path $env:LOCALAPPDATA 'MYMP\signing'
  $configPath = if ($env:MYMP_SIGNING_CONFIG) { $env:MYMP_SIGNING_CONFIG } else { Join-Path $signingDir 'signing.json' }
  if (-not (Test-Path -LiteralPath $configPath)) {
    New-Item -ItemType Directory -Force -Path $signingDir | Out-Null
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
    & icacls.exe $signingDir /inheritance:r /grant:r "${identity}:(OI)(CI)F" | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not protect the private signing directory.' }
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    $keyPath = Join-Path $signingDir 'mymp-release.jks'
    if (Test-Path -LiteralPath $keyPath) { throw 'A signing key already exists without its configuration. Restore the configuration rather than replacing this key.' }
    $env:MYMP_SIGNING_PASS = $secret
    & "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -keystore $keyPath -alias mymp -keyalg RSA -keysize 4096 -validity 10000 -storepass:env MYMP_SIGNING_PASS -keypass:env MYMP_SIGNING_PASS -dname 'CN=M.Y.M.P. Release, OU=Personal Finance, C=PH'
    if ($LASTEXITCODE -ne 0) { throw 'Signing key generation failed.' }
    @{ keyPath = $keyPath; alias = 'mymp'; password = $secret } | ConvertTo-Json | Set-Content -LiteralPath $configPath -Encoding utf8
  }
  $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
  $env:MYMP_SIGNING_PASS = $config.password
  $buildTools = (Get-ChildItem (Join-Path $env:ANDROID_HOME 'build-tools') -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'zipalign.exe') } | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1).FullName
  if (-not $buildTools) { throw 'Install Android build tools before signing.' }
  New-Item -ItemType Directory -Force -Path releases | Out-Null
  & "$buildTools\zipalign.exe" -f -p 4 android/app/build/outputs/apk/release/app-release-unsigned.apk releases/MYMP-aligned.apk
  if ($LASTEXITCODE -ne 0) { throw 'APK alignment failed.' }
  & "$buildTools\apksigner.bat" sign --ks $config.keyPath --ks-key-alias $config.alias --ks-pass env:MYMP_SIGNING_PASS --key-pass env:MYMP_SIGNING_PASS --out releases/MYMP-Android.apk releases/MYMP-aligned.apk
  if ($LASTEXITCODE -ne 0) { throw 'APK signing failed.' }
  & "$buildTools\apksigner.bat" verify --verbose --print-certs releases/MYMP-Android.apk
  if ($LASTEXITCODE -ne 0) { throw 'Signed APK verification failed.' }
  $stream = [IO.File]::OpenRead((Join-Path $projectRoot 'releases\MYMP-Android.apk'))
  try { $hash = [BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($stream)).Replace('-', '').ToLower() } finally { $stream.Dispose() }
  "$hash  MYMP-Android.apk" | Set-Content releases/MYMP-Android.apk.sha256 -Encoding ascii
  Write-Output "Signed installer: $projectRoot\releases\MYMP-Android.apk"
  Write-Output "Keep the private signing folder backed up: $signingDir"
} finally {
  Remove-Item Env:MYMP_SIGNING_PASS -ErrorAction SilentlyContinue
  Pop-Location
}
