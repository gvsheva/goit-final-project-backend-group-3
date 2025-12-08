# Foodies API (GoIT Final Project, Backend Group 3)

Simple Express + TypeScript backend with Swagger-generated API docs.

## Getting Started
- Prereq: Node.js 18+ and npm.
- Install deps: `npm install`
- Dev server (with nodemon): `npm run dev`
- Production start: `npm start`

The server defaults to `PORT=3000`. Override with `PORT=xxxx`.

## API Docs
- Interactive docs served by Swagger UI at `http://localhost:3000/api-docs`.
- Static assets are exposed from `/public`.

## Project Notes
- Entry point: `bin/www`
- Main app: `app.ts`
- Routes live under `routes/` (annotated for Swagger via `swagger-jsdoc`).
