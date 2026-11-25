# SR2 setup and deployment

## Architecture

SR2 currently uses Next.js with a local SQLite database (better-sqlite3), bcrypt password hashing, and signed HTTP-only sessions. Supabase is not required.

## Local development

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local`.
3. Set a unique `SESSION_SECRET` (at least 32 characters).
4. Set a new private `ADMIN_PASSWORD` (at least 14 characters); do not reuse a password posted in chat.\n5. Configure `RESEND_API_KEY` and `RESEND_FROM` using a Resend account and a sender domain verified by that provider.
5. Run `npm install`.
6. Run `npm run admin:provision` once to create the administrator.
7. Run `npm run dev` and open `http://localhost:3000`.

The database is created automatically at `DATABASE_PATH`. Uploaded evidence is stored under `UPLOADS_DIR`.

## Render deployment

The repository includes `render.yaml`, a Render Blueprint for a Node web service with a persistent disk. The disk is required because SQLite and uploaded certification evidence must survive restarts and deployments.

1. Open the Render Blueprint dashboard and connect this GitHub repository: https://dashboard.render.com/blueprints
2. Select the `main` branch and review the Blueprint.
3. Set `ADMIN_PASSWORD` to a new unique password when prompted. Do not reuse any password previously shared in chat.
4. Apply the Blueprint. Render generates `SESSION_SECRET` automatically.
6. After the service is live, open its Shell and run `npm run admin:provision` once. This creates the admin user in the persistent SQLite database.
7. Sign in at `/login`.

The Blueprint uses a paid Starter web service because Render persistent disks require a paid service. The disk is mounted at `/var/data`, with the SQLite file and uploads stored beneath it. A disk-backed service runs as a single instance and deploys may cause a brief interruption. Review current Render pricing before applying.

## Important operational notes

- Back up the SQLite database regularly using SQLite's online backup API or another database-consistent backup procedure. Do not rely solely on filesystem snapshots.
- Keep `SESSION_SECRET` and `ADMIN_PASSWORD` private. Never commit `.env.local` or real credentials.
- User registration now requires a one-time email code (10-minute expiry, maximum five attempts). Email delivery requires `RESEND_API_KEY` and a verified `RESEND_FROM` sender. Password reset, request throttling, automated BSC issuance emails, and full support messaging still need implementation.
- Certification evidence uploads are stored on the persistent disk. Access-controlled download endpoints and retention controls still need to be completed before accepting sensitive production evidence.
- The SR scoring methodology is not independently validated. Do not issue numerical SR scores or certificates until a repeatable protocol and scoring model have been independently validated.
- Physical device shipment is optional and requires a separate, explicit agreement before shipping.
