"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Trash2, Loader2, Save, ArrowLeft, Globe, Eye, LayoutTemplate, ExternalLink, RotateCcw } from "lucide-react";
import Link from "next/link";

import { createPage, updatePage, deletePage } from "@/actions/admin";
import { pageSchema, PageFormData } from "@/schemas/admin";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Page } from "@/types/database";
import { useBrand } from "@/components/providers/BrandProvider";
import { getLocaleDisplayName } from "@/lib/i18n";

function generateSlug(text: string): string {
    return text
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

interface PageFormProps {
    dict: any;
    lang: string;
    initialData?: Page | null;
}

export function PageForm({ dict, lang, initialData }: PageFormProps) {
    const router = useRouter();
    const { supportedLocales, defaultLocale, isMultiLocale } = useBrand();
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);

    const isEditMode = Boolean(initialData?.id);

    const defaultTitles: Record<string, string> = {};
    const defaultContents: Record<string, string> = {};

    supportedLocales.forEach((loc) => {
        defaultTitles[loc] = initialData?.title?.[loc] || (loc === 'fr' ? initialData?.title_fr : initialData?.title_en) || initialData?.title?.en || "";
        defaultContents[loc] = initialData?.content?.[loc] || (loc === 'fr' ? initialData?.content_fr : initialData?.content_en) || initialData?.content?.en || "";
    });

    const form = useForm<PageFormData>({
        resolver: zodResolver(pageSchema) as any,
        defaultValues: {
            slug: initialData?.slug || initialData?.id || "",
            title: defaultTitles,
            content: defaultContents,
            status: initialData?.status || "published",
            showInHeader: initialData?.showInHeader ?? false,
            showInFooter: initialData?.showInFooter ?? false,
            order: initialData?.order !== undefined ? initialData.order : Date.now(),
        },
    });

    const slugTouchedRef = useRef<boolean>(false);

    // Live auto-slug generation from title
    useEffect(() => {
        // 1. Initial generation in create mode if title has content but slug is empty
        if (!isEditMode) {
            const currentSlug = form.getValues("slug");
            if (!slugTouchedRef.current || !currentSlug) {
                const titles = form.getValues("title") || {};
                const sourceTitle = titles[defaultLocale] || Object.values(titles).find((t) => typeof t === "string" && t.trim().length > 0) || "";
                if (sourceTitle.trim()) {
                    form.setValue("slug", generateSlug(sourceTitle), { shouldValidate: true });
                }
            }
        }

        // 2. React Hook Form subscription on title keystrokes (both create and edit)
        const subscription = form.watch((value, { name }) => {
            if (!name || !name.startsWith("title")) return;

            const currentSlug = form.getValues("slug");
            if (!slugTouchedRef.current || !currentSlug) {
                const titles = form.getValues("title") || {};
                const sourceTitle = titles[defaultLocale] || Object.values(titles).find((t) => typeof t === "string" && t.trim().length > 0) || "";
                if (sourceTitle.trim()) {
                    form.setValue("slug", generateSlug(sourceTitle), { shouldValidate: true });
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [isEditMode, defaultLocale, form]);

    const handleSlugChange = (rawValue: string, onChange: (val: string) => void) => {
        if (!rawValue.trim()) {
            slugTouchedRef.current = false;
        } else {
            slugTouchedRef.current = true;
        }
        const cleanSlug = rawValue
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
        onChange(cleanSlug);
    };

    const handleSlugBlur = (onBlur: () => void) => {
        onBlur();
        const currentVal = form.getValues("slug") || "";
        if (!currentVal.trim()) {
            slugTouchedRef.current = false;
            const titles = form.getValues("title") || {};
            const sourceTitle = titles[defaultLocale] || Object.values(titles).find((t) => typeof t === "string" && t.trim().length > 0) || "";
            if (sourceTitle.trim()) {
                form.setValue("slug", generateSlug(sourceTitle), { shouldDirty: true, shouldValidate: true });
            }
        } else {
            const trimmed = currentVal.replace(/^-+|-+$/g, "");
            if (trimmed !== currentVal) {
                form.setValue("slug", trimmed, { shouldDirty: true, shouldValidate: true });
            }
        }
    };

    const onInvalid = (errors: any) => {
        console.warn("Page form validation errors:", errors);
        toast.error(
            lang === "fr"
                ? "Veuillez compléter les champs obligatoires."
                : "Please complete the required fields."
        );
    };

    function onSubmit(values: PageFormData) {
        startTransition(async () => {
            if (isEditMode && initialData?.id) {
                const res = await updatePage(initialData.id, values);
                if (res.success) {
                    toast.success(dict?.forms?.success || "Page saved successfully!");
                    router.push(`/${lang}/admin/pages`);
                    router.refresh();
                } else {
                    toast.error(res.error || "Failed to update page");
                }
            } else {
                const res = await createPage(values);
                if (res.success) {
                    toast.success(dict?.forms?.success || "Page created successfully!");
                    router.push(`/${lang}/admin/pages`);
                    router.refresh();
                } else {
                    toast.error(res.error || "Failed to create page");
                }
            }
        });
    }

    async function handleDelete() {
        if (!initialData?.id) return;
        setIsDeleting(true);
        const toastId = toast.loading(dict?.forms?.deleting || "Deleting page...");
        try {
            const res = await deletePage(initialData.id);
            toast.dismiss(toastId);
            if (res.success) {
                toast.success(dict?.forms?.deleted || "Page deleted successfully");
                router.push(`/${lang}/admin/pages`);
                router.refresh();
            } else {
                toast.error(res.error || "Failed to delete page");
                setIsDeleting(false);
            }
        } catch (err) {
            toast.dismiss(toastId);
            console.error("DELETE_PAGE_ERROR", err);
            toast.error("Failed to delete page");
            setIsDeleting(false);
        }
    }

    const isLoading = isPending || isDeleting;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8 w-full flex flex-col flex-1">
                <div className="flex items-center justify-between">
                    <Button asChild variant="ghost" size="sm">
                        <Link href={`/${lang}/admin/pages`} className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            {lang === 'fr' ? 'Retour aux pages' : 'Back to pages'}
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {/* Left Column: Multilingual Content */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-1">
                                    <Globe className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-lg font-medium tracking-tight">
                                        {lang === 'fr' ? 'Contenu de la page' : 'Page Content'}
                                    </h2>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {lang === 'fr' 
                                        ? 'Titre et corps de texte par langue.' 
                                        : 'Title and body copy per language.'}
                                </p>
                            </CardHeader>
                            <CardContent>
                                {isMultiLocale ? (
                                    <Tabs defaultValue={defaultLocale} className="w-full">
                                        <TabsList className="mb-4">
                                            {supportedLocales.map((loc) => (
                                                <TabsTrigger key={loc} value={loc} className="uppercase text-xs">
                                                    {getLocaleDisplayName(loc)} ({loc})
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
                                                            <FormLabel>{dict?.forms?.title || 'Title'} ({getLocaleDisplayName(loc)}) <span className="text-destructive ml-1">*</span></FormLabel>
                                                            <FormControl>
                                                                <Input placeholder={`Page title in ${getLocaleDisplayName(loc)}...`} {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`content.${loc}`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{dict?.forms?.content || 'Content'} ({getLocaleDisplayName(loc)}) <span className="text-destructive ml-1">*</span></FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    rows={12}
                                                                    placeholder={`HTML or text content in ${getLocaleDisplayName(loc)}...`}
                                                                    className="font-mono text-sm"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormDescription>
                                                                HTML tags (e.g. &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, &lt;strong&gt;) are supported.
                                                            </FormDescription>
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
                                                    <FormLabel>{dict?.forms?.title || 'Page Title'} <span className="text-destructive ml-1">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. About Us, Terms of Service..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`content.${defaultLocale}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{dict?.forms?.content || 'Page Content'} <span className="text-destructive ml-1">*</span></FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            rows={14}
                                                            placeholder="HTML or text content..."
                                                            className="font-mono text-sm"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        HTML tags (e.g. &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;) are supported.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Settings & Navigation Placement */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-1">
                                    <LayoutTemplate className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-lg font-medium tracking-tight">
                                        {lang === 'fr' ? 'Paramètres URL & Statut' : 'URL & Publication'}
                                    </h2>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {lang === 'fr' ? 'Identifiant slug et visibilité du statut.' : 'Slug handle and publication status.'}
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <FormLabel>Slug (URL) <span className="text-destructive ml-1">*</span></FormLabel>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-1.5 text-xs text-muted-foreground hover:text-primary cursor-pointer gap-1"
                                                    title={lang === "fr" ? "Regénérer depuis le titre" : "Regenerate from title"}
                                                    onClick={() => {
                                                        const titles = form.getValues("title") || {};
                                                        const sourceTitle = titles[defaultLocale] || Object.values(titles).find((t) => typeof t === "string" && t.trim().length > 0) || "";
                                                        if (sourceTitle.trim()) {
                                                            const regenerated = generateSlug(sourceTitle);
                                                            slugTouchedRef.current = false;
                                                            form.setValue("slug", regenerated, { shouldDirty: true, shouldValidate: true });
                                                            toast.success(lang === "fr" ? "Slug regénéré !" : "Slug regenerated!");
                                                        }
                                                    }}
                                                >
                                                    <RotateCcw className="h-3 w-3" />
                                                    <span className="text-[11px]">{lang === "fr" ? "Regénérer" : "Regenerate"}</span>
                                                </Button>
                                            </div>
                                            <FormControl>
                                                <Input 
                                                    placeholder="e.g. about, privacy-policy" 
                                                    {...field} 
                                                    disabled={isLoading}
                                                    value={field.value || ""}
                                                    onChange={(e) => handleSlugChange(e.target.value, field.onChange)}
                                                    onBlur={() => handleSlugBlur(field.onBlur)}
                                                    className="font-mono text-xs" 
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Public path: <code className="text-xs">/pages/{field.value || 'slug'}</code>
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{lang === 'fr' ? 'Statut de publication' : 'Publication Status'}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="published">Published (Visible)</SelectItem>
                                                    <SelectItem value="draft">Draft (Hidden)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-1">
                                    <Eye className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-lg font-medium tracking-tight">
                                        {lang === 'fr' ? 'Emplacement navigation' : 'Navigation Placement'}
                                    </h2>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {lang === 'fr' 
                                        ? 'Affichage dans le menu ou le pied de page.' 
                                        : 'Display in header menu or footer links.'}
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="showInHeader"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-sm font-medium cursor-pointer">
                                                    Header Navigation
                                                </FormLabel>
                                                <p className="text-xs text-muted-foreground">
                                                    Show link in main top navigation bar.
                                                </p>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="showInFooter"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    disabled={isLoading}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-sm font-medium cursor-pointer">
                                                    Footer Navigation
                                                </FormLabel>
                                                <p className="text-xs text-muted-foreground">
                                                    Show link in the website footer links.
                                                </p>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                    </div>
                </div>

                {/* Submit Action Bar */}
                <div className="sticky bottom-0 z-40 flex items-center justify-end gap-4 border-t border-border bg-background p-4 sm:px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] mt-auto -mx-4 sm:-mx-8">
                    {isEditMode && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" disabled={isLoading} className="cursor-pointer mr-auto">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {dict?.forms?.delete || "Delete Page"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{dict?.forms?.delete_confirm_title || "Are you absolutely sure?"}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {dict?.forms?.delete_confirm_desc || "This action cannot be undone. This will permanently delete this page from your store."}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>
                                        {dict?.forms?.cancel || "Cancel"}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                                    >
                                        {isDeleting ? "Deleting..." : "Delete Page"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {isEditMode && (
                        <Button
                            variant="outline"
                            asChild
                            type="button"
                            className="border border-primary text-primary bg-transparent hover:bg-primary hover:text-white transition-colors cursor-pointer"
                        >
                            <Link
                                href={`/${lang}/pages/${initialData?.slug || form.watch("slug")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {lang === 'fr' ? 'Voir sur le site' : 'View on website'}
                            </Link>
                        </Button>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-primary text-primary-foreground hover:opacity-90 text-white px-6 cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isDeleting ? "Deleting..." : "Saving..."}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {isEditMode ? (dict?.forms?.submit || "Save Page") : "Create Page"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
