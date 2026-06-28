/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tree-shake barrel imports from heavy libs so routes only ship what they use.
  experimental: {
    optimizePackageImports: ['recharts'],
  },
};

export default nextConfig;
