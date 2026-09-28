import { HOME_DESCRIPTION, SITE } from "$lib/seo";
import type { PageSeoOverride } from "$lib/seo";

// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
export const prerender = true;

export const load = (): { seo: PageSeoOverride } => ({
  seo: {
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE.name,
      url: SITE.origin,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: HOME_DESCRIPTION,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  },
});
