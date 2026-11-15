import React from "react";
import { HeroHeader, HeroHeaderProps } from "@/components/shop/HeroHeader";

export type HeroProps = HeroHeaderProps;

export function Hero(props: HeroProps) {
  return <HeroHeader {...props} />;
}

export { HeroHeader };
export default Hero;
