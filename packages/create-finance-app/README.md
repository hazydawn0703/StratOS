# @stratos/create-finance-app

Create and bootstrap a local **StratOS Finance** app from npm.

> This README is for npm package users (not monorepo contributors).

## Requirements

- Node.js >= 20
- git
- pnpm or npm
- docker (only for `--mode docker-compose`)

## Quick start

```bash
npx @stratos/create-finance-app --help
```

Default install (`from-source`):

```bash
npx @stratos/create-finance-app
```

Docker Compose install:

```bash
npx @stratos/create-finance-app --mode docker-compose
```

## Usage

```bash
npx @stratos/create-finance-app [options]
```

Options:

- `--mode <from-source|docker-compose>` Install mode (default: `from-source`)
- `--repo <git-url>` Repo URL (default: `https://github.com/hazydawn0703/StratOS.git`)
- `--dir <path>` Target directory (default: `./stratos-finance`)
- `--port <number>` Finance web port (default: `4310`)
- `--dry-run` Print actions without executing
- `--help` Show help

Repo override:

- If `--repo` is not passed, you can override with env var:

```bash
STRATOS_REPO_URL=<your-fork-url> npx @stratos/create-finance-app
```

## Real behavior by mode

### `--mode from-source` (supported)

1. Clone StratOS repo into `--dir`.
2. Install dependencies.
3. Run finance setup command.
4. Print next steps and setup URL.

### `--mode docker-compose` (supported)

1. Clone StratOS repo into `--dir`.
2. Prepare `.env` from cloned `.env.example`.
3. Run `docker compose up -d` in cloned repo.
4. Print next steps and setup URL.

## Notes

- Installer expects `--dir` to be empty (or not existing).
- Setup wizard and runtime configuration are handled by `apps/finance` itself after install.
