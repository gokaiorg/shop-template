"use client";

import { Category } from "@/types/database";
import { CategoryPillsNav } from "@/components/shop/CategoryPillsNav";

interface ShopCategoryFilterProps {
    categories: Category[];
    currentCategorySlug: string | null;
    lang: string;
    dict?: Record<string, string>;
    catalogSlug?: string;
    className?: string;
}

export function ShopCategoryFilter({
    categories,
    currentCategorySlug,
    lang,
    catalogSlug = 'shop',
    className,
}: ShopCategoryFilterProps) {
    return (
        <CategoryPillsNav
            categories={categories}
            activeId={currentCategorySlug}
            lang={lang}
            catalogSlug={catalogSlug}
            className={className}
        />
    );
}
