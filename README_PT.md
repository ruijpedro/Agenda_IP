# IP_RJP Agenda — Google / Gmail

Versão preparada para usar o ecossistema Google em vez do Microsoft Outlook.

## Funcionalidades

- Login Google/Gmail
- Agenda Google Calendar
- Google Tasks
- Contactos Google
- Gmail Send
- Google Drive / Google Sheets via Apps Script opcional
- Atividades IP_RJP guardadas localmente e exportáveis para o Google Calendar

## Instalação

```bash
npm install --legacy-peer-deps
npm run build
```

## Desenvolvimento

```bash
npm run dev
```

## Configuração Google

Lê o ficheiro `GOOGLE_SETUP_PT.md`.

Na app, abre **Definições** e preenche:

- Google Client ID
- Google API Key, opcional
- Apps Script URL, opcional
- Autor
- Organização

## Apps Script

O script opcional está em:

```txt
google-apps-script/Code.gs
google-apps-script/appsscript.json
```

Publicar como Web App e copiar o URL `/exec` para a app.
