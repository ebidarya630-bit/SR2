# SR2 setup and deployment

## Architecture
SR2 uses Next.js 15, Supabase PostgreSQL, Supabase Auth and a private Supabase Storage bucket. Authentication sessions are stored in secure cookies using @supabase/ssr. The service secret key is used only by the server-side administrator provisioning script; never expose it in browser code.

## Supabase project
The production project is aksvxjrweqgdecsoxomw in us-east-2 (Ohio). Database migrations are in supabase/migrations/. They create the platform tables, RLS policies, security helper functions, public certificate directory and private evidence bucket.

## Local development
1. Install Node.js 20 or newer.
2. Copy .env.example to .env.local.
3. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from the Supabase project's API settings.
4. Set SUPABASE_SECRET_KEY only in the private local environment. It must never use a NEXT_PUBLIC_ prefix or be committed.
5. Configure the Supabase Auth email provider / SMTP and make sure the email template sends the six-digit {{ .Token }} code expected by the registration screen. Set the site URL and redirect URL to http://localhost:3000 for local testing.
6. Run npm install.
7. Set ADMIN_EMAIL and a one-time ADMIN_PASSWORD (at least 14 characters), then run npm run admin:provision once. Remove the one-time password from the environment after provisioning.
8. Run npm run dev and open http://localhost:3000.

## Vercel deployment
1. Connect the GitHub repository ebidarya630-bit/SR2 to a Vercel project.
2. Set these environment variables for Production and Preview as appropriate: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY (server-only), and APP_URL (the production site URL).
3. Configure the production domain and allowed redirect URLs in Supabase Auth.
4. Configure custom SMTP in Supabase Auth and update the email template to send {{ .Token }} as the six-digit OTP.
5. Deploy and run npm run admin:provision securely once from a trusted environment to create the first administrator. Do not put ADMIN_PASSWORD in a committed file or a public deployment variable.
6. Verify registration, login, admin review, BSC claim, file uploads and public certificate search before opening the platform to users.

## Operational notes
- Keep SUPABASE_SECRET_KEY private. Only the publishable key may be used in browser-exposed variables.
- Certification evidence is stored in the private sr-private bucket. Object access is restricted by Storage RLS policies.
- BSC invitation tokens are single-use, stored only as SHA-256 hashes, and expire after seven days.
- Password reset, broader abuse monitoring, automated BSC invitation emails and full support messaging still need implementation.
- The SR scoring methodology is not independently validated. Do not issue numerical SR scores or certificates until a repeatable protocol and scoring model have been independently validated.
- Physical device shipment is optional and requires a separate, explicit agreement before shipping.
