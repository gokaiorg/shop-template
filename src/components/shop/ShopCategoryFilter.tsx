"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Category } from "@/types/database";

interface ShopCategoryFilterProps {
    categories: Category[];
    currentCategorySlug: string | null;
    lang: string;
    dict: Record<string, string>;
}

export function ShopCategoryFilter({ categories, currentCategorySlug, lang, dict }: ShopCategoryFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleCategoryClick = (slug: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (slug) {
            params.set("category", slug);
        } else {
            params.delete("category");
        }
        router.push(`/${lang}/shop?${params.toString()}`);
    };

    return (
        <div className="mb-8 overflow-x-auto pb-4">
            <div className="flex w-max items-center gap-2">
                <Button
                    variant={currentCategorySlug === null ? "default" : "outline"}
                    className={cn(
                        "rounded-full whitespace-nowrap",
                        currentCategorySlug === null ? "shadow-sm pointer-events-none" : ""
                    )}
                    onClick={() => handleCategoryClick(null)}
                    aria-current={currentCategorySlug === null ? "true" : undefined}
                >
                    {dict.all_categories || "All Categories"}
                </Button>

                {categories.map((category) => {
                    const categorySlug = lang === "fr" ? category.slugFr : category.slugEn;
                    const categoryName = lang === "fr" ? category.nameFr : category.nameEn;
                    const isActive = currentCategorySlug === categorySlug;

                    return (
                        <Button
                            key={category.id}
                            variant={isActive ? "default" : "outline"}
                            className={cn(
                                "rounded-full whitespace-nowrap",
                                isActive ? "shadow-sm pointer-events-none" : ""
                            )}
                            onClick={() => handleCategoryClick(categorySlug)}
                            aria-current={isActive ? "true" : undefined}
                        >
                            {categoryName}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}
