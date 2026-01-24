import os
import json
import threading
import urllib.parse
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from config import BACKUP_ROOT, SERVER_PORT, STEAM_PATH

class CalyRequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With")
        self.end_headers()

    def do_GET(self):
        if self.path == '/check_restore':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            flag_file = os.path.join(BACKUP_ROOT, "restore_success.flag")
            was_restored = False

            if os.path.exists(flag_file):
                was_restored = True
                try: os.remove(flag_file)
                except: pass
            
            self.wfile.write(json.dumps({"restored": was_restored}).encode())

        elif self.path == '/list':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            backups = []
            if os.path.exists(BACKUP_ROOT):
                try:
                    backups = [d for d in os.listdir(BACKUP_ROOT) if os.path.isdir(os.path.join(BACKUP_ROOT, d)) and d.startswith("CalyBackup")]
                    backups.sort()
                except: pass
            
            self.wfile.write(json.dumps(backups).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path.startswith('/restore/'):
            backup_name = self.path.replace('/restore/', '')
            backup_name = urllib.parse.unquote(backup_name)
            
            print(f"[CalyServer] COMANDO RECEBIDO: Restaurar {backup_name}")
            
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status": "accepted"}')

            threading.Thread(target=trigger_external_restore, args=(backup_name,), daemon=True).start()

    def log_message(self, format, *args): return

def trigger_external_restore(backup_folder_name):
    backup_src = os.path.join(BACKUP_ROOT, backup_folder_name)
    steam_exe = os.path.join(STEAM_PATH, "steam.exe")
    temp_bat = os.path.join(os.environ["TEMP"], "caly_restore.bat")
    flag_file = os.path.join(BACKUP_ROOT, "restore_success.flag")

    print(f"[CalyServer] Gerando script AUTO-ELEVAVEL em: {temp_bat}")

    bat_content = [
        "@echo off",
        "title CalyRecall - Verificando Permissoes...",
        "color 0D",
        "cls",
        "",
        ":: --- BLOC DE AUTO-ELEVACAO (VBS METHOD) ---",
        "net session >nul 2>&1",
        "if %errorLevel% == 0 (",
        "    goto :gotAdmin",
        ") else (",
        "    echo Solicitando Permissao de Administrador...",
        "    echo Set UAC = CreateObject^(\"Shell.Application\"^) > \"%temp%\\getadmin.vbs\"",
        "    echo UAC.ShellExecute \"%~s0\", \"\", \"\", \"runas\", 1 >> \"%temp%\\getadmin.vbs\"",
        "    \"%temp%\\getadmin.vbs\"",
        "    exit /B",
        ")",
        "",
        ":: --- INICIO DO PROCESSO REAL ---",
        ":gotAdmin",
        "if exist \"%temp%\\getadmin.vbs\" ( del \"%temp%\\getadmin.vbs\" )",
        "pushd \"%CD%\"",
        "CD /D \"%~dp0\"",
        "",
        "title CalyRecall - RESTAURANDO...",
        "echo.",
        "echo  =========================================",
        "echo      CALYRECALL - PROTOCOLO DE RESTAURO",
        "echo  =========================================",
        "echo.",
        "echo  [1/4] Aguardando fechamento da Steam...",
        "timeout /t 3 /nobreak >nul",
        "",
        "echo  [2/4] Matando processos travados...",
        "taskkill /F /IM steam.exe >nul 2>&1",
        "timeout /t 2 /nobreak >nul",
        "",
        "echo  [3/4] Restaurando arquivos do backup...",
        f'set "BACKUP={backup_src}"',
        f'set "STEAM={STEAM_PATH}"',
        "",
        'echo    -> Userdata',
        'xcopy "%BACKUP%\\userdata\\*" "%STEAM%\\userdata\\" /E /H /C /I /Y /Q >nul 2>&1',
        "",
        'echo    -> Stats',
        'xcopy "%BACKUP%\\appcache_stats\\*" "%STEAM%\\appcache\\stats\\" /E /H /C /I /Y /Q >nul 2>&1',
        "",
        'echo    -> Depotcache',
        'xcopy "%BACKUP%\\depotcache\\*" "%STEAM%\\depotcache\\" /E /H /C /I /Y /Q >nul 2>&1',
        "",
        'echo    -> Configs',
        'xcopy "%BACKUP%\\stplug-in\\*" "%STEAM%\\config\\stplug-in\\" /E /H /C /I /Y /Q >nul 2>&1',
        "",
        "echo  [4/4] Finalizando...",
        f'echo 1 > "{flag_file}"',
        f'start "" "{steam_exe}"',
        "",
        '(goto) 2>nul & del "%~f0"'
    ]

    try:
        with open(temp_bat, "w") as f:
            f.write("\n".join(bat_content))
        
        print("[CalyServer] Executing BAT via os.startfile...")
        os.startfile(temp_bat)
        
    except Exception as e:
        print(f"[CalyServer] ERRO AO LANÇAR BAT: {e}")

def start_server():
    server_address = ('127.0.0.1', SERVER_PORT)
    httpd = HTTPServer(server_address, CalyRequestHandler)
    print(f"[CalyRecall] API Server rodando na porta {SERVER_PORT}")
    httpd.serve_forever()