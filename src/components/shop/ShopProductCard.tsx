"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/database";
import { useCart } from "@/store/useCart";
import { toast } from "sonner";

interface ShopProductCardProps {
    product: Product;
    lang: string;
    dict: Record<string, string>;
}

export function ShopProductCard({ product, lang, dict }: ShopProductCardProps) {
    const title = lang === 'fr' ? product.nameFr : product.nameEn;
    const description = lang === 'fr' ? product.descriptionFr : product.descriptionEn;
    // const slug = lang === 'fr' ? product.slugFr : product.slugEn;
    const addItem = useCart(state => state.addItem);

    const fallbackAddToCart = lang === 'fr' ? "Ajouter au panier" : "Add to cart";

    const handleAddToCart = () => {
        addItem(product);
        toast.success(dict.added_to_cart || fallbackAddToCart, {
            description: title,
        });
    };

    // We get the first image or a placeholder
    const imageUrl = product.images && product.images.length > 0
        ? product.images[0]
        : "https://images.unsplash.com/photo-1595246140625-573b715d11dc?q=80&w=2670&auto=format&fit=crop";

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-background">
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </div>

            {/* Content Container */}
            <div className="flex flex-1 flex-col p-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {description}
                </p>

                {/* Bottom Row */}
                <div className="mt-auto flex items-center justify-between pt-4">
                    <p className="text-lg font-bold">
                        ${product.price.toFixed(2)}
                    </p>
                    <Button
                        size="sm"
                        className="rounded-full shadow-xs cursor-pointer"
                        onClick={handleAddToCart}
                        aria-label={`${dict.add_to_cart || fallbackAddToCart} ${title}`}
                    >
                        {dict.add_to_cart || fallbackAddToCart}
                    </Button>
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
