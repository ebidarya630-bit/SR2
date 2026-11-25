# SR2 setup guide

## 1. Create the Supabase project
Create a project in Supabase and copy its Project URL, anon/public key and service_role key from Project Settings → API.

## 2. Apply the database migration
Use Supabase CLI and apply every SQL migration in `supabase/migrations/` in filename order. The initial schema is followed by security hardening and BSC-claim binding migrations. Review the SQL against your Supabase project's current state before applying it to production. The migrations create tables, indexes, row-level security policies, guarded write triggers, and the one-time BSC claim RPC.

## 3. Configure email confirmation
In Supabase Authentication settings enable email/password sign-up and email confirmation. Configure a production SMTP provider and customize the confirmation email template. Do not use a personal mailbox password as an SMTP credential.

## 4. Configure the app
Copy .env.example to .env.local and fill in the Supabase URL and anon key. Keep SUPABASE_SERVICE_ROLE_KEY server-only. Never commit .env.local.

## 5. Provision the administrator
Choose a NEW strong password that has never been shared in chat. Put ADMIN_EMAIL and ADMIN_PASSWORD temporarily in .env.local, alongside SUPABASE_SERVICE_ROLE_KEY. Run npm install, then npm run admin:provision. The script creates or updates the auth user and sets profiles.role to admin. Remove ADMIN_PASSWORD from the environment after the command finishes. The admin signs in through the normal /login page and is routed to /admin.

The script uses the service-role key and must only run in a trusted local/server environment. Never expose that key to the browser.

## 6. Run locally
Run npm run dev and open http://localhost:3000.

## Current implementation status
The public landing page, basic email/password registration and login, confirmation callback, user dashboard shell, protected admin dashboard shell and brand/about/support/phone-registry information pages are included. Database hardening and the atomic one-time BSC claim function are present in follow-up migrations. Supabase project provisioning, SMTP configuration, server-side BSC issuance/email delivery, full brand onboarding, complete admin workflows, ticket messaging, username setup, translations, phone search and certificate issuance still require implementation and deployment. The SR scoring method is a draft and must not be used to issue numerical scores until independently validated.
