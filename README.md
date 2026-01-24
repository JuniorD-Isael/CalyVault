<div align="center">

# 🟣 CalyRecall 🟣 

**Automação de Backup e Restauração Inteligente para Steam (Millennium)**

[![Millennium](https://img.shields.io/badge/Millennium-Compatible-8b5cf6?style=for-the-badge&logo=steam)](https://steambrew.app/)
[![Python](https://img.shields.io/badge/Backend-Python-ffe800?style=for-the-badge&logo=python&logoColor=black)](https://www.python.org/)
[![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)]()

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

## ⚡ Funcionalidades

| Recurso | Descrição |
| :--- | :--- |
| 🕵️ **Monitoramento Passivo** | Detecta automaticamente o encerramento de processos de jogos (AppID). Zero impacto na performance. |
| 📦 **Backup Cirúrgico** | Salva apenas o que importa (userdata, stats, cache, configs), ignorando o "lixo" temporário. |
| 🔄 **Time Travel (Restore)** | Restaure backups antigos instantaneamente através de uma interface visual integrada. |
| 🔔 **Notificações Nativas** | Feedback visual discreto via Windows Toast ao concluir operações. |
| 🗃️ **Histórico Organizado** | Cria pastas timestamped para você voltar no tempo quando quiser. |

---

## 🕰️ Como usar o Restore

O CalyRecall agora possui uma interface visual dedicada. Veja como é simples voltar no tempo:

### 1. O Botão de Acesso
No canto inferior direito da sua Steam, procure pelo **Botão Roxo com Ícone de Relógio**. Ele é o seu portal para os backups.

<div align="center">
  <img src="https://i.imgur.com/gReSM17.png" alt="Botão CalyRecall" width="35%">
</div>

### 2. Escolha o Ponto de Restauração
Ao clicar, uma lista com todos os seus backups organizados por data irá aparecer. Basta selecionar o momento para o qual deseja voltar.

<div align="center">
  <img src="https://i.imgur.com/wRipSZq.png" alt="Menu de Restore" width="50%">
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

### ⚡ Método Recomendado (Automático)
Instale em segundos sem precisar baixar arquivos manualmente.

1. Pressione a tecla `Windows` e digite **PowerShell**.
2. Clique com o botão direito no ícone e selecione **"Executar como Administrador"**.
3. Copie e cole o comando abaixo e aperte `Enter`:

```powershell
irm [https://raw.githubusercontent.com/BruxinCore/CalyRecall/refs/heads/main/install.ps1](https://raw.githubusercontent.com/BruxinCore/CalyRecall/refs/heads/main/install.ps1) | iex

```

### 🛠️ Método Manual

1. Baixe a última versão do **CalyRecall**.
2. Extraia a pasta `CalyRecall` para dentro do diretório de plugins:

```bash
C:\Program Files (x86)\Steam\plugins\

```

*(Nota: Certifique-se de que a pasta se chama apenas `CalyRecall`)*

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
