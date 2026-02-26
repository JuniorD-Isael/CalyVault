import os
import winreg

def get_steam_path():
    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam")
        path, _ = winreg.QueryValueEx(key, "SteamPath")
        winreg.CloseKey(key)
        return path.replace("/", "\\")
    except:
        return os.getcwd()

STEAM_PATH = get_steam_path()
BACKUP_ROOT = os.path.join(STEAM_PATH, "millennium", "backups")
MAX_BACKUPS = 4

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