export type Lang = "ht" | "fr" | "en";

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "ht", label: "Kreyòl" },
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
];

export const dictionary = {
  nav_dashboard: { ht: "Tablo Debò", fr: "Tableau de bord", en: "Dashboard" },
  nav_businesses: { ht: "Antrepriz", fr: "Entreprises", en: "Businesses" },
  nav_pos: { ht: "Kès", fr: "Caisse", en: "POS" },
  nav_products: { ht: "Pwodwi", fr: "Produits", en: "Products" },
  nav_contacts: { ht: "Kontak", fr: "Contacts", en: "Contacts" },

  dashboard_title: { ht: "Tout Antrepriz", fr: "Toutes les entreprises", en: "All Businesses" },
  dashboard_today_revenue: { ht: "Chif afè jodi a", fr: "Chiffre d'affaires du jour", en: "Today's revenue" },
  dashboard_sales: { ht: "Vant", fr: "Ventes", en: "Sales" },
  dashboard_expenses: { ht: "Depans", fr: "Dépenses", en: "Expenses" },
  dashboard_profit: { ht: "Pwofi net", fr: "Profit net", en: "Net profit" },
  dashboard_breakdown: { ht: "Repartisyon pa antrepriz", fr: "Répartition par entreprise", en: "Breakdown by business" },
  dashboard_low_stock: { ht: "Stok fèb", fr: "Stock faible", en: "Low stock" },
  dashboard_top_products: { ht: "Pi bon pwodwi", fr: "Meilleurs produits", en: "Top products" },
  dashboard_recent_sales: { ht: "Dènye vant", fr: "Ventes récentes", en: "Recent sales" },
  dashboard_all_ok: { ht: "Tout stok anfòm.", fr: "Tout le stock est en ordre.", en: "All stock is healthy." },

  products_title: { ht: "Pwodwi & Stok", fr: "Produits & Stock", en: "Products & Stock" },
  products_count: { ht: "Pwodwi", fr: "Produits", en: "Products" },
  products_stock_value: { ht: "Valè stok", fr: "Valeur du stock", en: "Stock value" },
  products_search: { ht: "Chèche yon pwodwi...", fr: "Rechercher un produit...", en: "Search a product..." },
  products_add: { ht: "Ajoute pwodwi", fr: "Ajouter un produit", en: "Add product" },
  products_edit: { ht: "Modifye pwodwi", fr: "Modifier le produit", en: "Edit product" },

  contacts_title: { ht: "Kliyan & Founisè", fr: "Clients & Fournisseurs", en: "Customers & Suppliers" },
  contacts_customers: { ht: "Kliyan", fr: "Clients", en: "Customers" },
  contacts_suppliers: { ht: "Founisè", fr: "Fournisseurs", en: "Suppliers" },

  common_save: { ht: "Anrejistre chanjman", fr: "Enregistrer", en: "Save changes" },
  common_add: { ht: "Ajoute", fr: "Ajouter", en: "Add" },
  common_delete: { ht: "Efase", fr: "Supprimer", en: "Delete" },
  common_close: { ht: "Fèmen", fr: "Fermer", en: "Close" },
  common_all: { ht: "Tout", fr: "Tout", en: "All" },
  common_login: { ht: "Konekte", fr: "Se connecter", en: "Log in" },
} as const;

export type TranslationKey = keyof typeof dictionary;

export function translate(key: TranslationKey, lang: Lang): string {
  return dictionary[key][lang] ?? dictionary[key].fr;
}
