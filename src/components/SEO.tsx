import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  jsonLd?: Record<string, unknown>;
}

const SITE_URL = "https://callshivai.com";
// 1600×900 share banner (≈150 KB — WhatsApp ignores preview images over ~300 KB).
// Must be on www: the bare callshivai.com host only redirects "/".
const OG_IMAGE = "https://www.callshivai.com/og-shivai.jpg";

export default function SEO({ title, description, path, jsonLd }: SEOProps) {
  const url = `${SITE_URL}${path}`;

  // index.html carries static copies of the preview tags for crawlers that don't run JS;
  // once React is up, Helmet owns them — drop the static copies so there are no duplicates.
  useEffect(() => {
    document.querySelectorAll("[data-static-og]").forEach((el) => el.remove());
  }, []);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1600" />
      <meta property="og:image:height" content="900" />
      <meta property="og:image:alt" content="ShivAI — Every business will soon need to hire an AI employee" />

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={OG_IMAGE} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
