import { Document, Page, Text, View, pdf, Font, Image } from "@react-pdf/renderer";

Font.register({
  family: "Roboto",
  fonts: [
    { src: require("./fonts/Roboto-Regular.ttf"), fontWeight: "normal" },
    { src: require("./fonts/Roboto-Bold.ttf"), fontWeight: "bold" },
  ],
});

const statusLabel = (s) => ({ available: "Volný", reserved: "Rezervovaný", sold: "Prodaný", blocked: "Blokovaný" }[s] || s);

export const generateCenikPDF = async (project, units) => {
  const doc = (
    <Document>
      <Page size="A4" orientation="landscape" style={{ padding: 30, fontFamily: "Roboto" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #e0e0e0" }}>
          {project.company_logo
            ? <Image src={project.company_logo} style={{ height: 40, maxWidth: 140, objectFit: "contain" }} />
            : <Text style={{ fontSize: 16, fontWeight: "bold", color: "#0D2137" }}>{project.name}</Text>
          }
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "#0D2137" }}>Ceník bytových jednotek</Text>
            <Text style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{project.address || project.location}</Text>
            <Text style={{ fontSize: 9, color: "#aaa", marginTop: 2 }}>Vygenerováno: {new Date().toLocaleDateString("cs-CZ")}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", backgroundColor: "#0D2137", padding: "6 8", borderRadius: 4, marginBottom: 4 }}>
          {[["č.", 30], ["Budova", 50], ["Patro", 40], ["Dispozice", 55], ["Plocha m²", 55], ["Orientace", 65], ["Balkon", 45], ["Sklep", 40], ["Parkoviště", 55], ["Cena bez DPH", 80], ["Cena s DPH", 75], ["Kč/m²", 55], ["Stav", 60]].map(([label, width]) => (
            <Text key={label} style={{ width, fontSize: 8, color: "#fff", fontWeight: "bold" }}>{label}</Text>
          ))}
        </View>

        {(units || []).map((u, i) => (
          <View key={u.id} style={{ flexDirection: "row", padding: "5 8", backgroundColor: i % 2 === 0 ? "#f8f8f8" : "#fff", borderRadius: 3 }}>
            {[
              [u.unit_number, 30],
              [u.building || "—", 50],
              [u.floor ? u.floor + ". p." : "—", 40],
              [u.disp || "—", 55],
              [u.area ? u.area + " m²" : "—", 55],
              [u.orientation || "—", 65],
              [u.balcony ? (u.balcony_type || "Ano") : "Ne", 45],
              [u.cellar ? "Ano" : "Ne", 40],
              [u.parking ? "Ano" : "Ne", 55],
              [u.price_net ? u.price_net.toLocaleString("cs-CZ") + " Kc" : "—", 80],
              [u.price_net ? Math.round(u.price_net * 1.12).toLocaleString("cs-CZ") + " Kc" : "—", 75],
              [u.price_per_sqm ? u.price_per_sqm.toLocaleString("cs-CZ") : "—", 55],
              [statusLabel(u.status), 60],
            ].map(([val, width], j) => (
              <Text key={j} style={{ width, fontSize: 8, color: u.status === "sold" ? "#aaa" : "#1a1a1a" }}>{val}</Text>
            ))}
          </View>
        ))}

        <View style={{ marginTop: 16, flexDirection: "row", gap: 20 }}>
          {[
            ["Celkem jednotek", units?.length || 0],
            ["Volných", units?.filter(u => u.status === "available").length || 0],
            ["Rezervovaných", units?.filter(u => u.status === "reserved").length || 0],
            ["Prodaných", units?.filter(u => u.status === "sold").length || 0],
          ].map(([label, value]) => (
            <View key={label} style={{ backgroundColor: "#f0f0f0", padding: "6 12", borderRadius: 6 }}>
              <Text style={{ fontSize: 8, color: "#888" }}>{label}</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: "#0D2137" }}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={{ position: "absolute", bottom: 16, left: 30, right: 30, textAlign: "center", fontSize: 7, color: "#ccc" }}>
          Tento ceník je informativní. Ceny jsou uvedeny v Kc bez/s DPH dle označení.
        </Text>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cenik-${project.name}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
