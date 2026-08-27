import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/terms", "/login"],
      disallow: ["/main-admin", "/member", "/superadmin", "/api"],
    },
    sitemap: "https://ugenyassociationeldoret.com/sitemap.xml",
  };
}
