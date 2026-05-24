/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

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
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});
  const [unitForm, setUnitForm] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
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
                    <button onClick={() => loadUnits(p)} style={{ background: "#E1F5EE", color: "#0F6E56", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>Byty</button>
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
              </div>
              <button onClick={() => { setUnitForm({}); setView("editUnit"); }} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Nový byt</button>
            </div>
            {selectedProject.units?.length === 0 && <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Žádné byty.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedProject.units?.map(u => {
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
              <Input label="Cena bez DPH (Kč)" field="price_net" type="number" obj={unitForm} setObj={setUnitForm} />
              <Input label="Cena s DPH (Kč)" field="price_vat" type="number" obj={unitForm} setObj={setUnitForm} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Cena za m² (automaticky)</label>
                <div style={{ padding: "8px 12px", borderRadius: 8, background: "#f0f0f0", fontSize: 13, color: "#666" }}>
                  {unitForm.price_net && unitForm.area ? Math.round(unitForm.price_net / unitForm.area).toLocaleString("cs-CZ") + " Kč/m²" : "—"}
                </div>
              </div>
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
              ].map(([key, label]) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>{label}</label>
                  <input type="text" value={settings[key] || ""} onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
                </div>
              ))}
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

      </div>
    </div>
  );
}