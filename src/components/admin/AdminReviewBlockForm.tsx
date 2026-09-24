"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Loader2,
    Star,
    ArrowLeft,
    ExternalLink,
    HelpCircle,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminBottomBar } from "@/components/admin/AdminBottomBar";
import { Input } from "@/components/ui/input";
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
import { StoreSettings, GoogleReview } from "@/types/database";
import { reviewSectionSchema, ReviewSectionFormData } from "@/schemas/settings";
import { updateReviewBlockSettings } from "@/actions/settings";
import { getGoogleReviewsAction } from "@/actions/reviews";
import { useBrand } from "@/components/providers/BrandProvider";
import { getLocaleDisplayName } from "@/lib/i18n";

interface AdminReviewBlockFormProps {
    initialData: StoreSettings;
    lang: string;
    dict?: Record<string, string>;
}

export function AdminReviewBlockForm({ initialData, lang }: AdminReviewBlockFormProps) {
    const router = useRouter();
    const { supportedLocales, defaultLocale, isMultiLocale } = useBrand();
    const [activeLang, setActiveLang] = useState<string>(defaultLocale || lang || "en");
    const [isPending, startTransition] = useTransition();
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{
        tested: boolean;
        success: boolean;
        name?: string;
        rating?: number;
        totalRatings?: number;
        reviewsCount?: number;
        sampleReviews?: GoogleReview[];
        error?: string;
    } | null>(null);

    const isFr = lang === "fr";

    // Build multilingual default values for title & subtitle
    const defaultReviewTitle: Record<string, string> = {};
    const defaultReviewSubtitle: Record<string, string> = {};

    supportedLocales.forEach((loc) => {
        const rawTitle = initialData.reviewSection?.title;
        const rawSubtitle = initialData.reviewSection?.subtitle;

        defaultReviewTitle[loc] =
            typeof rawTitle === "object"
                ? rawTitle?.[loc] || rawTitle?.en || ""
                : typeof rawTitle === "string"
                ? rawTitle
                : "";

        defaultReviewSubtitle[loc] =
            typeof rawSubtitle === "object"
                ? rawSubtitle?.[loc] || rawSubtitle?.en || ""
                : typeof rawSubtitle === "string"
                ? rawSubtitle
                : "";
    });

    const isInitiallyActive =
        initialData.reviewSection?.status === "active" ||
        initialData.reviewSection?.enabled === true;

    const form = useForm<ReviewSectionFormData>({
        resolver: zodResolver(reviewSectionSchema) as any,
        defaultValues: {
            enabled: isInitiallyActive,
            status: isInitiallyActive ? "active" : "inactive",
            title: defaultReviewTitle,
            subtitle: defaultReviewSubtitle,
            placeId: initialData.reviewSection?.placeId || "",
        },
    });

    const currentPlaceId = form.watch("placeId");

    const handleTestConnection = async () => {
        const placeIdToTest = (currentPlaceId || "").trim();
        if (!placeIdToTest) {
            toast.error(
                isFr
                    ? "Veuillez renseigner un Google Place ID avant de tester."
                    : "Please enter a Google Place ID before testing."
            );
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const result = await getGoogleReviewsAction(placeIdToTest, activeLang);
            if (result.success) {
                setTestResult({
                    tested: true,
                    success: true,
                    name: result.name,
                    rating: result.rating,
                    totalRatings: result.userRatingsTotal,
                    reviewsCount: result.reviews.length,
                    sampleReviews: result.reviews.slice(0, 3),
                });
                toast.success(
                    isFr
                        ? `Connexion Google Places réussie ! ${result.reviews.length} avis récupéré(s).`
                        : `Google Places connection successful! ${result.reviews.length} review(s) found.`
                );
            } else {
                setTestResult({
                    tested: true,
                    success: false,
                    error: result.error || "Impossible de récupérer les avis",
                });
                toast.error(
                    result.error ||
                        (isFr
                            ? "Échec de la connexion à Google Places."
                            : "Failed to connect to Google Places.")
                );
            }
        } catch (err: any) {
            setTestResult({
                tested: true,
                success: false,
                error: err?.message || "Erreur de connexion",
            });
            toast.error(isFr ? "Erreur inattendue lors du test." : "Unexpected error during test.");
        } finally {
            setIsTesting(false);
        }
    };

    const onSubmit = (values: ReviewSectionFormData) => {
        startTransition(async () => {
            try {
                const payload: ReviewSectionFormData = {
                    ...values,
                    enabled: values.enabled ?? (values.status === "active"),
                    status: values.enabled ? "active" : "inactive",
                };

                const res = await updateReviewBlockSettings(payload);
                if (res.success) {
                    toast.success(
                        isFr
                            ? "Section Avis Google mise à jour avec succès !"
                            : "Google Reviews section updated successfully!"
                    );
                    form.reset(payload);
                    router.refresh();
                } else {
                    toast.error(
                        res.error ||
                            (isFr
                                ? "Erreur lors de la mise à jour."
                                : "Failed to update review section.")
                    );
                }
            } catch (err: any) {
                console.error("[SUBMIT_REVIEWS_FORM_ERROR]", err);
                toast.error(isFr ? "Une erreur inattendue est survenue." : "An unexpected error occurred.");
            }
        });
    };

    const errorCount = Object.keys(form.formState.errors).length;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl flex-1 flex flex-col">
                {/* Back to Blocks link */}
                <div className="flex items-center justify-between">
                    <Link
                        href={`/${lang}/admin/blocks`}
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors px-3 py-1.5 rounded-md w-fit"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>{isFr ? "Retour aux blocs" : "Back to blocks"}</span>
                    </Link>
                </div>

                {/* Main Review Section Card */}
                <Card>
                    <CardHeader className="border-b pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                    <h2 className="text-lg font-semibold tracking-tight">
                                        {isFr ? "Section Avis Google" : "Reviews Section"}
                                    </h2>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {isFr
                                        ? "Affichez dynamiquement vos avis Google My Business / Google Places pour renforcer la réassurance de vos clients."
                                        : "Dynamically display your Google My Business / Google Places customer reviews to boost trust and conversion."}
                                </p>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                                {/* Language Switcher (EN / FR) */}
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
                                                    ? (isFr ? "Actif" : "Active")
                                                    : (isFr ? "Inactif" : "Inactive")}
                                            </span>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={(checked) => {
                                                    field.onChange(checked);
                                                    form.setValue("status", checked ? "active" : "inactive");
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
                        {/* Section Header Copy */}
                        <div>
                            <h3 className="text-sm font-semibold mb-4 text-foreground">
                                {isFr ? "Contenu éditorial" : "Editorial Content"}
                            </h3>

                            <div className="space-y-4">
                                {/* Multilingual Title */}
                                {supportedLocales.map((loc) => (
                                    <div key={loc} className={loc === activeLang ? "block" : "hidden"}>
                                        <FormField
                                            control={form.control}
                                            name={`title.${loc}` as any}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {isFr ? "Titre de la section" : "Section Title"}{" "}
                                                        <span className="text-muted-foreground font-normal">
                                                            ({getLocaleDisplayName(loc)})
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            value={field.value || ""}
                                                            placeholder={
                                                                loc === "fr"
                                                                    ? "ex: Ce que disent nos clients"
                                                                    : "e.g. What our customers say"
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        {isFr
                                                            ? "Titre principal affiché en haut du bloc."
                                                            : "Main title displayed at the top of the block."}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                ))}

                                {/* Multilingual Subtitle */}
                                {supportedLocales.map((loc) => (
                                    <div key={loc} className={loc === activeLang ? "block" : "hidden"}>
                                        <FormField
                                            control={form.control}
                                            name={`subtitle.${loc}` as any}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {isFr ? "Sous-titre (optionnel)" : "Subtitle (optional)"}{" "}
                                                        <span className="text-muted-foreground font-normal">
                                                            ({getLocaleDisplayName(loc)})
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            value={field.value || ""}
                                                            placeholder={
                                                                loc === "fr"
                                                                    ? "ex: Découvrez les avis vérifiés de nos clients sur Google."
                                                                    : "e.g. Verified customer ratings and feedback from Google."
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        {isFr
                                                            ? "Court paragraphe explicatif sous le titre."
                                                            : "Brief introductory sentence shown under the heading."}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Divider to Google Place ID section */}
                        <div className="pt-4 border-t space-y-4">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                </svg>
                                <span>Google Place ID</span>
                            </h3>

                            <FormField
                                control={form.control}
                                name="placeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-medium text-xs">
                                            {isFr ? "Identifiant Google Maps de l'établissement" : "Business Google Maps Place ID"}
                                        </FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    className="font-mono text-sm"
                                                    placeholder="ex: ChIJN1t_tDeuEmsRUsoyG83frY4"
                                                />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleTestConnection}
                                                disabled={isTesting || !field.value}
                                                className="shrink-0 cursor-pointer"
                                            >
                                                {isTesting ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        <span>{isFr ? "Test..." : "Testing..."}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw className="w-4 h-4 mr-2" />
                                                        <span>{isFr ? "Tester l'ID" : "Test ID"}</span>
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <div className="rounded-lg bg-muted/60 p-3.5 border text-xs text-muted-foreground flex items-start gap-2.5 mt-2">
                                            <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <p className="font-medium text-foreground">
                                                    {isFr ? "Comment trouver votre Place ID ?" : "How to find your Place ID?"}
                                                </p>
                                                <p>
                                                    {isFr
                                                        ? "Utilisez l'outil officiel Google Place ID Finder pour récupérer votre identifiant en tapant le nom ou l'adresse de votre établissement."
                                                        : "Use the official Google Place ID Finder tool to retrieve your unique business identifier."}
                                                </p>
                                                <a
                                                    href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-primary hover:underline font-medium pt-1"
                                                >
                                                    <span>{isFr ? "Ouvrir Google Place ID Finder" : "Open Google Place ID Finder"}</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Test Connection Result Box */}
                            {testResult && (
                                <div
                                    className={`rounded-xl border p-4 ${
                                        testResult.success
                                            ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50"
                                            : "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        {testResult.success ? (
                                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                                        )}
                                        <span className="font-semibold text-sm">
                                            {testResult.success
                                                ? isFr
                                                    ? "Connexion établie avec succès"
                                                    : "Connection successfully verified"
                                                : isFr
                                                ? "Erreur de récupération Google Places"
                                                : "Google Places verification error"}
                                        </span>
                                    </div>

                                    {testResult.success ? (
                                        <div className="text-xs space-y-2 text-foreground/80">
                                            <div className="flex flex-wrap items-center gap-4">
                                                {testResult.name && (
                                                    <p>
                                                        <span className="text-muted-foreground">{isFr ? "Établissement : " : "Place: "}</span>
                                                        <strong>{testResult.name}</strong>
                                                    </p>
                                                )}
                                                {typeof testResult.rating === "number" && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-muted-foreground">{isFr ? "Note : " : "Rating: "}</span>
                                                        <span className="font-bold flex items-center text-amber-500">
                                                            ★ {testResult.rating.toFixed(1)}
                                                        </span>
                                                        {testResult.totalRatings && (
                                                            <span className="text-muted-foreground">
                                                                ({testResult.totalRatings} avis au total)
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                <p>
                                                    <span className="text-muted-foreground">{isFr ? "Avis récupérés : " : "Fetched reviews: "}</span>
                                                    <strong>{testResult.reviewsCount}</strong>
                                                </p>
                                            </div>

                                            {testResult.sampleReviews && testResult.sampleReviews.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10 space-y-2">
                                                    <p className="font-medium text-xs text-muted-foreground">
                                                        {isFr ? "Aperçu des avis récupérés :" : "Sample reviews preview:"}
                                                    </p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {testResult.sampleReviews.map((rev, i) => (
                                                            <div
                                                                key={i}
                                                                className="p-2.5 rounded-lg bg-background border text-xs space-y-1"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-semibold">{rev.author_name}</span>
                                                                    <span className="text-amber-500">{"★".repeat(rev.rating)}</span>
                                                                </div>
                                                                <p className="text-muted-foreground line-clamp-2">
                                                                    {rev.text || "(Avis sans texte)"}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
                                            <p>{testResult.error}</p>
                                            <p className="text-muted-foreground text-xs">
                                                {isFr
                                                    ? "Astuce : Vérifiez que la variable GOOGLE_PLACES_API_KEY est bien configurée et que l'API Places est activée sur votre projet Google Cloud."
                                                    : "Tip: Make sure GOOGLE_PLACES_API_KEY is configured in your environment variables and Places API is enabled in Google Cloud Console."}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Standardized Bottom Action Bar (Save only, no Cancel / View Storefront) */}
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
