$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$packageRoot = Join-Path $PSScriptRoot "package"
$wwwroot = Join-Path $packageRoot "wwwroot"
$zipPath = Join-Path $PSScriptRoot "beacon-event-suite-monsterasp.zip"

Push-Location $projectRoot
try {
  & npm.cmd run build:monsterasp
  if ($LASTEXITCODE -ne 0) { throw "La compilacion del frontend fallo." }
} finally {
  Pop-Location
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

$backendTarget = Join-Path $wwwroot "backend"
New-Item -ItemType Directory -Path $backendTarget | Out-Null
foreach ($folder in @("config", "public", "src")) {
  Copy-Item -LiteralPath (Join-Path $projectRoot "backend\$folder") -Destination $backendTarget -Recurse -Force
}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot "backend.env.example") -Destination (Join-Path $backendTarget ".env.example")

if (Test-Path $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
Compress-Archive -Path (Join-Path $wwwroot "*") -DestinationPath $zipPath -CompressionLevel Optimal

Write-Host "Paquete creado: $zipPath"
Write-Host "Antes de publicar, crea backend/.env en el servidor usando .env.example."
