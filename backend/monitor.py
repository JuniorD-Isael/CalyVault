import os
import time
import shutil
import winreg
import threading
from datetime import datetime
from config import BACKUP_ROOT, BACKUP_TARGETS, MAX_BACKUPS
from ui import show_notification

class BackupManager(threading.Thread):
    def __init__(self):
        super().__init__(daemon=True)
        self.running = True
        self.last_appid = 0
        self.was_running = False

    def get_running_appid(self):
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam")
            val, _ = winreg.QueryValueEx(key, "RunningAppID")
            winreg.CloseKey(key)
            return int(val)
        except:
            return 0

    def rotate_backups(self):
        """Remove os backups mais antigos quando o limite MAX_BACKUPS é atingido."""
        if not os.path.exists(BACKUP_ROOT):
            return
        try:
            entries = [
                d for d in os.listdir(BACKUP_ROOT)
                if os.path.isdir(os.path.join(BACKUP_ROOT, d)) and d.startswith("CalyBackup")
            ]
            entries.sort()  # ordem lexicográfica = ordem cronológica (YYYY-MM-DD_HH-MM-SS)
            while len(entries) >= MAX_BACKUPS:
                oldest = entries.pop(0)
                oldest_path = os.path.join(BACKUP_ROOT, oldest)
                print(f"[CalyRecall] Limite atingido. Deletando backup antigo: {oldest}")
                shutil.rmtree(oldest_path, ignore_errors=True)
        except Exception as e:
            print(f"[CalyRecall] Erro na rotação de backups: {e}")

    def perform_backup(self, appid):
        self.rotate_backups()  # garante que o limite de MAX_BACKUPS seja respeitado
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        folder_name = f"CalyBackup-{timestamp}"
        dest_folder = os.path.join(BACKUP_ROOT, folder_name)
        
        success_count = 0
        print(f"[CalyRecall] Iniciando backup em: {dest_folder}")

        for target in BACKUP_TARGETS:
            src = target["src"]
            dst = os.path.join(dest_folder, target["name"])
            
            try:
                if os.path.exists(src):
                    if os.path.isdir(src):
                        shutil.copytree(src, dst, dirs_exist_ok=True)
                    else:
                        os.makedirs(os.path.dirname(dst), exist_ok=True)
                        shutil.copy2(src, dst)
                    
                    success_count += 1
                else:
                    print(f"[CalyRecall] ALERTA: Pasta não encontrada: {src}")
            except Exception as e:
                print(f"[CalyRecall] Erro ao copiar {target['name']}: {e}")

        if success_count > 0:
            show_notification("CalyRecall", f"CalyBackup realizado com sucesso.")

    def stop(self):
        self.running = False

    def run(self):
        print("[CalyRecall] Monitor ativo.")
        while self.running:
            current_appid = self.get_running_appid()

            if self.was_running and current_appid == 0:
                print("[CalyRecall] Jogo fechado. Iniciando protocolo de backup...")
                time.sleep(5) 
                self.perform_backup(self.last_appid)
                self.was_running = False
            
            elif current_appid > 0:
                self.was_running = True
                self.last_appid = current_appid

            time.sleep(2)