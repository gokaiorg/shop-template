import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { AdminQuickEdit } from "@/components/admin/AdminQuickEdit";

export interface HeroHeaderProps {
  title: string;
  subtitle: string;
  backgroundImageUrl?: string | null;
  ctaLabel?: string;
  ctaHref?: string;
  lang?: string;
  className?: string;
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}

export function HeroHeader({
  title,
  subtitle,
  backgroundImageUrl,
  ctaLabel,
  ctaHref,
  lang,
  className,
}: HeroHeaderProps) {
  const hasImage = Boolean(backgroundImageUrl && backgroundImageUrl.trim().length > 0);
  const cleanTitle = stripHtml(title) || "Hero Banner";

  return (
    <section
      aria-label={cleanTitle}
      className={cn(
        "relative isolate flex w-full flex-col items-center justify-center min-h-[60vh] py-24 sm:py-32 px-6 md:px-16 text-center overflow-hidden",
        hasImage ? "" : "bg-background",
        className
      )}
    >
      {/* Admin Quick Edit Shortcut for Homepage Hero */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <AdminQuickEdit entityType="hero" locale={lang} />
      </div>

      {/* Case 1: CMS Background Image Provided */}
      {hasImage && backgroundImageUrl && (
        <>
          <Image
            src={backgroundImageUrl}
            alt={cleanTitle}
            fill
            priority
            sizes="100vw"
            className="object-cover pointer-events-none"
          />
          {/* Subtle contrast overlay for readability */}
          <div className="absolute inset-0 bg-black/25 dark:bg-black/45 pointer-events-none z-[1]" />
          {/* Smooth bottom fade into page background */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none z-[2]" />
        </>
      )}

      {/* Case 2: No Background Image - Spatial UI Ambient Atmosphere */}
      {!hasImage && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden -z-10"
          aria-hidden="true"
        >
          {/* Top ambient radial glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-glow-ambient opacity-90 blur-3xl pointer-events-none" />
          {/* Primary ambient floating orb */}
          <div className="absolute top-1/4 -left-36 w-[550px] h-[550px] bg-glow-primary opacity-60 blur-3xl pointer-events-none" />
          {/* Accent ambient floating orb */}
          <div className="absolute bottom-10 -right-36 w-[600px] h-[600px] bg-glow-accent opacity-50 blur-3xl pointer-events-none" />
          {/* Spatial UI subtle micro-grid canvas */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(120,119,198,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,119,198,0.06)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none" />
        </div>
      )}

      {/* Spatial UI Glassmorphism 2.0 Central Card */}
      <div className="relative z-10 glass-2-card p-8 sm:p-12 md:p-14 rounded-3xl max-w-3xl mx-auto shadow-soft-xl border border-white/40 dark:border-white/10 flex flex-col items-center">
        {/* Title: High Contrast, Extra-bold, Tight Tracking */}
        <h1 className="max-w-2xl text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 mb-6 drop-shadow-xs">
          {title}
        </h1>

        {/* Subtitle: High Contrast, leading-relaxed */}
        <p className="max-w-2xl text-lg sm:text-xl text-zinc-700 dark:text-zinc-200 leading-relaxed font-normal mb-10">
          {subtitle}
        </p>

        {/* CTA Button: Soft Shadow, No Hard Shadows */}
        {ctaHref && ctaLabel && (
          <Link href={ctaHref}>
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-base font-semibold shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            >
              {ctaLabel}
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}
