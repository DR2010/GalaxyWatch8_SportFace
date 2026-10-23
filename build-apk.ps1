param(
    [switch]$Install
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Galaxy Watch 8 Watch Face Format (WFF) APK Builder     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$rootDir = $PSScriptRoot
$toolsDir = Join-Path $rootDir "tools"
$aapt2 = Join-Path $toolsDir "aapt2.exe"
$androidJar = Join-Path $toolsDir "android.jar"
$signerJar = Join-Path $toolsDir "uber-apk-signer.jar"
$javaExe = Join-Path $toolsDir "jre\bin\java.exe"
if (!(Test-Path $javaExe)) {
    if (Get-Command java -ErrorAction SilentlyContinue) {
        $javaExe = "java"
    } else {
        Write-Error "Java runtime not found. Please install Java 17+ or place a portable JRE in tools\jre."
        exit 1
    }
}
$resDir = Join-Path $rootDir "android-wearos-project\app\src\main\res"
$manifest = Join-Path $rootDir "android-wearos-project\app\src\main\AndroidManifest.xml"
$compiledZip = Join-Path $toolsDir "compiled_res.zip"
$unalignedApk = Join-Path $toolsDir "unaligned.apk"
$outputApk = Join-Path $rootDir "GalaxyWatch8_SportFace.apk"

# Ensure raw/watchface.xml is synced from xml/watchface.xml
$rawDir = Join-Path $resDir "raw"
if (!(Test-Path $rawDir)) {
    New-Item -ItemType Directory -Path $rawDir -Force | Out-Null
}
$rawWatchface = Join-Path $rawDir "watchface.xml"
$xmlWatchface = Join-Path $resDir "xml\watchface.xml"
if (Test-Path $rawWatchface) {
    Copy-Item $rawWatchface $xmlWatchface -Force
}

# 1. Compile Resources
Write-Host ""
Write-Host "[1/3] Compiling Watch Face Resources with AAPT2..." -ForegroundColor Yellow
if (Test-Path $compiledZip) {
    Remove-Item $compiledZip -Force
}
& $aapt2 compile --dir $resDir -o $compiledZip

# 2. Link APK
Write-Host "[2/3] Linking APK (Wear OS 4/5/6 WFF Target SDK 34)..." -ForegroundColor Yellow
if (Test-Path $unalignedApk) {
    Remove-Item $unalignedApk -Force
}
& $aapt2 link -I $androidJar --manifest $manifest --min-sdk-version 33 --target-sdk-version 34 --version-code 1 --version-name "1.0.0" -o $unalignedApk $compiledZip --auto-add-overlay

# 3. Zipalign & Sign with APK Signature Scheme v2 & v3
Write-Host "[3/3] Zipaligning & Signing APK with Debug Keystore (v2/v3 scheme)..." -ForegroundColor Yellow
& $javaExe -jar $signerJar -a $unalignedApk -o $toolsDir --allowResign

$signedApkInTools = Join-Path $toolsDir "unaligned-aligned-debugSigned.apk"
if (!(Test-Path $signedApkInTools)) {
    $signedApkInTools = Join-Path $toolsDir "unaligned.apk"
}
Move-Item -Path $signedApkInTools -Destination $outputApk -Force

$apkItem = Get-Item $outputApk
Write-Host ""
Write-Host "[OK] SUCCESS: Generated GalaxyWatch8_SportFace.apk" -ForegroundColor Green
Write-Host "  Location: $($apkItem.FullName)" -ForegroundColor Gray
Write-Host "  Size: $($apkItem.Length) bytes" -ForegroundColor Gray
Write-Host ""

# 4. Optional Install & Set Active
if ($Install) {
    Write-Host "[ADB] Checking connected devices..." -ForegroundColor Cyan
    $deviceLines = @(adb devices | Where-Object { $_ -match "\s+device$" })
    if ($deviceLines.Count -gt 0) {
        $devId = ($deviceLines[0].Trim() -split "\s+")[0]
        Write-Host "[ADB] Installing to watch ($devId)..." -ForegroundColor Yellow
        adb -s $devId install -r $outputApk
        Write-Host "[ADB] Applying watch face to screen..." -ForegroundColor Yellow
        adb -s $devId shell am broadcast -a com.google.android.wearable.app.DEBUG_SURFACE --es operation set-watchface --es watchFaceId com.galaxywatch.sportface
        Write-Host "[OK] INSTALLED AND ACTIVATED ON WATCH!" -ForegroundColor Green
    } else {
        Write-Host "[ADB] No active watch found on adb devices." -ForegroundColor Red
        Write-Host "[ADB] Run 'adb connect <WATCH_IP>:<PORT>' and try again." -ForegroundColor Yellow
    }
}
