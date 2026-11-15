"use client";

import Image from "next/image";
import { Header, HeaderProps } from "@/components/layout/Header";

export interface NavbarAvatarProps {
  src: string;
  alt: string;
  size?: 40 | 48;
  className?: string;
}

export function NavbarAvatar({
  src,
  alt,
  size = 40,
  className = "rounded-full object-cover",
}: NavbarAvatarProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      sizes="48px"
      quality={75}
      referrerPolicy="no-referrer"
      className={className}
    />
  );
}

export function Navbar(props: HeaderProps) {
  return <Header {...props} />;
}

export default Navbar;
