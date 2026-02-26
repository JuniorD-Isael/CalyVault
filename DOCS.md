# CalyRecall — Technical Documentation

> **Version:** 1.0.1  
> **Author:** BruxinCore, JuniorD-Isael  
> **Platform:** Windows · Steam + Millennium Framework  
> **License:** See `license`

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Module Reference](#module-reference)
   - [backend/config.py](#backendconfigpy)
   - [backend/main.py](#backendmainpy)
   - [backend/monitor.py](#backendmonitorpy)
   - [backend/server.py](#backendserverpy)
   - [backend/ui.py](#backenduipy)
   - [public/index.js](#publicindexjs)
5. [REST API Reference](#rest-api-reference)
6. [Security Model](#security-model)
7. [Backup Rotation](#backup-rotation)
8. [Configuration Reference](#configuration-reference)
9. [Frontend Interaction Flow](#frontend-interaction-flow)
10. [Plugin Manifest](#plugin-manifest)
11. [Known Issues](#known-issues)

---

## Overview

CalyRecall is a **Millennium plugin** that automatically backs up Steam game data whenever a game session ends. It monitors the Windows registry for the Steam `RunningAppID` key, detects when a game closes, and copies the relevant userdata directories to a timestamped backup folder.

A minimal HTTP API (bound to `127.0.0.1:9999`) serves the backup list and restore operations to an in-client UI injected by the Millennium framework into the Steam CEF (Chromium Embedded Framework).

### Core Features

| Feature | Description |
|---|---|
| Automatic backup | Triggered on game close via registry polling |
| Backup rotation | Maintains at most `MAX_BACKUPS` snapshots, deleting the oldest |
| One-click restore | Stops Steam, xcopy-restores files, restarts Steam |
| Restore detection | Flags a sentinel file so the UI can greet the user post-restore |
| Rename/delete | API endpoints to manage individual backups from the UI |
| Toast notification | Native Windows toast via PowerShell on backup completion |

---

## Architecture

```
+---------------------------+
|   Steam CEF (Chromium)    |
|   public/index.js         |  ← injected by Millennium
|   (FAB + Modal UI)        |
+------------+--------------+
             | HTTP (localhost:9999)
+------------v--------------+
|   backend/server.py       |  ← CalyRequestHandler / HTTPServer
|   REST API                |
+--------+------------------+
         |
+--------v-------+   +------------------+
| monitor.py     |   | ui.py            |
| BackupManager  |   | show_notification|
| (daemon thread)|   | (PowerShell toast|
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

### Request / Response Flow

```
User clicks "Restaurar" in FAB modal
   │
   └─► POST /restore/<name>  (index.js)
            │
            └─► CalyRequestHandler.do_POST  (server.py)
                     │
                     └─► threading.Thread → trigger_external_restore()
                                  │
                                  └─► writes caly_restore.bat → subprocess.Popen
                                            │
                                            └─► bat: taskkill steam → xcopy → flag → steam.exe
```

---

## Project Structure

```
CalyRecall/
├── plugin.json            # Millennium plugin manifest
├── requirements.txt       # Empty — required by Millennium PIPX (no third-party deps)
├── package.json           # Node package stub — used by Snyk for JS analysis
├── DOCS.md                # This file
├── SECURITY_REPORT.md     # Penetration test report
├── license
├── log.txt                # Snyk scan output
├── README.md
├── backend/
│   ├── config.py          # Centralised configuration and path resolution
│   ├── main.py            # Millennium plugin entry point (Plugin class)
│   ├── monitor.py         # Registry-polling backup daemon
│   ├── server.py          # HTTP REST server
│   ├── ui.py              # Windows toast notification helper
│   └── user_config.json   # Runtime user preferences (not in VCS)
└── public/
    └── index.js           # CEF-injected frontend (FAB + modals)
```

---

## Module Reference

---

### backend/config.py

**Purpose:** Centralised configuration. Reads the Steam installation path from the Windows registry and derives all other paths from it. Imported by every other backend module.

#### Functions

##### `get_steam_path() -> str`

Queries `HKEY_CURRENT_USER\Software\Valve\Steam` → `SteamPath`, normalises directory separators to backslashes. Returns `os.getcwd()` as fallback if the key is absent.

#### Constants

| Constant | Type | Description |
|---|---|---|
| `STEAM_PATH` | `str` | Absolute path to the Steam installation directory |
| `BACKUP_ROOT` | `str` | `<STEAM_PATH>\millennium\backups` — root directory for all CalyRecall snapshots |
| `MAX_BACKUPS` | `int` | Maximum number of backup snapshots to retain (default `4`) |
| `BACKUP_TARGETS` | `list[dict]` | List of `{src, name}` dicts describing which directories to include in each backup |
| `UI_THEME` | `dict` | Display constants (`title`, `bg`, `accent`) consumed by the UI layer |

#### BACKUP_TARGETS Detail

| `name` key | Source path |
|---|---|
| `userdata` | `<STEAM_PATH>\userdata` |
| `appcache_stats` | `<STEAM_PATH>\appcache\stats` |
| `depotcache` | `<STEAM_PATH>\depotcache` |
| `stplug-in` | `<STEAM_PATH>\config\stplug-in` |

---

### backend/main.py

**Purpose:** Millennium plugin entry point. Millennium auto-discovers `backend/main.py` and instantiates the `Plugin` class.

#### Class `Plugin`

| Method | Description |
|---|---|
| `__init__()` | Initialises `self.monitor = None` |
| `_load()` | Called by Millennium on plugin activation. Creates a `BackupManager` daemon thread and starts it, then calls `Millennium.ready()` to signal readiness |
| `_unload()` | Called by Millennium on plugin deactivation. Stops the monitor thread gracefully |

**Module-level:** `plugin = Plugin()` — required by the Millennium loader.

---

### backend/monitor.py

**Purpose:** Polls the Windows registry every 2 seconds to detect the state of the currently running Steam game. When a game transitions from running to closed (`RunningAppID` drops to `0`), it waits 5 seconds for files to flush, then performs a backup.

#### Class `BackupManager(threading.Thread)`

Runs as a daemon thread (`daemon=True`) so it is automatically terminated when the main process exits.

##### Attributes

| Attribute | Type | Description |
|---|---|---|
| `running` | `bool` | Loop control flag; set to `False` by `stop()` |
| `last_appid` | `int` | App ID of the most recently active game |
| `was_running` | `bool` | `True` while a game with a non-zero `RunningAppID` is active |

##### Methods

###### `get_running_appid() -> int`

Reads `HKEY_CURRENT_USER\Software\Valve\Steam` → `RunningAppID`. Returns `0` on any error.

###### `rotate_backups()`

Enforces the `MAX_BACKUPS` limit before a new snapshot is created.

**Algorithm:**
1. Lists all directories under `BACKUP_ROOT` whose names start with `"CalyBackup"`.
2. Sorts entries lexicographically (timestamp format `YYYY-MM-DD_HH-MM-SS` guarantees chronological order).
3. While `len(entries) >= MAX_BACKUPS`: deletes the first (oldest) entry via `shutil.rmtree`.

###### `perform_backup(appid: int)`

1. Calls `rotate_backups()`.
2. Generates a timestamped folder: `CalyBackup-YYYY-MM-DD_HH-MM-SS`.
3. Iterates over `BACKUP_TARGETS`, copying each source to the destination folder using `shutil.copytree` (directories) or `shutil.copy2` (files).
4. On at least one successful copy, triggers a Windows toast notification.

###### `stop()`

Sets `self.running = False`, causing the polling loop to exit on the next iteration.

###### `run()`

Main loop (2-second poll interval):

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

**Purpose:** Minimal HTTP server bound to `127.0.0.1:9999`. Exposes the REST API consumed by the frontend. All security controls (CORS, path traversal prevention, safe temp dir creation) are implemented here.

#### Module-level Definitions

##### `_ALLOWED_ORIGINS: set[str]`

CORS whitelist. Only these origins receive an `Access-Control-Allow-Origin` header:

```
https://store.steampowered.com
https://steamcommunity.com
https://cdn.akamai.steamstatic.com
https://shared.akamai.steamstatic.com
https://steamloopback.host
http://steamloopback.host
```

##### `_cors_origin(headers) -> str`

Resolves the correct value for `Access-Control-Allow-Origin` given the incoming request headers.

| Input `Origin` | Return value | Rationale |
|---|---|---|
| *(absent)* | `''` | Not a cross-origin browser request; header must not be sent |
| `'null'` | `'null'` | Millennium CEF injection context |
| In `_ALLOWED_ORIGINS` | The origin string | Explicit whitelist match |
| Anything else | `''` | Unknown origin; header not sent → browser blocks the response |

##### `safe_backup_path(name: str) -> pathlib.Path`

Path traversal guard. Resolves the full absolute path of `BACKUP_ROOT / name` and verifies it is still under `BACKUP_ROOT` using `Path.relative_to()`. Raises `ValueError` if the resolved path escapes the root (e.g. via `../` sequences).

Additionally, all HTTP handler methods call `os.path.basename()` on the URL-decoded `name` before passing it to this function, cutting the taint chain at the earliest possible point.

#### Class `CalyRequestHandler(BaseHTTPRequestHandler)`

##### `do_OPTIONS()`

Responds to preflight CORS requests. Sets `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers`. Only adds `Access-Control-Allow-Origin` if `_cors_origin()` returns a non-empty string.

##### `do_GET()`

| Path | Action |
|---|---|
| `/check_restore` | Returns `{"restored": true/false}`. Reads and deletes `restore_success.flag` if present |
| `/list` | Returns a JSON array of backup objects (see [GET /list](#get-list)) |
| *(anything else)* | `404` |

##### `do_POST()`

| Path pattern | Action |
|---|---|
| `/restore/<name>` | Validates name, responds `{"status": "accepted"}`, spawns `trigger_external_restore` in a daemon thread |
| `/delete/<name>` | Validates name, removes the backup directory with `shutil.rmtree` |
| `/rename` | Reads `{folder, new_name}` JSON body, updates `caly_meta.json` inside the backup folder |

##### `log_message()`

Overridden to suppress all HTTP access logs to stdout.

#### `trigger_external_restore(backup_folder_name: str)`

Generates and executes a `.bat` script in a secure temporary directory (created via `tempfile.mkdtemp(prefix="caly_")`). The script:

1. Waits 3 seconds.
2. Terminates `steam.exe` via `taskkill /F`.
3. Waits 2 more seconds for handles to release.
4. Uses `xcopy` to restore all four backup targets back to their original Steam locations.
5. Writes `restore_success.flag` to `BACKUP_ROOT`.
6. Restarts Steam.
7. Self-deletes via `(goto) 2>nul & del "%~f0"`.

The script is launched with `subprocess.Popen(..., creationflags=CREATE_NEW_CONSOLE)` so it persists after the Python process has terminated (Steam restart kills the parent).

#### `start_server()`

Binds `HTTPServer` to `('127.0.0.1', SERVER_PORT)` and calls `serve_forever()`. TCP isolation to loopback prevents all external network access regardless of CORS configuration.

---

### backend/ui.py

**Purpose:** Sends a Windows native toast notification using the WinRT `ToastNotificationManager` API via a PowerShell inline script.

#### `show_notification(title: str, message: str)`

Spawns a daemon thread that executes a PowerShell one-liner. Uses `creationflags=0x08000000` (`CREATE_NO_WINDOW`) to suppress the PowerShell console window. Errors are caught and logged to stdout; they do not propagate.

> **Note:** The PowerShell script relies on `[Windows.UI.Notifications.*]` WinRT types. These are available on Windows 10/11 without additional dependencies.

---

### public/index.js

**Purpose:** Self-invoking module injected into the Steam CEF by Millennium. Creates a Floating Action Button (FAB) in the Steam client UI. Clicking the FAB opens a modal listing available backups with restore, delete, and rename actions.

The entire module is wrapped in an IIFE (`(function() { 'use strict'; ... })()`) to avoid polluting the global scope.

#### Constants

| Constant | Value | Description |
|---|---|---|
| `API_URL` | `"http://localhost:9999"` | Base URL for all backend API calls |

#### Functions

##### `sanitize(str) -> string`

XSS guard. Creates a detached `<div>`, sets its `textContent` to the input string (which the browser escapes), then reads back `innerHTML` to get the safe HTML-encoded representation. Returns an empty string for `null` or `undefined` inputs.

##### `ensureCalyStyles()`

Injects the `<style id="caly-styles">` block into `document.head` exactly once. Contains all CSS for the FAB, overlay, modal, list items, buttons, and animations.

##### `createFloatingButton()`

Creates the `#caly-fab` element and appends it to `document.body`. Guards against duplicate creation with `document.getElementById('caly-fab')`. Called twice via `setTimeout` (at 1 s and 3 s) to handle race conditions with DOM availability.

##### `removeOverlay()`

Removes any element matching `.caly-overlay` from the DOM.

##### `showRestoreModal()`

Creates the main backup list overlay, appends it to `document.body`, and calls `fetchBackups()` to populate the list container.

##### `showRenameModal(folder: string, currentName: string)`

Creates the rename overlay with a text input pre-filled with `currentName`. Submits via `executeRename()`.

##### `showSuccessModal()`

Creates the post-restore success overlay with a green-themed modal and an "ENTENDIDO" dismiss button.

##### `checkStartupStatus()`

Called once at load time. After a 1.5-second delay, calls `GET /check_restore`. If the server returns `restored: true`, displays `showSuccessModal()`.

##### `fetchBackups(container: HTMLElement)`

Fetches `GET /list` and renders each backup as a `.caly-item` element.

**Security pattern:**
- The static HTML skeleton is set via `item.innerHTML` (no remote data).
- `mainText` and `subText` (remote data) are assigned via `.textContent` — the browser treats them as plain text, making XSS impossible.
- Game cover art `<img>` is constructed via `document.createElement('img')` with `img.src` set directly — the `src` value never passes through `innerHTML`.
- `appid` is validated against `/^\d+$/` before being used as part of a URL.

##### `executeRename(folder: string, newName: string)`

Posts `{ folder, new_name }` to `POST /rename`. On success, refreshes the modal by calling `showRestoreModal()`.

##### `triggerRestore(folder: string, btnElement: HTMLElement)`

Posts to `POST /restore/<folder>` after a `confirm()` prompt. Disables the button during the request to prevent double-submission.

##### `triggerDelete(folder: string, itemElement: HTMLElement)`

Posts to `POST /delete/<folder>` after a `confirm()` prompt. On success, animates the item out with `calySlideOutRight` and removes it from the DOM.

---

## REST API Reference

**Base URL:** `http://127.0.0.1:9999`

All endpoints are accessible only from `127.0.0.1` (TCP loopback). Responses are JSON unless a 4xx/5xx error code is returned.

---

### `GET /list`

Returns the list of available backups in reverse chronological order.

**Response:** `200 OK`

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

| Field | Type | Description |
|---|---|---|
| `folder` | `string` | Directory name under `BACKUP_ROOT` |
| `nickname` | `string \| null` | User-defined alias stored in `caly_meta.json` |
| `game_name` | `string \| null` | Game name from `caly_meta.json` |
| `appid` | `number \| null` | Steam App ID (used to fetch cover art) |

---

### `GET /check_restore`

Checks whether a restore operation completed successfully since last checked.

**Response:** `200 OK`

```json
{ "restored": true }
```

Side effect: deletes `restore_success.flag` from `BACKUP_ROOT` if present (one-time read).

---

### `POST /restore/<name>`

Initiates an asynchronous restore of the named backup. The HTTP response is returned immediately; the actual restore runs in a background thread.

**URL parameter:** `name` — the backup folder name (URL-encoded).

**Validation:**
- `os.path.basename()` strips any path separators from the decoded name.
- `safe_backup_path()` verifies the resolved path is within `BACKUP_ROOT`.

**Response:** `200 OK`

```json
{ "status": "accepted" }
```

**Error responses:**

| Code | Condition |
|---|---|
| `400` | Path traversal detected |

---

### `POST /delete/<name>`

Permanently deletes a backup directory.

**URL parameter:** `name` — the backup folder name (URL-encoded).

**Validation:** Same as `/restore/<name>`.

**Response:** `200 OK`

```json
{ "status": "deleted" }
```

**Error responses:**

| Code | Condition |
|---|---|
| `400` | Path traversal detected |
| `404` | Backup directory not found |
| `500` | Filesystem error during deletion |

---

### `POST /rename`

Updates the `nickname` field in `caly_meta.json` for a given backup.

**Request body:**

```json
{ "folder": "CalyBackup-2025-06-15_22-30-00", "new_name": "Pré-DLC" }
```

**Validation:** `os.path.basename()` is applied to `folder`, then `safe_backup_path()` verifies confinement.

**Response:** `200 OK`

```json
{ "status": "renamed" }
```

**Error responses:**

| Code | Condition |
|---|---|
| `400` | Path traversal detected or empty folder name |
| `500` | JSON parse error or filesystem write failure |

---

### `OPTIONS *`

Handles CORS preflight requests. Returns `200 OK` with:

```
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: X-Requested-With, Content-Type
Access-Control-Allow-Origin: <whitelisted origin or absent>
```

---

## Security Model

### CORS Policy

The server implements an **explicit origin whitelist**, not a wildcard. The `_cors_origin()` function is the single point of truth:

- If `Origin` is absent (non-browser clients, direct API calls): the CORS header is **not sent** — irrelevant for non-browser clients.
- If `Origin: null` (Millennium CEF injection): `Access-Control-Allow-Origin: null` is sent.
- If the origin is in `_ALLOWED_ORIGINS`: the origin is reflected.
- For all other origins: the CORS header is not sent, causing the browser to block the response.

### Path Traversal Prevention

Two independent layers protect every file system operation:

1. **`os.path.basename()`** — applied to the URL-decoded name at the HTTP handler boundary. Strips any directory components (e.g. `../../etc/passwd` → `passwd`).
2. **`safe_backup_path()`** — resolves the full path and asserts it remains under `BACKUP_ROOT` using `Path.relative_to()`. Raises `ValueError` → `400 Bad Request` if violated.

### Command Injection Prevention

The restore `.bat` file is written to a directory created by **`tempfile.mkdtemp(prefix="caly_")`**, which generates an unpredictable, OS-managed temporary path. This eliminates any possibility of injecting a crafted path through the `%TEMP%` environment variable.

### DOM XSS Prevention

All remote data rendered in the UI is handled by one of three safe patterns:

| Data type | Safe method |
|---|---|
| Text content (names, dates) | `element.textContent = value` |
| HTML structure | Static literal only — no remote data in `innerHTML` |
| Image sources | `img.src = value` (DOM property, not attribute via innerHTML) |
| App IDs | Validated against `/^\d+$/` before URL interpolation |

The `sanitize()` helper provides an additional escaping utility using the browser's own HTML parser.

---

## Backup Rotation

Rotation is enforced in `BackupManager.rotate_backups()`, called at the start of every `perform_backup()` invocation.

**Trigger:** `len(entries) >= MAX_BACKUPS`

**Ordering:** Lexicographic sort of folder names. Because the timestamp format is `YYYY-MM-DD_HH-MM-SS`, lexicographic order is identical to chronological order. The entry at index `0` is always the oldest.

**Effect:** Oldest entries are removed via `shutil.rmtree(ignore_errors=True)` until `len(entries) < MAX_BACKUPS`, leaving room for the new snapshot.

**Example with `MAX_BACKUPS = 4`:**

```
Before backup:
  CalyBackup-2025-06-10_20-00-00  (oldest)
  CalyBackup-2025-06-12_18-30-00
  CalyBackup-2025-06-14_09-15-00
  CalyBackup-2025-06-15_22-30-00

rotate_backups() deletes: CalyBackup-2025-06-10_20-00-00

After perform_backup():
  CalyBackup-2025-06-12_18-30-00
  CalyBackup-2025-06-14_09-15-00
  CalyBackup-2025-06-15_22-30-00
  CalyBackup-2025-06-16_11-00-00  (new)
```

---

## Configuration Reference

All configuration is in `backend/config.py`. To change settings, edit that file and restart the plugin.

| Variable | Default | How to Change |
|---|---|---|
| `MAX_BACKUPS` | `4` | Edit `MAX_BACKUPS = N` in `config.py` |
| `BACKUP_ROOT` | `<STEAM_PATH>\millennium\backups` | Derived from `STEAM_PATH`; change `BACKUP_ROOT` directly if needed |
| `BACKUP_TARGETS` | 4 Steam subdirectories | Add/remove dicts in the `BACKUP_TARGETS` list |
| `SERVER_PORT` | Defined in `config.py` | Change the value and ensure nothing else uses the port |

---

## Frontend Interaction Flow

```
Steam CEF loads public/index.js
         │
         ├─► setTimeout(createFloatingButton, 1000)
         ├─► setTimeout(createFloatingButton, 3000)
         └─► checkStartupStatus()
                  │
                  └─► GET /check_restore (after 1.5 s)
                           │
                      restored=true ──► showSuccessModal()
                      restored=false ──► (no-op)

User clicks FAB (#caly-fab)
         │
         └─► showRestoreModal()
                  │
                  └─► GET /list
                           │
                           └─► renders .caly-item list
                                    │
                          ┌─────────┼─────────┐
                          │         │         │
                     Restaurar   Renomear   Apagar
                          │         │         │
                  POST /restore  POST /rename  POST /delete
```

---

## Plugin Manifest

`plugin.json` is read by the Millennium framework at load time.

```json
{
  "name": "calyrecall",
  "common_name": "CalyRecall",
  "description": "Backup automatizado de Userdata, Stats e Configs ao fechar jogos.",
  "author": "BruxinCore, JuniorD-Isael",
  "version": "1.0.1"
}
```

| Field | Description |
|---|---|
| `name` | Internal plugin identifier (lowercase, no spaces) |
| `common_name` | Display name shown in Millennium's plugin manager |
| `description` | Short description displayed in the plugin list |
| `author` | Comma-separated contributor list |
| `version` | Semantic version string |

> **Important:** Do not add a `"frontend"` field. Millennium auto-injects `public/index.js` based on its own conventions. Adding `"frontend"` with a custom path causes unexpected loader behaviour.

---

## Known Issues

### FAB Not Appearing in Steam UI

**Status:** Under investigation.

**Symptom:** The `#caly-fab` element is created successfully (confirmed by backend activity) but is not visible in the Steam client window.

**Root cause identified so far:** A previous `requirements.txt` with comment lines was causing Millennium's PIPX to fail with `Invalid requirement` on every comment line, preventing the plugin backend from loading at all. After emptying `requirements.txt`, the backend loads correctly and backup operations work.

**Remaining issue:** Even with the backend functional and `setTimeout(createFloatingButton, ...)` executing, the FAB does not render visibly. Possible causes:
- The CEF page where `index.js` is injected does not have a persistent `document.body` in the expected state.
- CSS `z-index` or Steam's own overlay compositor clips the element.
- Millennium's injection timing differs across Steam versions.

**Workaround:** None confirmed. Use the backend API directly at `http://localhost:9999/list` to inspect backup state.
