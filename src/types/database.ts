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
  price: number;
  stock: number;
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
  description: Record<string, string>;
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
  createdAt: Date | string;
  updatedAt: Date | string;
  name: Record<string, string>;
  slug: Record<string, string>;
  description: Record<string, string>;
  intro?: Record<string, string> | null;
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
  id: string; // The slug (e.g., 'about')
  title_en: string;
  title_fr: string;
  content_en: string;
  content_fr: string;
  meta_title_en: string;
  meta_title_fr: string;
  meta_description_en: string;
  meta_description_fr: string;
  updatedAt?: Date | string;
}
