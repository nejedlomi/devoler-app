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

function PriceHistory({ unitId }) {
  const [priceHistory, setPriceHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div style={{ marginTop: 16, borderTop: "0.5px solid #eee", paddingTop: 16 }}>
      <button onClick={async () => {
        if (!showHistory) {
          const { data } = await supabase.from("price_history").select("*").eq("unit_id", unitId).order("changed_at", { ascending: false });
          setPriceHistory(data || []);
        }
        setShowHistory(s => !s);
      }} style={{ background: "none", border: "none", color: "#1A3A6B", fontSize: 13, cursor: "pointer", padding: 0, fontWeight: 500 }}>
        {showHistory ? "▼" : "▶"} Historie změn ceny
      </button>
      {showHistory && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {priceHistory.length === 0 ? (
            <div style={{ fontSize: 12, color: "#aaa" }}>Žádné změny ceny.</div>
          ) : priceHistory.map(h => (
            <div key={h.id} style={{ background: "#f7f7f5", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#1a1a1a", fontWeight: 600 }}>{h.price_net?.toLocaleString("cs-CZ")} Kč</span>
              <span style={{ color: "#999" }}>{h.price_per_sqm?.toLocaleString("cs-CZ")} Kč/m²</span>
              <span style={{ color: "#aaa" }}>{new Date(h.changed_at).toLocaleDateString("cs-CZ")}</span>
              <span style={{ color: "#aaa" }}>{h.changed_by}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommunicationLog({ contactId, supabase }) {
  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState("");
  const [logType, setLogType] = useState("note");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("communication_log").select("*").eq("contact_id", contactId).order("created_at", { ascending: false });
      setLogs(data || []);
      setLoaded(true);
    };
    load();
  }, [contactId]);

  const addLog = async () => {
    if (!newLog.trim()) return;
    await supabase.from("communication_log").insert({ contact_id: contactId, type: logType, content: newLog });
    setNewLog("");
    const { data } = await supabase.from("communication_log").select("*").eq("contact_id", contactId).order("created_at", { ascending: false });
    setLogs(data || []);
  };

  const typeIcon = { note: "📝", call: "📞", email: "✉️", meeting: "🤝", sms: "💬" };
  const typeLabel = { note: "Poznámka", call: "Hovor", email: "E-mail", meeting: "Schůzka", sms: "SMS" };

  return (
    <div style={{ marginTop: 20, borderTop: "0.5px solid #eee", paddingTop: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>Historie komunikace</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <select value={logType} onChange={e => setLogType(e.target.value)}
          style={{ padding: "8px 10px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa" }}>
          {Object.entries(typeLabel).map(([val, lbl]) => <option key={val} value={val}>{typeIcon[val]} {lbl}</option>)}
        </select>
        <input type="text" value={newLog} onChange={e => setNewLog(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addLog()}
          placeholder="Přidat záznam... (Enter pro uložení)"
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa" }} />
        <button onClick={addLog} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
          Přidat
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
        {logs.length === 0 && loaded && <div style={{ fontSize: 12, color: "#aaa", textAlign: "center", padding: 10 }}>Žádná komunikace.</div>}
        {logs.map(l => (
          <div key={l.id} style={{ background: "#f7f7f5", borderRadius: 8, padding: "8px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16 }}>{typeIcon[l.type] || "📝"}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "#1a1a1a" }}>{l.content}</div>
              <div style={{ fontSize: 10, color: "#aaa", marginTop: 3 }}>
                {new Date(l.created_at).toLocaleDateString("cs-CZ")} {new Date(l.created_at).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })} · {l.created_by}
              </div>
            </div>
          </div>
        ))}
      </div>
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
  const [filterStatus, setFilterStatus] = useState("Vše");
  const [filterBuilding, setFilterBuilding] = useState("Vše");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [milestones, setMilestones] = useState([]);
  const [milestoneForm, setMilestoneForm] = useState({});
  const [contacts, setContacts] = useState([]);
  const [contactForm, setContactForm] = useState({});
  const [contactSearch, setContactSearch] = useState("");
  const [leads, setLeads] = useState([]);
  const [leadForm, setLeadForm] = useState({});
  const [reservations, setReservations] = useState([]);
  const [reservationForm, setReservationForm] = useState({});
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
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

  useEffect(() => { 
    loadProjects(); 
    loadSettings(); 
    loadContactsData();
    loadLeadsData();
    loadReservationsData();
    loadDismissedAlerts();
    setView("dashboard"); 
  }, []);

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

  const loadContactsData = async () => {
    const { data } = await supabase.from("contacts").select("*, projects(name), units(unit_number, disp)").order("created_at", { ascending: false });
    setContacts(data || []);
  };

  const loadLeadsData = async () => {
    const { data } = await supabase.from("leads").select("*, contacts(name, phone, email), projects(name)").order("created_at", { ascending: false });
    setLeads(data || []);
  };

  const loadReservationsData = async () => {
    const { data } = await supabase.from("reservations").select("*, contacts(name, phone), units(unit_number, disp, area)").order("created_at", { ascending: false });
    setReservations(data || []);
  };

  const loadDismissedAlerts = async () => {
    const { data } = await supabase.from("dismissed_alerts").select("alert_key");
    setDismissedAlerts((data || []).map(d => d.alert_key));
  };

  const dismissAlert = async (key) => {
    await supabase.from("dismissed_alerts").upsert({ alert_key: key });
    setDismissedAlerts(prev => [...prev, key]);
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
    if (unitForm.id) {
      const { data: old } = await supabase.from("units").select("price_net, price_per_sqm, status").eq("id", unitForm.id).single();
      await supabase.from("units").update(data).eq("id", unitForm.id);
      if (old && (old.price_net !== unitForm.price_net)) {
        await supabase.from("price_history").insert({
          unit_id: unitForm.id,
          price_net: unitForm.price_net,
          price_per_sqm: pricePerM2,
          changed_by: "Admin",
        });
      }
      // Automatická rezervace
      if (old && old.status !== "reserved" && unitForm.status === "reserved") {
        setUnitForm({});
        loadUnits(selectedProject);
        if (window.confirm("Byt byl nastaven jako rezervovaný. Chcete vytvořit rezervaci?")) {
          setReservationForm({
            unit_id: unitForm.id,
            reserved_at: new Date().toISOString().split("T")[0],
            status: "active",
          });
          setView("editReservation");
        }
        return;
      }
    } else {
      await supabase.from("units").insert({ ...data, project_id: selectedProject.id });
    }
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

  const loadContacts = async () => {
    setLoading(true);
    await loadContactsData();
    setLoading(false);
    setView("contacts");
  };

  const saveContact = async () => {
    if (contactForm.id) {
      await supabase.from("contacts").update(contactForm).eq("id", contactForm.id);
    } else {
      await supabase.from("contacts").insert(contactForm);
    }
    setContactForm({});
    loadContacts();
  };

  const deleteContact = async (id) => {
    if (!window.confirm("Smazat kontakt?")) return;
    await supabase.from("contacts").delete().eq("id", id);
    loadContacts();
  };

  const loadLeads = async () => {
    setLoading(true);
    await loadLeadsData();
    setLoading(false);
    setView("leads");
  };

  const saveLead = async () => {
    if (leadForm.id) { await supabase.from("leads").update(leadForm).eq("id", leadForm.id); }
    else { await supabase.from("leads").insert(leadForm); }
    setLeadForm({});
    loadLeads();
  };

  const deleteLead = async (id) => {
    if (!window.confirm("Smazat lead?")) return;
    await supabase.from("leads").delete().eq("id", id);
    loadLeads();
  };

  const loadReservations = async () => {
    setLoading(true);
    await loadReservationsData();
    setLoading(false);
    setView("reservations");
  };

  const saveReservation = async () => {
    const { _project_id, _project_units, ...cleanForm } = reservationForm;
    if (cleanForm.id) {
      await supabase.from("reservations").update(cleanForm).eq("id", cleanForm.id);
    } else {
      await supabase.from("reservations").insert(cleanForm);
      if (cleanForm.unit_id) {
        await supabase.from("units").update({ status: "reserved" }).eq("id", cleanForm.unit_id);
      }
    }
    setReservationForm({});
    await Promise.all([loadReservationsData(), loadLeadsData(), loadContactsData(), loadProjects()]);
    if (selectedProject) {
      await loadUnits(selectedProject);
    } else {
      setView("reservations");
    }
  };

  const deleteReservation = async (id) => {
    if (!window.confirm("Smazat rezervaci?")) return;
    await supabase.from("reservations").delete().eq("id", id);
    loadReservations();
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
          <button onClick={async () => {
            await loadReservationsData();
            await loadLeadsData();
            await loadContactsData();
            await loadProjects();
            setView("dashboard");
          }} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#9FE1CB", cursor: "pointer" }}>📊 Dashboard</button>
          <button onClick={() => { loadContacts(); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#9FE1CB", cursor: "pointer" }}>👥 Kontakty</button>
          <button onClick={() => loadLeads()} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#9FE1CB", cursor: "pointer" }}>🎯 Pipeline</button>
          <button onClick={() => loadReservations()} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#9FE1CB", cursor: "pointer" }}>📋 Rezervace</button>
          <button onClick={() => setView("settings")} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "#9FE1CB", cursor: "pointer" }}>⚙️ Nastavení</button>
          <a href="/" style={{ fontSize: 13, color: "#9FE1CB", textDecoration: "none" }}>← Zpět na web</a>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

        {loading && <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Načítám...</div>}

        {/* DASHBOARD */}
        {!loading && view === "dashboard" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>Dashboard</div>
              <button onClick={async () => {
                const res = await fetch("https://trgmooampugduekngpxb.supabase.co/functions/v1/send-expiry-alert", {
                  headers: { "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZ21vb2FtcHVnZHVla25ncHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Njk5NTIsImV4cCI6MjA5NTE0NTk1Mn0.MlEpjp1Zd__n837vv3N54y-c-lNtrHQp56Nprm5T4UE` }
                });
                const data = await res.json();
                if (data.count === 0) {
                  alert("Žádné expirující rezervace v příštích 3 dnech.");
                } else {
                  alert(`⚠️ ${data.count} expirujících rezervací:\n${data.alerts.map(a => `• ${a.contact} — expiruje ${a.valid_until}`).join("\n")}`);
                }
              }} style={{ background: "#FAEEDA", color: "#633806", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
                🔔 Zkontrolovat expirující rezervace
              </button>
            </div>

            {(() => {
              const today = new Date();
              const warnings = [];
              if (warnings.length === 0) {
                const delayedProjects = projects.filter(p => p.completion && new Date(p.completion.replace("Q1", "03-31").replace("Q2", "06-30").replace("Q3", "09-30").replace("Q4", "12-31")) < today);
                delayedProjects.forEach(p => warnings.push({ type: "delayed", key: `delayed-${p.id}`, text: `Projekt ${p.name} má termín dokončení v minulosti` }));
              }
              reservations.filter(r => r.valid_until && new Date(r.valid_until) - new Date() < 3 * 24 * 60 * 60 * 1000 && new Date(r.valid_until) > new Date()).forEach(r => {
                warnings.push({ type: "reservation", key: `reservation-${r.id}`, text: `Rezervace ${r.contacts?.name || "—"} expiruje ${r.valid_until}` });
              });
              leads.filter(l => l.next_contact_date && new Date(l.next_contact_date) < new Date()).forEach(l => {
                warnings.push({ type: "lead", key: `lead-${l.id}`, text: `Lead ${l.contacts?.name || "—"} — prošel termín kontaktu (${l.next_contact_date})` });
              });
              const visibleWarnings = warnings.filter(w => !dismissedAlerts.includes(w.key));
              return visibleWarnings.length > 0 ? (
                <div style={{ background: "#FCEBEB", border: "0.5px solid #E24B4A", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#A32D2D", marginBottom: 8 }}>⚠️ Upozornění</div>
                  {visibleWarnings.map((w, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#A32D2D", marginBottom: 4 }}>
                      <span>• {w.text}</span>
                      <button onClick={() => dismissAlert(w.key)} style={{ background: "none", border: "0.5px solid #A32D2D", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: "#A32D2D", cursor: "pointer", marginLeft: 10 }}>
                        ✓ Vzato na vědomí
                      </button>
                    </div>
                  ))}
                </div>
              ) : null;
            })()}

            {/* Statistiky */}
            {(() => {
              const totalUnits = projects.reduce((s, p) => s + (p.total_units || 0), 0);
              const soldUnits = projects.reduce((s, p) => s + (p.sold_units || 0), 0);
              const availUnits = totalUnits - soldUnits;

              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                  {[
                    ["🏗", "Projekty", projects.length, "#1A3A6B"],
                    ["🏠", "Celkem bytů", totalUnits, "#1D9E75"],
                    ["✅", "Prodáno", soldUnits, "#0F6E56"],
                    ["🔓", "Volných", availUnits, "#633806"],
                    ["🎯", "Leads", leads.length, "#7A4A0A"],
                    ["📋", "Rezervace", reservations.length, "#4A3A9A"],
                    ["⚠️", "Expirující", reservations.filter(r => r.valid_until && new Date(r.valid_until) - new Date() < 3 * 24 * 60 * 60 * 1000 && new Date(r.valid_until) > new Date()).length, "#A32D2D"],
                    ["👥", "Kontakty", contacts.length, "#0F6E56"],
                  ].map(([icon, label, value, color]) => (
                    <div key={label} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 12, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
                      <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Projekty přehled */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {projects.map(p => {
                const avail = p.total_units - p.sold_units;
                const pct = p.total_units > 0 ? Math.round((p.sold_units / p.total_units) * 100) : 0;
                const isSoon = p.total_units === 0;
                return (
                  <div key={p.id} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 12, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>📍 {p.location}</div>
                      </div>
                      <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: isSoon ? "#FAEEDA" : avail === 0 ? "#f0f0f0" : "#E1F5EE", color: isSoon ? "#633806" : avail === 0 ? "#666" : "#0F6E56", fontWeight: 500 }}>
                        {isSoon ? "Připravujeme" : avail === 0 ? "Vyprodáno" : `${avail} volných`}
                      </span>
                    </div>
                    <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3, marginBottom: 8 }}>
                      <div style={{ height: 6, width: `${pct}%`, background: pct === 100 ? "#aaa" : "#1D9E75", borderRadius: 3 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999" }}>
                      <span>Prodáno {pct}%</span>
                      <span>Dokončení {p.completion}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <button onClick={() => loadUnits(p)} style={{ flex: 1, background: "#E1F5EE", color: "#0F6E56", border: "none", borderRadius: 8, padding: "7px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>Byty</button>
                      <button onClick={() => loadMilestones(p)} style={{ flex: 1, background: "#EEF3FA", color: "#1A3A6B", border: "none", borderRadius: 8, padding: "7px", fontSize: 12, cursor: "pointer" }}>Timeline</button>
                      <button onClick={() => { setForm(p); setView("editProject"); }} style={{ flex: 1, background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "7px", fontSize: 12, cursor: "pointer" }}>Upravit</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

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
              <button onClick={async () => {
                const { generateCenikPDF } = await import("./CenikPDF");
                generateCenikPDF(selectedProject, selectedProject.units);
              }} style={{ background: "#E1F5EE", color: "#0F6E56", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                📄 Export PDF ceník
              </button>
            </div>
            {(() => {
              const dispTypes = ["Vše", ...new Set(selectedProject.units?.map(u => u.disp).filter(Boolean))];
              const buildings = ["Vše", ...new Set(selectedProject.units?.map(u => u.building).filter(Boolean))];
              return (
                <>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {dispTypes.map(d => (
                        <button key={d} onClick={() => setFilterDisp(d)} style={{
                          border: filterDisp === d ? "none" : "0.5px solid #ddd",
                          borderRadius: 20, padding: "5px 14px", fontSize: 12, cursor: "pointer",
                          background: filterDisp === d ? "#1D9E75" : "#fff",
                          color: filterDisp === d ? "#fff" : "#555",
                        }}>{d}</button>
                      ))}
                    </div>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: "5px 10px", borderRadius: 20, border: "0.5px solid #ddd", fontSize: 12, background: "#fff", cursor: "pointer" }}>
                      <option value="Vše">Všechny stavy</option>
                      <option value="available">Volné</option>
                      <option value="reserved">Rezervované</option>
                      <option value="sold">Prodané</option>
                      <option value="blocked">Blokované</option>
                    </select>
                    {buildings.length > 1 && (
                      <select value={filterBuilding} onChange={e => setFilterBuilding(e.target.value)} style={{ padding: "5px 10px", borderRadius: 20, border: "0.5px solid #ddd", fontSize: 12, background: "#fff", cursor: "pointer" }}>
                        {buildings.map(b => <option key={b} value={b}>{b === "Vše" ? "Všechny budovy" : `Budova ${b}`}</option>)}
                      </select>
                    )}
                    <input type="number" placeholder="Max. cena Kč" value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)}
                      style={{ padding: "5px 12px", borderRadius: 20, border: "0.5px solid #ddd", fontSize: 12, width: 140 }} />
                    {(filterDisp !== "Vše" || filterStatus !== "Vše" || filterBuilding !== "Vše" || filterPriceMax) && (
                      <button onClick={() => { setFilterDisp("Vše"); setFilterStatus("Vše"); setFilterBuilding("Vše"); setFilterPriceMax(""); }}
                        style={{ padding: "5px 12px", borderRadius: 20, border: "0.5px solid #E24B4A", fontSize: 12, background: "#FCEBEB", color: "#A32D2D", cursor: "pointer" }}>
                        × Reset filtrů
                      </button>
                    )}
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
              {selectedProject.units?.filter(u => {
                if (filterDisp !== "Vše" && u.disp !== filterDisp) return false;
                if (filterStatus !== "Vše" && u.status !== filterStatus) return false;
                if (filterBuilding !== "Vše" && u.building !== filterBuilding) return false;
                if (filterPriceMax && (u.price_net || u.price || 0) > parseInt(filterPriceMax)) return false;
                return true;
              })?.map(u => {
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

            {unitForm.id && <PriceHistory unitId={unitForm.id} />}

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
              <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setMilestoneForm({}); setView("editMilestone"); }} style={{ background: "#1A3A6B", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Nový milník</button>
              <button onClick={async () => {
                if (!window.confirm("Přidat typické milníky projektu?")) return;
                const typicke = [
                  { name: "Akvizice pozemku", order_index: 0 },
                  { name: "Studie proveditelnosti", order_index: 1 },
                  { name: "Dokumentace pro povolení", order_index: 2 },
                  { name: "Stavební povolení", order_index: 3 },
                  { name: "Výběr dodavatele", order_index: 4 },
                  { name: "Zahájení výstavby", order_index: 5 },
                  { name: "Hrubá stavba", order_index: 6 },
                  { name: "Klientské změny", order_index: 7 },
                  { name: "Kolaudace", order_index: 8 },
                  { name: "Předání jednotek", order_index: 9 },
                  { name: "Exit / prodej projektu", order_index: 10 },
                ];
                await supabase.from("milestones").insert(typicke.map(m => ({ ...m, project_id: selectedProject.id, status: "inactive" })));
                loadMilestones(selectedProject);
              }} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, cursor: "pointer" }}>
                📋 Typické milníky
              </button>
              </div>
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
                        <div key={m.id}>
                          <div style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 10 }}>
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
                          {m.depends_on && (() => {
                            const dep = milestones.find(d => d.id === m.depends_on);
                            return dep ? <div style={{ fontSize: 10, color: "#999", marginLeft: 170, marginTop: -4, marginBottom: 2 }}>↳ závisí na: <strong>{dep.name}</strong></div> : null;
                          })()}
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
                        {m.depends_on && (() => {
                          const dep = milestones.find(d => d.id === m.depends_on);
                          return dep && dep.status !== "done" ? (
                            <span style={{ fontSize: 10, background: "#FAEEDA", color: "#633806", padding: "2px 8px", borderRadius: 20 }}>⚠️ Čeká na: {dep.name}</span>
                          ) : null;
                        })()}
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
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Závisí na milníku</label>
                <select value={milestoneForm.depends_on || ""} onChange={e => setMilestoneForm(f => ({ ...f, depends_on: e.target.value || null }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }}>
                  <option value="">-- bez závislosti --</option>
                  {milestones.filter(m => m.id !== milestoneForm.id).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
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

        {/* KONTAKTY */}
        {!loading && view === "contacts" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>Kontakty ({contacts.length})</div>
              <button onClick={() => { setContactForm({}); setView("editContact"); }} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Nový kontakt</button>
            </div>

            <input type="text" placeholder="Hledat kontakt..." value={contactSearch} onChange={e => setContactSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "0.5px solid #ddd", fontSize: 13, marginBottom: 14, boxSizing: "border-box", background: "#fff" }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {contacts.filter(c => !contactSearch || c.name?.toLowerCase().includes(contactSearch.toLowerCase()) || c.email?.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone?.includes(contactSearch)).map(c => {
                const statusColors = { lead: { bg: "#EEF3FA", color: "#1A3A6B" }, interested: { bg: "#FAEEDA", color: "#633806" }, reserved: { bg: "#E1F5EE", color: "#0F6E56" }, buyer: { bg: "#0F6E56", color: "#fff" }, lost: { bg: "#f0f0f0", color: "#666" } };
                const statusLabels = { lead: "Zájemce", interested: "Má zájem", reserved: "Rezervoval", buyer: "Kupující", lost: "Ztracen" };
                const sc = statusColors[c.status] || statusColors.lead;
                return (
                  <div key={c.id} style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{c.name}</div>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: sc.bg, color: sc.color, fontWeight: 500 }}>{statusLabels[c.status] || c.status}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#999" }}>
                        {c.phone && `📞 ${c.phone}`}
                        {c.email && ` · ✉️ ${c.email}`}
                        {c.projects?.name && ` · 🏗 ${c.projects.name}`}
                        {c.units?.unit_number && ` · Byt č. ${c.units.unit_number} (${c.units.disp})`}
                      </div>
                      {c.note && <div style={{ fontSize: 12, color: "#aaa", marginTop: 4, fontStyle: "italic" }}>{c.note}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setContactForm(c); setView("editContact"); }} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Upravit</button>
                      <button onClick={() => deleteContact(c.id)} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Smazat</button>
                    </div>
                  </div>
                );
              })}
              {contacts.length === 0 && <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Žádné kontakty.</div>}
            </div>
          </>
        )}

        {/* EDIT KONTAKT */}
        {!loading && view === "editContact" && (
          <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 12, padding: 24 }}>
            <button onClick={() => { setView("contacts"); setContactForm({}); }} style={{ background: "none", border: "none", color: "#1D9E75", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 12 }}>← Kontakty</button>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 20 }}>{contactForm.id ? "Upravit kontakt" : "Nový kontakt"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Jméno a příjmení *</label>
                <input type="text" value={contactForm.name || ""} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Telefon</label>
                <input type="text" value={contactForm.phone || ""} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>E-mail</label>
                <input type="email" value={contactForm.email || ""} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Typ kontaktu</label>
                <select value={contactForm.type || "zajemce"} onChange={e => setContactForm(f => ({ ...f, type: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }}>
                  <option value="zajemce">Zájemce</option>
                  <option value="kupujici">Kupující</option>
                  <option value="investor">Investor</option>
                  <option value="makler">Makléř</option>
                  <option value="partner">Partner</option>
                  <option value="dodavatel">Dodavatel</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Zdroj kontaktu</label>
                <select value={contactForm.source || ""} onChange={e => setContactForm(f => ({ ...f, source: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }}>
                  <option value="">-- neznámý --</option>
                  <option value="web">Web</option>
                  <option value="sreality">Sreality</option>
                  <option value="bezrealitky">Bezrealitky</option>
                  <option value="doporuceni">Doporučení</option>
                  <option value="telefon">Telefon</option>
                  <option value="email">E-mail</option>
                  <option value="kampan">Kampaň</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={contactForm.gdpr || false} onChange={e => setContactForm(f => ({ ...f, gdpr: e.target.checked }))} style={{ accentColor: "#1D9E75" }} />
                <label style={{ fontSize: 13, color: "#1a1a1a" }}>GDPR souhlas udělen</label>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Stav</label>
                <select value={contactForm.status || "lead"} onChange={e => setContactForm(f => ({ ...f, status: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }}>
                  <option value="lead">Zájemce</option>
                  <option value="interested">Má zájem</option>
                  <option value="reserved">Rezervoval</option>
                  <option value="buyer">Kupující</option>
                  <option value="lost">Ztracen</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Projekt</label>
                <select value={contactForm.project_id || ""} onChange={e => setContactForm(f => ({ ...f, project_id: e.target.value || null }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }}>
                  <option value="">-- bez projektu --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Poznámka</label>
                <textarea value={contactForm.note || ""} onChange={e => setContactForm(f => ({ ...f, note: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, height: 80, resize: "none", background: "#fafafa", color: "#1a1a1a" }} />
              </div>
            </div>
            {contactForm.id && <CommunicationLog contactId={contactForm.id} supabase={supabase} />}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={saveContact} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Uložit</button>
              <button onClick={() => { setView("contacts"); setContactForm({}); }} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>Zrušit</button>
            </div>
          </div>
        )}

        {/* PIPELINE - LEADS */}
        {!loading && view === "leads" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>Obchodní pipeline ({leads.length})</div>
              <button onClick={() => { setLeadForm({}); setView("editLead"); }} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Nový lead</button>
            </div>

            {/* Kanban pipeline */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, marginBottom: 20, overflowX: "auto" }}>
              {[
                ["new", "Nový", "#EEF3FA", "#1A3A6B"],
                ["contacted", "Kontaktován", "#FFF8E6", "#7A4A0A"],
                ["viewing", "Prohlídka", "#F0EFFE", "#4A3A9A"],
                ["reservation", "Rezervace", "#E1F5EE", "#0F6E56"],
                ["contract", "Smlouva", "#E8F5E9", "#1B5E20"],
                ["closed", "Uzavřeno", "#E8F5E9", "#1B5E20"],
                ["lost", "Ztraceno", "#FCEBEB", "#A32D2D"],
              ].map(([status, label, bg, color]) => {
                const statusLeads = leads.filter(l => l.status === status);
                return (
                  <div key={status} style={{ background: bg, borderRadius: 10, padding: "10px 8px", minHeight: 100 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color, marginBottom: 8, textAlign: "center" }}>{label} ({statusLeads.length})</div>
                    {statusLeads.map(l => (
                      <div key={l.id} onClick={() => { setLeadForm(l); setView("editLead"); }} style={{ background: "#fff", borderRadius: 8, padding: "8px 10px", marginBottom: 6, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{l.contacts?.name}</div>
                        <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{l.projects?.name}</div>
                        {l.preferred_disp && <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{l.preferred_disp}</div>}
                        {l.next_contact_date && (() => {
                          const isOverdue = new Date(l.next_contact_date) < new Date();
                          return <div style={{ fontSize: 10, color: isOverdue ? "#E24B4A" : "#aaa", marginTop: 2 }}>📅 {l.next_contact_date}</div>;
                        })()}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* EDIT LEAD */}
        {!loading && view === "editLead" && (
          <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 12, padding: 24 }}>
            <button onClick={() => { setView("leads"); setLeadForm({}); }} style={{ background: "none", border: "none", color: "#1D9E75", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 12 }}>← Pipeline</button>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 20 }}>{leadForm.id ? "Upravit lead" : "Nový lead"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Kontakt *</label>
                <select value={leadForm.contact_id || ""} onChange={e => setLeadForm(f => ({ ...f, contact_id: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }}>
                  <option value="">-- vyberte kontakt --</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Projekt</label>
                <select value={leadForm.project_id || ""} onChange={e => setLeadForm(f => ({ ...f, project_id: e.target.value || null }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }}>
                  <option value="">-- bez projektu --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Preferovaná dispozice</label>
                <select value={leadForm.preferred_disp || ""} onChange={e => setLeadForm(f => ({ ...f, preferred_disp: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }}>
                  <option value="">-- vše --</option>
                  {["1+kk", "2+kk", "3+kk", "4+kk"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Rozpočet (Kč)</label>
                <input type="number" value={leadForm.budget || ""} onChange={e => setLeadForm(f => ({ ...f, budget: parseInt(e.target.value) || null }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Stav leadu</label>
                <select value={leadForm.status || "new"} onChange={e => setLeadForm(f => ({ ...f, status: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }}>
                  <option value="new">Nový</option>
                  <option value="contacted">Kontaktován</option>
                  <option value="viewing">Prohlídka</option>
                  <option value="reservation">Rezervace</option>
                  <option value="contract">Smlouva</option>
                  <option value="closed">Uzavřeno</option>
                  <option value="lost">Ztraceno</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Přiřazený obchodník</label>
                <input type="text" value={leadForm.assigned_to || ""} onChange={e => setLeadForm(f => ({ ...f, assigned_to: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Pravděpodobnost uzavření (%)</label>
                <input type="number" min="0" max="100" value={leadForm.probability || 0} onChange={e => setLeadForm(f => ({ ...f, probability: parseInt(e.target.value) || 0 }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Termín dalšího kontaktu</label>
                <input type="date" value={leadForm.next_contact_date || ""} onChange={e => setLeadForm(f => ({ ...f, next_contact_date: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Další krok</label>
                <input type="text" value={leadForm.next_step || ""} onChange={e => setLeadForm(f => ({ ...f, next_step: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Poznámky</label>
                <textarea value={leadForm.notes || ""} onChange={e => setLeadForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, height: 80, resize: "none", background: "#fafafa", color: "#1a1a1a" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={saveLead} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Uložit</button>
              {leadForm.id && <button onClick={() => deleteLead(leadForm.id)} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>Smazat</button>}
              <button onClick={() => { setView("leads"); setLeadForm({}); }} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>Zrušit</button>
            </div>
          </div>
        )}

        {/* REZERVACE */}
        {!loading && view === "reservations" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>Rezervace ({reservations.length})</div>
              <button onClick={() => { setReservationForm({}); setView("editReservation"); }} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Nová rezervace</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {reservations.map(r => {
                const isExpiring = r.valid_until && new Date(r.valid_until) - new Date() < 3 * 24 * 60 * 60 * 1000;
                const isExpired = r.valid_until && new Date(r.valid_until) < new Date();
                return (
                  <div key={r.id} style={{ background: "#fff", border: `0.5px solid ${isExpired ? "#E24B4A" : isExpiring ? "#EF9F27" : "#e8e8e8"}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{r.contacts?.name}</div>
                        {isExpired && <span style={{ fontSize: 10, background: "#FCEBEB", color: "#A32D2D", padding: "2px 8px", borderRadius: 20 }}>Expirováno</span>}
                        {isExpiring && !isExpired && <span style={{ fontSize: 10, background: "#FAEEDA", color: "#633806", padding: "2px 8px", borderRadius: 20 }}>Brzy expiruje</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#999" }}>
                        Byt č. {r.units?.unit_number} · {r.units?.disp} · {r.units?.area} m²
                        {r.reserved_at && ` · Rezervováno: ${r.reserved_at}`}
                        {r.valid_until && ` · Platnost do: ${r.valid_until}`}
                      </div>
                      {r.reservation_fee && <div style={{ fontSize: 12, color: "#1D9E75", marginTop: 2, fontWeight: 600 }}>Záloha: {r.reservation_fee.toLocaleString("cs-CZ")} Kč</div>}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setReservationForm(r); setView("editReservation"); }} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Upravit</button>
                      <button onClick={() => deleteReservation(r.id)} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Smazat</button>
                    </div>
                  </div>
                );
              })}
              {reservations.length === 0 && <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Žádné rezervace.</div>}
            </div>
          </>
        )}

        {/* EDIT REZERVACE */}
        {!loading && view === "editReservation" && (
          <div style={{ background: "#fff", border: "0.5px solid #e8e8e8", borderRadius: 12, padding: 24 }}>
            <button onClick={() => { setView("reservations"); setReservationForm({}); }} style={{ background: "none", border: "none", color: "#1D9E75", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 12 }}>← Rezervace</button>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 20 }}>{reservationForm.id ? "Upravit rezervaci" : "Nová rezervace"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {reservationForm.unit_id && (() => {
                const unit = selectedProject?.units?.find(u => u.id === reservationForm.unit_id);
                return unit ? (
                  <div style={{ gridColumn: "1 / -1", background: "#E1F5EE", borderRadius: 10, padding: "12px 16px", marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F6E56" }}>Rezervace bytu</div>
                    <div style={{ fontSize: 13, color: "#0F6E56", marginTop: 4 }}>
                      Byt č. {unit.unit_number} · {unit.disp} · {unit.area} m² · {unit.floor}. patro
                      {unit.price_net ? ` · ${unit.price_net.toLocaleString("cs-CZ")} Kč` : ""}
                    </div>
                  </div>
                ) : null;
              })()}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Kontakt *</label>
                <select value={reservationForm.contact_id || ""} onChange={e => setReservationForm(f => ({ ...f, contact_id: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }}>
                  <option value="">-- vyberte kontakt --</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Stav</label>
                <select value={reservationForm.status || "active"} onChange={e => setReservationForm(f => ({ ...f, status: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }}>
                  <option value="active">Aktivní</option>
                  <option value="expired">Expirovaná</option>
                  <option value="converted">Převedena na smlouvu</option>
                  <option value="cancelled">Zrušena</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Datum rezervace</label>
                <input type="date" value={reservationForm.reserved_at || ""} onChange={e => setReservationForm(f => ({ ...f, reserved_at: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Platnost do</label>
                <input type="date" value={reservationForm.valid_until || ""} onChange={e => setReservationForm(f => ({ ...f, valid_until: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Rezervační poplatek (Kč)</label>
                <input type="number" value={reservationForm.reservation_fee || ""} onChange={e => setReservationForm(f => ({ ...f, reservation_fee: parseInt(e.target.value) || null }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, background: "#fafafa", color: "#1a1a1a" }} />
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Dokumenty</label>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" multiple onChange={async (e) => {
                  const files = Array.from(e.target.files);
                  const urls = [];
                  for (const file of files) {
                    const fileName = `reservations/${Date.now()}-${file.name}`;
                    const { error } = await supabase.storage.from("documents").upload(fileName, file);
                    if (!error) {
                      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName);
                      urls.push({ name: file.name, url: urlData.publicUrl });
                    }
                  }
                  const existing = Array.isArray(reservationForm.documents) ? reservationForm.documents : [];
                  setReservationForm(f => ({ ...f, documents: [...existing, ...urls] }));
                }} style={{ fontSize: 13 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                  {(Array.isArray(reservationForm.documents) ? reservationForm.documents : []).map((doc, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f7f7f5", borderRadius: 8, padding: "8px 12px" }}>
                      <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#1A3A6B", textDecoration: "none" }}>
                        📄 {doc.name}
                      </a>
                      <button onClick={() => setReservationForm(f => ({ ...f, documents: f.documents.filter((_, j) => j !== i) }))}
                        style={{ background: "none", border: "none", color: "#E24B4A", cursor: "pointer", fontSize: 16 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Poznámky</label>
                <textarea value={reservationForm.notes || ""} onChange={e => setReservationForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "0.5px solid #ddd", fontSize: 13, height: 70, resize: "none", background: "#fafafa", color: "#1a1a1a" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={saveReservation} style={{ background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Uložit</button>
              {reservationForm.id && <button onClick={() => deleteReservation(reservationForm.id)} style={{ background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>Smazat</button>}
              <button onClick={() => { setView("reservations"); setReservationForm({}); }} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, cursor: "pointer" }}>Zrušit</button>
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