# Foodies API (GoIT Final Project, Backend Group 3)

Simple Express + TypeScript backend with Swagger-generated API docs.

## Getting Started
- Prereq: Node.js 18+ and npm.
- Install deps: `npm install`
- Dev server (with nodemon): `npm run dev`
- Production start: `npm start`

The server defaults to `PORT=3000`. Override with `PORT=xxxx`.

## Environment Variables
Set these before running the server, migrations (`npm run migrate:up`), or seeds (`npm run seed`).

- `DB_HOST` (required): Postgres host.
- `DB_PORT` (optional, default `5432`): Postgres port.
- `DB_USERNAME` (required): Postgres user.
- `DB_PASSWORD` (required): Postgres password.
- `DB_DATABASE` (required): Postgres database name.
- `JWT_SECRET` (required): Secret used to sign JWTs.
- `JWT_EXPIRES_IN` (optional, default `7D`): Token lifetime in `ms` syntax (e.g., `1d`, `12h`).
- `BCRYPT_SALT_ROUNDS` (optional, default `10`): Cost factor for password hashing.
- `DATA_DIRECTORY` (optional, default `./data`): Root folder for runtime files; `tmp/` and `public/` are created inside it.
- `PORT` (optional, default `3000`): HTTP port for the Express server.
- `NODE_ENV` (optional, default `development`): Selects the DB config; `production` enables SSL for Postgres.

Example `.env` snippet:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=secret
DB_DATABASE=foodies
JWT_SECRET=change-me
```

## Database Migrations
- Ensure Postgres is running and the target database (`DB_DATABASE`) exists for the current `NODE_ENV`.
- Apply all pending migrations: `npm run migrate:up`
- Seed demo data (optional): `npm run seed`

## API Docs
- Interactive docs served by Swagger UI at `http://localhost:3000/api-docs`.
- Static assets are exposed from `/public`.

## Project Notes
- Entry point: `bin/www`
- Main app: `app.ts`
- Routes live under `routes/` (annotated for Swagger via `swagger-jsdoc`).
