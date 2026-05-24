/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import * as XLSX from "xlsx";

function Section({ title, first, children }) {
  return (
    <div style={{ marginTop: first ? 0 : 20, paddingTop: first ? 0 : 20, borderTop: first ? "none" : "0.5px solid #eee" }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888" }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{children}</div>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState("projects");
  const [selectedProject, setSelectedProject] = useState(null);
  const [filterDisp, setFilterDisp] = useState("Vše");
  const [milestones, setMilestones] = useState([]);
  const [milestoneForm, setMilestoneForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});
  const [unitForm, setUnitForm] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pdfEditor, setPdfEditor] = useState(null);
  const [settings, setSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => { loadProjects(); loadSettings(); }, []);

  useEffect(() => {
    if (view !== "editProject") {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markerRef.current = null;
      return;
    }
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setTimeout(initMap, 200);
      document.head.appendChild(script);
    } else {
      setTimeout(initMap, 200);
    }
  }, [view]);

  const initMap = () => {
    const el = document.getElementById("map-container");
    if (!el || !window.L || mapRef.current) return;
    const L = window.L;
    const map = L.map("map-container").setView([form.lat || 50.0755, form.lng || 14.4378], form.lat ? 14 : 8);
    L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=fDblwSe3VCWnYFEkUUBE`, {
      attribution: "© MapTiler © OpenStreetMap", maxZoom: 20,
    }).addTo(map);
    if (form.lat) { markerRef.current = L.marker([form.lat, form.lng]).addTo(map); }
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      setForm(f => ({ ...f, lat, lng }));
      if (markerRef.current) { markerRef.current.setLatLng([lat, lng]); }
      else { markerRef.current = L.marker([lat, lng]).addTo(map); }
    });
    mapRef.current = map;
  };

  const getImages = (images) => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    try { return JSON.parse(images); } catch { return []; }
  };

  const searchAddress = async (val) => {
    setForm(f => ({ ...f, location: val }));
    if (val.length < 3) { setSuggestions([]); return; }
    try {
      const res = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(val)}.json?key=fDblwSe3VCWnYFEkUUBE&language=cs&country=cz,sk&limit=5`);
      const data = await res.json();
      const results = (data.features || []).map(f => ({ display_name: f.place_name, lat: f.center[1], lon: f.center[0] }));
      setSuggestions(results);
    } catch { setSuggestions([]); }
  };

  const selectAddress = (s) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setForm(f => ({ ...f, location: s.display_name, lat, lng }));
    setSuggestions([]);
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 15);
      if (markerRef.current) { markerRef.current.setLatLng([lat, lng]); }
      else { markerRef.current = window.L.marker([lat, lng]).addTo(mapRef.current); }
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    const { data } = await supabase.from("projects").select("*").order("created_at");
    setProjects(data || []);
    setLoading(false);
  };

  const loadSettings = async () => {
    const { data } = await supabase.from("settings").select("*");
    const s = {};
    (data || []).forEach(r => { s[r.key] = r.value; });
    setSettings(s);
  };

  const saveProject = async () => {
    const projectData = { ...form, images: form.images ? JSON.stringify(getImages(form.images)) : null };
    if (form.id) { await supabase.from("projects").update(projectData).eq("id", form.id); }
    else { await supabase.from("projects").insert(projectData); }
    setView("projects");
    setForm({});
    loadProjects();
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Opravdu smazat projekt?")) return;
    await supabase.from("projects").delete().eq("id", id);
    loadProjects();
  };

  const loadUnits = async (project) => {
    const { data } = await supabase.from("units").select("*").eq("project_id", project.id).order("floor");
    setSelectedProject({ ...project, units: data || [] });
    setView("units");
  };

  const saveUnit = async () => {
    const pricePerM2 = unitForm.price_net && unitForm.area ? Math.round(unitForm.price_net / unitForm.area) : null;
    const data = { ...unitForm, price_per_sqm: pricePerM2 };
    if (unitForm.id) { await supabase.from("units").update(data).eq("id", unitForm.id); }
    else { await supabase.from("units").insert({ ...data, project_id: selectedProject.id }); }
    setUnitForm({});
    loadUnits(selectedProject);
  };

  const deleteUnit = async (id) => {
    if (!window.confirm("Opravdu smazat byt?")) return;
    await supabase.from("units").delete().eq("id", id);
    loadUnits(selectedProject);
  };

  const loadMilestones = async (project) => {
    const { data } = await supabase.from("milestones").select("*").eq("project_id", project.id).order("order_index");
    setMilestones(data || []);
    setSelectedProject(project);
    setView("milestones");
  };

  const saveMilestone = async () => {
    if (milestoneForm.id) {
      await supabase.from("milestones").update(milestoneForm).eq("id", milestoneForm.id);
    } else {
      const maxOrder = milestones.length > 0 ? Math.max(...milestones.map(m => m.order_index)) + 1 : 0;
      await supabase.from("milestones").insert({ ...milestoneForm, project_id: selectedProject.id, order_index: maxOrder });
    }
    setMilestoneForm({});
    loadMilestones(selectedProject);
  };

  const deleteMilestone = async (id) => {
    if (!window.confirm("Smazat milník?")) return;
    await supabase.from("milestones").delete().eq("id", id);
    loadMilestones(selectedProject);
  };

  const Input = ({ label, field, type, obj, setObj, span }) => {
    const [localVal, setLocalVal] = useState(obj[field] || "");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: span ? "1 / -1" : "auto" }}>
        <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>{label}</label>
        <input type={type || "text"} value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          onBlur={() => setObj(o => ({ ...o, [field]: type === "number" ? parseInt(localVal) || 0 : localVal }))}
          style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }}
        />
      </div>
    );
  };

  const Select = ({ label, field, options, obj, setObj, span }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, gridColumn: span ? "1 / -1" : "auto" }}>
      <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>{label}</label>
      <select value={obj[field] || ""} onChange={e => setObj(o => ({ ...o, [field]: e.target.value }))}
        style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }}>
        <option value="">-- vyberte --</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const Checkbox = ({ label, field, obj, setObj }) => (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1a1a1a", cursor: "pointer" }}>
      <input type="checkbox" checked={obj[field] || false}
        onChange={e => setObj(o => ({ ...o, [field]: e.target.checked }))}
        style={{ accentColor: "#1D9E75" }} />
      {label}
    </label>
  );

  const statusColor = (s) => {
    if (s === "available") return { bg: "#E1F5EE", color: "#0F6E56" };
    if (s === "reserved") return { bg: "#FAEEDA", color: "#633806" };
    if (s === "sold") return { bg: "#f0f0f0", color: "#666" };
    if (s === "blocked") return { bg: "#FCEBEB", color: "#A32D2D" };
    return { bg: "#f0f0f0", color: "#666" };
  };

  const statusLabel = (s) => ({
    available: "Volná", reserved: "Rezervovaná", sold: "Prodaná", blocked: "Blokovaná", withdrawn: "Stažená"
  }[s] || s);

  const login = async () => {
    const { data, error } = await supabase.from("admin_users").select("*").eq("username", loginForm.username).eq("password", loginForm.password);
    console.log("Login result:", data, error);
    if (data && data.length > 0) { setAuthed(true); setLoginError(""); }
    else { setLoginError("Špatné jméno nebo heslo"); }
  };

  if (!authed) return (
    <div style={{ minHeight: "100vh", background: "#04342C", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 36, width: 340, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>🏗 Admin panel</div>
        <div style={{ fontSize: 13, color: "#999", marginBottom: 24 }}>Přihlaste se pro přístup</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Uživatelské jméno</label>
            <input type="text" value={loginForm.username} onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
              style={{ width: "100%", marginTop: 4, padding: "10px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Heslo</label>
            <input type="password" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={async e => { if (e.key === "Enter") await login(); }}
              style={{ width: "100%", marginTop: 4, padding: "10px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          {loginError && <div style={{ fontSize: 12, color: "#E24B4A" }}>{loginError}</div>}
          <button onClick={login} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "11px", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>
            Přihlásit se
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f5", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#04342C", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>🏗 Admin panel</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => setView("settings")} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#9FE1CB", cursor: "pointer" }}>⚙️ Nastavení</button>
          <a href="/" style={{ fontSize: 13, color: "#9FE1CB", textDecoration: "none" }}>← Zpět na web</a>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

        {loading && <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Načítám...</div>}

        {/* PROJEKTY */}
        {!loading && view === "projects" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>Projekty ({projects.length})</div>
              <button onClick={() => { setForm({}); setView("editProject"); }} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Nový projekt</button>
            </div>
            {projects.length === 0 && <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Žádné projekty.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map(p => (
                <div key={p.id} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{p.location} · od {p.price_from?.toLocaleString("cs-CZ")} Kč · {p.total_units} bytů</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setFilterDisp("Vše"); loadUnits(p); }} style={{ background: "#E1F5EE", color: "#0F6E56", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>Byty</button>
                    <button onClick={() => loadMilestones(p)} style={{ background: "#EEF3FA", color: "#1A3A6B", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>Timeline</button>
                    <button onClick={() => { setForm(p); setView("editProject"); }} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>Upravit</button>
                    <button onClick={() => deleteProject(p.id)} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>Smazat</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* EDIT PROJEKT */}
        {!loading && view === "editProject" && (
          <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>{form.id ? "Upravit projekt" : "Nový projekt"}</div>

            <div style={{ marginBottom: 16, padding: 14, background: "#E1F5EE", borderRadius: 10, border: "0.5px solid #9FE1CB" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F6E56", marginBottom: 8 }}>📄 Nahrát PDF projektu — automatické vyplnění</div>
              <input type="file" accept=".pdf" onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (ev) => {
                  const base64 = ev.target.result.split(",")[1];
                  setPdfLoading(true);
                  try {
                    const res = await fetch("https://trgmooampugduekngpxb.supabase.co/functions/v1/extract-pdf", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZ21vb2FtcHVnZHVla25ncHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Njk5NTIsImV4cCI6MjA5NTE0NTk1Mn0.MlEpjp1Zd__n837vv3N54y-c-lNtrHQp56Nprm5T4UE`,
                      },
                      body: JSON.stringify({ pdfBase64: base64 }),
                    });
                    const parsed = await res.json();
                    setForm(f => ({ ...f, ...parsed }));
                  } catch (err) { alert("Chyba při zpracování PDF: " + err.message); }
                  setPdfLoading(false);
                };
                reader.readAsDataURL(file);
              }} style={{ fontSize: 13 }} />
              {pdfLoading && <div style={{ marginTop: 8, fontSize: 13, color: "#0F6E56" }}>⏳ Zpracovávám PDF...</div>}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Název projektu *" field="name" obj={form} setObj={setForm} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4, position: "relative" }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Lokalita / Adresa</label>
                <input type="text" value={form.location || ""} onChange={e => searchAddress(e.target.value)} placeholder="Začněte psát adresu..."
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
                {suggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "0.5px solid #ddd", borderRadius: 8, zIndex: 9999, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", marginTop: 2 }}>
                    {suggestions.map((s, i) => (
                      <div key={i} onClick={() => selectAddress(s)} style={{ padding: "10px 12px", fontSize: 12, color: "#333", cursor: "pointer", borderBottom: i < suggestions.length - 1 ? "0.5px solid #f0f0f0" : "none" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f7f7f5"}
                        onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                        {s.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Select label="Typ" field="type" options={["Novostavba", "Rekonstrukce"]} obj={form} setObj={setForm} />
              <Input label="Dokončení (např. Q2 2026)" field="completion" obj={form} setObj={setForm} />
              <Input label="Cena od (Kč)" field="price_from" type="number" obj={form} setObj={setForm} />
              <Input label="Celkem bytů" field="total_units" type="number" obj={form} setObj={setForm} />
              <Input label="Prodaných bytů" field="sold_units" type="number" obj={form} setObj={setForm} />
              <Input label="Počet podlaží" field="floors" type="number" obj={form} setObj={setForm} />
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Popis</label>
              <textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ width: "100%", marginTop: 4, padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, height: 80, resize: "none", background: "#fafafa", color: "#1a1a1a", boxSizing: "border-box" }} />
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Logo firmy</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const fileName = `logos/${Date.now()}-${file.name}`;
                const { error } = await supabase.storage.from("project-images").upload(fileName, file);
                if (!error) {
                  const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(fileName);
                  setForm(f => ({ ...f, company_logo: urlData.publicUrl }));
                }
              }} style={{ marginTop: 6, fontSize: 13 }} />
              {form.company_logo && <img src={form.company_logo} alt="Logo" style={{ height: 50, objectFit: "contain", marginTop: 8 }} />}
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Fotky projektu</label>
              <input type="file" accept="image/*" multiple onChange={async (e) => {
                const files = Array.from(e.target.files);
                const urls = [];
                for (const file of files) {
                  const fileName = `${Date.now()}-${file.name}`;
                  const { error } = await supabase.storage.from("project-images").upload(fileName, file);
                  if (!error) {
                    const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(fileName);
                    urls.push(urlData.publicUrl);
                  }
                }
                setForm(f => ({ ...f, images: [...getImages(f.images), ...urls] }));
              }} style={{ marginTop: 6, fontSize: 13 }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {getImages(form.images).map((url, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={url} alt="" style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 8 }} />
                    <button onClick={() => setForm(f => ({ ...f, images: getImages(f.images).filter((_, j) => j !== i) }))}
                      style={{ position: "absolute", top: 2, right: 2, background: "#E24B4A", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 11, cursor: "pointer" }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Poloha na mapě (klikněte pro upřesnění)</label>
              <div id="map-container" style={{ marginTop: 6, height: 300, borderRadius: 8, border: "0.5px solid #ddd" }}></div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                {form.lat ? `📍 ${form.lat.toFixed(5)}, ${form.lng.toFixed(5)}` : "Vyberte adresu nebo klikněte na mapu"}
              </div>
            </div>

            <div style={{ marginTop: 16, padding: 14, background: "#f7f7f5", borderRadius: 10, border: "0.5px solid #e8e8e8" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 10 }}>🏠 Generovat byty automaticky</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 10 }}>
                {["1+kk", "2+kk", "3+kk", "4+kk"].map(disp => (
                  <div key={disp} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>{disp}</label>
                    <input type="number" min="0" defaultValue="0" id={`gen-${disp}`}
                      style={{ padding: "7px 10px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fff" }} />
                  </div>
                ))}
              </div>
              <button onClick={async () => {
                if (!form.id) { alert("Nejdříve uložte projekt!"); return; }
                const dispozice = ["1+kk", "2+kk", "3+kk", "4+kk"];
                const units = [];
                let counter = 1;
                for (const disp of dispozice) {
                  const count = parseInt(document.getElementById(`gen-${disp}`)?.value) || 0;
                  for (let i = 0; i < count; i++) {
                    units.push({ project_id: form.id, unit_number: counter++, disp, status: "available", floor: 1, area: 0, price: 0 });
                  }
                }
                if (units.length === 0) { alert("Zadejte počty bytů!"); return; }
                if (!window.confirm(`Vytvořit ${units.length} bytů?`)) return;
                await supabase.from("units").insert(units);
                alert(`Vytvořeno ${units.length} bytů!`);
              }} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Generovat byty
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={saveProject} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Uložit</button>
              <button onClick={() => { setView("projects"); setForm({}); setSuggestions([]); }} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>Zrušit</button>
            </div>
          </div>
        )}

        {/* BYTY SEZNAM */}
        {!loading && view === "units" && selectedProject && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <button onClick={() => setView("projects")} style={{ background: "none", border: "none", color: "#1D9E75", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 4 }}>← Projekty</button>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>{selectedProject.name} — Byty ({selectedProject.units?.length || 0})</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>
                  {["1+kk", "2+kk", "3+kk", "4+kk"].map(disp => {
                    const total = selectedProject.units?.filter(u => u.disp === disp).length || 0;
                    const avail = selectedProject.units?.filter(u => u.disp === disp && u.status === "available").length || 0;
                    if (total === 0) return null;
                    return (
                      <div key={disp} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{disp}</div>
                        <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{avail} volných / {total} celkem</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <button onClick={() => { setUnitForm({}); setView("editUnit"); }} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Nový byt</button>
              <button onClick={() => {
                const rows = selectedProject.units.map(u => ({
                  "Číslo": u.unit_number,
                  "Budova": u.building || "",
                  "Patro": u.floor,
                  "Dispozice": u.disp,
                  "Plocha m²": u.area,
                  "Orientace": u.orientation || "",
                  "Balkon": u.balcony ? "Ano" : "Ne",
                  "Typ balkonu": u.balcony_type || "",
                  "Plocha balkonu": u.balcony_area || "",
                  "Sklep": u.cellar ? "Ano" : "Ne",
                  "Parkoviště": u.parking ? "Ano" : "Ne",
                  "Cena bez DPH": u.price_net || "",
                  "Cena s DPH": u.price_net ? Math.round(u.price_net * 1.12) : "",
                  "Cena/m²": u.price_per_sqm || "",
                  "Akční cena": u.price_action || "",
                  "Stav": u.status,
                  "Kupující": u.buyer || "",
                  "Datum rezervace": u.reserved_at || "",
                  "Datum smlouvy": u.contract_signed_at || "",
                  "Poznámky": u.notes || "",
                }));
                const ws = XLSX.utils.json_to_sheet(rows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Ceník");
                XLSX.writeFile(wb, `cenik-${selectedProject.name}.xlsx`);
              }} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                📊 Export Excel
              </button>
            </div>
            {(() => {
              const dispTypes = ["Vše", ...new Set(selectedProject.units?.map(u => u.disp).filter(Boolean))];
              return (
                <>
                  <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                    {dispTypes.map(d => (
                      <button key={d} onClick={() => setFilterDisp(d)} style={{
                        border: filterDisp === d ? "none" : "0.5px solid #ddd",
                        borderRadius: 20, padding: "5px 14px", fontSize: 12, cursor: "pointer",
                        background: filterDisp === d ? "#1D9E75" : "#fff",
                        color: filterDisp === d ? "#fff" : "#555",
                      }}>{d}</button>
                    ))}
                  </div>
                </>
              );
            })()}
            {selectedProject.units?.length > 0 && (() => {
              const units = selectedProject.units;
              const totalVolume = units.reduce((s, u) => s + (u.price_net || 0), 0);
              const avgPriceM2 = units.filter(u => u.price_per_sqm > 0).reduce((s, u, _, a) => s + u.price_per_sqm / a.length, 0);
              const byStatus = { available: 0, reserved: 0, sold: 0, blocked: 0 };
              units.forEach(u => { if (byStatus[u.status] !== undefined) byStatus[u.status]++; });
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
                  {[
                    ["Celkový objem", totalVolume ? totalVolume.toLocaleString("cs-CZ") + " Kč" : "—"],
                    ["Prům. cena/m²", avgPriceM2 ? Math.round(avgPriceM2).toLocaleString("cs-CZ") + " Kč" : "—"],
                    ["Volné", byStatus.available],
                    ["Rezervované", byStatus.reserved],
                    ["Prodané", byStatus.sold],
                    ["Blokované", byStatus.blocked],
                  ].map(([l, v]) => (
                    <div key={l} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ fontSize: 11, color: "#999" }}>{l}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
            {selectedProject.units?.length === 0 && <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Žádné byty.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(filterDisp === "Vše" ? selectedProject.units : selectedProject.units?.filter(u => u.disp === filterDisp))?.map(u => {
                const sc = statusColor(u.status);
                return (
                  <div key={u.id} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", minWidth: 30 }}>#{u.unit_number}</div>
                      <div style={{ fontSize: 13, color: "#666" }}>{u.disp} · {u.area} m²{u.building ? ` · Budova ${u.building}` : ""} · {u.floor}. p.</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{u.price_net ? u.price_net.toLocaleString("cs-CZ") + " Kč" : u.price ? u.price.toLocaleString("cs-CZ") + " Kč" : "—"}</div>
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: sc.bg, color: sc.color, fontWeight: 500 }}>{statusLabel(u.status)}</span>
                      {u.buyer && <div style={{ fontSize: 12, color: "#999" }}>👤 {u.buyer}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setPdfEditor({
                        project: selectedProject,
                        unit: u,
                        agentPhotoSize: 100,
                        agentPhotoShape: "circle",
                        template: "minimal",
                        colorHeader: "#04342C",
                        colorPrice: "#04342C",
                        colorAccent: "#1D9E75",
                        photosPosition: "top",
                        agentPosition: "bottom",
                        priceSize: "large",
                      })} style={{ background: "#E1F5EE", color: "#0F6E56", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>
                        📄 PDF
                      </button>
                      <button onClick={() => { setUnitForm(u); setView("editUnit"); }} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Upravit</button>
                      <button onClick={() => deleteUnit(u.id)} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Smazat</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* EDIT BYT */}
        {!loading && view === "editUnit" && (
          <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <button onClick={() => { setView("units"); setUnitForm({}); }} style={{ background: "none", border: "none", color: "#1D9E75", fontSize: 13, cursor: "pointer", padding: 0 }}>← Byty</button>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>{unitForm.id ? "Upravit byt" : "Nový byt"}</div>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>{selectedProject?.name}</div>

            <Section title="Základní info" first>
              <Input label="Číslo jednotky *" field="unit_number" type="number" obj={unitForm} setObj={setUnitForm} />
              <Input label="Budova" field="building" obj={unitForm} setObj={setUnitForm} />
              <Input label="Patro" field="floor" type="number" obj={unitForm} setObj={setUnitForm} />
              <Select label="Dispozice" field="disp" options={["1+kk", "2+kk", "3+kk", "4+kk"]} obj={unitForm} setObj={setUnitForm} />
            </Section>

            <Section title="Parametry bytu">
              <Input label="Prodejní plocha (m²)" field="area" type="number" obj={unitForm} setObj={setUnitForm} />
              <Select label="Orientace" field="orientation" options={["Sever", "Jih", "Východ", "Západ", "Jihovýchod", "Jihozápad", "Severovýchod", "Severozápad"]} obj={unitForm} setObj={setUnitForm} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Venkovní plocha</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <Checkbox label="Balkon/lodžie/terasa" field="balcony" obj={unitForm} setObj={setUnitForm} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Select label="Typ venkovní plochy" field="balcony_type" options={["Balkon", "Lodžie", "Terasa"]} obj={unitForm} setObj={setUnitForm} />
              </div>
              <Input label="Plocha balkonu/lodžie/terasy (m²)" field="balcony_area" type="number" obj={unitForm} setObj={setUnitForm} />
              <div style={{ display: "flex", gap: 16, alignItems: "center", paddingTop: 4 }}>
                <Checkbox label="Sklep" field="cellar" obj={unitForm} setObj={setUnitForm} />
                <Checkbox label="Parkovací místo" field="parking" obj={unitForm} setObj={setUnitForm} />
              </div>
            </Section>

            <Section title="Ceny">
              <Input label="Cena za m² (Kč)" field="price_per_sqm" type="number" obj={unitForm} setObj={(updater) => {
                setUnitForm(prev => {
                  const next = typeof updater === "function" ? updater(prev) : updater;
                  const priceNet = next.price_per_sqm && next.area ? Math.round(next.price_per_sqm * next.area) : next.price_net;
                  return { ...next, price_net: priceNet };
                });
              }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Cena bez DPH (Kč)</label>
                <div style={{ padding: "8px 12px", borderRadius: 8, background: "#f0f0f0", fontSize: 13, color: "#444" }}>
                  {unitForm.price_net ? Math.round(unitForm.price_net).toLocaleString("cs-CZ") + " Kč" : "—"}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Cena s DPH 12% (Kč)</label>
                <div style={{ padding: "8px 12px", borderRadius: 8, background: "#f0f0f0", fontSize: 13, color: "#444" }}>
                  {unitForm.price_net ? Math.round(unitForm.price_net * 1.12).toLocaleString("cs-CZ") + " Kč" : "—"}
                </div>
              </div>
              <Input label="Akční cena bez DPH (Kč)" field="price_action" type="number" obj={unitForm} setObj={setUnitForm} />
              <Input label="Poznámka k akční ceně" field="price_action_note" obj={unitForm} setObj={setUnitForm} />
              <Input label="Rezervační cena (Kč)" field="price_reservation" type="number" obj={unitForm} setObj={setUnitForm} />
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#1a1a1a", cursor: "pointer", gridColumn: "1 / -1" }}>
                <input type="checkbox" checked={unitForm.price_public !== false}
                  onChange={e => setUnitForm(f => ({ ...f, price_public: e.target.checked }))}
                  style={{ accentColor: "#1D9E75" }} />
                Zobrazit cenu veřejně na webu
              </label>
            </Section>

            <Section title="Fotky bytu">
              <div style={{ gridColumn: "1 / -1" }}>
                <input type="file" accept="image/*" multiple onChange={async (e) => {
                  const files = Array.from(e.target.files);
                  const urls = [];
                  for (const file of files) {
                    const fileName = `units/${Date.now()}-${file.name}`;
                    const { error } = await supabase.storage.from("project-images").upload(fileName, file);
                    if (!error) {
                      const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(fileName);
                      urls.push(urlData.publicUrl);
                    }
                  }
                  setUnitForm(f => ({ ...f, images: [...(Array.isArray(f.images) ? f.images : []), ...urls] }));
                }} style={{ fontSize: 13 }} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {(Array.isArray(unitForm.images) ? unitForm.images : []).map((url, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={url} alt="" style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 8 }} />
                      <button onClick={() => setUnitForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                        style={{ position: "absolute", top: 2, right: 2, background: "#E24B4A", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 11, cursor: "pointer" }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Stav a obchod">
              <Select label="Stav jednotky" field="status" options={["available", "reserved", "sold", "blocked", "withdrawn"]} obj={unitForm} setObj={setUnitForm} />
              <Input label="Kupující / zájemce" field="buyer" obj={unitForm} setObj={setUnitForm} />
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Makléř — jméno</label>
                <input type="text" value={unitForm.agent_name || ""} onChange={e => setUnitForm(f => ({ ...f, agent_name: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Makléř — telefon</label>
                <input type="text" value={unitForm.agent_phone || ""} onChange={e => setUnitForm(f => ({ ...f, agent_phone: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Makléř — email</label>
                <input type="text" value={unitForm.agent_email || ""} onChange={e => setUnitForm(f => ({ ...f, agent_email: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Makléř — webové stránky</label>
                <input type="text" value={unitForm.agent_web || ""} onChange={e => setUnitForm(f => ({ ...f, agent_web: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Fotka makléře</label>
                {unitForm.agent_photo && (
                  <button onClick={() => setUnitForm(f => ({ ...f, agent_photo: "" }))}
                    style={{ fontSize: 12, color: "#E24B4A", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 6 }}>
                    × Odebrat fotku
                  </button>
                )}
                <input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const fileName = `agents/${Date.now()}-${file.name}`;
                  const { error } = await supabase.storage.from("project-images").upload(fileName, file);
                  if (!error) {
                    const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(fileName);
                    setUnitForm(f => ({ ...f, agent_photo: urlData.publicUrl }));
                  }
                }} style={{ fontSize: 13 }} />
                {unitForm.agent_photo && <img src={unitForm.agent_photo} alt="Makler" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "50%", marginTop: 6 }} />}
              </div>
              <Input label="Datum rezervace" field="reserved_at" type="date" obj={unitForm} setObj={setUnitForm} />
              <Input label="Datum podpisu smlouvy" field="contract_signed_at" type="date" obj={unitForm} setObj={setUnitForm} />
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Poznámky</label>
                <textarea value={unitForm.notes || ""} onChange={e => setUnitForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, height: 70, resize: "none", background: "#fafafa", color: "#1a1a1a" }} />
              </div>
            </Section>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={saveUnit} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Uložit</button>
              <button onClick={() => { setView("units"); setUnitForm({}); }} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>Zrušit</button>
            </div>
          </div>
        )}

        {/* TIMELINE */}
        {!loading && view === "milestones" && selectedProject && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <button onClick={() => setView("projects")} style={{ background: "none", border: "none", color: "#1D9E75", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 4 }}>← Projekty</button>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>{selectedProject.name} — Timeline</div>
              </div>
              <button onClick={() => { setMilestoneForm({}); setView("editMilestone"); }} style={{ background: "#1A3A6B", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Nový milník</button>
            </div>

            {/* Ganttův diagram */}
            {milestones.length > 0 && (() => {
              const allDates = milestones.flatMap(m => [m.date_from, m.date_to].filter(Boolean)).map(d => new Date(d));
              const minDate = new Date(Math.min(...allDates));
              const maxDate = new Date(Math.max(...allDates));
              const totalDays = Math.max((maxDate - minDate) / (1000 * 60 * 60 * 24), 1);
              const statusColors = { inactive: "#e0e0e0", active: "#1D9E75", done: "#0F6E56", delayed: "#E24B4A" };
              const statusLabels = { inactive: "Neaktivní", active: "Probíhá", done: "Hotovo", delayed: "Zpožděno" };

              return (
                <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 12, padding: 20, marginBottom: 16, overflowX: "auto" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 14 }}>Ganttův diagram</div>
                  <div style={{ minWidth: 600 }}>
                    {milestones.map(m => {
                      if (!m.date_from || !m.date_to) return null;
                      const start = (new Date(m.date_from) - minDate) / (1000 * 60 * 60 * 24);
                      const duration = (new Date(m.date_to) - new Date(m.date_from)) / (1000 * 60 * 60 * 24);
                      const left = (start / totalDays) * 100;
                      const width = Math.max((duration / totalDays) * 100, 1);
                      const color = statusColors[m.status] || "#e0e0e0";
                      const today = new Date();
                      const isDelayed = m.status !== "done" && new Date(m.date_to) < today;

                      return (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 10 }}>
                          <div style={{ width: 160, fontSize: 11, color: "#333", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                          <div style={{ flex: 1, height: 24, background: "#f4f4f4", borderRadius: 4, position: "relative" }}>
                            <div style={{
                              position: "absolute", left: `${left}%`, width: `${width}%`,
                              height: "100%", background: isDelayed ? "#E24B4A" : color,
                              borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 6,
                              minWidth: 4,
                            }}>
                              {width > 8 && <span style={{ fontSize: 9, color: "#fff", whiteSpace: "nowrap" }}>{m.date_from} – {m.date_to}</span>}
                            </div>
                          </div>
                          <div style={{ width: 80, fontSize: 10, color: "#888", flexShrink: 0 }}>{statusLabels[m.status] || m.status}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
                    {Object.entries({ inactive: "Neaktivní", active: "Probíhá", done: "Hotovo", delayed: "Zpožděno" }).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#888" }}>
                        <div style={{ width: 12, height: 12, borderRadius: 2, background: { inactive: "#e0e0e0", active: "#1D9E75", done: "#0F6E56", delayed: "#E24B4A" }[k] }} />
                        {v}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Seznam milníků */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {milestones.map(m => {
                const today = new Date();
                const isDelayed = m.status !== "done" && m.date_to && new Date(m.date_to) < today;
                const isSoon = m.status !== "done" && m.date_to && new Date(m.date_to) - today < 30 * 24 * 60 * 60 * 1000;
                return (
                  <div key={m.id} style={{ background: "#fff", border: `0.5px solid ${isDelayed ? "#E24B4A" : "#e8e8e8"}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{m.name}</div>
                        {isDelayed && <span style={{ fontSize: 10, background: "#FCEBEB", color: "#A32D2D", padding: "2px 8px", borderRadius: 20 }}>Zpožděno</span>}
                        {isSoon && !isDelayed && <span style={{ fontSize: 10, background: "#FAEEDA", color: "#633806", padding: "2px 8px", borderRadius: 20 }}>Blíží se</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                        {m.date_from} – {m.date_to}
                        {m.responsible && ` · 👤 ${m.responsible}`}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <select value={m.status} onChange={async e => {
                        await supabase.from("milestones").update({ status: e.target.value }).eq("id", m.id);
                        loadMilestones(selectedProject);
                      }} style={{ padding: "5px 8px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 12, background: "#fafafa" }}>
                        <option value="inactive">Neaktivní</option>
                        <option value="active">Probíhá</option>
                        <option value="done">Hotovo</option>
                        <option value="delayed">Zpožděno</option>
                      </select>
                      <button onClick={() => { setMilestoneForm(m); setView("editMilestone"); }} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Upravit</button>
                      <button onClick={() => deleteMilestone(m.id)} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Smazat</button>
                    </div>
                  </div>
                );
              })}
              {milestones.length === 0 && <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Žádné milníky. Přidejte první.</div>}
            </div>
          </>
        )}

        {/* EDIT MILESTONE */}
        {!loading && view === "editMilestone" && (
          <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 12, padding: 24 }}>
            <button onClick={() => { setView("milestones"); setMilestoneForm({}); }} style={{ background: "none", border: "none", color: "#1D9E75", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 12 }}>← Timeline</button>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 20 }}>{milestoneForm.id ? "Upravit milník" : "Nový milník"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Název milníku *</label>
                <input type="text" value={milestoneForm.name || ""} onChange={e => setMilestoneForm(f => ({ ...f, name: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Datum od</label>
                <input type="date" value={milestoneForm.date_from || ""} onChange={e => setMilestoneForm(f => ({ ...f, date_from: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Datum do</label>
                <input type="date" value={milestoneForm.date_to || ""} onChange={e => setMilestoneForm(f => ({ ...f, date_to: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Odpovědná osoba</label>
                <input type="text" value={milestoneForm.responsible || ""} onChange={e => setMilestoneForm(f => ({ ...f, responsible: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Stav</label>
                <select value={milestoneForm.status || "inactive"} onChange={e => setMilestoneForm(f => ({ ...f, status: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }}>
                  <option value="inactive">Neaktivní</option>
                  <option value="active">Probíhá</option>
                  <option value="done">Hotovo</option>
                  <option value="delayed">Zpožděno</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Poznámky</label>
                <textarea value={milestoneForm.notes || ""} onChange={e => setMilestoneForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, height: 70, resize: "none", background: "#fafafa", color: "#1a1a1a" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={saveMilestone} style={{ background: "#1A3A6B", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Uložit</button>
              <button onClick={() => { setView("milestones"); setMilestoneForm({}); }} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>Zrušit</button>
            </div>
          </div>
        )}

        {/* NASTAVENÍ */}
        {!loading && view === "settings" && (
          <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 20 }}>Nastavení webu</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                ["hero_label", "Malý text nahoře"],
                ["hero_title", "Hlavní nadpis"],
                ["hero_subtitle", "Podnadpis"],
                ["company_name", "Název firmy"],
                ["phone", "Telefon"],
                ["agent_name", "Jméno makléře"],
                ["agent_phone", "Telefon makléře"],
                ["agent_email", "Email makléře"],
              ].map(([key, label]) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>{label}</label>
                  <input type="text" value={settings[key] || ""} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Logo firmy</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const fileName = `settings/logo-${Date.now()}-${file.name}`;
                const { error } = await supabase.storage.from("project-images").upload(fileName, file);
                if (!error) {
                  const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(fileName);
                  setSettings(s => ({ ...s, company_logo: urlData.publicUrl }));
                }
              }} style={{ fontSize: 13 }} />
              {settings.company_logo && <img src={settings.company_logo} alt="Logo" style={{ height: 50, objectFit: "contain", marginTop: 4 }} />}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Fotka makléře</label>
              <input type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const fileName = `settings/agent-${Date.now()}-${file.name}`;
                const { error } = await supabase.storage.from("project-images").upload(fileName, file);
                if (!error) {
                  const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(fileName);
                  setSettings(s => ({ ...s, agent_photo: urlData.publicUrl }));
                }
              }} style={{ fontSize: 13 }} />
              {settings.agent_photo && <img src={settings.agent_photo} alt="Makler" style={{ height: 80, width: 80, objectFit: "cover", borderRadius: "50%", marginTop: 4 }} />}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={async () => {
                setSettingsLoading(true);
                for (const [key, value] of Object.entries(settings)) {
                  await supabase.from("settings").upsert({ key, value });
                }
                setSettingsLoading(false);
                alert("Nastavení uloženo!");
              }} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {settingsLoading ? "Ukládám..." : "Uložit nastavení"}
              </button>
              <button onClick={() => setView("projects")} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>Zrušit</button>
            </div>
          </div>
        )}

      {pdfEditor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "95vw", maxWidth: 1100, maxHeight: "95vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "0.5px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Upravit PDF nabídku</div>
              <button onClick={() => setPdfEditor(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999" }}>×</button>
            </div>
            <div style={{ padding: "18px", overflow: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                ["Název projektu", "name", "project"],
                ["Adresa", "address", "project"],
                ["Číslo bytu", "unit_number", "unit"],
                ["Dispozice", "disp", "unit"],
                ["Plocha (m²)", "area", "unit"],
                ["Patro", "floor", "unit"],
                ["Cena bez DPH", "price_net", "unit"],
                ["Cena za m²", "price_per_sqm", "unit"],
                ["Jméno makléře", "agent_name", "unit"],
                ["Telefon makléře", "agent_phone", "unit"],
              ].map(([label, field, obj]) => (
                <div key={field} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>{label}</label>
                  <input type="text" value={pdfEditor[obj][field] || ""}
                    onChange={e => setPdfEditor(prev => ({
                      ...prev,
                      [obj]: { ...prev[obj], [field]: e.target.value }
                    }))}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }}
                  />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Poznámka pro klienta</label>
                <textarea value={pdfEditor.unit.pdf_note || ""}
                  onChange={e => setPdfEditor(prev => ({ ...prev, unit: { ...prev.unit, pdf_note: e.target.value } }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, height: 80, resize: "none", background: "#fafafa", color: "#1a1a1a" }}
                  placeholder="Volitelná poznámka která se zobrazí v PDF..."
                />
              </div>
            </div>
            <div style={{ padding: "0 18px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ borderTop: "0.5px solid #eee", paddingTop: 14, marginTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>Design PDF</div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "#666", fontWeight: 500, display: "block", marginBottom: 6 }}>Šablona</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[["minimal", "Minimalistická"], ["premium", "Prémiová"], ["color", "Barevná"]].map(([val, lbl]) => (
                        <button key={val} onClick={() => setPdfEditor(prev => ({ ...prev, template: val }))}
                          style={{ flex: 1, padding: "8px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "none",
                            background: pdfEditor.template === val ? "#1D9E75" : "#f0f0f0",
                            color: pdfEditor.template === val ? "#fff" : "#333" }}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: "#666", fontWeight: 500, display: "block", marginBottom: 4 }}>Barva hlavičky</label>
                      <input type="color" value={pdfEditor.colorHeader}
                        onChange={e => setPdfEditor(prev => ({ ...prev, colorHeader: e.target.value }))}
                        style={{ width: "100%", height: 36, borderRadius: 8, border: "0.5px solid #ddd", cursor: "pointer" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#666", fontWeight: 500, display: "block", marginBottom: 4 }}>Barva ceny</label>
                      <input type="color" value={pdfEditor.colorPrice}
                        onChange={e => setPdfEditor(prev => ({ ...prev, colorPrice: e.target.value }))}
                        style={{ width: "100%", height: 36, borderRadius: 8, border: "0.5px solid #ddd", cursor: "pointer" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: "#666", fontWeight: 500, display: "block", marginBottom: 4 }}>Barva akcentu</label>
                      <input type="color" value={pdfEditor.colorAccent}
                        onChange={e => setPdfEditor(prev => ({ ...prev, colorAccent: e.target.value }))}
                        style={{ width: "100%", height: 36, borderRadius: 8, border: "0.5px solid #ddd", cursor: "pointer" }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: "#666", fontWeight: 500, display: "block", marginBottom: 6 }}>Poloha fotek</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[["top", "Nahoře"], ["bottom", "Dole"], ["none", "Skrýt"]].map(([val, lbl]) => (
                        <button key={val} onClick={() => setPdfEditor(prev => ({ ...prev, photosPosition: val }))}
                          style={{ flex: 1, padding: "7px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "none",
                            background: pdfEditor.photosPosition === val ? "#1D9E75" : "#f0f0f0",
                            color: pdfEditor.photosPosition === val ? "#fff" : "#333" }}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: "#666", fontWeight: 500, display: "block", marginBottom: 6 }}>Poloha makléře</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[["bottom", "Dole"], ["right", "Vpravo"], ["none", "Skrýt"]].map(([val, lbl]) => (
                        <button key={val} onClick={() => setPdfEditor(prev => ({ ...prev, agentPosition: val }))}
                          style={{ flex: 1, padding: "7px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "none",
                            background: pdfEditor.agentPosition === val ? "#1D9E75" : "#f0f0f0",
                            color: pdfEditor.agentPosition === val ? "#fff" : "#333" }}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: "#666", fontWeight: 500, display: "block", marginBottom: 6 }}>Velikost ceny</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[["large", "Velká"], ["small", "Malá"]].map(([val, lbl]) => (
                        <button key={val} onClick={() => setPdfEditor(prev => ({ ...prev, priceSize: val }))}
                          style={{ flex: 1, padding: "7px", borderRadius: 8, fontSize: 12, cursor: "pointer", border: "none",
                            background: pdfEditor.priceSize === val ? "#1D9E75" : "#f0f0f0",
                            color: pdfEditor.priceSize === val ? "#fff" : "#333" }}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Velikost fotky makléře</label>
                <input type="range" min="50" max="200" value={pdfEditor.agentPhotoSize}
                  onChange={e => setPdfEditor(prev => ({ ...prev, agentPhotoSize: parseInt(e.target.value) }))}
                  style={{ width: "100%" }} />
                <div style={{ fontSize: 11, color: "#999", textAlign: "center" }}>{pdfEditor.agentPhotoSize} px</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Tvar fotky makléře</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["circle", "Kulatá"], ["square", "Čtvercová"], ["rounded", "Zaoblená"]].map(([val, lbl]) => (
                    <button key={val} onClick={() => setPdfEditor(prev => ({ ...prev, agentPhotoShape: val }))}
                      style={{ flex: 1, padding: "7px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                        background: pdfEditor.agentPhotoShape === val ? "#1D9E75" : "#f0f0f0",
                        color: pdfEditor.agentPhotoShape === val ? "#fff" : "#333",
                        border: "none" }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: "12px 18px", borderTop: "0.5px solid #eee", display: "flex", gap: 8 }}>
              <button onClick={async () => {
                const { previewUnitPDF } = await import("./UnitPDF");
                const url = await previewUnitPDF(pdfEditor.project, pdfEditor.unit, {
                  agentPhotoSize: pdfEditor.agentPhotoSize,
                  agentPhotoShape: pdfEditor.agentPhotoShape,
                  template: pdfEditor.template,
                  colorHeader: pdfEditor.colorHeader,
                  colorPrice: pdfEditor.colorPrice,
                  colorAccent: pdfEditor.colorAccent,
                  photosPosition: pdfEditor.photosPosition,
                  agentPosition: pdfEditor.agentPosition,
                  priceSize: pdfEditor.priceSize,
                });
                setPdfPreview(url);
              }} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", flex: 1 }}>
                Zobrazit náhled
              </button>
              <button onClick={() => setPdfEditor(null)} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, cursor: "pointer" }}>
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {pdfPreview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "80vw", height: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Náhled PDF</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setPdfPreview(null)} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer" }}>
                  ← Upravit
                </button>
                <a href={pdfPreview} download="nabidka.pdf" style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
                  Stáhnout
                </a>
                <button onClick={() => { setPdfPreview(null); setPdfEditor(null); }} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer" }}>
                  Zavřít
                </button>
              </div>
            </div>
            <iframe src={pdfPreview} style={{ flex: 1, border: "none" }} title="PDF náhled" />
          </div>
        </div>
      )}

      </div>
    </div>
  );
}