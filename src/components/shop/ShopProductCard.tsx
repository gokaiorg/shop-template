"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/database";
import { useCart } from "@/store/useCart";
import { toast } from "sonner";

import { brandConfig } from "@/config/brand.config";

interface ShopProductCardProps {
    product: Product;
    lang: string;
    dict: Record<string, string>;
}

export function ShopProductCard({ product, lang, dict }: ShopProductCardProps) {
    const title = lang === 'fr' ? product.nameFr : product.nameEn;
    const description = lang === 'fr' ? product.descriptionFr : product.descriptionEn;
    const slug = lang === 'fr' ? product.slugFr : product.slugEn;
    const addItem = useCart(state => state.addItem);

    const handleAddToCart = () => {
        addItem(product);
        toast.success(dict.added_to_cart || "Added to cart", {
            description: title,
        });
    };

    // Prioritize product.imageUrl, then product.images[0], then brand's placeholder
    const imageUrl = product.imageUrl
        || (product.images && product.images.length > 0 ? product.images[0] : null)
        || brandConfig.assets.placeholderImage;

    const isCartEnabled = process.env.NEXT_PUBLIC_ENABLE_CART !== "false";

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-background">
            {/* Image Container */}
            <Link href={`/${lang}/product/${slug}`} className="relative aspect-square overflow-hidden bg-muted block">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </Link>

            {/* Content Container */}
            <div className="flex flex-1 flex-col p-4">
                <Link href={`/${lang}/product/${slug}`} className="hover:underline">
                    <h3 className="text-lg font-semibold">{title}</h3>
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {description}
                </p>

                {/* Bottom Row */}
                <div className="mt-auto flex items-center justify-between pt-4">
                    <p className="text-lg font-bold">
                        ${product.price.toFixed(2)}
                    </p>
                    {isCartEnabled && (
                        <Button
                            size="sm"
                            className="rounded-full shadow-xs cursor-pointer"
                            onClick={handleAddToCart}
                            aria-label={`${dict.add_to_cart || "Add to cart"} ${title}`}
                        >
                            {dict.add_to_cart || "Add to cart"}
                        </Button>
                    )}
                </div>
            </div>

            {/* Optional wrap the whole card block linking to product detail later  
            <Link href={`/${lang}/shop/product/${slug}`} className="absolute inset-0">
                <span className="sr-only">View {title}</span>
            </Link> 
            */}
        </div>
    );
}
