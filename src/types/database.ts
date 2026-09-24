export enum Role {
  ADMIN = "admin",
  USER = "user"
}

export enum OrderStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export interface User {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: Date | string | null;
  image?: string | null;
  password?: string | null;
  role: Role;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Product {
  id: string;
  order?: number;
  price: number;
  hidePrice?: boolean;
  stock: number;
  artist?: string | null;
  vendor?: string | null;
  imageUrl?: string | null;
  images: string[];
  categoryIds: string[];
  categoryId?: string;
  categories?: Category[];
  category?: Category | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  name: Record<string, string>;
  slug: Record<string, string>;
  description?: Record<string, string>;
  intro?: Record<string, string> | null;
  status: Record<string, string>;
  // Legacy optional fields for compatibility
  nameEn?: string;
  nameFr?: string;
  slugEn?: string;
  slugFr?: string;
  descriptionEn?: string;
  descriptionFr?: string;
  introEn?: string | null;
  introFr?: string | null;
  statusEn?: string;
  statusFr?: string;
}

export interface Category {
  id: string;
  order?: number;
  showInHeader?: boolean;
  enableProductZoom?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  name: Record<string, string>;
  slug: Record<string, string>;
  description: Record<string, string>;
  intro?: Record<string, string> | null;
  status?: "draft" | "published" | string;
  imageUrl?: string | null;
  // Legacy optional fields for compatibility
  nameEn?: string;
  nameFr?: string;
  slugEn?: string;
  slugFr?: string;
  descriptionEn?: string;
  descriptionFr?: string;
  introEn?: string | null;
  introFr?: string | null;
}

export interface Order {
  id: string;
  userId?: string | null;
  status: string; // Pending, Completed, Cancelled
  totalAmount: number;
  currency?: string;
  customerEmail?: string | null;
  customerName?: string | null;
  stripeSessionId?: string | null;
  items?: OrderItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface Account {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
}

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date | string;
}

export interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date | string;
}

export interface Page {
  id: string; // The doc ID or slug
  slug: Record<string, string>;
  title: Record<string, string>;
  content: Record<string, string>;
  status: "draft" | "published";
  showInHeader: boolean;
  showInFooter: boolean;
  order?: number;
  activeBlocks?: string[];
  metaTitle?: Record<string, string>;
  metaDescription?: Record<string, string>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  // Legacy optional fields for compatibility
  slug_en?: string;
  slug_fr?: string;
  title_en?: string;
  title_fr?: string;
  content_en?: string;
  content_fr?: string;
  meta_title_en?: string;
  meta_title_fr?: string;
  meta_description_en?: string;
  meta_description_fr?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  brandKey: string;
  brandName?: string;
  updatedAt?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface AboutSectionSettings {
  enabled: boolean;
  title: Record<string, string>;
  description: Record<string, string>;
  ctaLabel: Record<string, string>;
  ctaUrl: string;
  images: string[];
}

export interface ContactSectionSettings {
  enabled: boolean;
  title: Record<string, string>;
  description: Record<string, string>;
}

export interface FaqItem {
  id?: string;
  question: Record<string, string> | string;
  answer: Record<string, string> | string;
}

export interface FaqSectionSettings {
  enabled: boolean;
  status?: 'active' | 'inactive';
  title?: Record<string, string> | string;
  subtitle?: Record<string, string> | string;
  items: FaqItem[];
}

export interface ReviewSectionSettings {
  enabled?: boolean;
  status: 'active' | 'inactive';
  title?: Record<string, string> | string;
  subtitle?: Record<string, string> | string;
  placeId: string;
}

export interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  profile_photo_url: string;
  relative_time_description?: string;
}

export interface StoreSettings {
  id?: string;
  brandName: string;
  logoUrl: string;
  faviconUrl: string;
  heroTitle: Record<string, string>;
  heroDescription: Record<string, string>;
  heroBackgroundImageUrl?: string;
  categoriesTitle?: Record<string, string>;
  categoriesSubtitle?: Record<string, string>;
  productsTitle?: Record<string, string>;
  productsSubtitle?: Record<string, string>;
  catalogTitle?: Record<string, string>;
  catalogDescription?: Record<string, string>;
  catalogSlug?: Record<string, string> | string;
  catalogBannerUrl?: string;
  footerDescription?: Record<string, string>;
  footerRightMenuTitle?: Record<string, string>;
  socialLinks?: SocialLink[];
  defaultTheme?: 'light' | 'dark' | 'system';
  defaultCurrency?: string;
  primaryColor?: string;
  vendors?: string[];
  aboutSection?: AboutSectionSettings;
  contactSection?: ContactSectionSettings;
  faqSection?: FaqSectionSettings;
  reviewSection?: ReviewSectionSettings;
  cartEnabled?: boolean;
  updatedAt?: Date | string;
}
