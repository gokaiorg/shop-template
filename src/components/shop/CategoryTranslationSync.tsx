"use client";

import { useEffect } from "react";
import { useTranslationStore } from "@/store/useTranslationStore";

interface CategoryTranslationSyncProps {
    categorySlugs: Record<string, string> | null;
}

export function CategoryTranslationSync({ categorySlugs }: CategoryTranslationSyncProps) {
    const setCategorySlugs = useTranslationStore((state) => state.setCategorySlugs);

    useEffect(() => {
        setCategorySlugs(categorySlugs);
        return () => {
            setCategorySlugs(null);
        };
    }, [categorySlugs, setCategorySlugs]);

    return null;
}
