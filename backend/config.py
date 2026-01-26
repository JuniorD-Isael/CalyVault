import os
import sys
import json

current_dir = os.path.dirname(os.path.abspath(__file__)) 
plugin_root = os.path.dirname(current_dir)               
plugins_dir = os.path.dirname(plugin_root)               
steam_root_calculated = os.path.dirname(plugins_dir)     

if os.path.exists(os.path.join(steam_root_calculated, "steam.exe")):
    STEAM_PATH = steam_root_calculated
else:
    try:
        import winreg
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam")
        path, _ = winreg.QueryValueEx(key, "SteamPath")
        winreg.CloseKey(key)
        STEAM_PATH = path.replace("/", "\\")
    except:
        STEAM_PATH = os.getcwd()

user_config_file = os.path.join(current_dir, "user_config.json")
custom_backup_path = None

if os.path.exists(user_config_file):
    try:
        with open(user_config_file, 'r') as f:
            data = json.load(f)
            custom_backup_path = data.get("backup_path")
    except: pass

if custom_backup_path and os.path.exists(custom_backup_path):
    BACKUP_ROOT = custom_backup_path
else:
    BACKUP_ROOT = os.path.join(plugin_root, "backups")

if not os.path.exists(BACKUP_ROOT):
    try: os.makedirs(BACKUP_ROOT)
    except: pass

SERVER_PORT = 9999

BACKUP_TARGETS = [
    {"src": os.path.join(STEAM_PATH, "userdata"), "name": "userdata"},
    {"src": os.path.join(STEAM_PATH, "appcache", "stats"), "name": "appcache_stats"},
    {"src": os.path.join(STEAM_PATH, "depotcache"), "name": "depotcache"},
    {"src": os.path.join(STEAM_PATH, "config", "stplug-in"), "name": "stplug-in"}
]

UI_THEME = {
    "title": "CalyRecall",
    "bg": "#101014",
    "accent": "#8b5cf6"
}