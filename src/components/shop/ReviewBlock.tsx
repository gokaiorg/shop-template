"use client";

import React, { useEffect, useState } from "react";
import { Star, MessageSquareQuote, ChevronLeft, ChevronRight } from "lucide-react";
import { ReviewSectionSettings, GoogleReview } from "@/types/database";
import { cn } from "@/lib/utils";
import { AdminEditBadge } from "@/components/admin/AdminEditBadge";
import { getLocalizedField } from "@/lib/i18n";

interface ReviewBlockProps {
    reviewSection?: ReviewSectionSettings;
    locale?: string;
    lang?: string;
    className?: string;
    forceDisplay?: boolean;
    as?: "section" | "div";
    initialReviews?: GoogleReview[];
}

function getAuthorInitials(name?: string): string {
    if (!name) return "C";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (name.trim().slice(0, 2) || "C").toUpperCase();
}

const AVATAR_GRADIENTS = [
    "from-indigo-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-violet-600 to-fuchsia-600",
];

function getAvatarGradient(name?: string): string {
    if (!name) return AVATAR_GRADIENTS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[index];
}

function ReviewAvatar({
    name,
    photoUrl,
}: {
    name: string;
    photoUrl?: string;
}) {
    const [imgError, setImgError] = useState(false);
    const initials = getAuthorInitials(name);
    const gradient = getAvatarGradient(name);

    if (photoUrl && !imgError) {
        return (
            <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-black/10 dark:border-white/10 bg-muted/60 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={photoUrl}
                    alt={name}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "w-11 h-11 rounded-full bg-gradient-to-br text-white font-bold flex items-center justify-center text-xs sm:text-sm tracking-wider shrink-0 shadow-sm ring-2 ring-black/5 dark:ring-white/10",
                gradient
            )}
            title={name}
        >
            <span className="drop-shadow-xs">{initials}</span>
        </div>
    );
}

export function ReviewBlock({
    reviewSection,
    locale,
    lang = "fr",
    className = "",
    forceDisplay = false,
    as: Component = "section",
    initialReviews,
}: ReviewBlockProps) {
    const activeLocale = locale || lang || "fr";
    const isFr = activeLocale === "fr";

    // 1. Status Check: Return null if disabled/inactive or placeId is empty, unless forced
    const isEnabled = Boolean(
        reviewSection?.enabled || reviewSection?.status === "active"
    );
    const placeId = (reviewSection?.placeId || "").trim();

    const [reviews, setReviews] = useState<GoogleReview[]>(initialReviews || []);
    const [overallRating, setOverallRating] = useState<number | null>(null);
    const [totalRatings, setTotalRatings] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(!initialReviews || initialReviews.length === 0);
    const [expandedReviewIndex, setExpandedReviewIndex] = useState<number | null>(null);

    // Carousel page state for mobile / multi-review navigation
    const [carouselIndex, setCarouselIndex] = useState<number>(0);

    useEffect(() => {
        if (initialReviews && initialReviews.length > 0) {
            setReviews(initialReviews);
            setIsLoading(false);
            return;
        }

        if (!placeId) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        async function fetchReviews() {
            try {
                setIsLoading(true);
                const res = await fetch(
                    `/api/reviews?placeId=${encodeURIComponent(placeId)}&lang=${activeLocale}`
                );
                if (!res.ok) {
                    throw new Error(`Failed to load reviews: ${res.status}`);
                }
                const data = await res.json();
                if (isMounted && data.success) {
                    setReviews(data.reviews || []);
                    if (typeof data.rating === "number") setOverallRating(data.rating);
                    if (typeof data.userRatingsTotal === "number") setTotalRatings(data.userRatingsTotal);
                }
            } catch (err) {
                console.error("[REVIEW_BLOCK_FETCH_ERROR]", err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        fetchReviews();

        return () => {
            isMounted = false;
        };
    }, [placeId, activeLocale, initialReviews]);

    // If disabled or placeId empty and not forced, return null
    if (!forceDisplay && (!reviewSection || !isEnabled || !placeId)) {
        return null;
    }

    // If finished loading and there are no reviews, and not in forceDisplay mode, hide block
    if (!isLoading && reviews.length === 0 && !forceDisplay) {
        return null;
    }

    const title =
        getLocalizedField(reviewSection?.title, activeLocale) ||
        (isFr ? "Ce que disent nos clients" : "What Our Customers Say");
    const subtitle = getLocalizedField(reviewSection?.subtitle, activeLocale) || "";

    const toggleExpand = (index: number) => {
        setExpandedReviewIndex((prev) => (prev === index ? null : index));
    };

    return (
        <Component
            aria-labelledby="reviews-section-heading"
            className={cn("relative w-full m-0 py-0 bg-transparent", className)}
        >
            <AdminEditBadge href="/admin/blocks/reviews" locale={activeLocale} />

            <div className="w-full max-w-7xl mx-auto px-6 md:px-16">
                {/* Header: Badge, Title, Subtitle, Google Rating Summary */}
                <div className="max-w-3xl mx-auto text-center mb-12">
                    {/* Google Reviews pill badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider mb-4 backdrop-blur-md shadow-xs">
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                        </svg>
                        <span>{isFr ? "Avis Clients Google" : "Google Reviews"}</span>
                        {overallRating && (
                            <span className="flex items-center gap-1 font-bold text-foreground pl-1 border-l border-black/10 dark:border-white/10">
                                <span className="text-amber-500">★</span>
                                {overallRating.toFixed(1)}
                                {totalRatings ? ` (${totalRatings})` : ""}
                            </span>
                        )}
                    </div>

                    {title && (
                        <h2
                            id="reviews-section-heading"
                            className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4"
                        >
                            {title}
                        </h2>
                    )}

                    {subtitle && (
                        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Loading skeleton */}
                {isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((n) => (
                            <div
                                key={n}
                                className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl p-6 shadow-soft space-y-4 animate-pulse"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-full bg-muted" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 bg-muted rounded-sm w-3/4" />
                                        <div className="h-3 bg-muted rounded-sm w-1/2" />
                                    </div>
                                </div>
                                <div className="h-4 bg-muted rounded-sm w-28" />
                                <div className="space-y-2">
                                    <div className="h-3 bg-muted rounded-sm w-full" />
                                    <div className="h-3 bg-muted rounded-sm w-5/6" />
                                    <div className="h-3 bg-muted rounded-sm w-4/6" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty fallback when forced in editor or no reviews */}
                {!isLoading && reviews.length === 0 && (
                    <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-black/10 dark:border-white/10 max-w-xl mx-auto">
                        <MessageSquareQuote className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="font-medium text-foreground text-sm">
                            {isFr ? "Aucun avis à afficher pour le moment." : "No reviews found to display."}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isFr
                                ? "Vérifiez votre Google Place ID dans les paramètres du bloc."
                                : "Check your Google Place ID in block settings."}
                        </p>
                    </div>
                )}

                {/* Reviews Grid */}
                {!isLoading && reviews.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reviews.map((review, idx) => {
                            const isExpanded = expandedReviewIndex === idx;
                            const isLong = (review.text || "").length > 180;
                            return (
                                <article
                                    key={idx}
                                    className="group relative flex flex-col justify-between rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl p-6 sm:p-7 shadow-soft hover:shadow-soft-xl hover:-translate-y-1 transition-all duration-300"
                                >
                                    {/* Top: Author Avatar, Name, Relative time, Google Badge */}
                                    <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3">
                                            <ReviewAvatar
                                                name={review.author_name}
                                                photoUrl={review.profile_photo_url}
                                            />

                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                                                    {review.author_name}
                                                </h3>
                                                {review.relative_time_description && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {review.relative_time_description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Google Verified Icon */}
                                        <div
                                            className="p-1.5 rounded-full bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 shrink-0"
                                            title="Avis vérifié Google"
                                        >
                                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                                <path
                                                    fill="#4285F4"
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                />
                                                <path
                                                    fill="#34A853"
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                />
                                                <path
                                                    fill="#FBBC05"
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                                />
                                                <path
                                                    fill="#EA4335"
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                                />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Star Rating Icons (SVG Yellow/Amber) */}
                                    <div className="flex items-center gap-1 mb-3.5">
                                        {[1, 2, 3, 4, 5].map((starVal) => {
                                            const isFilled = starVal <= (review.rating || 5);
                                            return (
                                                <Star
                                                    key={starVal}
                                                    className={cn(
                                                        "w-4 h-4 transition-transform group-hover:scale-105",
                                                        isFilled
                                                            ? "fill-[#FBBC05] text-[#FBBC05]"
                                                            : "fill-muted text-muted-foreground/30"
                                                    )}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Review Text */}
                                    <div className="flex-1">
                                        <p
                                            className={cn(
                                                "text-sm text-foreground/80 leading-relaxed font-normal whitespace-pre-line",
                                                !isExpanded && isLong && "line-clamp-4"
                                            )}
                                        >
                                            {review.text || (
                                                <span className="italic text-muted-foreground">
                                                    {isFr ? "(Avis sans commentaire)" : "(Rating only)"}
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Toggle read more if text is truncated */}
                                    {isLong && (
                                        <button
                                            type="button"
                                            onClick={() => toggleExpand(idx)}
                                            className="mt-3 text-xs font-semibold text-primary hover:underline self-start cursor-pointer focus:outline-none"
                                        >
                                            {isExpanded
                                                ? isFr
                                                    ? "Afficher moins"
                                                    : "Show less"
                                                : isFr
                                                ? "Lire la suite"
                                                : "Read more"}
                                        </button>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </Component>
    );
}

export { ReviewBlock as ReviewSection, ReviewBlock as ReviewsBlock };
