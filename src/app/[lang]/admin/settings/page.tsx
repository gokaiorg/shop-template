import { auth } from "@/auth";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminDb } from "@/lib/firebase-admin";
import { getActiveBrand, getActiveBrandKey, getIsCartEnabled } from "@/config/brand.config";
import { getSupportedLocales, getDefaultLocale, isMultiLocale } from "@/app/i18n-config";
import { SeedDemoDataButton } from "@/components/admin/SeedDemoDataButton";
import { ProfileForm } from "@/components/admin/ProfileForm";
import Image from "next/image";
import { Settings, Shield, Globe, ShoppingCart, Database, Palette } from "lucide-react";

export default async function AdminSettingsPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const [session, dict] = await Promise.all([
        auth(),
        getDictionary(lang as Locale),
    ]);

    if (!session?.user?.id) {
        return null;
    }

    const userDoc = await adminDb.collection("users").doc(session.user.id).get();
    const userData = userDoc.data();

    const brand = getActiveBrand();
    const brandKey = getActiveBrandKey();
    const isCartEnabled = getIsCartEnabled();
    const supportedLocales = getSupportedLocales();
    const defaultLocale = getDefaultLocale();
    const isMulti = isMultiLocale();

    const adminDict = dict.admin || {};

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Settings className="h-8 w-8 text-primary" />
                    {adminDict.settings || "Settings"}
                </h1>
                <p className="text-muted-foreground">
                    Manage store brand configuration, feature flags, database settings, and your admin profile.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Active Brand & Theme */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Palette className="h-5 w-5 text-primary" />
                            Brand Identity & Theme
                        </CardTitle>
                        <CardDescription>
                            Configuration loaded dynamically from the brand environment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium text-muted-foreground">Brand Identifier</span>
                            <Badge variant="outline" className="font-mono text-xs">{brandKey}</Badge>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium text-muted-foreground">Brand Name</span>
                            <span className="text-sm font-semibold">{brand.identity.name}</span>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium text-muted-foreground">Store URL</span>
                            <span className="text-sm text-muted-foreground">{brand.identity.url}</span>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium text-muted-foreground">Logo Preview</span>
                            <div className="flex items-center gap-2">
                                <Image
                                    src={brand.assets.logo.src}
                                    alt={brand.assets.logo.alt || brand.identity.name}
                                    width={28}
                                    height={28}
                                    className="object-contain"
                                />
                                <span className="text-xs text-muted-foreground font-mono">{brand.assets.logo.src}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Primary Accent Color</span>
                            <div className="flex items-center gap-2">
                                <span
                                    className="h-4 w-4 rounded-full border"
                                    style={{ backgroundColor: `hsl(${brand.theme.colors?.light?.primary || '240 5.9% 10%'})` }}
                                />
                                <span className="text-xs font-mono">{brand.theme.colors?.light?.primary || 'Default'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Feature Flags & Localization */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Globe className="h-5 w-5 text-primary" />
                            Feature Flags & Localization
                        </CardTitle>
                        <CardDescription>
                            Dynamic feature toggle and internationalization settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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

                {/* Database & Catalog Tools */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Database className="h-5 w-5 text-primary" />
                            Database & Demo Data
                        </CardTitle>
                        <CardDescription>
                            Manage Firestore catalog seed data and environment connection.
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

                {/* Admin Profile */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Shield className="h-5 w-5 text-primary" />
                            Admin Account Details
                        </CardTitle>
                        <CardDescription>
                            Update your credentials and password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProfileForm
                            user={{
                                id: session.user.id,
                                name: userData?.name || session.user.name,
                                email: userData?.email || session.user.email,
                            }}
                            dict={adminDict}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
