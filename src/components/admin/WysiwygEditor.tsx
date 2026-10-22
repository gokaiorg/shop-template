"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
    Code,
    Edit3,
    Bold,
    Italic,
    Heading2,
    Heading3,
    Pilcrow,
    List,
    ListOrdered,
    Minus,
    Link as LinkIcon,
    Image as ImageIcon,
    Upload,
    Globe,
    Loader2,
    Sun,
    Moon,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { uploadImage } from "@/actions/admin";
import { uploadProductImage } from "@/lib/firebase-storage";
import { useBrand } from "@/components/providers/BrandProvider";

export interface WysiwygEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    onUpload?: (file: File) => Promise<string>;
    storagePathPrefix?: string;
    defaultTheme?: "light" | "dark" | "system";
}

export type EditorMode = "visual" | "html";

export function WysiwygEditor({
    value,
    onChange,
    placeholder,
    disabled = false,
    onUpload,
    storagePathPrefix = "pages",
    defaultTheme: propDefaultTheme,
}: WysiwygEditorProps) {
    const brandContext = useBrand();
    const effectiveStoreTheme: "light" | "dark" | "system" =
        propDefaultTheme || brandContext?.defaultTheme || "system";
    const isSystemTheme = effectiveStoreTheme === "system";

    const [mode, setMode] = useState<EditorMode>("visual");
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
    const [activeImageTab, setActiveImageTab] = useState<string>("upload");
    const [imageUrlInput, setImageUrlInput] = useState<string>("");
    const [imageAltInput, setImageAltInput] = useState<string>("");
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadedUrl, setUploadedUrl] = useState<string>("");
    const [isUserOverridden, setIsUserOverridden] = useState<boolean>(false);

    const [previewTheme, setPreviewTheme] = useState<"light" | "dark">(() => {
        if (effectiveStoreTheme === "dark") {
            return "dark";
        }
        if (effectiveStoreTheme === "light") {
            return "light";
        }
        if (typeof document !== "undefined") {
            return document.documentElement.classList.contains("dark") ||
                window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
        }
        return "light";
    });

    const contentRef = useRef<HTMLDivElement>(null);
    const isFocusedRef = useRef<boolean>(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const savedSelectionRef = useRef<Range | null>(null);

    useEffect(() => {
        if (effectiveStoreTheme === "dark") {
            setPreviewTheme("dark");
            return;
        }
        if (effectiveStoreTheme === "light") {
            setPreviewTheme("light");
            return;
        }
        if (!isUserOverridden && typeof document !== "undefined") {
            const isDark =
                document.documentElement.classList.contains("dark") ||
                Boolean(contentRef.current?.closest(".dark")) ||
                window.matchMedia("(prefers-color-scheme: dark)").matches;
            setPreviewTheme(isDark ? "dark" : "light");
        }
    }, [effectiveStoreTheme, isUserOverridden]);

    const togglePreviewTheme = () => {
        if (!isSystemTheme) return;
        setIsUserOverridden(true);
        setPreviewTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    useEffect(() => {
        if (contentRef.current && !isFocusedRef.current) {
            const currentContent = contentRef.current.innerHTML;
            const targetContent = value || "";
            if (currentContent !== targetContent) {
                contentRef.current.innerHTML = targetContent;
            }
        }
    }, [value, mode]);

    const handleInput = () => {
        if (!contentRef.current) return;
        const html = contentRef.current.innerHTML;
        if (html === "<p><br></p>" || html === "<br>") {
            onChange("");
        } else {
            onChange(html);
        }
    };

    const executeCommand = (command: string, arg?: string) => {
        if (contentRef.current && !contentRef.current.contains(document.activeElement)) {
            contentRef.current.focus();
        }
        document.execCommand(command, false, arg);
        if (contentRef.current) {
            const html = contentRef.current.innerHTML;
            onChange(html === "<p><br></p>" || html === "<br>" ? "" : html);
        }
    };

    const executeFormatBlock = (tag: string) => {
        if (contentRef.current && !contentRef.current.contains(document.activeElement)) {
            contentRef.current.focus();
        }
        try {
            document.execCommand("formatBlock", false, `<${tag}>`);
        } catch {
            document.execCommand("formatBlock", false, tag);
        }
        if (contentRef.current) {
            const html = contentRef.current.innerHTML;
            onChange(html === "<p><br></p>" || html === "<br>" ? "" : html);
        }
    };

    const handleCreateLink = () => {
        if (contentRef.current && !contentRef.current.contains(document.activeElement)) {
            contentRef.current.focus();
        }
        const url = window.prompt("URL :");
        if (url) {
            document.execCommand("createLink", false, url);
            if (contentRef.current) {
                const html = contentRef.current.innerHTML;
                onChange(html === "<p><br></p>" || html === "<br>" ? "" : html);
            }
        }
    };

    const saveSelection = () => {
        if (mode === "html") return;
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && contentRef.current) {
            const range = sel.getRangeAt(0);
            if (contentRef.current.contains(range.commonAncestorContainer)) {
                savedSelectionRef.current = range.cloneRange();
                return;
            }
        }
        savedSelectionRef.current = null;
    };

    const handleOpenImageModal = () => {
        saveSelection();
        setUploadedUrl("");
        setImageUrlInput("");
        setImageAltInput("");
        setActiveImageTab("upload");
        setIsImageModalOpen(true);
    };

    const handleFileUpload = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Veuillez sélectionner un fichier image valide.");
            return;
        }
        setIsUploading(true);
        try {
            let finalUrl = "";
            if (onUpload) {
                finalUrl = await onUpload(file);
            } else {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("prefix", storagePathPrefix);
                const res = await uploadImage(formData);
                if (res.success && res.url) {
                    finalUrl = res.url;
                } else {
                    finalUrl = await uploadProductImage(file, `${storagePathPrefix}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`);
                }
            }
            setUploadedUrl(finalUrl);
            if (!imageAltInput.trim()) {
                const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
                setImageAltInput(baseName.replace(/[-_]/g, " "));
            }
            toast.success("Image téléversée avec succès !");
        } catch (err: unknown) {
            console.error("Upload failed", err);
            const errMsg = err instanceof Error ? err.message : "Échec du téléversement de l'image.";
            toast.error(errMsg);
        } finally {
            setIsUploading(false);
        }
    };

    const handleInsertImage = () => {
        const targetUrl = (activeImageTab === "upload" ? uploadedUrl : imageUrlInput).trim();
        if (!targetUrl) {
            toast.error("Veuillez fournir une URL ou téléverser une image.");
            return;
        }

        const cleanAlt = imageAltInput.trim().replace(/"/g, "&quot;");
        const imgTag = `<img src="${targetUrl}" alt="${cleanAlt}" class="max-w-full h-auto rounded-lg my-4" />`;

        if (mode === "visual") {
            if (contentRef.current) {
                contentRef.current.focus();
                let inserted = false;
                if (savedSelectionRef.current) {
                    const sel = window.getSelection();
                    if (sel) {
                        sel.removeAllRanges();
                        sel.addRange(savedSelectionRef.current);
                        try {
                            inserted = document.execCommand("insertHTML", false, imgTag);
                        } catch {
                            inserted = false;
                        }
                    }
                }
                if (!inserted && savedSelectionRef.current) {
                    try {
                        const range = savedSelectionRef.current;
                        range.deleteContents();
                        const template = document.createElement("template");
                        template.innerHTML = imgTag;
                        const frag = template.content;
                        const lastNode = frag.lastChild;
                        range.insertNode(frag);
                        if (lastNode) {
                            range.setStartAfter(lastNode);
                            range.collapse(true);
                            const sel = window.getSelection();
                            if (sel) {
                                sel.removeAllRanges();
                                sel.addRange(range);
                            }
                        }
                        inserted = true;
                    } catch {
                        inserted = false;
                    }
                }
                if (!inserted) {
                    contentRef.current.innerHTML = (contentRef.current.innerHTML || "") + imgTag;
                }
                const updatedHtml = contentRef.current.innerHTML;
                onChange(updatedHtml === "<p><br></p>" || updatedHtml === "<br>" ? "" : updatedHtml);
            }
        } else {
            if (textareaRef.current) {
                const ta = textareaRef.current;
                const start = ta.selectionStart ?? ta.value.length;
                const end = ta.selectionEnd ?? ta.value.length;
                const currentText = ta.value;
                const updated = currentText.substring(0, start) + imgTag + currentText.substring(end);
                onChange(updated);
                setTimeout(() => {
                    ta.focus();
                    ta.setSelectionRange(start + imgTag.length, start + imgTag.length);
                }, 0);
            } else {
                onChange((value || "") + imgTag);
            }
        }

        setIsImageModalOpen(false);
        setUploadedUrl("");
        setImageUrlInput("");
        setImageAltInput("");
    };

    const isEditorEmpty = !value || value.trim() === "" || value === "<p><br></p>" || value === "<br>";

    return (
        <div className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm focus-within:border-zinc-300 dark:focus-within:border-zinc-700 transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-3 py-2 rounded-t-lg">
                {mode === "visual" ? (
                    <div className="flex items-center flex-wrap gap-0.5">
                        <button
                            type="button"
                            disabled={disabled}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeCommand("bold")}
                            title="Gras"
                            className="h-8 w-8 inline-flex items-center justify-center rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            <Bold className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            disabled={disabled}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeCommand("italic")}
                            title="Italique"
                            className="h-8 w-8 inline-flex items-center justify-center rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            <Italic className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />

                        <button
                            type="button"
                            disabled={disabled}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeFormatBlock("h2")}
                            title="Titre H2"
                            className="h-8 w-8 inline-flex items-center justify-center rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            <Heading2 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            disabled={disabled}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeFormatBlock("h3")}
                            title="Titre H3"
                            className="h-8 w-8 inline-flex items-center justify-center rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            <Heading3 className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            disabled={disabled}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeFormatBlock("p")}
                            title="Paragraphe"
                            className="h-8 w-8 inline-flex items-center justify-center rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            <Pilcrow className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />

                        <button
                            type="button"
                            disabled={disabled}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeCommand("insertUnorderedList")}
                            title="Liste à puces"
                            className="h-8 w-8 inline-flex items-center justify-center rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            disabled={disabled}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeCommand("insertOrderedList")}
                            title="Liste numérotée"
                            className="h-8 w-8 inline-flex items-center justify-center rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            <ListOrdered className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            disabled={disabled}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => executeCommand("insertHorizontalRule")}
                            title="Séparateur horizontal"
                            className="h-8 w-8 inline-flex items-center justify-center rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            <Minus className="w-4 h-4" />
                        </button>

                        <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />

                        <button
                            type="button"
                            disabled={disabled}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleCreateLink}
                            title="Insérer un lien"
                            className="h-8 w-8 inline-flex items-center justify-center rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            <LinkIcon className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            disabled={disabled}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                saveSelection();
                            }}
                            onClick={handleOpenImageModal}
                            title="Insérer une image"
                            className="h-8 w-8 inline-flex items-center justify-center rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            <ImageIcon className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-mono py-1">
                            <Code className="w-3.5 h-3.5 text-primary" />
                            <span>Source HTML</span>
                        </div>
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={handleOpenImageModal}
                            title="Insérer une image"
                            className="h-7 px-2 text-xs inline-flex items-center gap-1.5 rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Image</span>
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-1.5">
                    {mode === "visual" && isSystemTheme && (
                        <button
                            type="button"
                            onClick={togglePreviewTheme}
                            title={previewTheme === "dark" ? "Passer en aperçu clair" : "Passer en aperçu sombre"}
                            aria-label="Basculer le thème de l'aperçu"
                            className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            {previewTheme === "dark" ? (
                                <Sun className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                                <Moon className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                            )}
                        </button>
                    )}

                    <div className="flex items-center gap-1 bg-zinc-200/80 dark:bg-zinc-950 p-1 rounded-md border border-zinc-300 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setMode("visual")}
                            className={`px-2.5 py-1 text-xs rounded font-medium flex items-center transition-colors ${
                                mode === "visual"
                                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                            }`}
                        >
                            <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                            Visuel
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("html")}
                            className={`px-2.5 py-1 text-xs rounded font-medium flex items-center transition-colors ${
                                mode === "html"
                                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                            }`}
                        >
                            <Code className="w-3.5 h-3.5 mr-1.5" />
                            Source HTML
                        </button>
                    </div>
                </div>
            </div>

            <div
                className={`relative rounded-b-lg border border-zinc-200 dark:border-zinc-800 border-t-0 transition-colors ${
                    previewTheme === "dark" ? "dark bg-zinc-950 text-zinc-100" : "bg-white text-zinc-900"
                }`}
                style={{
                    colorScheme: previewTheme,
                }}
            >
                <div className={mode === "visual" ? "relative block" : "hidden"}>
                    {isEditorEmpty && !isFocused && placeholder && (
                        <div
                            className={`absolute top-6 left-6 pointer-events-none select-none text-sm font-sans ${
                                previewTheme === "dark" ? "text-zinc-500" : "text-zinc-400"
                            }`}
                        >
                            {placeholder}
                        </div>
                    )}
                    <div
                        ref={contentRef}
                        contentEditable={!disabled}
                        suppressContentEditableWarning
                        onInput={handleInput}
                        onFocus={() => {
                            setIsFocused(true);
                            isFocusedRef.current = true;
                        }}
                        onBlur={() => {
                            setIsFocused(false);
                            isFocusedRef.current = false;
                        }}
                        className={`min-h-[320px] p-6 max-w-none focus:outline-none font-sans leading-relaxed prose-img:rounded-lg prose-img:max-w-full prose-img:h-auto rounded-b-lg ${
                            previewTheme === "dark"
                                ? "bg-zinc-950 text-zinc-100 prose prose-invert"
                                : "bg-white text-zinc-900 prose prose-zinc"
                        }`}
                    />
                </div>

                <div className={mode === "html" ? "block" : "hidden"}>
                    <textarea
                        ref={textareaRef}
                        value={value || ""}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        disabled={disabled}
                        spellCheck={false}
                        className="font-mono text-xs md:text-sm bg-zinc-950 text-zinc-100 p-6 min-h-[320px] w-full resize-y focus:outline-none border-0 block rounded-b-lg"
                    />
                </div>
            </div>

            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
                    <DialogHeader>
                        <DialogTitle className="text-zinc-100">Insérer une image</DialogTitle>
                    </DialogHeader>

                    <Tabs value={activeImageTab} onValueChange={setActiveImageTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-800">
                            <TabsTrigger value="upload" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                                <Upload className="w-3.5 h-3.5 mr-1.5" />
                                Téléverser
                            </TabsTrigger>
                            <TabsTrigger value="url" className="text-xs data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                                <Globe className="w-3.5 h-3.5 mr-1.5" />
                                URL externe
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="upload" className="space-y-4 pt-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(file);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                            />

                            {uploadedUrl ? (
                                <div className="space-y-2">
                                    <div className="relative rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 flex items-center justify-center h-48 w-full overflow-hidden">
                                        <Image src={uploadedUrl} alt="Preview" fill unoptimized className="object-contain rounded" />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="text-xs h-7 border-zinc-700 text-zinc-300 hover:text-white"
                                        >
                                            Changer d&apos;image
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file = e.dataTransfer.files?.[0];
                                        if (file) handleFileUpload(file);
                                    }}
                                    className="cursor-pointer border-2 border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors bg-zinc-900/30"
                                >
                                    {isUploading ? (
                                        <div className="flex flex-col items-center gap-2 py-3">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                            <p className="text-xs text-zinc-400">Téléversement en cours...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-2.5 rounded-full bg-zinc-800 text-zinc-300">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                            <p className="text-xs font-medium text-zinc-200">
                                                Cliquez ou glissez-déposez un fichier ici
                                            </p>
                                            <p className="text-[11px] text-zinc-500">
                                                PNG, JPG, WEBP, AVIF, GIF, SVG
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="img-alt-upload" className="text-xs text-zinc-300">
                                    Texte alternatif (SEO / Accessibilité)
                                </Label>
                                <Input
                                    id="img-alt-upload"
                                    placeholder="Description de l'image..."
                                    value={imageAltInput}
                                    onChange={(e) => setImageAltInput(e.target.value)}
                                    className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-200"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="url" className="space-y-4 pt-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="img-url-input" className="text-xs text-zinc-300">
                                    URL de l&apos;image (HTTPS)
                                </Label>
                                <Input
                                    id="img-url-input"
                                    placeholder="https://example.com/image.jpg"
                                    value={imageUrlInput}
                                    onChange={(e) => {
                                        setImageUrlInput(e.target.value);
                                        setUploadedUrl(e.target.value);
                                    }}
                                    className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-200 font-mono"
                                />
                            </div>

                            {imageUrlInput.trim().startsWith("http") && (
                                <div className="relative rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 flex items-center justify-center h-36 w-full overflow-hidden">
                                    <Image
                                        src={imageUrlInput.trim()}
                                        alt="Preview"
                                        fill
                                        unoptimized
                                        className="object-contain rounded"
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="img-alt-url" className="text-xs text-zinc-300">
                                    Texte alternatif (SEO / Accessibilité)
                                </Label>
                                <Input
                                    id="img-alt-url"
                                    placeholder="Description de l'image..."
                                    value={imageAltInput}
                                    onChange={(e) => setImageAltInput(e.target.value)}
                                    className="h-8 text-xs bg-zinc-900 border-zinc-800 text-zinc-200"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-zinc-800/80">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsImageModalOpen(false)}
                            className="text-xs text-zinc-400 hover:text-zinc-200"
                        >
                            Annuler
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleInsertImage}
                            disabled={isUploading || (activeImageTab === "upload" ? !uploadedUrl : !imageUrlInput.trim())}
                            className="text-xs"
                        >
                            Insérer l&apos;image
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default WysiwygEditor;
