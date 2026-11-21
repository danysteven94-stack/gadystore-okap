import {
  LayoutDashboard,
  Building2,
  Package,
  Boxes,
  ClipboardCheck,
  Users,
  Truck,
  ShoppingCart,
  Undo2,
  Receipt,
  BarChart3,
  DatabaseBackup,
  UserCog,
  ClipboardList,
  MonitorPlay,
  Store,
  WalletCards,
  Bell,
  ShieldCheck,
  ScrollText,
  Landmark,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/** Yon lyen aktif selon chemen AN MENM TAN ak ?kind= (Kliyan ≠ Founisè). */
export function isNavActive(href: string, pathname: string, kind: string | null): boolean {
  const [path, query] = href.split("?");
  if (pathname !== path) return false;
  if (path === "/contacts") {
    const want = new URLSearchParams(query ?? "").get("kind") === "supplier" ? "supplier" : "customer";
    return (kind === "supplier" ? "supplier" : "customer") === want;
  }
  return true;
}

export const NAV_ITEMS: { href: string; icon: React.ElementType; key: TranslationKey; superOnly?: boolean; needsShop?: boolean; needs?: string }[] = [
  { href: "/dashboard", icon: LayoutDashboard, key: "nav_dashboard" },
  { href: "/notifications", icon: Bell, key: "nav_notifications" },
  { href: "/businesses", icon: Building2, key: "nav_businesses" },
  { href: "/products", icon: Package, key: "nav_products" },
  { href: "/shop", icon: Store, key: "nav_shop", needsShop: true },
  { href: "/stock", icon: Boxes, key: "nav_stock" },
  { href: "/inventory", icon: ClipboardCheck, key: "nav_inventory", needs: "products:write" },
  { href: "/contacts?kind=customer", icon: Users, key: "nav_customers" },
  { href: "/contacts?kind=supplier", icon: Truck, key: "nav_suppliers" },
  { href: "/pos", icon: ShoppingCart, key: "nav_pos" },
  { href: "/orders", icon: ClipboardList, key: "nav_orders" },
  { href: "/subscriptions", icon: MonitorPlay, key: "nav_subscriptions" },
  { href: "/returns", icon: Undo2, key: "nav_returns" },
  { href: "/expenses", icon: Receipt, key: "nav_expenses" },
  { href: "/investments", icon: Landmark, key: "nav_investments", needs: "*" },
  { href: "/reports", icon: BarChart3, key: "nav_reports" },
  { href: "/backup", icon: DatabaseBackup, key: "nav_backup" },
  { href: "/users", icon: UserCog, key: "nav_users", needs: "*" },
  { href: "/security", icon: ShieldCheck, key: "nav_security" },
  { href: "/audit", icon: ScrollText, key: "nav_audit", needs: "*" },
  { href: "/user-billing", icon: WalletCards, key: "nav_user_billing", superOnly: true },
];
