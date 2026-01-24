(function() {
    'use strict';

    const API_URL = "http://localhost:9999";

    function ensureCalyStyles() {
        if (document.getElementById('caly-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'caly-styles';
        style.textContent = `
            @keyframes calyFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes calySlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            
            #caly-fab {
                position: fixed; bottom: 30px; right: 30px; width: 50px; height: 50px;
                background: linear-gradient(135deg, #8b5cf6, #6d28d9);
                border-radius: 50%; box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
                display: flex; align-items: center; justify-content: center;
                z-index: 99999; cursor: pointer; border: 2px solid rgba(255,255,255,0.1);
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); color: white;
            }
            #caly-fab:hover { transform: scale(1.1) rotate(15deg); box-shadow: 0 0 30px rgba(139, 92, 246, 0.8); background: #a78bfa; }
            
            .caly-overlay {
                position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
                z-index: 100000; display: flex; align-items: center; justify-content: center;
                animation: calyFadeIn 0.2s ease-out;
            }
            .caly-modal {
                background: linear-gradient(135deg, #13131a 0%, #1e1e2e 100%);
                border: 2px solid #8b5cf6; border-radius: 8px; width: 500px; max-width: 90vw;
                box-shadow: 0 20px 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(139, 92, 246, 0.3);
                animation: calySlideUp 0.1s ease-out; color: #fff; font-family: "Motiva Sans", sans-serif;
                overflow: hidden; display: flex; flex-direction: column;
            }
            .caly-header {
                padding: 20px; background: linear-gradient(90deg, #2e1065, #13131a);
                border-bottom: 2px solid rgba(139, 92, 246, 0.3); display: flex; justify-content: space-between; align-items: center;
            }
            .caly-title {
                font-size: 22px; font-weight: 700; background: linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 100%);
                -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            }
            .caly-body { padding: 0; max-height: 60vh; overflow-y: auto; background: rgba(0,0,0,0.2); }
            .caly-item {
                padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05);
                display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;
            }
            .caly-item:hover { background: rgba(139, 92, 246, 0.1); }
            .caly-date { display: block; font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 4px; }
            .caly-path { display: block; font-size: 12px; color: #94a3b8; font-family: monospace; }
            .caly-btn {
                background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border: 1px solid #7c3aed;
                color: white; padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer;
                text-decoration: none; font-size: 13px; transition: all 0.2s;
            }
            .caly-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); }
            .caly-btn:disabled { filter: grayscale(1); cursor: not-allowed; opacity: 0.7; }

            /* Sucesso */
            .caly-modal.success { border-color: #22c55e; }
            .caly-modal.success .caly-header { background: linear-gradient(90deg, #14532d, #13131a); border-color: #22c55e; }
            .caly-modal.success .caly-title { background: linear-gradient(135deg, #86efac 0%, #22c55e 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .caly-success-icon { font-size: 40px; margin-bottom: 15px; color: #22c55e; }
        `;
        document.head.appendChild(style);
    }

    function createFloatingButton() {
        if (document.getElementById('caly-fab')) return;
        ensureCalyStyles();
        const fab = document.createElement('div');
        fab.id = 'caly-fab';
        fab.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
        fab.title = "CalyRecall History";
        fab.onclick = showRestoreModal;
        document.body.appendChild(fab);
    }

    function removeOverlay() {
        const existing = document.querySelector('.caly-overlay');
        if (existing) existing.remove();
    }


    function showRestoreModal() {
        removeOverlay();
        ensureCalyStyles();

        const overlay = document.createElement('div');
        overlay.className = 'caly-overlay';
        overlay.innerHTML = `
            <div class="caly-modal">
                <div class="caly-header">
                    <div class="caly-title">CalyRecall</div>
                    <div style="cursor:pointer; padding:5px" id="caly-close">✕</div>
                </div>
                <div class="caly-body" id="caly-list-container">
                    <div style="padding:20px; text-align:center; color:#94a3b8">Carregando backups...</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.onclick = (e) => { if(e.target === overlay) removeOverlay(); };
        overlay.querySelector('#caly-close').onclick = removeOverlay;

        fetchBackups(overlay.querySelector('#caly-list-container'));
    }

    function showSuccessModal() {
        removeOverlay();
        ensureCalyStyles();

        const overlay = document.createElement('div');
        overlay.className = 'caly-overlay';
        overlay.innerHTML = `
            <div class="caly-modal success">
                <div class="caly-header">
                    <div class="caly-title">Recall Completo</div>
                    <div style="cursor:pointer; padding:5px" id="caly-close">✕</div>
                </div>
                <div class="caly-body">
                    <div style="padding:40px; text-align:center;">
                        <div class="caly-success-icon">✓</div>
                        <div style="font-size:16px; color:#fff; margin-bottom:5px;">Backup restaurado com sucesso!</div>
                        <div style="font-size:13px; color:#94a3b8">Seus arquivos voltaram no tempo.</div>
                        <button class="caly-btn" id="caly-ok-btn" style="margin-top:20px; background: #22c55e; border-color: #16a34a;">Entendido</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.onclick = (e) => { if(e.target === overlay) removeOverlay(); };
        overlay.querySelector('#caly-close').onclick = removeOverlay;
        overlay.querySelector('#caly-ok-btn').onclick = removeOverlay;
    }


    async function checkStartupStatus() {
        setTimeout(async () => {
            try {
                const res = await fetch(`${API_URL}/check_restore`);
                const data = await res.json();
                if (data.restored === true) {
                    showSuccessModal();
                }
            } catch (e) { }
        }, 1500);
    }

    async function fetchBackups(container) {
        try {
            const res = await fetch(`${API_URL}/list`);
            const backups = await res.json();

            if (!backups || backups.length === 0) {
                container.innerHTML = '<div style="padding:20px; text-align:center; color:#94a3b8">Nenhum backup encontrado.</div>';
                return;
            }

            container.innerHTML = ''; 
            backups.reverse().forEach(folder => {
                const item = document.createElement('div');
                item.className = 'caly-item';
                let dateStr = folder.replace('CalyBackup-', '').replace(/_/g, ' ').substring(0, 16).replace(/-/g, '/');
                
                item.innerHTML = `<div><span class="caly-date">${dateStr}</span><span class="caly-path">${folder}</span></div>`;
                const btn = document.createElement('button');
                btn.className = 'caly-btn';
                btn.textContent = 'RESTAURAR';

                btn.onclick = () => triggerRestore(folder, btn, item);
                
                item.appendChild(btn);
                container.appendChild(item);
            });
        } catch (e) {
            container.innerHTML = `<div style="padding:20px; text-align:center; color:#ef4444">Erro de conexão: ${e}</div>`;
        }
    }

    async function triggerRestore(folder, btnElement, itemContainer) {
        if(!confirm(`⚠️ ATENÇÃO ⚠️\n\nA Steam será FECHADA para restaurar o backup:\n${folder}`)) return;
        
        // 1. Feedback visual no botão
        btnElement.textContent = "⏳";
        btnElement.disabled = true;
        
        try {
            const response = await fetch(`${API_URL}/restore/${folder}`, { method: 'POST' });
            
            if (response.ok) {
                const body = document.querySelector('.caly-body');
                if(body) body.innerHTML = `
                    <div style="padding:40px; text-align:center;">
                        <div style="font-size:18px; margin-bottom:10px; color:#c4b5fd">Iniciando Protocolo Recall...</div>
                        <div style="font-size:14px; color:#94a3b8">Verifique a janela de Admin que abrirá.</div>
                        <div style="margin-top:15px; font-size:12px; color:#64748b">Reiniciando Steam...</div>
                    </div>
                `;
            } else {
                alert("O servidor recusou o comando. Tente novamente.");
                btnElement.textContent = "RESTAURAR";
                btnElement.disabled = false;
            }
        } catch(e) {
            alert("Erro de conexão com o plugin: " + e);
            btnElement.textContent = "ERRO";
            btnElement.disabled = false;
        }
    }

    setTimeout(createFloatingButton, 1000);
    setTimeout(createFloatingButton, 3000);
    checkStartupStatus();
})();