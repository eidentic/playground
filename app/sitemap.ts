import type { MetadataRoute } from "next";

const SITE_URL = "https://try.eidentic.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
