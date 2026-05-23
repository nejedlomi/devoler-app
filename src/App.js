import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Admin from "./Admin";

const fmt = (n) => n?.toLocaleString("cs-CZ") + " Kč";

const STATUS_LABELS = { available: "Volný", reserved: "Rezervováno", sold: "Prodáno" };
const STATUS_COLORS = {
  available: { bg: "#E1F5EE", color: "#0F6E56", border: "#9FE1CB" },
  reserved: { bg: "#FAEEDA", color: "#633806", border: "#FAC775" },
  sold: { bg: "#F1EFE8", color: "#5F5E5A", border: "#D3D1C7" },
};

function ProjectCard({ project, onClick }) {
  const avail = project.total_units - project.sold_units;
  const pct = project.total_units > 0 ? Math.round((project.sold_units / project.total_units) * 100) : 0;
  const isSoon = project.total_units === 0;
  return (
    <div onClick={() => !isSoon && onClick(project)} style={{
      background: "#fff", border: "0.5px solid #e0e0e0", borderRadius: 14, overflow: "hidden",
      cursor: isSoon ? "default" : "pointer", transition: "border-color 0.15s, transform 0.15s", opacity: isSoon ? 0.8 : 1,
    }}
      onMouseEnter={e => { if (!isSoon) { e.currentTarget.style.borderColor = project.color || "#1D9E75"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.transform = ""; }}
    >
      <div style={{ height: 120, background: project.bg || "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <span style={{ fontSize: 44 }}>🏢</span>
        <div style={{
          position: "absolute", top: 10, left: 10, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500,
          background: isSoon ? "#FAEEDA" : avail <= 3 && avail > 0 ? "#FCEBEB" : avail === 0 ? "#F1EFE8" : project.bg || "#E1F5EE",
          color: isSoon ? "#633806" : avail <= 3 && avail > 0 ? "#A32D2D" : avail === 0 ? "#5F5E5A" : project.color || "#1D9E75",
        }}>
          {isSoon ? "Připravujeme" : avail === 0 ? "Vyprodáno" : avail <= 3 ? "Poslední byty" : project.type}
        </div>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>{project.name}</div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>📍 {project.location}</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, alignItems: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>od {fmt(project.price_from)}</div>
          <div style={{ fontSize: 11, color: "#999" }}>{avail} / {project.total_units} volných</div>
        </div>
        <div style={{ marginTop: 8, height: 4, background: "#f0f0f0", borderRadius: 2 }}>
          <div style={{ height: 4, width: `${pct}%`, background: pct === 100 ? "#D3D1C7" : project.color || "#1D9E75", borderRadius: 2 }} />
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
  const sc = STATUS_COLORS[unit.status] || STATUS_COLORS.available;
  const isClickable = unit.status !== "sold";
  return (
    <div onClick={() => isClickable && onClick(unit)} style={{
      border: selected ? `2px solid #1D9E75` : `0.5px solid ${sc.border}`,
      borderRadius: 10, padding: "10px 8px", textAlign: "center",
      cursor: isClickable ? "pointer" : "default",
      background: selected ? "#E1F5EE" : sc.bg,
      opacity: unit.status === "sold" ? 0.55 : 1,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{unit.unit_number}</div>
      <div style={{ fontSize: 11, color: "#666", marginTop: 1 }}>{unit.disp}</div>
      <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>{unit.area} m²</div>
      <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: unit.status === "available" ? "#0F6E56" : unit.status === "reserved" ? "#854F0B" : "#888" }}>
        {unit.status === "available" ? fmt(unit.price) : STATUS_LABELS[unit.status]}
      </div>
    </div>
  );
}

function ProjectDetail({ project, onBack, onReserve }) {
  const [units, setUnits] = useState([]);
  const [floor, setFloor] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);

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
  const floorUnits = units.filter(u => u.floor === floor);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#04342C", padding: "16px 20px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9FE1CB", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 8 }}>← Zpět</button>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{project.name}</div>
        <div style={{ fontSize: 13, color: "#9FE1CB", marginTop: 3 }}>📍 {project.address} · {project.type} · Dokončení {project.completion}</div>
        <div style={{ fontSize: 13, color: "#9FE1CB", marginTop: 6, lineHeight: 1.5 }}>{project.description}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", background: "#f7f7f5", minHeight: 400 }}>
        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#999", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Vyberte patro a byt</div>
          {loading ? <div style={{ color: "#aaa" }}>Načítám byty...</div> : (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                {floors.map(f => (
                  <button key={f} onClick={() => { setFloor(f); setSelectedUnit(null); }} style={{
                    border: floor === f ? "none" : "0.5px solid #ddd", borderRadius: 8, padding: "5px 14px", fontSize: 13, cursor: "pointer",
                    background: floor === f ? "#1D9E75" : "#fff", color: floor === f ? "#fff" : "#555",
                  }}>{f}. patro</button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
                {floorUnits.map(u => <UnitCell key={u.id} unit={u} selected={selectedUnit?.id === u.id} onClick={setSelectedUnit} />)}
              </div>
              {floorUnits.length === 0 && <div style={{ color: "#aaa", fontSize: 14 }}>Na tomto patře nejsou byty.</div>}
              <div style={{ display: "flex", gap: 14, marginTop: 16 }}>
                {["available", "reserved", "sold"].map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#888" }}>
                    <div style={{ width: 11, height: 11, borderRadius: 3, background: STATUS_COLORS[s].bg, border: `0.5px solid ${STATUS_COLORS[s].border}` }} />
                    {STATUS_LABELS[s]}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div style={{ background: "#fff", borderLeft: "0.5px solid #e8e8e8", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {selectedUnit ? (
            <>
              <div style={{ background: "#f7f7f5", borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Byt č. {selectedUnit.unit_number} · {selectedUnit.disp}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#1D9E75", marginTop: 4 }}>{fmt(selectedUnit.price)}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 12 }}>
                  {[["Plocha", `${selectedUnit.area} m²`], ["Patro", `${selectedUnit.floor}. patro`], ["Balkon", selectedUnit.balcony ? "Ano" : "Ne"], ["Parkoviště", selectedUnit.parking ? "V ceně" : "Ne"], ["Sklep", selectedUnit.cellar ? "Ano" : "Ne"]].map(([l, v]) => (
                    <div key={l} style={{ background: "#fff", borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: "#aaa" }}>{l}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              {selectedUnit.status === "available" && (
                <button onClick={() => onReserve(project, selectedUnit)} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  📅 Rezervovat byt
                </button>
              )}
              {selectedUnit.status === "reserved" && (
                <div style={{ background: "#FAEEDA", borderRadius: 10, padding: 12, fontSize: 13, color: "#633806", textAlign: "center" }}>Tento byt je rezervován.</div>
              )}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#bbb", textAlign: "center", gap: 8 }}>
              <div style={{ fontSize: 32 }}>👆</div>
              <div style={{ fontSize: 14 }}>Klikněte na volný byt</div>
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

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    await supabase.from("units").update({ status: "reserved" }).eq("id", unit.id);
    setSubmitted(true);
  };

  const Field = ({ id, label, type = "text", placeholder }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>{label}</label>
      <input type={type} value={form[id]} placeholder={placeholder}
        onChange={e => { setForm(f => ({ ...f, [id]: e.target.value })); setErrors(er => ({ ...er, [id]: "" })); }}
        style={{ padding: "9px 12px", borderRadius: 8, fontSize: 13, border: errors[id] ? "1px solid #E24B4A" : "0.5px solid #ddd", background: "#fafafa", color: "#1a1a1a" }} />
      {errors[id] && <span style={{ fontSize: 11, color: "#E24B4A" }}>{errors[id]}</span>}
    </div>
  );

  if (submitted) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16, padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 56 }}>✅</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Rezervace odeslána!</div>
      <div style={{ fontSize: 14, color: "#666", maxWidth: 380, lineHeight: 1.6 }}>
        Byt č. <strong>{unit.unit_number}</strong> v projektu <strong>{project.name}</strong> je rezervován na 48 hodin. Kontaktujeme vás na <strong>{form.email}</strong>.
      </div>
      <button onClick={onSuccess} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
        Zpět na projekty
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#04342C", padding: "16px 20px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#9FE1CB", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 8 }}>← Zpět</button>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Rezervace · {project.name} · Byt č. {unit.unit_number}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", background: "#f7f7f5" }}>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Kontaktní údaje</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field id="jmeno" label="Jméno *" placeholder="Jan" />
            <Field id="prijmeni" label="Příjmení *" placeholder="Novák" />
            <Field id="email" label="E-mail *" type="email" placeholder="jan@email.cz" />
            <Field id="telefon" label="Telefon *" placeholder="+420 777 000 000" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Financování</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[["vlastni", "Vlastní prostředky"], ["hypoteka", "Hypotéka"], ["kombinace", "Kombinace"]].map(([val, lbl]) => (
                <label key={val} style={{ display: "flex", alignItems: "center", gap: 10, background: form.financovani === val ? "#E1F5EE" : "#fff", border: form.financovani === val ? "1.5px solid #1D9E75" : "0.5px solid #ddd", borderRadius: 10, padding: "11px 14px", cursor: "pointer" }}>
                  <input type="radio" name="fin" checked={form.financovani === val} onChange={() => setForm(f => ({ ...f, financovani: val }))} style={{ accentColor: "#1D9E75" }} />
                  <span style={{ fontSize: 13 }}>{lbl}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Poznámka</label>
            <textarea value={form.poznamka} onChange={e => setForm(f => ({ ...f, poznamka: e.target.value }))}
              style={{ padding: "9px 12px", borderRadius: 8, fontSize: 13, border: "0.5px solid #ddd", background: "#fafafa", resize: "none", height: 80 }} />
          </div>
        </div>
        <div style={{ background: "#fff", borderLeft: "0.5px solid #e8e8e8", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Shrnutí</div>
          <div style={{ background: "#f7f7f5", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{project.name}</div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>📍 {project.address}</div>
            <div style={{ borderTop: "0.5px solid #eee", margin: "10px 0" }} />
            {[["Byt č.", `${unit.unit_number} · ${unit.disp}`], ["Plocha", `${unit.area} m²`], ["Patro", `${unit.floor}. patro`]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span style={{ color: "#888" }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span>
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
            <div style={{ fontSize: 12, color: "#0F6E56", lineHeight: 1.6 }}>Byt bude rezervován na 48 hodin. Kontaktujeme vás do 2 hodin.</div>
          </div>
          <button onClick={submit} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            📅 Odeslat rezervaci
          </button>
          <div style={{ fontSize: 11, color: "#bbb", textAlign: "center" }}>Odesláním souhlasíte se zpracováním osobních údajů dle GDPR.</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("list");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [reservationUnit, setReservationUnit] = useState(null);
  const isAdmin = window.location.hash === "#admin";

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("projects").select("*").order("created_at");
      setProjects(data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (isAdmin) return <Admin />;

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f5", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <div style={{ background: "#fff", borderBottom: "0.5px solid #e8e8e8", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => { setView("list"); setSelectedProject(null); }}>
          <div style={{ width: 30, height: 30, background: "#1D9E75", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏗</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>DeveloperX</span>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#666", alignItems: "center" }}>
          <span>O nás</span>
          <span>Reference</span>
          <span>Kontakt</span>
          <button style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📞 Zavolat nám</button>
        </div>
      </div>

      {view === "list" && (
        <>
          <div style={{ background: "#04342C", padding: "40px 24px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#5DCAA5", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Developerské projekty</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Vyberte svůj nový domov</div>
            <div style={{ fontSize: 14, color: "#9FE1CB" }}>{projects.length} projektů · novostavby i rekonstrukce</div>
          </div>
          <div style={{ padding: "20px 24px" }}>
            {loading ? (
              <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Načítám projekty...</div>
            ) : projects.length === 0 ? (
              <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Žádné projekty. Přidejte je v <a href="#admin" style={{ color: "#1D9E75" }}>admin panelu</a>.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {projects.map(p => <ProjectCard key={p.id} project={p} onClick={proj => { setSelectedProject(proj); setView("detail"); }} />)}
              </div>
            )}
          </div>
        </>
      )}

      {view === "detail" && selectedProject && (
        <ProjectDetail project={selectedProject} onBack={() => { setView("list"); setSelectedProject(null); }} onReserve={(proj, unit) => { setReservationUnit(unit); setView("reservation"); }} />
      )}

      {view === "reservation" && selectedProject && reservationUnit && (
        <ReservationForm project={selectedProject} unit={reservationUnit} onBack={() => setView("detail")} onSuccess={() => { setView("list"); setSelectedProject(null); setReservationUnit(null); }} />
      )}
    </div>
  );
}