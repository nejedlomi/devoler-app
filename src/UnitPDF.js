import { Document, Page, Text, View, StyleSheet, pdf, Font, Image } from "@react-pdf/renderer";

Font.register({
  family: "Roboto",
  fonts: [
    { src: require("./fonts/Roboto-Regular.ttf"), fontWeight: "normal" },
    { src: require("./fonts/Roboto-Bold.ttf"), fontWeight: "bold" },
  ],
});

const Row = ({ label, value, dark }) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottom: `0.5px solid ${dark ? "rgba(255,255,255,0.1)" : "#f0f0f0"}` }}>
    <Text style={{ fontSize: 10, color: dark ? "rgba(255,255,255,0.6)" : "#888", flex: 1 }}>{label}</Text>
    <Text style={{ fontSize: 10, color: dark ? "#fff" : "#1a1a1a", fontWeight: "bold", flex: 1, textAlign: "right" }}>{value || "—"}</Text>
  </View>
);

// ŠABLONA 1: MINIMALISTICKÁ — čistá, světlá, elegantní
const MinimalTemplate = ({ project, unit, options }) => {
  const { colorAccent = "#1D9E75", colorPrice = "#04342C", photosPosition, agentPosition, agentPhotoSize, borderRadius, priceSize } = options;
  const priceVat = unit.price_net ? Math.round(unit.price_net * 1.12) : null;
  const unitImages = Array.isArray(unit.images) ? unit.images : [];

  return (
    <Page size="A4" style={{ padding: 0, fontFamily: "Roboto", backgroundColor: "#fff" }}>
      {/* Hlavička */}
      <View style={{ backgroundColor: "#fff", padding: "30 40 20 40", flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${colorAccent}` }}>
        {project.company_logo
          ? <Image src={project.company_logo} style={{ height: 50, maxWidth: 160, objectFit: "contain" }} />
          : <Text style={{ fontSize: 18, fontWeight: "bold", color: colorPrice }}>{project.name}</Text>
        }
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 11, color: "#333", fontWeight: "bold" }}>{project.name}</Text>
          <Text style={{ fontSize: 9, color: "#888", marginTop: 2 }}>{project.address || project.location}</Text>
        </View>
      </View>

      <View style={{ padding: "20 40" }}>
        {/* Titulek */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: colorPrice, marginBottom: 4 }}>Nabídka bytu č. {unit.unit_number}</Text>
          <Text style={{ fontSize: 12, color: "#666" }}>{unit.disp} · {unit.area} m² · {unit.floor}. patro{unit.building ? ` · Budova ${unit.building}` : ""}</Text>
        </View>

        {/* Cena */}
        {unit.price_net && (
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8f8f8", padding: 16, borderRadius: 8, marginBottom: 16, borderLeft: `4px solid ${colorAccent}` }}>
            <View>
              <Text style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>CENA BEZ DPH</Text>
              <Text style={{ fontSize: priceSize === "large" ? 24 : 18, fontWeight: "bold", color: colorPrice }}>{unit.price_net.toLocaleString("cs-CZ")} Kč</Text>
              {priceVat && <Text style={{ fontSize: 10, color: "#888", marginTop: 3 }}>S DPH (12%): {priceVat.toLocaleString("cs-CZ")} Kč</Text>}
            </View>
            {unit.price_per_sqm && (
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 9, color: "#888", marginBottom: 3 }}>CENA ZA M²</Text>
                <Text style={{ fontSize: priceSize === "large" ? 18 : 14, fontWeight: "bold", color: colorAccent }}>{unit.price_per_sqm.toLocaleString("cs-CZ")} Kč/m²</Text>
              </View>
            )}
          </View>
        )}

        {/* Fotky nahoře */}
        {photosPosition === "top" && unitImages.length > 0 && (
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 16 }}>
            {unitImages.slice(0, 3).map((url, i) => <Image key={i} src={url} style={{ flex: 1, height: 120, objectFit: "cover", borderRadius: 6 }} />)}
          </View>
        )}

        {/* Parametry */}
        <View style={{ flexDirection: "row", gap: 20, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: colorAccent, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Parametry</Text>
            <Row label="Dispozice" value={unit.disp} />
            <Row label="Prodejní plocha" value={unit.area ? unit.area + " m²" : null} />
            <Row label="Patro" value={unit.floor ? unit.floor + ". patro" : null} />
            <Row label="Budova" value={unit.building} />
            <Row label="Orientace" value={unit.orientation} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: colorAccent, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Vybavení</Text>
            <Row label="Balkon/lodžie/terasa" value={unit.balcony ? (unit.balcony_type || "Ano") : "Ne"} />
            <Row label="Plocha balkonu" value={unit.balcony_area ? unit.balcony_area + " m²" : null} />
            <Row label="Sklep" value={unit.cellar ? "Ano" : "Ne"} />
            <Row label="Parkovací místo" value={unit.parking ? "Ano" : "Ne"} />
            {agentPosition === "right" && unit.agent_name && (
              <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
                {unit.agent_photo && <Image src={unit.agent_photo} style={{ width: agentPhotoSize * 0.6, height: agentPhotoSize * 0.6, borderRadius, objectFit: "cover" }} />}
                <View>
                  <Text style={{ fontSize: 11, fontWeight: "bold", color: "#1a1a1a" }}>{unit.agent_name}</Text>
                  {unit.agent_phone && <Text style={{ fontSize: 9, color: "#666", marginTop: 2 }}>Tel: {unit.agent_phone}</Text>}
                  {unit.agent_email && <Text style={{ fontSize: 9, color: "#666" }}>Email: {unit.agent_email}</Text>}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Fotky dole */}
        {photosPosition === "bottom" && unitImages.length > 0 && (
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 16 }}>
            {unitImages.slice(0, 3).map((url, i) => <Image key={i} src={url} style={{ flex: 1, height: 120, objectFit: "cover", borderRadius: 6 }} />)}
          </View>
        )}

        {/* Makléř dole */}
        {agentPosition === "bottom" && unit.agent_name && (
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f8f8f8", padding: 14, borderRadius: 8, gap: 14 }}>
            {unit.agent_photo && <Image src={unit.agent_photo} style={{ width: agentPhotoSize, height: agentPhotoSize, borderRadius, objectFit: "cover" }} />}
            <View>
              <Text style={{ fontSize: 13, fontWeight: "bold", color: "#1a1a1a", marginBottom: 3 }}>{unit.agent_name}</Text>
              <Text style={{ fontSize: 9, color: "#888", marginBottom: 4 }}>Realitní makléř</Text>
              {unit.agent_phone && <Text style={{ fontSize: 10, color: "#333" }}>Tel: {unit.agent_phone}</Text>}
              {unit.agent_email && <Text style={{ fontSize: 10, color: "#333" }}>Email: {unit.agent_email}</Text>}
              {unit.agent_web && <Text style={{ fontSize: 10, color: "#333" }}>Web: {unit.agent_web}</Text>}
            </View>
          </View>
        )}
      </View>

      <Text style={{ position: "absolute", bottom: 20, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#ccc" }}>
        Tento dokument je informativní a nezávazný. Ceny jsou uvedeny v Kč.
      </Text>
    </Page>
  );
};

// ŠABLONA 2: PRÉMIOVÁ — tmavá, luxusní
const PremiumTemplate = ({ project, unit, options }) => {
  const { colorAccent = "#C9A84C", photosPosition, agentPosition, agentPhotoSize, borderRadius, priceSize } = options;
  const priceVat = unit.price_net ? Math.round(unit.price_net * 1.12) : null;
  const unitImages = Array.isArray(unit.images) ? unit.images : [];

  return (
    <Page size="A4" style={{ padding: 0, fontFamily: "Roboto", backgroundColor: "#0D1F3C" }}>
      {/* Tmavá hlavička s logem */}
      <View style={{ padding: "28 36", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        {project.company_logo
          ? <Image src={project.company_logo} style={{ height: 44, maxWidth: 140, objectFit: "contain" }} />
          : <Text style={{ fontSize: 16, fontWeight: "bold", color: "#fff" }}>{project.name}</Text>
        }
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: "bold" }}>{project.name}</Text>
          <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{project.address || project.location}</Text>
        </View>
      </View>

      {/* Zlatá linka */}
      <View style={{ height: 2, backgroundColor: colorAccent, marginHorizontal: 36, marginBottom: 20 }} />

      {/* Fotka jako hero */}
      {photosPosition === "top" && unitImages.length > 0 && (
        <View style={{ marginHorizontal: 36, marginBottom: 20, height: 160, borderRadius: 8, overflow: "hidden" }}>
          <Image src={unitImages[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {unitImages.length > 1 && (
            <View style={{ position: "absolute", bottom: 0, right: 0, flexDirection: "row", gap: 4, padding: 6 }}>
              {unitImages.slice(1, 4).map((url, i) => <Image key={i} src={url} style={{ width: 50, height: 36, objectFit: "cover", borderRadius: 3 }} />)}
            </View>
          )}
        </View>
      )}

      <View style={{ padding: "0 36 24 36" }}>
        {/* Titulek */}
        <Text style={{ fontSize: 10, color: colorAccent, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Nabídka bytové jednotky</Text>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 4 }}>Byt č. {unit.unit_number} · {unit.disp}</Text>
        <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>{unit.area} m² · {unit.floor}. patro{unit.building ? ` · Budova ${unit.building}` : ""}</Text>

        {/* Cena na tmavém pozadí */}
        {unit.price_net && (
          <View style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 8, marginBottom: 20, borderLeft: `3px solid ${colorAccent}`, flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 8, color: colorAccent, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>Cena bez DPH</Text>
              <Text style={{ fontSize: priceSize === "large" ? 26 : 18, fontWeight: "bold", color: "#fff" }}>{unit.price_net.toLocaleString("cs-CZ")} Kč</Text>
              {priceVat && <Text style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>S DPH: {priceVat.toLocaleString("cs-CZ")} Kč</Text>}
            </View>
            {unit.price_per_sqm && (
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 8, color: colorAccent, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>Cena za m²</Text>
                <Text style={{ fontSize: priceSize === "large" ? 18 : 14, fontWeight: "bold", color: colorAccent }}>{unit.price_per_sqm.toLocaleString("cs-CZ")} Kč/m²</Text>
              </View>
            )}
          </View>
        )}

        {/* Parametry na tmavém */}
        <View style={{ flexDirection: "row", gap: 16, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: colorAccent, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Parametry</Text>
            <Row label="Dispozice" value={unit.disp} dark />
            <Row label="Plocha" value={unit.area ? unit.area + " m²" : null} dark />
            <Row label="Patro" value={unit.floor ? unit.floor + ". patro" : null} dark />
            <Row label="Orientace" value={unit.orientation} dark />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, color: colorAccent, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Vybavení</Text>
            <Row label="Balkon/terasa" value={unit.balcony ? (unit.balcony_type || "Ano") : "Ne"} dark />
            <Row label="Plocha balkonu" value={unit.balcony_area ? unit.balcony_area + " m²" : null} dark />
            <Row label="Sklep" value={unit.cellar ? "Ano" : "Ne"} dark />
            <Row label="Parkoviště" value={unit.parking ? "Ano" : "Ne"} dark />
          </View>
        </View>

        {photosPosition === "bottom" && unitImages.length > 0 && (
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
            {unitImages.slice(0, 3).map((url, i) => <Image key={i} src={url} style={{ flex: 1, height: 100, objectFit: "cover", borderRadius: 4 }} />)}
          </View>
        )}

        {/* Makléř */}
        {agentPosition !== "none" && unit.agent_name && (
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", padding: 14, borderRadius: 8, gap: 14, borderTop: `1px solid ${colorAccent}` }}>
            {unit.agent_photo && <Image src={unit.agent_photo} style={{ width: agentPhotoSize, height: agentPhotoSize, borderRadius, objectFit: "cover" }} />}
            <View>
              <Text style={{ fontSize: 13, fontWeight: "bold", color: "#fff", marginBottom: 2 }}>{unit.agent_name}</Text>
              <Text style={{ fontSize: 8, color: colorAccent, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Realitní makléř</Text>
              {unit.agent_phone && <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>Tel: {unit.agent_phone}</Text>}
              {unit.agent_email && <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>Email: {unit.agent_email}</Text>}
              {unit.agent_web && <Text style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>Web: {unit.agent_web}</Text>}
            </View>
          </View>
        )}
      </View>

      <Text style={{ position: "absolute", bottom: 16, left: 36, right: 36, textAlign: "center", fontSize: 7, color: "rgba(255,255,255,0.2)" }}>
        Tento dokument je informativní a nezávazný. Ceny jsou uvedeny v Kč.
      </Text>
    </Page>
  );
};

// ŠABLONA 3: BAREVNÁ — moderní, živá
const ColorTemplate = ({ project, unit, options }) => {
  const { colorHeader = "#1A3A6B", colorAccent = "#1D9E75", colorPrice = "#1A3A6B", photosPosition, agentPosition, agentPhotoSize, borderRadius, priceSize } = options;
  const priceVat = unit.price_net ? Math.round(unit.price_net * 1.12) : null;
  const unitImages = Array.isArray(unit.images) ? unit.images : [];

  return (
    <Page size="A4" style={{ padding: 0, fontFamily: "Roboto", backgroundColor: "#fff" }}>
      {/* Barevná hlavička */}
      <View style={{ backgroundColor: colorHeader, padding: "24 36", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        {project.company_logo
          ? <Image src={project.company_logo} style={{ height: 44, maxWidth: 140, objectFit: "contain" }} />
          : <Text style={{ fontSize: 16, fontWeight: "bold", color: "#fff" }}>{project.name}</Text>
        }
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: "#fff" }}>Byt č. {unit.unit_number}</Text>
          <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{unit.disp} · {unit.area} m²</Text>
        </View>
      </View>

      {/* Cena hned pod hlavičkou */}
      {unit.price_net && (
        <View style={{ backgroundColor: colorAccent, padding: "14 36", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.7)", marginBottom: 2, textTransform: "uppercase", letterSpacing: 1 }}>Cena bez DPH</Text>
            <Text style={{ fontSize: priceSize === "large" ? 22 : 16, fontWeight: "bold", color: "#fff" }}>{unit.price_net.toLocaleString("cs-CZ")} Kč</Text>
          </View>
          {priceVat && (
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>S DPH (12%)</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: "#fff" }}>{priceVat.toLocaleString("cs-CZ")} Kč</Text>
            </View>
          )}
          {unit.price_per_sqm && (
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>Cena za m²</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: "#fff" }}>{unit.price_per_sqm.toLocaleString("cs-CZ")} Kč/m²</Text>
            </View>
          )}
        </View>
      )}

      <View style={{ padding: "20 36" }}>
        {/* Fotky */}
        {photosPosition === "top" && unitImages.length > 0 && (
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 16 }}>
            {unitImages.slice(0, 3).map((url, i) => <Image key={i} src={url} style={{ flex: 1, height: 130, objectFit: "cover", borderRadius: 8 }} />)}
          </View>
        )}

        {/* Adresa projektu */}
        <Text style={{ fontSize: 11, color: "#666", marginBottom: 16 }}>📍 {project.address || project.location} · {unit.floor}. patro{unit.building ? ` · Budova ${unit.building}` : ""}</Text>

        {/* Parametry v boxech */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {[
            ["Dispozice", unit.disp],
            ["Plocha", unit.area ? unit.area + " m²" : "—"],
            ["Patro", unit.floor ? unit.floor + ". p." : "—"],
            ["Orientace", unit.orientation || "—"],
          ].map(([l, v]) => (
            <View key={l} style={{ flex: 1, backgroundColor: "#f4f7fc", borderRadius: 8, padding: "10 8", alignItems: "center", borderTop: `3px solid ${colorAccent}` }}>
              <Text style={{ fontSize: 8, color: "#888", marginBottom: 3, textTransform: "uppercase" }}>{l}</Text>
              <Text style={{ fontSize: 12, fontWeight: "bold", color: colorPrice }}>{v}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: "bold", color: colorHeader, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Vybavení</Text>
            <Row label="Balkon/lodžie/terasa" value={unit.balcony ? (unit.balcony_type || "Ano") : "Ne"} />
            <Row label="Plocha balkonu" value={unit.balcony_area ? unit.balcony_area + " m²" : null} />
            <Row label="Sklep" value={unit.cellar ? "Ano" : "Ne"} />
            <Row label="Parkovací místo" value={unit.parking ? "Ano" : "Ne"} />
          </View>
          <View style={{ flex: 1 }}>
            {agentPosition === "right" && unit.agent_name && (
              <View style={{ backgroundColor: "#f4f7fc", padding: 12, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 10 }}>
                {unit.agent_photo && <Image src={unit.agent_photo} style={{ width: agentPhotoSize * 0.7, height: agentPhotoSize * 0.7, borderRadius, objectFit: "cover" }} />}
                <View>
                  <Text style={{ fontSize: 11, fontWeight: "bold", color: colorPrice }}>{unit.agent_name}</Text>
                  {unit.agent_phone && <Text style={{ fontSize: 9, color: "#666", marginTop: 2 }}>Tel: {unit.agent_phone}</Text>}
                  {unit.agent_email && <Text style={{ fontSize: 9, color: "#666" }}>Email: {unit.agent_email}</Text>}
                </View>
              </View>
            )}
          </View>
        </View>

        {photosPosition === "bottom" && unitImages.length > 0 && (
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 16 }}>
            {unitImages.slice(0, 3).map((url, i) => <Image key={i} src={url} style={{ flex: 1, height: 100, objectFit: "cover", borderRadius: 6 }} />)}
          </View>
        )}

        {agentPosition === "bottom" && unit.agent_name && (
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f4f7fc", padding: 14, borderRadius: 8, gap: 14, borderLeft: `4px solid ${colorAccent}` }}>
            {unit.agent_photo && <Image src={unit.agent_photo} style={{ width: agentPhotoSize, height: agentPhotoSize, borderRadius, objectFit: "cover" }} />}
            <View>
              <Text style={{ fontSize: 13, fontWeight: "bold", color: colorPrice, marginBottom: 2 }}>{unit.agent_name}</Text>
              <Text style={{ fontSize: 9, color: "#888", marginBottom: 4 }}>Realitní makléř</Text>
              {unit.agent_phone && <Text style={{ fontSize: 10, color: "#333" }}>Tel: {unit.agent_phone}</Text>}
              {unit.agent_email && <Text style={{ fontSize: 10, color: "#333" }}>Email: {unit.agent_email}</Text>}
              {unit.agent_web && <Text style={{ fontSize: 10, color: "#333" }}>Web: {unit.agent_web}</Text>}
            </View>
          </View>
        )}
      </View>

      <Text style={{ position: "absolute", bottom: 16, left: 36, right: 36, textAlign: "center", fontSize: 7, color: "#ccc" }}>
        Tento dokument je informativní a nezávazný. Ceny jsou uvedeny v Kč.
      </Text>
    </Page>
  );
};

export const previewUnitPDF = async (project, unit, options = {}) => {
  const {
    agentPhotoSize = 100,
    agentPhotoShape = "circle",
    template = "minimal",
    colorHeader = "#1A3A6B",
    colorPrice = "#04342C",
    colorAccent = "#1D9E75",
    photosPosition = "top",
    agentPosition = "bottom",
    priceSize = "large",
  } = options;

  const borderRadius = agentPhotoShape === "circle" ? agentPhotoSize / 2 : agentPhotoShape === "rounded" ? 10 : 0;
  const opts = { colorHeader, colorPrice, colorAccent, photosPosition, agentPosition, agentPhotoSize, borderRadius, priceSize };

  const doc = (
    <Document>
      {template === "minimal" && <MinimalTemplate project={project} unit={unit} options={opts} />}
      {template === "premium" && <PremiumTemplate project={project} unit={unit} options={opts} />}
      {template === "color" && <ColorTemplate project={project} unit={unit} options={opts} />}
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  return URL.createObjectURL(blob);
};

export const generateUnitPDF = async (project, unit, options = {}) => {
  const url = await previewUnitPDF(project, unit, options);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nabidka-byt-${unit.unit_number}-${project.name}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};