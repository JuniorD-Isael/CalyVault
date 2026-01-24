<div align="center">

# 🟣 CalyRecall 🟣 

**Automação de Backup Inteligente para Steam (Millennium)**

[![Millennium](https://img.shields.io/badge/Millennium-Compatible-8b5cf6?style=for-the-badge&logo=steam)](https://steambrew.app/)
[![Python](https://img.shields.io/badge/Backend-Python-ffe800?style=for-the-badge&logo=python&logoColor=black)](https://www.python.org/)
[![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)]()

<p align="center">
  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3BxdGp6Z3V4ZnV4ZnV4ZnV4ZnV4ZnV4ZnV4ZnV4ZnV4ZnV4eiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LMcB8XjhG7ck/giphy.gif" width="100%" height="4" alt="divider">
</p>

<h3>Proteja seu legado. Sem esforço.</h3>

<p align="left">
O <strong>CalyRecall</strong> é um plugin de segurança silencioso. Ele monitora sua sessão de jogo em tempo real. No momento em que você fecha um jogo, o protocolo <em>Recall</em> é ativado, criando um snapshot instantâneo dos seus dados mais valiosos. Nunca mais perca um save, uma configuração ou um status de plugin.
</p>

</div>

---

## ⚡ Funcionalidades

| Recurso | Descrição |
| :--- | :--- |
| 🕵️ **Monitoramento Passivo** | Detecta automaticamente o encerramento de processos de jogos (AppID). Zero impacto na performance. |
| 📦 **Backup Cirúrgico** | Salva apenas o que importa (userdata, stats, cache, configs), ignorando o "lixo" temporário. |
| 🔔 **Notificações Nativas** | Feedback visual discreto via Windows Toast ao concluir a operação. |
| 🗃️ **Histórico Organizado** | Cria pastas timestamped (CalyBackup-AAAA-MM-DD...) para você voltar no tempo quando quiser. |

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

### ⚡ Método Recomendado (Automático)
Instale em segundos sem precisar baixar arquivos manualmente.

1. Pressione a tecla `Windows` e digite **PowerShell**.
2. Abra o PowerShell.
3. Copie e cole o comando abaixo e aperte `Enter`:

```powershell
irm https://raw.githubusercontent.com/BruxinCore/CalyRecall/refs/heads/main/install.ps1 | iex

```

### 🛠️ Método Manual

1. Baixe a última versão do **CalyRecall**.
2. Extraia a pasta `CalyRecall` para dentro do diretório de plugins:
```bash
C:\Program Files (x86)\Steam\millennium\plugins\

```


3. Reinicie a Steam.

---

## 📂 Onde ficam meus backups?

Todos os snapshots são armazenados localmente em:

```text
Steam/
└── millennium/
    └── backups/
        ├── CalyBackup-2026-01-24_14-30-00/
        ├── CalyBackup-2026-01-24_18-45-12/
        └── ...
