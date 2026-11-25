# SR2 setup and deployment

## Architecture
SR2 runs on Next.js 15 with the OpenNext Cloudflare adapter. Cloudflare D1 stores application records and Cloudflare R2 stores private certification evidence. Passwords are bcrypt-hashed and sessions use signed HTTP-only cookies.

## Cloudflare resources
- D1 database: `sr2-production` (binding: `DB`)
- R2 bucket: `sr2-evidence` (binding: `SR2_EVIDENCE`)
- Worker name: `sr2-platform`

The Wrangler configuration is in `wrangler.jsonc`. Do not change the D1 database ID unless intentionally switching databases.

## First-time setup
1. Create the D1 database named `sr2-production` in Cloudflare.
2. Create an R2 bucket named `sr2-evidence`.
3. Install Node.js 20 or newer, then run `npm install`.
4. Copy `.env.example` to `.env.local`.
5. Set a random `SESSION_SECRET` with at least 32 characters, a unique `ADMIN_PASSWORD` with at least 14 characters, and the correct `RESEND_API_KEY` and verified `RESEND_FROM` sender.
6. Apply the database schema with `npm run db:migrate:remote`.
7. Provision the administrator with `npm run admin:provision`. This command writes only the bcrypt hash to D1; it never sends the plaintext password to Wrangler.
8. Preview the Cloudflare runtime with `npm run cf:preview`, then deploy with `npm run cf:deploy`.

For local development, `npm run dev` uses Wrangler's local D1/R2 simulations. Apply the local schema with `npm run db:migrate:local`. Local and remote databases are separate.

## Cloudflare Git integration
Connect this GitHub repository to Cloudflare Workers Builds and select the production branch after the migration branch has been reviewed and merged. Build command: `npm ci && npm run cf:build`. Deploy command: `npx opennextjs-cloudflare deploy`. Configure `SESSION_SECRET`, `RESEND_API_KEY`, and `RESEND_FROM` as Worker secrets/variables in Cloudflare. Never commit `.env.local` or real credentials.

## Email delivery
Resend requires a verified sender identity. The support inbox `bscmailcode@gmail.com` is not automatically a valid sending identity.

## Evidence security
Certification videos and evidence are written to the private R2 bucket. Publicly accessible download routes and retention/deletion controls must be implemented and reviewed before production evidence is accepted. Do not make the bucket public.

## Important scientific limitation
The SR scoring methodology is not independently validated. Do not issue numerical SR scores or certificates until a repeatable protocol and scoring model have been independently validated. Physical device shipment is optional and requires a separate, explicit agreement.
