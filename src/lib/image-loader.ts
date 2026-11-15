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
  const q = quality || 75;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}
