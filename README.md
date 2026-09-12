# [HEXOLUTION](https://hexolution.yuuret.su)

npm workspaces: `apps/web`, `apps/desktop`, `packages/*`.

## Install

```bash
npm install
```

For deploy, copy `apps/web/.env.example` → `apps/web/.env` and set `REMOTE_USER`, `REMOTE_HOST`, `REMOTE_PATH`.

## Dev

```bash
npm run dev
```

Desktop (Electron wrapping web): `npm run dev:desktop`

## Build

```bash
npm run build
```

Web output: `apps/web/dist/`. Desktop: `npm run build:desktop` → `release/`.

## Deploy

Builds web and uploads `apps/web/dist/` to the server:

```bash
npm run deploy
```
