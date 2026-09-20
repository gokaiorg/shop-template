"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

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
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const carouselRef = useRef<HTMLDivElement>(null);
    const thumbnailsRef = useRef<HTMLDivElement>(null);

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

    const openLightbox = (index: number) => {
        if (!enableZoom) return;
        setLightboxIndex(index);
        setIsLightboxOpen(true);
    };

    const handleLightboxPrev = () => {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
    };

    const handleLightboxNext = () => {
        setLightboxIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
    };

    // Synchroniser la position du carrousel principal quand le lightbox est fermé
    const handleLightboxOpenChange = (open: boolean) => {
        setIsLightboxOpen(open);
        if (!open) {
            scrollToImage(lightboxIndex);
        }
    };

    // Support des flèches clavier dans le lightbox
    useEffect(() => {
        if (!isLightboxOpen || validImages.length <= 1) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                setLightboxIndex((prev) => (prev > 0 ? prev - 1 : validImages.length - 1));
            } else if (e.key === "ArrowRight") {
                setLightboxIndex((prev) => (prev < validImages.length - 1 ? prev + 1 : 0));
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isLightboxOpen, validImages.length]);

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

    return (
        <div className="flex flex-col space-y-4 w-full">
            {/* Conteneur de l'image principale / Carrousel Scroll-Snap */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-border/80 bg-muted/20 shadow-xs group">
                <div
                    ref={carouselRef}
                    onScroll={handleScroll}
                    className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-none"
                    style={{ scrollSnapType: "x mandatory" }}
                >
                    {validImages.map((src, idx) => (
                        <div
                            key={`${src}-${idx}`}
                            onClick={() => openLightbox(idx)}
                            className={`w-full h-full shrink-0 snap-center relative aspect-square flex items-center justify-center bg-background/50 ${
                                enableZoom ? "cursor-zoom-in" : ""
                            }`}
                        >
                            <Image
                                src={src}
                                alt={`${title} - Photo ${idx + 1}`}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                                className="object-contain p-2 md:p-4 transition-transform duration-300 group-hover:scale-[1.02]"
                                priority={idx === 0}
                            />
                        </div>
                    ))}
                </div>

                {/* Sold Out Overlay Badge */}
                {isOutOfStock && (
                    <span className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 uppercase font-bold z-10">
                        Sold
                    </span>
                )}

                {/* Bouton Zoom Indicateur */}
                {enableZoom && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            openLightbox(selectedIndex);
                        }}
                        className="absolute top-3 left-3 p-2 rounded-full bg-background/80 hover:bg-background backdrop-blur-xs border text-foreground/80 hover:text-foreground shadow-xs transition-opacity opacity-80 md:opacity-0 md:group-hover:opacity-100 cursor-pointer z-10"
                        aria-label="Agrandir l'image"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </button>
                )}

                {/* Flèches de navigation (si plusieurs images) */}
                {validImages.length > 1 && (
                    <>
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            onClick={handlePrev}
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

            {/* Lightbox / Zoom Dialog Modal */}
            {enableZoom && (
                <Dialog open={isLightboxOpen} onOpenChange={handleLightboxOpenChange}>
                    <DialogContent className="max-w-[96vw] md:max-w-6xl lg:max-w-7xl h-[92vh] p-4 sm:p-6 bg-black/95 border-zinc-800 text-white flex flex-col justify-between overflow-hidden [&>button]:text-white [&>button]:opacity-80 [&>button:hover]:opacity-100 [&>button]:p-1.5 [&>button]:rounded-full [&>button]:bg-zinc-800/80">
                        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-800/60 z-10">
                            <div className="min-w-0 pr-6">
                                <DialogTitle className="text-base sm:text-lg font-semibold text-white truncate">
                                    {title}
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    {title} image lightbox zoom
                                </DialogDescription>
                            </div>
                            {validImages.length > 1 && (
                                <span className="text-xs sm:text-sm text-zinc-400 font-medium px-3 shrink-0">
                                    {lightboxIndex + 1} / {validImages.length}
                                </span>
                            )}
                        </DialogHeader>

                        {/* Conteneur de l'image agrandie en plein écran avec flèches */}
                        <div className="relative flex-1 w-full h-full min-h-0 flex items-center justify-center my-auto">
                            {validImages[lightboxIndex] && (
                                <Image
                                    src={validImages[lightboxIndex]}
                                    alt={`${title} - Zoom ${lightboxIndex + 1}`}
                                    fill
                                    sizes="95vw"
                                    className="object-contain"
                                    priority
                                />
                            )}

                            {validImages.length > 1 && (
                                <>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLightboxPrev();
                                        }}
                                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/60 hover:bg-black/80 text-white border-zinc-700 shadow-lg cursor-pointer z-20"
                                        aria-label="Image précédente"
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLightboxNext();
                                        }}
                                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/60 hover:bg-black/80 text-white border-zinc-700 shadow-lg cursor-pointer z-20"
                                        aria-label="Image suivante"
                                    >
                                        <ChevronRight className="h-6 w-6" />
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Rangée de miniatures du Lightbox si plusieurs photos */}
                        {validImages.length > 1 && (
                            <div className="flex gap-2 justify-center overflow-x-auto py-2 z-10">
                                {validImages.map((src, idx) => (
                                    <button
                                        key={`lightbox-thumb-${src}-${idx}`}
                                        type="button"
                                        onClick={() => setLightboxIndex(idx)}
                                        className={`relative h-12 w-12 sm:h-14 sm:w-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                                            idx === lightboxIndex
                                                ? "border-white ring-2 ring-white/30 scale-105"
                                                : "border-zinc-700 opacity-60 hover:opacity-100"
                                        }`}
                                    >
                                        <Image
                                            src={src}
                                            alt={`Vignette ${idx + 1}`}
                                            fill
                                            sizes="60px"
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
