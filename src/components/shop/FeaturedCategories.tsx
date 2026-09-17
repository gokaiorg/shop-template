import Link from "next/link";
import Image from "next/image";
import { Category } from "@/types/database";
import { getLocalizedField } from "@/lib/i18n";
import { brandConfig } from "@/config/brand.config";
import { cn } from "@/lib/utils";

interface FeaturedCategoriesProps {
    categories: Category[];
    locale?: string;
    lang?: string;
    catalogSlug: string;
    className?: string;
}

export function FeaturedCategories({
    categories,
    locale,
    lang,
    catalogSlug,
    className = "",
}: FeaturedCategoriesProps) {
    const activeLocale = locale || lang || "en";

    if (!categories || categories.length < 2) {
        return null;
    }

    const items = categories.slice(0, 4);

    // Dynamic grid columns based on count:
    // 2 items: 2 columns (1 row of 2)
    // 3 items: 3 columns (1 row of 3)
    // 4 items: 2 columns (2 rows of 2)
    const gridColsClass =
        items.length === 3
            ? "grid-cols-1 sm:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2";

    const defaultPlaceholder = brandConfig.assets?.placeholderImage || "/brand/shop-template/placeholder.webp";

    return (
        <div className={cn("w-full max-w-7xl mx-auto px-6 md:px-16 pt-12 sm:pt-16 pb-4", className)}>
            <ul role="list" className={cn("grid gap-6 sm:gap-8", gridColsClass)}>
                {items.map((category) => {
                    const rawCatSlug =
                        (typeof category.slug === "object" && category.slug?.[activeLocale])
                            ? category.slug[activeLocale]
                            : (activeLocale === "fr" ? category.slugFr : category.slugEn) ||
                              getLocalizedField(category.slug, activeLocale) ||
                              (typeof category.slug === "string" ? category.slug : category.id);
                    const catSlug = rawCatSlug ? rawCatSlug.replace(/^\/+/, "") : "";
                    const href = `/${activeLocale}/${catalogSlug}/${catSlug}`;

                    const catName =
                        getLocalizedField(category.name, activeLocale) ||
                        (activeLocale === "fr" ? category.nameFr : category.nameEn) ||
                        catSlug;

                    const imageSrc =
                        category.imageUrl ||
                        (category as any).bannerUrl ||
                        defaultPlaceholder;

                    return (
                        <li key={category.id || catSlug} className="w-full">
                            <Link
                                href={href}
                                className="group relative aspect-[16/9] w-full overflow-hidden rounded-xl block shadow-md hover:shadow-xl transition-all"
                            >
                                <Image
                                    src={imageSrc}
                                    alt={catName}
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300" />
                                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                                    <h3 className="text-2xl sm:text-3xl font-bold text-white relative z-10 tracking-tight drop-shadow-md group-hover:scale-105 transition-transform duration-300">
                                        {catName}
                                    </h3>
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
