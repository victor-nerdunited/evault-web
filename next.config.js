/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  // images: {
  //   remotePatterns: [
  //     {
  //       protocol: "https",
  //       hostname: "images.pexels.com",
  //       port: "",
  //       pathname: "/**",
  //     },
  //     {
  //       protocol: "https",
  //       hostname: "images.unsplash.com",
  //       port: "",
  //       pathname: "/**",
  //     },
  //   ],
  // },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.chec.io",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
