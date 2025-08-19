// apps/web/next.config.mjs
export default {
  reactStrictMode: true,
  images: { domains: ['localhost'] },
  async rewrites() {
    return [{ source: '/api/:path*', destination: 'http://api:8080/:path*' }];
  },
};
