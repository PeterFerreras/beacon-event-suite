param(
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$packageRoot = Join-Path $PSScriptRoot "package"
$wwwroot = Join-Path $packageRoot "wwwroot"
$zipPath = Join-Path $PSScriptRoot "beacon-event-suite-monsterasp.zip"

if (-not $SkipBuild) {
  Push-Location $projectRoot
  try {
    & npm.cmd run build:monsterasp
    if ($LASTEXITCODE -ne 0) { throw "La compilacion del frontend fallo." }
  } finally {
    Pop-Location
  }
}

if (Test-Path $packageRoot) { Remove-Item -LiteralPath $packageRoot -Recurse -Force }
New-Item -ItemType Directory -Path $wwwroot | Out-Null

$staticOutput = Join-Path $projectRoot "dist\monsterasp"
$generatedHtml = Join-Path $staticOutput "index.monsterasp.html"
if (-not (Test-Path $generatedHtml)) {
  throw "No se genero el documento SPA de MonsterASP."
}
Copy-Item -Path (Join-Path $staticOutput "*") -Destination $wwwroot -Recurse -Force
Move-Item -LiteralPath (Join-Path $wwwroot "index.monsterasp.html") -Destination (Join-Path $wwwroot "_shell.html")
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "web.config") -Destination (Join-Path $wwwroot "web.config")
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "CONFIGURAR-BASE-DE-DATOS.txt") -Destination (Join-Path $wwwroot "CONFIGURAR-BASE-DE-DATOS.txt")
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "INSTRUCCIONES-PUBLICACION.txt") -Destination (Join-Path $wwwroot "INSTRUCCIONES-PUBLICACION.txt")

$backendTarget = Join-Path $wwwroot "backend"
New-Item -ItemType Directory -Path $backendTarget | Out-Null
foreach ($folder in @("config", "public", "src")) {
  Copy-Item -LiteralPath (Join-Path $projectRoot "backend\$folder") -Destination $backendTarget -Recurse -Force
}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "backend.env.example") -Destination (Join-Path $backendTarget ".env.example")
$databaseTarget = Join-Path $backendTarget "database"
New-Item -ItemType Directory -Path $databaseTarget | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot "backend\database\schema.sql") -Destination (Join-Path $databaseTarget "00-esquema-instalacion-nueva.sql")
Copy-Item -LiteralPath (Join-Path $projectRoot "backend\database\seed.sql") -Destination (Join-Path $databaseTarget "01-datos-iniciales.sql")
Copy-Item -LiteralPath (Join-Path $projectRoot "backend\database\2026-07-22-guest-types.sql") -Destination (Join-Path $databaseTarget "02-actualizacion-tipos.sql")

if (Test-Path $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
& tar.exe -a -c -f $zipPath -C $wwwroot .
if ($LASTEXITCODE -ne 0) { throw "No se pudo crear el archivo ZIP." }

Write-Host "Paquete creado: $zipPath"
Write-Host "Antes de publicar, crea backend/.env en el servidor usando .env.example."
