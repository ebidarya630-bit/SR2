# SR2 setup guide

## 1. Create the Supabase project
Create a project in Supabase and copy its Project URL, anon/public key and service_role key from Project Settings → API.

## 2. Apply the database migration
Use Supabase CLI and run the migration in supabase/migrations/202611250001_initial_schema.sql. The migration creates the initial platform tables, indexes and row-level security policies.

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
The public landing page, basic email/password registration and login, confirmation callback, user dashboard shell, protected admin dashboard shell and brand/about/support/phone-registry information pages are included. Supabase project provisioning, SMTP configuration, real brand onboarding, BSC claim links, complete admin workflows, ticket messaging, username setup, translations, phone search and certificate issuance still require implementation and deployment.
