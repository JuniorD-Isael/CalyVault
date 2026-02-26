# CalyRecall — Documentação Técnica

> **Versão:** 1.0.1  
> **Autor:** BruxinCore, JuniorD-Isael  
> **Plataforma:** Windows · Steam + Millennium Framework  
> **Licença:** Ver `license`

---

## Sumário

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Referência dos Módulos](#referência-dos-módulos)
   - [backend/config.py](#backendconfigpy)
   - [backend/main.py](#backendmainpy)
   - [backend/monitor.py](#backendmonitorpy)
   - [backend/server.py](#backendserverpy)
   - [backend/ui.py](#backenduipy)
   - [public/index.js](#publicindexjs)
5. [Referência da API REST](#referência-da-api-rest)
6. [Modelo de Segurança](#modelo-de-segurança)
7. [Rotação de Backups](#rotação-de-backups)
8. [Referência de Configuração](#referência-de-configuração)
9. [Fluxo de Interação do Frontend](#fluxo-de-interação-do-frontend)
10. [Manifesto do Plugin](#manifesto-do-plugin)
11. [Problemas Conhecidos](#problemas-conhecidos)

---

## Visão Geral

CalyRecall é um **plugin para o Millennium** que realiza backup automático dos dados de jogos do Steam sempre que uma sessão de jogo é encerrada. Ele monitora o registro do Windows pela chave `RunningAppID` do Steam, detecta quando um jogo é fechado e copia os diretórios relevantes de userdata para uma pasta de backup com timestamp.

Uma API HTTP mínima (vinculada a `127.0.0.1:9999`) serve a lista de backups e operações de restauração para uma interface injetada pelo framework Millennium no CEF do Steam (Chromium Embedded Framework).

### Funcionalidades Principais

| Funcionalidade | Descrição |
|---|---|
| Backup automático | Disparado ao fechar um jogo via polling do registro |
| Rotação de backups | Mantém no máximo `MAX_BACKUPS` snapshots, deletando o mais antigo |
| Restauração com um clique | Para o Steam, restaura os arquivos via xcopy e reinicia o Steam |
| Detecção de restauração | Grava um arquivo sentinela para a interface exibir confirmação pós-restauração |
| Renomear / Deletar | Endpoints de API para gerenciar backups individuais pela interface |
| Notificação toast | Toast nativo do Windows via PowerShell ao concluir um backup |

---

## Arquitetura

```
+---------------------------+
|   Steam CEF (Chromium)    |
|   public/index.js         |  ← injetado pelo Millennium
|   (FAB + Interface Modal) |
+------------+--------------+
             | HTTP (localhost:9999)
+------------v--------------+
|   backend/server.py       |  ← CalyRequestHandler / HTTPServer
|   API REST                |
+--------+------------------+
         |
+--------v-------+   +------------------+
| monitor.py     |   | ui.py            |
| BackupManager  |   | show_notification|
| (thread daemon)|   | (toast PowerShell|
+--------+-------+   +------------------+
         |
+--------v-------+
| config.py      |
| STEAM_PATH     |
| BACKUP_ROOT    |
| BACKUP_TARGETS |
| MAX_BACKUPS    |
+----------------+
```

### Fluxo de Requisição / Resposta

```
Usuário clica em "Restaurar" no modal do FAB
   │
   └─► POST /restore/<name>  (index.js)
            │
            └─► CalyRequestHandler.do_POST  (server.py)
                     │
                     └─► threading.Thread → trigger_external_restore()
                                  │
                                  └─► grava caly_restore.bat → subprocess.Popen
                                            │
                                            └─► bat: taskkill steam → xcopy → flag → steam.exe
```

---

## Estrutura do Projeto

```
CalyRecall/
├── plugin.json            # Manifesto do plugin Millennium
├── requirements.txt       # Vazio — exigido pelo PIPX do Millennium (sem deps de terceiros)
├── package.json           # Stub Node — usado pelo Snyk para análise JS
├── DOCS.md                # Documentação técnica (inglês)
├── DOCS.pt-BR.md          # Este arquivo
├── SECURITY_REPORT.md     # Relatório de pentest
├── license
├── log.txt                # Saída do scan Snyk
├── README.md
├── backend/
│   ├── config.py          # Configuração centralizada e resolução de caminhos
│   ├── main.py            # Ponto de entrada do plugin Millennium (classe Plugin)
│   ├── monitor.py         # Daemon de backup com polling do registro
│   ├── server.py          # Servidor REST HTTP
│   ├── ui.py              # Helper de notificação toast do Windows
│   └── user_config.json   # Preferências do usuário em runtime (não versionado)
└── public/
    └── index.js           # Frontend injetado no CEF (FAB + modais)
```

---

## Referência dos Módulos

---

### backend/config.py

**Propósito:** Configuração centralizada. Lê o caminho de instalação do Steam no registro do Windows e deriva todos os outros caminhos a partir dele. Importado por todos os outros módulos do backend.

#### Funções

##### `get_steam_path() -> str`

Consulta `HKEY_CURRENT_USER\Software\Valve\Steam` → `SteamPath`, normaliza separadores de diretório para barras invertidas. Retorna `os.getcwd()` como fallback se a chave estiver ausente.

#### Constantes

| Constante | Tipo | Descrição |
|---|---|---|
| `STEAM_PATH` | `str` | Caminho absoluto para o diretório de instalação do Steam |
| `BACKUP_ROOT` | `str` | `<STEAM_PATH>\millennium\backups` — diretório raiz de todos os snapshots do CalyRecall |
| `MAX_BACKUPS` | `int` | Número máximo de snapshots a reter (padrão `4`) |
| `BACKUP_TARGETS` | `list[dict]` | Lista de dicts `{src, name}` descrevendo quais diretórios incluir em cada backup |
| `UI_THEME` | `dict` | Constantes visuais (`title`, `bg`, `accent`) consumidas pela camada de UI |

#### Detalhamento de BACKUP_TARGETS

| Chave `name` | Caminho de origem |
|---|---|
| `userdata` | `<STEAM_PATH>\userdata` |
| `appcache_stats` | `<STEAM_PATH>\appcache\stats` |
| `depotcache` | `<STEAM_PATH>\depotcache` |
| `stplug-in` | `<STEAM_PATH>\config\stplug-in` |

---

### backend/main.py

**Propósito:** Ponto de entrada do plugin Millennium. O Millennium auto-descobre `backend/main.py` e instancia a classe `Plugin`.

#### Classe `Plugin`

| Método | Descrição |
|---|---|
| `__init__()` | Inicializa `self.monitor = None` |
| `_load()` | Chamado pelo Millennium na ativação do plugin. Cria uma thread daemon `BackupManager`, inicia-a e chama `Millennium.ready()` para sinalizar prontidão |
| `_unload()` | Chamado pelo Millennium na desativação do plugin. Para a thread de monitoramento de forma graciosa |

**Nível de módulo:** `plugin = Plugin()` — exigido pelo loader do Millennium.

---

### backend/monitor.py

**Propósito:** Faz polling do registro do Windows a cada 2 segundos para detectar o estado do jogo Steam em execução. Quando um jogo transita de ativo para encerrado (`RunningAppID` vai a `0`), aguarda 5 segundos para os arquivos serem liberados e então realiza um backup.

#### Classe `BackupManager(threading.Thread)`

Executa como thread daemon (`daemon=True`), sendo encerrada automaticamente quando o processo principal termina.

##### Atributos

| Atributo | Tipo | Descrição |
|---|---|---|
| `running` | `bool` | Flag de controle do loop; setado para `False` por `stop()` |
| `last_appid` | `int` | App ID do jogo mais recentemente ativo |
| `was_running` | `bool` | `True` enquanto um jogo com `RunningAppID` não-zero está ativo |

##### Métodos

###### `get_running_appid() -> int`

Lê `HKEY_CURRENT_USER\Software\Valve\Steam` → `RunningAppID`. Retorna `0` em caso de qualquer erro.

###### `rotate_backups()`

Aplica o limite `MAX_BACKUPS` antes de criar um novo snapshot.

**Algoritmo:**
1. Lista todos os diretórios em `BACKUP_ROOT` cujos nomes iniciam com `"CalyBackup"`.
2. Ordena as entradas lexicograficamente (o formato de timestamp `YYYY-MM-DD_HH-MM-SS` garante ordem cronológica).
3. Enquanto `len(entries) >= MAX_BACKUPS`: deleta a primeira entrada (mais antiga) via `shutil.rmtree`.

###### `perform_backup(appid: int)`

1. Chama `rotate_backups()`.
2. Gera uma pasta com timestamp: `CalyBackup-YYYY-MM-DD_HH-MM-SS`.
3. Itera sobre `BACKUP_TARGETS`, copiando cada origem para a pasta de destino via `shutil.copytree` (diretórios) ou `shutil.copy2` (arquivos).
4. Com pelo menos uma cópia bem-sucedida, dispara uma notificação toast do Windows.

###### `stop()`

Define `self.running = False`, fazendo o loop de polling encerrar na próxima iteração.

###### `run()`

Loop principal (intervalo de 2 segundos):

```
current_appid = get_running_appid()

if was_running and current_appid == 0:
    sleep(5)
    perform_backup(last_appid)
    was_running = False
elif current_appid > 0:
    was_running = True
    last_appid = current_appid

sleep(2)
```

---

### backend/server.py

**Propósito:** Servidor HTTP mínimo vinculado a `127.0.0.1:9999`. Expõe a API REST consumida pelo frontend. Todos os controles de segurança (CORS, prevenção de Path Traversal, criação segura de diretório temporário) são implementados aqui.

#### Definições em Nível de Módulo

##### `_ALLOWED_ORIGINS: set[str]`

Lista de permissões CORS. Apenas estas origens recebem o header `Access-Control-Allow-Origin`:

```
https://store.steampowered.com
https://steamcommunity.com
https://cdn.akamai.steamstatic.com
https://shared.akamai.steamstatic.com
https://steamloopback.host
http://steamloopback.host
```

##### `_cors_origin(headers) -> str`

Resolve o valor correto para `Access-Control-Allow-Origin` com base nos headers da requisição.

| `Origin` recebido | Valor retornado | Justificativa |
|---|---|---|
| *(ausente)* | `''` | Não é requisição browser cross-origin; header não deve ser enviado |
| `'null'` | `'null'` | Contexto de injeção CEF do Millennium |
| Na `_ALLOWED_ORIGINS` | A própria string da origem | Match explícito na lista de permissões |
| Qualquer outra coisa | `''` | Origem desconhecida; header não enviado → browser bloqueia a resposta |

##### `safe_backup_path(name: str) -> pathlib.Path`

Proteção contra Path Traversal. Resolve o caminho absoluto completo de `BACKUP_ROOT / name` e verifica que ele ainda está contido em `BACKUP_ROOT` usando `Path.relative_to()`. Lança `ValueError` se o caminho resolvido escapar da raiz (ex: via sequências `../`).

Adicionalmente, todos os métodos de handler HTTP chamam `os.path.basename()` sobre o nome decodificado de URL antes de passá-lo para esta função, cortando a cadeia de taint no ponto mais cedo possível.

#### Classe `CalyRequestHandler(BaseHTTPRequestHandler)`

##### `do_OPTIONS()`

Responde a requisições de preflight CORS. Define `Access-Control-Allow-Methods` e `Access-Control-Allow-Headers`. Só adiciona `Access-Control-Allow-Origin` se `_cors_origin()` retornar uma string não vazia.

##### `do_GET()`

| Caminho | Ação |
|---|---|
| `/check_restore` | Retorna `{"restored": true/false}`. Lê e deleta `restore_success.flag` se presente |
| `/list` | Retorna array JSON de objetos de backup (ver [GET /list](#get-list)) |
| *(qualquer outro)* | `404` |

##### `do_POST()`

| Padrão de caminho | Ação |
|---|---|
| `/restore/<name>` | Valida o nome, responde `{"status": "accepted"}`, passa `trigger_external_restore` para uma thread daemon |
| `/delete/<name>` | Valida o nome, remove o diretório de backup com `shutil.rmtree` |
| `/rename` | Lê body JSON `{folder, new_name}`, atualiza `caly_meta.json` dentro da pasta de backup |

##### `log_message()`

Sobrescrito para suprimir todos os logs de acesso HTTP no stdout.

#### `trigger_external_restore(backup_folder_name: str)`

Gera e executa um script `.bat` em um diretório temporário seguro (criado via `tempfile.mkdtemp(prefix="caly_")`). O script:

1. Aguarda 3 segundos.
2. Encerra `steam.exe` via `taskkill /F`.
3. Aguarda mais 2 segundos para os handles serem liberados.
4. Usa `xcopy` para restaurar os quatro targets de backup de volta aos seus locais originais no Steam.
5. Grava `restore_success.flag` em `BACKUP_ROOT`.
6. Reinicia o Steam.
7. Auto-deleta via `(goto) 2>nul & del "%~f0"`.

O script é lançado com `subprocess.Popen(..., creationflags=CREATE_NEW_CONSOLE)` para que persista após o processo Python ter sido encerrado (o reinício do Steam termina o processo pai).

#### `start_server()`

Vincula `HTTPServer` a `('127.0.0.1', SERVER_PORT)` e chama `serve_forever()`. O isolamento TCP ao loopback impede qualquer acesso de rede externo independentemente da configuração CORS.

---

### backend/ui.py

**Propósito:** Envia uma notificação toast nativa do Windows usando a API WinRT `ToastNotificationManager` via script PowerShell inline.

#### `show_notification(title: str, message: str)`

Cria uma thread daemon que executa um one-liner PowerShell. Usa `creationflags=0x08000000` (`CREATE_NO_WINDOW`) para suprimir a janela do console do PowerShell. Erros são capturados e logados no stdout; não propagam para cima.

> **Nota:** O script PowerShell depende dos tipos WinRT `[Windows.UI.Notifications.*]`. Estes estão disponíveis no Windows 10/11 sem dependências adicionais.

---

### public/index.js

**Propósito:** Módulo auto-invocado injetado no CEF do Steam pelo Millennium. Cria um Botão de Ação Flutuante (FAB) na interface do cliente Steam. Clicar no FAB abre um modal que lista os backups disponíveis com ações de restaurar, deletar e renomear.

O módulo inteiro é envolto em uma IIFE (`(function() { 'use strict'; ... })()`) para evitar poluir o escopo global.

#### Constantes

| Constante | Valor | Descrição |
|---|---|---|
| `API_URL` | `"http://localhost:9999"` | URL base para todas as chamadas à API do backend |

#### Funções

##### `sanitize(str) -> string`

Proteção contra XSS. Cria um `<div>` desanexado, define seu `textContent` com a string de entrada (que o browser escapa), então lê de volta o `innerHTML` para obter a representação HTML-codificada segura. Retorna string vazia para entradas `null` ou `undefined`.

##### `ensureCalyStyles()`

Injeta o bloco `<style id="caly-styles">` no `document.head` exatamente uma vez. Contém todo o CSS para o FAB, overlay, modal, itens da lista, botões e animações.

##### `createFloatingButton()`

Cria o elemento `#caly-fab` e o adiciona ao `document.body`. Protege contra criação duplicada com `document.getElementById('caly-fab')`. Chamado duas vezes via `setTimeout` (em 1 s e 3 s) para lidar com condições de corrida com a disponibilidade do DOM.

##### `removeOverlay()`

Remove qualquer elemento correspondente a `.caly-overlay` do DOM.

##### `showRestoreModal()`

Cria o overlay principal de lista de backups, adiciona ao `document.body` e chama `fetchBackups()` para popular o container da lista.

##### `showRenameModal(folder: string, currentName: string)`

Cria o overlay de renomeação com um input de texto pré-preenchido com `currentName`. Submete via `executeRename()`.

##### `showSuccessModal()`

Cria o overlay de sucesso pós-restauração com modal em tema verde e botão "ENTENDIDO" para dispensar.

##### `checkStartupStatus()`

Chamada uma vez no carregamento. Após 1,5 segundo de delay, chama `GET /check_restore`. Se o servidor retornar `restored: true`, exibe `showSuccessModal()`.

##### `fetchBackups(container: HTMLElement)`

Busca `GET /list` e renderiza cada backup como elemento `.caly-item`.

**Padrão de segurança:**
- O esqueleto HTML estático é definido via `item.innerHTML` (sem dados remotos).
- `mainText` e `subText` (dados remotos) são atribuídos via `.textContent` — o browser os trata como texto puro, tornando XSS impossível.
- A `<img>` da capa do jogo é construída via `document.createElement('img')` com `img.src` definido diretamente — o valor de `src` nunca passa por `innerHTML`.
- `appid` é validado contra `/^\d+$/` antes de ser usado como parte de uma URL.

##### `executeRename(folder: string, newName: string)`

Envia `{ folder, new_name }` para `POST /rename`. Em caso de sucesso, atualiza o modal chamando `showRestoreModal()`.

##### `triggerRestore(folder: string, btnElement: HTMLElement)`

Envia para `POST /restore/<folder>` após um prompt `confirm()`. Desabilita o botão durante a requisição para evitar dupla submissão.

##### `triggerDelete(folder: string, itemElement: HTMLElement)`

Envia para `POST /delete/<folder>` após um prompt `confirm()`. Em caso de sucesso, anima a saída do item com `calySlideOutRight` e o remove do DOM.

---

## Referência da API REST

**URL Base:** `http://127.0.0.1:9999`

Todos os endpoints são acessíveis apenas de `127.0.0.1` (loopback TCP). Respostas são JSON salvo quando um código de erro 4xx/5xx é retornado.

---

### `GET /list`

Retorna a lista de backups disponíveis em ordem cronológica reversa.

**Resposta:** `200 OK`

```json
[
  {
    "folder": "CalyBackup-2025-06-15_22-30-00",
    "nickname": "Antes do Boss Final",
    "game_name": "Elden Ring",
    "appid": 1245620
  }
]
```

| Campo | Tipo | Descrição |
|---|---|---|
| `folder` | `string` | Nome do diretório em `BACKUP_ROOT` |
| `nickname` | `string \| null` | Apelido definido pelo usuário armazenado em `caly_meta.json` |
| `game_name` | `string \| null` | Nome do jogo obtido de `caly_meta.json` |
| `appid` | `number \| null` | Steam App ID (usado para buscar a capa do jogo) |

---

### `GET /check_restore`

Verifica se uma operação de restauração foi concluída com sucesso desde a última consulta.

**Resposta:** `200 OK`

```json
{ "restored": true }
```

Efeito colateral: deleta `restore_success.flag` de `BACKUP_ROOT` se presente (leitura única).

---

### `POST /restore/<name>`

Inicia uma restauração assíncrona do backup nomeado. A resposta HTTP é retornada imediatamente; a restauração real executa em uma thread em segundo plano.

**Parâmetro de URL:** `name` — nome da pasta de backup (URL-encoded).

**Validação:**
- `os.path.basename()` remove quaisquer separadores de caminho do nome decodificado.
- `safe_backup_path()` verifica que o caminho resolvido está dentro de `BACKUP_ROOT`.

**Resposta:** `200 OK`

```json
{ "status": "accepted" }
```

**Respostas de erro:**

| Código | Condição |
|---|---|
| `400` | Path Traversal detectado |

---

### `POST /delete/<name>`

Deleta permanentemente um diretório de backup.

**Parâmetro de URL:** `name` — nome da pasta de backup (URL-encoded).

**Validação:** Igual a `/restore/<name>`.

**Resposta:** `200 OK`

```json
{ "status": "deleted" }
```

**Respostas de erro:**

| Código | Condição |
|---|---|
| `400` | Path Traversal detectado |
| `404` | Diretório de backup não encontrado |
| `500` | Erro de sistema de arquivos durante a deleção |

---

### `POST /rename`

Atualiza o campo `nickname` em `caly_meta.json` para um dado backup.

**Corpo da requisição:**

```json
{ "folder": "CalyBackup-2025-06-15_22-30-00", "new_name": "Pré-DLC" }
```

**Validação:** `os.path.basename()` é aplicado a `folder`, então `safe_backup_path()` verifica o confinamento.

**Resposta:** `200 OK`

```json
{ "status": "renamed" }
```

**Respostas de erro:**

| Código | Condição |
|---|---|
| `400` | Path Traversal detectado ou nome de pasta vazio |
| `500` | Erro de parse JSON ou falha de escrita no sistema de arquivos |

---

### `OPTIONS *`

Trata requisições de preflight CORS. Retorna `200 OK` com:

```
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: X-Requested-With, Content-Type
Access-Control-Allow-Origin: <origem na lista de permissões ou ausente>
```

---

## Modelo de Segurança

### Política CORS

O servidor implementa uma **lista de permissões de origens explícita**, não um wildcard. A função `_cors_origin()` é o ponto único de controle:

- Se `Origin` está ausente (clientes não-browser, chamadas diretas à API): o header CORS **não é enviado** — irrelevante para clientes não-browser.
- Se `Origin: null` (injeção CEF do Millennium): `Access-Control-Allow-Origin: null` é enviado.
- Se a origem está em `_ALLOWED_ORIGINS`: a origem é refletida.
- Para todas as outras origens: o header CORS não é enviado, fazendo o browser bloquear a resposta.

### Prevenção de Path Traversal

Duas camadas independentes protegem todas as operações de sistema de arquivos:

1. **`os.path.basename()`** — aplicado ao nome decodificado de URL na fronteira do handler HTTP. Remove quaisquer componentes de diretório (ex: `../../etc/passwd` → `passwd`).
2. **`safe_backup_path()`** — resolve o caminho completo e verifica que permanece sob `BACKUP_ROOT` usando `Path.relative_to()`. Lança `ValueError` → `400 Bad Request` se violado.

### Prevenção de Injeção de Comandos

O arquivo `.bat` de restauração é gravado em um diretório criado por **`tempfile.mkdtemp(prefix="caly_")`**, que gera um caminho temporário imprevisível gerenciado pelo SO. Isso elimina qualquer possibilidade de injetar um caminho manipulado através da variável de ambiente `%TEMP%`.

### Prevenção de DOM XSS

Todos os dados remotos renderizados na interface são tratados por um dos três padrões seguros:

| Tipo de dado | Método seguro |
|---|---|
| Conteúdo de texto (nomes, datas) | `element.textContent = value` |
| Estrutura HTML | Literal estático apenas — nenhum dado remoto em `innerHTML` |
| Fontes de imagem | `img.src = value` (propriedade DOM, não atributo via innerHTML) |
| App IDs | Validados contra `/^\d+$/` antes de interpolação em URL |

O helper `sanitize()` oferece um utilitário adicional de escape usando o próprio parser HTML do browser.

---

## Rotação de Backups

A rotação é aplicada em `BackupManager.rotate_backups()`, chamado no início de cada invocação de `perform_backup()`.

**Gatilho:** `len(entries) >= MAX_BACKUPS`

**Ordenação:** Ordenação lexicográfica dos nomes de pasta. Como o formato de timestamp é `YYYY-MM-DD_HH-MM-SS`, a ordem lexicográfica é idêntica à ordem cronológica. A entrada no índice `0` é sempre a mais antiga.

**Efeito:** As entradas mais antigas são removidas via `shutil.rmtree(ignore_errors=True)` até que `len(entries) < MAX_BACKUPS`, abrindo espaço para o novo snapshot.

**Exemplo com `MAX_BACKUPS = 4`:**

```
Antes do backup:
  CalyBackup-2025-06-10_20-00-00  (mais antigo)
  CalyBackup-2025-06-12_18-30-00
  CalyBackup-2025-06-14_09-15-00
  CalyBackup-2025-06-15_22-30-00

rotate_backups() deleta: CalyBackup-2025-06-10_20-00-00

Após perform_backup():
  CalyBackup-2025-06-12_18-30-00
  CalyBackup-2025-06-14_09-15-00
  CalyBackup-2025-06-15_22-30-00
  CalyBackup-2025-06-16_11-00-00  (novo)
```

---

## Referência de Configuração

Toda configuração está em `backend/config.py`. Para alterar as configurações, edite o arquivo e reinicie o plugin.

| Variável | Padrão | Como alterar |
|---|---|---|
| `MAX_BACKUPS` | `4` | Edite `MAX_BACKUPS = N` em `config.py` |
| `BACKUP_ROOT` | `<STEAM_PATH>\millennium\backups` | Derivado de `STEAM_PATH`; altere `BACKUP_ROOT` diretamente se necessário |
| `BACKUP_TARGETS` | 4 subdiretórios do Steam | Adicione/remova dicts na lista `BACKUP_TARGETS` |
| `SERVER_PORT` | Definido em `config.py` | Altere o valor e certifique-se de que nada mais usa a porta |

---

## Fluxo de Interação do Frontend

```
Steam CEF carrega public/index.js
         │
         ├─► setTimeout(createFloatingButton, 1000)
         ├─► setTimeout(createFloatingButton, 3000)
         └─► checkStartupStatus()
                  │
                  └─► GET /check_restore (após 1,5 s)
                           │
                      restored=true ──► showSuccessModal()
                      restored=false ──► (sem ação)

Usuário clica no FAB (#caly-fab)
         │
         └─► showRestoreModal()
                  │
                  └─► GET /list
                           │
                           └─► renderiza lista de .caly-item
                                    │
                          ┌─────────┼─────────┐
                          │         │         │
                     Restaurar   Renomear   Apagar
                          │         │         │
                  POST /restore  POST /rename  POST /delete
```

---

## Manifesto do Plugin

`plugin.json` é lido pelo framework Millennium no carregamento.

```json
{
  "name": "calyrecall",
  "common_name": "CalyRecall",
  "description": "Backup automatizado de Userdata, Stats e Configs ao fechar jogos.",
  "author": "BruxinCore, JuniorD-Isael",
  "version": "1.0.1"
}
```

| Campo | Descrição |
|---|---|
| `name` | Identificador interno do plugin (minúsculas, sem espaços) |
| `common_name` | Nome de exibição mostrado no gerenciador de plugins do Millennium |
| `description` | Descrição curta exibida na lista de plugins |
| `author` | Lista de contribuidores separada por vírgula |
| `version` | String de versão semântica |

> **Importante:** Não adicione o campo `"frontend"`. O Millennium auto-injeta `public/index.js` com base em suas próprias convenções. Adicionar `"frontend"` com um caminho customizado causa comportamento inesperado no loader.

---

## Problemas Conhecidos

### FAB Não Aparece na Interface do Steam

**Status:** Em investigação.

**Sintoma:** O elemento `#caly-fab` é criado com sucesso (confirmado pela atividade do backend) mas não fica visível na janela do cliente Steam.

**Causa raiz identificada até o momento:** Um `requirements.txt` anterior com linhas de comentário fazia o PIPX do Millennium falhar com `Invalid requirement` em cada linha de comentário, impedindo o carregamento do backend do plugin. Após esvaziar o `requirements.txt`, o backend carrega corretamente e as operações de backup funcionam.

**Problema remanescente:** Mesmo com o backend funcional e o `setTimeout(createFloatingButton, ...)` executando, o FAB não é renderizado visivelmente. Possíveis causas:
- A página CEF onde `index.js` é injetado não possui um `document.body` persistente no estado esperado.
- CSS `z-index` ou o próprio compositor de overlay do Steam recorta o elemento.
- O timing de injeção do Millennium difere entre versões do Steam.

**Solução alternativa:** Nenhuma confirmada. Use a API do backend diretamente em `http://localhost:9999/list` para inspecionar o estado dos backups.
