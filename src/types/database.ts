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
  images: string[];
  categoryId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  descriptionEn: string;
  descriptionFr: string;
  introEn?: string | null;
  introFr?: string | null;
  nameEn: string;
  nameFr: string;
  slugEn: string;
  slugFr: string;
  statusEn: string;
  statusFr: string;
}

export interface Category {
  id: string;
  createdAt: Date | string;
  descriptionEn: string;
  descriptionFr: string;
  introEn?: string | null;
  introFr?: string | null;
  nameEn: string;
  nameFr: string;
  slugEn: string;
  slugFr: string;
  updatedAt: Date | string;
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
