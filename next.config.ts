import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output produces a self-contained .next/standalone bundle
  // we copy into the runtime Docker layer — no need to ship node_modules.
  output: "standalone",
  // better-sqlite3 is a native module loaded directly from disk; mark it
  // external so Next doesn't try to bundle the .node file.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
