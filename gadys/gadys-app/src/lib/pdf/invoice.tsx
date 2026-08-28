import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { Business, Sale, Customer } from "@/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#12332E" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  logo: { width: 56, height: 56, marginBottom: 8 },
  businessName: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  muted: { color: "#6B7B76", fontSize: 9 },
  invoiceTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", textAlign: "right" },
  section: { marginBottom: 16 },
  label: { fontSize: 8, color: "#6B7B76", marginBottom: 2, textTransform: "uppercase" },
  table: { marginTop: 8, borderTop: "1 solid #E5E1D8" },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #E5E1D8",
    paddingVertical: 6,
  },
  tableHeader: { fontFamily: "Helvetica-Bold", backgroundColor: "#F7F5F0" },
  colName: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  totalsBox: { marginTop: 12, alignSelf: "flex-end", width: 200 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1 solid #12332E",
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, textAlign: "center" },
  qrRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 24 },
  qrCode: { width: 64, height: 64 },
  signature: { fontSize: 8, color: "#6B7B76" },
});

interface InvoiceProps {
  business: Business;
  sale: Sale;
  customer?: Customer;
  invoiceNumber: string;
  qrCodeDataUrl?: string; // généré via qrcode.toDataURL() côté serveur
}

export function InvoiceDocument({
  business,
  sale,
  customer,
  invoiceNumber,
  qrCodeDataUrl,
}: InvoiceProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            {business.logoUrl && <Image src={business.logoUrl} style={styles.logo} />}
            <Text style={styles.businessName}>{business.name}</Text>
            {business.address && <Text style={styles.muted}>{business.address}</Text>}
            {business.phone && <Text style={styles.muted}>{business.phone}</Text>}
            {business.email && <Text style={styles.muted}>{business.email}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FAKTI</Text>
            <Text style={styles.muted}>N° {invoiceNumber}</Text>
            <Text style={styles.muted}>
              {new Date(sale.createdAt).toLocaleDateString("fr-FR")}
            </Text>
          </View>
        </View>

        {customer && (
          <View style={styles.section}>
            <Text style={styles.label}>Kliyan</Text>
            <Text>{customer.name}</Text>
            {customer.phone && <Text style={styles.muted}>{customer.phone}</Text>}
            {customer.address && <Text style={styles.muted}>{customer.address}</Text>}
          </View>
        )}

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.colName}>Pwodwi</Text>
            <Text style={styles.colQty}>Kantite</Text>
            <Text style={styles.colPrice}>Pri init.</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {sale.items.map((item) => (
            <View style={styles.tableRow} key={item.productId}>
              <Text style={styles.colName}>{item.name}</Text>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colPrice}>{item.unitPrice.toLocaleString("fr-FR")}</Text>
              <Text style={styles.colTotal}>
                {(item.qty * item.unitPrice).toLocaleString("fr-FR")}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text>Sou-total</Text>
            <Text>{sale.subtotal.toLocaleString("fr-FR")}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Remiz</Text>
            <Text>-{sale.discount.toLocaleString("fr-FR")}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Taks</Text>
            <Text>{sale.tax.toLocaleString("fr-FR")}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Total</Text>
            <Text>
              {sale.total.toLocaleString("fr-FR")} {business.currency}
            </Text>
          </View>
        </View>

        <View style={styles.qrRow}>
          <View>
            <Text style={styles.signature}>Siyati Nimerik</Text>
            <Text style={styles.signature}>Fakti verifye — {invoiceNumber}</Text>
          </View>
          {qrCodeDataUrl && <Image src={qrCodeDataUrl} style={styles.qrCode} />}
        </View>

        <View style={styles.footer}>
          <Text style={styles.muted}>Mèsi pou konfyans ou nan {business.name}.</Text>
        </View>
      </Page>
    </Document>
  );
}
