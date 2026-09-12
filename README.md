# [HEXOLUTION](https://hexolution.yuuret.su)

npm workspaces: `apps/web`, `apps/desktop`, `packages/*`.

## Install

```bash
npm install
```

## Dev

```bash
npm run dev:web
npm run dev:desktop
```

`dev:desktop` starts the web Vite server and Electron together.

## Build

```bash
npm run build:web
npm run build:desktop
```

- Web → `apps/web/dist/`
- Desktop → `apps/desktop/release/` (builds web first, then packages Electron)

## Deploy

Copy `apps/web/.env.example` → `apps/web/.env` and set `REMOTE_USER`, `REMOTE_HOST`, `REMOTE_PATH`.

```bash
npm run deploy:web
```

Builds web and uploads `apps/web/dist/` to the server.
