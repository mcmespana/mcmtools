# mcmtools

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_AVDuiz6UP2gdXdCAYjNLdPUzgSsr)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## WhatsApp MCM (envíos masivos vía KAPSO)

Tool dedicada en `/whatsapp` para enviar mensajes de WhatsApp con plantillas
aprobadas de KAPSO, a destinatarios de un **Excel/CSV** o de **SinergiaCRM**.
El asistente detecta las variables de la plantilla (`{{1}}`, `{{nombre}}`) y deja
mapearlas a columnas/campos antes de enviar mediante la Broadcasts API de KAPSO.

### Variables de entorno

Copia `.env.example` a `.env.local` y rellena (ver tabla):

| Variable | Descripción |
|----------|-------------|
| `KAPSO_API_KEY` | API key de proyecto de KAPSO |
| `KAPSO_BUSINESS_ACCOUNT_ID` | Cuenta de WhatsApp Business (listar plantillas) |
| `KAPSO_PHONE_NUMBER_ID` | Número de WhatsApp emisor |
| `KAPSO_DEFAULT_COUNTRY_CODE` | Prefijo por defecto (opcional, def. `34`) |
| `KAPSO_TEST_PHONE` | Número para el envío de prueba (opcional) |
| `SINERGIA_URL` | URL del CRM hasta `/rest.php` |
| `SINERGIA_USER` / `SINERGIA_PASS` | Credenciales del CRM |

### MCP de KAPSO (para agentes)

El repo incluye `.mcp.json` que registra el MCP de KAPSO. Requiere exportar
`KAPSO_API_KEY` en el entorno. Registro manual:

```bash
claude mcp add --transport http kapso https://api.kapso.ai/mcp \
  --header "Authorization: Bearer $KAPSO_API_KEY"
```

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/mcmespana/mcmtools" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
