import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoBasePath = "/Slack-Clone";

const nextConfig: NextConfig = {
  ...(isGithubPages ? { output: "export" as const } : {}),
  basePath: isGithubPages ? repoBasePath : "",
  assetPrefix: isGithubPages ? `${repoBasePath}/` : undefined,
  trailingSlash: isGithubPages,
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? repoBasePath : "",
  },
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: path.join(path.dirname(fileURLToPath(import.meta.url))),
};

export default nextConfig;
