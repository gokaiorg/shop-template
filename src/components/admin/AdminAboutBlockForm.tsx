"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, BookOpen, ArrowLeft } from "lucide-react";
import { AdminImageDropzone } from "@/components/admin/AdminImageDropzone";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
                toast.success(
                    lang === "fr"
                        ? "Bloc À propos mis à jour avec succès !"
                        : "About block updated successfully!"
                );
                router.refresh();
            } else {
                toast.error(res.error || (lang === "fr" ? "Une erreur est survenue." : "An error occurred."));
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl pb-24">
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
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-lg font-medium tracking-tight">
                                {lang === "fr" ? "Section À propos" : "About Section"}
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {lang === "fr"
                                ? "Mettez en avant l'histoire, les valeurs ou le savoir-faire de votre marque avec un carrousel d'images."
                                : "Highlight your brand story, craft, and values on the homepage with an interactive photo carousel."}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Enable/Disable Toggle */}
                        <FormField
                            control={form.control}
                            name="enabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-xs">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base font-semibold">
                                            {lang === "fr" ? "Activer la section À propos" : "Enable About Section"}
                                        </FormLabel>
                                        <FormDescription>
                                            {lang === "fr"
                                                ? "Affiche ce bloc sur la page d'accueil juste au-dessus du pied de page."
                                                : "Displays this block on the homepage right above the footer."}
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* Multilingual Text Fields (Title, Description, CTA Label) */}
                        <div className="space-y-6">
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-semibold mb-3">
                                        {lang === "fr" ? "Contenu rédactionnel" : "Editorial Content"}
                                    </h4>
                                    {isMultiLocale ? (
                                        <Tabs value={activeLang} onValueChange={setActiveLang} className="w-full">
                                            <TabsList className="mb-4">
                                                {supportedLocales.map((loc) => (
                                                    <TabsTrigger key={loc} value={loc} className="uppercase text-xs">
                                                        {loc.toUpperCase()}
                                                    </TabsTrigger>
                                                ))}
                                            </TabsList>
                                            {supportedLocales.map((loc) => (
                                                <TabsContent key={loc} value={loc} className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`title.${loc}`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    {lang === "fr" ? "Titre de la section" : "Section Title"}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={
                                                                            lang === "fr"
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
                                                                    {lang === "fr" ? "Description / Histoire" : "Description / Story"}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        rows={4}
                                                                        placeholder={
                                                                            lang === "fr"
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
                                                                    {lang === "fr" ? "Texte du bouton d'action (CTA)" : "Button Label (CTA)"}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={
                                                                            lang === "fr" ? "Ex: En savoir plus" : "e.g. Discover More"
                                                                        }
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </TabsContent>
                                            ))}
                                        </Tabs>
                                    ) : (
                                        <div className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name={`title.${defaultLocale}`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {lang === "fr" ? "Titre de la section" : "Section Title"}
                                                        </FormLabel>
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
                                                            {lang === "fr" ? "Description / Histoire" : "Description / Story"}
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
                                                            {lang === "fr" ? "Texte du bouton d'action (CTA)" : "Button Label (CTA)"}
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
                                                    {lang === "fr" ? "Lien de destination du bouton (URL)" : "CTA Button Link (URL)"}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={lang === "fr" ? "/a-propos ou https://..." : "/about or https://..."}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-xs">
                                                    {lang === "fr"
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
                                                        <Badge variant="outline" className="text-[10px]">
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
                            </div>
                    </CardContent>
                </Card>

                {/* Sticky / Fixed Bottom Action Bar */}
                <div className="fixed bottom-0 right-0 left-0 md:left-64 z-30 border-t bg-background/95 backdrop-blur-md px-6 py-4 flex items-center justify-end shadow-md">
                    <Button type="submit" disabled={isPending} className="cursor-pointer gap-2 min-w-[140px]">
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{lang === "fr" ? "Enregistrement..." : "Saving..."}</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>{lang === "fr" ? "Enregistrer" : "Save Changes"}</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
