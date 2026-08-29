import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import Link from "next/link";
import { Package, FolderTree, ShoppingCart, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { adminDb } from "@/lib/firebase-admin";
import { getRecentOrders, getPendingOrdersCount } from "@/actions/orders";

import { ProfileForm } from "@/components/admin/ProfileForm";

export default async function AdminDashboardPage({
    params,
}: {
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params;

    // Fetch session and dictionary
    const [session, dict] = await Promise.all([
        auth(),
        getDictionary(lang as Locale)
    ]);

    if (!session?.user?.id) {
        return null;
    }

    // Fetch up-to-date user data and stats in parallel
    const [userDoc, productsSnap, categoriesSnap, recentOrders, pendingOrdersCount] = await Promise.all([
        adminDb.collection("users").doc(session.user.id).get(),
        adminDb.collection("products").count().get(),
        adminDb.collection("categories").count().get(),
        getRecentOrders(),
        getPendingOrdersCount()
    ]);
    
    const userData = userDoc.data();
    const isAdmin = (userData?.role || "").toLowerCase() === "admin";
    const totalProducts = productsSnap.data().count;
    const totalCategories = categoriesSnap.data().count;
    const displayName = userData?.name || session.user.name || session.user.email || "";

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{dict.admin.dashboard}</h1>
                <p className="text-muted-foreground">{dict.admin.welcome_text.replace("{name}", displayName)}</p>
            </div>

            {/* KPI Cards */}
            {isAdmin && (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalProducts}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
                            <FolderTree className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalCategories}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingOrdersCount}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Content Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                
                {/* Recent Orders Table */}
                <Card className="col-span-4 lg:col-span-5">
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            No recent orders found.
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
                    {isAdmin && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Link href={`/${lang}/admin/categories`} className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <FolderTree className="h-5 w-5 mr-3 text-primary" />
                                    <div className="flex-1">
                                        <p className="font-medium leading-none mb-1">{dict.admin.categories}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </Link>
                                
                                <Link href={`/${lang}/admin/products`} className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <Package className="h-5 w-5 mr-3 text-primary" />
                                    <div className="flex-1">
                                        <p className="font-medium leading-none mb-1">{dict.admin.products}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </CardContent>
                        </Card>
                    )}

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
        </div>
    );
}
