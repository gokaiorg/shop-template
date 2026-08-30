"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/database";
import { useCart } from "@/store/useCart";
import { toast } from "sonner";
import { getLocalizedField } from "@/lib/i18n";
import { useBrand } from "@/components/providers/BrandProvider";

interface ShopProductCardProps {
    product: Product;
    lang: string;
    dict: Record<string, string>;
}

export function ShopProductCard({ product, lang, dict }: ShopProductCardProps) {
    const { brand, isCartEnabled } = useBrand();
    const title = getLocalizedField(product.name, lang) || (lang === 'fr' ? product.nameFr : product.nameEn) || "";
    const description = getLocalizedField(product.description, lang) || (lang === 'fr' ? product.descriptionFr : product.descriptionEn) || "";
    const slug = getLocalizedField(product.slug, lang) || (lang === 'fr' ? product.slugFr : product.slugEn) || "";
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
        || brand.assets.placeholderImage;

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
                {product.categories && product.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {product.categories.map((cat) => (
                            <Badge key={cat.id} variant="secondary" className="text-[11px] font-normal px-2 py-0.5">
                                {getLocalizedField(cat.name, lang) || (lang === 'fr' ? cat.nameFr : cat.nameEn)}
                            </Badge>
                        ))}
                    </div>
                )}

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
        </div>
    );
}
