import { useState } from "react";

const PROJECTS = [
  {
    id: 1, name: "Rezidence Mánes", location: "Praha 2, Vinohrady",
    address: "Mánesova 12, Praha 2", type: "Rekonstrukce",
    completion: "Q2 2026", color: "#1D9E75", bg: "#E1F5EE",
    priceFrom: 6200000, totalUnits: 24, soldUnits: 21,
    description: "Historická cihlová zástavba ve srdci Vinohrad. Kompletně zrekonstruované byty s původními dřevěnými podlahami a štukovými stropy.",
    floors: 5,
    units: [
      { id: 101, floor: 1, disp: "1+kk", area: 38, price: 4200000, status: "sold", balcony: false, parking: false, cellar: true },
      { id: 102, floor: 1, disp: "2+kk", area: 55, price: 5900000, status: "sold", balcony: true, parking: false, cellar: true },
      { id: 103, floor: 1, disp: "3+kk", area: 74, price: 7100000, status: "reserved", balcony: true, parking: true, cellar: true },
      { id: 104, floor: 1, disp: "2+kk", area: 58, price: 6200000, status: "sold", balcony: false, parking: false, cellar: true },
      { id: 201, floor: 2, disp: "1+kk", area: 38, price: 4400000, status: "sold", balcony: false, parking: false, cellar: true },
      { id: 202, floor: 2, disp: "2+kk", area: 55, price: 6100000, status: "available", balcony: true, parking: true, cellar: true },
      { id: 203, floor: 2, disp: "3+kk", area: 74, price: 7300000, status: "available", balcony: true, parking: true, cellar: true },
      { id: 204, floor: 2, disp: "2+kk", area: 58, price: 6400000, status: "sold", balcony: false, parking: false, cellar: true },
      { id: 301, floor: 3, disp: "1+kk", area: 38, price: 4600000, status: "sold", balcony: false, parking: false, cellar: true },
      { id: 302, floor: 3, disp: "2+kk", area: 55, price: 6300000, status: "reserved", balcony: true, parking: false, cellar: true },
      { id: 303, floor: 3, disp: "3+kk", area: 74, price: 7500000, status: "available", balcony: true, parking: true, cellar: true },
      { id: 304, floor: 3, disp: "2+kk", area: 58, price: 6600000, status: "sold", balcony: true, parking: false, cellar: true },
      { id: 401, floor: 4, disp: "2+kk", area: 60, price: 6800000, status: "available", balcony: true, parking: true, cellar: true },
      { id: 402, floor: 4, disp: "3+kk", area: 78, price: 7800000, status: "sold", balcony: true, parking: true, cellar: true },
      { id: 403, floor: 4, disp: "3+kk", area: 82, price: 8100000, status: "sold", balcony: true, parking: true, cellar: true },
      { id: 501, floor: 5, disp: "4+kk", area: 110, price: 11500000, status: "sold", balcony: true, parking: true, cellar: true },
      { id: 502, floor: 5, disp: "4+kk", area: 120, price: 12900000, status: "reserved", balcony: true, parking: true, cellar: true },
    ]
  },
  {
    id: 2, name: "Parkside Dejvice", location: "Praha 6, Dejvice",
    address: "Thákurova 8, Praha 6", type: "Novostavba",
    completion: "Q4 2026", color: "#378ADD", bg: "#E6F1FB",
    priceFrom: 8500000, totalUnits: 48, soldUnits: 7,
    description: "Moderní novostavba v klidné části Dejvic. Energeticky pasivní budova s inteligentní domácností a podzemním parkováním.",
    floors: 7,
    units: [
      { id: 101, floor: 1, disp: "2+kk", area: 62, price: 8500000, status: "available", balcony: true, parking: true, cellar: true },
      { id: 102, floor: 1, disp: "3+kk", area: 80, price: 10200000, status: "available", balcony: true, parking: true, cellar: true },
      { id: 103, floor: 1, disp: "2+kk", area: 65, price: 8800000, status: "sold", balcony: false, parking: true, cellar: true },
      { id: 201, floor: 2, disp: "2+kk", area: 62, price: 8900000, status: "available", balcony: true, parking: true, cellar: true },
      { id: 202, floor: 2, disp: "3+kk", area: 80, price: 10700000, status: "reserved", balcony: true, parking: true, cellar: true },
      { id: 203, floor: 2, disp: "4+kk", area: 105, price: 14500000, status: "available", balcony: true, parking: true, cellar: true },
      { id: 301, floor: 3, disp: "2+kk", area: 62, price: 9200000, status: "available", balcony: true, parking: true, cellar: true },
      { id: 302, floor: 3, disp: "3+kk", area: 80, price: 11100000, status: "available", balcony: true, parking: true, cellar: true },
    ]
  },
  {
    id: 3, name: "Žižkov Lofts", location: "Praha 3, Žižkov",
    address: "Seifertova 22, Praha 3", type: "Rekonstrukce",
    completion: "Q1 2026", color: "#D85A30", bg: "#FAECE7",
    priceFrom: 5900000, totalUnits: 18, soldUnits: 11,
    description: "Industriální lofty v bývalé tiskárně. Vysoké stropy, ocelové prvky a velká okna v kreativní čtvrti Žižkova.",
    floors: 4,
    units: [
      { id: 101, floor: 1, disp: "Loft 1+kk", area: 52, price: 5900000, status: "available", balcony: false, parking: false, cellar: false },
      { id: 102, floor: 1, disp: "Loft 2+kk", area: 75, price: 7200000, status: "sold", balcony: false, parking: false, cellar: false },
      { id: 103, floor: 1, disp: "Loft 2+kk", area: 80, price: 7600000, status: "reserved", balcony: false, parking: true, cellar: false },
      { id: 201, floor: 2, disp: "Loft 2+kk", area: 78, price: 7500000, status: "available", balcony: true, parking: true, cellar: false },
      { id: 202, floor: 2, disp: "Loft 3+kk", area: 105, price: 9800000, status: "sold", balcony: true, parking: true, cellar: false },
      { id: 301, floor: 3, disp: "Loft 3+kk", area: 110, price: 10500000, status: "available", balcony: true, parking: true, cellar: false },
      { id: 302, floor: 3, disp: "Loft 1+kk", area: 55, price: 6300000, status: "sold", balcony: false, parking: false, cellar: false },
    ]
  },
  {
    id: 4, name: "Kolín Garden", location: "Kolín, centrum",
    address: "Karlovo náměstí 5, Kolín", type: "Novostavba",
    completion: "Q3 2025", color: "#639922", bg: "#EAF3DE",
    priceFrom: 3800000, totalUnits: 30, soldUnits: 18,
    description: "Rodinné byty s vlastními zahradami nebo terasami. Klidná lokalita u centra Kolína s výbornou dostupností do Prahy.",
    floors: 3,
    units: [
      { id: 101, floor: 1, disp: "2+kk", area: 58, price: 3800000, status: "available", balcony: false, parking: true, cellar: true },
      { id: 102, floor: 1, disp: "3+kk", area: 75, price: 4700000, status: "sold", balcony: true, parking: true, cellar: true },
      { id: 103, floor: 1, disp: "3+kk", area: 78, price: 4900000, status: "available", balcony: true, parking: true, cellar: true },
      { id: 104, floor: 1, disp: "2+kk", area: 60, price: 4000000, status: "reserved", balcony: false, parking: false, cellar: true },
      { id: 201, floor: 2, disp: "2+kk", area: 58, price: 3900000, status: "sold", balcony: true, parking: true, cellar: true },
      { id: 202, floor: 2, disp: "3+kk", area: 75, price: 4800000, status: "available", balcony: true, parking: true, cellar: true },
      { id: 301, floor: 3, disp: "3+kk", area: 80, price: 5200000, status: "sold", balcony: true, parking: true, cellar: true },
      { id: 302, floor: 3, disp: "4+kk", area: 100, price: 6400000, status: "available", balcony: true, parking: true, cellar: true },
    ]
  },
  {
    id: 5, name: "Parkside Dejvice II", location: "Praha 6, Bubeneč",
    address: "Dejvická 15, Praha 6", type: "Novostavba",
    completion: "Q2 2027", color: "#7F77DD", bg: "#EEEDFE",
    priceFrom: 9200000, totalUnits: 36, soldUnits: 0,
    description: "Připravovaný projekt prémiových bytů s výhledem na Stromovku. Předregistrace nyní otevřena.",
    floors: 6,
    units: []
  },
  {
    id: 6, name: "EkoVilla Průhonice", location: "Průhonice",
    address: "U Parku 3, Průhonice", type: "Novostavba",
    completion: "Q1 2027", color: "#BA7517", bg: "#FAEEDA",
    priceFrom: 7400000, totalUnits: 22, soldUnits: 0,
    description: "Ekologická výstavba s solárními panely, tepelnými čerpadly a zelenou střechou. Blízko průhonického parku.",
    floors: 3,
    units: [
      { id: 101, floor: 1, disp: "3+kk", area: 82, price: 7400000, status: "available", balcony: true, parking: true, cellar: true },
      { id: 102, floor: 1, disp: "4+kk", area: 105, price: 9100000, status: "available", balcony: true, parking: true, cellar: true },
      { id: 201, floor: 2, disp: "3+kk", area: 85, price: 7700000, status: "available", balcony: true, parking: true, cellar: true },
      { id: 202, floor: 2, disp: "4+kk", area: 108, price: 9400000, status: "available", balcony: true, parking: true, cellar: true },
      { id: 301, floor: 3, disp: "4+kk", area: 115, price: 10200000, status: "available", balcony: true, parking: true, cellar: true },
    ]
  }
];

const fmt = (n) => n.toLocaleString("cs-CZ") + " Kč";

const STATUS_LABELS = { available: "Volný", reserved: "Rezervováno", sold: "Prodáno" };
const STATUS_COLORS = {
  available: { bg: "#E1F5EE", color: "#0F6E56", border: "#9FE1CB" },
  reserved: { bg: "#FAEEDA", color: "#633806", border: "#FAC775" },
  sold: { bg: "#F1EFE8", color: "#5F5E5A", border: "#D3D1C7" },
};

const DISPOZICE = ["Vše", "1+kk", "2+kk", "3+kk", "4+kk"];
const TYPY = ["Vše", "Novostavba", "Rekonstrukce"];

function ProjectCard({ project, onClick }) {
  const avail = project.totalUnits - project.soldUnits;
  const pct = Math.round((project.soldUnits / project.totalUnits) * 100);
  const isSoon = project.units.length === 0;
  return (
    <div onClick={() => !isSoon && onClick(project)} style={{
      background: "#fff", border: "0.5px solid #e0e0e0",
      borderRadius: 14, overflow: "hidden",
      cursor: isSoon ? "default" : "pointer",
      transition: "border-color 0.15s, transform 0.15s",
      opacity: isSoon ? 0.8 : 1,
    }}
      onMouseEnter={e => { if (!isSoon) { e.currentTarget.style.borderColor = project.color; e.currentTarget.style.transform = "translateY(-2px)"; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.transform = ""; }}
    >
      <div style={{ height: 120, background: project.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <span style={{ fontSize: 44, filter: "saturate(0.7)" }}>🏢</span>
        <div style={{
          position: "absolute", top: 10, left: 10, fontSize: 11,
          padding: "3px 10px", borderRadius: 20, fontWeight: 500,
          background: isSoon ? "#FAEEDA" : avail <= 3 && avail > 0 ? "#FCEBEB" : avail === 0 ? "#F1EFE8" : project.bg,
          color: isSoon ? "#633806" : avail <= 3 && avail > 0 ? "#A32D2D" : avail === 0 ? "#5F5E5A" : project.color,
        }}>
          {isSoon ? "Připravujeme" : avail === 0 ? "Vyprodáno" : avail <= 3 ? "Poslední byty" : project.type}
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>{project.name}</div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>📍 {project.location}</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>od {fmt(project.priceFrom)}</div>
          <div style={{ fontSize: 11, color: "#999" }}>{avail} / {project.totalUnits} volných</div>
        </div>
        <div style={{ marginTop: 8, height: 4, background: "#f0f0f0", borderRadius: 2 }}>
          <div style={{ height: 4, width: `${pct}%`, background: pct === 100 ? "#D3D1C7" : project.color, borderRadius: 2, transition: "width 0.4s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <div style={{ fontSize: 10, color: "#bbb" }}>Prodáno {pct}%</div>
          <div style={{ fontSize: 10, color: "#bbb" }}>Dokončení {project.completion}</div>
        </div>
      </div>
    </div>
  );
}

function UnitCell({ unit, selected, onClick }) {
  const sc = STATUS_COLORS[unit.status];
  const isClickable = unit.status !== "sold";
  return (
    <div onClick={() => isClickable && onClick(unit)} style={{
      border: selected ? `2px solid #1D9E75` : `0.5px solid ${sc.border}`,
      borderRadius: 10, padding: "10px 8px", textAlign: "center",
      cursor: isClickable ? "pointer" : "default",
      background: selected ? "#E1F5EE" : sc.bg,
      transition: "all 0.12s",
      opacity: unit.status === "sold" ? 0.55 : 1,
    }}
      onMouseEnter={e => { if (isClickable && !selected) e.currentTarget.style.borderColor = "#1D9E75"; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = sc.border; }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{unit.id}</div>
      <div style={{ fontSize: 11, color: "#666", marginTop: 1 }}>{unit.disp}</div>
      <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>{unit.area} m²</div>
      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500,
        color: unit.status === "available" ? "#0F6E56" : unit.status === "reserved" ? "#854F0B" : "#888"
      }}>
        {unit.status === "available" ? fmt(unit.price) : STATUS_LABELS[unit.status]}
      </div>
    </div>
  );
}

function ProjectDetail({ project, onBack, onReserve }) {
  const [floor, setFloor] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const floors = [...new Set(project.units.map(u => u.floor))].sort();
  const floorUnits = project.units.filter(u => u.floor === floor);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ background: "#04342C", padding: "16px 20px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9FE1CB", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 8, padding: 0 }}>
          ← Zpět na projekty
        </button>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{project.name}</div>
        <div style={{ fontSize: 13, color: "#9FE1CB", marginTop: 3 }}>
          📍 {project.address} &nbsp;·&nbsp; 🏗 {project.type} &nbsp;·&nbsp; 📅 Dokončení {project.completion}
        </div>
        <div style={{ fontSize: 13, color: "#9FE1CB", marginTop: 6, lineHeight: 1.5, maxWidth: 600 }}>{project.description}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", flex: 1, overflow: "auto", background: "#f7f7f5" }}>
        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#999", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Vyberte patro a byt</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {floors.map(f => (
              <button key={f} onClick={() => { setFloor(f); setSelectedUnit(null); }} style={{
                border: floor === f ? "none" : "0.5px solid #ddd",
                borderRadius: 8, padding: "5px 14px", fontSize: 13, cursor: "pointer",
                background: floor === f ? "#1D9E75" : "#fff",
                color: floor === f ? "#fff" : "#555", fontWeight: floor === f ? 600 : 400,
              }}>
                {f}. patro
              </button>
            ))}
          </div>
          {floorUnits.length === 0 ? (
            <div style={{ color: "#aaa", fontSize: 14, padding: "20px 0" }}>Na tomto patře nejsou žádné byty.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
              {floorUnits.map(u => (
                <UnitCell key={u.id} unit={u} selected={selectedUnit?.id === u.id} onClick={setSelectedUnit} />
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 14, marginTop: 16 }}>
            {["available", "reserved", "sold"].map(s => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#888" }}>
                <div style={{ width: 11, height: 11, borderRadius: 3, background: STATUS_COLORS[s].bg, border: `0.5px solid ${STATUS_COLORS[s].border}` }} />
                {STATUS_LABELS[s]}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", borderLeft: "0.5px solid #e8e8e8", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {selectedUnit ? (
            <>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#999", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Vybraný byt</div>
                <div style={{ background: "#f7f7f5", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>Byt č. {selectedUnit.id} · {selectedUnit.disp}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1D9E75", marginTop: 4 }}>{fmt(selectedUnit.price)}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 12 }}>
                    {[
                      ["Plocha", `${selectedUnit.area} m²`],
                      ["Patro", `${selectedUnit.floor}. patro`],
                      ["Balkon", selectedUnit.balcony ? "Ano" : "Ne"],
                      ["Parkoviště", selectedUnit.parking ? "V ceně" : "Ne"],
                      ["Sklep", selectedUnit.cellar ? "Ano" : "Ne"],
                      ["Stav", STATUS_LABELS[selectedUnit.status]],
                    ].map(([l, v]) => (
                      <div key={l} style={{ background: "#fff", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: "#aaa" }}>{l}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginTop: 1 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {selectedUnit.status === "available" && (
                <button onClick={() => onReserve(project, selectedUnit)} style={{
                  background: "#1D9E75", color: "#fff", border: "none",
                  borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", width: "100%",
                }}>
                  📅 Rezervovat byt
                </button>
              )}
              {selectedUnit.status === "reserved" && (
                <div style={{ background: "#FAEEDA", borderRadius: 10, padding: 12, fontSize: 13, color: "#633806", textAlign: "center" }}>
                  Tento byt je již rezervován. Vyberte jiný.
                </div>
              )}
              <button style={{
                background: "#fff", color: "#1a1a1a", border: "0.5px solid #ddd",
                borderRadius: 10, padding: "10px", fontSize: 13, cursor: "pointer", width: "100%",
              }}>
                📄 Stáhnout půdorys PDF
              </button>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#bbb", textAlign: "center", gap: 8 }}>
              <div style={{ fontSize: 32 }}>👆</div>
              <div style={{ fontSize: 14 }}>Klikněte na volný byt<br />a zobrazí se detail</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReservationForm({ project, unit, onBack, onSuccess }) {
  const [form, setForm] = useState({ jmeno: "", prijmeni: "", email: "", telefon: "", financovani: "vlastni", poznamka: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.jmeno.trim()) e.jmeno = "Povinné pole";
    if (!form.prijmeni.trim()) e.prijmeni = "Povinné pole";
    if (!form.email.match(/^[^@]+@[^@]+\.[^@]+$/)) e.email = "Neplatný e-mail";
    if (!form.telefon.trim()) e.telefon = "Povinné pole";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitted(true);
  };

  const Field = ({ id, label, type = "text", placeholder }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>{label}</label>
      <input type={type} value={form[id]} placeholder={placeholder}
        onChange={e => { setForm(f => ({ ...f, [id]: e.target.value })); setErrors(er => ({ ...er, [id]: "" })); }}
        style={{
          padding: "9px 12px", borderRadius: 8, fontSize: 13,
          border: errors[id] ? "1px solid #E24B4A" : "0.5px solid #ddd",
          background: "#fafafa", outline: "none", color: "#1a1a1a",
        }}
      />
      {errors[id] && <span style={{ fontSize: 11, color: "#E24B4A" }}>{errors[id]}</span>}
    </div>
  );

  if (submitted) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16, padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 56 }}>✅</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>Rezervace odeslána!</div>
      <div style={{ fontSize: 14, color: "#666", maxWidth: 380, lineHeight: 1.6 }}>
        Byt č. <strong>{unit.id}</strong> v projektu <strong>{project.name}</strong> je pro vás rezervován na <strong>48 hodin</strong>.
        Náš obchodník vás kontaktuje na e-mail <strong>{form.email}</strong> do 2 hodin.
      </div>
      <button onClick={onSuccess} style={{
        marginTop: 8, background: "#1D9E75", color: "#fff", border: "none",
        borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer",
      }}>
        Zpět na přehled projektů
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#04342C", padding: "16px 20px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9FE1CB", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 8 }}>
          ← Zpět na výběr bytu
        </button>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Rezervace bytu</div>
        <div style={{ fontSize: 13, color: "#9FE1CB", marginTop: 2 }}>{project.name} · Byt č. {unit.id} · {unit.disp} · {unit.area} m²</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", background: "#f7f7f5" }}>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>Kontaktní údaje</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field id="jmeno" label="Jméno *" placeholder="Jan" />
            <Field id="prijmeni" label="Příjmení *" placeholder="Novák" />
            <Field id="email" label="E-mail *" type="email" placeholder="jan@email.cz" />
            <Field id="telefon" label="Telefon *" placeholder="+420 777 000 000" />
          </div>

          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 10 }}>Způsob financování</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[["vlastni", "Vlastní prostředky"], ["hypoteka", "Hypotéka"], ["kombinace", "Kombinace"]].map(([val, lbl]) => (
                <label key={val} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: form.financovani === val ? "#E1F5EE" : "#fff",
                  border: form.financovani === val ? "1.5px solid #1D9E75" : "0.5px solid #ddd",
                  borderRadius: 10, padding: "11px 14px", cursor: "pointer", transition: "all 0.12s",
                }}>
                  <input type="radio" name="fin" checked={form.financovani === val}
                    onChange={() => setForm(f => ({ ...f, financovani: val }))}
                    style={{ accentColor: "#1D9E75" }} />
                  <span style={{ fontSize: 13, color: "#1a1a1a" }}>{lbl}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Poznámka (volitelné)</label>
            <textarea value={form.poznamka} onChange={e => setForm(f => ({ ...f, poznamka: e.target.value }))}
              placeholder="Zájem o prohlídku, specifické požadavky..."
              style={{ padding: "9px 12px", borderRadius: 8, fontSize: 13, border: "0.5px solid #ddd", background: "#fafafa", resize: "none", height: 80, color: "#1a1a1a" }} />
          </div>
        </div>

        <div style={{ background: "#fff", borderLeft: "0.5px solid #e8e8e8", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>Shrnutí rezervace</div>
          <div style={{ background: "#f7f7f5", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{project.name}</div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>📍 {project.address}</div>
            <div style={{ borderTop: "0.5px solid #eee", margin: "10px 0" }} />
            {[["Byt č.", `${unit.id} · ${unit.disp}`], ["Plocha", `${unit.area} m²`], ["Patro", `${unit.floor}. patro`], ["Balkon", unit.balcony ? "Ano" : "Ne"], ["Parkoviště", unit.parking ? "V ceně" : "Ne"]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span style={{ color: "#888" }}>{l}</span>
                <span style={{ color: "#1a1a1a", fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <div style={{ borderTop: "0.5px solid #eee", margin: "10px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16 }}>
              <span style={{ color: "#888" }}>Cena</span>
              <span style={{ fontWeight: 700, color: "#1D9E75" }}>{fmt(unit.price)}</span>
            </div>
          </div>

          <div style={{ background: "#E1F5EE", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0F6E56", marginBottom: 4 }}>Co se stane dál?</div>
            <div style={{ fontSize: 12, color: "#0F6E56", lineHeight: 1.6 }}>
              Byt bude pro vás rezervován na <strong>48 hodin</strong>. Náš obchodník vás kontaktuje do 2 hodin.
            </div>
          </div>

          <div style={{ border: "0.5px solid #eee", borderRadius: 10, padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0F6E56", flexShrink: 0 }}>TK</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>Tomáš Kratochvíl</div>
              <div style={{ fontSize: 11, color: "#999" }}>Obchodní poradce · +420 777 123 456</div>
            </div>
          </div>

          <button onClick={submit} style={{
            background: "#1D9E75", color: "#fff", border: "none",
            borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 600,
            cursor: "pointer", width: "100%",
          }}>
            📅 Odeslat rezervaci
          </button>

          <div style={{ fontSize: 11, color: "#bbb", textAlign: "center", lineHeight: 1.5 }}>
            Odesláním souhlasíte se zpracováním osobních údajů dle GDPR. Rezervace není závazná kupní smlouva.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("list");
  const [selectedProject, setSelectedProject] = useState(null);
  const [reservationUnit, setReservationUnit] = useState(null);
  const [filterDisp, setFilterDisp] = useState("Vše");
  const [filterTyp, setFilterTyp] = useState("Vše");
  const [filterCena, setFilterCena] = useState("Vše");

  const CENY = ["Vše", "do 5 mil.", "5–8 mil.", "8–12 mil.", "12+ mil."];
  const cenaFilter = (p) => {
    if (filterCena === "Vše") return true;
    if (filterCena === "do 5 mil.") return p.priceFrom < 5000000;
    if (filterCena === "5–8 mil.") return p.priceFrom >= 5000000 && p.priceFrom < 8000000;
    if (filterCena === "8–12 mil.") return p.priceFrom >= 8000000 && p.priceFrom < 12000000;
    if (filterCena === "12+ mil.") return p.priceFrom >= 12000000;
    return true;
  };
  const dispFilter = (p) => {
    if (filterDisp === "Vše") return true;
    return p.units.some(u => u.disp.includes(filterDisp) && u.status === "available");
  };
  const typFilter = (p) => filterTyp === "Vše" || p.type === filterTyp;
  const filtered = PROJECTS.filter(p => cenaFilter(p) && dispFilter(p) && typFilter(p));

  const totalAvail = PROJECTS.reduce((s, p) => s + p.totalUnits - p.soldUnits, 0);

  const Pill = ({ val, options, onChange, label }) => (
    <div style={{ position: "relative" }}>
      <select value={val} onChange={e => onChange(e.target.value)} style={{
        appearance: "none", background: "rgba(255,255,255,0.12)", border: "0.5px solid rgba(255,255,255,0.25)",
        borderRadius: 20, padding: "6px 28px 6px 14px", fontSize: 12, color: "#fff", cursor: "pointer",
      }}>
        {options.map(o => <option key={o} value={o} style={{ background: "#04342C" }}>{o === "Vše" ? label : o}</option>)}
      </select>
      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#9FE1CB", fontSize: 10, pointerEvents: "none" }}>▼</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f5", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "0.5px solid #e8e8e8", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => { setView("list"); setSelectedProject(null); }}>
          <div style={{ width: 30, height: 30, background: "#1D9E75", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏗</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>DeveloperX</span>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#666", alignItems: "center" }}>
          <span style={{ cursor: "pointer" }}>O nás</span>
          <span style={{ cursor: "pointer" }}>Reference</span>
          <span style={{ cursor: "pointer" }}>Kontakt</span>
          <button style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            📞 Zavolat nám
          </button>
        </div>
      </div>

      {view === "list" && (
        <>
          <div style={{ background: "#04342C", padding: "40px 24px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#5DCAA5", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Developerské projekty</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 8 }}>
              Vyberte svůj nový domov
            </div>
            <div style={{ fontSize: 14, color: "#9FE1CB", marginBottom: 24 }}>
              {PROJECTS.length} projektů · {totalAvail} volných bytů · novostavby i rekonstrukce
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <Pill val={filterDisp} options={DISPOZICE} onChange={setFilterDisp} label="Dispozice" />
              <Pill val={filterTyp} options={TYPY} onChange={setFilterTyp} label="Typ stavby" />
              <Pill val={filterCena} options={CENY} onChange={setFilterCena} label="Cena" />
            </div>
          </div>

          <div style={{ padding: "20px 24px" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", color: "#aaa", padding: "40px 0", fontSize: 15 }}>
                Žádné projekty nevyhovují filtru. Zkuste upravit kritéria.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {filtered.map(p => (
                  <ProjectCard key={p.id} project={p} onClick={proj => { setSelectedProject(proj); setView("detail"); }} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {view === "detail" && selectedProject && (
        <ProjectDetail
          project={selectedProject}
          onBack={() => { setView("list"); setSelectedProject(null); }}
          onReserve={(proj, unit) => { setReservationUnit(unit); setView("reservation"); }}
        />
      )}

      {view === "reservation" && selectedProject && reservationUnit && (
        <ReservationForm
          project={selectedProject}
          unit={reservationUnit}
          onBack={() => setView("detail")}
          onSuccess={() => { setView("list"); setSelectedProject(null); setReservationUnit(null); }}
        />
      )}
    </div>
  );
}
