import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDictionary } from "@/lib/dictionaries";
import { Locale, getSupportedLocales, getDefaultLocale, isMultiLocale } from "@/app/i18n-config";
import Link from "next/link";
import { Package, FolderTree, ShoppingCart, ArrowRight, FileText, Settings, BookOpen, LayoutDashboard, Globe, Database, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { adminDb } from "@/lib/firebase-admin";
import { getRecentOrders, getPendingOrdersCount } from "@/actions/orders";
import { getActiveBrandKey, getIsCartEnabled } from "@/config/brand.config";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { SeedDemoDataButton } from "@/components/admin/SeedDemoDataButton";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";

export default async function AdminDashboardPage({
    params,
}: {
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params;
    const isCartEnabled = getIsCartEnabled();
    const brandKey = getActiveBrandKey();
    const supportedLocales = getSupportedLocales();
    const defaultLocale = getDefaultLocale();
    const isMulti = isMultiLocale();

    // Fetch session, dictionary, and counts in parallel
    const [session, dict, productsSnap, categoriesSnap, pagesSnap, messagesSnap, recentOrders, pendingOrdersCount] = await Promise.all([
        auth(),
        getDictionary(lang as Locale),
        adminDb.collection("products").count().get(),
        adminDb.collection("categories").count().get(),
        adminDb.collection("pages").count().get(),
        adminDb.collection("messages").count().get(),
        isCartEnabled ? getRecentOrders() : Promise.resolve([]),
        isCartEnabled ? getPendingOrdersCount() : Promise.resolve(0),
    ]);

    if (!session?.user?.id) {
        return null;
    }

    const userDoc = await adminDb.collection("users").doc(session.user.id).get();
    const userData = userDoc.data();
    const totalProducts = productsSnap.data().count;
    const totalCategories = categoriesSnap.data().count;
    const totalPages = pagesSnap.data().count;
    const totalMessages = messagesSnap.data().count;
    const displayName = userData?.name || session.user.name || session.user.email || "";

    return (
        <AdminPageLayout
            title={dict.admin.dashboard}
            description={dict.admin.welcome_text.replace("{name}", displayName)}
            icon={LayoutDashboard}
        >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* 1. Total Categories */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{lang === 'fr' ? "Total Catégories" : "Total Categories"}</CardTitle>
                        <FolderTree className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCategories}</div>
                    </CardContent>
                </Card>

                {/* 2. Total Products */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{lang === 'fr' ? "Total Produits" : "Total Products"}</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                    </CardContent>
                </Card>

                {/* 3. Total Pages */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{lang === 'fr' ? "Total Pages" : "Total Pages"}</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPages}</div>
                    </CardContent>
                </Card>

                {/* 4. Total Messages */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{lang === 'fr' ? "Total Messages" : "Total Messages"}</CardTitle>
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalMessages}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            {isCartEnabled ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Recent Orders Table */}
                    <Card className="col-span-4 lg:col-span-5">
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-1">
                                <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                                <h2 className="text-lg font-medium tracking-tight">
                                    {lang === 'fr' ? "Commandes récentes" : "Recent Orders"}
                                </h2>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                {lang === 'fr' ? "Dernières commandes enregistrées." : "Latest customer orders recorded."}
                            </p>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{lang === 'fr' ? "ID Commande" : "Order ID"}</TableHead>
                                        <TableHead>{lang === 'fr' ? "Date" : "Date"}</TableHead>
                                        <TableHead>{lang === 'fr' ? "Statut" : "Status"}</TableHead>
                                        <TableHead className="text-right">{lang === 'fr' ? "Total" : "Total"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                {lang === 'fr' ? "Aucune commande récente." : "No recent orders found."}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentOrders.map((order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">{order.id}</TableCell>
                                                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <Badge variant={order.status === "COMPLETED" || order.status === "PAID" ? "default" : order.status === "PENDING" ? "secondary" : "destructive"}>
                                                        {order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">${order.totalAmount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Quick Actions & Profile */}
                    <div className="col-span-2 lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-1">
                                    <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-lg font-medium tracking-tight">
                                        {lang === 'fr' ? "Actions rapides" : "Quick Actions"}
                                    </h2>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {lang === 'fr' ? "Accès direct aux modules clés." : "Direct access to key modules."}
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Link href={`/${lang}/admin/catalog`} className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <BookOpen className="h-5 w-5 mr-3 text-primary" />
                                    <div className="flex-1">
                                        <p className="font-medium leading-none">{dict.admin.catalog || "Catalog"}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </Link>

                                <Link href={`/${lang}/admin/categories`} className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <FolderTree className="h-5 w-5 mr-3 text-primary" />
                                    <div className="flex-1">
                                        <p className="font-medium leading-none">{dict.admin.categories}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </Link>

                                <Link href={`/${lang}/admin/products`} className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <Package className="h-5 w-5 mr-3 text-primary" />
                                    <div className="flex-1">
                                        <p className="font-medium leading-none">{dict.admin.products}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </Link>

                                <Link href={`/${lang}/admin/pages`} className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <FileText className="h-5 w-5 mr-3 text-primary" />
                                    <div className="flex-1">
                                        <p className="font-medium leading-none">{dict.admin.pages}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </Link>

                                <Link href={`/${lang}/admin/messages`} className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <Mail className="h-5 w-5 mr-3 text-primary" />
                                    <div className="flex-1">
                                        <p className="font-medium leading-none">{dict.admin.messages || "Messages"}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </Link>

                                <Link href={`/${lang}/admin/settings`} className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <Settings className="h-5 w-5 mr-3 text-primary" />
                                    <div className="flex-1">
                                        <p className="font-medium leading-none">{dict.admin.settings || "Settings"}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </CardContent>
                        </Card>

                        {session?.user && (
                            <ProfileForm 
                                user={{ 
                                    id: session.user.id, 
                                    name: userData?.name || session.user.name, 
                                    email: userData?.email || session.user.email 
                                }} 
                                dict={dict.admin} 
                            />
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Catalog & Content Management */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-1">
                                <BookOpen className="w-5 h-5 text-muted-foreground" />
                                <h2 className="text-lg font-medium tracking-tight">
                                    {lang === 'fr' ? "Catalogue & Contenu" : "Catalog & Content"}
                                </h2>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                {lang === 'fr' 
                                    ? "Gestion des œuvres et des collections." 
                                    : (isCartEnabled ? "Manage products, categories, and site pages." : "Manage artworks, exhibits, and collections.")}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href={`/${lang}/admin/catalog`} className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <BookOpen className="h-5 w-5 mr-3 text-primary" />
                                <div className="flex-1">
                                    <p className="font-medium leading-none mb-1">{dict.admin.catalog || "Catalog"}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {lang === 'fr' 
                                            ? "Configuration du slug URL, titres et bannière d'archive" 
                                            : "Configure URL slug, titles, and archive banner"}
                                    </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Link>

                            <Link href={`/${lang}/admin/categories`} className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <FolderTree className="h-5 w-5 mr-3 text-primary" />
                                <div className="flex-1">
                                    <p className="font-medium leading-none mb-1">{dict.admin.categories}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {lang === 'fr'
                                            ? "Organisation par médium et collections"
                                            : "Organize pieces into medium & collections"}
                                    </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Link>

                            <Link href={`/${lang}/admin/products`} className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <Package className="h-5 w-5 mr-3 text-primary" />
                                <div className="flex-1">
                                    <p className="font-medium leading-none mb-1">{dict.admin.products}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {lang === 'fr'
                                            ? "Gestion des œuvres, expositions et portfolio"
                                            : "Manage artworks, exhibits and portfolio items"}
                                    </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Link>

                            <Link href={`/${lang}/admin/pages`} className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <FileText className="h-5 w-5 mr-3 text-primary" />
                                <div className="flex-1">
                                    <p className="font-medium leading-none mb-1">{dict.admin.pages}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {lang === 'fr'
                                            ? "Édition des pages personnalisées (À propos, CGV...)"
                                            : "Edit custom content pages (About, Terms, etc.)"}
                                    </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Link>

                            <Link href={`/${lang}/admin/messages`} className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <Mail className="h-5 w-5 mr-3 text-primary" />
                                <div className="flex-1">
                                    <p className="font-medium leading-none mb-1">{dict.admin.messages || "Messages"}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {lang === 'fr'
                                            ? "Gestion et suivi des demandes de contact clients"
                                            : "Manage customer inquiries and contact requests"}
                                    </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Link>

                            <Link href={`/${lang}/admin/settings`} className="flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <Settings className="h-5 w-5 mr-3 text-primary" />
                                <div className="flex-1">
                                    <p className="font-medium leading-none mb-1">{dict.admin.settings || "Settings"}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {lang === 'fr'
                                            ? "Personnalisation du nom, logo et bannières"
                                            : "Customize brand name, logo, and hero banners"}
                                    </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Admin Profile */}
                    <ProfileForm 
                        user={{ 
                            id: session.user.id, 
                            name: userData?.name || session.user.name, 
                            email: userData?.email || session.user.email 
                        }} 
                        dict={dict.admin} 
                    />
                </div>
            )}

            {/* Technical Information & Database Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Feature Flags & Localization */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <Globe className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-lg font-medium tracking-tight">
                                {lang === 'fr' ? "Configuration & Routage" : "Configuration & Routing"}
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {lang === 'fr' ? "Paramètres actifs sur ce déploiement." : "Active settings for this deployment."}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium text-muted-foreground">Brand Key</span>
                            <Badge variant="outline" className="font-mono text-xs">{brandKey}</Badge>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    {lang === 'fr' ? "Système Panier & Paiement" : "Cart & Checkout System"}
                                </span>
                            </div>
                            <Badge variant={isCartEnabled ? "default" : "secondary"}>
                                {lang === 'fr' ? (isCartEnabled ? "Activé" : "Désactivé") : (isCartEnabled ? "Enabled" : "Disabled")}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium text-muted-foreground">
                                {lang === 'fr' ? "Mode Multilingue" : "Multilingual Mode"}
                            </span>
                            <Badge variant={isMulti ? "default" : "outline"}>
                                {lang === 'fr' 
                                    ? (isMulti ? "Multilingue Actif" : "Mono-langue Verrouillé") 
                                    : (isMulti ? "Multi-Language Active" : "Single-Language Locked")}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium text-muted-foreground">
                                {lang === 'fr' ? "Langues supportées" : "Supported Locales"}
                            </span>
                            <div className="flex gap-1">
                                {supportedLocales.map((loc) => (
                                    <Badge key={loc} variant="secondary" className="uppercase text-xs font-mono">
                                        {loc}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                                {lang === 'fr' ? "Langue par défaut" : "Default Locale"}
                            </span>
                            <Badge variant="outline" className="uppercase text-xs font-mono">
                                {defaultLocale}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Database & Demo Tools */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <Database className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-lg font-medium tracking-tight">
                                {lang === 'fr' ? "Base de données & Outils" : "Database & Tools"}
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {lang === 'fr' ? "Connexion Firestore et outils de démo." : "Firestore connection and demo tools."}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium text-muted-foreground">
                                {lang === 'fr' ? "ID Projet GCP" : "GCP Project ID"}
                            </span>
                            <span className="text-xs font-mono text-foreground">
                                {process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "Default"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-medium text-muted-foreground">
                                {lang === 'fr' ? "ID Base Firestore" : "Firestore Database ID"}
                            </span>
                            <span className="text-xs font-mono text-foreground">
                                {process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "(default)"}
                            </span>
                        </div>
                        <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium">{dict.admin?.dashboard_seedButton || "Generate Demo Data"}</p>
                                <p className="text-xs text-muted-foreground">
                                    {lang === 'fr' 
                                        ? "Générer ou réinitialiser le catalogue et les catégories." 
                                        : "Seed or reset brand catalog products and categories."}
                                </p>
                            </div>
                            <SeedDemoDataButton dict={dict.admin} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminPageLayout>
    );
}
