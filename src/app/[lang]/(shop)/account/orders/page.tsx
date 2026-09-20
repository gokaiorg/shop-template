import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { getStoreSettings } from "@/lib/services/settings";
import { getLocalizedField } from "@/lib/i18n";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, PackageOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface OrdersPageProps {
    params: Promise<{ lang: string }>;
}

export default async function CustomerOrdersPage({ params }: OrdersPageProps) {
    const { lang } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect(`/${lang}/login`);
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    const [dict, storeSettings] = await Promise.all([
        getDictionary(lang as Locale),
        getStoreSettings(),
    ]);

    const accountDict = dict.account || {};
    const catalogSlug =
        typeof storeSettings.catalogSlug === "object"
            ? getLocalizedField(storeSettings.catalogSlug, lang) || "shop"
            : storeSettings.catalogSlug || "shop";

    const defaultCurrency = storeSettings.defaultCurrency || "USD";

    // Query orders associated with userId and/or customerEmail
    const ordersMap = new Map<string, any>();

    try {
        const userOrdersSnapshot = await adminDb
            .collection("orders")
            .where("userId", "==", userId)
            .get();

        userOrdersSnapshot.forEach((doc) => {
            ordersMap.set(doc.id, { id: doc.id, ...doc.data() });
        });

        if (userEmail) {
            const emailOrdersSnapshot = await adminDb
                .collection("orders")
                .where("customerEmail", "==", userEmail)
                .get();

            emailOrdersSnapshot.forEach((doc) => {
                ordersMap.set(doc.id, { id: doc.id, ...doc.data() });
            });
        }
    } catch (e) {
        console.error("Error fetching user orders from Firestore:", e);
    }

    const orders = Array.from(ordersMap.values())
        .map((orderData) => {
            const createdAtDate = orderData.createdAt?.toDate
                ? orderData.createdAt.toDate()
                : orderData.createdAt
                ? new Date(orderData.createdAt)
                : new Date();

            const itemsCount = Array.isArray(orderData.items)
                ? orderData.items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)
                : 0;

            return {
                ...orderData,
                createdAt: createdAtDate,
                itemsCount,
            };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const formatCurrency = (amount: number, orderCurrency?: string) => {
        const curr = orderCurrency || defaultCurrency;
        return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US", {
            style: "currency",
            currency: curr.toUpperCase(),
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const normalized = (status || "").toUpperCase();
        switch (normalized) {
            case "PAID":
            case "COMPLETED":
                return (
                    <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                        {lang === "fr" ? "Payée" : "Paid"}
                    </Badge>
                );
            case "PENDING":
                return (
                    <Badge variant="secondary" className="font-medium">
                        {lang === "fr" ? "En attente" : "Pending"}
                    </Badge>
                );
            case "CANCELLED":
                return (
                    <Badge variant="destructive" className="font-medium">
                        {lang === "fr" ? "Annulée" : "Cancelled"}
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <Card className="rounded-xl border border-border shadow-xs overflow-hidden">
            <CardHeader className="border-b border-border bg-card px-6 py-5">
                <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl font-bold tracking-tight">
                        {accountDict.orders || (lang === "fr" ? "Mes Commandes" : "My Orders")}
                    </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    {accountDict.orders_subtitle || (lang === "fr" ? "Historique et statut de vos achats." : "History and status of your purchases.")}
                </p>
            </CardHeader>

            <CardContent className="p-0">
                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
                            <PackageOpen className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            {accountDict.no_orders || (lang === "fr" ? "Vous n'avez pas encore passé de commande." : "You haven't placed any orders yet.")}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-sm mb-6">
                            {lang === "fr"
                                ? "Lorsque vous effectuez un achat dans notre boutique, il apparaîtra automatiquement ici avec tous les détails."
                                : "When you make a purchase in our store, it will appear here with all details and tracking."}
                        </p>
                        <Button asChild>
                            <Link href={`/${lang}/${catalogSlug}`} className="inline-flex items-center gap-2">
                                <span>{accountDict.explore_shop || (lang === "fr" ? "Découvrir la boutique" : "Explore the shop")}</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table className="min-w-[600px]">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[120px] font-semibold">{accountDict.order_number || "Commande"}</TableHead>
                                    <TableHead className="font-semibold">{accountDict.date || "Date"}</TableHead>
                                    <TableHead className="font-semibold">{accountDict.status || "Statut"}</TableHead>
                                    <TableHead className="font-semibold">{accountDict.items || "Articles"}</TableHead>
                                    <TableHead className="text-right font-semibold">{accountDict.total || "Total"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id} className="transition-colors">
                                        <TableCell className="font-mono text-xs font-semibold">
                                            #{order.id.substring(order.id.length - 8).toUpperCase()}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {format(new Date(order.createdAt), "PPP")}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(order.status)}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {order.itemsCount} {lang === "fr" ? (order.itemsCount > 1 ? "articles" : "article") : (order.itemsCount > 1 ? "items" : "item")}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-sm">
                                            {formatCurrency(order.totalAmount || 0, order.currency)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
