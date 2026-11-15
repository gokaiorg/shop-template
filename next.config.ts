import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: true,
  compress: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "framer-motion",
      "date-fns",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/collections",
        destination: "/en/artworks",
        statusCode: 301,
      },
      {
        source: "/:locale(en|fr)/collections",
        destination: "/en/artworks",
        statusCode: 301,
      },
      {
        source: "/collections/all",
        destination: "/en/artworks",
        statusCode: 301,
      },
      {
        source: "/:locale(en|fr)/collections/all",
        destination: "/en/artworks",
        statusCode: 301,
      },
      {
        source: "/collections-all",
        destination: "/en/artworks",
        statusCode: 301,
      },
      {
        source: "/:locale(en|fr)/collections-all",
        destination: "/en/artworks",
        statusCode: 301,
      },
      {
        source: "/collections/abstract",
        destination: "/en/artworks/abstract-and-more",
        statusCode: 301,
      },
      {
        source: "/:locale(en|fr)/collections/abstract",
        destination: "/en/artworks/abstract-and-more",
        statusCode: 301,
      },
      {
        source: "/collections/:category/products/:slug",
        destination: "/en/artworks/:category/:slug",
        statusCode: 301,
      },
      {
        source: "/:locale(en|fr)/collections/:category/products/:slug",
        destination: "/en/artworks/:category/:slug",
        statusCode: 301,
      },
      {
        source: "/collections/:category",
        destination: "/en/artworks/:category",
        statusCode: 301,
      },
      {
        source: "/:locale(en|fr)/collections/:category",
        destination: "/en/artworks/:category",
        statusCode: 301,
      },
      {
        source: "/pages/amann",
        destination: "/en/amann",
        statusCode: 301,
      },
      {
        source: "/:locale(en|fr)/pages/amann",
        destination: "/en/amann",
        statusCode: 301,
      },
      {
        source: "/amann",
        destination: "/en/amann",
        statusCode: 301,
      },
      {
        source: "/pages/contact",
        destination: "/en/contact",
        statusCode: 301,
      },
      {
        source: "/:locale(en|fr)/pages/contact",
        destination: "/en/contact",
        statusCode: 301,
      },
      {
        source: "/pages/:slug",
        destination: "/en/:slug",
        statusCode: 301,
      },
      {
        source: "/:locale(en|fr)/pages/:slug",
        destination: "/en/:slug",
        statusCode: 301,
      },
      {
        source: "/products",
        destination: "/en/artworks",
        statusCode: 301,
      },
      {
        source: "/:locale(en|fr)/products",
        destination: "/en/artworks",
        statusCode: 301,
      },
      {
        source: "/policies",
        destination: "/en/about",
        statusCode: 301,
      },
      {
        source: "/:locale(en|fr)/policies",
        destination: "/en/about",
        statusCode: 301,
      },
      {
        source: "/policies/:slug",
        destination: "/en/about",
        statusCode: 301,
      },
      {
        source: "/:locale(en|fr)/policies/:slug",
        destination: "/en/about",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
