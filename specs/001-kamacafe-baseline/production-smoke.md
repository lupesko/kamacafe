# Production Smoke and Manual Accessibility Results

Complete this document after T019 promotes the reviewed immutable Worker
version. Record no credentials, tokens, session values, or private provider
responses.

## Deployment under test

- Revision:
- Candidate version ID:
- Candidate Version URL:
- Candidate Version URL sends `X-Robots-Tag: noindex`: PENDING
- Active production version ID:
- Candidate/production version IDs match: PENDING
- Canonical HTTPS URL: https://kamacafe.lupesko.com
- Approver:
- Date/time and timezone:
- Phone model and OS:
- Safari version:
- Network profile:

## Real-phone flow

- [ ] `/` loads through Cloudflare over HTTPS.
- [ ] `http://kamacafe.lupesko.com/redirect-check?source=kamacafe` redirects to the equivalent HTTPS path and query.
- [ ] `/#category-espresso-drink` opens directly and survives refresh.
- [ ] `/#espresso` opens directly and survives refresh.
- [ ] `/__kamacafe_missing__` returns HTTP 404 without the application shell.
- [ ] Browser Back and Forward keep the URL and displayed view synchronized.
- [ ] An espresso-based guide contains complete inherited inputs and steps.
- [ ] A brewed-coffee guide contains complete inputs and steps.
- [ ] `/` and `index.html` respond with `max-age=0, must-revalidate`.
- [ ] Content-hashed JS/CSS responds with `public, max-age=31536000, immutable`.
- [ ] Stable PNGs respond with `public, max-age=86400`.
- [ ] Root responses include the contracted MIME-sniffing, framing, referrer, and permissions headers.
- [ ] The social image is `image/png`, 1200×630, and its metadata uses the canonical origin.

## Ten cold mobile measurements

Use the agreed mid-range phone and typical 4G profile. Record the moment essential text guidance becomes usable.

| Run | Seconds | ≤3 seconds? |
|---:|---:|:---:|
| 1 |  |  |
| 2 |  |  |
| 3 |  |  |
| 4 |  |  |
| 5 |  |  |
| 6 |  |  |
| 7 |  |  |
| 8 |  |  |
| 9 |  |  |
| 10 |  |  |

- Passing runs:
- Result (requires at least 9/10):

## Safari keyboard and VoiceOver

- [ ] Home has one logical `h1`; both category links are named and operable.
- [ ] Category has one logical `h1`, an accurate count, a named back link, and named drink links.
- [ ] Drink has one logical `h1`, readable facts, “What you need,” and an ordered “How to make it” list.
- [ ] Unavailable route announces a clear heading and exposes “Return home.”
- [ ] Project, issue, and contribution links are named and keyboard operable.
- [ ] Focus is visible and follows a predictable order.
- [ ] No required guidance depends on color or imagery.
- [ ] No horizontal scrolling occurs at the tested phone width.

## Rollback drill

- From version ID:
- Target known-good version ID:
- Authorized by:
- Start time:
- Verified time:
- Duration (requires ≤5 minutes):
- [ ] Target became the only active 100% version without a rebuild.
- [ ] Canonical routes, headers, metadata, image, and active version passed verification.
- [ ] Intended current version was restored and verified afterward.

## Social preview inspectors

| Inspector | Checked at | Release version | Result | Cache refresh |
|---|---|---|---|---|
| Open Graph inspector 1 |  |  |  |  |
| Open Graph inspector 2 |  |  |  |  |
| Large-image card inspector |  |  |  |  |

## Exceptions and follow-up

Record any failure, approved exception, linked issue, owner, and removal plan here.
