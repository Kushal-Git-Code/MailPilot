/** @type {import('next').NextConfig} */
const nextConfig = {
  // /shared has no build step — it's raw TypeScript source consumed via a
  // local file: dependency. transpilePackages tells webpack to compile it
  // directly rather than expecting pre-built JS.
  transpilePackages: ["shared"],
};

export default nextConfig;
