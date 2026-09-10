# FilmVault

FilmVault is a small social film catalog. Members can search the TMDB catalog, save movies and television series, rate what they have watched, and browse other members' collections.

The repository contains a React client, an Express API, a MySQL schema, and Terraform for the original Oracle Cloud deployment.

## What is in the repository

| Path | Purpose |
| --- | --- |
| `client/` | React 19 and TypeScript single-page application |
| `server/` | Express and TypeScript API |
| `server/terraform/` | OCI network, compute, object storage, Vault, and IAM resources |
| `FilmVault-Documentation.md` | Architecture notes and deployment decisions |

## Run it locally

The client and API run as separate processes. MySQL and a TMDB API key are required for the complete experience.

```bash
cd server
cp .env.example .env
npm ci
npm run dev
```

In another terminal:

```bash
cd client
cp .env.example .env
npm ci
npm start
```

The client opens at `http://localhost:3000`. Set `REACT_APP_API_URL` in `client/.env` if the API is not using the same origin.

## Build checks

```bash
cd server && npm run build
cd ../client && npm run build
```

## Configuration

Do not commit local environment files. The two example files list the client and server variables without credentials. OCI storage and SendGrid are optional for a basic local run.

The original OCI deployment files are kept under `server/terraform/`. Review variable defaults and resource costs before applying them to a new tenancy.

## Data sources

Movie, television, cast, and crew metadata comes from [TMDB](https://www.themoviedb.org/). FilmVault member ratings and collections are stored in MySQL.
