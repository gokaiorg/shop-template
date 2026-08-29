import { adminDb } from "@/lib/firebase-admin";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

interface AdminOrdersPageProps {
    params: Promise<{
        lang: Locale;
    }>;
}

export default async function AdminOrdersPage({ params }: AdminOrdersPageProps) {
    const { lang } = await params;

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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{ordersDict.title}</h1>
                    <p className="text-muted-foreground">
                        {lang === 'fr' ? 'Gérer les commandes de votre boutique.' : 'Manage your store orders.'}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{ordersDict.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{ordersDict.columns.id}</TableHead>
                                <TableHead>{ordersDict.columns.date}</TableHead>
                                <TableHead>{ordersDict.columns.customer}</TableHead>
                                <TableHead>{ordersDict.columns.total}</TableHead>
                                <TableHead className="text-right">{ordersDict.columns.status}</TableHead>
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
                                        <TableCell className="font-medium">
                                            {order.id.substring(order.id.length - 8).toUpperCase()}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(order.createdAt), "PPP p")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{order.customerName || "Guest"}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {order.customerEmail}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {order._count.items} {lang === 'fr' ? 'articles' : 'items'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge
                                                variant={order.status === "COMPLETED" || order.status === "PAID" ? "default" : order.status === "PENDING" ? "secondary" : "destructive"}
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
        </div>
    );
}
