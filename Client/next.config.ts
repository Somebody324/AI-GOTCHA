
import type {NextConfig} from 'next';
import type {Configuration as WebpackConfiguration} from 'webpack';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config: WebpackConfiguration, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // Prefer 'resolve.fallback' for Node.js core modules in Webpack 5+
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...(config.resolve?.fallback || {}),
          'async_hooks': false, // Tells Webpack to treat 'async_hooks' as an empty module on the client
        },
      };
    }
    return config;
  },
};

export default nextConfig;
