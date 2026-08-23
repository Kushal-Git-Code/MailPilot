/** @type {import('next').NextConfig} */
const nextConfig = {
  // /shared has no build step — it's raw TypeScript source consumed via a
  // local file: dependency. transpilePackages tells webpack to compile it
  // directly rather than expecting pre-built JS.
  transpilePackages: ["shared"],
  webpack: (config) => {
    // shared/src uses NodeNext-style ".js" specifiers for its own internal
    // imports (e.g. "./label.js" resolving to "label.ts") — tsc's
    // "bundler" resolution accepts this automatically, but webpack doesn't
    // unless told to also try .ts/.tsx for a ".js" specifier.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
