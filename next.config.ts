import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  ...(process.env.DOCKER_BUILD === "true" ? { output: "standalone" as const } : {}),
  allowedDevOrigins: ["127.0.0.1"],
  serverExternalPackages: ["firebase-admin"],
  async redirects() {
    return [
      {
        source: "/:locale(en|hi)/manifesto",
        destination: "/:locale#priorities",
        permanent: true,
      },
      {
        source: "/manifesto",
        destination: "/#priorities",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
