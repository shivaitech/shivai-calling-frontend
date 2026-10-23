# Card share route (WhatsApp / Facebook / LinkedIn previews with the profile photo)

The website is a static SPA on AWS Amplify. Link-preview crawlers don't run
JavaScript, so a pasted card link shows no photo. Amplify-hosted sites can't use
Lambda@Edge, so previews come from a small server route instead:

```
https://<share-host>/<slug>
   crawler (WhatsApp, Facebook, …) → 200 + og:title / og:description / og:image
   a person                        → 302 → https://www.callshivai.com/card/<slug>
```

`cardShare.js` is dependency-free (Node 14+) and has been tested against the live API.
Pick ONE way to run it.

## Option A — mount it in the existing Node backend (recommended)

In the backend (the service behind `nodejs.service.callshivai.com`), copy
`cardShare.js` next to the routes and add — **before any auth middleware**, the
route must be public:

```js
const { expressHandler } = require("./cardShare");
app.get("/api/v1/card-share/:slug", expressHandler);
```

Optional env vars on the backend: `API_BASE` (defaults to the live API),
`SITE_URL` (`https://www.callshivai.com`), `CARD_SUBDOMAINS=true`
(redirect people to `https://<slug>.callshivai.com` instead of `/card/<slug>`).

Share base URL → `https://nodejs.service.callshivai.com/api/v1/card-share`

## Option B — standalone Lambda (no backend change)

1. Lambda → Create function → Node.js 20 → upload `cardShare.js` (+ `package.json`).
2. Handler: `cardShare.lambdaHandler`. Timeout 10 s, 128 MB. No role permissions needed.
3. Configuration → Function URL → Auth type **NONE** → Save.
4. Share base URL → the Function URL, e.g. `https://abc123.lambda-url.ap-south-1.on.aws`
   (the slug is the last path segment).

## Turn it on in the app

In Amplify → Hosting → **Environment variables** add

```
VITE_CARD_SHARE_URL = <share base URL from above, no trailing slash>
```

and redeploy `main`. From then on **Copy link, WhatsApp share and the QR code**
use `<share base>/<slug>`; people who tap it are redirected to the card.
Leave the variable unset to share the plain card URL (no photo preview).

A prettier link (e.g. `https://card.callshivai.com/<slug>`) is possible later by
pointing a custom domain at the backend / Function URL and using that as the base.

## Test

```bash
# what WhatsApp sees — should print og:title / og:image with the profile photo
curl -s -A "WhatsApp/2.23" <share base>/<slug> | grep og:

# what a person gets — 302 with Location: https://www.callshivai.com/card/<slug>
curl -sI <share base>/<slug>
```

WhatsApp caches previews aggressively. To re-test a link that already showed a bad
preview, add `?v=2`, or use https://developers.facebook.com/tools/debug/ → *Scrape Again*.

## Notes

- Photos: WhatsApp shows a large preview for images ≥ ~600 px wide and ignores
  images over ~300 KB. The app resizes uploads to fit (≤ 1200 px, ≤ 280 KB).
- Cards without a photo fall back to `https://www.callshivai.com/Shivai1.png`.
- Unknown slugs return 404; if the API is slow/down the route redirects to the card
  page instead of failing.
- This replaces `infra/card-og-edge` (Lambda@Edge), which only works if you control
  the CloudFront distribution — Amplify-managed distributions don't allow it.
