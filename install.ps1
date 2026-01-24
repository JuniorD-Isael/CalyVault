# Define o caminho
$steamPath = "C:\Program Files (x86)\Steam"
$pluginDir = "$steamPath\plugins\CalyRecall"
$zipUrl = "https://github.com/BruxinCore/CalyRecall/archive/refs/heads/main.zip"
$zipFile = "$env:TEMP\CalyRecall.zip"

Write-Host "[CalyRecall] Iniciando instalacao..." -ForegroundColor Magenta

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "ERRO: Voce precisa rodar o PowerShell como Administrador!" -ForegroundColor Red
    break
}

Write-Host "[*] Fechando a Steam para liberar arquivos..." -ForegroundColor Yellow
Get-Process -Name "steam" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2 

if (Test-Path $pluginDir) {
    Write-Host "[*] Removendo versao antiga..."
    Remove-Item -Path $pluginDir -Recurse -Force -ErrorAction Stop
}

Write-Host "[*] Baixando CalyRecall do GitHub..."
Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile

Write-Host "[*] Extraindo arquivos..."
Expand-Archive -Path $zipFile -DestinationPath "$env:TEMP\CalyRecall_Temp" -Force

$sourceDir = "$env:TEMP\CalyRecall_Temp\CalyRecall-main"
New-Item -ItemType Directory -Force -Path $pluginDir | Out-Null
Copy-Item -Path "$sourceDir\*" -Destination $pluginDir -Recurse -Force

Remove-Item $zipFile -Force
Remove-Item "$env:TEMP\CalyRecall_Temp" -Recurse -Force

Write-Host ""
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "   CALYRECALL INSTALADO COM SUCESSO! 💜" -ForegroundColor Magenta
Write-Host "============================================"
Write-Host "Local: $pluginDir"

Write-Host "[*] Iniciando a Steam..." -ForegroundColor Green
Start-Process "$steamPath\steam.exe"
