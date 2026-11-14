export interface Business {
  [key: string]: unknown;
  id: string;
  name: string;
  icon: string; // nom d'icône lucide-react, ex: "utensils", "store", "hammer"
  tags?: string[]; // catégories affichées sur la carte (ex: "Menus", "Commandes")
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  // --- Boutik piblik ---
  slug?: string; // lyen piblik: /shop/{slug}
  shopEnabled?: boolean;
  whatsapp?: string; // nimewo WhatsApp (chif sèlman, ak kòd peyi: 50912345678)
  shopName?: string; // non ki parèt sou boutik la (si vid: non biznis la)
  shopLogo?: string; // /api/img/{id}
  shopCover?: string; // imaj kouvèti dèyè tèt boutik la
  shopTagline?: string;
  shopPaymentInfo?: string; // ekz: "MonCash: 3700-0000"
  shopAnnouncement?: string; // bann anons anlè sit la (ekz: "Livrezon gratis pou 5,000 G+")
  shopDeliveryEnabled?: boolean; // livrezon (default: wi)
  shopPickupEnabled?: boolean; // ranmase nan boutik (default: wi)
  shopDeliveryFee?: number; // frè livrezon
  shopDeliveryMinDays?: number; // tan livrezon: minimòm jou (0 = pa defini)
  shopDeliveryMaxDays?: number; // tan livrezon: maksimòm jou
  shopFreeShippingMin?: number; // livrezon gratis si total >= (0 = pa gen)
  shopAddress?: string; // adrès piblik / kote pou ranmase
  shopHours?: string; // orè
  shopPolicies?: string; // politik retou / garanti
  shopFacebook?: string;
  shopInstagram?: string;
  currency: string; // ex: "HTG", "USD"
  taxRate: number; // pourcentage
  ownerId: string;
  createdAt: string;
}

export interface Product {
  [key: string]: unknown;
  id: string;
  businessId: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  imageUrl?: string;
  barcode?: string;
  // --- Boutik piblik ---
  published?: boolean; // parèt nan boutik piblik la
  unit?: string; // ekz: "Caisse", "Sak", "Pyès"
  description?: string;
  comparePrice?: number; // ansyen pri (bare) — montre rabè sou boutik la
  brand?: string;
  images?: string[]; // foto adisyonèl (galri)
  featured?: boolean; // mete devan sou paj dakèy la
  sizes?: string; // gwosè, separe ak vigil: "S, M, L"
  colors?: string; // koulè, separe ak vigil: "Nwa, Wouj"
  createdAt?: string;
  sold?: number; // konte otomatikman sou kòmand boutik
  ratingSum?: number;
  ratingCount?: number;
}

export interface Sale {
  [key: string]: unknown;
  id: string;
  businessId: string;
  items: { productId: string; name: string; qty: number; unitPrice: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "mobile_money" | "mixed";
  customerId?: string;
  cashierId: string;
  createdAt: string;
}

export interface Customer {
  [key: string]: unknown;
  id: string;
  businessId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Supplier {
  [key: string]: unknown;
  id: string;
  businessId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Expense {
  [key: string]: unknown;
  id: string;
  businessId: string;
  category: "salaires" | "transport" | "loyer" | "electricite" | "internet" | "divers";
  amount: number;
  note?: string;
  createdAt: string;
}

export interface DashboardStats {
  todayRevenue: number;
  todaySales: number;
  todayExpenses: number;
  todayProfit: number;
  monthRevenue: number;
  monthSales: number;
  monthExpenses: number;
  monthProfit: number;
  monthReturns: number;
  yearRevenue: number;
  outOfStockCount: number;
  ordersCount?: number;
  newOrdersCount?: number;
  stockValue: number;
  lowStock: Pick<Product, "id" | "name" | "stock" | "minStock">[];
  recentSales: Pick<Sale, "id" | "total" | "createdAt">[];
}
