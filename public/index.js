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
            @keyframes calySlideOutRight {
                0% { transform: translateX(0); opacity: 1; max-height: 80px; margin-bottom: 0; padding: 16px 20px; }
                50% { opacity: 0; transform: translateX(50px); }
                100% { transform: translateX(100px); opacity: 0; max-height: 0; margin-bottom: 0; padding: 0; border: none; }
            }
            
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
                border: 2px solid #8b5cf6; border-radius: 12px; width: 550px; max-width: 90vw;
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
                -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 0.5px;
            }
            
            .caly-body { padding: 0; max-height: 60vh; overflow-y: auto; background: rgba(0,0,0,0.2); }
            .caly-body::-webkit-scrollbar { width: 6px; }
            .caly-body::-webkit-scrollbar-thumb { background: #8b5cf640; border-radius: 4px; }
            .caly-body::-webkit-scrollbar-thumb:hover { background: #8b5cf680; }

            .caly-rename-container { padding: 30px; display: flex; flex-direction: column; gap: 15px; }
            .caly-input {
                background: rgba(0,0,0,0.3); border: 1px solid #4c1d95; color: white;
                padding: 12px; border-radius: 6px; width: 100%; font-family: inherit; outline: none;
                transition: all 0.2s; font-size: 14px; box-sizing: border-box;
            }
            .caly-input:focus { border-color: #8b5cf6; box-shadow: 0 0 15px rgba(139, 92, 246, 0.2); background: rgba(0,0,0,0.5); }
            .caly-buttons-row { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }

            .caly-item {
                padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05);
                display: flex; justify-content: space-between; align-items: center; 
                transition: background 0.2s; position: relative;
            }
            .caly-item:hover { background: rgba(139, 92, 246, 0.08); }
            
            .caly-info { display: flex; flex-direction: column; gap: 4px; }
            .caly-main-text { font-size: 15px; font-weight: 600; color: #e2e8f0; }
            .caly-sub-text { font-size: 11px; color: #94a3b8; font-family: monospace; opacity: 0.7; }
            
            .caly-actions { display: flex; gap: 8px; align-items: center; }

            .caly-btn {
                background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border: 1px solid #7c3aed;
                color: white; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;
                font-size: 12px; transition: all 0.2s; display: flex; align-items: center; gap: 6px;
                text-transform: uppercase; letter-spacing: 0.5px;
            }
            .caly-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); filter: brightness(1.1); }
            .caly-btn.secondary { background: transparent; border: 1px solid rgba(255,255,255,0.2); }
            .caly-btn.secondary:hover { background: rgba(255,255,255,0.1); box-shadow: none; }

            .caly-icon-btn {
                background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                color: #94a3b8; padding: 8px; border-radius: 6px; cursor: pointer;
                transition: all 0.2s; display: flex; align-items: center; justify-content: center;
            }
            .caly-icon-btn.del:hover { background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #ef4444; transform: scale(1.1); }
            .caly-icon-btn.edit:hover { background: rgba(56, 189, 248, 0.2); border-color: #38bdf8; color: #38bdf8; transform: scale(1.1); }

            .caly-modal.success { border-color: #22c55e; }
            .caly-modal.success .caly-header { background: linear-gradient(90deg, #14532d, #13131a); border-color: #22c55e; }
            .caly-modal.success .caly-title { background: linear-gradient(135deg, #86efac 0%, #22c55e 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .caly-success-icon { font-size: 48px; margin-bottom: 15px; color: #22c55e; animation: calySlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
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
                    <div class="caly-title">CalyRecall Storage</div>
                    <div style="cursor:pointer; padding:8px; opacity:0.7; transition:0.2s" id="caly-close">✕</div>
                </div>
                <div class="caly-body" id="caly-list-container">
                    <div style="padding:40px; text-align:center; color:#94a3b8; font-style:italic">Conectando...</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.onclick = (e) => { if(e.target === overlay) removeOverlay(); };
        overlay.querySelector('#caly-close').onclick = removeOverlay;
        fetchBackups(overlay.querySelector('#caly-list-container'));
    }

    function showRenameModal(folder, currentName) {
        removeOverlay();
        ensureCalyStyles();

        const overlay = document.createElement('div');
        overlay.className = 'caly-overlay';
        overlay.innerHTML = `
            <div class="caly-modal">
                <div class="caly-header">
                    <div class="caly-title">Renomear Backup</div>
                    <div style="cursor:pointer; padding:8px" id="caly-close">✕</div>
                </div>
                <div class="caly-body">
                    <div class="caly-rename-container">
                        <div style="font-size:13px; color:#94a3b8;">Defina um apelido para este ponto de restauração:</div>
                        <input type="text" class="caly-input" id="caly-rename-input" placeholder="Ex: Antes do Boss Final" value="${currentName || ''}" autocomplete="off">
                        <div style="font-size:11px; color:#64748b;">Deixe em branco para remover o apelido.</div>
                        <div class="caly-buttons-row">
                            <button class="caly-btn secondary" id="caly-cancel-btn">Cancelar</button>
                            <button class="caly-btn" id="caly-save-btn">Salvar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const input = overlay.querySelector('#caly-rename-input');
        const saveBtn = overlay.querySelector('#caly-save-btn');

        setTimeout(() => input.focus(), 100);

        const submit = () => executeRename(folder, input.value);
        saveBtn.onclick = submit;
        overlay.querySelector('#caly-cancel-btn').onclick = showRestoreModal; 
        overlay.querySelector('#caly-close').onclick = removeOverlay;
        input.onkeydown = (e) => { if(e.key === 'Enter') submit(); };
    }

    function showSuccessModal() {
        removeOverlay();
        ensureCalyStyles();

        const overlay = document.createElement('div');
        overlay.className = 'caly-overlay';
        overlay.innerHTML = `
            <div class="caly-modal success">
                <div class="caly-header">
                    <div class="caly-title">Operação Concluída</div>
                    <div style="cursor:pointer; padding:5px" id="caly-close">✕</div>
                </div>
                <div class="caly-body">
                    <div style="padding:40px; text-align:center;">
                        <div class="caly-success-icon">✓</div>
                        <div style="font-size:18px; font-weight:bold; color:#fff; margin-bottom:8px;">Backup Restaurado!</div>
                        <div style="font-size:14px; color:#94a3b8;">Aproveite a viagem no tempo.</div>
                        <button class="caly-btn" id="caly-ok-btn" style="margin-top:25px; width:100%; justify-content:center; background: #22c55e; border-color: #16a34a;">ENTENDIDO</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('#caly-close').onclick = removeOverlay;
        overlay.querySelector('#caly-ok-btn').onclick = removeOverlay;
    }

    async function checkStartupStatus() {
        setTimeout(async () => {
            try {
                const res = await fetch(`${API_URL}/check_restore`);
                const data = await res.json();
                if (data.restored === true) showSuccessModal();
            } catch (e) { }
        }, 1500);
    }

    async function fetchBackups(container) {
        try {
            const res = await fetch(`${API_URL}/list`);
            const backups = await res.json();

            if (!backups || backups.length === 0) {
                container.innerHTML = `<div style="padding:40px; text-align:center; color:#64748b;">Nenhum backup encontrado.</div>`;
                return;
            }

            container.innerHTML = ''; 
            backups.forEach(data => {
                const item = document.createElement('div');
                item.className = 'caly-item';
                
                let folderName = data.folder;
                let nickname = data.nickname;
                let dateStr = folderName.replace('CalyBackup-', '').replace(/_/g, ' ').substring(0, 16).replace(/-/g, '/');
                let mainText = nickname ? nickname : dateStr;
                let subText = nickname ? dateStr : folderName;

                item.innerHTML = `
                    <div class="caly-info">
                        <span class="caly-main-text">${mainText}</span>
                        <span class="caly-sub-text">${subText}</span>
                    </div>
                    <div class="caly-actions">
                        <div class="caly-icon-btn edit" title="Renomear">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        </div>
                        <div class="caly-icon-btn del" title="Apagar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </div>
                        <button class="caly-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                            Restaurar
                        </button>
                    </div>
                `;
                
                const restoreBtn = item.querySelector('.caly-btn');
                const deleteBtn = item.querySelector('.caly-icon-btn.del');
                const editBtn = item.querySelector('.caly-icon-btn.edit');

                restoreBtn.onclick = () => triggerRestore(folderName, restoreBtn);
                deleteBtn.onclick = () => triggerDelete(folderName, item);
                editBtn.onclick = () => showRenameModal(folderName, nickname);

                container.appendChild(item);
            });
        } catch (e) {
            container.innerHTML = `<div style="padding:30px; text-align:center; color:#ef4444">Erro: ${e}</div>`;
        }
    }

    async function executeRename(folder, newName) {
        try {
            const res = await fetch(`${API_URL}/rename`, { 
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ folder: folder, new_name: newName })
            });
            
            if (res.ok) {
                showRestoreModal();
            } else {
                alert("Erro ao renomear.");
            }
        } catch(e) {
            alert("Erro: " + e);
        }
    }

    async function triggerRestore(folder, btnElement) {
        if(!confirm(`Deseja restaurar este backup?\nA Steam irá reiniciar.`)) return;
        btnElement.innerHTML = '⏳';
        btnElement.disabled = true;
        try {
            const response = await fetch(`${API_URL}/restore/${folder}`, { method: 'POST' });
            if (response.ok) {
                const body = document.querySelector('.caly-body');
                if(body) body.innerHTML = `<div style="padding:50px; text-align:center; color:#c4b5fd;">Iniciando Protocolo...</div>`;
            } else {
                alert("Erro no servidor.");
                btnElement.innerHTML = 'RESTAURAR';
                btnElement.disabled = false;
            }
        } catch(e) { alert(e); btnElement.disabled = false; }
    }

    async function triggerDelete(folder, itemElement) {
        if(!confirm(`Apagar permanentemente este backup?`)) return;
        itemElement.style.opacity = '0.5';
        try {
            const response = await fetch(`${API_URL}/delete/${folder}`, { method: 'POST' });
            if (response.ok) {
                itemElement.style.animation = 'calySlideOutRight 0.5s forwards ease-in-out';
                setTimeout(() => {
                    itemElement.remove();
                    const container = document.getElementById('caly-list-container');
                    if(container && container.children.length === 0) fetchBackups(container);
                }, 500);
            } else {
                alert("Erro ao deletar.");
                itemElement.style.opacity = '1';
            }
        } catch(e) { alert(e); itemElement.style.opacity = '1'; }
    }

    setTimeout(createFloatingButton, 1000);
    setTimeout(createFloatingButton, 3000);
    checkStartupStatus();
})();