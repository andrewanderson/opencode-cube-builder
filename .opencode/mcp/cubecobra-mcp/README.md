# CubeCobra MCP Server

> **Fork of [plrdev/cubecobra-mcp](https://github.com/plrdev/cubecobra-mcp)** by
> **Juha Linnanen** (2025-12-05). This repository extends the original server
> with additional tooling and fixes (see git history); all original work and
> credit belongs to the upstream author.
>
> **License:** ISC (matching the upstream `package.json`; see [LICENSE](LICENSE)).

## Local setup

```bash
npm install
npm run build
```

## Running locally

```bash
npm start
```

Or, for iterating in TypeScript:

```bash
npm run dev
```

## Environment configuration

The server uses optional environment variables:

- `CUBECOBRA_BASE_URL` — override the base URL (defaults to `https://cubecobra.com`).
- `CUBECOBRA_COOKIE` — your CubeCobra session cookie (needed for private/owner-only endpoints).
- `CUBECOBRA_CSRF` — CSRF token to accompany the cookie for POSTs.
- `DEFAULT_CUBE_SHORT_ID` — fallback short ID for cube tools (list/csv/json/plaintext).
- `DEFAULT_CUBE_ID` — fallback cube UUID for records tools.
- `DEFAULT_RECORD_ID` — fallback record ID for record page/data tools.

### Persisting secrets locally

To avoid retyping these on every run, create a local env file (not committed) and load it when you start the server. For example, create `.env.local` in the project root:

```
CUBECOBRA_BASE_URL=https://cubecobra.com
CUBECOBRA_COOKIE=connect.sid=...; othercookies=...
CUBECOBRA_CSRF=your-csrf-token
DEFAULT_CUBE_SHORT_ID=obc
DEFAULT_CUBE_ID=6178df6d-867d-4b54-b7ed-ff940daf26aa
DEFAULT_RECORD_ID=318ecd53-6cc7-4489-9408-35c3decee4ae
```

Then start with:

```bash
env $(cat .env.local | xargs) npm run dev
# or
env $(cat .env.local | xargs) npm start
```

Make sure `.env.local` is in your `.gitignore` to keep secrets out of version control.

### Notes on CubeCobra auth

- Auth is only required for endpoints like `list_cube_records`; public tools (list, csv, json, plaintext) work without auth.
- The CSRF token can be copied from the `x-csrf-token` header of a successful POST in the browser’s Network tab when logged in.
