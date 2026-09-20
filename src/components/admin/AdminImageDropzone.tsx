"use client";

import React, { useState, useRef, useMemo } from "react";
import Image from "next/image";
import { Upload, Image as ImageIcon, Loader2, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { uploadProductImage } from "@/lib/firebase-storage";

export interface AdminImageDropzoneProps {
    value?: string | string[] | null;
    onChange: (value: any) => void;
    maxFiles?: number;
    multiple?: boolean;
    onUpload?: (file: File) => Promise<string>;
    lang?: string;
    title?: string;
    description?: string;
    recommendedText?: string;
    aspectRatio?: "square" | "video" | "banner" | "auto";
    disabled?: boolean;
    className?: string;
}

export function AdminImageDropzone({
    value,
    onChange,
    maxFiles,
    multiple = false,
    onUpload,
    lang = "en",
    title,
    recommendedText,
    aspectRatio = "auto",
    disabled = false,
    className = "",
}: AdminImageDropzoneProps) {
    const isSingle = maxFiles === 1 || (!multiple && maxFiles === undefined);
    const effectiveMax = isSingle ? 1 : (maxFiles || Infinity);

    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Normalize value into an array of URLs
    const images: string[] = useMemo(() => {
        if (!value) return [];
        if (Array.isArray(value)) return value.filter(Boolean);
        if (typeof value === "string" && value.trim()) return [value.trim()];
        return [];
    }, [value]);

    const handleFilesSelect = async (fileList: FileList | File[]) => {
        if (disabled || isUploading) return;

        const filesArray = Array.from(fileList);
        const validFiles = filesArray.filter((file) =>
            ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"].includes(file.type) ||
            /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name)
        );

        if (validFiles.length === 0) {
            toast.error(
                lang?.startsWith("fr")
                    ? "Veuillez sélectionner des fichiers images valides (PNG, JPG, WebP)."
                    : "Please select valid image files (PNG, JPG, WebP)."
            );
            return;
        }

        // If single image mode, only take the first file dropped
        const filesToUpload = isSingle ? [validFiles[0]] : validFiles;

        setIsUploading(true);
        const toastId = toast.loading(
            filesToUpload.length === 1
                ? (lang?.startsWith("fr") ? "Téléversement de l'image..." : "Uploading image...")
                : (lang?.startsWith("fr") ? `Téléversement de ${filesToUpload.length} images...` : `Uploading ${filesToUpload.length} images...`)
        );

        try {
            const uploadedUrls: string[] = [];
            for (const file of filesToUpload) {
                const url = onUpload ? await onUpload(file) : await uploadProductImage(file);
                uploadedUrls.push(url);
            }

            toast.dismiss(toastId);
            toast.success(
                filesToUpload.length === 1
                    ? (lang?.startsWith("fr") ? "Image téléversée avec succès !" : "Image uploaded successfully!")
                    : (lang?.startsWith("fr") ? `${uploadedUrls.length} images téléversées avec succès !` : `${uploadedUrls.length} images uploaded successfully!`)
            );

            if (isSingle) {
                // In single mode, replace the previous image
                onChange(uploadedUrls[0]);
            } else {
                // In multiple mode, append to list up to effectiveMax
                const updated = [...images, ...uploadedUrls].slice(0, effectiveMax);
                onChange(updated);
            }
        } catch (uploadError: any) {
            toast.dismiss(toastId);
            console.error("Image upload failed:", uploadError);
            toast.error(
                uploadError?.message ||
                (lang?.startsWith("fr") ? "Échec du téléversement de l'image." : "Failed to upload image.")
            );
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFilesSelect(e.target.files);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (disabled || isUploading) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesSelect(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled || isUploading) return;
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleRemoveImage = (indexToRemove: number) => {
        if (disabled || isUploading) return;
        if (isSingle) {
            onChange("");
        } else {
            const updated = images.filter((_, idx) => idx !== indexToRemove);
            onChange(updated);
        }
    };

    const handleSetPrimary = (indexToPrimary: number) => {
        if (disabled || isUploading || indexToPrimary === 0) return;
        const target = images[indexToPrimary];
        const remaining = images.filter((_, idx) => idx !== indexToPrimary);
        const updated = [target, ...remaining];
        onChange(updated);
    };

    const getAspectRatioClass = () => {
        switch (aspectRatio) {
            case "square":
                return "aspect-square max-w-[220px] mx-auto";
            case "video":
                return "aspect-video w-full";
            case "banner":
                return "aspect-[21/9] sm:aspect-[3/1] w-full";
            default:
                return "aspect-video w-full";
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {isUploading ? (
                /* État de chargement */
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/50 bg-primary/5 rounded-xl transition-all">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-sm font-medium text-foreground">
                        {lang?.startsWith("fr") ? "Téléversement en cours..." : "Uploading image..."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {lang?.startsWith("fr") ? "Veuillez patienter..." : "Please wait..."}
                    </p>
                </div>
            ) : images.length > 0 ? (
                /* Affichage des images (Simple ou Grille) */
                <div className="space-y-4">
                    {isSingle ? (
                        /* Mode Image Unique : Aperçu complet avec overlay */
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            className={`relative group rounded-xl overflow-hidden border-2 transition-all bg-muted/20 ${getAspectRatioClass()} ${
                                isDragOver
                                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                                    : "border-border/80 hover:border-primary/50"
                            }`}
                        >
                            <Image
                                src={images[0]}
                                alt="Uploaded preview"
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover"
                            />

                            {/* Bouton de suppression corbeille */}
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => handleRemoveImage(0)}
                                disabled={disabled}
                                className="absolute top-2 right-2 h-8 w-8 rounded-lg shadow-sm cursor-pointer z-20"
                                aria-label="Remove image"
                                title={lang?.startsWith("fr") ? "Supprimer l'image" : "Remove image"}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>

                            {/* Bouton pour changer l'image au clic */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={disabled}
                                className="absolute top-2 left-2 text-xs px-2.5 py-1 rounded-md bg-background/80 hover:bg-background text-foreground backdrop-blur-xs border shadow-xs opacity-90 hover:opacity-100 transition-opacity cursor-pointer z-20 flex items-center gap-1.5"
                                title={lang?.startsWith("fr") ? "Changer l'image" : "Change image"}
                            >
                                <RotateCcw className="h-3 w-3" />
                                <span>{lang?.startsWith("fr") ? "Remplacer" : "Replace"}</span>
                            </button>

                            {/* Affichage de l'URL source */}
                            <div
                                className="absolute bottom-0 left-0 w-full bg-black/70 text-white text-[10px] font-mono p-1.5 truncate text-center backdrop-blur-sm z-10"
                                title={images[0]}
                            >
                                {images[0]}
                            </div>
                        </div>
                    ) : (
                        /* Mode Multiple : Grille d'images */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {images.map((imgUrl, idx) => {
                                const isCover = idx === 0;
                                return (
                                    <div
                                        key={`${imgUrl}-${idx}`}
                                        className={`relative group aspect-square rounded-xl overflow-hidden border-2 bg-muted/30 transition-all ${
                                            isCover ? "border-primary shadow-xs ring-2 ring-primary/20" : "border-border/80 hover:border-border"
                                        }`}
                                    >
                                        <Image
                                            src={imgUrl}
                                            alt={`Image ${idx + 1}`}
                                            fill
                                            sizes="(max-width: 768px) 50vw, 25vw"
                                            className="object-cover"
                                        />

                                        {/* Badge Couverture sur la 1ère image */}
                                        {isCover ? (
                                            <Badge className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground font-semibold shadow-xs z-10">
                                                {lang?.startsWith("fr") ? "Couverture" : "Cover"}
                                            </Badge>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleSetPrimary(idx)}
                                                disabled={disabled}
                                                className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-md bg-background/80 hover:bg-background text-foreground backdrop-blur-xs border shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                                title={lang?.startsWith("fr") ? "Définir comme couverture" : "Set as cover image"}
                                            >
                                                {lang?.startsWith("fr") ? "Couverture" : "Set cover"}
                                            </button>
                                        )}

                                        {/* Bouton de suppression */}
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleRemoveImage(idx)}
                                            disabled={disabled}
                                            className="absolute top-2 right-2 h-7 w-7 rounded-lg opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer z-10"
                                            aria-label="Remove image"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>

                                        {/* Numéro d'ordre */}
                                        <span className="absolute bottom-6 right-1.5 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white font-mono pointer-events-none z-10">
                                            #{idx + 1}
                                        </span>

                                        {/* Affichage de l'URL */}
                                        <div
                                            className="absolute bottom-0 left-0 w-full bg-black/70 text-white text-[9px] font-mono p-1 truncate text-center backdrop-blur-sm z-10"
                                            title={imgUrl}
                                        >
                                            {imgUrl}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Zone de drop secondaire compacte (pour ajouter ou remplacer) */}
                    {(!isSingle || images.length > 0) && (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex items-center justify-center p-3 sm:p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                                isDragOver
                                    ? "border-primary bg-primary/5"
                                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20"
                            } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                        >
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Upload className="h-4 w-4 text-primary shrink-0" />
                                <span>
                                    {isSingle
                                        ? (lang?.startsWith("fr")
                                            ? "Glissez une image pour remplacer ou cliquez pour parcourir"
                                            : "Drop a new image here to replace or click to browse")
                                        : (lang?.startsWith("fr")
                                            ? "Déposez d'autres images ici ou cliquez pour parcourir"
                                            : "Drop additional images here or click to browse")}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Zone de drop principale (quand aucune image n'est présente) */
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                        isDragOver
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                    } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                >
                    <div className="p-3 bg-muted rounded-full mb-3 text-muted-foreground">
                        <ImageIcon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-foreground text-center">
                        {title || (lang?.startsWith("fr")
                            ? (isSingle ? "Cliquez ou glissez-déposez une image ici" : "Cliquez ou glissez-déposez des images ici")
                            : (isSingle ? "Click or drag an image here" : "Click or drag images here"))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                        {recommendedText || (lang?.startsWith("fr")
                            ? `PNG, JPG, WEBP • ${isSingle ? "1 fichier max" : "Plusieurs fichiers autorisés"}`
                            : `PNG, JPG, WEBP • ${isSingle ? "1 file max" : "Multiple files allowed"}`)}
                    </p>
                </div>
            )}

            {/* Input fichier masqué */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                multiple={!isSingle}
                onChange={handleFileInputChange}
                disabled={disabled}
                className="hidden"
            />
        </div>
    );
}
