import { Document, Page, Text, View, StyleSheet, pdf, Font } from "@react-pdf/renderer";

Font.register({
  family: "Roboto",
  fonts: [
    { src: require("./fonts/Roboto-Regular.ttf"), fontWeight: "normal" },
    { src: require("./fonts/Roboto-Bold.ttf"), fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Roboto" },
  header: { marginBottom: 24 },
  title: { fontSize: 22, fontWeight: "bold", color: "#04342C", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#666", marginBottom: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, borderBottom: "0.5px solid #eee", paddingBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottom: "0.5px solid #f0f0f0" },
  label: { fontSize: 11, color: "#666", flex: 1 },
  value: { fontSize: 11, color: "#1a1a1a", fontWeight: "bold", flex: 1, textAlign: "right" },
  priceBox: { backgroundColor: "#E1F5EE", padding: 12, borderRadius: 6, marginBottom: 16 },
  priceLabel: { fontSize: 10, color: "#0F6E56", marginBottom: 2 },
  priceValue: { fontSize: 18, fontWeight: "bold", color: "#04342C" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 9, color: "#aaa" },
});

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "—"}</Text>
  </View>
);

export const generateUnitPDF = async (project, unit) => {
  const priceVat = unit.price_net ? Math.round(unit.price_net * 1.12) : null;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{project.name}</Text>
          <Text style={styles.subtitle}>{project.address || project.location}</Text>
          <Text style={styles.subtitle}>Nabídka jednotky č. {unit.unit_number} · {unit.disp}</Text>
        </View>

        {unit.price_net && (
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Cena bez DPH</Text>
            <Text style={styles.priceValue}>{unit.price_net.toLocaleString("cs-CZ")} Kč</Text>
            {priceVat && <Text style={[styles.priceLabel, { marginTop: 6 }]}>Cena s DPH (12%): {priceVat.toLocaleString("cs-CZ")} Kč</Text>}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parametry jednotky</Text>
          <Row label="Číslo jednotky" value={String(unit.unit_number)} />
          <Row label="Budova" value={unit.building} />
          <Row label="Patro" value={unit.floor ? unit.floor + ". patro" : null} />
          <Row label="Dispozice" value={unit.disp} />
          <Row label="Prodejní plocha" value={unit.area ? unit.area + " m²" : null} />
          <Row label="Orientace" value={unit.orientation} />
          <Row label="Balkon/lodžie/terasa" value={unit.balcony ? (unit.balcony_type || "Ano") : "Ne"} />
          <Row label="Plocha balkonu" value={unit.balcony_area ? unit.balcony_area + " m²" : null} />
          <Row label="Sklep" value={unit.cellar ? "Ano" : "Ne"} />
          <Row label="Parkovací místo" value={unit.parking ? "Ano" : "Ne"} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ceny</Text>
          <Row label="Cena za m²" value={unit.price_per_sqm ? unit.price_per_sqm.toLocaleString("cs-CZ") + " Kč/m²" : null} />
          <Row label="Cena bez DPH" value={unit.price_net ? unit.price_net.toLocaleString("cs-CZ") + " Kč" : null} />
          <Row label="Cena s DPH 12%" value={priceVat ? priceVat.toLocaleString("cs-CZ") + " Kč" : null} />
          {unit.price_action && <Row label="Akční cena" value={unit.price_action.toLocaleString("cs-CZ") + " Kč"} />}
        </View>

        <Text style={styles.footer}>Tento dokument je informativní. Ceny jsou uvedeny v Kč.</Text>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `byt-${unit.unit_number}-${project.name}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
