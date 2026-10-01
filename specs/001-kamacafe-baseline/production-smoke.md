# Production Smoke and Manual Accessibility Results

Complete this document after T061 deploys the reviewed production revision. Record no credentials, tokens, session values, or Terraform state.

## Deployment under test

- Revision:
- Canonical HTTPS URL:
- Date/time and timezone:
- Phone model and OS:
- Safari version:
- Network profile:

## Real-phone flow

- [ ] `/` loads through Cloudflare over HTTPS.
- [ ] `/#category-espresso-drink` opens directly and survives refresh.
- [ ] `/#espresso` opens directly and survives refresh.
- [ ] Browser Back and Forward keep the URL and displayed view synchronized.
- [ ] An espresso-based guide contains complete inherited inputs and steps.
- [ ] A brewed-coffee guide contains complete inputs and steps.
- [ ] `index.html` responds with `Cache-Control: no-cache`.
- [ ] Content-hashed JS/CSS responds with `public, max-age=31536000, immutable`.
- [ ] Stable PNGs use the configured finite TTL.

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

## Exceptions and follow-up

Record any failure, approved exception, linked issue, owner, and removal plan here.
