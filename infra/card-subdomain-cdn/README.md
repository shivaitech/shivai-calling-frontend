# Pretty card links with rich WhatsApp previews: `https://<slug>.callshivai.com`

**Goal:** share `https://raheem-shivai.callshivai.com` and have WhatsApp show Raheem's
photo, name and tagline (not the generic ShivAI banner), while people who tap it get
the normal card page.

**Why it needs this:** `*.callshivai.com` currently points at Amplify's own CloudFront.
Amplify can't run per-request code, so a crawler (which doesn't run JavaScript) only
ever sees the generic page. We put **our own CloudFront** in front of Amplify for the
wildcard and attach the Lambda@Edge from `../card-og-edge` (it already understands
`<slug>.callshivai.com/`).

```
WhatsApp crawler ─▶ *.callshivai.com ─▶ our CloudFront ─▶ Lambda@Edge: bot? → card's og tags (photo, name)
person's browser ─▶ *.callshivai.com ─▶ our CloudFront ─▶ not a bot → passes through → Amplify (the app)
                                                                        └▶ app sees the subdomain and shows the card
```

`www.callshivai.com` and the root domain are **not touched** — only the wildcard moves.

## Steps (about 30–45 min, most of it waiting)

1. **Certificate** — ACM in **us-east-1** → Request public certificate for
   `*.callshivai.com` → DNS validation. Add the CNAME ACM shows at GoDaddy; wait for *Issued*.
2. **Deploy the Lambda** — follow "One-command deploy" in `../card-og-edge/README.md`
   (stack `shivai-card-og-edge`, region us-east-1). Copy its `VersionArn` output.
3. **Free the wildcard in Amplify** — Amplify → Domain management → `callshivai.com` →
   remove the `*` subdomain entry. (CloudFront refuses the alias while another distribution
   claims it. `www` and the root stay.)
4. **Deploy the CDN** (region us-east-1):
   ```bash
   aws cloudformation deploy --region us-east-1 \
     --template-file infra/card-subdomain-cdn/template.yaml \
     --stack-name shivai-card-subdomains \
     --parameter-overrides \
       CertificateArn=<acm-cert-arn> \
       AmplifyOriginDomain=<main.xxxxxxxx.amplifyapp.com> \
       EdgeFunctionVersionArn=<VersionArn from step 2>
   aws cloudformation describe-stacks --region us-east-1 \
     --stack-name shivai-card-subdomains --query "Stacks[0].Outputs"
   ```
   `AmplifyOriginDomain` is the app's default Amplify domain (no `https://`) — see
   Amplify → App settings → Domain management / the branch URL. It takes ~10 min to deploy.
5. **GoDaddy DNS** — change the wildcard record: `CNAME  *  →  <DistributionDomain output>`
   (replace the one that points at Amplify's `…cloudfront.net`).
6. **Test**
   ```bash
   # what WhatsApp sees on a card subdomain — should print the card's og:title / og:image
   curl -sL -A "WhatsApp/2.23" https://<slug>.callshivai.com/ | grep og:
   # what a person gets — the normal app
   curl -sI https://<slug>.callshivai.com/
   ```

## Then switch the app to the pretty link (Amplify → Environment variables)

| Variable | Value |
|---|---|
| `VITE_CARD_SUBDOMAINS` | `true` |
| `VITE_CARD_SHARE_URL` | **delete it** (it makes links point at the backend) |

Redeploy `main`. Copy link / WhatsApp / QR now use `https://<slug>.callshivai.com`.
Until step 5 is done, keep `VITE_CARD_SHARE_URL` as it is — links work, just long.

WhatsApp caches previews: test with a card that was never shared, or Facebook's
Sharing Debugger → *Scrape Again*.

## Limits

- The subdomain is the card's **slug** (`name-company`, e.g. `raheem-shivai`), not a free
  username like `athar`. A short username would need a username field on the backend.
- A DNS label holds at most 63 characters, so a card with a longer slug keeps a `/card/<slug>` link.
- The backend share route (`infra/card-share`) can stay as a fallback; it is no longer the share link.
