# SR2 — Sunlight Readability Certification

A global platform concept for evaluating smartphone display readability in bright sunlight and publishing independently reviewed SR certificates.

## Initial architecture

- **Database:** PostgreSQL on Supabase.
- **Authentication:** Supabase Auth (email + password, email confirmation/OTP configured in the Supabase dashboard). Passwords are never stored in application tables.
- **Files:** private Supabase Storage buckets for test videos, submitted photos and supporting files; a separate publication workflow for approved public images.
- **Roles:** user, brand, admin. Admin role must be granted server-side; never allow a client to promote itself.
- **Brand identity:** manual BSC issuance. Codes use the `BSC-` prefix and claim links use random one-time tokens; only token hashes are stored.
- **Certificates:** public lookup by unique `SR-...` code; only active certificates are public.
- **Support:** ticket and message tables, with private internal notes for admins.

## Database setup

1. Create a Supabase project.
2. Install the Supabase CLI and link the project.
3. Put the migration at `supabase/migrations/202611250001_initial_schema.sql` (already included).
4. Run `supabase db push`.
5. In Supabase Auth, enable email/password sign-in and email confirmation. Configure an SMTP provider before production; the Gmail address in the product brief is a contact mailbox, not an SMTP credential.
6. Create private Storage buckets: `brand-logos`, `application-private`, and `publication-assets`. Add Storage policies after the frontend/API flow is implemented.
7. Create the first admin by signing up normally, then promote that user's profile to `admin` using the Supabase SQL editor as the project owner. Do not seed an admin password in GitHub or SQL.

## Product workflow represented in the schema

1. User signs up with email/password, confirms email, then chooses a unique username.
2. A brand creates its profile and submits official contact information.
3. A brand without a BSC can submit a request. Admin reviews the official email evidence, creates a BSC code, and issues a time-limited one-time claim link. The brand opens the link and claims the code.
4. Verified brand members submit a certification application with device specifications, test video, submitted images, publication images and supporting files.
5. Shipping a device is optional. The consent field is explicit; if a device is sent under the stated archive policy, the record captures that consent and receiving details.
6. Admin reviews evidence and test results, then issues a unique SR code and a score from 1–100.
7. Active certificates become searchable/public; the brand can use the certification mark only under a separately defined license/usage policy.

## Important production requirements

- The database schema is a foundation, not a deployed service. Configure Supabase, SMTP, storage, domain, frontend and server-side workflows before launch.
- Never expose Supabase service-role keys in browser code.
- Implement BSC token creation/claiming and SR issuance in trusted server functions, with rate limits and audit logs.
- Add abuse prevention, privacy policy, terms, retention/deletion rules, evidence review procedures and a clear appeals process.
- Define a repeatable scientific test protocol (brightness in nits, ambient illuminance in lux, reflections, auto-brightness, temperature, test pattern, measurement equipment and repeatability). An SR score should not be presented as objective or industry-recognized until the protocol is validated and independently documented.
- Clarify what “nit” and “lux” fields mean in the application; they are separate physical measurements.

## Security note

No passwords, SMTP credentials, service-role keys, BSC claim tokens or private test assets belong in this repository.
