# SR Certification — Product requirements

## Public experience
- Premium light interface: white surfaces, warm orange accents, accessible contrast and responsive layout.
- English default with language switcher and translation-ready content.
- Navigation: Home, Phone database, About, How it works, Support, Sign in, Brand portal.
- Public phone search by manufacturer, model and SR code. Show only active certificates and publication-approved media.
- Explain that SR is a sunlight-readability score from 1 to 100, backed by a published testing protocol.

## Accounts
### Individual users
- Email + password registration.
- Email confirmation code/link before activation.
- Username selection after email confirmation.
- Profile, saved devices (future), support tickets and account blocking state.

### Brands
- Brand name, logo, official email, website, founding date and legal identity details.
- Brand dashboard requires a claimed BSC identity code before certification submission.
- “Request a BSC code” creates a review request. The brand contacts bscmailcode@gmail.com from its official domain mailbox for manual verification.
- Admin-generated code format: BSC-<admin-selected-suffix>. Claim URL must contain a high-entropy, single-use, expiring token. The claim page reveals the code only after validating the token; the user explicitly claims it.

## Certification submission
- Full device information, exact model, release date and complete test video.
- Submitted images, separately identified publication images, supporting files.
- Measurement fields include nits and lux with clear definitions in the final protocol.
- Optional device shipment. Before shipment, show an explicit acknowledgement that a submitted device will not be returned and will remain in the studio archive for additional testing. Store consent and timestamp.
- Shipping contact details are collected only when shipment is selected.
- Studio contact: Saturn Studio; bscmailcode@gmail.com; Asia, Iran, Hormozgan, Qeshm Island, Dargahan. Email response window: 10:00–22:00 Iran time.
- Admin review target: up to 30 days, with status updates. Avoid promising a fixed completion time where retesting or missing evidence may delay review.

## Certificate and public mark
- Admin records the final SR score (1–100), manually assigns a unique SR-***** code, and issues an active certificate.
- Public search page resolves SR code to the exact device and brand.
- Mark/logo usage must be controlled by a published license and usage guide; the mark is only authorized for the exact model and certificate status shown.

## Admin portal
- BSC code factory: choose suffix, associate brand/request, set expiry, create secure claim link and record delivery status.
- BSC request queue and brand verification.
- Application review queue, evidence viewer, internal notes, request-more-information, approve/reject.
- Certificate issuance, SR code assignment, score, suspension/revocation.
- Support inbox and replies.
- User/brand directory, block/unblock with reason.
- Site appearance and copy settings, language content, audit log, analytics and operational settings.

## Open decisions before implementation
- Define the SR measurement protocol and scoring formula before awarding real-world certificates.
- Clarify the intended meaning and units of the brief's “نیت” and “لوکس” fields (likely nit and lux measurements).
- Decide whether brand registration itself is automatically accepted as a pending profile or requires separate legal verification.
- Confirm the permanent device-retention policy and shipping/legal wording for international submissions.
