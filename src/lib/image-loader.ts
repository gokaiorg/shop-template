"use client";

export interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function customImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  const q = quality ?? 75;

  if (
    src.includes("lh3.googleusercontent.com") ||
    src.includes(".googleusercontent.com")
  ) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
  }

  if (
    src.includes("firebasestorage.googleapis.com") ||
    src.includes("storage.googleapis.com") ||
    src.toLowerCase().includes(".avif")
  ) {
    return src;
  }

  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}
