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
import { useCurrency } from "@/hooks/useCurrency";
import { AdminEditBadge } from "@/components/admin/AdminEditBadge";

interface ShopProductCardProps {
    product: Product;
    lang: string;
    dict?: any;
    categorySlug?: string;
}

export function ShopProductCard({ product, lang, dict = {}, categorySlug }: ShopProductCardProps) {
    const { brand, isCartEnabled, currency, catalogSlug } = useBrand();
    const { formattedPrice } = useCurrency(product.price, lang);
    const activeCatalogSlug = catalogSlug || "shop";
    const title = getLocalizedField(product.name, lang) || (lang === 'fr' ? product.nameFr : product.nameEn) || "";
    const description = getLocalizedField(product.description, lang) || (lang === 'fr' ? product.descriptionFr : product.descriptionEn) || "";
    const slug = getLocalizedField(product.slug, lang) || (lang === 'fr' ? product.slugFr : product.slugEn) || "";
    const addItem = useCart(state => state.addItem);

    // Compute effective category slug for product link
    const primaryCat = (product.categories && product.categories.length > 0)
        ? product.categories[0]
        : product.category;
    const defaultCatSlug = primaryCat
        ? ((typeof primaryCat.slug === 'object' && primaryCat.slug?.[lang])
            ? primaryCat.slug[lang]
            : (lang === 'fr' ? primaryCat.slugFr : primaryCat.slugEn) ||
              getLocalizedField(primaryCat.slug, lang) ||
              (typeof primaryCat.slug === 'string' ? primaryCat.slug : primaryCat.id))
        : 'all';
    const effectiveCatSlug = categorySlug || defaultCatSlug;
    const productHref = `/${lang}/${activeCatalogSlug}/${effectiveCatSlug}/${slug}`;

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

    const isOutOfStock = (product.stock ?? 0) <= 0;

    return (
        <article className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md p-8 h-full shadow-soft hover:shadow-soft-xl dark:hover:border-white/25 transition-all duration-300 ease-out">
            {/* Admin Quick Edit Shortcut */}
            <AdminEditBadge href={`/admin/products/${product.id}/edit`} locale={lang} />

            {/* Image Container: Bento Box framed, max 40% card height */}
            <Link href={productHref} className="relative w-full aspect-[16/10] max-h-52 overflow-hidden rounded-2xl bg-muted/40 block shrink-0">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                {isOutOfStock && (
                    <span className="absolute top-3 left-3 bg-black/80 dark:bg-black/90 text-white text-xs px-2.5 py-1 uppercase font-bold tracking-wider z-10 shadow-soft backdrop-blur-xs rounded-full">
                        {dict.sold_out || "Sold"}
                    </span>
                )}
            </Link>

            {/* Content Container: Spacious, breathing room for text */}
            <div className="flex flex-1 flex-col pt-6">
                {product.categories && product.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {product.categories.map((cat) => {
                            const catName = getLocalizedField(cat.name, lang) || (lang === 'fr' ? cat.nameFr : cat.nameEn);
                            const catSlug = 
                                (typeof cat.slug === 'object' && cat.slug?.[lang])
                                    ? cat.slug[lang]
                                    : (lang === 'fr' ? cat.slugFr : cat.slugEn) ||
                                      getLocalizedField(cat.slug, lang) ||
                                      (typeof cat.slug === 'string' ? cat.slug : '');
                            if (!catName) return null;

                            return catSlug ? (
                                <Link
                                    key={cat.id}
                                    href={`/${lang}/${activeCatalogSlug}/${catSlug}`}
                                    className="relative z-10 cursor-pointer"
                                >
                                    <Badge
                                        variant="secondary"
                                        className="bg-muted/60 hover:bg-primary/90 hover:text-primary-foreground transition-colors text-xs font-medium px-2.5 py-0.5 rounded-full cursor-pointer"
                                    >
                                        {catName}
                                    </Badge>
                                </Link>
                            ) : (
                                <Badge key={cat.id} variant="secondary" className="bg-muted/60 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    {catName}
                                </Badge>
                            );
                        })}
                    </div>
                )}

                <Link href={productHref} className="group-hover:text-primary transition-colors block">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug line-clamp-2">
                        {title}
                    </h3>
                </Link>
                {description && (
                    <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed line-clamp-3">
                        {description}
                    </p>
                )}

                {/* Bottom Row: Price & Action */}
                {!product.hidePrice && (
                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-border/40">
                        <div>
                            <span className="text-xs uppercase tracking-wider text-muted-foreground block font-medium mb-0.5">
                                {lang === "fr" ? "Prix" : "Price"}
                            </span>
                            <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                                {formattedPrice}
                            </p>
                        </div>
                        {isCartEnabled && (
                            <Button
                                size="default"
                                disabled={isOutOfStock}
                                className={`rounded-full px-5 py-2.5 font-medium shadow-soft hover:shadow-soft-md transition-all duration-200 cursor-pointer ${
                                    isOutOfStock ? "cursor-not-allowed opacity-50" : ""
                                }`}
                                onClick={handleAddToCart}
                                aria-label={`${isOutOfStock ? "Sold Out" : (dict.add_to_cart || "Add to cart")} ${title}`}
                            >
                                {isOutOfStock ? (dict.sold_out || "Sold Out") : (dict.add_to_cart || "Add to cart")}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}
