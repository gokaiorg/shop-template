"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Mail, ArrowLeft } from "lucide-react";

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
import { StoreSettings } from "@/types/database";
import { contactSectionSchema, ContactSectionFormData } from "@/schemas/settings";
import { updateContactBlockSettings } from "@/actions/settings";
import { useBrand } from "@/components/providers/BrandProvider";
import { getLocaleDisplayName } from "@/lib/i18n";

interface AdminContactBlockFormProps {
    initialData: StoreSettings;
    lang: string;
    dict?: Record<string, string>;
}

export function AdminContactBlockForm({ initialData, lang, dict }: AdminContactBlockFormProps) {
    const router = useRouter();
    const { supportedLocales, defaultLocale, isMultiLocale } = useBrand();
    const [activeLang, setActiveLang] = useState<string>(defaultLocale || lang || "en");
    const [isPending, startTransition] = useTransition();

    const defaultContactTitle: Record<string, string> = {};
    const defaultContactDesc: Record<string, string> = {};

    supportedLocales.forEach((loc) => {
        defaultContactTitle[loc] = initialData.contactSection?.title?.[loc] || initialData.contactSection?.title?.en || "";
        defaultContactDesc[loc] = initialData.contactSection?.description?.[loc] || initialData.contactSection?.description?.en || "";
    });

    const form = useForm<ContactSectionFormData>({
        resolver: zodResolver(contactSectionSchema) as any,
        defaultValues: {
            enabled: initialData.contactSection?.enabled ?? false,
            title: defaultContactTitle,
            description: defaultContactDesc,
        },
    });

    const onSubmit = (values: ContactSectionFormData) => {
        startTransition(async () => {
            const res = await updateContactBlockSettings(values);
            if (res.success) {
                toast.success(
                    lang === "fr"
                        ? "Bloc Contact mis à jour avec succès !"
                        : "Contact block updated successfully!"
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
                            name="enabled"
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
                                                name={`title.${loc}`}
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
                                                name={`description.${loc}`}
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
                                        name={`title.${defaultLocale}`}
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
                                        name={`description.${defaultLocale}`}
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
                                <span>{lang === "fr" ? "Enregistrer" : "Save Changes"}</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
