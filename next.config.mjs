/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      // 1. Racine des collections
      {
        source: '/collections',
        destination: '/en/artworks',
        statusCode: 301,
      },
      {
        source: '/:locale(en|fr)/collections',
        destination: '/en/artworks',
        statusCode: 301,
      },
      {
        source: '/collections/all',
        destination: '/en/artworks',
        statusCode: 301,
      },
      {
        source: '/:locale(en|fr)/collections/all',
        destination: '/en/artworks',
        statusCode: 301,
      },
      {
        source: '/collections-all',
        destination: '/en/artworks',
        statusCode: 301,
      },
      {
        source: '/:locale(en|fr)/collections-all',
        destination: '/en/artworks',
        statusCode: 301,
      },

      // 2. Règle spécifique prioritaire : /collections/abstract
      {
        source: '/collections/abstract',
        destination: '/en/artworks/abstract-and-more',
        statusCode: 301,
      },
      {
        source: '/:locale(en|fr)/collections/abstract',
        destination: '/en/artworks/abstract-and-more',
        statusCode: 301,
      },

      // 3. Produits au sein d'une collection
      {
        source: '/collections/:category/products/:slug',
        destination: '/en/artworks/:category/:slug',
        statusCode: 301,
      },
      {
        source: '/:locale(en|fr)/collections/:category/products/:slug',
        destination: '/en/artworks/:category/:slug',
        statusCode: 301,
      },

      // 4. Catégories / Collections génériques
      {
        source: '/collections/:category',
        destination: '/en/artworks/:category',
        statusCode: 301,
      },
      {
        source: '/:locale(en|fr)/collections/:category',
        destination: '/en/artworks/:category',
        statusCode: 301,
      },

      // 5. Pages institutionnelles & Artiste
      {
        source: '/pages/amann',
        destination: '/en/amann',
        statusCode: 301,
      },
      {
        source: '/:locale(en|fr)/pages/amann',
        destination: '/en/amann',
        statusCode: 301,
      },
      {
        source: '/amann',
        destination: '/en/amann',
        statusCode: 301,
      },
      {
        source: '/pages/contact',
        destination: '/en/contact',
        statusCode: 301,
      },
      {
        source: '/:locale(en|fr)/pages/contact',
        destination: '/en/contact',
        statusCode: 301,
      },
      {
        source: '/pages/:slug',
        destination: '/en/:slug',
        statusCode: 301,
      },
      {
        source: '/:locale(en|fr)/pages/:slug',
        destination: '/en/:slug',
        statusCode: 301,
      },

      // 6. Racines de repli globales
      {
        source: '/products',
        destination: '/en/artworks',
        statusCode: 301,
      },
      {
        source: '/:locale(en|fr)/products',
        destination: '/en/artworks',
        statusCode: 301,
      },
      {
        source: '/policies',
        destination: '/en/about',
        statusCode: 301,
      },
      {
        source: '/:locale(en|fr)/policies',
        destination: '/en/about',
        statusCode: 301,
      },
      {
        source: '/policies/:slug',
        destination: '/en/about',
        statusCode: 301,
      },
      {
        source: '/:locale(en|fr)/policies/:slug',
        destination: '/en/about',
        statusCode: 301,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
