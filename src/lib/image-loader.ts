'use client';

export interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Custom Image Loader for Next.js
 *
 * Bypasses the /_next/image server-side optimization route for Firebase Storage and
 * Google Cloud Storage assets (which are already pre-optimized, e.g. AVIF format).
 * This completely avoids Cloud Run CPU bottlenecks and net::ERR_TIMED_OUT failures.
 */
export default function customImageLoader({ src, width, quality }: ImageLoaderProps): string {
  // Return raw URL directly for Firebase Storage, Google Cloud Storage, or pre-optimized AVIF files
  if (
    src.includes('firebasestorage.googleapis.com') ||
    src.includes('storage.googleapis.com') ||
    src.toLowerCase().includes('.avif')
  ) {
    return src;
  }

  // Return raw source directly to bypass server-side Sharp processing
  return src;
}
