// Tradiksyon boutik an liy lan (kliyan yo). Kle a se tèks kreyòl la.
// Yon kle ka gen `{non}` pou valè dinamik, ak `||kontèks` pou separe de menm mo ki gen sans diferan.
// Tèks ki soti nan pwopriyetè a (non/deskripsyon pwodwi, anons...) pa tradui otomatikman.

export type ShopLang = "ht" | "fr" | "en";
export const SHOP_LANGS: { code: ShopLang; label: string; short: string }[] = [
  { code: "ht", label: "Kreyòl", short: "HT" },
  { code: "fr", label: "Français", short: "FR" },
  { code: "en", label: "English", short: "EN" },
];

// [kreyòl, fransè, anglè]
const D: [string, string, string][] = [
  // ----- Navigasyon / shell
  ["Favori", "Favoris", "Favorites"],
  ["Swiv kòmand", "Suivre commande", "Track order"],
  ["Kont mwen", "Mon compte", "My account"],
  ["Konekte", "Se connecter", "Log in"],
  ["Panye", "Panier", "Cart"],
  ["Tout", "Tout", "All"],
  ["Promosyon", "Promotions", "Sale"],
  ["Èd", "Aide", "Help"],
  ["Konekte / Kreye kont", "Connexion / Créer un compte", "Log in / Sign up"],
  ["Swiv kòmand mwen", "Suivre ma commande", "Track my order"],
  ["Favori mwen", "Mes favoris", "My favorites"],
  ["Livrezon, peman ak retou", "Livraison, paiement et retours", "Delivery, payment and returns"],
  ["Kontakte nou sou WhatsApp", "Contactez-nous sur WhatsApp", "Contact us on WhatsApp"],
  ["Enfòmasyon", "Informations", "Information"],
  ["Livrezon gratis", "Livraison gratuite", "Free delivery"],
  ["Livrezon: {fee}", "Livraison : {fee}", "Delivery: {fee}"],
  ["Livrezon gratis pou kòmand {amount} oswa plis", "Livraison gratuite dès {amount} d'achat", "Free delivery on orders of {amount} or more"],
  ["Bonjou {shop}, mwen vle plis enfòmasyon.", "Bonjour {shop}, je souhaite plus d'informations.", "Hello {shop}, I'd like more information."],
  ["Akèy", "Accueil", "Home"],
  ["Kòmand", "Commandes", "Orders"],
  ["Kont", "Compte", "Account"],
  ["Chèche yon pwodwi, yon mak...", "Rechercher un produit, une marque...", "Search for a product or brand..."],
  ["Efase", "Effacer", "Clear"],
  ["Fèmen", "Fermer", "Close"],
  ["Langue", "Langue", "Language"],

  // ----- Panye
  ["Panye ({n})", "Panier ({n})", "Cart ({n})"],
  ["Ajoute {amount} pou livrezon gratis", "Ajoutez {amount} pour la livraison gratuite", "Add {amount} for free delivery"],
  ["✓ Ou gen livrezon gratis!", "✓ Vous avez la livraison gratuite !", "✓ You get free delivery!"],
  ["Panye ou vid.", "Votre panier est vide.", "Your cart is empty."],
  ["Kontinye achte", "Continuer vos achats", "Continue shopping"],
  ["Mwens", "Moins", "Less"],
  ["Plis", "Plus", "More"],
  ["Retire", "Retirer", "Remove"],
  ["Sou-total", "Sous-total", "Subtotal"],
  ["Livrezon ak koupon kalkile nan pwochen etap la.", "Livraison et coupon calculés à l'étape suivante.", "Delivery and coupon are calculated at the next step."],
  ["Pase kòmand lan", "Passer la commande", "Place order"],
  ["Notifye m lè l disponib", "Me prévenir quand disponible", "Notify me when available"],
  ["Nou anrejistre nimewo ou. Boutik la ap kontakte w.", "Nous avons enregistré votre numéro. La boutique vous contactera.", "We saved your number. The shop will contact you."],
  ["Telefòn / WhatsApp", "Téléphone / WhatsApp", "Phone / WhatsApp"],
  ["Voye", "Envoyer", "Send"],
  ["Pa ka anrejistre. Eseye ankò.", "Impossible d'enregistrer. Réessayez.", "Could not save. Try again."],

  // ----- Katalòg
  ["Rekòmande", "Recommandés", "Recommended"],
  ["Pi vann", "Meilleures ventes", "Best sellers"],
  ["Pi nouvo", "Plus récents", "Newest"],
  ["Pri: piti → gwo", "Prix : croissant", "Price: low → high"],
  ["Pri: gwo → piti", "Prix : décroissant", "Price: high → low"],
  ["Pi gwo rabè", "Plus fortes remises", "Biggest discounts"],
  ["Pi bon nòt", "Mieux notés", "Top rated"],
  ["Rezilta pou “{q}”", "Résultats pour « {q} »", "Results for “{q}”"],
  ["Tout pwodwi", "Tous les produits", "All products"],
  ["Achte kounye a", "Acheter maintenant", "Buy now"],
  ["Kontakte nou", "Contactez-nous", "Contact us"],
  ["⭐ Vedèt", "⭐ À la une", "⭐ Featured"],
  ["🔥 Promosyon", "🔥 Promotions", "🔥 On sale"],
  ["🆕 Nouvo", "🆕 Nouveautés", "🆕 New"],
  ["🏆 Pi vann", "🏆 Meilleures ventes", "🏆 Best sellers"],
  ["Retire filt", "Retirer les filtres", "Clear filters"],
  ["{n} rezilta", "{n} résultats", "{n} results"],
  ["Filt", "Filtres", "Filters"],
  ["Triye", "Trier", "Sort"],
  ["Poko gen pwodwi nan boutik la.", "Aucun produit dans la boutique pour l'instant.", "No products in the shop yet."],
  ["Okenn pwodwi pa matche.", "Aucun produit ne correspond.", "No products match."],
  ["Wè tout pwodwi yo", "Voir tous les produits", "See all products"],
  ["Wè plis ({n})", "Voir plus ({n})", "See more ({n})"],
  ["Pri ({currency})", "Prix ({currency})", "Price ({currency})"],
  ["Sèlman sa ki disponib", "Uniquement les produits disponibles", "In stock only"],
  ["Kategori", "Catégorie", "Category"],
  ["Reyinisyalize", "Réinitialiser", "Reset"],
  ["Wè {n} pwodwi", "Voir {n} produits", "View {n} products"],

  // ----- Kat pwodwi / ui
  ["FINI", "ÉPUISÉ", "SOLD OUT"],
  ["BALEN", "DERNIERS", "LOW STOCK"],
  ["NOUVO", "NOUVEAU", "NEW"],
  ["Retire nan favori", "Retirer des favoris", "Remove from favorites"],
  ["Ajoute nan favori", "Ajouter aux favoris", "Add to favorites"],
  ["{n} vann", "{n} vendus", "{n} sold"],
  ["Notifye m", "Me prévenir", "Notify me"],
  ["Chwazi opsyon", "Choisir une option", "Choose an option"],
  ["Nan panye ({n})", "Dans le panier ({n})", "In cart ({n})"],
  ["Ajoute", "Ajouter", "Add"],
  ["Wè tout", "Voir tout", "See all"],
  ["{n} sou 5", "{n} sur 5", "{n} out of 5"],
  ["Fini pou kounye a", "Épuisé pour le moment", "Out of stock for now"],
  ["Sèlman {n} rete", "Plus que {n}", "Only {n} left"],
  ["{n} disponib", "{n} disponibles", "{n} available"],
  ["Kòmand resevwa", "Commande reçue", "Order received"],
  ["Konfime", "Confirmée", "Confirmed"],
  ["Ap prepare", "En préparation", "Preparing"],
  ["Nan wout", "En route", "On the way"],
  ["Pare pou ranmase", "Prête à être retirée", "Ready for pickup"],
  ["Livre", "Livrée", "Delivered"],
  ["Ranmase||status", "Retirée", "Picked up"],

  // ----- Checkout
  ["Kach lè m resevwa", "Espèces à la réception", "Cash on delivery"],
  ["Kach lè livrezon/ranmase", "Espèces à la livraison/au retrait", "Cash on delivery/pickup"],
  ["MonCash", "MonCash", "MonCash"],
  ["NatCash", "NatCash", "NatCash"],
  ["Transfè bank", "Virement bancaire", "Bank transfer"],
  ["Pa ka voye kòmand lan. Eseye ankò.", "Impossible d'envoyer la commande. Réessayez.", "Could not send the order. Try again."],
  ["Erè rezo — verifye entènèt ou epi eseye ankò.", "Erreur réseau — vérifiez votre connexion et réessayez.", "Network error — check your internet and try again."],
  ["Gade pwodwi yo", "Voir les produits", "Browse products"],
  ["1. Kijan ou vle resevwa kòmand lan?", "1. Comment souhaitez-vous recevoir la commande ?", "1. How would you like to receive your order?"],
  ["Livrezon", "Livraison", "Delivery"],
  ["Ranmase", "Retrait en boutique", "Store pickup"],
  ["Gratis", "Gratuit", "Free"],
  ["Tan livrezon: {eta}", "Délai de livraison : {eta}", "Delivery time: {eta}"],
  ["Tan livrezon", "Délai de livraison", "Delivery time"],
  ["2. Enfòmasyon ou", "2. Vos informations", "2. Your details"],
  ["Enfòmasyon ou", "Vos informations", "Your details"],
  ["Non konplè *", "Nom complet *", "Full name *"],
  ["Telefòn / WhatsApp *", "Téléphone / WhatsApp *", "Phone / WhatsApp *"],
  ["Adrès livrezon * (ri, katye, vil)", "Adresse de livraison * (rue, quartier, ville)", "Delivery address * (street, area, city)"],
  ["Nòt pou boutik la (opsyonèl)", "Note pour la boutique (facultatif)", "Note for the shop (optional)"],
  ["3. Peman", "3. Paiement", "3. Payment"],
  ["Peman", "Paiement", "Payment"],
  ["Boutik la ap kontakte w ak enstriksyon peman an apre kòmand lan.", "La boutique vous contactera avec les instructions de paiement après la commande.", "The shop will contact you with payment instructions after you order."],
  ["Nimewo tranzaksyon (si ou deja peye)", "Numéro de transaction (si déjà payé)", "Transaction number (if already paid)"],
  ["Rezime", "Récapitulatif", "Summary"],
  ["{code} aplike", "{code} appliqué", "{code} applied"],
  ["Kòd promosyon", "Code promo", "Promo code"],
  ["Aplike", "Appliquer", "Apply"],
  ["Rabè koupon", "Réduction coupon", "Coupon discount"],
  ["Total", "Total", "Total"],
  ["Konfime kòmand lan", "Confirmer la commande", "Confirm order"],
  ["Ou pa peye anyen kounye a — boutik la ap konfime kòmand lan avè w.", "Vous ne payez rien maintenant — la boutique confirmera la commande avec vous.", "You pay nothing now — the shop will confirm the order with you."],

  // ----- Paj pwodwi
  ["Pwodwi sa a pa disponib ankò.", "Ce produit n'est plus disponible.", "This product is no longer available."],
  ["Retounen nan boutik la", "Retour à la boutique", "Back to the shop"],
  ["Lyen kopye ✓", "Lien copié ✓", "Link copied ✓"],
  ["Chwazi yon gwosè.", "Choisissez une taille.", "Choose a size."],
  ["Chwazi yon koulè.", "Choisissez une couleur.", "Choose a color."],
  ["Bonjou, mwen enterese nan \"{name}\" ({url}).", "Bonjour, je suis intéressé(e) par « {name} » ({url}).", "Hello, I'm interested in \"{name}\" ({url})."],
  ["Anvan", "Précédent", "Previous"],
  ["Apre", "Suivant", "Next"],
  ["Foto {n}", "Photo {n}", "Photo {n}"],
  ["({n} avi)", "({n} avis)", "({n} reviews)"],
  ["Poko gen avi", "Pas encore d'avis", "No reviews yet"],
  ["Ou ekonomize", "Vous économisez", "You save"],
  ["Koulè", "Couleur", "Color"],
  ["Gwosè", "Taille", "Size"],
  ["Kantite", "Quantité", "Quantity"],
  ["Ajoute ankò ({n})", "Ajouter encore ({n})", "Add more ({n})"],
  ["Ajoute nan panye", "Ajouter au panier", "Add to cart"],
  ["Pataje", "Partager", "Share"],
  ["Poze yon kesyon", "Poser une question", "Ask a question"],
  ["Ranmase nan boutik", "Retrait en boutique", "Pickup in store"],
  [" · gratis pou {amount}+", " · gratuite dès {amount}", " · free from {amount}"],
  ["MonCash, NatCash, transfè bank oswa kach lè w resevwa", "MonCash, NatCash, virement bancaire ou espèces à la réception", "MonCash, NatCash, bank transfer or cash on delivery"],
  ["Deskripsyon", "Description", "Description"],
  ["Mak", "Marque", "Brand"],
  ["Inite", "Unité", "Unit"],
  ["Ou ka renmen tou", "Vous aimerez aussi", "You may also like"],
  ["Ou fèk gade", "Récemment consultés", "Recently viewed"],
  ["chwazi youn", "choisissez-en un", "choose one"],
  ["Avi kliyan", "Avis clients", "Customer reviews"],
  ["Ekri yon avi", "Écrire un avis", "Write a review"],
  ["{n} avi", "{n} avis", "{n} reviews"],
  ["Poko gen avi. Se ou ki ka premye a — sèlman kliyan ki achte pwodwi a ka bay yon avi.", "Pas encore d'avis. Soyez le premier — seuls les clients ayant acheté le produit peuvent laisser un avis.", "No reviews yet. Be the first — only customers who bought the product can leave a review."],
  ["Achte verifye", "Achat vérifié", "Verified purchase"],
  ["Chwazi yon nòt (1 a 5 etwal).", "Choisissez une note (1 à 5 étoiles).", "Choose a rating (1 to 5 stars)."],
  ["Pa ka voye avi a.", "Impossible d'envoyer l'avis.", "Could not send the review."],
  ["Erè rezo — eseye ankò.", "Erreur réseau — réessayez.", "Network error — try again."],
  ["Pou evite fo avi, antre kòd kòmand ou ak telefòn ou itilize a.", "Pour éviter les faux avis, saisissez votre code de commande et le téléphone utilisé.", "To prevent fake reviews, enter your order code and the phone number you used."],
  ["Nòt", "Note", "Rating"],
  ["{n} etwal", "{n} étoile(s)", "{n} star(s)"],
  ["Non ou *", "Votre nom *", "Your name *"],
  ["Kòmantè (opsyonèl)", "Commentaire (facultatif)", "Comment (optional)"],
  ["Kòd kòmand *", "Code de commande *", "Order code *"],
  ["Telefòn *", "Téléphone *", "Phone *"],
  ["Anile", "Annuler", "Cancel"],
  ["Pibliye avi a", "Publier l'avis", "Publish review"],

  // ----- Swivi kòmand
  ["Pa ka chèche kòmand lan.", "Impossible de trouver la commande.", "Could not find the order."],
  ["Bonjou {shop}, mwen vle nouvèl kòmand #{code}.", "Bonjour {shop}, je voudrais des nouvelles de la commande #{code}.", "Hello {shop}, I'd like an update on order #{code}."],
  ["Kòmand lan voye!", "Commande envoyée !", "Order sent!"],
  ["Nimewo kòmand ou", "Votre numéro de commande", "Your order number"],
  ["Kenbe kòd sa a pou swiv kòmand lan. {shop} ap kontakte w pou konfime l.", "Conservez ce code pour suivre la commande. {shop} vous contactera pour la confirmer.", "Keep this code to track your order. {shop} will contact you to confirm it."],
  ["Kenbe kòd sa a pou swiv kòmand lan. {shop} ap kontakte w pou konfime l ak peman an.", "Conservez ce code pour suivre la commande. {shop} vous contactera pour confirmer la commande et le paiement.", "Keep this code to track your order. {shop} will contact you to confirm it and the payment."],
  ["Chèche kòmand lan", "Rechercher la commande", "Find order"],
  ["Kòd kòmand (ekz: A1B2C3)", "Code de commande (ex : A1B2C3)", "Order code (e.g. A1B2C3)"],
  ["Telefòn ou itilize a", "Téléphone utilisé", "Phone you used"],
  ["Kòmand ou yo sou aparèy sa a", "Vos commandes sur cet appareil", "Your orders on this device"],
  ["Kòmand #{code}", "Commande #{code}", "Order #{code}"],
  ["Chèche yon lòt", "Chercher une autre", "Search another"],
  ["Bay yon avi", "Donner un avis", "Leave a review"],
  ["Rabè", "Réduction", "Discount"],
  ["Peman:", "Paiement :", "Payment:"],
  ["Peye", "Payé", "Paid"],
  ["Peye {paid} · rete {balance}", "Payé {paid} · reste {balance}", "Paid {paid} · {balance} left"],
  ["Anile||status", "Annulée", "Cancelled"],
  ["Poko peye", "Pas encore payé", "Not paid yet"],
  ["Kontakte boutik la", "Contacter la boutique", "Contact the shop"],
  ["Kòmand sa a anile.", "Cette commande a été annulée.", "This order was cancelled."],

  // ----- Livrezon / peman / retou
  ["Livrezon ak ranmase", "Livraison et retrait", "Delivery and pickup"],
  ["Livrezon:", "Livraison :", "Delivery:"],
  ["gratis", "gratuit", "free"],
  [" (gratis pou kòmand {amount} oswa plis)", " (gratuite dès {amount})", " (free on orders of {amount} or more)"],
  ["Pa gen livrezon pou kounye a.", "Pas de livraison pour le moment.", "No delivery available at the moment."],
  ["Tan livrezon:", "Délai de livraison :", "Delivery time:"],
  ["apre ou fin kòmande", "après votre commande", "after you order"],
  ["Ranmase nan boutik la:", "Retrait en boutique :", "Pickup in store:"],
  ["Kach lè w resevwa, MonCash, NatCash oswa transfè bank. Boutik la ap kontakte w apre kòmand lan.", "Espèces à la réception, MonCash, NatCash ou virement bancaire. La boutique vous contactera après la commande.", "Cash on delivery, MonCash, NatCash or bank transfer. The shop will contact you after your order."],
  ["Retou ak garanti", "Retours et garantie", "Returns and warranty"],
  ["Kontak", "Contact", "Contact"],

  // ----- Favori
  ["Favori mwen ({n})", "Mes favoris ({n})", "My favorites ({n})"],
  ["Ou poko gen favori. Peze kè a sou yon pwodwi pou sove l isit la.", "Vous n'avez pas encore de favoris. Appuyez sur le cœur d'un produit pour l'enregistrer ici.", "You have no favorites yet. Tap the heart on a product to save it here."],

  // ----- Kont kliyan
  ["Resevwa", "Reçue", "Received"],
  ["Pwofil", "Profil", "Profile"],
  ["Kòmand ({n})", "Commandes ({n})", "Orders ({n})"],
  ["Setting", "Paramètres", "Settings"],
  ["Kreye kont", "Créer un compte", "Sign up"],
  ["Konekte oswa kreye yon kont sou {shop}", "Connectez-vous ou créez un compte sur {shop}", "Log in or create an account on {shop}"],
  ["Pa ka konekte. Eseye ankò.", "Connexion impossible. Réessayez.", "Could not log in. Try again."],
  ["Ou konekte ✓", "Vous êtes connecté ✓", "You're logged in ✓"],
  ["Erè rezo — verifye entènèt ou.", "Erreur réseau — vérifiez votre connexion.", "Network error — check your internet."],
  ["Imèl", "E-mail", "Email"],
  ["Modpas", "Mot de passe", "Password"],
  ["Poko gen kont?", "Pas encore de compte ?", "No account yet?"],
  ["Kreye youn", "En créer un", "Create one"],
  ["Modpas la dwe gen omwen 8 karaktè.", "Le mot de passe doit contenir au moins 8 caractères.", "Password must be at least 8 characters."],
  ["Pa ka kreye kont lan. Eseye ankò.", "Impossible de créer le compte. Réessayez.", "Could not create the account. Try again."],
  ["Kont kreye ✓", "Compte créé ✓", "Account created ✓"],
  ["Non konplè", "Nom complet", "Full name"],
  ["Nimewo telefòn", "Numéro de téléphone", "Phone number"],
  ["Adrès (pou livrezon)", "Adresse (pour la livraison)", "Address (for delivery)"],
  ["Katye, ri, vil...", "Quartier, rue, ville...", "Area, street, city..."],
  ["Modpas (omwen 8 karaktè)", "Mot de passe (8 caractères minimum)", "Password (at least 8 characters)"],
  ["Kreye kont mwen", "Créer mon compte", "Create my account"],
  ["Nou itilize enfòmasyon sa yo sèlman pou trete kòmand ou yo. Gade {link}.", "Nous utilisons ces informations uniquement pour traiter vos commandes. Voir la {link}.", "We only use this information to process your orders. See the {link}."],
  ["politik konfidansyalite", "politique de confidentialité", "privacy policy"],
  ["Gen yon kont deja?", "Vous avez déjà un compte ?", "Already have an account?"],
  ["Pa ka sove. Eseye ankò.", "Enregistrement impossible. Réessayez.", "Could not save. Try again."],
  ["Pwofil sove ✓", "Profil enregistré ✓", "Profile saved ✓"],
  ["Adrès", "Adresse", "Address"],
  ["Sove chanjman yo", "Enregistrer les modifications", "Save changes"],
  ["Ou poko gen kòmand", "Vous n'avez pas encore de commande", "You have no orders yet"],
  ["Kòmand ou pase lè w konekte yo ap parèt isit la.", "Les commandes passées en étant connecté apparaîtront ici.", "Orders you place while logged in will appear here."],
  ["Bonjou {shop}, mwen bezwen èd.", "Bonjour {shop}, j'ai besoin d'aide.", "Hello {shop}, I need help."],
  ["App la", "L'application", "The app"],
  ["Rakousi", "Raccourcis", "Shortcuts"],
  ["Swiv yon kòmand", "Suivre une commande", "Track an order"],
  ["Sesyon", "Session", "Session"],
  ["Ou dekonekte", "Vous êtes déconnecté", "You're logged out"],
  ["Dekonekte", "Se déconnecter", "Log out"],
  ["Konfidansyalite", "Confidentialité", "Privacy"],
  ["Kondisyon", "Conditions", "Terms"],
  ["Pa ka chanje modpas la.", "Impossible de changer le mot de passe.", "Could not change the password."],
  ["Modpas chanje ✓", "Mot de passe modifié ✓", "Password changed ✓"],
  ["Sekirite", "Sécurité", "Security"],
  ["Chanje modpas", "Changer le mot de passe", "Change password"],
  ["Modpas aktyèl", "Mot de passe actuel", "Current password"],
  ["Nouvo modpas (omwen 8 karaktè)", "Nouveau mot de passe (8 caractères minimum)", "New password (at least 8 characters)"],
  ["Ou sèten ou vle efase kont ou? Aksyon sa a pa ka defèt.", "Voulez-vous vraiment supprimer votre compte ? Cette action est irréversible.", "Are you sure you want to delete your account? This cannot be undone."],
  ["Pa ka efase kont lan.", "Impossible de supprimer le compte.", "Could not delete the account."],
  ["Kont efase", "Compte supprimé", "Account deleted"],
  ["Zòn danje", "Zone de danger", "Danger zone"],
  ["Efase kont mwen", "Supprimer mon compte", "Delete my account"],
  ["Non, telefòn, imèl ak adrès ou ap efase. Antre modpas ou pou konfime.", "Votre nom, téléphone, e-mail et adresse seront supprimés. Saisissez votre mot de passe pour confirmer.", "Your name, phone, email and address will be deleted. Enter your password to confirm."],
  ["Modpas ou", "Votre mot de passe", "Your password"],
  ["Efase kont lan pou toutbon", "Supprimer définitivement le compte", "Delete the account permanently"],

  // ----- Enstale app
  ["Mete {name} sou ekran an", "Ajouter {name} à l'écran d'accueil", "Add {name} to your home screen"],
  ["Louvri paj sa a nan Safari, epi peze bouton Pataje anba a.", "Ouvrez cette page dans Safari, puis appuyez sur le bouton Partager en bas.", "Open this page in Safari, then tap the Share button at the bottom."],
  ["Chwazi « Sou ekran dakèy » / « Add to Home Screen »", "Choisissez « Sur l'écran d'accueil » / « Add to Home Screen »", "Choose “Add to Home Screen”"],
  ["Peze Ajoute. Logo {name} ap parèt sou telefòn ou kou yon vrè app.", "Appuyez sur Ajouter. Le logo de {name} apparaîtra sur votre téléphone comme une vraie app.", "Tap Add. The {name} logo will appear on your phone like a real app."],
  ["Louvri meni navigatè a (⋮ nan Chrome).", "Ouvrez le menu du navigateur (⋮ dans Chrome).", "Open the browser menu (⋮ in Chrome)."],
  ["Chwazi « Enstale app » oswa « Ajoute sou ekran dakèy »", "Choisissez « Installer l'application » ou « Ajouter à l'écran d'accueil »", "Choose “Install app” or “Add to Home screen”"],
  ["Konfime. Logo {name} ap parèt sou telefòn ou.", "Confirmez. Le logo de {name} apparaîtra sur votre téléphone.", "Confirm. The {name} logo will appear on your phone."],
  ["Konprann", "Compris", "Got it"],
  ["✓ App la deja enstale sou aparèy sa a.", "✓ L'application est déjà installée sur cet appareil.", "✓ The app is already installed on this device."],
  ["Enstale app", "Installer l'application", "Install app"],
  ["Mete l sou ekran telefòn ou, ouvri l tousuit.", "Ajoutez-la à l'écran de votre téléphone, ouvrez-la en un clic.", "Add it to your phone's screen and open it instantly."],
  ["Enstale", "Installer", "Install"],

  // ----- Mesaj sèvè (tradui kote kliyan an wè yo)
  ["Twòp demann. Eseye pita.", "Trop de demandes. Réessayez plus tard.", "Too many requests. Try again later."],
  ["Twòp kòmand nan yon ti tan. Eseye pita.", "Trop de commandes en peu de temps. Réessayez plus tard.", "Too many orders in a short time. Try again later."],
  ["Boutik pa jwenn.", "Boutique introuvable.", "Shop not found."],
  ["Antre yon nimewo valid.", "Saisissez un numéro valide.", "Enter a valid number."],
  ["Pwodwi pa jwenn.", "Produit introuvable.", "Product not found."],
  ["Ranpli non ou, nimewo telefòn ou ak omwen yon pwodwi.", "Renseignez votre nom, votre téléphone et au moins un produit.", "Fill in your name, phone number and at least one product."],
  ["Mete adrès livrezon ou.", "Indiquez votre adresse de livraison.", "Enter your delivery address."],
  ["Stok {name} pa sifi. Redwi kantite a oswa rafrechi paj la.", "Stock insuffisant pour {name}. Réduisez la quantité ou actualisez la page.", "Not enough stock for {name}. Reduce the quantity or refresh the page."],
  ["Mete non ou, yon nòt (1-5) ak kòd kòmand ou.", "Indiquez votre nom, une note (1-5) et votre code de commande.", "Enter your name, a rating (1-5) and your order code."],
  ["Nou pa jwenn yon kòmand ak pwodwi sa a pou kòd ak telefòn sa yo.", "Nous ne trouvons aucune commande contenant ce produit pour ce code et ce téléphone.", "We couldn't find an order with this product for that code and phone number."],
  ["Ou deja bay yon avi pou pwodwi sa a.", "Vous avez déjà donné un avis pour ce produit.", "You have already reviewed this product."],
  ["Ou pa konekte.", "Vous n'êtes pas connecté.", "You are not logged in."],
  ["Twòp eseye. Tann yon ti tan.", "Trop de tentatives. Patientez un moment.", "Too many attempts. Please wait a moment."],
  ["Nouvo modpas la dwe gen omwen 8 karaktè.", "Le nouveau mot de passe doit contenir au moins 8 caractères.", "The new password must be at least 8 characters."],
  ["Modpas aktyèl la pa kòrèk.", "Le mot de passe actuel est incorrect.", "The current password is incorrect."],
  ["Verifye non ou ak nimewo telefòn ou.", "Vérifiez votre nom et votre numéro de téléphone.", "Check your name and phone number."],
  ["Modpas la pa kòrèk.", "Mot de passe incorrect.", "Incorrect password."],
  ["Twòp eseye. Tann yon ti tan epi eseye ankò.", "Trop de tentatives. Patientez un moment puis réessayez.", "Too many attempts. Wait a moment and try again."],
  ["Ranpli non, telefòn, imèl valid, epi yon modpas ki gen omwen 8 karaktè.", "Renseignez nom, téléphone, e-mail valide et un mot de passe d'au moins 8 caractères.", "Fill in name, phone, a valid email and a password of at least 8 characters."],
  ["Nimewo telefòn pa valid.", "Numéro de téléphone invalide.", "Invalid phone number."],
  ["Gen yon kont ak imèl sa a deja. Konekte olye.", "Un compte existe déjà avec cet e-mail. Connectez-vous plutôt.", "An account with this email already exists. Log in instead."],
  ["Twòp eseye. Tann 15 minit epi eseye ankò.", "Trop de tentatives. Attendez 15 minutes puis réessayez.", "Too many attempts. Wait 15 minutes and try again."],
  ["Antre yon imèl ak yon modpas valid.", "Saisissez un e-mail et un mot de passe valides.", "Enter a valid email and password."],
  ["Twòp eseye pou kont sa a. Tann 15 minit.", "Trop de tentatives pour ce compte. Attendez 15 minutes.", "Too many attempts for this account. Wait 15 minutes."],
  ["Imèl oswa modpas pa kòrèk.", "E-mail ou mot de passe incorrect.", "Incorrect email or password."],
  ["Nou pa jwenn kòmand sa a. Verifye kòd la ak telefòn nan.", "Commande introuvable. Vérifiez le code et le téléphone.", "We couldn't find this order. Check the code and phone number."],
  ["Done pa valid.", "Données invalides.", "Invalid data."],
  ["Kòd promosyon sa a pa aktif.", "Ce code promo n'est pas actif.", "This promo code is not active."],
  ["Kòd promosyon sa a ekspire.", "Ce code promo a expiré.", "This promo code has expired."],
  ["Kòd promosyon sa a rive nan limit li.", "Ce code promo a atteint sa limite d'utilisation.", "This promo code has reached its limit."],
  ["Kòd sa a mande omwen {min} nan kòmand lan.", "Ce code exige une commande d'au moins {min}.", "This code requires an order of at least {min}."],
  ["Boutik la pa fè livrezon.", "La boutique ne fait pas de livraison.", "The shop does not offer delivery."],
  ["Ranmase nan boutik la pa disponib.", "Le retrait en boutique n'est pas disponible.", "Store pickup is not available."],
  ["Yon pwodwi pa disponib ankò. Rafrechi paj la.", "Un produit n'est plus disponible. Actualisez la page.", "A product is no longer available. Refresh the page."],
  ["Chwazi yon gwosè valid pou {name}.", "Choisissez une taille valide pour {name}.", "Choose a valid size for {name}."],
  ["Chwazi yon koulè valid pou {name}.", "Choisissez une couleur valide pour {name}.", "Choose a valid color for {name}."],
  ["Pwodwi sa yo pa gen pri. Kontakte biznis la.", "Ces produits n'ont pas de prix. Contactez la boutique.", "These products have no price. Contact the shop."],
  ["Kòd promosyon sa a pa egziste.", "Ce code promo n'existe pas.", "This promo code does not exist."],

  // ----- Toast
  ["Ou rive nan stok ki disponib la.", "Vous avez atteint le stock disponible.", "You've reached the available stock."],
  ["Ajoute nan panye ✓", "Ajouté au panier ✓", "Added to cart ✓"],

  // ----- Delè livrezon
  ["Jiska {n} jou", "Jusqu'à {n} jours", "Up to {n} days"],
  ["{n} jou", "{n} jours", "{n} days"],
  ["{lo} a {hi} jou", "{lo} à {hi} jours", "{lo} to {hi} days"],
];

const FR = new Map<string, string>();
const EN = new Map<string, string>();
const templates: { re: RegExp; names: string[]; key: string }[] = [];
for (const [ht, fr, en] of D) {
  FR.set(ht, fr);
  EN.set(ht, en);
  if (ht.includes("{")) {
    const names: string[] = [];
    const src = ht
      .replace(/[.*+?^$()|[\]\\]/g, "\\$&")
      .replace(/\{(\w+)\}/g, (_m, n: string) => {
        names.push(n);
        return "(.+?)";
      });
    templates.push({ re: new RegExp(`^${src}$`), names, key: ht });
  }
}

function fill(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, n: string) => (n in vars ? String(vars[n]) : m));
}

/** Retire `||kontèks` nan kle a (pa afiche). */
function bare(key: string) {
  const i = key.indexOf("||");
  return i === -1 ? key : key.slice(0, i);
}

/** Tradui yon kle kreyòl. Si pa gen tradiksyon, tèks kreyòl la parèt (pa janm yon erè). */
export function translateShop(lang: ShopLang, key: string, vars?: Record<string, string | number>): string {
  if (lang === "ht") return fill(bare(key), vars);
  const map = lang === "fr" ? FR : EN;
  const hit = map.get(key);
  if (hit !== undefined) return fill(hit, vars);
  // Mesaj sèvè ki gen valè andedan (ex: "Stok Chemiz pa sifi...")
  for (const t of templates) {
    const m = t.re.exec(key);
    if (m) {
      const found: Record<string, string> = {};
      t.names.forEach((n, i) => (found[n] = m[i + 1]));
      return fill(map.get(t.key) ?? key, found);
    }
  }
  return fill(bare(key), vars);
}

export const SHOP_LANG_KEY = "boutik-lang";
