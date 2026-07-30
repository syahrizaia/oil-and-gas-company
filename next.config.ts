/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/unity/:path*.gz',
        headers: [
          { key: 'Content-Encoding', value: 'gzip' },
        ],
      },
      {
        source: '/unity/:path*.br',
        headers: [
          { key: 'Content-Encoding', value: 'br' },
        ],
      },
      {
        source: '/unity/:path*.wasm.gz',
        headers: [
          { key: 'Content-Type', value: 'application/wasm' },
          { key: 'Content-Encoding', value: 'gzip' },
        ],
      },
      {
        source: '/unity/:path*.wasm.br',
        headers: [
          { key: 'Content-Type', value: 'application/wasm' },
          { key: 'Content-Encoding', value: 'br' },
        ],
      },
    ];
  },
};

export default nextConfig;