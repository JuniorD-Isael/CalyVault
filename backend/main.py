import Millennium 
from monitor import BackupManager

class Plugin:
    def __init__(self):
        self.monitor = None

    def _load(self):
        print("[CalyRecall] Carregando plugin...")
        
        self.monitor = BackupManager()
        self.monitor.start()

        Millennium.ready()

    def _unload(self):
        print("[CalyRecall] Descarregando...")
        if self.monitor:
            self.monitor.stop()

plugin = Plugin()