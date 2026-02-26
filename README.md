<div align="center">

# 🟣 CalyRecall 🟣

**Automação de Backup e Restauração Inteligente para Steam (Millennium)**

[![Millennium](https://img.shields.io/badge/Millennium-Compatible-8b5cf6?style=for-the-badge&logo=steam)](https://steambrew.app/)
[![Python](https://img.shields.io/badge/Backend-Python-ffe800?style=for-the-badge&logo=python&logoColor=black)](https://www.python.org/)
[![Discord](https://img.shields.io/badge/Community-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/DQYxmFaywK)
[![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-CSAL-red?style=for-the-badge)](license)
[![Fork](https://img.shields.io/badge/Fork-BruxinCore%2FCalyRecall-8b5cf6?style=for-the-badge&logo=github)](https://github.com/BruxinCore/CalyRecall)

<p align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3BxdGp6Z3V4ZnV4ZnV4ZnV4ZnV4ZnV4ZnV4ZnV4ZnV4ZnV4eiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LMcB8XjhG7ck/giphy.gif" width="100%" height="4" alt="divider">
</p>

<h3>Proteja seu legado. Viaje no tempo.</h3>

<p align="left">
O <strong>CalyRecall</strong> é um plugin de segurança silencioso. Ele monitora sua sessão de jogo em tempo real. No momento em que você fecha um jogo, o protocolo <em>Recall</em> é ativado, criando um snapshot instantâneo dos seus dados mais valiosos.
<br><br>
Agora com o novo sistema de <strong>Restore</strong>, você pode reverter para qualquer ponto da história com apenas dois cliques. Nunca mais perca um save, uma configuração ou um status de plugin.
</p>

</div>

---

## ⚠️ Fork — Créditos ao Projeto Original

> Este repositório é um **fork independente** do projeto original [CalyRecall](https://github.com/BruxinCore/CalyRecall), criado por **[BruxinCore](https://github.com/BruxinCore)**.
>
> Todo o conceito, design visual, arquitetura e código-base original pertencem exclusivamente ao autor original. Este fork existe para experimentação técnica com foco em hardening de segurança e não substitui nem concorre com o projeto upstream.
>
> Se você quer o CalyRecall oficial e suportado pelo criador, **vá ao repositório original:**
> **👉 [github.com/BruxinCore/CalyRecall](https://github.com/BruxinCore/CalyRecall)**

---

## 🔐 O que foi alterado neste fork

Este fork focou exclusivamente em **hardening de segurança** e na adição de **rotação automática de backups**. Nenhuma funcionalidade core foi removida ou alterada.

| Área | Alteração |
| :--- | :--- |
| **CORS** | Substituído wildcard `*` por lista de permissões explícita (Steam origins + CEF `null`) |
| **Path Traversal** | Dupla camada: `os.path.basename()` na borda HTTP + `safe_backup_path()` com `Path.relative_to()` |
| **Command Injection** | `%TEMP%` substituído por `tempfile.mkdtemp()` para criação segura de diretório temporário |
| **DOM XSS** | Dados remotos movidos para `textContent`; imagens construídas via DOM API; `appid` validado por regex |
| **Rotação de Backups** | Limite configurável `MAX_BACKUPS = 4`; o mais antigo é deletado automaticamente antes de cada novo backup |
| **Documentação** | Adicionados `DOCS.md` (EN) e `DOCS.pt-BR.md` (PT-BR) com documentação técnica completa |

---

## 📄 Documentação Técnica

| Arquivo | Idioma | Conteúdo |
| :--- | :--- | :--- |
| [DOCS.md](DOCS.md) | 🇺🇸 English | Full module reference, REST API, security model, architecture diagrams |
| [DOCS.pt-BR.md](DOCS.pt-BR.md) | 🇧🇷 Português | Referência completa de módulos, API REST, modelo de segurança, diagramas |
| [SECURITY_REPORT.md](SECURITY_REPORT.md) | 🇧🇷 Português | Relatório de pentest — VULN-01 a VULN-05 com PoC, impacto e remediação |

---

## ⚡ Funcionalidades

| Recurso | Descrição |
| :--- | :--- |
| 🎮 **Game Awareness** |Identifica automaticamente qual jogo foi fechado, exibindo o **Nome Real** e a **Capa Oficial** na lista de backups. |
| 🕵️ **Monitoramento Passivo** | Detecta automaticamente o encerramento de processos de jogos (AppID). Zero impacto na performance. |
| 📦 **Backup Cirúrgico** | Salva apenas o que importa (userdata, stats, cache, configs), ignorando o "lixo" temporário. |
| 🔄 **Time Travel (Restore)** | Restaure backups antigos instantaneamente através de uma interface visual integrada. |
| ✏️ **Gerenciamento Total** | Renomeie backups (ex: "Antes do Boss") ou delete snapshots antigos direto na interface. |
| 🔔 **Notificações Nativas** | Feedback visual discreto via Windows Toast ao concluir operações. |
| 🗃️ **Histórico Organizado** | Cria pastas timestamped para você voltar no tempo quando quiser. |
| 🔁 **Rotação Automática** | Mantém no máximo `MAX_BACKUPS` snapshots; o mais antigo é deletado automaticamente. |

---

## 🕰️ Como usar o Restore

O CalyRecall agora possui uma interface visual dedicada. Veja como é simples voltar no tempo:

### 1. O Botão de Acesso
No canto inferior direito da sua Steam, procure pelo **Botão Roxo com Ícone de Relógio**. Ele é o seu portal para os backups.

<div align="center">
  <img src="https://i.imgur.com/gReSM17.png" alt="Botão CalyRecall" width="35%">
</div>

### 2. Gerenciamento Visual
Ao clicar, uma lista com todos os seus backups aparecerá, agora com os ícones dos jogos!
* **Restaurar:** Clique no botão grande para voltar no tempo.
* **Renomear (✏️):** Dê apelidos aos seus backups para lembrar de momentos importantes.
* **Deletar (🗑️):** Remova backups que não precisa mais.

<div align="center">
  <img src="https://i.imgur.com/w3NpTcM.png" alt="Menu de Restore" width="50%">
</div>

### 3. Confirmação Visual
Pronto! O CalyRecall fará a substituição cirúrgica dos arquivos e te avisará quando estiver tudo seguro.

<div align="center">
  <img src="https://i.imgur.com/dD5YAs7.png" alt="Sucesso" width="50%">
</div>

---

## 🛡️ O Protocolo de Segurança (Backup Targets)

O **CalyRecall** foi configurado para "congelar" o estado das seguintes pastas críticas:

> **📂 1. Userdata (`/userdata`)**
> * Contém todos os seus saves locais, configurações de controle e preferências de nuvem.
>
> **📊 2. Estatísticas (`/appcache/stats`)**
> * Preserva os arquivos de métricas e estatísticas dos seus jogos.
>
> **📦 3. Depot Cache (`/depotcache`)**
> * Arquivos de manifesto e cache de download cruciais para a integridade dos jogos.
>
> **🔌 4. Configurações de Plugins (`/config/stplug-in`)**
> * Backup específico para configurações de plugins injetados na Steam.

---

## 🚀 Como Instalar

⚠️ **Pré-requisito:** Tenha o [Millennium](https://steambrew.app/) instalado.

> **Nota:** Este é um fork focado em segurança. Para o instalador oficial e releases, use o **[repositório original](https://github.com/BruxinCore/CalyRecall)**.

### 🛠️ Instalação Manual

1. Baixe a última versão do código-fonte (ZIP) ou clone este repositório.
2. Extraia a pasta `CalyRecall` para dentro do diretório de plugins da Steam:
   ```
   .../Steam/plugins/CalyRecall
   ```
3. Reinicie a Steam.

---

## 📂 Onde ficam meus backups?

Os snapshots ficam dentro da pasta do Millennium:

```text
Steam/
└── millennium/
    └── backups/
        ├── CalyBackup-2026-01-24_14-30-00/
        ├── CalyBackup-2026-01-24_18-45-12/
        └── ...
```

O limite padrão é **4 backups**. Ao criar um novo, o mais antigo é deletado automaticamente. Para alterar o limite, edite `MAX_BACKUPS` em `backend/config.py`.

---

## 👤 Créditos

| Papel | Pessoa |
| :--- | :--- |
| **Criador original** | [BruxinCore](https://github.com/BruxinCore) |
| **Repositório original** | [github.com/BruxinCore/CalyRecall](https://github.com/BruxinCore/CalyRecall) |
| **Hardening de segurança (este fork)** | JuniorD-Isael |

Todo o mérito pelo conceito e implementação original é de **BruxinCore**.
