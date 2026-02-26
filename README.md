<div align="center">

# 🔐 CalyVault

**Fork de Segurança · Baseado em [CalyRecall](https://github.com/BruxinCore/CalyRecall) por BruxinCore**

[![Millennium](https://img.shields.io/badge/Millennium-Compatible-8b5cf6?style=for-the-badge&logo=steam)](https://steambrew.app/)
[![Python](https://img.shields.io/badge/Backend-Python-ffe800?style=for-the-badge&logo=python&logoColor=black)](https://www.python.org/)
[![Fork](https://img.shields.io/badge/Fork%20de-BruxinCore%2FCalyRecall-8b5cf6?style=for-the-badge&logo=github)](https://github.com/BruxinCore/CalyRecall)
[![Uso](https://img.shields.io/badge/Uso-Estudo%20%2F%20Pessoal-gray?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-CSAL-red?style=for-the-badge)](license)

<p align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3BxdGp6Z3V4ZnV4ZnV4ZnV4ZnV4ZnV4ZnV4ZnV4ZnV4ZnV4eiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LMcB8XjhG7ck/giphy.gif" width="100%" height="4" alt="divider">
</p>

<h3>Seus saves, blindados. Seu histórico, intacto.</h3>

<p align="left">
O <strong>CalyVault</strong> é uma variante endurecida do CalyRecall. Mantém todas as funcionalidades do projeto original e adiciona uma camada de segurança ofensiva: mitigação de CORS wildcard, bloqueio de Path Traversal, prevenção de Command Injection, proteção contra DOM XSS e rotação automática de backups com limite configurável.
<br><br>
Este projeto é um <strong>exercício de estudo em AppSec</strong> aplicado a um plugin real. Não é um produto, não tem suporte e <strong>não tem a intenção de substituir o CalyRecall original</strong>.
</p>

</div>

---

## ⚠️ Aviso Importante

> Este repositório é um **fork para uso pessoal e estudo**, derivado do projeto original **[CalyRecall](https://github.com/BruxinCore/CalyRecall)** criado por **[BruxinCore](https://github.com/BruxinCore)**.
>
> Todo o conceito, design visual, arquitetura e código-base original pertencem exclusivamente ao autor original.
> Este fork **não é um produto**, **não tem releases oficiais** e **não visa substituir, competir ou deprecar** o projeto upstream.
>
> Quer o CalyRecall de verdade — com suporte, instalador e releases?
> **👉 [github.com/BruxinCore/CalyRecall](https://github.com/BruxinCore/CalyRecall)**

---

## 🔐 Por que CalyVault?

*Vault* = cofre. O diferencial deste fork é exclusivamente a camada de segurança aplicada sobre a base original. Cinco vulnerabilidades identificadas via análise Snyk foram mitigadas, e o comportamento funcional do plugin foi preservado integralmente.

| CVE/Classe | Vetor | Mitigação aplicada |
| :--- | :--- | :--- |
| **Path Traversal** | Endpoints `/delete`, `/rename`, `/restore` | `os.path.basename()` na borda HTTP + `safe_backup_path()` com `Path.relative_to()` |
| **Command Injection** | Variável `%TEMP%` no script `.bat` | `tempfile.mkdtemp()` — caminho imprevisível gerenciado pelo SO |
| **CORS Wildcard** | Header `Access-Control-Allow-Origin: *` | Lista de permissões explícita (Steam origins + CEF `null`); sem fallback `*` |
| **DOM XSS** | `innerHTML` com dados remotos | `textContent` para dados; DOM API para imagens; `appid` validado via regex |
| **Information Disclosure** | Mensagens de erro expostas ao cliente | Erros genéricos na UI; detalhes apenas em logs internos |

---

## 🔁 Rotação de Backups

Funcionalidade adicionada neste fork. O vault mantém automaticamente um número máximo de snapshots, deletando o mais antigo antes de criar um novo.

```
MAX_BACKUPS = 4  → configurável em backend/config.py

Antes:  [Jan/10] [Jan/12] [Jan/14] [Jan/15]
Criar:   deleta [Jan/10] → cria [Jan/16]
Depois: [Jan/12] [Jan/14] [Jan/15] [Jan/16]
```

---

## 📄 Documentação Técnica

| Arquivo | Idioma | Conteúdo |
| :--- | :--- | :--- |
| [DOCS.md](DOCS.md) | 🇺🇸 English | Full module reference, REST API, security model, architecture diagrams |
| [DOCS.pt-BR.md](DOCS.pt-BR.md) | 🇧🇷 Português | Referência completa de módulos, API REST, modelo de segurança, diagramas |

---

## ⚡ Funcionalidades

Todas herdadas do CalyRecall original, sem remoções:

| Recurso | Descrição |
| :--- | :--- |
| 🎮 **Game Awareness** | Identifica qual jogo foi fechado, exibindo nome e capa oficial na lista de backups. |
| 🕵️ **Monitoramento Passivo** | Polling do registro Windows (`RunningAppID`). Zero impacto na performance. |
| 📦 **Backup Cirúrgico** | Copia apenas userdata, stats, depotcache e configs de plugins. |
| 🔄 **Time Travel (Restore)** | Restauração com um clique — para o Steam, substitui arquivos, reinicia. |
| ✏️ **Gerenciamento** | Renomeie ou delete backups diretamente na interface. |
| 🔔 **Notificações Nativas** | Toast do Windows ao concluir backup. |
| 🔒 **Vault Mode** | Rotação automática + controles de segurança em toda a API. |

---

## 🕰️ Como usar o Restore

### 1. O Botão de Acesso
No canto inferior direito da Steam, procure pelo **Botão Roxo com Ícone de Relógio**.

<div align="center">
  <img src="https://i.imgur.com/gReSM17.png" alt="Botão CalyVault" width="35%">
</div>

### 2. Gerenciamento Visual
- **Restaurar** — volta para o snapshot selecionado.
- **Renomear (✏️)** — dê apelidos como "Antes do Boss Final".
- **Deletar (🗑️)** — remova snapshots desnecessários.

<div align="center">
  <img src="https://i.imgur.com/w3NpTcM.png" alt="Menu CalyVault" width="50%">
</div>

### 3. Confirmação
O CalyVault para o Steam, restaura cirurgicamente e reinicia automático.

<div align="center">
  <img src="https://i.imgur.com/dD5YAs7.png" alt="Sucesso" width="50%">
</div>

---

## 🛡️ O que o Vault protege

| Diretório | Conteúdo |
| :--- | :--- |
| `Steam/userdata` | Saves locais, configurações de controle, preferências de nuvem |
| `Steam/appcache/stats` | Métricas e estatísticas de jogos |
| `Steam/depotcache` | Manifests e cache de download |
| `Steam/config/stplug-in` | Configurações de plugins injetados no Steam |

---

## 🚀 Instalação

⚠️ **Pré-requisito:** [Millennium](https://steambrew.app/) instalado.

> Este fork não tem instalador. Para o instalador oficial, acesse o **[repositório original](https://github.com/BruxinCore/CalyRecall)**.

1. Clone ou baixe o ZIP deste repositório.
2. Mova a pasta `CalyRecall` para o diretório de plugins do Steam:
   ```
   .../Steam/plugins/CalyRecall
   ```
3. Reinicie a Steam.

---

## 📂 Onde ficam os backups?

```text
Steam/
└── millennium/
    └── backups/
        ├── CalyBackup-2026-01-24_14-30-00/
        ├── CalyBackup-2026-01-24_18-45-12/
        └── ...
```

Limite padrão: **4 snapshots**. Editável em `backend/config.py` → `MAX_BACKUPS`.

---

## 👤 Créditos

| Papel | |
| :--- | :--- |
| **Criador do CalyRecall (projeto original)** | [BruxinCore](https://github.com/BruxinCore) |
| **Repositório original** | [github.com/BruxinCore/CalyRecall](https://github.com/BruxinCore/CalyRecall) |
| **Hardening de segurança · CalyVault (este fork)** | JuniorD-Isael |

> Todo o mérito pelo conceito, design e implementação original é de **BruxinCore**.  
> Este fork existe como exercício de segurança aplicada e uso pessoal — nada além disso.
