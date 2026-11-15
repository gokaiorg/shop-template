"use client";

export interface ImageLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export default function customImageLoader({ src }: ImageLoaderProps): string {
  if (
    src.includes("firebasestorage.googleapis.com") ||
    src.includes("storage.googleapis.com") ||
    src.toLowerCase().includes(".avif")
  ) {
    return src;
  }

  return src;
}
