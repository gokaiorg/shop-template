"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, BookOpen, ArrowLeft } from "lucide-react";
import { AdminImageDropzone } from "@/components/admin/AdminImageDropzone";
import { AdminBottomBar } from "@/components/admin/AdminBottomBar";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StoreSettings } from "@/types/database";
import { aboutSectionSchema, AboutSectionFormData } from "@/schemas/settings";
import { updateAboutBlockSettings } from "@/actions/settings";
import { uploadBrandAsset } from "@/lib/firebase-storage";
import { useBrand } from "@/components/providers/BrandProvider";
import { getLocaleDisplayName } from "@/lib/i18n";

interface AdminAboutBlockFormProps {
    initialData: StoreSettings;
    lang: string;
    dict?: Record<string, string>;
}

export function AdminAboutBlockForm({ initialData, lang, dict }: AdminAboutBlockFormProps) {
    const router = useRouter();
    const { supportedLocales, defaultLocale, isMultiLocale } = useBrand();
    const [activeLang, setActiveLang] = useState<string>(defaultLocale || lang || "en");
    const [isPending, startTransition] = useTransition();

    const isFr = lang === "fr";

    const defaultAboutTitle: Record<string, string> = {};
    const defaultAboutDesc: Record<string, string> = {};
    const defaultAboutCtaLabel: Record<string, string> = {};

    supportedLocales.forEach((loc) => {
        defaultAboutTitle[loc] = initialData.aboutSection?.title?.[loc] || initialData.aboutSection?.title?.en || "";
        defaultAboutDesc[loc] = initialData.aboutSection?.description?.[loc] || initialData.aboutSection?.description?.en || "";
        defaultAboutCtaLabel[loc] = initialData.aboutSection?.ctaLabel?.[loc] || initialData.aboutSection?.ctaLabel?.en || "";
    });

    const form = useForm<AboutSectionFormData>({
        resolver: zodResolver(aboutSectionSchema) as any,
        defaultValues: {
            enabled: initialData.aboutSection?.enabled ?? false,
            title: defaultAboutTitle,
            description: defaultAboutDesc,
            ctaLabel: defaultAboutCtaLabel,
            ctaUrl: initialData.aboutSection?.ctaUrl || "",
            images: initialData.aboutSection?.images || [],
        },
    });

    const onSubmit = (values: AboutSectionFormData) => {
        startTransition(async () => {
            const res = await updateAboutBlockSettings(values);
            if (res.success) {
                toast.success(isFr ? "Section À propos mise à jour !" : "About section updated successfully!");
                form.reset(values);
                router.refresh();
            } else {
                toast.error(res.error || (lang === "fr" ? "Une erreur est survenue." : "An error occurred."));
            }
        });
    };

    const errorCount = Object.keys(form.formState.errors).length;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl flex-1 flex flex-col">
                {/* Back to Blocks Link */}
                <div className="flex items-center justify-between">
                    <Link
                        href={`/${lang}/admin/blocks`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors px-3 py-1.5 rounded-md w-fit"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>{lang === "fr" ? "Retour aux blocs" : "Back to blocks"}</span>
                    </Link>
                </div>

                {/* About Section Card */}
                <Card>
                    <CardHeader className="border-b pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-lg font-semibold tracking-tight">
                                        {isFr ? "Section À propos" : "About Section"}
                                    </h2>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {isFr
                                        ? "Mettez en avant l'histoire, les valeurs ou le savoir-faire de votre marque avec un carrousel d'images."
                                        : "Highlight your brand story, craft, and values on the homepage with an interactive photo carousel."}
                                </p>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                                {/* Language Switcher */}
                                {isMultiLocale && (
                                    <Tabs value={activeLang} onValueChange={setActiveLang}>
                                        <TabsList className="h-8 p-0.5 bg-muted/60">
                                            {supportedLocales.map((loc) => (
                                                <TabsTrigger
                                                    key={loc}
                                                    value={loc}
                                                    className="uppercase text-xs font-semibold px-2.5 h-7 data-[state=active]:shadow-xs cursor-pointer"
                                                >
                                                    {loc.toUpperCase()}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </Tabs>
                                )}

                                {/* Activation Switch */}
                                <FormField
                                    control={form.control}
                                    name="enabled"
                                    render={({ field }) => (
                                        <div className="flex items-center gap-2 border border-border/80 rounded-lg px-2.5 py-1 bg-muted/30 h-8">
                                            <span className="text-xs font-medium select-none">
                                                {field.value
                                                    ? (isFr ? "Activé" : "Active")
                                                    : (isFr ? "Désactivé" : "Inactive")}
                                            </span>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isPending}
                                                className="scale-75 origin-right cursor-pointer"
                                            />
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {/* Multilingual Text Fields (Title, Description, CTA Label) */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold">
                                {isFr ? "Contenu rédactionnel" : "Editorial Content"}
                            </h4>
                            {isMultiLocale ? (
                                supportedLocales.map((loc) => (
                                    <div
                                        key={loc}
                                        className={loc === activeLang ? "space-y-4" : "hidden"}
                                    >
                                        <FormField
                                            control={form.control}
                                            name={`title.${loc}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {isFr ? "Titre de la section" : "Section Title"}{" "}
                                                        <span className="text-xs text-muted-foreground">
                                                            ({getLocaleDisplayName(loc)})
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={
                                                                isFr
                                                                    ? `Titre en ${getLocaleDisplayName(loc)}`
                                                                    : `Title in ${getLocaleDisplayName(loc)}`
                                                            }
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`description.${loc}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {isFr ? "Description / Histoire" : "Description / Story"}{" "}
                                                        <span className="text-xs text-muted-foreground">
                                                            ({getLocaleDisplayName(loc)})
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            rows={4}
                                                            placeholder={
                                                                isFr
                                                                    ? `Description en ${getLocaleDisplayName(loc)}`
                                                                    : `Description in ${getLocaleDisplayName(loc)}`
                                                            }
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`ctaLabel.${loc}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {isFr ? "Texte du bouton d'action (CTA)" : "Button Label (CTA)"}{" "}
                                                        <span className="text-xs text-muted-foreground">
                                                            ({getLocaleDisplayName(loc)})
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={
                                                                isFr ? "Ex: En savoir plus" : "e.g. Discover More"
                                                            }
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name={`title.${defaultLocale}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{isFr ? "Titre de la section" : "Section Title"}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Section Title" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`description.${defaultLocale}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {isFr ? "Description / Histoire" : "Description / Story"}
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea rows={4} placeholder="Story or description..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`ctaLabel.${defaultLocale}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    {isFr ? "Texte du bouton d'action (CTA)" : "Button Label (CTA)"}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Learn More" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* CTA URL */}
                        <div className="border-t pt-4">
                            <FormField
                                control={form.control}
                                name="ctaUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {isFr ? "Lien de destination du bouton (URL)" : "CTA Button Link (URL)"}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={isFr ? "/a-propos ou https://..." : "/about or https://..."}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            {isFr
                                                ? "Chemin interne (ex: /fr/notre-histoire) ou URL externe complète."
                                                : "Internal path (e.g. /en/about-us) or complete external URL."}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                                {/* Image Carousel Upload */}
                                <div className="border-t pt-4">
                                    <FormField
                                        control={form.control}
                                        name="images"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center justify-between">
                                                    <span>
                                                        {lang === "fr" ? "Galerie d'images (Carrousel)" : "Image Gallery (Carousel)"}
                                                    </span>
                                                    {Array.isArray(field.value) && field.value.length > 0 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {field.value.length} {field.value.length === 1 ? "image" : "images"}
                                                        </Badge>
                                                    )}
                                                </FormLabel>
                                                <FormControl>
                                                    <AdminImageDropzone
                                                        value={field.value || []}
                                                        onChange={(urls) => field.onChange(urls)}
                                                        multiple={true}
                                                        maxFiles={5}
                                                        aspectRatio="video"
                                                        recommendedText={
                                                            lang === "fr"
                                                                ? "Jusqu'à 5 photos (4:3 ou 16:9, WebP/JPEG)"
                                                                : "Up to 5 photos (4:3 or 16:9, WebP/JPEG)"
                                                        }
                                                        onUpload={(file) => uploadBrandAsset(file, "about")}
                                                        lang={lang}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-xs">
                                                    {lang === "fr"
                                                        ? "Si une seule photo est téléchargée, elle est affichée en visuel fixe. Si plusieurs photos sont présentes (jusqu'à 5), un carrousel interactif est généré automatiquement."
                                                        : "If 1 image is uploaded, it renders as a static visual. If multiple images are provided (up to 5), an interactive carousel is automatically generated."}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                    </CardContent>
                </Card>

                {/* Standardized Bottom Action Bar */}
                <AdminBottomBar
                    isPending={isPending}
                    saveLabel="Save"
                    savingLabel={isFr ? "Enregistrement..." : "Saving..."}
                    errorsCount={errorCount}
                    lang={lang}
                />
            </form>
        </Form>
    );
}
