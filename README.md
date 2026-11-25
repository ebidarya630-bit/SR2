# SR2 — Sunlight Readability Certification Platform

SR2 is the software foundation for an independent smartphone-display sunlight-readability assessment and public certificate registry.

## Product principles
- Independent measurement, not manufacturer-claimed peak brightness.
- Public verification by unique `SR-` certificate code.
- Brand identity verification using one-time `BSC-` claim links.
- Evidence-based review with an auditable decision trail.
- No certificate or numerical score until the test method and scoring model are validated.

## Technology
Next.js 15, React 19, TypeScript, Supabase Auth, PostgreSQL and Row Level Security.

## Setup
See [docs/SETUP.md](docs/SETUP.md). Never commit `.env.local`, Supabase service-role keys, SMTP credentials, or administrator passwords.

## Scientific protocol
Read [docs/SR-METHODOLOGY.md](docs/SR-METHODOLOGY.md). Version 0.1 is a draft laboratory protocol, not an accreditation claim or a validated scoring algorithm.

## Current status
The repository contains the initial application shell, Supabase schema, and a follow-up security migration. It is not yet deployed or connected to a Supabase project. Authentication, email delivery, storage, admin provisioning, and end-to-end workflows require environment setup and testing before production use.
