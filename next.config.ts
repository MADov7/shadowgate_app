import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // netlify.toml [[headers]] only reach static files on Netlify; server-rendered pages and API routes get this from Next.
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }] }];
  },
};

export default nextConfig;
