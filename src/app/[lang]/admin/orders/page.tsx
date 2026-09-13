import { adminDb } from "@/lib/firebase-admin";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getIsCartEnabled } from "@/config/brand.config";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { ShoppingCart } from "lucide-react";

interface AdminOrdersPageProps {
    params: Promise<{
        lang: Locale;
    }>;
}

export default async function AdminOrdersPage({ params }: AdminOrdersPageProps) {
    const { lang } = await params;

    // Guard route: if cart is disabled, redirect to admin dashboard
    if (!getIsCartEnabled()) {
        redirect(`/${lang}/admin/dashboard`);
    }

    const session = await auth();
    if (!session) redirect(`/${lang}/login`);

    // Build the query based on user role
    let ordersQuery = adminDb.collection("orders").orderBy("createdAt", "desc");
    
    if (session.user?.role === "user") {
        ordersQuery = ordersQuery.where("userId", "==", session.user.id);
    }

    // Fetch dictionary and orders in parallel to reduce TTFB
    const [dict, ordersSnapshot] = await Promise.all([
        getDictionary(lang),
        ordersQuery.get()
    ]);
    const ordersDict = dict.admin.orders;

    const orders = ordersSnapshot.docs.map(doc => {
        const orderData = doc.data() as any;
        return {
            ...orderData,
            id: doc.id,
            createdAt: orderData.createdAt?.toDate ? orderData.createdAt.toDate() : new Date(orderData.createdAt),
            _count: { items: Array.isArray(orderData.items) ? orderData.items.length : 0 }
        };
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    return (
        <AdminPageLayout
            title={ordersDict.title}
            description={lang === 'fr' ? 'Suivi et gestion des commandes clients.' : 'Tracking and fulfillment of customer orders.'}
            icon={ShoppingCart}
        >
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                        <h2 className="text-lg font-medium tracking-tight">{ordersDict.title}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        {lang === 'fr' ? 'Liste complète des commandes passées.' : 'Full list of processed store orders.'}
                    </p>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table className="min-w-[700px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="whitespace-nowrap">{ordersDict.columns.id}</TableHead>
                                <TableHead className="whitespace-nowrap">{ordersDict.columns.date}</TableHead>
                                <TableHead className="whitespace-nowrap">{ordersDict.columns.customer}</TableHead>
                                <TableHead className="whitespace-nowrap">{ordersDict.columns.total}</TableHead>
                                <TableHead className="text-right whitespace-nowrap">{ordersDict.columns.status}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        {lang === 'fr' ? 'Aucune commande trouvée.' : 'No orders found.'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                            {order.id.substring(order.id.length - 8).toUpperCase()}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground whitespace-nowrap">
                                            {format(new Date(order.createdAt), "PPP p")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col min-w-[150px]">
                                                <span className="font-medium">{order.customerName || "Guest"}</span>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {order.customerEmail}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {order._count.items} {lang === 'fr' ? 'articles' : 'items'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right whitespace-nowrap">
                                            <Badge
                                                variant={order.status === "COMPLETED" || order.status === "PAID" ? "default" : order.status === "PENDING" ? "secondary" : "destructive"}
                                                className="whitespace-nowrap"
                                            >
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AdminPageLayout>
    );
}
