"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Category, Product } from "@/types/database";
import { ShopProductCard } from "./ShopProductCard";
import { CategoryPillsNav } from "./CategoryPillsNav";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { isProductInStock } from "@/lib/products";
import { PackageCheck, ArrowUpDown } from "lucide-react";
import { useBrand } from "@/components/providers/BrandProvider";

export type SortOption = "default" | "price_asc" | "price_desc";

export interface CategoryProductGridProps {
    products: Product[];
    categories?: Category[];
    currentCategorySlug?: string;
    catalogSlug?: string;
    initialHideSoldOut?: boolean;
    lang: string;
    dict?: any;
    categorySlug: string;
}

const DOMINANCE_OPTIONS = [
    {
        id: "sativa",
        label: "Sativa",
        colorText: "text-[#d1fee5]",
        activeClasses: "bg-[#d1fee5]/15 border-[#d1fee5] text-[#d1fee5] font-bold shadow-[0_0_12px_rgba(209,254,229,0.2)]",
        inactiveClasses: "bg-muted/40 border-border/60 text-[#d1fee5] hover:bg-muted/70 hover:border-[#d1fee5]/40 font-medium",
    },
    {
        id: "hybrid",
        label: "Hybrid",
        colorText: "text-[#c0ef24]",
        activeClasses: "bg-[#c0ef24]/15 border-[#c0ef24] text-[#c0ef24] font-bold shadow-[0_0_12px_rgba(192,239,36,0.2)]",
        inactiveClasses: "bg-muted/40 border-border/60 text-[#c0ef24] hover:bg-muted/70 hover:border-[#c0ef24]/40 font-medium",
    },
    {
        id: "indica",
        label: "Indica",
        colorText: "text-[#ee9cc9]",
        activeClasses: "bg-[#ee9cc9]/15 border-[#ee9cc9] text-[#ee9cc9] font-bold shadow-[0_0_12px_rgba(238,156,201,0.2)]",
        inactiveClasses: "bg-muted/40 border-border/60 text-[#ee9cc9] hover:bg-muted/70 hover:border-[#ee9cc9]/40 font-medium",
    },
] as const;

export function CategoryProductGrid({
    products,
    categories,
    currentCategorySlug,
    catalogSlug = "shop",
    initialHideSoldOut = false,
    lang,
    dict = {},
    categorySlug,
}: CategoryProductGridProps) {
    const { brandKey } = useBrand();
    const [hideSoldOut, setHideSoldOut] = useState<boolean>(initialHideSoldOut);
    const [sortBy, setSortBy] = useState<SortOption>("default");
    const [dominanceFilter, setDominanceFilter] = useState<string | null>(null);

    const isFr = lang === "fr";
    const shopDict = dict.shop || dict || {};

    // Reset dominance filter if category changes
    useEffect(() => {
        setDominanceFilter(null);
    }, [currentCategorySlug, categorySlug]);

    // 1. Condition d'affichage : Green Ghost ET catégorie Buds
    const activeCategory = useMemo(() => {
        const targetSlug = (currentCategorySlug || categorySlug || "").toLowerCase();
        return categories?.find((c) => {
            if (c.id === targetSlug) return true;
            if (c.slug && typeof c.slug === "object") {
                return Object.values(c.slug).some((s) => typeof s === "string" && s.toLowerCase() === targetSlug);
            }
            const rawSlug = (c as any).slug;
            return (
                c.slugEn?.toLowerCase() === targetSlug ||
                c.slugFr?.toLowerCase() === targetSlug ||
                (typeof rawSlug === "string" && rawSlug.toLowerCase() === targetSlug)
            );
        });
    }, [categories, currentCategorySlug, categorySlug]);

    const isBudsCategory = useMemo(() => {
        const targetSlug = (currentCategorySlug || categorySlug || "").toLowerCase();
        if (targetSlug === "buds" || targetSlug === "fleurs") return true;
        if (!activeCategory) return false;
        const enSlug = (typeof activeCategory.slug === "object" ? activeCategory.slug?.en : (activeCategory as any).slugEn) || "";
        return enSlug.toLowerCase() === "buds";
    }, [activeCategory, currentCategorySlug, categorySlug]);

    const isGreenGhost = process.env.NEXT_PUBLIC_BRAND === "green-ghost" || brandKey === "green-ghost";
    const showDominanceFilter = isGreenGhost && isBudsCategory;

    // 3. Logique de Filtrage (Front-end)
    const displayedProducts = useMemo(() => {
        // A. Filtre stock épuisé
        let filtered = hideSoldOut
            ? products.filter(isProductInStock)
            : products;

        // B. Filtre par Dominance
        if (dominanceFilter) {
            const filterLower = dominanceFilter.toLowerCase();
            filtered = filtered.filter((product) => {
                const dominance = String(
                    product.metadata?.dominance ?? (product as any).customSpecs?.dominance ?? ""
                ).trim().toLowerCase();
                return dominance.includes(filterLower);
            });
        }

        // C. Tri par prix ou ordre par défaut
        if (sortBy === "price_asc") {
            return [...filtered].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        }
        if (sortBy === "price_desc") {
            return [...filtered].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        }
        return filtered;
    }, [products, hideSoldOut, dominanceFilter, sortBy]);

    const sortLabel = shopDict.sort_by || (isFr ? "Trier par" : "Sort by");
    const sortFeatured = shopDict.sort_featured || (isFr ? "Par défaut" : "Featured");
    const sortPriceAsc = shopDict.sort_price_asc || (isFr ? "Prix : croissant" : "Price: Low to High");
    const sortPriceDesc = shopDict.sort_price_desc || (isFr ? "Prix : décroissant" : "Price: High to Low");
    const hideSoldOutLabel = shopDict.hide_sold_out || (isFr ? "Masquer épuisés" : "Hide sold out");

    return (
        <div className="w-full">
            {/* Unified Header Toolbar: Categories Navigation (left) & Filter / Sort Controls (right) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                {/* Left: Category Navigation Pills */}
                {categories && categories.length > 0 && (
                    <div className="overflow-x-auto no-scrollbar scrollbar-none pb-2 sm:pb-0">
                        <CategoryPillsNav
                            categories={categories}
                            activeId={currentCategorySlug || categorySlug}
                            lang={lang}
                            catalogSlug={catalogSlug}
                            className="w-auto pb-0"
                            listClassName="mb-0"
                        />
                    </div>
                )}

                {/* Right: Controls Toolbar (Price Sort + Hide Sold Out Checkbox) */}
                <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center ml-auto">
                    {/* Sort By Select Dropdown */}
                    <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
                        <SelectTrigger
                            aria-label={sortLabel}
                            className="h-9 w-[160px] sm:w-[175px] px-3 text-xs sm:text-sm bg-muted/40 hover:bg-muted/70 border-border/60 rounded-xl cursor-pointer gap-2 transition-colors select-none"
                        >
                            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <SelectValue placeholder={sortLabel} />
                        </SelectTrigger>
                        <SelectContent align="end" className="bg-popover border-border/80 shadow-lg">
                            <SelectItem value="default" className="text-xs sm:text-sm cursor-pointer">
                                {sortFeatured}
                            </SelectItem>
                            <SelectItem value="price_asc" className="text-xs sm:text-sm cursor-pointer">
                                {sortPriceAsc}
                            </SelectItem>
                            <SelectItem value="price_desc" className="text-xs sm:text-sm cursor-pointer">
                                {sortPriceDesc}
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Compact Hide Sold Out Checkbox */}
                    <div className="flex items-center gap-2 bg-muted/40 hover:bg-muted/70 transition-colors px-3 h-9 rounded-xl border border-border/60 select-none">
                        <Checkbox
                            id="filter-hide-sold-out"
                            checked={hideSoldOut}
                            onCheckedChange={(checked) => setHideSoldOut(Boolean(checked))}
                            className="cursor-pointer"
                        />
                        <label
                            htmlFor="filter-hide-sold-out"
                            className="text-xs sm:text-sm font-medium text-foreground cursor-pointer select-none whitespace-nowrap"
                        >
                            {hideSoldOutLabel}
                        </label>
                    </div>
                </div>
            </div>

            {/* 2. Boutons de Sous-Filtre Dominance (Green Ghost & Buds) */}
            {showDominanceFilter && (
                <div
                    role="group"
                    aria-label={isFr ? "Filtrer par dominance" : "Filter by dominance"}
                    className="flex flex-wrap items-center gap-2 mb-8 -mt-2"
                >
                    {DOMINANCE_OPTIONS.map((opt) => {
                        const isActive = dominanceFilter === opt.id;
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setDominanceFilter((prev) => (prev === opt.id ? null : opt.id))}
                                aria-pressed={isActive}
                                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm transition-all duration-200 cursor-pointer border select-none ${
                                    isActive ? opt.activeClasses : opt.inactiveClasses
                                }`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Products Grid or Empty State */}
            {displayedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 bg-muted/20 rounded-2xl border border-dashed text-center">
                    <PackageCheck className="w-12 h-12 text-muted-foreground/60 mb-4" />
                    <p className="text-foreground font-semibold text-lg mb-2">
                        {isFr ? "Aucun article disponible" : "No products available"}
                    </p>
                    <p className="text-muted-foreground text-sm max-w-md mb-6">
                        {dominanceFilter
                            ? (isFr
                                ? `Aucun produit de type "${dominanceFilter}" trouvé dans cette catégorie.`
                                : `No "${dominanceFilter}" products found in this category.`)
                            : hideSoldOut
                                ? (isFr
                                    ? "Tous les produits de cette catégorie sont actuellement épuisés."
                                    : "All items in this category are currently sold out.")
                                : (shopDict.empty_state || (isFr ? "Aucun produit trouvé." : "No products found."))}
                    </p>
                    {dominanceFilter && (
                        <button
                            type="button"
                            onClick={() => setDominanceFilter(null)}
                            className="text-sm font-medium text-primary hover:underline cursor-pointer mb-2"
                        >
                            {isFr ? "Effacer le filtre de dominance" : "Clear dominance filter"}
                        </button>
                    )}
                    {hideSoldOut && (
                        <button
                            type="button"
                            onClick={() => setHideSoldOut(false)}
                            className="text-sm font-medium text-primary hover:underline cursor-pointer"
                        >
                            {isFr ? "Afficher les produits épuisés" : "Show sold out products"}
                        </button>
                    )}
                </div>
            ) : (
                <div>
                    <h2 className="sr-only">
                        {shopDict.products_list || (isFr ? "Liste des produits" : "Products list")}
                    </h2>
                    <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {displayedProducts.map((product) => (
                            <li key={product.id} className="flex flex-col">
                                <ShopProductCard
                                    product={product}
                                    lang={lang}
                                    dict={shopDict}
                                    categorySlug={categorySlug}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
