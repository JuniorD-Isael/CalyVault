Write-Host "[CalyRecall] Iniciando instalacao..." -ForegroundColor Magenta

$steamPath = Get-ItemProperty -Path "HKCU:\Software\Valve\Steam" -Name "SteamPath" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty SteamPath

if (-not $steamPath) {
    Write-Host "[Erro] Steam nao encontrada no Registro!" -ForegroundColor Red
    exit
}

$steamPath = $steamPath.Replace("/", "\")
$pluginDir = "$steamPath\plugins\CalyRecall"
$tempDir = "$env:TEMP\CalyRecall_Installer"
$zipFile = "$tempDir\repo.zip"

if (Test-Path $pluginDir) {
    Remove-Item -Path $pluginDir -Recurse -Force
}

New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host "[*] Baixando CalyRecall do GitHub..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "https://github.com/BruxinCore/CalyRecall/archive/refs/heads/main.zip" -OutFile $zipFile

Expand-Archive -Path $zipFile -DestinationPath $tempDir -Force
$extractedFolder = "$tempDir\CalyRecall-main"

if (-not (Test-Path $extractedFolder)) {
    Write-Host "[Erro] Falha ao extrair arquivos." -ForegroundColor Red
    exit
}

New-Item -ItemType Directory -Path $pluginDir -Force | Out-Null
Copy-Item -Path "$extractedFolder\*" -Destination $pluginDir -Recurse -Force

Remove-Item -Path $tempDir -Recurse -Force

Write-Host ""
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "   CALYRECALL INSTALADO COM SUCESSO! 💜" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "Local: $pluginDir"

Write-Host "[*] Reiniciando a Steam..." -ForegroundColor Yellow
Get-Process -Name "steam" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Start-Process "$steamPath\steam.exe"

Start-Sleep -Seconds 3
