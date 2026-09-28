import { NextResponse } from 'next/server';
import { getActiveBrand } from '@/config/brand.config';
import { getStoreSettings } from '@/lib/services/settings';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const brand = getActiveBrand();
        const storeSettings = await getStoreSettings().catch(() => null);
        const iconUrl = storeSettings?.faviconUrl || brand.assets.icon || '/icon.png';

        // 1. External URL (e.g. Firebase Storage)
        if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://')) {
            const res = await fetch(iconUrl);
            if (res.ok) {
                const buffer = await res.arrayBuffer();
                const contentType = res.headers.get('content-type') || (
                    iconUrl.includes('.png') ? 'image/png' :
                    iconUrl.includes('.webp') ? 'image/webp' :
                    iconUrl.includes('.svg') ? 'image/svg+xml' : 'image/x-icon'
                );
                return new NextResponse(buffer, {
                    headers: {
                        'Content-Type': contentType,
                        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
                    },
                });
            }
        }

        // 2. Local static asset (e.g. /brand/green-ghost/icon.webp or /icon.png)
        const localRelPath = iconUrl.startsWith('/') ? iconUrl.slice(1) : iconUrl;
        const publicFilePath = path.join(process.cwd(), 'public', localRelPath);

        if (fs.existsSync(publicFilePath)) {
            const buffer = fs.readFileSync(publicFilePath);
            const ext = path.extname(publicFilePath).toLowerCase();
            const contentType =
                ext === '.webp' ? 'image/webp' :
                ext === '.png' ? 'image/png' :
                ext === '.svg' ? 'image/svg+xml' : 'image/x-icon';

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
                },
            });
        }

        // 3. Fallback to default brand icon
        const defaultIconPath = path.join(process.cwd(), 'public', 'brand', 'default', 'icon.webp');
        if (fs.existsSync(defaultIconPath)) {
            const buffer = fs.readFileSync(defaultIconPath);
            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': 'image/webp',
                    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
                },
            });
        }

        return new NextResponse(null, { status: 404 });
    } catch (error) {
        console.error('Error serving dynamic favicon.ico:', error);
        return new NextResponse(null, { status: 500 });
    }
}
