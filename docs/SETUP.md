# SR2 setup and deployment

## Architecture
SR2 uses Next.js, SQLite (better-sqlite3), bcrypt password hashing and signed HTTP-only sessions. Supabase is not required.

## Local development
1. Install Node.js 20 or newer.
2. Copy .env.example to .env.local.
3. Set a unique SESSION_SECRET (at least 32 characters).
4. Set a new private ADMIN_PASSWORD (at least 14 characters). Never reuse a password shared in chat.
5. Configure RESEND_API_KEY and RESEND_FROM using a Resend account and a sender domain verified by that provider.
6. Run npm install.
7. Run npm run admin:provision once to create the administrator.
8. Run npm run dev and open http://localhost:3000.

The database is created automatically at DATABASE_PATH. Uploaded evidence is stored under UPLOADS_DIR.

## Render deployment
1. Open the Render Blueprint dashboard: https://dashboard.render.com/blueprints
2. Connect this GitHub repository and select the main branch.
3. Set ADMIN_PASSWORD to a new unique private password.
4. Set RESEND_API_KEY and RESEND_FROM to credentials for a sender identity verified by Resend. The support inbox bscmailcode@gmail.com is not automatically a valid sending identity.
5. Apply the Blueprint. Render generates SESSION_SECRET automatically.
6. After the service is live, open its Shell and run npm run admin:provision once. This creates or updates the administrator in the persistent SQLite database.
7. Sign in at /login.

The Blueprint uses a paid Starter web service because Render persistent disks require a paid service. The disk is mounted at /var/data; SQLite and uploads are stored there. A disk-backed service runs as a single instance and deployments may cause a brief interruption. Review current Render pricing before applying.

## Important operational notes
- Back up SQLite regularly using its online backup API or another database-consistent backup procedure.
- Keep SESSION_SECRET, ADMIN_PASSWORD and Resend credentials private. Never commit .env.local or real credentials.
- User registration requires a one-time email code with a 10-minute expiry, five-attempt limit and request throttling. Email delivery requires RESEND_API_KEY and a verified RESEND_FROM sender.
- Password reset, broader abuse monitoring, automated BSC invitation emails and full support messaging still need implementation.
- BSC invitations are single-use links, expire after seven days and must be claimed by a signed-in member of the relevant brand.
- Certification evidence uploads are stored on the persistent disk. Access-controlled download endpoints and retention controls must be completed before accepting sensitive production evidence.
- The SR scoring methodology is not independently validated. Do not issue numerical SR scores or certificates until a repeatable protocol and scoring model have been independently validated.
- Physical device shipment is optional and requires a separate, explicit agreement before shipping.
