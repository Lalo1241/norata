# Arma el APK de Norata con lo nativo al día y lo deja en Descargas.
#
# Se guarda DENTRO de la carpeta «Norata App Android» (la que tiene la
# carpeta `android/` adentro) y se corre en PowerShell desde ahí:
#
#     powershell -ExecutionPolicy Bypass -File .\armar-apk.ps1
#
# Hace, en orden, lo que dicen los LEEME de nativo/avisos y nativo/salud:
#   1. baja de GitHub los instaladores de avisos y de Health Connect y los
#      corre (los dos se pueden correr dos veces: lo hecho se lo saltan);
#   2. trae la web (`traer-web.mjs`) y sincroniza Capacitor;
#   3. arma el APK firmado con la llave de siempre (`assembleRelease`);
#   4. lo copia a Descargas como Norata-<versión>.apk.
#
# Se para en el primer paso que falle y dice cuál fue.
$ErrorActionPreference = "Stop"
$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $raiz
if (-not (Test-Path (Join-Path $raiz "android\app"))) {
  Write-Host "`n  x Este script va dentro de la carpeta «Norata App Android» (la que tiene la carpeta android).`n" -ForegroundColor Red
  exit 1
}

function Paso($texto, [scriptblock]$hacer) {
  Write-Host "`n== $texto" -ForegroundColor Cyan
  & $hacer
  if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    Write-Host "`n  x Falló: $texto (código $LASTEXITCODE). Mándale a Claude lo que salió arriba.`n" -ForegroundColor Red
    exit $LASTEXITCODE
  }
}

$crudo = "https://raw.githubusercontent.com/Lalo1241/norata/main"
Paso "Bajar los instaladores" {
  Invoke-WebRequest "$crudo/nativo/avisos/instalar-avisos.js" -OutFile "instalar-avisos.js" -UseBasicParsing
  Invoke-WebRequest "$crudo/nativo/salud/instalar-salud.js" -OutFile "instalar-salud.js" -UseBasicParsing
}
Paso "Avisos (recordatorios de misiones)" { node instalar-avisos.js }
Paso "Health Connect" { node instalar-salud.js }
Paso "Traer la web" { node traer-web.mjs }
Paso "Sincronizar Capacitor" { npx cap sync android }

$jdk = Join-Path $raiz ".herramientas\jdk-21"
if (Test-Path $jdk) { $env:JAVA_HOME = $jdk }
Paso "Armar el APK firmado" {
  Push-Location (Join-Path $raiz "android")
  try { .\gradlew.bat assembleRelease } finally { Pop-Location }
}

$apk = Get-ChildItem (Join-Path $raiz "android\app\build\outputs\apk\release") -Filter *.apk |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $apk) {
  Write-Host "`n  x No encontré el APK en android\app\build\outputs\apk\release.`n" -ForegroundColor Red
  exit 1
}
$version = "nueva"
$base = Join-Path $raiz "www\js\01-base.js"
if (Test-Path $base) {
  $m = Select-String -Path $base -Pattern 'const VERSION = "([^"]+)"' | Select-Object -First 1
  if ($m) { $version = $m.Matches[0].Groups[1].Value }
}
$descargas = Join-Path $env:USERPROFILE "Downloads"
$destino = Join-Path $descargas "Norata-$version.apk"
Copy-Item $apk.FullName $destino -Force
Write-Host "`n  Listo: $destino`n  Pásalo al teléfono e instálalo encima del que tienes, sin desinstalar.`n" -ForegroundColor Green
