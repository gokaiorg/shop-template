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

interface AboutSectionProps {
    aboutSection: AboutSectionSettings;
    locale?: string;
    lang?: string;
    className?: string;
    forceDisplay?: boolean;
}

export function AboutSection({
    aboutSection,
    locale,
    lang,
    className = "",
    forceDisplay = false,
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
        <section
            aria-labelledby="homepage-about-heading"
            className={cn("w-full py-12 sm:py-16 bg-muted/20 border-t border-border/40", className)}
        >
            <div className="w-full max-w-7xl mx-auto px-6 md:px-16">
                <div
                    className={cn(
                        "gap-12 items-center",
                        hasImages
                            ? "grid grid-cols-1 md:grid-cols-2"
                            : "max-w-3xl mx-auto text-center"
                    )}
                >
                    {/* Text Column */}
                    <div className={cn("flex flex-col", !hasImages && "items-center")}>
                        {title && (
                            <h2
                                id="homepage-about-heading"
                                className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-6"
                            >
                                {title}
                            </h2>
                        )}

                        {description && (
                            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed whitespace-pre-wrap mb-8">
                                {description}
                            </p>
                        )}

                        {ctaLabel && ctaHref && (
                            <div className="pt-2">
                                <Button
                                    asChild
                                    size="lg"
                                    className="rounded-full px-8 shadow-md hover:shadow-lg transition-all group cursor-pointer"
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

                    {/* Image Column */}
                    {hasImages && (
                        <div className="w-full flex justify-center items-center">
                            {images.length === 1 ? (
                                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-border/50 group">
                                    <Image
                                        src={images[0]}
                                        alt={title || "About visual"}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                    />
                                </div>
                            ) : (
                                <Carousel
                                    opts={{ loop: true }}
                                    className="w-full relative group"
                                >
                                    <CarouselContent>
                                        {images.map((imgUrl, index) => (
                                            <CarouselItem key={index}>
                                                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-border/50">
                                                    <Image
                                                        src={imgUrl}
                                                        alt={title ? `${title} (${index + 1})` : `About photo ${index + 1}`}
                                                        fill
                                                        sizes="(max-width: 768px) 100vw, 50vw"
                                                        className="object-cover transition-transform duration-500 ease-out hover:scale-105"
                                                    />
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <CarouselPrevious className="left-4 opacity-90 hover:opacity-100 shadow-md cursor-pointer" />
                                    <CarouselNext className="right-4 opacity-90 hover:opacity-100 shadow-md cursor-pointer" />
                                </Carousel>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
