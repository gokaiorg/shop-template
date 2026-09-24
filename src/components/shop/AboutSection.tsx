import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AboutSectionSettings } from "@/types/database";
import { getLocalizedField } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { AdminEditBadge } from "@/components/admin/AdminEditBadge";

interface AboutSectionProps {
    aboutSection: AboutSectionSettings;
    locale?: string;
    lang?: string;
    className?: string;
    forceDisplay?: boolean;
    as?: "section" | "div";
}

export function AboutSection({
    aboutSection,
    locale,
    lang,
    className = "",
    forceDisplay = false,
    as: Component = "section",
}: AboutSectionProps) {
    const activeLocale = locale || lang || "en";

    if (!aboutSection || (!aboutSection.enabled && !forceDisplay)) {
        return null;
    }

    const title =
        getLocalizedField(aboutSection.title, activeLocale) ||
        aboutSection.title?.en ||
        aboutSection.title?.fr ||
        "";

    const description =
        getLocalizedField(aboutSection.description, activeLocale) ||
        aboutSection.description?.en ||
        aboutSection.description?.fr ||
        "";

    const ctaLabel =
        getLocalizedField(aboutSection.ctaLabel, activeLocale) ||
        aboutSection.ctaLabel?.en ||
        aboutSection.ctaLabel?.fr ||
        "";

    const rawCtaUrl = (aboutSection.ctaUrl || "").trim();
    const ctaHref = rawCtaUrl
        ? rawCtaUrl.startsWith("http") || rawCtaUrl.startsWith(`/${activeLocale}`)
            ? rawCtaUrl
            : rawCtaUrl.startsWith("/")
            ? `/${activeLocale}${rawCtaUrl}`
            : `/${activeLocale}/${rawCtaUrl}`
        : "";

    const images = (aboutSection.images || []).filter(Boolean);
    const hasImages = images.length > 0;

    return (
        <Component
            aria-labelledby="homepage-about-heading"
            className={cn("relative w-full m-0 py-0 bg-transparent", className)}
        >
            <AdminEditBadge href="/admin/blocks/about" locale={activeLocale} />
            <div className="w-full max-w-7xl mx-auto px-6 md:px-16">
                <div
                    className={cn(
                        "w-full",
                        hasImages
                            ? "grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center"
                            : "max-w-3xl mx-auto"
                    )}
                >
                    {/* Text Column */}
                    <div
                        className={cn(
                            hasImages
                                ? "lg:col-span-6 xl:col-span-5 relative z-10 flex flex-col space-y-6"
                                : "text-center p-8 sm:p-12 rounded-3xl border border-black/[0.06] dark:border-white/10 bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl shadow-soft-xl space-y-6"
                        )}
                    >
                        <div
                            className={cn(
                                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider backdrop-blur-md shadow-xs",
                                hasImages ? "self-start" : "mx-auto"
                            )}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span>{activeLocale === "fr" ? "À Propos" : "About Us"}</span>
                        </div>

                        {title && (
                            <h2
                                id="homepage-about-heading"
                                className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight"
                            >
                                {title}
                            </h2>
                        )}

                        {description && (
                            <p
                                className={cn(
                                    "text-base text-muted-foreground leading-relaxed whitespace-pre-wrap",
                                    !hasImages && "max-w-2xl mx-auto"
                                )}
                            >
                                {description}
                            </p>
                        )}

                        {ctaLabel && ctaHref && (
                            <div className="pt-2">
                                <Button
                                    asChild
                                    size="lg"
                                    className="rounded-2xl px-8 font-semibold shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/45 transition-all group cursor-pointer"
                                >
                                    <Link
                                        href={ctaHref}
                                        target={rawCtaUrl.startsWith("http") ? "_blank" : undefined}
                                        rel={rawCtaUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                                    >
                                        <span>{ctaLabel}</span>
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Image Column: Broken Grid with Asymmetric Overflow & Radial Glow/Mask */}
                    {hasImages && (
                        <div className="lg:col-span-6 xl:col-span-7 w-full relative lg:py-6">
                            {/* Radial ambient glow behind the photo */}
                            <div
                                className="absolute -inset-6 sm:-inset-10 bg-radial from-primary/25 via-accent/15 to-transparent rounded-full blur-3xl -z-10 pointer-events-none opacity-70 dark:opacity-60"
                                aria-hidden="true"
                            />

                            {/* Asymmetric anchor box */}
                            <div className="relative rounded-3xl border border-black/[0.06] dark:border-white/10 bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl p-4 sm:p-6 lg:p-8 shadow-soft-xl">
                                {/* Ambient decorative blob */}
                                <div
                                    className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-24 h-24 rounded-full bg-linear-to-br from-primary/20 to-accent/20 blur-xl pointer-events-none"
                                    aria-hidden="true"
                                />

                                {/* Overflowing visual container that breaks outside the frame */}
                                <div className="relative lg:-mr-12 lg:-my-8 lg:translate-x-4 z-10 transition-transform duration-500 ease-out hover:scale-[1.02]">
                                    {images.length === 1 ? (
                                        <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/40 dark:border-white/15 group [mask-image:radial-gradient(ellipse_95%_95%_at_50%_50%,black_85%,transparent_100%)]">
                                            <Image
                                                src={images[0]}
                                                alt={title || "About visual"}
                                                fill
                                                sizes="(max-width: 1024px) 100vw, 55vw"
                                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-white/30 dark:ring-white/10 pointer-events-none" />
                                        </div>
                                    ) : (
                                        <Carousel
                                            opts={{ loop: true }}
                                            className="w-full relative group [mask-image:radial-gradient(ellipse_95%_95%_at_50%_50%,black_88%,transparent_100%)]"
                                        >
                                            <CarouselContent>
                                                {images.map((imgUrl, index) => (
                                                    <CarouselItem key={index}>
                                                        <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/40 dark:border-white/15">
                                                            <Image
                                                                src={imgUrl}
                                                                alt={title ? `${title} (${index + 1})` : `About photo ${index + 1}`}
                                                                fill
                                                                sizes="(max-width: 1024px) 100vw, 55vw"
                                                                className="object-cover transition-transform duration-700 ease-out hover:scale-105"
                                                            />
                                                            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-white/30 dark:ring-white/10 pointer-events-none" />
                                                        </div>
                                                    </CarouselItem>
                                                ))}
                                            </CarouselContent>
                                            <CarouselPrevious className="left-4 opacity-90 hover:opacity-100 shadow-md cursor-pointer rounded-2xl bg-background/80 backdrop-blur-md border-border/80" />
                                            <CarouselNext className="right-4 opacity-90 hover:opacity-100 shadow-md cursor-pointer rounded-2xl bg-background/80 backdrop-blur-md border-border/80" />
                                        </Carousel>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Component>
    );
}

export { AboutSection as AboutBlock };
