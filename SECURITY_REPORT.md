# Relatório de Vulnerabilidades — CalyRecall

**Scanner:** Snyk Code  
**Data:** 26/02/2026  
**Severidade Máxima:** CRÍTICA  

---

## Resumo Tático

| Vetor | Qtd. de Achados | Severidade Máxima |
|---|---|---|
| Backend HTTP (`server.py`) | 9 | **CRÍTICA** |
| Frontend DOM (`index.js`) | 3 | **MÉDIA** |

---

## [VULN-01] Path Traversal via URL — `shutil.rmtree`

**Severidade:** CRÍTICA | **CVSS:** ~9.1  
**Arquivo:** `backend/server.py` — Linha 80 (original)  
**Status:** MITIGADO

### Exploração (PoC)

```python
# Payload: POST /delete/../../Windows/System32
backup_name = self.path.replace('/delete/', '')
backup_name = urllib.parse.unquote(backup_name)        # sem sanitização
target_path = os.path.join(BACKUP_ROOT, backup_name)   # path traversal
shutil.rmtree(target_path)                             # deleção arbitrária
```

### Impacto

Destruição de dados no sistema de arquivos do host. Potencial DoS irreversível.

### Remediação Aplicada

```python
backup_name = os.path.basename(urllib.parse.unquote(backup_name))  # strip traversal
target_path = safe_backup_path(backup_name)  # valida confinamento em BACKUP_ROOT
```

---

## [VULN-02] Path Traversal via Body — `open()` / `json.dump()`

**Severidade:** CRÍTICA  
**Arquivo:** `backend/server.py` — Linhas 98–103 (original)  
**Status:** MITIGADO

### Exploração (PoC)

```json
{ "folder": "../../sensitive_dir", "new_name": "pwned" }
```

Leitura e sobrescrita de qualquer arquivo acessível ao processo.

### Remediação Aplicada

```python
folder = os.path.basename(data.get("folder") or "")  # strip traversal
folder_path = safe_backup_path(folder)                # valida confinamento
meta_path = folder_path / "caly_meta.json"            # Path object seguro
```

---

## [VULN-03] Command Injection via variável de ambiente — `subprocess.Popen`

**Severidade:** MÉDIA  
**Arquivo:** `backend/server.py` — Linhas 139–141 (original)  
**Status:** MITIGADO

### Exploração (PoC)

```python
# %TEMP% controlável por atacante com acesso local
temp_bat = os.path.join(os.environ["TEMP"], "caly_restore.bat")
subprocess.Popen([temp_bat], ...)  # executa arquivo plantado
```

### Remediação Aplicada

```python
temp_dir = tempfile.mkdtemp(prefix="caly_")   # diretório isolado e único
temp_bat = os.path.join(temp_dir, "caly_restore.bat")
```

---

## [VULN-04] CORS Wildcard (`Access-Control-Allow-Origin: *`)

**Severidade:** MÉDIA  
**Arquivo:** `backend/server.py` — 6 ocorrências  
**Status:** MITIGADO

### Exploração (PoC)

Página maliciosa aberta no browser acessa `http://localhost:9999` via fetch —
CSRF implícito permitindo listar, restaurar, deletar e renomear backups.

### Remediação Aplicada

```python
_ALLOWED_ORIGINS = {
    'https://store.steampowered.com',
    'https://steamcommunity.com',
    'https://cdn.akamai.steamstatic.com',
    'https://shared.akamai.steamstatic.com',
    'https://steamloopback.host',
    'http://steamloopback.host',
}

def _cors_origin(headers) -> str:
    origin = headers.get('Origin', '')
    if not origin:   return '*'      # cliente local sem CORS
    if origin == 'null': return 'null'  # CEF Millennium injection
    return origin if origin in _ALLOWED_ORIGINS else ''
```

---

## [VULN-05] DOM-based XSS — `innerHTML` com dados não sanitizados

**Severidade:** MÉDIA  
**Arquivo:** `public/index.js` — 3 ocorrências  
**Status:** MITIGADO

### Exploração (PoC)

```javascript
// API retorna nickname: "<img src=x onerror=alert(1)>"
item.innerHTML = `<span>${mainText}</span>`;  // executa o script
```

### Remediação Aplicada

```javascript
// Estrutura estática no innerHTML — zero dados remotos
item.innerHTML = `<div class="caly-info"><span class="caly-main-text"></span>...</div>`;
// Dados injetados via textContent — impossível executar HTML
item.querySelector('.caly-main-text').textContent = mainText;
item.querySelector('.caly-sub-text').textContent = subText;
// Imagem via DOM API — src nunca passa por parser HTML
const img = document.createElement('img');
img.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_sm_120.jpg`;
```

---

## Análise SWOT de Segurança

| | |
|---|---|
| **Forças** | Servidor HTTP bind em `127.0.0.1`. `os.path.basename()` + `safe_backup_path()` em dupla camada. CORS restrito a origens Steam. |
| **Fraquezas** | FAB (floating action button) com bug de renderização ainda não resolvido. |
| **Oportunidades** | Superfície de ataque pequena. Todas as correções são localizadas. |
| **Ameaças** | Plugin roda com privilégios do processo Steam. Investigação do bug do FAB pendente. |

---

## Prioridade de Correção

| # | Vulnerabilidade | Status |
|---|---|---|
| 1 | VULN-01 / VULN-02 — Path Traversal | ✅ Mitigado |
| 2 | VULN-03 — Command Injection | ✅ Mitigado |
| 3 | VULN-05 — DOM XSS | ✅ Mitigado |
| 4 | VULN-04 — CORS Wildcard | ✅ Mitigado |
| 5 | FAB não renderiza na Steam UI | ⚠️ Pendente |
