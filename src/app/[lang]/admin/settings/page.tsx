import { auth } from "@/auth";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getActiveBrandKey, getIsCartEnabled } from "@/config/brand.config";
import { getSupportedLocales, getDefaultLocale, isMultiLocale } from "@/app/i18n-config";
import { getStoreSettings } from "@/lib/services/settings";
import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";
import { SeedDemoDataButton } from "@/components/admin/SeedDemoDataButton";
import { Settings, Globe, ShoppingCart, Database } from "lucide-react";

export default async function AdminSettingsPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const [session, dict, storeSettings] = await Promise.all([
        auth(),
        getDictionary(lang as Locale),
        getStoreSettings(),
    ]);

    if (!session?.user?.id) {
        return null;
    }

    const brandKey = getActiveBrandKey();
    const isCartEnabled = getIsCartEnabled();
    const supportedLocales = getSupportedLocales();
    const defaultLocale = getDefaultLocale();
    const isMulti = isMultiLocale();

    const adminDict = dict.admin || {};

    return (
        <div className="space-y-10 max-w-5xl">
            <div className="flex flex-col gap-2 border-b pb-6">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Settings className="h-8 w-8 text-primary" />
                    Storefront Settings
                </h1>
                <p className="text-muted-foreground">
                    Customize your storefront brand identity, catalog routing, localization, footer copy, and social media channels.
                </p>
            </div>

            {/* 1. Dynamic Storefront Settings Form (Firestore store_front document) */}
            <div className="space-y-6">
                <StoreSettingsForm initialData={storeSettings} lang={lang} dict={adminDict} />
            </div>

            {/* 2. System Configuration & Runtime Info */}
            <div className="grid gap-6 md:grid-cols-2 pt-6 border-t">
                {/* Feature Flags & Localization */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Globe className="h-5 w-5 text-primary" />
                            Feature Flags & Routing
                        </CardTitle>
                        <CardDescription>
                            Active runtime configurations applied to this deployment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium text-muted-foreground">Brand Key</span>
                            <Badge variant="outline" className="font-mono text-xs">{brandKey}</Badge>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Cart & Checkout System</span>
                            </div>
                            <Badge variant={isCartEnabled ? "default" : "secondary"}>
                                {isCartEnabled ? "Enabled" : "Disabled"}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium text-muted-foreground">Multilingual Mode</span>
                            <Badge variant={isMulti ? "default" : "outline"}>
                                {isMulti ? "Multi-Language Active" : "Single-Language Locked"}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium text-muted-foreground">Supported Locales</span>
                            <div className="flex gap-1">
                                {supportedLocales.map((loc) => (
                                    <Badge key={loc} variant="secondary" className="uppercase text-xs font-mono">
                                        {loc}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Default Locale</span>
                            <Badge variant="outline" className="uppercase text-xs font-mono">
                                {defaultLocale}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Database & Demo Tools */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Database className="h-5 w-5 text-primary" />
                            Database & Seed Tools
                        </CardTitle>
                        <CardDescription>
                            Firestore connection and catalog utilities.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium text-muted-foreground">GCP Project ID</span>
                            <span className="text-xs font-mono text-foreground">
                                {process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "Default"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium text-muted-foreground">Firestore Database ID</span>
                            <span className="text-xs font-mono text-foreground">
                                {process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "(default)"}
                            </span>
                        </div>
                        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium">{adminDict.dashboard_seedButton || "Generate Demo Data"}</p>
                                <p className="text-xs text-muted-foreground">
                                    Seed or reset brand catalog products and categories.
                                </p>
                            </div>
                            <SeedDemoDataButton dict={adminDict} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
