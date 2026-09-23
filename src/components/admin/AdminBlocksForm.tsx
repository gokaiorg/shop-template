"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, BookOpen, Mail } from "lucide-react";
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
import { blocksSchema, BlocksFormData } from "@/schemas/settings";
import { updateBlocksSettings } from "@/actions/settings";
import { uploadBrandAsset } from "@/lib/firebase-storage";
import { useBrand } from "@/components/providers/BrandProvider";
import { getLocaleDisplayName } from "@/lib/i18n";

interface AdminBlocksFormProps {
    initialData: StoreSettings;
    lang: string;
    dict?: Record<string, string>;
    children?: React.ReactNode;
}

export function AdminBlocksForm({ initialData, lang, dict, children }: AdminBlocksFormProps) {
    const router = useRouter();
    const { supportedLocales, defaultLocale, isMultiLocale } = useBrand();
    const [activeLang, setActiveLang] = useState<string>(defaultLocale || lang || "en");
    const [isPending, startTransition] = useTransition();

    const defaultAboutTitle: Record<string, string> = {};
    const defaultAboutDesc: Record<string, string> = {};
    const defaultAboutCtaLabel: Record<string, string> = {};

    const defaultContactTitle: Record<string, string> = {};
    const defaultContactDesc: Record<string, string> = {};

    supportedLocales.forEach((loc) => {
        defaultAboutTitle[loc] = initialData.aboutSection?.title?.[loc] || initialData.aboutSection?.title?.en || "";
        defaultAboutDesc[loc] = initialData.aboutSection?.description?.[loc] || initialData.aboutSection?.description?.en || "";
        defaultAboutCtaLabel[loc] = initialData.aboutSection?.ctaLabel?.[loc] || initialData.aboutSection?.ctaLabel?.en || "";

        defaultContactTitle[loc] = initialData.contactSection?.title?.[loc] || initialData.contactSection?.title?.en || "";
        defaultContactDesc[loc] = initialData.contactSection?.description?.[loc] || initialData.contactSection?.description?.en || "";
    });

    const form = useForm<BlocksFormData>({
        resolver: zodResolver(blocksSchema) as any,
        defaultValues: {
            aboutSection: {
                enabled: initialData.aboutSection?.enabled ?? false,
                title: defaultAboutTitle,
                description: defaultAboutDesc,
                ctaLabel: defaultAboutCtaLabel,
                ctaUrl: initialData.aboutSection?.ctaUrl || "",
                images: initialData.aboutSection?.images || [],
            },
            contactSection: {
                enabled: initialData.contactSection?.enabled ?? false,
                title: defaultContactTitle,
                description: defaultContactDesc,
            },
        },
    });

    const aboutSectionEnabled = form.watch("aboutSection.enabled");
    const contactSectionEnabled = form.watch("contactSection.enabled");

    const onSubmit = (values: BlocksFormData) => {
        startTransition(async () => {
            const res = await updateBlocksSettings(values);
            if (res.success) {
                toast.success(
                    lang === "fr"
                        ? "Blocs éditoriaux mis à jour avec succès !"
                        : "Editorial blocks updated successfully!"
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
                            name="aboutSection.enabled"
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
                                                        name={`aboutSection.title.${loc}`}
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
                                                        name={`aboutSection.description.${loc}`}
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
                                                        name={`aboutSection.ctaLabel.${loc}`}
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
                                                name={`aboutSection.title.${defaultLocale}`}
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
                                                name={`aboutSection.description.${defaultLocale}`}
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
                                                name={`aboutSection.ctaLabel.${defaultLocale}`}
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
                                        name="aboutSection.ctaUrl"
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
                                        name="aboutSection.images"
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

                {/* Contact Section Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <Mail className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-lg font-medium tracking-tight">
                                {lang === "fr" ? "Section Contact" : "Contact Section"}
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {lang === "fr"
                                ? "Configurez les textes d'introduction du bloc de contact et du formulaire de message."
                                : "Configure the introductory heading and description for the contact inquiry block."}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Enable/Disable Toggle */}
                        <FormField
                            control={form.control}
                            name="contactSection.enabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-xs">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base font-semibold">
                                            {lang === "fr" ? "Activer la section Contact sur la page d'accueil" : "Enable Contact Section on Homepage"}
                                        </FormLabel>
                                        <FormDescription>
                                            {lang === "fr"
                                                ? "Affiche ce bloc avec le formulaire de contact sur la page d'accueil au-dessus du pied de page."
                                                : "Displays this block with the contact form on the homepage above the footer."}
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

                        {/* Text Fields */}
                        <div className="space-y-6 pt-2">
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
                                            {/* Section Title */}
                                            <FormField
                                                control={form.control}
                                                name={`contactSection.title.${loc}`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {lang === "fr" ? "Titre" : "Title"}{" "}
                                                            <span className="text-xs text-muted-foreground">({getLocaleDisplayName(loc)})</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder={loc === "fr" ? "Contactez-nous..." : "Get in touch..."}
                                                                {...field}
                                                                disabled={isPending}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Section Description */}
                                            <FormField
                                                control={form.control}
                                                name={`contactSection.description.${loc}`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {lang === "fr" ? "Description" : "Description"}{" "}
                                                            <span className="text-xs text-muted-foreground">({getLocaleDisplayName(loc)})</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                rows={3}
                                                                placeholder={
                                                                    loc === "fr"
                                                                        ? "Une question ? Envoyez-nous un message et nous vous répondrons sous 24h."
                                                                        : "Have a question? Send us a message and we will respond within 24 hours."
                                                                }
                                                                {...field}
                                                                disabled={isPending}
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
                                        name={`contactSection.title.${defaultLocale}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{lang === "fr" ? "Titre" : "Title"}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder={defaultLocale === "fr" ? "Contactez-nous..." : "Get in touch..."}
                                                        {...field}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`contactSection.description.${defaultLocale}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{lang === "fr" ? "Description" : "Description"}</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        rows={3}
                                                        placeholder={
                                                            defaultLocale === "fr"
                                                                ? "Une question ? Envoyez-nous un message et nous vous répondrons sous 24h."
                                                                : "Have a question? Send us a message and we will respond within 24 hours."
                                                        }
                                                        {...field}
                                                        disabled={isPending}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
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
                                <span>{lang === "fr" ? "Enregistrer" : "Save"}</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
