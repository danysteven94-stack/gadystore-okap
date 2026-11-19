import type { MetadataRoute } from "next";

// Boutik piblik yo endèksab; API ak paj jesyon yo pa.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/boutik/", "/privacy", "/terms"],
        disallow: [
          "/api/", "/dashboard", "/pos", "/products", "/orders", "/stock", "/users", "/security",
          "/backup", "/reports", "/returns", "/subscriptions", "/user-billing", "/verify/",
          "/login", "/forgot-password", "/reset-password", "/change-password",
        ],
      },
    ],
  };
}
