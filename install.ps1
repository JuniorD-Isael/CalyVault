$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "ERRO: Voce precisa rodar o PowerShell como Administrador!" -ForegroundColor Red
    Write-Host "Clique com o botão direito no arquivo e selecione 'Executar com o PowerShell'."
    Read-Host "Pressione Enter para sair..."
    break
}

Add-Type -AssemblyName System.Windows.Forms

Write-Host " "
Write-Host "[*] Aguardando selecao da pasta Steam..." -ForegroundColor Cyan

$folderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog
$folderBrowser.Description = "SELECIONE A PASTA RAIZ DA STEAM (Onde fica o steam.exe)"
$folderBrowser.ShowNewFolderButton = $false
$folderBrowser.RootFolder = "MyComputer"

$dialogResult = $folderBrowser.ShowDialog()

if ($dialogResult -eq "OK") {
    $steamPath = $folderBrowser.SelectedPath
} else {
    Write-Host "Instalacao cancelada pelo usuario." -ForegroundColor Red
    exit
}

if (-not (Test-Path "$steamPath\steam.exe")) {
    Write-Host " "
    Write-Host "ERRO CRITICO: Nao encontrei 'steam.exe' nesta pasta!" -ForegroundColor Red
    Write-Host "Voce selecionou: $steamPath"
    Write-Host "Por favor, selecione a pasta raiz onde a Steam esta instalada."
    Read-Host "Pressione Enter para sair..."
    exit
}

$pluginDir = "$steamPath\plugins\CalyRecall"
$zipUrl = "https://github.com/BruxinCore/CalyRecall/archive/refs/heads/main.zip"
$zipFile = "$env:TEMP\CalyRecall.zip"

Write-Host " "
Write-Host "Local Confirmado: $steamPath" -ForegroundColor Green
Write-Host "----------------------------------"

Write-Host "[*] Fechando a Steam para liberar arquivos..." -ForegroundColor Yellow
Get-Process -Name "steam" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2 

if (Test-Path $pluginDir) {
    Write-Host "[*] Removendo versao antiga..."
    Remove-Item -Path $pluginDir -Recurse -Force -ErrorAction Stop
}

Write-Host "[*] Baixando CalyRecall do GitHub..."
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile
} catch {
    Write-Host "ERRO AO BAIXAR: $_" -ForegroundColor Red
    Read-Host "Enter para sair..."
    exit
}

Write-Host "[*] Extraindo arquivos..."
Expand-Archive -Path $zipFile -DestinationPath "$env:TEMP\CalyRecall_Temp" -Force

$sourceDir = "$env:TEMP\CalyRecall_Temp\CalyRecall-main"

if (-not (Test-Path "$steamPath\plugins")) {
    New-Item -ItemType Directory -Force -Path "$steamPath\plugins" | Out-Null
}

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
