"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, HelpCircle, ArrowLeft, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminBottomBar } from "@/components/admin/AdminBottomBar";
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
import { StoreSettings } from "@/types/database";
import { faqSectionSchema, FaqSectionFormData } from "@/schemas/settings";
import { updateFaqBlockSettings } from "@/actions/settings";
import { useBrand } from "@/components/providers/BrandProvider";
import { getLocaleDisplayName } from "@/lib/i18n";

interface AdminFaqBlockFormProps {
    initialData: StoreSettings;
    lang: string;
    dict?: Record<string, string>;
}

export function AdminFaqBlockForm({ initialData, lang }: AdminFaqBlockFormProps) {
    const router = useRouter();
    const { supportedLocales, defaultLocale, isMultiLocale } = useBrand();
    const [activeLang, setActiveLang] = useState<string>(defaultLocale || lang || "en");
    const [isPending, startTransition] = useTransition();

    const isFr = lang === "fr";

    // Setup multilingual defaults
    const defaultFaqTitle: Record<string, string> = {};
    const defaultFaqSubtitle: Record<string, string> = {};

    supportedLocales.forEach((loc) => {
        const rawTitle = initialData.faqSection?.title;
        const rawSubtitle = initialData.faqSection?.subtitle;

        defaultFaqTitle[loc] =
            typeof rawTitle === "object"
                ? rawTitle?.[loc] || rawTitle?.en || ""
                : typeof rawTitle === "string"
                ? rawTitle
                : "";

        defaultFaqSubtitle[loc] =
            typeof rawSubtitle === "object"
                ? rawSubtitle?.[loc] || rawSubtitle?.en || ""
                : typeof rawSubtitle === "string"
                ? rawSubtitle
                : "";
    });

    // Parse initial items
    const rawItems = Array.isArray(initialData.faqSection?.items)
        ? initialData.faqSection.items
        : [];

    const defaultFaqItems = rawItems.map((item, idx) => {
        const qObj: Record<string, string> = {};
        const aObj: Record<string, string> = {};

        supportedLocales.forEach((loc) => {
            if (typeof item.question === "object") {
                qObj[loc] = (item.question as any)?.[loc] || (item.question as any)?.en || "";
            } else if (typeof item.question === "string") {
                qObj[loc] = item.question;
            } else {
                qObj[loc] = "";
            }

            if (typeof item.answer === "object") {
                aObj[loc] = (item.answer as any)?.[loc] || (item.answer as any)?.en || "";
            } else if (typeof item.answer === "string") {
                aObj[loc] = item.answer;
            } else {
                aObj[loc] = "";
            }
        });

        return {
            id: item.id || `faq-${idx}`,
            question: qObj,
            answer: aObj,
        };
    });

    const form = useForm<FaqSectionFormData>({
        resolver: zodResolver(faqSectionSchema) as any,
        defaultValues: {
            enabled: initialData.faqSection?.enabled ?? false,
            status: initialData.faqSection?.status || (initialData.faqSection?.enabled ? "active" : "inactive"),
            title: defaultFaqTitle,
            subtitle: defaultFaqSubtitle,
            items: defaultFaqItems,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const handleAddQuestion = () => {
        const qObj: Record<string, string> = {};
        const aObj: Record<string, string> = {};
        supportedLocales.forEach((loc) => {
            qObj[loc] = "";
            aObj[loc] = "";
        });

        append({
            id: `faq-${Date.now()}`,
            question: qObj,
            answer: aObj,
        });
    };

    const onSubmit = (values: FaqSectionFormData) => {
        startTransition(async () => {
            // Ensure status syncs with enabled
            const payload: FaqSectionFormData = {
                ...values,
                status: values.enabled ? "active" : "inactive",
            };

            const res = await updateFaqBlockSettings(payload);
            if (res.success) {
                toast.success(
                    isFr
                        ? "Section FAQ mise à jour avec succès !"
                        : "FAQ section updated successfully!"
                );
                form.reset(payload);
                router.refresh();
            } else {
                toast.error(res.error || (isFr ? "Une erreur est survenue." : "An error occurred."));
            }
        });
    };

    const onError = (errors: any) => {
        console.error("[FAQ_FORM_VALIDATION_ERRORS]", errors);
        toast.error(
            isFr
                ? "Veuillez vérifier les champs du formulaire."
                : "Please check form errors."
        );
    };

    const errorCount = Object.keys(form.formState.errors).length;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6 max-w-5xl flex-1 flex flex-col">
                {/* Back navigation */}
                <div className="flex items-center justify-between">
                    <Link
                        href={`/${lang}/admin/blocks`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors px-3 py-1.5 rounded-md w-fit"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>{isFr ? "Retour aux blocs" : "Back to blocks"}</span>
                    </Link>
                </div>

                {/* FAQ Section Card */}
                <Card>
                    <CardHeader className="border-b pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-lg font-semibold tracking-tight">
                                        {isFr ? "Section FAQ (Foire aux questions)" : "FAQ Section"}
                                    </h2>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {isFr
                                        ? "Configurez les questions-réponses pour vos visiteurs. Injecte automatiquement les données structurées FAQPage pour le SEO et GEO (Google Search Generative Experience)."
                                        : "Configure Q&A pairs for your visitors. Automatically injects FAQPage structured data for SEO and GEO (Google Search Generative Experience)."}
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
                                                onCheckedChange={(val) => {
                                                    field.onChange(val);
                                                    form.setValue("status", val ? "active" : "inactive");
                                                }}
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

                        {/* Title and Subtitle */}
                        <div className="space-y-4 pt-2">
                            <h4 className="text-sm font-semibold">
                                {isFr ? "En-tête de la section" : "Section Heading"}
                            </h4>
                            {isMultiLocale ? (
                                supportedLocales.map((loc) => (
                                    <div
                                        key={loc}
                                        className={loc === activeLang ? "space-y-4" : "hidden"}
                                    >
                                        <FormField
                                            control={form.control}
                                            name={`title.${loc}` as any}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {isFr ? "Titre principal" : "Main Title"}{" "}
                                                        <span className="text-xs text-muted-foreground">
                                                            ({getLocaleDisplayName(loc)})
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={
                                                                loc === "fr"
                                                                    ? "Questions fréquentes"
                                                                    : "Frequently Asked Questions"
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
                                            name={`subtitle.${loc}` as any}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {isFr ? "Sous-titre / Description" : "Subtitle / Description"}{" "}
                                                        <span className="text-xs text-muted-foreground">
                                                            ({getLocaleDisplayName(loc)})
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={
                                                                loc === "fr"
                                                                    ? "Trouvez des réponses rapides à vos questions."
                                                                    : "Find quick answers to common questions."
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
                                        name={`title.${defaultLocale}` as any}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{isFr ? "Titre principal" : "Main Title"}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`subtitle.${defaultLocale}` as any}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{isFr ? "Sous-titre" : "Subtitle"}</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Questions & Answers List */}
                        <div className="space-y-4 pt-6 border-t border-border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold">
                                        {isFr ? "Questions & Réponses" : "Questions & Answers"}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {isFr
                                            ? "Ajoutez autant de questions/réponses que souhaité."
                                            : "Add as many question/answer pairs as needed."}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddQuestion}
                                    className="gap-2 cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>{isFr ? "Ajouter une question" : "Add Question"}</span>
                                </Button>
                            </div>

                            {fields.length === 0 ? (
                                <div className="p-8 text-center border border-dashed rounded-lg text-muted-foreground text-sm">
                                    {isFr
                                        ? "Aucune question pour le moment. Cliquez sur 'Ajouter une question' pour commencer."
                                        : "No questions yet. Click 'Add Question' to get started."}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {fields.map((fieldItem, index) => (
                                        <div
                                            key={fieldItem.id}
                                            className="p-5 border rounded-lg bg-card/50 space-y-4 relative group"
                                        >
                                            <div className="flex items-center justify-between pb-2 border-b border-border/50">
                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                    {isFr ? `Question #${index + 1}` : `Question #${index + 1}`}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => remove(index)}
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                                    title={isFr ? "Supprimer la question" : "Remove question"}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            {isMultiLocale ? (
                                                supportedLocales.map((loc) => (
                                                    <div
                                                        key={loc}
                                                        className={loc === activeLang ? "space-y-3" : "hidden"}
                                                    >
                                                        <FormField
                                                            control={form.control}
                                                            name={`items.${index}.question.${loc}` as any}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs font-medium">
                                                                        {isFr ? "Question" : "Question"}{" "}
                                                                        <span className="text-muted-foreground">
                                                                            ({getLocaleDisplayName(loc)})
                                                                        </span>
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            placeholder={
                                                                                loc === "fr"
                                                                                    ? "Ex: Quels sont les délais de livraison ?"
                                                                                    : "E.g. What are the delivery times?"
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
                                                            name={`items.${index}.answer.${loc}` as any}
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel className="text-xs font-medium">
                                                                        {isFr ? "Réponse" : "Answer"}{" "}
                                                                        <span className="text-muted-foreground">
                                                                            ({getLocaleDisplayName(loc)})
                                                                        </span>
                                                                    </FormLabel>
                                                                    <FormControl>
                                                                        <Textarea
                                                                            rows={3}
                                                                            placeholder={
                                                                                loc === "fr"
                                                                                    ? "Rédigez la réponse détaillée..."
                                                                                    : "Write the detailed answer..."
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
                                                <div className="space-y-3">
                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.question.${defaultLocale}` as any}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs font-medium">
                                                                    {isFr ? "Question" : "Question"}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name={`items.${index}.answer.${defaultLocale}` as any}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-xs font-medium">
                                                                    {isFr ? "Réponse" : "Answer"}
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Textarea rows={3} {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
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
