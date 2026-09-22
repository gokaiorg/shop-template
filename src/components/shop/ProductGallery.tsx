"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductGalleryProps {
    images: string[];
    title?: string;
    isOutOfStock?: boolean;
    enableZoom?: boolean;
}

export function ProductGallery({
    images = [],
    title = "Product",
    isOutOfStock = false,
    enableZoom = true,
}: ProductGalleryProps) {
    // Normalisation : filtrer les URLs vides ou nulles
    const validImages = images.filter((img) => typeof img === "string" && img.trim().length > 0);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // États du zoom magnifier desktop
    const [isDesktop, setIsDesktop] = useState(false);
    const [isZooming, setIsZooming] = useState(false);
    const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
    const [bgPosition, setBgPosition] = useState({ x: 50, y: 50 });

    const carouselRef = useRef<HTMLDivElement>(null);
    const thumbnailsRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Détection d'écran Desktop (>= 768px) pour désactiver tout zoom sur mobile
    useEffect(() => {
        const media = window.matchMedia("(min-width: 768px)");
        setIsDesktop(media.matches);

        const handleMediaChange = (e: MediaQueryListEvent) => {
            setIsDesktop(e.matches);
            if (!e.matches) {
                setIsZooming(false);
            }
        };

        media.addEventListener("change", handleMediaChange);
        return () => media.removeEventListener("change", handleMediaChange);
    }, []);

    // Faire défiler le carrousel vers l'index sélectionné
    const scrollToImage = (index: number) => {
        if (!carouselRef.current) return;
        const container = carouselRef.current;
        const width = container.clientWidth;
        container.scrollTo({
            left: index * width,
            behavior: "smooth",
        });
        setSelectedIndex(index);

        // Défiler doucement la rangée de miniatures si nécessaire
        if (thumbnailsRef.current) {
            const thumb = thumbnailsRef.current.children[index] as HTMLElement;
            if (thumb) {
                thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }
        }
    };

    // Écouter le défilement tactile / swipe natif sur mobile
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const width = container.clientWidth;
        if (width > 0) {
            const newIndex = Math.round(container.scrollLeft / width);
            if (newIndex >= 0 && newIndex < validImages.length && newIndex !== selectedIndex) {
                setSelectedIndex(newIndex);
            }
        }
    };

    const handlePrev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedIndex > 0) {
            scrollToImage(selectedIndex - 1);
        } else {
            scrollToImage(validImages.length - 1);
        }
    };

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedIndex < validImages.length - 1) {
            scrollToImage(selectedIndex + 1);
        } else {
            scrollToImage(0);
        }
    };

    // Gestion du survol Magnifier (uniquement sur Desktop)
    const handleMouseEnter = () => {
        if (enableZoom && isDesktop) {
            setIsZooming(true);
        }
    };

    const handleMouseLeave = () => {
        setIsZooming(false);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!enableZoom || !isDesktop || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Position relative en pourcentage (0 à 100)
        const percentX = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const percentY = Math.max(0, Math.min(100, (y / rect.height) * 100));

        // Le viseur (lens) représente 40% de la surface pour un zoom à 250%
        const lensSize = 40;
        const halfLens = lensSize / 2;

        const clampedLensX = Math.max(0, Math.min(100 - lensSize, percentX - halfLens));
        const clampedLensY = Math.max(0, Math.min(100 - lensSize, percentY - halfLens));

        setLensPosition({ x: clampedLensX, y: clampedLensY });

        // Calcul de la position du background zoomé (0% à 100%)
        const maxOffset = 100 - lensSize;
        const bgX = (clampedLensX / maxOffset) * 100;
        const bgY = (clampedLensY / maxOffset) * 100;

        setBgPosition({ x: bgX, y: bgY });
        if (!isZooming) setIsZooming(true);
    };

    // Cas où aucune image n'est fournie
    if (validImages.length === 0) {
        return (
            <div className="relative aspect-square w-full rounded-2xl border border-border bg-muted/40 flex flex-col items-center justify-center text-muted-foreground p-8">
                <ImageOff className="h-16 w-16 mb-2 stroke-[1.5] opacity-50" />
                <span className="text-sm font-medium">No image available</span>
                {isOutOfStock && (
                    <span className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 uppercase font-bold z-10">
                        Sold
                    </span>
                )}
            </div>
        );
    }

    const currentImage = validImages[selectedIndex];

    return (
        <div className="flex flex-col space-y-4 w-full">
            {/* Wrapper relatif permettant d'afficher le panneau de zoom à droite sans être tronqué */}
            <div className="relative w-full">
                {/* Conteneur principal de l'image & Carrousel */}
                <div
                    ref={containerRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                    className={`relative aspect-square w-full rounded-2xl overflow-hidden border border-border/80 bg-muted/20 shadow-xs group select-none ${
                        enableZoom ? "md:cursor-crosshair" : ""
                    }`}
                >
                    <div
                        ref={carouselRef}
                        onScroll={handleScroll}
                        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none"
                        style={{ scrollSnapType: "x mandatory" }}
                    >
                        {validImages.map((src, idx) => (
                            <div
                                key={`${src}-${idx}`}
                                className="w-full h-full shrink-0 snap-center relative aspect-square flex items-center justify-center bg-background/50"
                            >
                                <Image
                                    src={src}
                                    alt={`${title} - Photo ${idx + 1}`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                                    className="object-contain p-2 md:p-4"
                                    priority={idx === 0}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Viseur (Lens) semi-transparent suivant le curseur sur desktop */}
                    {isZooming && enableZoom && isDesktop && (
                        <div
                            className="absolute pointer-events-none border-2 border-primary/70 bg-primary/10 shadow-xs rounded-xl backdrop-blur-[1px] hidden md:block"
                            style={{
                                width: "40%",
                                height: "40%",
                                left: `${lensPosition.x}%`,
                                top: `${lensPosition.y}%`,
                            }}
                        />
                    )}

                    {/* Badge Sold Out */}
                    {isOutOfStock && (
                        <span className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 uppercase font-bold z-10">
                            Sold
                        </span>
                    )}

                    {/* Flèches de navigation (si plusieurs images) */}
                    {validImages.length > 1 && (
                        <>
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                onClick={handlePrev}
                                onMouseEnter={() => setIsZooming(false)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background backdrop-blur-xs border shadow-md opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                aria-label="Image précédente"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                onClick={handleNext}
                                onMouseEnter={() => setIsZooming(false)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 hover:bg-background backdrop-blur-xs border shadow-md opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                aria-label="Image suivante"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>

                            {/* Indicateur discret du numéro de photo en bas à droite */}
                            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-xs border text-xs font-medium text-foreground/80 shadow-xs pointer-events-none z-10">
                                {selectedIndex + 1} / {validImages.length}
                            </div>
                        </>
                    )}
                </div>

                {/* Panneau de Zoom Magnifier (Desktop uniquement, positionné à droite en z-50) */}
                {isZooming && enableZoom && isDesktop && currentImage && (
                    <div
                        className="absolute left-[calc(100%+1.5rem)] md:left-[calc(100%+3rem)] top-0 w-full aspect-square z-50 pointer-events-none hidden md:block rounded-2xl overflow-hidden border border-border/80 bg-background shadow-2xl"
                        style={{
                            backgroundImage: `url(${currentImage})`,
                            backgroundPosition: `${bgPosition.x}% ${bgPosition.y}%`,
                            backgroundSize: "250%",
                            backgroundRepeat: "no-repeat",
                        }}
                    />
                )}
            </div>

            {/* Rangée de miniatures (Thumbnails) sous l'image principale */}
            {validImages.length > 1 && (
                <div
                    ref={thumbnailsRef}
                    className="flex gap-3 overflow-x-auto py-1 scrollbar-none px-1"
                >
                    {validImages.map((src, idx) => {
                        const isSelected = idx === selectedIndex;
                        return (
                            <button
                                key={`thumb-${src}-${idx}`}
                                type="button"
                                onClick={() => scrollToImage(idx)}
                                className={`relative shrink-0 h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-muted/40 ${
                                    isSelected
                                        ? "border-primary ring-2 ring-primary/20 scale-105 shadow-sm"
                                        : "border-border/60 hover:border-border opacity-70 hover:opacity-100"
                                }`}
                                aria-label={`Afficher la photo ${idx + 1}`}
                            >
                                <Image
                                    src={src}
                                    alt={`Vignette ${idx + 1}`}
                                    fill
                                    sizes="80px"
                                    className="object-cover"
                                />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
