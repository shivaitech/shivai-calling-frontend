# Card link previews (WhatsApp / Facebook / LinkedIn / Slack …)

**Problem:** `www.callshivai.com` is a static SPA on S3 + CloudFront. Link-preview
crawlers don't run JavaScript, so every `/card/<slug>` link shows the generic
site page (and CloudFront answers it with HTTP 404). The card photo never appears.

**Fix:** `index.js` is a Lambda@Edge **viewer-request** function. For crawler
User-Agents hitting `/card/<slug>` it calls the public API
(`GET /business-cards/public/:slug`) and returns a tiny HTML page with
`og:title` (name – role, company), `og:description` (tagline) and
`og:image` (profile photo). Everyone else passes through to the SPA unchanged.
Unknown slugs and API errors also pass through (never breaks a link).

## Deploy (needs AWS access — not done from this repo)

1. **Lambda** — region **us-east-1** (required for Lambda@Edge), runtime Node.js 20,
   upload `index.js` + `package.json` (zip them), handler `index.handler`,
   timeout 5s, memory 128 MB. Execution role: the standard
   `AWSLambdaBasicExecutionRole` plus a trust policy for `edgelambda.amazonaws.com`.
2. **Publish a version** (Lambda@Edge needs a numbered version, not `$LATEST`).
3. **CloudFront** → the distribution for `www.callshivai.com` → **Behaviors** →
   create a behavior with path pattern `/card/*` (and a second one for `/digital-card`, the shareable app-invite link — same Lambda) (same origin as the default one,
   same cache settings) → **Function associations** → *Viewer request* →
   Lambda@Edge → the version ARN from step 2.
4. Wait for the distribution to finish deploying.
5. **Test:** `curl -A "WhatsApp/2.23" https://www.callshivai.com/card/<slug>` should
   print `og:title` / `og:image`. Then paste a card link into WhatsApp.
   WhatsApp caches previews hard — to re-test a link that already showed a bad
   preview, add a throwaway query string (`?v=2`) or use
   https://developers.facebook.com/tools/debug/ → *Scrape Again*.

## Related CloudFront settings (recommended)

- **Custom error responses:** map 403 and 404 → `/index.html` with **HTTP 200**.
  Today deep links render but are answered with status 404, which some crawlers
  and search engines treat as "page not found".
- The bare domain `callshivai.com` should redirect to `www` for every path
  (it currently only redirects `/`), otherwise links without `www` return
  "Not Found".

## Notes

- Image requirements: `https`, publicly readable. WhatsApp shows a large preview for
  images ≥ 600 px wide and a small thumbnail for smaller ones — the app's photo
  upload keeps the original size, so a bigger photo gives a bigger preview.
- Cards without a photo fall back to `https://www.callshivai.com/Shivai1.png`.
- Previews are cached 5 minutes at the edge (`Cache-Control: max-age=300`), so a
  renamed card or new photo shows up in new shares within a few minutes.
- Local test: `node -e "require('./index.js').handler(...)"` with a CloudFront
  viewer-request event (see git history of this folder for the test used).

## One-command deploy (CloudFormation)

`template.yaml` creates the role, the function and a published version. Needs the
AWS CLI configured with permission for IAM, Lambda, CloudFormation and S3.

```bash
cd infra/card-og-edge
# any bucket you own (the code zip is uploaded here); region MUST be us-east-1
aws cloudformation package --region us-east-1 \
  --template-file template.yaml --s3-bucket <your-bucket> \
  --output-template-file packaged.yaml
aws cloudformation deploy --region us-east-1 \
  --template-file packaged.yaml --stack-name shivai-card-og-edge \
  --capabilities CAPABILITY_IAM
aws cloudformation describe-stacks --region us-east-1 \
  --stack-name shivai-card-og-edge --query "Stacks[0].Outputs"
```

Copy the `VersionArn` output, then in **CloudFront → distribution for
www.callshivai.com → Behaviors** create two behaviors (`/card/*` and
`/digital-card`, same origin/cache settings as the default one) and add the ARN
under **Function associations → Viewer request → Lambda@Edge**.
The distribution itself is not created by this template, so nothing existing is modified.

To ship a code change later: edit `index.js`, rename the `CardOgFunctionVersionV1`
resource in `template.yaml` to `...V2`, re-run the three commands, and update the
ARN on both behaviors.
