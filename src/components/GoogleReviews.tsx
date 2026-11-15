"use client";

import Image from "next/image";
import {
  ReviewBlock,
  ReviewBlockProps,
  ReviewAvatar,
} from "@/components/shop/ReviewBlock";

export interface GoogleReviewAvatarProps {
  src: string;
  alt: string;
  size?: 40 | 48;
  className?: string;
}

export function GoogleReviewAvatar({
  src,
  alt,
  size = 48,
  className = "w-full h-full rounded-full object-cover",
}: GoogleReviewAvatarProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      sizes="48px"
      quality={75}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
    />
  );
}

export function GoogleReviews(props: ReviewBlockProps) {
  return <ReviewBlock {...props} />;
}

export { ReviewBlock, ReviewAvatar };
export default GoogleReviews;
