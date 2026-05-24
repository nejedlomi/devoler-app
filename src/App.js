import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Admin from "./Admin";

const fmt = (n) => n?.toLocaleString("cs-CZ") + " Kč";

const STATUS_LABELS = { available: "Volný", reserved: "Rezervováno", sold: "Prodáno" };
const STATUS_COLORS = {
  available: { bg: "#E8F5F0", color: "#0A5C42", border: "#7BC4A8" },
  reserved: { bg: "#FEF3E2", color: "#7A4A0A", border: "#F5C275" },
  sold: { bg: "#F0F0F0", color: "#555", border: "#CCC" },
};

const getImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  try { return JSON.parse(images); } catch { return []; }
};

function ProjectCard({ project, onClick }) {
  const avail = project.total_units - project.sold_units;
  const pct = project.total_units > 0 ? Math.round((project.sold_units / project.total_units) * 100) : 0;
  const isSoon = project.total_units === 0;
  const imgs = getImages(project.images);

  return (
    <div onClick={() => !isSoon && onClick(project)} style={{
      background: "#fff",
      borderRadius: 16,
      overflow: "hidden",
      cursor: isSoon ? "default" : "pointer",
      boxShadow: "0 2px 12px rgba(10,30,60,0.08)",
      transition: "transform 0.18s, box-shadow 0.18s",
      border: "1px solid #E8EDF5",
    }}
      onMouseEnter={e => { if (!isSoon) { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(10,30,60,0.14)"; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(10,30,60,0.08)"; }}
    >
      <div style={{ height: 200, position: "relative", overflow: "hidden", background: "#1a2e4a" }}>
        {imgs[0] ? (
          <img src={imgs[0]} alt={project.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, background: "linear-gradient(135deg, #1a2e4a 0%, #2d4a6e 100%)" }}>🏗</div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,20,40,0.7) 0%, transparent 50%)" }} />
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <span style={{
            fontSize: 11, padding: "4px 10px", borderRadius: 20, fontWeight: 600,
            background: isSoon ? "rgba(250,200,80,0.9)" : avail === 0 ? "rgba(150,150,150,0.9)" : avail <= 3 ? "rgba(220,60,60,0.9)" : "rgba(255,255,255,0.15)",
            color: isSoon ? "#7A4A0A" : avail === 0 ? "#fff" : avail <= 3 ? "#fff" : "#fff",
            backdropFilter: "blur(4px)",
          }}>
            {isSoon ? "Připravujeme" : avail === 0 ? "Vyprodáno" : avail <= 3 ? "Poslední byty" : project.type}
          </span>
        </div>
        <div style={{ position: "absolute", bottom: 14, left: 14, right: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{project.name}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>📍 {project.location}</div>
        </div>
      </div>

      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div style={{ background: "#F4F7FC", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: "#8899AA", fontWeight: 500, marginBottom: 3 }}>Cena od</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0D2137" }}>{project.price_from ? (project.price_from / 1000000).toFixed(1) + " mil. Kč" : "—"}</div>
          </div>
          <div style={{ background: "#F4F7FC", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: "#8899AA", fontWeight: 500, marginBottom: 3 }}>Dokončení</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0D2137" }}>{project.completion || "—"}</div>
          </div>
          <div style={{ background: "#F4F7FC", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: "#8899AA", fontWeight: 500, marginBottom: 3 }}>Dostupné byty</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0D2137" }}>{avail} / {project.total_units}</div>
          </div>
          <div style={{ background: "#F4F7FC", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: "#8899AA", fontWeight: 500, marginBottom: 3 }}>Typ</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0D2137" }}>{project.type || "—"}</div>
          </div>
        </div>

        {project.units && project.units.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {["1+kk", "2+kk", "3+kk", "4+kk"].map(disp => {
              const total = project.units.filter(u => u.disp === disp).length;
              const avail = project.units.filter(u => u.disp === disp && u.status === "available").length;
              if (total === 0) return null;
              return (
                <div key={disp} style={{ background: "#F4F7FC", borderRadius: 8, padding: "5px 10px", fontSize: 11 }}>
                  <span style={{ fontWeight: 700, color: "#0D2137" }}>{disp}</span>
                  <span style={{ color: "#8899AA", marginLeft: 4 }}>{avail}/{total}</span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8899AA", marginBottom: 5 }}>
            <span>Prodáno {pct}%</span>
            <span>{project.sold_units} z {project.total_units} bytů</span>
          </div>
          <div style={{ height: 6, background: "#E8EDF5", borderRadius: 3 }}>
            <div style={{ height: 6, width: `${pct}%`, background: pct === 100 ? "#AAB5C0" : "#1A3A6B", borderRadius: 3, transition: "width 0.4s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function UnitCell({ unit, selected, onClick }) {
  const sc = STATUS_COLORS[unit.status] || STATUS_COLORS.available;
  const isClickable = unit.status !== "sold";
  return (
    <div onClick={() => isClickable && onClick(unit)} style={{
      border: selected ? `2px solid #1A3A6B` : `1px solid ${sc.border}`,
      borderRadius: 10, padding: "10px 8px", textAlign: "center",
      cursor: isClickable ? "pointer" : "default",
      background: selected ? "#E8EDF8" : sc.bg,
      opacity: unit.status === "sold" ? 0.5 : 1,
      transition: "all 0.12s",
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0D2137" }}>{unit.unit_number}</div>
      <div style={{ fontSize: 11, color: "#556677", marginTop: 1 }}>{unit.disp}</div>
      <div style={{ fontSize: 10, color: "#8899AA", marginTop: 2 }}>{unit.area} m²</div>
      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 600, color: unit.status === "available" ? "#0A5C42" : unit.status === "reserved" ? "#7A4A0A" : "#888" }}>
        {unit.status === "available" ? (unit.price_public === false ? "Cena na dotaz" : fmt(unit.price_net || unit.price)) : STATUS_LABELS[unit.status]}
      </div>
    </div>
  );
}

function ImageGallery({ images }) {
  const [current, setCurrent] = useState(0);
  if (!images || images.length === 0) return (
    <div style={{ height: 320, background: "linear-gradient(135deg, #1a2e4a 0%, #2d4a6e 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>🏗</div>
  );
  return (
    <div style={{ position: "relative", height: 320 }}>
      <img src={images[current]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,20,40,0.5) 0%, transparent 40%)" }} />
      {images.length > 1 && (
        <>
          <button onClick={() => setCurrent(c => (c - 1 + images.length) % images.length)} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", fontSize: 18, cursor: "pointer", backdropFilter: "blur(4px)" }}>‹</button>
          <button onClick={() => setCurrent(c => (c + 1) % images.length)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", fontSize: 18, cursor: "pointer", backdropFilter: "blur(4px)" }}>›</button>
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
            {images.map((_, i) => (
              <div key={i} onClick={() => setCurrent(i)} style={{ width: i === current ? 20 : 6, height: 6, borderRadius: 3, background: i === current ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s" }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProjectDocuments({ projectId }) {
  const [projDocs, setProjDocs] = useState([]);

  useEffect(() => {
    supabase.from("documents").select("*").eq("project_id", projectId).eq("is_public", true).then(({ data }) => setProjDocs(data || []));
  }, [projectId]);

  if (projDocs.length === 0) return null;

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 20, boxShadow: "0 2px 8px rgba(10,30,60,0.06)", border: "1px solid #E8EDF5" }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#0D2137", marginBottom: 12 }}>📁 Dokumenty ke stažení</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {projDocs.map(d => {
          const isPdf = d.file_name?.toLowerCase().endsWith(".pdf");
          const isImage = ["jpg", "jpeg", "png", "webp"].some(ext => d.file_name?.toLowerCase().endsWith(ext));
          return (
            <a key={d.id} href={d.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#F4F7FC", borderRadius: 10, textDecoration: "none", color: "#0D2137", transition: "background 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#E8EDF5"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#F4F7FC"; }}
            >
              <span style={{ fontSize: 20 }}>{isImage ? "🖼" : isPdf ? "📄" : "📁"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</div>
                <div style={{ fontSize: 11, color: "#8899AA", marginTop: 2 }}>
                  {{"presentation": "Prezentace", "drawing": "Výkres", "permit": "Povolení", "contract": "Smlouva", "photo": "Foto", "visualization": "Vizualizace", "price_list": "Ceník", "technical": "Technická dokumentace", "other": "Dokument"}[d.type] || "Dokument"}
                </div>
              </div>
              <span style={{ fontSize: 12, color: "#1A3A6B", fontWeight: 500 }}>Stáhnout →</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function MortgageCalculator({ unit }) {
  const [showCalc, setShowCalc] = useState(false);
  const [deposit, setDeposit] = useState(20);
  const [years, setYears] = useState(30);
  const [rate, setRate] = useState(4.5);
  const price = unit.price_net || unit.price || 0;
  const loanAmount = price * (1 - deposit / 100);
  const monthlyRate = rate / 100 / 12;
  const payments = years * 12;
  const monthly = monthlyRate > 0 ? Math.round(loanAmount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -payments))) : 0;

  return (
    <div>
      <button onClick={() => setShowCalc(s => !s)} style={{ width: "100%", background: "#F4F7FC", color: "#1A3A6B", border: "1px solid #E8EDF5", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
        🏦 {showCalc ? "Skrýt" : "Kalkulačka hypotéky"}
      </button>
      {showCalc && (
        <div style={{ background: "#F4F7FC", borderRadius: 10, padding: 14, marginTop: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8899AA", marginBottom: 4 }}>
                <span>Vlastní záloha</span>
                <span style={{ fontWeight: 600, color: "#0D2137" }}>{deposit}% — {Math.round(price * deposit / 100).toLocaleString("cs-CZ")} Kč</span>
              </div>
              <input type="range" min="10" max="90" value={deposit} onChange={e => setDeposit(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "#1A3A6B" }} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8899AA", marginBottom: 4 }}>
                <span>Doba splácení</span>
                <span style={{ fontWeight: 600, color: "#0D2137" }}>{years} let</span>
              </div>
              <input type="range" min="5" max="30" value={years} onChange={e => setYears(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "#1A3A6B" }} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8899AA", marginBottom: 4 }}>
                <span>Úroková sazba</span>
                <span style={{ fontWeight: 600, color: "#0D2137" }}>{rate}%</span>
              </div>
              <input type="range" min="1" max="10" step="0.1" value={rate} onChange={e => setRate(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#1A3A6B" }} />
            </div>
            <div style={{ borderTop: "1px solid #E8EDF5", paddingTop: 10 }}>
              <div style={{ fontSize: 11, color: "#8899AA", marginBottom: 4 }}>Výše úvěru: {Math.round(loanAmount).toLocaleString("cs-CZ")} Kč</div>
              <div style={{ fontSize: 11, color: "#8899AA", marginBottom: 8 }}>Celkem zaplaceno: {Math.round(monthly * payments).toLocaleString("cs-CZ")} Kč</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#8899AA" }}>Měsíční splátka</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#1A3A6B" }}>{monthly.toLocaleString("cs-CZ")} Kč</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectDetail({ project, onBack, onReserve, setLightbox }) {
  const [units, setUnits] = useState([]);
  const [floor, setFloor] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterDisp, setFilterDisp] = useState("");
  const [filterFloor, setFilterFloor] = useState("");
  const [filterPrice, setFilterPrice] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterAreaMax, setFilterAreaMax] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const imgs = getImages(project.images);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("units").select("*").eq("project_id", project.id).order("floor");
      setUnits(data || []);
      if (data && data.length > 0) setFloor(data[0].floor);
      setLoading(false);
    };
    load();
  }, [project.id]);

  const floors = [...new Set(units.map(u => u.floor))].sort();
  const floorUnits = units.filter(u => {
    if (filterFloor && u.floor !== parseInt(filterFloor)) return false;
    if (filterDisp && u.disp !== filterDisp) return false;
    if (filterPrice && (u.price_net || u.price || 0) > parseInt(filterPrice)) return false;
    if (filterPriceMin && (u.price_net || u.price || 0) < parseInt(filterPriceMin)) return false;
    if (filterArea && u.area < parseInt(filterArea)) return false;
    if (filterAreaMax && u.area > parseInt(filterAreaMax)) return false;
    return true;
  });
  console.log("floorUnits:", floorUnits.length, "filterDisp:", filterDisp, "filterFloor:", filterFloor);
  const avail = project.total_units - project.sold_units;

  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FC" }}>
      <div style={{ position: "relative" }}>
        <ImageGallery images={imgs} />
        <button onClick={onBack} style={{ position: "absolute", top: 16, left: 16, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 20, padding: "8px 16px", color: "#fff", fontSize: 13, cursor: "pointer", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", gap: 6 }}>
          ← Zpět
        </button>
        <div style={{ position: "absolute", bottom: 20, left: 20 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>{project.name}</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 4 }}>📍 {project.address}</div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            ["Cena od", project.price_from ? (project.price_from / 1000000).toFixed(1) + " mil. Kč" : "—"],
            ["Volné byty", `${avail} / ${project.total_units}`],
            ["Dokončení", project.completion || "—"],
            ["Typ", project.type || "—"],
          ].map(([l, v]) => (
            <div key={l} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", boxShadow: "0 2px 8px rgba(10,30,60,0.06)", border: "1px solid #E8EDF5" }}>
              <div style={{ fontSize: 11, color: "#8899AA", fontWeight: 500, marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0D2137" }}>{v}</div>
            </div>
          ))}
        </div>

        {project.description && (
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 20, boxShadow: "0 2px 8px rgba(10,30,60,0.06)", border: "1px solid #E8EDF5" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0D2137", marginBottom: 8 }}>O projektu</div>
            <div style={{ fontSize: 14, color: "#445566", lineHeight: 1.7 }}>{project.description}</div>
          </div>
        )}

        <ProjectDocuments projectId={project.id} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 8px rgba(10,30,60,0.06)", border: "1px solid #E8EDF5" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0D2137", marginBottom: 14 }}>Výběr bytu</div>
            {loading ? <div style={{ color: "#aaa" }}>Načítám...</div> : (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <select value={filterDisp} onChange={e => { setFilterDisp(e.target.value); setSelectedUnit(null); }} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #D0D8E8", fontSize: 12, background: "#fff" }}>
                    <option value="">Všechny dispozice</option>
                    {[...new Set(units.map(u => u.disp).filter(Boolean))].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select value={filterFloor} onChange={e => { setFilterFloor(e.target.value); setSelectedUnit(null); }} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #D0D8E8", fontSize: 12, background: "#fff" }}>
                    <option value="">Všechna patra</option>
                    {floors.map(f => <option key={f} value={f}>{f}. patro</option>)}
                  </select>
                  <input type="number" placeholder="Cena od (Kč)" value={filterPriceMin} onChange={e => { setFilterPriceMin(e.target.value); setSelectedUnit(null); }}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #D0D8E8", fontSize: 12, width: 130 }} />
                  <input type="number" placeholder="Cena do (Kč)" value={filterPrice} onChange={e => { setFilterPrice(e.target.value); setSelectedUnit(null); }}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #D0D8E8", fontSize: 12, width: 130 }} />
                  <input type="number" placeholder="Plocha od (m²)" value={filterArea} onChange={e => { setFilterArea(e.target.value); setSelectedUnit(null); }}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #D0D8E8", fontSize: 12, width: 120 }} />
                  <input type="number" placeholder="Plocha do (m²)" value={filterAreaMax} onChange={e => { setFilterAreaMax(e.target.value); setSelectedUnit(null); }}
                    style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #D0D8E8", fontSize: 12, width: 120 }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
                  {floorUnits.map(u => <UnitCell key={u.id} unit={u} selected={selectedUnit?.id === u.id} onClick={setSelectedUnit} />)}
                </div>
                {floorUnits.length === 0 && <div style={{ color: "#aaa", fontSize: 14 }}>Žádné byty na tomto patře.</div>}
                <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
                  {["available", "reserved", "sold"].map(s => (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#8899AA" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLORS[s].bg, border: `1px solid ${STATUS_COLORS[s].border}` }} />
                      {STATUS_LABELS[s]}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 8px rgba(10,30,60,0.06)", border: "1px solid #E8EDF5", display: "flex", flexDirection: "column", gap: 12 }}>
            {selectedUnit ? (
              <>
                <div style={{ background: "#F4F7FC", borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0D2137" }}>Byt č. {selectedUnit.unit_number} · {selectedUnit.disp}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#1A3A6B", marginTop: 6 }}>{fmt(selectedUnit.price_net || selectedUnit.price)}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 12 }}>
                    {[
                      ["Plocha", `${selectedUnit.area} m²`],
                      ["Patro", `${selectedUnit.floor}. patro`],
                      ["Balkon", selectedUnit.balcony ? "Ano" : "Ne"],
                      ["Parkoviště", selectedUnit.parking ? "V ceně" : "Ne"],
                      ["Orientace", selectedUnit.orientation || "—"],
                      ["Sklep", selectedUnit.cellar ? "Ano" : "Ne"],
                    ].map(([l, v]) => (
                      <div key={l} style={{ background: "#fff", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: "#8899AA" }}>{l}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0D2137" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {(() => {
                  const imgs = Array.isArray(selectedUnit.images) ? selectedUnit.images : [];
                  return imgs.length > 0 ? (
                    <div>
                      <div style={{ fontSize: 12, color: "#8899AA", marginBottom: 6 }}>Fotky bytu</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {imgs.map((url, i) => (
                          <img key={i} src={url} alt="" onClick={() => setLightbox({ images: imgs, index: i })}
                            style={{ width: 80, height: 56, objectFit: "cover", borderRadius: 6, cursor: "zoom-in" }} />
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
                {selectedUnit.status === "available" && (
                  <>
                    <button onClick={() => onReserve(project, selectedUnit)} style={{ background: "#1A3A6B", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                      Rezervovat byt
                    </button>
                    <MortgageCalculator unit={selectedUnit} />
                  </>
                )}
                {selectedUnit.status === "reserved" && (
                  <div style={{ background: "#FEF3E2", borderRadius: 10, padding: 12, fontSize: 13, color: "#7A4A0A", textAlign: "center" }}>Byt je rezervován.</div>
                )}
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, color: "#AABBCC", textAlign: "center", gap: 8, padding: "20px 0" }}>
                <div style={{ fontSize: 32 }}>👆</div>
                <div style={{ fontSize: 13 }}>Klikněte na volný byt</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ReservationField = ({ value, onChange, label, type = "text", placeholder, error }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: 12, color: "#667788", fontWeight: 500 }}>{label}</label>
    <input type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13, border: error ? "1.5px solid #E24B4A" : "1px solid #D0D8E8", background: "#F8FAFE", color: "#0D2137", outline: "none" }}
    />
    {error && <span style={{ fontSize: 11, color: "#E24B4A" }}>{error}</span>}
  </div>
);

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

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    // Ulož kontakt
    const { data: contactData } = await supabase.from("contacts").insert({
      name: form.jmeno + " " + form.prijmeni,
      email: form.email,
      phone: form.telefon,
      status: "reserved",
      source: "web",
    }).select().single();

    // Ulož rezervaci
    await supabase.from("reservations").insert({
      unit_id: unit.id,
      contact_id: contactData?.id,
      reserved_at: new Date().toISOString().split("T")[0],
      valid_until: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "active",
      notes: form.poznamka,
    });

    // Nastav stav bytu
    await supabase.from("units").update({ status: "reserved" }).eq("id", unit.id);

    setSubmitted(true);
  };

  if (submitted) return (
    <div style={{ minHeight: "100vh", background: "#F4F7FC", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 64 }}>✅</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#0D2137" }}>Rezervace odeslána!</div>
      <div style={{ fontSize: 14, color: "#667788", maxWidth: 380, lineHeight: 1.7 }}>
        Byt č. <strong>{unit.unit_number}</strong> v projektu <strong>{project.name}</strong> je rezervován na 48 hodin. Kontaktujeme vás na <strong>{form.email}</strong>.
      </div>
      <button onClick={onSuccess} style={{ marginTop: 8, background: "#1A3A6B", color: "#fff", border: "none", borderRadius: 12, padding: "13px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
        Zpět na projekty
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FC" }}>
      <div style={{ background: "#0D2137", padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#7AA8D8", fontSize: 13, cursor: "pointer", padding: 0 }}>← Zpět</button>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Rezervace · {project.name} · Byt č. {unit.unit_number}</div>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px", boxShadow: "0 2px 8px rgba(10,30,60,0.06)", border: "1px solid #E8EDF5" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0D2137", marginBottom: 16 }}>Kontaktní údaje</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <ReservationField label="Jméno *" value={form.jmeno} onChange={v => setForm(f => ({ ...f, jmeno: v }))} placeholder="Jan" error={errors.jmeno} />
              <ReservationField label="Příjmení *" value={form.prijmeni} onChange={v => setForm(f => ({ ...f, prijmeni: v }))} placeholder="Novák" error={errors.prijmeni} />
              <ReservationField label="E-mail *" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="jan@email.cz" error={errors.email} />
              <ReservationField label="Telefon *" value={form.telefon} onChange={v => setForm(f => ({ ...f, telefon: v }))} placeholder="+420 777 000 000" error={errors.telefon} />
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px", boxShadow: "0 2px 8px rgba(10,30,60,0.06)", border: "1px solid #E8EDF5" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0D2137", marginBottom: 14 }}>Způsob financování</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[["vlastni", "Vlastní prostředky"], ["hypoteka", "Hypotéka"], ["kombinace", "Kombinace"]].map(([val, lbl]) => (
                <label key={val} style={{ display: "flex", alignItems: "center", gap: 10, background: form.financovani === val ? "#EEF3FA" : "#F8FAFE", border: form.financovani === val ? "1.5px solid #1A3A6B" : "1px solid #D0D8E8", borderRadius: 10, padding: "12px 16px", cursor: "pointer" }}>
                  <input type="radio" name="fin" checked={form.financovani === val} onChange={() => setForm(f => ({ ...f, financovani: val }))} style={{ accentColor: "#1A3A6B" }} />
                  <span style={{ fontSize: 14, color: "#0D2137" }}>{lbl}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px", boxShadow: "0 2px 8px rgba(10,30,60,0.06)", border: "1px solid #E8EDF5" }}>
            <label style={{ fontSize: 12, color: "#667788", fontWeight: 500 }}>Poznámka (volitelné)</label>
            <textarea value={form.poznamka} onChange={e => setForm(f => ({ ...f, poznamka: e.target.value }))}
              style={{ width: "100%", marginTop: 6, padding: "10px 14px", borderRadius: 10, fontSize: 13, border: "1px solid #D0D8E8", background: "#F8FAFE", resize: "none", height: 90, boxSizing: "border-box", color: "#0D2137" }} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 8px rgba(10,30,60,0.06)", border: "1px solid #E8EDF5" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0D2137", marginBottom: 14 }}>Shrnutí</div>
            <div style={{ background: "#F4F7FC", borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0D2137" }}>{project.name}</div>
              <div style={{ fontSize: 12, color: "#8899AA", marginTop: 2 }}>📍 {project.address}</div>
              <div style={{ borderTop: "1px solid #E8EDF5", margin: "10px 0" }} />
              {[["Byt č.", `${unit.unit_number} · ${unit.disp}`], ["Plocha", `${unit.area} m²`], ["Patro", `${unit.floor}. patro`]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: "#8899AA" }}>{l}</span><span style={{ fontWeight: 600, color: "#0D2137" }}>{v}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #E8EDF5", margin: "10px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17 }}>
                <span style={{ color: "#8899AA" }}>Cena</span>
                <span style={{ fontWeight: 800, color: "#1A3A6B" }}>{fmt(unit.price)}</span>
              </div>
            </div>
            <div style={{ background: "#EEF3FA", borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1A3A6B", marginBottom: 4 }}>Co se stane dál?</div>
              <div style={{ fontSize: 12, color: "#1A3A6B", lineHeight: 1.6 }}>Byt bude rezervován na 48 hodin. Kontaktujeme vás do 2 hodin.</div>
            </div>
            <button onClick={submit} style={{ background: "#1A3A6B", color: "#fff", border: "none", borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%" }}>
              Odeslat rezervaci
            </button>
            <div style={{ fontSize: 11, color: "#AABBCC", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>Odesláním souhlasíte se zpracováním osobních údajů dle GDPR.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [lightbox, setLightbox] = useState(null);
  const [view, setView] = useState("list");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [reservationUnit, setReservationUnit] = useState(null);
  const [settings, setSettings] = useState({
    hero_label: "Developerské projekty",
    hero_title: "Vyberte svůj nový domov",
    hero_subtitle: "novostavby i rekonstrukce",
    company_name: "DeveloperX",
    phone: "+420 777 000 000",
  });
  const [isAdmin, setIsAdmin] = useState(window.location.hash === "#admin");

  useEffect(() => {
    const handler = () => setIsAdmin(window.location.hash === "#admin");
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  useEffect(() => {
    const load = async () => {
      const [{ data: projectsData }, { data: settingsData }] = await Promise.all([
        supabase.from("projects").select("*, units(disp, status)").order("created_at"),
        supabase.from("settings").select("*"),
      ]);
      setProjects(projectsData || []);
      const s = {};
      (settingsData || []).forEach(r => { s[r.key] = r.value; });
      setSettings(prev => ({ ...prev, ...s }));
      setLoading(false);
    };
    load();
  }, []);

  if (isAdmin) return <Admin />;

  return (
    <div style={{ minHeight: "100vh", background: "#F4F7FC", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <div style={{ background: "#0D2137", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => { setView("list"); setSelectedProject(null); }}>
          <div style={{ width: 32, height: 32, background: "#1A3A6B", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏗</div>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>{settings.company_name}</span>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 14, color: "#7AA8D8", alignItems: "center" }}>
          <span style={{ cursor: "pointer" }}>O nás</span>
          <span style={{ cursor: "pointer" }}>Reference</span>
          <span style={{ cursor: "pointer" }}>Kontakt</span>
          <button style={{ background: "#1A3A6B", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📞 {settings.phone}</button>
          <a href="#admin" style={{ background: "rgba(255,255,255,0.1)", color: "#7AA8D8", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>Admin</a>
        </div>
      </div>

      {view === "list" && (
        <>
          <div style={{ background: "linear-gradient(135deg, #0D2137 0%, #1A3A6B 100%)", padding: "60px 28px 50px", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#7AA8D8", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>{settings.hero_label}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", marginBottom: 12, lineHeight: 1.2 }}>{settings.hero_title}</div>
            <div style={{ fontSize: 15, color: "#7AA8D8" }}>{projects.length} projektů · {settings.hero_subtitle}</div>
          </div>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
            {loading ? (
              <div style={{ textAlign: "center", color: "#AABBCC", padding: 60, fontSize: 15 }}>Načítám projekty...</div>
            ) : projects.length === 0 ? (
              <div style={{ textAlign: "center", color: "#AABBCC", padding: 60, fontSize: 15 }}>
                Žádné projekty. Přidejte je v <a href="#admin" style={{ color: "#1A3A6B" }}>admin panelu</a>.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 22 }}>
                {projects.map(p => <ProjectCard key={p.id} project={p} onClick={proj => { setSelectedProject(proj); setView("detail"); }} />)}
              </div>
            )}
          </div>
        </>
      )}

      {view === "detail" && selectedProject && (
        <ProjectDetail project={selectedProject} onBack={() => { setView("list"); setSelectedProject(null); }} onReserve={(proj, unit) => { setReservationUnit(unit); setView("reservation"); }} setLightbox={setLightbox} />
      )}

      {view === "reservation" && selectedProject && reservationUnit && (
        <ReservationForm project={selectedProject} unit={reservationUnit} onBack={() => setView("detail")} onSuccess={() => { setView("list"); setSelectedProject(null); setReservationUnit(null); }} />
      )}

      {lightbox && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={() => setLightbox(null)} style={{ position: "absolute", inset: 0 }} />
          <button onClick={() => {
            const imgs = lightbox.images;
            const idx = (lightbox.index - 1 + imgs.length) % imgs.length;
            setLightbox({ images: imgs, index: idx });
          }} style={{
            position: "absolute", left: 20, background: "rgba(255,255,255,0.2)", border: "none",
            borderRadius: "50%", width: 48, height: 48, color: "#fff", fontSize: 24, cursor: "pointer", zIndex: 1
          }}>‹</button>
          <img src={lightbox.images[lightbox.index]} alt="" style={{ maxWidth: "85vw", maxHeight: "85vh", borderRadius: 12, objectFit: "contain", position: "relative", zIndex: 1 }} />
          <button onClick={() => {
            const imgs = lightbox.images;
            const idx = (lightbox.index + 1) % imgs.length;
            setLightbox({ images: imgs, index: idx });
          }} style={{
            position: "absolute", right: 20, background: "rgba(255,255,255,0.2)", border: "none",
            borderRadius: "50%", width: 48, height: 48, color: "#fff", fontSize: 24, cursor: "pointer", zIndex: 1
          }}>›</button>
          <button onClick={() => setLightbox(null)} style={{
            position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.2)",
            border: "none", borderRadius: "50%", width: 40, height: 40, color: "#fff",
            fontSize: 20, cursor: "pointer", zIndex: 2
          }}>×</button>
          <div style={{ position: "absolute", bottom: 16, color: "rgba(255,255,255,0.6)", fontSize: 13, zIndex: 1 }}>
            {lightbox.index + 1} / {lightbox.images.length}
          </div>
        </div>
      )}
    </div>
  );
}