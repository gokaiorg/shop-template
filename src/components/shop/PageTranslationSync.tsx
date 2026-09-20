"use client";

import { useEffect } from "react";
import { useTranslationStore } from "@/store/useTranslationStore";

interface PageTranslationSyncProps {
    pageSlugs: Record<string, string> | null;
}

export function PageTranslationSync({ pageSlugs }: PageTranslationSyncProps) {
    const setPageSlugs = useTranslationStore((state) => state.setPageSlugs);

    useEffect(() => {
        setPageSlugs(pageSlugs);
        return () => {
            setPageSlugs(null);
        };
    }, [pageSlugs, setPageSlugs]);

    return null;
}
