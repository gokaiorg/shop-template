"use client";

import * as React from "react";
import Image from "next/image";
import {
  User,
  LayoutDashboard,
  BookOpen,
  Folders,
  Package,
  FileText,
  Blocks,
  ShoppingCart,
  Mail,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useBrand } from "@/components/providers/BrandProvider";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthSheet } from "@/components/auth/AuthSheet";

export interface SessionUserLike {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
}

export interface SessionLike {
  user?: SessionUserLike | null;
  expires?: string;
}

export interface AccountToggleDictionary {
  header?: Record<string, string>;
  account?:
    | string
    | {
        title?: string;
        profile?: string;
        orders?: string;
        messages?: string;
        [key: string]: unknown;
      };
  admin?: {
    dashboard?: string;
    catalog?: string;
    categories?: string;
    products?: string;
    pages?: string;
    blocks?: string;
    orders?: string | { title?: string; [key: string]: unknown };
    messages?: string;
    settings?: string;
    [key: string]: unknown;
  };
  auth?: Record<string, string>;
  [key: string]: unknown;
}

export interface AccountToggleProps {
  lang: string;
  dict?: AccountToggleDictionary;
  session?: SessionLike | null;
  id?: string;
}

export function AccountToggle({
  lang,
  dict,
  session: propSession,
  id = "account-toggle",
}: AccountToggleProps) {
  const [mounted, setMounted] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: clientSession } = useSession();
  const session: SessionLike | null | undefined = mounted
    ? clientSession?.user
      ? (clientSession as SessionLike)
      : propSession
    : propSession?.user
      ? propSession
      : null;

  const { isCartEnabled } = useBrand();
  const unreadCount = useUnreadMessages(session);

  const accountObj =
    typeof dict?.account === "object" && dict.account !== null
      ? dict.account
      : undefined;

  const accountLabel =
    typeof dict?.header?.account === "string"
      ? dict.header.account
      : typeof accountObj?.title === "string"
        ? accountObj.title
        : typeof dict?.account === "string"
          ? dict.account
          : lang === "fr"
            ? "Mon Compte"
            : "Account";

  const myAccountLabel =
    typeof dict?.header?.account === "string"
      ? dict.header.account
      : typeof accountObj?.title === "string"
        ? accountObj.title
        : typeof accountObj?.profile === "string"
          ? accountObj.profile
          : lang === "fr"
            ? "Mon Compte"
            : "My Account";

  const signOutLabel =
    typeof dict?.header?.sign_out === "string"
      ? dict.header.sign_out
      : lang === "fr"
        ? "Déconnexion"
        : "Sign Out";

  const adminDict = dict?.admin || {};
  const rawAdminOrders = adminDict.orders;
  const ordersTitle =
    typeof rawAdminOrders === "object" && rawAdminOrders !== null
      ? rawAdminOrders.title || (lang === "fr" ? "Commandes" : "Orders")
      : typeof rawAdminOrders === "string"
        ? rawAdminOrders
        : lang === "fr"
          ? "Commandes"
          : "Orders";

  const userOrdersLabel =
    typeof accountObj?.orders === "string"
      ? accountObj.orders
      : lang === "fr"
        ? "Commandes"
        : "Orders";

  const messagesLabel =
    typeof accountObj?.messages === "string"
      ? accountObj.messages
      : typeof adminDict.messages === "string"
        ? adminDict.messages
        : "Messages";

  const adminNavItems = [
    {
      href: `/${lang}/admin/dashboard`,
      label:
        adminDict.dashboard ||
        (lang === "fr" ? "Tableau de bord" : "Dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: `/${lang}/admin/catalog`,
      label: adminDict.catalog || (lang === "fr" ? "Catalogue" : "Catalog"),
      icon: BookOpen,
    },
    {
      href: `/${lang}/admin/categories`,
      label:
        adminDict.categories || (lang === "fr" ? "Catégories" : "Categories"),
      icon: Folders,
    },
    {
      href: `/${lang}/admin/products`,
      label: adminDict.products || (lang === "fr" ? "Produits" : "Products"),
      icon: Package,
    },
    {
      href: `/${lang}/admin/pages`,
      label: adminDict.pages || "Pages",
      icon: FileText,
    },
    {
      href: `/${lang}/admin/blocks`,
      label: adminDict.blocks || (lang === "fr" ? "Blocs" : "Blocks"),
      icon: Blocks,
    },
    ...(isCartEnabled
      ? [
          {
            href: `/${lang}/admin/orders`,
            label: ordersTitle,
            icon: ShoppingCart,
          },
        ]
      : []),
    {
      href: `/${lang}/admin/messages`,
      label: adminDict.messages || "Messages",
      icon: Mail,
      badge:
        unreadCount > 0 ? (
          <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null,
    },
    {
      href: `/${lang}/admin/settings`,
      label: adminDict.settings || (lang === "fr" ? "Paramètres" : "Settings"),
      icon: Settings,
    },
  ];

  if (session) {
    const isAdmin = session.user?.role === "admin";
    const userAvatarUrl = session.user?.image;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild id={`${id}-trigger`}>
          <Button
            id={`${id}-button`}
            size="icon"
            aria-label={accountLabel}
            className="relative rounded-full hover:opacity-90 transition-opacity overflow-hidden"
            suppressHydrationWarning
          >
            {userAvatarUrl && !avatarError ? (
              <Image
                src={userAvatarUrl}
                alt={session.user?.name || accountLabel}
                width={40}
                height={40}
                sizes="48px"
                quality={75}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-[1.2rem] w-[1.2rem]" />
            )}
            <span className="sr-only">{accountLabel}</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white pointer-events-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {isAdmin ? (
            adminNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.href}
                  asChild
                  className="cursor-pointer"
                >
                  <Link
                    href={item.href}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge}
                  </Link>
                </DropdownMenuItem>
              );
            })
          ) : (
            <>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link
                  href={`/${lang}/account/profile`}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{myAccountLabel}</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              {isCartEnabled && (
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link
                    href={`/${lang}/account/orders`}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      <span>{userOrdersLabel}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link
                  href={`/${lang}/account/messages`}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{messagesLabel}</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: `/${lang}` })}
            className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive group"
          >
            <div className="flex items-center gap-2">
              <LogOut className="h-4 w-4 text-destructive" />
              <span>{signOutLabel}</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <AuthSheet dict={dict?.auth || {}} lang={lang}>
      <Button
        id={`${id}-auth-button`}
        size="icon"
        aria-label={accountLabel}
        className="rounded-full hover:opacity-90 transition-opacity"
        suppressHydrationWarning
      >
        <User className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">{accountLabel}</span>
      </Button>
    </AuthSheet>
  );
}
