export interface Business {
  [key: string]: unknown;
  id: string;
  name: string;
  icon: string; // nom d'icône lucide-react, ex: "utensils", "store", "hammer"
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
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
  lowStock: Pick<Product, "id" | "name" | "stock" | "minStock">[];
  recentSales: Pick<Sale, "id" | "total" | "createdAt">[];
}
