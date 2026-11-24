/** @type {import('next').NextConfig} */
const config = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(process.env.JW_PROJECT_ROOT
    ? { turbopack: { root: process.env.JW_PROJECT_ROOT } }
    : {}),
  poweredByHeader: false,
  agentRules: false,
};
export default config;
