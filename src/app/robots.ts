import type { MetadataRoute } from "next";

/** Test deployment: keep this copy out of search indexes. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
