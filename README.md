# SR2 — Sunlight Readability Certification Platform

SR2 is a web platform foundation for independent smartphone-display sunlight-readability assessment and a public SR certificate registry.

## Simple local database
SR2 uses **SQLite**. Supabase is not required. The database file is created automatically at `data/sr2.sqlite` (or the path configured by `DATABASE_PATH`). Keep this directory on persistent disk and back it up.

## Technology
Next.js 15, React 19, TypeScript, SQLite, bcrypt password hashing, and signed HTTP-only sessions.

## Quick start
1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set a unique `SESSION_SECRET` (at least 32 characters).
5. Set a new private `ADMIN_PASSWORD` (at least 14 characters).
6. Run `npm run admin:provision` once.
7. Run `npm run dev` and open http://localhost:3000.

See [docs/SETUP.md](docs/SETUP.md) for details.

## Scientific protocol
See [docs/SR-METHODOLOGY.md](docs/SR-METHODOLOGY.md). The protocol is a draft. Do not issue numerical scores or claim accreditation until the scoring method is validated independently.

## Deployment note
SQLite is intended for a single server with persistent storage (such as a VPS). An ephemeral/serverless filesystem is not suitable because database changes may be lost or split across instances.

## Current status
Local database-backed account registration and login, session handling, admin provisioning, dashboard counts, and public active-certificate search are implemented in the repository. Full brand onboarding, BSC issuance UI and email delivery, application evidence uploads, admin review and issuance UI, support ticket workflows, and production security testing remain future work.
