/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        // stage
        protocol: "https",
        hostname: "whitesmoke-cassowary-484409.hostingersite.com",
        port: "",
        pathname: "/**",
      },
      {
        // prod
        protocol: "https",
        hostname: "chocolate-scorpion-470541.hostingersite.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "prod-element-products.s3.us-west-2.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  }
};

module.exports = nextConfig;
