import { adminDb } from "@/lib/firebase-admin";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AdminOrdersPageProps {
    params: Promise<{
        lang: Locale;
    }>;
}

export default async function AdminOrdersPage({ params }: AdminOrdersPageProps) {
    const { lang } = await params;

    // Fetch dictionary and orders in parallel to reduce TTFB
    const [dict, ordersSnapshot] = await Promise.all([
        getDictionary(lang),
        adminDb.collection("orders").orderBy("createdAt", "desc").get()
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

            <div className="bg-background border rounded-lg p-0 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                        <tr>
                            <th className="px-6 py-3">{ordersDict.columns.id}</th>
                            <th className="px-6 py-3">{ordersDict.columns.date}</th>
                            <th className="px-6 py-3">{ordersDict.columns.customer}</th>
                            <th className="px-6 py-3">{ordersDict.columns.total}</th>
                            <th className="px-6 py-3 text-right">{ordersDict.columns.status}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                    {lang === 'fr' ? 'Aucune commande trouvée.' : 'No orders found.'}
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20">
                                    <td className="px-6 py-4 font-medium">
                                        {order.id.substring(order.id.length - 8).toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {format(new Date(order.createdAt), "PPP p")}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span>{order.customerName || "Guest"}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {order.customerEmail}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {order._count.items} {lang === 'fr' ? 'articles' : 'items'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Badge
                                            variant={order.status === "PAID" ? "default" : "secondary"}
                                            className={
                                                order.status === "PAID"
                                                    ? "bg-green-500 hover:bg-green-600"
                                                    : ""
                                            }
                                        >
                                            {order.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
