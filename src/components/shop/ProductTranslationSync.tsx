"use client";

import { useEffect } from "react";
import { useTranslationStore } from "@/store/useTranslationStore";

interface ProductTranslationSyncProps {
    productSlugs: Record<string, string> | null;
}

export function ProductTranslationSync({ productSlugs }: ProductTranslationSyncProps) {
    const setProductSlugs = useTranslationStore((state) => state.setProductSlugs);

    useEffect(() => {
        setProductSlugs(productSlugs);
        return () => {
            setProductSlugs(null);
        };
    }, [productSlugs, setProductSlugs]);

    return null;
}
