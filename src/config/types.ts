export interface BrandIdentity {
    id: string;
    name: string;
    shortName: string;
    tagline: {
        en: string;
        fr: string;
    };
    description: {
        en: string;
        fr: string;
    };
    url: string;
    companyName: string;
    copyrightYear?: number;
    creator?: {
        name: string;
        url: string;
    };
}

export interface BrandAssets {
    logo: {
        src: string;
        alt: string;
        width: number;
        height: number;
    };
    logoDark?: {
        src: string;
        alt: string;
        width: number;
        height: number;
    };
    icon: string;
    favicon: string;
    ogImage?: string;
    placeholderImage: string;
    heroBanner?: string;
}

export interface BrandTheme {
    fontSans?: string;
    fontHeading?: string;
    radius?: string; // e.g. "0.625rem", "0.375rem"
    colors?: {
        light?: {
            primary?: string;
            accent?: string;
            background?: string;
            foreground?: string;
        };
        dark?: {
            primary?: string;
            accent?: string;
            background?: string;
            foreground?: string;
        };
    };
}

export interface HeaderNavItem {
    key: string;
    href: string;
    external?: boolean;
}

export interface FooterLinkItem {
    key?: string;
    label?: {
        en: string;
        fr: string;
    };
    href: string;
    external?: boolean;
}

export interface SocialLink {
    platform: 'instagram' | 'twitter' | 'x' | 'facebook' | 'youtube' | 'linkedin' | 'github' | 'tiktok';
    url: string;
}

export interface BrandNavigation {
    headerNav: HeaderNavItem[];
    footerSections: {
        shop: HeaderNavItem[];
        company: HeaderNavItem[];
        legal: HeaderNavItem[];
    };
    socials: SocialLink[];
}

export interface BrandSEO {
    titleTemplate: string; // e.g. "%s | Art Fate"
    defaultTitle: string;
    defaultDescription: {
        en: string;
        fr: string;
    };
    keywords: string[];
    twitterHandle?: string;
    robots?: {
        allow?: string | string[];
        disallow?: string | string[];
    };
}

export interface BrandContact {
    email: string;
    phone?: string;
    address?: {
        street?: string;
        city?: string;
        postalCode?: string;
        country?: string;
    };
    supportHours?: {
        en: string;
        fr: string;
    };
}

export interface SeedCategory {
    name: Record<string, string>;
    slug: Record<string, string>;
    intro?: Record<string, string>;
    description: Record<string, string>;
    order?: number;
}

export interface SeedProduct {
    name: Record<string, string>;
    slug: Record<string, string>;
    intro?: Record<string, string>;
    description: Record<string, string>;
    price: number;
    stock: number;
    categoryIndex?: number;
    categoryIndices?: number[];
    status: Record<string, string>;
    images?: string[];
}

export interface BrandSeedData {
    categories: SeedCategory[];
    products: SeedProduct[];
}

export interface BrandConfig {
    identity: BrandIdentity;
    assets: BrandAssets;
    theme: BrandTheme;
    navigation: BrandNavigation;
    seo: BrandSEO;
    contact: BrandContact;
    features?: {
        cart?: boolean;
        search?: boolean;
        reviews?: boolean;
    };
    seedData?: BrandSeedData;
}
