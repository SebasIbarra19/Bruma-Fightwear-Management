/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // @react-pdf/renderer (usado por /api/invoicing/[id]/pdf) depende de bidi-js,
    // un módulo CommonJS que rompe al ser empaquetado por webpack en el bundle del
    // servidor ("'bidi-js' does not contain a default export"). Marcarlo como
    // external hace que Next lo cargue nativamente desde node_modules en runtime.
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig