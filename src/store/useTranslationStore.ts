import { create } from 'zustand';

export interface TranslationStoreState {
    categorySlugs: Record<string, string> | null;
    productSlugs: Record<string, string> | null;
    pageSlugs: Record<string, string> | null;
    alternateSlugs: Record<string, string> | null;
    setCategorySlugs: (slugs: Record<string, string> | null) => void;
    setProductSlugs: (slugs: Record<string, string> | null) => void;
    setPageSlugs: (slugs: Record<string, string> | null) => void;
    setAlternateSlugs: (slugs: Record<string, string> | null) => void;
    clearTranslations: () => void;
}

export const useTranslationStore = create<TranslationStoreState>((set) => ({
    categorySlugs: null,
    productSlugs: null,
    pageSlugs: null,
    alternateSlugs: null,
    setCategorySlugs: (slugs) => set({ categorySlugs: slugs }),
    setProductSlugs: (slugs) => set({ productSlugs: slugs, alternateSlugs: slugs }),
    setPageSlugs: (slugs) => set({ pageSlugs: slugs }),
    setAlternateSlugs: (slugs) => set({ alternateSlugs: slugs, productSlugs: slugs }),
    clearTranslations: () => set({ categorySlugs: null, productSlugs: null, pageSlugs: null, alternateSlugs: null }),
}));

export function useRouteTranslations() {
    const categorySlugs = useTranslationStore((state) => state.categorySlugs);
    const productSlugs = useTranslationStore((state) => state.productSlugs);
    const pageSlugs = useTranslationStore((state) => state.pageSlugs);
    const alternateSlugs = useTranslationStore((state) => state.alternateSlugs);
    const setCategorySlugs = useTranslationStore((state) => state.setCategorySlugs);
    const setProductSlugs = useTranslationStore((state) => state.setProductSlugs);
    const setPageSlugs = useTranslationStore((state) => state.setPageSlugs);
    const setAlternateSlugs = useTranslationStore((state) => state.setAlternateSlugs);
    const clearTranslations = useTranslationStore((state) => state.clearTranslations);

    return {
        categorySlugs,
        productSlugs,
        pageSlugs,
        alternateSlugs,
        setCategorySlugs,
        setProductSlugs,
        setPageSlugs,
        setAlternateSlugs,
        clearTranslations,
    };
}
