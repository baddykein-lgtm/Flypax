/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/directorio",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;