/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  webpack: (config, { __dirname }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname + '/src',
    };
    return config;
  },
};

module.exports = nextConfig;
