import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `better-sqlite3` is never imported here (we use the pure-JS libSQL store), so no native-addon
  // externals are needed. Keep the config minimal.
};

export default nextConfig;
