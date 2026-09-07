import { create } from 'zustand';

export interface TranslationStoreState {
    categorySlugs: Record<string, string> | null;
    productSlugs: Record<string, string> | null;
    alternateSlugs: Record<string, string> | null;
    setCategorySlugs: (slugs: Record<string, string> | null) => void;
    setProductSlugs: (slugs: Record<string, string> | null) => void;
    setAlternateSlugs: (slugs: Record<string, string> | null) => void;
    clearTranslations: () => void;
}

export const useTranslationStore = create<TranslationStoreState>((set) => ({
    categorySlugs: null,
    productSlugs: null,
    alternateSlugs: null,
    setCategorySlugs: (slugs) => set({ categorySlugs: slugs }),
    setProductSlugs: (slugs) => set({ productSlugs: slugs, alternateSlugs: slugs }),
    setAlternateSlugs: (slugs) => set({ alternateSlugs: slugs, productSlugs: slugs }),
    clearTranslations: () => set({ categorySlugs: null, productSlugs: null, alternateSlugs: null }),
}));

export function useRouteTranslations() {
    const categorySlugs = useTranslationStore((state) => state.categorySlugs);
    const productSlugs = useTranslationStore((state) => state.productSlugs);
    const alternateSlugs = useTranslationStore((state) => state.alternateSlugs);
    const setCategorySlugs = useTranslationStore((state) => state.setCategorySlugs);
    const setProductSlugs = useTranslationStore((state) => state.setProductSlugs);
    const setAlternateSlugs = useTranslationStore((state) => state.setAlternateSlugs);
    const clearTranslations = useTranslationStore((state) => state.clearTranslations);

    return {
        categorySlugs,
        productSlugs,
        alternateSlugs,
        setCategorySlugs,
        setProductSlugs,
        setAlternateSlugs,
        clearTranslations,
    };
}
