/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import * as XLSX from "xlsx";

const C = {
  bg: "#F0F4FA", sidebar: "#0D1F3C", sidebarActive: "#1D9E75",
  card: "#ffffff", border: "#E2E8F4", text: "#0D2137", muted: "#7A8FAC",
  accent: "#1D9E75", accentLight: "#E1F5EE", blue: "#1A3A6B", blueLight: "#EEF3FA",
  red: "#E24B4A", redLight: "#FCEBEB", yellow: "#EF9F27", yellowLight: "#FAEEDA",
};

const inputStyle = { padding: "9px 13px", borderRadius: 9, border: `1px solid ${C.border}`, fontSize: 13, background: "#FAFBFD", color: C.text, outline: "none", width: "100%", boxSizing: "border-box" };
const selectStyle = { ...inputStyle, cursor: "pointer" };

function Badge({ color, bg, children }) {
  return <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: bg, color, display: "inline-block" }}>{children}</span>;
}

function Card({ children, style }) {
  return <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(10,30,60,0.06)", padding: "20px 22px", ...style }}>{children}</div>;
}

function Btn({ onClick, children, variant = "primary", size = "md", style }) {
  const styles = { primary: { background: C.accent, color: "#fff", border: "none" }, secondary: { background: C.blueLight, color: C.blue, border: "none" }, danger: { background: C.redLight, color: C.red, border: "none" }, ghost: { background: "#f0f0f0", color: "#444", border: "none" }, dark: { background: C.blue, color: "#fff", border: "none" } };
  const sizes = { sm: { padding: "5px 12px", fontSize: 12, borderRadius: 8 }, md: { padding: "8px 18px", fontSize: 13, borderRadius: 10 }, lg: { padding: "11px 26px", fontSize: 14, borderRadius: 10, fontWeight: 700 } };
  return <button onClick={onClick} style={{ ...styles[variant], ...sizes[size], cursor: "pointer", fontWeight: 600, ...style }}>{children}</button>;
}

function FormField({ label, children, span }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: span ? "1 / -1" : "auto" }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }) {
  return <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />;
}

function SelectInput({ value, onChange, options, placeholder }) {
  return (
    <select value={value || ""} onChange={e => onChange(e.target.value)} style={selectStyle}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function CheckboxField({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.text, cursor: "pointer" }}>
      <input type="checkbox" checked={checked || false} onChange={e => onChange(e.target.checked)} style={{ accentColor: C.accent, width: 15, height: 15 }} />
      {label}
    </label>
  );
}

function Section({ title, first, children }) {
  return (
    <div style={{ marginTop: first ? 0 : 20, paddingTop: first ? 0 : 20, borderTop: first ? "none" : `1px solid ${C.border}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>
    </div>
  );
}

function CommunicationLog({ contactId }) {
  const [logs, setLogs] = useState([]);
  const [newLog, setNewLog] = useState("");
  const [logType, setLogType] = useState("note");
  useEffect(() => {
    supabase.from("communication_log").select("*").eq("contact_id", contactId).order("created_at", { ascending: false }).then(({ data }) => setLogs(data || []));
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
    <div style={{ marginTop: 20, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>Historie komunikace</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <select value={logType} onChange={e => setLogType(e.target.value)} style={{ ...selectStyle, width: "auto" }}>
          {Object.entries(typeLabel).map(([v, l]) => <option key={v} value={v}>{typeIcon[v]} {l}</option>)}
        </select>
        <input type="text" value={newLog} onChange={e => setNewLog(e.target.value)} onKeyDown={e => e.key === "Enter" && addLog()} placeholder="Přidat záznam... (Enter)" style={{ ...inputStyle, flex: 1 }} />
        <Btn onClick={addLog} size="sm">Přidat</Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
        {logs.length === 0 && <div style={{ fontSize: 12, color: C.muted, textAlign: "center" }}>Žádná komunikace.</div>}
        {logs.map(l => (
          <div key={l.id} style={{ background: C.bg, borderRadius: 9, padding: "9px 12px", display: "flex", gap: 10 }}>
            <span style={{ fontSize: 16 }}>{typeIcon[l.type] || "📝"}</span>
            <div><div style={{ fontSize: 13, color: C.text }}>{l.content}</div><div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{new Date(l.created_at).toLocaleDateString("cs-CZ")} · {l.created_by}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

const NAV = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "projects", icon: "🏗", label: "Projekty" },
  { id: "contacts", icon: "👥", label: "Kontakty" },
  { id: "leads", icon: "🎯", label: "Pipeline" },
  { id: "reservations", icon: "📋", label: "Rezervace" },
  { id: "tasks", icon: "✅", label: "Úkoly" },
  { id: "documents", icon: "📁", label: "Dokumenty" },
  { id: "ai", icon: "🤖", label: "AI Asistent" },
  { id: "settings", icon: "⚙️", label: "Nastavení" },
];

function Sidebar({ view, setView, currentUser, fns }) {
  const isActive = (id) => view === id || (id === "projects" && ["units","editProject","editUnit","milestones","editMilestone"].includes(view));
  return (
    <div style={{ width: 220, minHeight: "100vh", background: C.sidebar, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 200 }}>
      <div style={{ padding: "22px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: C.accent, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏗</div>
          <div><div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>DeveloperX</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Admin panel</div></div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "12px 10px" }}>
        {NAV.map(item => (
          <button key={item.id} onClick={() => {
            if (item.id === "contacts") fns.loadContacts();
            else if (item.id === "leads") fns.loadLeads();
            else if (item.id === "reservations") fns.loadReservations();
            else if (item.id === "tasks") fns.loadTasks();
            else if (item.id === "documents") fns.loadDocuments();
            else setView(item.id);
          }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: "none", marginBottom: 2, background: isActive(item.id) ? C.accent : "transparent", color: isActive(item.id) ? "#fff" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13, fontWeight: isActive(item.id) ? 600 : 400, textAlign: "left" }}>
            <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>{item.label}
          </button>
        ))}
        {currentUser?.role === "admin" && (
          <button onClick={() => { fns.loadAdminUsers(); setView("users"); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, border: "none", marginBottom: 2, background: view === "users" ? C.accent : "transparent", color: view === "users" ? "#fff" : "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13, textAlign: "left" }}>
            <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>👤</span>Uživatelé
          </button>
        )}
      </nav>
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Přihlášen jako</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{currentUser?.full_name || currentUser?.username}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{currentUser?.role === "admin" ? "Administrátor" : "Makléř"}</div>
        <a href="/" style={{ display: "block", marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>← Zpět na web</a>
      </div>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState("dashboard");
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading] = useState(false);
  const [form, setForm] = useState({});
  const [unitForm, setUnitForm] = useState({});
  const [milestoneForm, setMilestoneForm] = useState({});
  const [contactForm, setContactForm] = useState({});
  const [leadForm, setLeadForm] = useState({});
  const [reservationForm, setReservationForm] = useState({});
  const [documentForm, setDocumentForm] = useState({});
  const [taskForm, setTaskForm] = useState({});
  const [userForm, setUserForm] = useState({});
  const [milestones, setMilestones] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [filterDisp, setFilterDisp] = useState("Vše");
  const [filterStatus, setFilterStatus] = useState("Vše");
  const [filterBuilding] = useState("Vše");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");
  const [documentFilter, setDocumentFilter] = useState("all");
  const [taskFilter, setTaskFilter] = useState("today");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [settings, setSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSelectedProject, setAiSelectedProject] = useState("");
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pdfEditor, setPdfEditor] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => { if (!authed) return; loadProjects(); loadSettings(); loadContactsData(); loadLeadsData(); loadReservationsData(); loadDismissedAlerts(); }, [authed]);

  useEffect(() => {
    if (view !== "editProject") { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } markerRef.current = null; return; }
    if (!document.getElementById("leaflet-css")) { const link = document.createElement("link"); link.id = "leaflet-css"; link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link); }
    if (!window.L) { const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload = () => setTimeout(initMap, 200); document.head.appendChild(script); } else { setTimeout(initMap, 200); }
  }, [view]);

  const initMap = () => {
    const el = document.getElementById("map-container");
    if (!el || !window.L || mapRef.current) return;
    const L = window.L;
    const map = L.map("map-container").setView([form.lat || 50.0755, form.lng || 14.4378], form.lat ? 14 : 8);
    L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=fDblwSe3VCWnYFEkUUBE`, { attribution: "© MapTiler", maxZoom: 20 }).addTo(map);
    if (form.lat) { markerRef.current = L.marker([form.lat, form.lng]).addTo(map); }
    map.on("click", (e) => { const { lat, lng } = e.latlng; setForm(f => ({ ...f, lat, lng })); if (markerRef.current) { markerRef.current.setLatLng([lat, lng]); } else { markerRef.current = L.marker([lat, lng]).addTo(map); } });
    mapRef.current = map;
  };

  const getImages = (images) => { if (!images) return []; if (Array.isArray(images)) return images; try { return JSON.parse(images); } catch { return []; } };

  const searchAddress = async (val) => {
    setForm(f => ({ ...f, location: val }));
    if (val.length < 3) { setSuggestions([]); return; }
    try { const res = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(val)}.json?key=fDblwSe3VCWnYFEkUUBE&language=cs&country=cz,sk&limit=5`); const data = await res.json(); setSuggestions((data.features || []).map(f => ({ display_name: f.place_name, lat: f.center[1], lon: f.center[0] }))); } catch { setSuggestions([]); }
  };

  const selectAddress = (s) => {
    const lat = parseFloat(s.lat); const lng = parseFloat(s.lon);
    setForm(f => ({ ...f, location: s.display_name, lat, lng })); setSuggestions([]);
    if (mapRef.current) { mapRef.current.setView([lat, lng], 15); if (markerRef.current) { markerRef.current.setLatLng([lat, lng]); } else { markerRef.current = window.L.marker([lat, lng]).addTo(mapRef.current); } }
  };

  const loadProjects = async () => { const { data } = await supabase.from("projects").select("*").order("created_at"); setProjects(data || []); };
  const loadSettings = async () => { const { data } = await supabase.from("settings").select("*"); const s = {}; (data || []).forEach(r => { s[r.key] = r.value; }); setSettings(s); };
  const loadContactsData = async () => { const { data } = await supabase.from("contacts").select("*, projects(name), units(unit_number, disp)").order("created_at", { ascending: false }); setContacts(data || []); };
  const loadLeadsData = async () => { const { data } = await supabase.from("leads").select("*, contacts(name, phone, email), projects(name)").order("created_at", { ascending: false }); setLeads(data || []); };
  const loadReservationsData = async () => { const { data } = await supabase.from("reservations").select("*, contacts(name, phone), units(unit_number, disp, area)").order("created_at", { ascending: false }); setReservations(data || []); };
  const loadDismissedAlerts = async () => { const { data } = await supabase.from("dismissed_alerts").select("alert_key"); setDismissedAlerts((data || []).map(d => d.alert_key)); };
  const dismissAlert = async (key) => { await supabase.from("dismissed_alerts").upsert({ alert_key: key }); setDismissedAlerts(prev => [...prev, key]); };
  const loadContacts = async () => { await loadContactsData(); setView("contacts"); };
  const loadLeads = async () => { await loadLeadsData(); setView("leads"); };
  const loadReservations = async () => { await loadReservationsData(); setView("reservations"); };
  const loadUnits = async (project) => { const { data } = await supabase.from("units").select("*").eq("project_id", project.id).order("floor"); setSelectedProject({ ...project, units: data || [] }); setView("units"); };
  const loadMilestones = async (project) => { const { data } = await supabase.from("milestones").select("*").eq("project_id", project.id).order("order_index"); setMilestones(data || []); setSelectedProject(project); setView("milestones"); };
  const loadDocuments = async () => { const { data } = await supabase.from("documents").select("*, projects(name), units(unit_number, disp), contacts(name)").order("created_at", { ascending: false }); setDocuments(data || []); setView("documents"); };
  const loadTasks = async () => { const { data } = await supabase.from("tasks").select("*, projects(name), units(unit_number, disp), contacts(name)").order("due_date", { ascending: true }); setTasks(data || []); setView("tasks"); };
  const loadAdminUsers = async () => { const { data } = await supabase.from("admin_users").select("id, username, full_name, email, role"); setAdminUsers(data || []); };

  const saveProject = async () => { const d = { ...form, images: form.images ? JSON.stringify(getImages(form.images)) : null }; if (form.id) { await supabase.from("projects").update(d).eq("id", form.id); } else { await supabase.from("projects").insert(d); } setView("projects"); setForm({}); loadProjects(); };
  const deleteProject = async (id) => { if (!window.confirm("Smazat projekt?")) return; await supabase.from("projects").delete().eq("id", id); loadProjects(); };

  const saveUnit = async () => {
    const pricePerM2 = unitForm.price_net && unitForm.area ? Math.round(unitForm.price_net / unitForm.area) : null;
    const data = { ...unitForm, price_per_sqm: pricePerM2 };
    if (unitForm.id) {
      const { data: old } = await supabase.from("units").select("price_net, status").eq("id", unitForm.id).single();
      await supabase.from("units").update(data).eq("id", unitForm.id);
      if (old && old.price_net !== unitForm.price_net) { await supabase.from("price_history").insert({ unit_id: unitForm.id, price_net: unitForm.price_net, price_per_sqm: pricePerM2, changed_by: "Admin" }); }
      if (old && old.status !== "reserved" && unitForm.status === "reserved") {
        setUnitForm({}); loadUnits(selectedProject);
        if (window.confirm("Byt nastaven jako rezervovaný. Vytvořit rezervaci?")) { setReservationForm({ unit_id: unitForm.id, reserved_at: new Date().toISOString().split("T")[0], status: "active" }); setView("editReservation"); }
        return;
      }
    } else { await supabase.from("units").insert({ ...data, project_id: selectedProject.id }); }
    setUnitForm({}); loadUnits(selectedProject);
  };

  const deleteUnit = async (id) => { if (!window.confirm("Smazat byt?")) return; await supabase.from("units").delete().eq("id", id); loadUnits(selectedProject); };
  const saveMilestone = async () => { if (milestoneForm.id) { await supabase.from("milestones").update(milestoneForm).eq("id", milestoneForm.id); } else { const maxOrder = milestones.length > 0 ? Math.max(...milestones.map(m => m.order_index)) + 1 : 0; await supabase.from("milestones").insert({ ...milestoneForm, project_id: selectedProject.id, order_index: maxOrder }); } setMilestoneForm({}); loadMilestones(selectedProject); };
  const deleteMilestone = async (id) => { if (!window.confirm("Smazat milník?")) return; await supabase.from("milestones").delete().eq("id", id); loadMilestones(selectedProject); };
  const saveContact = async () => { if (contactForm.id) { await supabase.from("contacts").update(contactForm).eq("id", contactForm.id); } else { await supabase.from("contacts").insert(contactForm); } setContactForm({}); loadContacts(); };
  const deleteContact = async (id) => { if (!window.confirm("Smazat kontakt?")) return; await supabase.from("contacts").delete().eq("id", id); loadContacts(); };
  const saveLead = async () => { if (leadForm.id) { await supabase.from("leads").update(leadForm).eq("id", leadForm.id); } else { await supabase.from("leads").insert(leadForm); } setLeadForm({}); loadLeads(); };
  const deleteLead = async (id) => { if (!window.confirm("Smazat lead?")) return; await supabase.from("leads").delete().eq("id", id); loadLeads(); };

  const saveReservation = async () => {
    const { _project_id, _project_units, ...cleanForm } = reservationForm;
    if (cleanForm.id) { await supabase.from("reservations").update(cleanForm).eq("id", cleanForm.id); } else { await supabase.from("reservations").insert(cleanForm); if (cleanForm.unit_id) { await supabase.from("units").update({ status: "reserved" }).eq("id", cleanForm.unit_id); } }
    setReservationForm({}); await Promise.all([loadReservationsData(), loadLeadsData(), loadContactsData(), loadProjects()]);
    if (selectedProject) { await loadUnits(selectedProject); } else { setView("reservations"); }
  };

  const deleteReservation = async (id) => { if (!window.confirm("Smazat rezervaci?")) return; await supabase.from("reservations").delete().eq("id", id); loadReservations(); };
  const saveDocument = async () => { const { id, projects: _p, units: _u, contacts: _c, ...data } = documentForm; if (id) { await supabase.from("documents").update(data).eq("id", id); } else { await supabase.from("documents").insert(data); } setDocumentForm({}); loadDocuments(); };
  const deleteDocument = async (id) => { if (!window.confirm("Smazat dokument?")) return; await supabase.from("documents").delete().eq("id", id); loadDocuments(); };
  const saveTask = async () => { const { id, projects: _p, units: _u, contacts: _c, ...data } = taskForm; if (id) { await supabase.from("tasks").update(data).eq("id", id); } else { await supabase.from("tasks").insert(data); } setTaskForm({}); loadTasks(); };
  const deleteTask = async (id) => { if (!window.confirm("Smazat úkol?")) return; await supabase.from("tasks").delete().eq("id", id); loadTasks(); };
  const completeTask = async (id, currentStatus) => { if (currentStatus === "done") { await supabase.from("tasks").update({ status: "todo", completed_at: null }).eq("id", id); } else { await supabase.from("tasks").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", id); } loadTasks(); };
  const saveAdminUser = async () => { const { id, ...data } = userForm; if (!data.password) delete data.password; if (id) { await supabase.from("admin_users").update(data).eq("id", id); } else { await supabase.from("admin_users").insert(data); } setUserForm({}); loadAdminUsers(); };
  const deleteAdminUser = async (id) => { if (id === currentUser?.id) { alert("Nemůžete smazat vlastní účet!"); return; } if (!window.confirm("Smazat uživatele?")) return; await supabase.from("admin_users").delete().eq("id", id); loadAdminUsers(); };

  const callAI = async (prompt) => {
    setAiLoading(true); setAiResult("");
    try {
      const res = await fetch("https://trgmooampugduekngpxb.supabase.co/functions/v1/extract-pdf", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZ21vb2FtcHVnZHVla25ncHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Njk5NTIsImV4cCI6MjA5NTE0NTk1Mn0.MlEpjp1Zd__n837vv3N54y-c-lNtrHQp56Nprm5T4UE` }, body: JSON.stringify({ prompt }) });
      const data = await res.json(); setAiResult(data.text || data.error || "Chyba");
    } catch (err) { setAiResult("Chyba: " + err.message); }
    setAiLoading(false);
  };

  const statusColor = (s) => { if (s === "available") return { bg: "#E1F5EE", color: "#0F6E56" }; if (s === "reserved") return { bg: C.yellowLight, color: "#633806" }; if (s === "sold") return { bg: "#f0f0f0", color: "#666" }; if (s === "blocked") return { bg: C.redLight, color: C.red }; return { bg: "#f0f0f0", color: "#666" }; };
  const statusLabel = (s) => ({ available: "Volná", reserved: "Rezervovaná", sold: "Prodaná", blocked: "Blokovaná", withdrawn: "Stažená" }[s] || s);

  const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZ21vb2FtcHVnZHVla25ncHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Njk5NTIsImV4cCI6MjA5NTE0NTk1Mn0.MlEpjp1Zd__n837vv3N54y-c-lNtrHQp56Nprm5T4UE";

  if (!authed) return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${C.sidebar} 0%, #1A3A6B 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 40, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, background: C.accent, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 14px" }}>🏗</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Admin panel</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Přihlaste se pro přístup</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Uživatelské jméno</label><input type="text" value={loginForm.username} onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))} style={{ ...inputStyle, marginTop: 5 }} placeholder="admin" /></div>
          <div><label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Heslo</label><input type="password" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} onKeyDown={async e => { if (e.key === "Enter") { const { data } = await supabase.from("admin_users").select("*").eq("username", loginForm.username).eq("password", loginForm.password); console.log("Login result:", data, null); if (data && data.length > 0) { setAuthed(true); setCurrentUser(data[0]); setLoginError(""); } else { setLoginError("Špatné jméno nebo heslo"); } } }} style={{ ...inputStyle, marginTop: 5 }} placeholder="••••••••" /></div>
          {loginError && <div style={{ fontSize: 12, color: C.red, background: C.redLight, padding: "8px 12px", borderRadius: 8 }}>{loginError}</div>}
          <button onClick={async () => { const { data } = await supabase.from("admin_users").select("*").eq("username", loginForm.username).eq("password", loginForm.password); console.log("Login result:", data, null); if (data && data.length > 0) { setAuthed(true); setCurrentUser(data[0]); setLoginError(""); } else { setLoginError("Špatné jméno nebo heslo"); } }} style={{ background: C.blue, color: "#fff", border: "none", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>Přihlásit se</button>
        </div>
      </div>
    </div>
  );

  const fns = { loadContacts, loadLeads, loadReservations, loadTasks, loadDocuments, loadAdminUsers };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <Sidebar view={view} setView={setView} currentUser={currentUser} fns={fns} />
      <div style={{ marginLeft: 220, flex: 1, padding: "28px 32px" }}>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div><h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>Dashboard</h2><div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Přehled všech projektů</div></div>
              <button onClick={async () => { const res = await fetch("https://trgmooampugduekngpxb.supabase.co/functions/v1/send-expiry-alert", { headers: { "Authorization": `Bearer ${ANON_KEY}` } }); const data = await res.json(); alert(data.count === 0 ? "Žádné expirující rezervace." : `⚠️ ${data.count} expirujících:\n${data.alerts.map(a => `• ${a.contact} — ${a.valid_until}`).join("\n")}`); }} style={{ background: C.yellowLight, color: "#633806", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>🔔 Expirující rezervace</button>
            </div>
            {(() => {
              const today = new Date(); const warnings = [];
              reservations.filter(r => r.valid_until && new Date(r.valid_until) - today < 3 * 24 * 60 * 60 * 1000 && new Date(r.valid_until) > today).forEach(r => warnings.push({ key: `reservation-${r.id}`, text: `Rezervace ${r.contacts?.name || "—"} expiruje ${r.valid_until}` }));
              leads.filter(l => l.next_contact_date && new Date(l.next_contact_date) < today).forEach(l => warnings.push({ key: `lead-${l.id}`, text: `Lead ${l.contacts?.name || "—"} — prošel termín kontaktu (${l.next_contact_date})` }));
              const visible = warnings.filter(w => !dismissedAlerts.includes(w.key));
              return visible.length > 0 ? (
                <div style={{ background: C.redLight, border: `1px solid #F5BDBC`, borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.red, marginBottom: 8 }}>⚠️ Upozornění</div>
                  {visible.map(w => (
                    <div key={w.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: C.red, marginBottom: 4 }}>
                      <span>• {w.text}</span>
                      <button onClick={() => dismissAlert(w.key)} style={{ background: "none", border: `1px solid ${C.red}`, borderRadius: 6, padding: "2px 8px", fontSize: 11, color: C.red, cursor: "pointer" }}>✓ Vzato na vědomí</button>
                    </div>
                  ))}
                </div>
              ) : null;
            })()}
            {(() => {
              const totalUnits = projects.reduce((s, p) => s + (p.total_units || 0), 0);
              const soldUnits = projects.reduce((s, p) => s + (p.sold_units || 0), 0);
              const stats = [["📊","Projekty",projects.length,C.blue,() => setView("projects")],["🏠","Celkem bytů",totalUnits,C.accent,null],["✅","Prodáno",soldUnits,"#0F6E56",null],["🔓","Volných",totalUnits-soldUnits,"#633806",null],["🎯","Leads",leads.length,"#7A4A0A",loadLeads],["📋","Rezervace",reservations.length,"#4A3A9A",loadReservations],["⚠️","Expirující",reservations.filter(r => r.valid_until && new Date(r.valid_until) - new Date() < 3*24*60*60*1000 && new Date(r.valid_until) > new Date()).length,C.red,loadReservations],["👥","Kontakty",contacts.length,C.accent,loadContacts]];
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                  {stats.map(([icon, label, value, color, onClick]) => (
                    <div key={label} onClick={onClick} style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 1px 6px rgba(10,30,60,0.06)", padding: "18px 20px", cursor: onClick ? "pointer" : "default" }}>
                      <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Prodejnost projektů</div>
              {projects.map(p => { const pct = p.total_units > 0 ? Math.round((p.sold_units / p.total_units) * 100) : 0; return (
                <div key={p.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 4 }}><span>{p.name}</span><span>{p.sold_units}/{p.total_units} ({pct}%)</span></div>
                  <div style={{ height: 8, background: C.border, borderRadius: 4 }}><div style={{ height: 8, width: `${pct}%`, background: pct === 100 ? "#aaa" : C.accent, borderRadius: 4 }} /></div>
                </div>
              ); })}
            </Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {projects.map(p => { const avail = p.total_units - p.sold_units; const pct = p.total_units > 0 ? Math.round((p.sold_units / p.total_units) * 100) : 0; return (
                <Card key={p.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <div><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{p.name}</div><div style={{ fontSize: 12, color: C.muted }}>📍 {p.location}</div></div>
                    <Badge bg={avail === 0 ? "#f0f0f0" : C.accentLight} color={avail === 0 ? "#666" : "#0F6E56"}>{avail === 0 ? "Vyprodáno" : `${avail} volných`}</Badge>
                  </div>
                  <div style={{ height: 6, background: C.border, borderRadius: 3, marginBottom: 12 }}><div style={{ height: 6, width: `${pct}%`, background: C.accent, borderRadius: 3 }} /></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => loadUnits(p)} style={{ flex: 1, background: C.accentLight, color: "#0F6E56", border: "none", borderRadius: 8, padding: "7px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>Byty</button>
                    <button onClick={() => loadMilestones(p)} style={{ flex: 1, background: C.blueLight, color: C.blue, border: "none", borderRadius: 8, padding: "7px", fontSize: 12, cursor: "pointer" }}>Timeline</button>
                    <button onClick={() => { setForm(p); setView("editProject"); }} style={{ flex: 1, background: "#f0f0f0", color: "#444", border: "none", borderRadius: 8, padding: "7px", fontSize: 12, cursor: "pointer" }}>Upravit</button>
                  </div>
                </Card>
              ); })}
            </div>
          </>
        )}

        {/* PROJEKTY */}
        {view === "projects" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Projekty ({projects.length})</h2>
              <Btn onClick={() => { setForm({}); setView("editProject"); }}>+ Nový projekt</Btn>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {projects.map(p => (
                <Card key={p.id} style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{p.name}</div><div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{p.location} · {p.total_units} bytů</div></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={() => loadUnits(p)} variant="secondary" size="sm">🏠 Byty</Btn>
                    <Btn onClick={() => loadMilestones(p)} size="sm" style={{ background: C.blueLight, color: C.blue, border: "none" }}>📅 Timeline</Btn>
                    <Btn onClick={() => { setForm(p); setView("editProject"); }} variant="ghost" size="sm">Upravit</Btn>
                    <Btn onClick={() => deleteProject(p.id)} variant="danger" size="sm">Smazat</Btn>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* EDIT PROJEKT */}
        {view === "editProject" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button onClick={() => { setView("projects"); setForm({}); setSuggestions([]); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, cursor: "pointer", padding: 0 }}>← Projekty</button>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>{form.id ? "Upravit projekt" : "Nový projekt"}</h2>
            </div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>📄 PDF Import</div>
              <input type="file" accept=".pdf" onChange={async (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (ev) => { const base64 = ev.target.result.split(",")[1]; setPdfLoading(true); try { const res = await fetch("https://trgmooampugduekngpxb.supabase.co/functions/v1/extract-pdf", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON_KEY}` }, body: JSON.stringify({ pdfBase64: base64 }) }); const parsed = await res.json(); setForm(f => ({ ...f, ...parsed })); } catch (err) { alert("Chyba: " + err.message); } setPdfLoading(false); }; reader.readAsDataURL(file); }} style={{ fontSize: 13 }} />
              {pdfLoading && <div style={{ marginTop: 8, fontSize: 13, color: C.accent }}>⏳ Zpracovávám PDF...</div>}
            </Card>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Základní info</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormField label="Název projektu *"><TextInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} /></FormField>
                <FormField label="Lokalita / Adresa">
                  <div style={{ position: "relative" }}>
                    <input type="text" value={form.location || ""} onChange={e => searchAddress(e.target.value)} placeholder="Začněte psát adresu..." style={inputStyle} />
                    {suggestions.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: `1px solid ${C.border}`, borderRadius: 9, zIndex: 9999, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", marginTop: 2 }}>
                        {suggestions.map((s, i) => <div key={i} onClick={() => selectAddress(s)} style={{ padding: "10px 12px", fontSize: 12, color: C.text, cursor: "pointer", borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : "none" }}>{s.display_name}</div>)}
                      </div>
                    )}
                  </div>
                </FormField>
                <FormField label="Typ"><SelectInput value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={[["Novostavba","Novostavba"],["Rekonstrukce","Rekonstrukce"]]} placeholder="-- vyberte --" /></FormField>
                <FormField label="Dokončení"><TextInput value={form.completion} onChange={v => setForm(f => ({ ...f, completion: v }))} placeholder="Q4 2026" /></FormField>
                <FormField label="Cena od (Kč)"><TextInput value={form.price_from} onChange={v => setForm(f => ({ ...f, price_from: parseInt(v) || 0 }))} type="number" /></FormField>
                <FormField label="Celkem bytů"><TextInput value={form.total_units} onChange={v => setForm(f => ({ ...f, total_units: parseInt(v) || 0 }))} type="number" /></FormField>
                <FormField label="Prodaných bytů"><TextInput value={form.sold_units} onChange={v => setForm(f => ({ ...f, sold_units: parseInt(v) || 0 }))} type="number" /></FormField>
                <FormField label="Počet podlaží"><TextInput value={form.floors} onChange={v => setForm(f => ({ ...f, floors: parseInt(v) || 0 }))} type="number" /></FormField>
                <FormField label="Popis" span><textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, height: 80, resize: "none" }} /></FormField>
              </div>
            </Card>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Logo firmy</div>
              <input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files[0]; if (!file) return; const fileName = `logos/${Date.now()}-${file.name}`; const { error } = await supabase.storage.from("project-images").upload(fileName, file); if (!error) { const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(fileName); setForm(f => ({ ...f, company_logo: urlData.publicUrl })); } }} style={{ fontSize: 13 }} />
              {form.company_logo && <img src={form.company_logo} alt="Logo" style={{ height: 50, objectFit: "contain", marginTop: 10 }} />}
            </Card>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Fotky projektu</div>
              <input type="file" accept="image/*" multiple onChange={async (e) => { const files = Array.from(e.target.files); const urls = []; for (const file of files) { const fileName = `${Date.now()}-${file.name}`; const { error } = await supabase.storage.from("project-images").upload(fileName, file); if (!error) { const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(fileName); urls.push(urlData.publicUrl); } } setForm(f => ({ ...f, images: [...getImages(f.images), ...urls] })); }} style={{ fontSize: 13 }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {getImages(form.images).map((url, i) => <div key={i} style={{ position: "relative" }}><img src={url} alt="" style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 8 }} /><button onClick={() => setForm(f => ({ ...f, images: getImages(f.images).filter((_, j) => j !== i) }))} style={{ position: "absolute", top: 2, right: 2, background: C.red, color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 11, cursor: "pointer" }}>×</button></div>)}
              </div>
            </Card>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Poloha na mapě</div>
              <div id="map-container" style={{ height: 280, borderRadius: 10, border: `1px solid ${C.border}` }}></div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{form.lat ? `📍 ${form.lat.toFixed(5)}, ${form.lng.toFixed(5)}` : "Klikněte na mapu nebo vyberte adresu"}</div>
            </Card>
            <Card style={{ marginBottom: 16, background: C.blueLight, border: `1px solid #C8D8F0` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.blue, marginBottom: 12 }}>🏠 Generovat byty automaticky</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
                {["1+kk","2+kk","3+kk","4+kk"].map(disp => <div key={disp}><label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase" }}>{disp}</label><input type="number" min="0" defaultValue="0" id={`gen-${disp}`} style={{ ...inputStyle, marginTop: 5 }} /></div>)}
              </div>
              <Btn variant="dark" onClick={async () => { if (!form.id) { alert("Nejdříve uložte projekt!"); return; } const units = []; let counter = 1; for (const disp of ["1+kk","2+kk","3+kk","4+kk"]) { const count = parseInt(document.getElementById(`gen-${disp}`)?.value) || 0; for (let i = 0; i < count; i++) { units.push({ project_id: form.id, unit_number: counter++, disp, status: "available", floor: 1, area: 0, price: 0 }); } } if (units.length === 0) { alert("Zadejte počty!"); return; } if (!window.confirm(`Vytvořit ${units.length} bytů?`)) return; await supabase.from("units").insert(units); alert(`Vytvořeno ${units.length} bytů!`); }}>Generovat byty</Btn>
            </Card>
            <div style={{ display: "flex", gap: 10 }}><Btn onClick={saveProject} size="lg">Uložit projekt</Btn><Btn onClick={() => { setView("projects"); setForm({}); setSuggestions([]); }} variant="ghost" size="lg">Zrušit</Btn></div>
          </>
        )}

        {/* BYTY */}
        {view === "units" && selectedProject && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div><button onClick={() => setView("projects")} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 4 }}>← Projekty</button><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>{selectedProject.name} — Byty ({selectedProject.units?.length || 0})</h2></div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="ghost" onClick={() => { const rows = selectedProject.units.map(u => ({ "Číslo": u.unit_number, "Dispozice": u.disp, "Plocha m²": u.area, "Cena bez DPH": u.price_net || "", "Cena s DPH": u.price_net ? Math.round(u.price_net * 1.12) : "", "Cena/m²": u.price_per_sqm || "", "Stav": u.status, "Kupující": u.buyer || "" })); const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Ceník"); XLSX.writeFile(wb, `cenik-${selectedProject.name}.xlsx`); }}>📊 Excel</Btn>
                <Btn variant="ghost" onClick={async () => { const { generateCenikPDF: gen } = await import("./CenikPDF"); gen(selectedProject, selectedProject.units); }}>📄 PDF ceník</Btn>
                <Btn onClick={() => { setUnitForm({}); setView("editUnit"); }}>+ Nový byt</Btn>
              </div>
            </div>
            {selectedProject.units?.length > 0 && (() => { const u = selectedProject.units; const avgM2 = u.filter(x => x.price_per_sqm > 0).reduce((s, x, _, a) => s + x.price_per_sqm / a.length, 0); const byStatus = { available: 0, reserved: 0, sold: 0, blocked: 0 }; u.forEach(x => { if (byStatus[x.status] !== undefined) byStatus[x.status]++; }); return (<div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 16 }}>{[["Průměr/m²", avgM2 ? Math.round(avgM2).toLocaleString("cs-CZ")+" Kč" : "—", C.accent],["Volné", byStatus.available, "#0F6E56"],["Rezervované", byStatus.reserved, "#633806"],["Prodané", byStatus.sold, "#666"],["Blokované", byStatus.blocked, C.red]].map(([l, v, col]) => (<Card key={l} style={{ padding: "12px 14px" }}><div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{l}</div><div style={{ fontSize: 16, fontWeight: 700, color: col }}>{v}</div></Card>))}</div>); })()}
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {["Vše", ...new Set(selectedProject.units?.map(u => u.disp).filter(Boolean))].map(d => (<button key={d} onClick={() => setFilterDisp(d)} style={{ border: filterDisp === d ? "none" : `1px solid ${C.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, cursor: "pointer", background: filterDisp === d ? C.accent : "#fff", color: filterDisp === d ? "#fff" : C.muted }}>{d}</button>))}
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...selectStyle, width: "auto", borderRadius: 20 }}><option value="Vše">Všechny stavy</option><option value="available">Volné</option><option value="reserved">Rezervované</option><option value="sold">Prodané</option><option value="blocked">Blokované</option></select>
              <input type="number" placeholder="Max. cena Kč" value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)} style={{ ...inputStyle, width: 140, borderRadius: 20 }} />
              {(filterDisp !== "Vše" || filterStatus !== "Vše" || filterPriceMax) && (<button onClick={() => { setFilterDisp("Vše"); setFilterStatus("Vše"); setFilterPriceMax(""); }} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${C.red}`, fontSize: 12, background: C.redLight, color: C.red, cursor: "pointer" }}>× Reset</button>)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(selectedProject.units?.filter(u => { if (filterDisp !== "Vše" && u.disp !== filterDisp) return false; if (filterStatus !== "Vše" && u.status !== filterStatus) return false; if (filterPriceMax && (u.price_net || 0) > parseInt(filterPriceMax)) return false; return true; }) || []).map(u => { const sc = statusColor(u.status); return (
                <Card key={u.id} style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, minWidth: 30 }}>#{u.unit_number}</div>
                    <div style={{ fontSize: 13, color: C.muted }}>{u.disp} · {u.area} m²{u.building ? ` · B.${u.building}` : ""} · {u.floor}. p.</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{u.price_net ? u.price_net.toLocaleString("cs-CZ") + " Kč" : "—"}</div>
                    <Badge bg={sc.bg} color={sc.color}>{statusLabel(u.status)}</Badge>
                    {u.buyer && <div style={{ fontSize: 12, color: C.muted }}>👤 {u.buyer}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={() => setPdfEditor({ project: selectedProject, unit: u, agentPhotoSize: 100, agentPhotoShape: "circle", template: "minimal", colorHeader: "#1A3A6B", colorPrice: "#04342C", colorAccent: "#1D9E75", photosPosition: "top", agentPosition: "bottom", priceSize: "large" })} variant="secondary" size="sm">📄 PDF</Btn>
                    <Btn onClick={() => { setUnitForm(u); setView("editUnit"); }} variant="ghost" size="sm">Upravit</Btn>
                    <Btn onClick={() => deleteUnit(u.id)} variant="danger" size="sm">Smazat</Btn>
                  </div>
                </Card>
              ); })}
            </div>
          </>
        )}

        {/* EDIT BYT */}
        {view === "editUnit" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button onClick={() => { setView("units"); setUnitForm({}); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, cursor: "pointer", padding: 0 }}>← Byty</button>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>{unitForm.id ? "Upravit byt" : "Nový byt"} — {selectedProject?.name}</h2>
            </div>
            <Section title="Základní info" first>
              <FormField label="Číslo jednotky *"><TextInput value={unitForm.unit_number} onChange={v => setUnitForm(f => ({ ...f, unit_number: parseInt(v) || 0 }))} type="number" /></FormField>
              <FormField label="Budova"><TextInput value={unitForm.building} onChange={v => setUnitForm(f => ({ ...f, building: v }))} /></FormField>
              <FormField label="Patro"><TextInput value={unitForm.floor} onChange={v => setUnitForm(f => ({ ...f, floor: parseInt(v) || 0 }))} type="number" /></FormField>
              <FormField label="Dispozice"><SelectInput value={unitForm.disp} onChange={v => setUnitForm(f => ({ ...f, disp: v }))} options={[["1+kk","1+kk"],["2+kk","2+kk"],["3+kk","3+kk"],["4+kk","4+kk"]]} placeholder="-- vyberte --" /></FormField>
            </Section>
            <Section title="Parametry">
              <FormField label="Plocha (m²)"><TextInput value={unitForm.area} onChange={v => setUnitForm(f => ({ ...f, area: parseInt(v) || 0 }))} type="number" /></FormField>
              <FormField label="Orientace"><SelectInput value={unitForm.orientation} onChange={v => setUnitForm(f => ({ ...f, orientation: v }))} options={[["Sever","Sever"],["Jih","Jih"],["Východ","Východ"],["Západ","Západ"],["Jihovýchod","Jihovýchod"],["Jihozápad","Jihozápad"]]} placeholder="-- vyberte --" /></FormField>
              <div><CheckboxField label="Balkon/lodžie/terasa" checked={unitForm.balcony} onChange={v => setUnitForm(f => ({ ...f, balcony: v }))} /><div style={{ marginTop: 8 }}><SelectInput value={unitForm.balcony_type} onChange={v => setUnitForm(f => ({ ...f, balcony_type: v }))} options={[["Balkon","Balkon"],["Lodžie","Lodžie"],["Terasa","Terasa"]]} placeholder="-- typ --" /></div></div>
              <FormField label="Plocha balkonu (m²)"><TextInput value={unitForm.balcony_area} onChange={v => setUnitForm(f => ({ ...f, balcony_area: parseFloat(v) || 0 }))} type="number" /></FormField>
              <div style={{ display: "flex", gap: 16 }}><CheckboxField label="Sklep" checked={unitForm.cellar} onChange={v => setUnitForm(f => ({ ...f, cellar: v }))} /><CheckboxField label="Parkovací místo" checked={unitForm.parking} onChange={v => setUnitForm(f => ({ ...f, parking: v }))} /></div>
            </Section>
            <Section title="Ceny">
              <FormField label="Cena za m² (Kč)"><input type="number" value={unitForm.price_per_sqm || ""} onChange={e => { const psm = parseInt(e.target.value) || 0; const priceNet = psm && unitForm.area ? Math.round(psm * unitForm.area) : unitForm.price_net; setUnitForm(f => ({ ...f, price_per_sqm: psm, price_net: priceNet })); }} style={inputStyle} /></FormField>
              <div><div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", marginBottom: 5 }}>Cena bez DPH</div><div style={{ ...inputStyle, background: "#F0F4FA", color: C.muted }}>{unitForm.price_net ? Math.round(unitForm.price_net).toLocaleString("cs-CZ") + " Kč" : "—"}</div></div>
              <div><div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", marginBottom: 5 }}>Cena s DPH 12%</div><div style={{ ...inputStyle, background: "#F0F4FA", color: C.muted }}>{unitForm.price_net ? Math.round(unitForm.price_net * 1.12).toLocaleString("cs-CZ") + " Kč" : "—"}</div></div>
              <FormField label="Akční cena (Kč)"><TextInput value={unitForm.price_action} onChange={v => setUnitForm(f => ({ ...f, price_action: parseInt(v) || null }))} type="number" /></FormField>
              <div><CheckboxField label="Zobrazit cenu veřejně na webu" checked={unitForm.price_public !== false} onChange={v => setUnitForm(f => ({ ...f, price_public: v }))} /></div>
            </Section>
            <Section title="Fotky bytu">
              <div style={{ gridColumn: "1 / -1" }}>
                <input type="file" accept="image/*" multiple onChange={async (e) => { const files = Array.from(e.target.files); const urls = []; for (const file of files) { const fileName = `units/${Date.now()}-${file.name}`; const { error } = await supabase.storage.from("project-images").upload(fileName, file); if (!error) { const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(fileName); urls.push(urlData.publicUrl); } } setUnitForm(f => ({ ...f, images: [...(Array.isArray(f.images) ? f.images : []), ...urls] })); }} style={{ fontSize: 13 }} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>{(Array.isArray(unitForm.images) ? unitForm.images : []).map((url, i) => <div key={i} style={{ position: "relative" }}><img src={url} alt="" style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 8 }} /><button onClick={() => setUnitForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} style={{ position: "absolute", top: 2, right: 2, background: C.red, color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 11, cursor: "pointer" }}>×</button></div>)}</div>
              </div>
            </Section>
            <Section title="Půdorys">
              <div style={{ gridColumn: "1 / -1" }}>
                <input type="file" accept="image/*,.pdf" onChange={async (e) => { const file = e.target.files[0]; if (!file) return; const fileName = `floorplans/${Date.now()}-${file.name}`; const { error } = await supabase.storage.from("project-images").upload(fileName, file); if (!error) { const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(fileName); setUnitForm(f => ({ ...f, floor_plan: urlData.publicUrl })); } }} style={{ fontSize: 13 }} />
                {unitForm.floor_plan && <div style={{ marginTop: 10, position: "relative", display: "inline-block" }}><img src={unitForm.floor_plan} alt="Půdorys" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: 8 }} /><button onClick={() => setUnitForm(f => ({ ...f, floor_plan: null }))} style={{ position: "absolute", top: 4, right: 4, background: C.red, color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, fontSize: 12, cursor: "pointer" }}>×</button></div>}
              </div>
            </Section>
            <Section title="Stav a obchod">
              <FormField label="Stav"><SelectInput value={unitForm.status} onChange={v => setUnitForm(f => ({ ...f, status: v }))} options={[["available","Volná"],["reserved","Rezervovaná"],["sold","Prodaná"],["blocked","Blokovaná"],["withdrawn","Stažená"]]} placeholder="-- vyberte --" /></FormField>
              <FormField label="Kupující"><TextInput value={unitForm.buyer} onChange={v => setUnitForm(f => ({ ...f, buyer: v }))} /></FormField>
              <FormField label="Makléř — jméno"><TextInput value={unitForm.agent_name} onChange={v => setUnitForm(f => ({ ...f, agent_name: v }))} /></FormField>
              <FormField label="Makléř — telefon"><TextInput value={unitForm.agent_phone} onChange={v => setUnitForm(f => ({ ...f, agent_phone: v }))} /></FormField>
              <FormField label="Makléř — email"><TextInput value={unitForm.agent_email} onChange={v => setUnitForm(f => ({ ...f, agent_email: v }))} /></FormField>
              <FormField label="Makléř — web"><TextInput value={unitForm.agent_web} onChange={v => setUnitForm(f => ({ ...f, agent_web: v }))} /></FormField>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Fotka makléře</div>
                {unitForm.agent_photo && <button onClick={() => setUnitForm(f => ({ ...f, agent_photo: "" }))} style={{ fontSize: 12, color: C.red, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 6 }}>× Odebrat fotku</button>}
                <input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files[0]; if (!file) return; const fileName = `agents/${Date.now()}-${file.name}`; const { error } = await supabase.storage.from("project-images").upload(fileName, file); if (!error) { const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(fileName); setUnitForm(f => ({ ...f, agent_photo: urlData.publicUrl })); } }} style={{ fontSize: 13 }} />
                {unitForm.agent_photo && <img src={unitForm.agent_photo} alt="Makléř" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "50%", marginTop: 8 }} />}
              </div>
              <FormField label="Datum rezervace"><input type="date" value={unitForm.reserved_at || ""} onChange={e => setUnitForm(f => ({ ...f, reserved_at: e.target.value }))} style={inputStyle} /></FormField>
              <FormField label="Datum smlouvy"><input type="date" value={unitForm.contract_signed_at || ""} onChange={e => setUnitForm(f => ({ ...f, contract_signed_at: e.target.value }))} style={inputStyle} /></FormField>
              <FormField label="Poznámky" span><textarea value={unitForm.notes || ""} onChange={e => setUnitForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, height: 70, resize: "none" }} /></FormField>
            </Section>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}><Btn onClick={saveUnit} size="lg">Uložit</Btn><Btn onClick={() => { setView("units"); setUnitForm({}); }} variant="ghost" size="lg">Zrušit</Btn></div>
          </>
        )}

        {/* TIMELINE */}
        {view === "milestones" && selectedProject && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div><button onClick={() => setView("projects")} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 4 }}>← Projekty</button><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>{selectedProject.name} — Timeline</h2></div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn variant="ghost" onClick={async () => { if (!window.confirm("Přidat typické milníky?")) return; const typicke = ["Akvizice pozemku","Studie proveditelnosti","Dokumentace pro povolení","Stavební povolení","Výběr dodavatele","Zahájení výstavby","Hrubá stavba","Klientské změny","Kolaudace","Předání jednotek","Exit / prodej projektu"]; await supabase.from("milestones").insert(typicke.map((name, i) => ({ name, project_id: selectedProject.id, status: "inactive", order_index: i }))); loadMilestones(selectedProject); }}>📋 Typické milníky</Btn>
                <Btn onClick={() => { setMilestoneForm({}); setView("editMilestone"); }}>+ Nový milník</Btn>
              </div>
            </div>
            {milestones.length > 0 && (() => { const allDates = milestones.flatMap(m => [m.date_from, m.date_to].filter(Boolean)).map(d => new Date(d)); const minDate = new Date(Math.min(...allDates)); const maxDate = new Date(Math.max(...allDates)); const totalDays = Math.max((maxDate - minDate) / (1000*60*60*24), 1); const sc = { inactive: "#e0e0e0", active: C.accent, done: "#0F6E56", delayed: C.red }; return (<Card style={{ marginBottom: 16, overflowX: "auto" }}><div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Ganttův diagram</div><div style={{ minWidth: 600 }}>{milestones.map(m => { if (!m.date_from || !m.date_to) return null; const start = (new Date(m.date_from) - minDate) / (1000*60*60*24); const duration = (new Date(m.date_to) - new Date(m.date_from)) / (1000*60*60*24); const left = (start / totalDays) * 100; const width = Math.max((duration / totalDays) * 100, 1); const isDelayed = m.status !== "done" && new Date(m.date_to) < new Date(); return (<div key={m.id} style={{ display: "flex", alignItems: "center", marginBottom: 8, gap: 10 }}><div style={{ width: 160, fontSize: 11, color: C.text, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div><div style={{ flex: 1, height: 22, background: C.border, borderRadius: 4, position: "relative" }}><div style={{ position: "absolute", left: `${left}%`, width: `${width}%`, height: "100%", background: isDelayed ? C.red : sc[m.status] || "#e0e0e0", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 6, minWidth: 4 }}>{width > 8 && <span style={{ fontSize: 9, color: "#fff", whiteSpace: "nowrap" }}>{m.date_from} – {m.date_to}</span>}</div></div></div>); })}</div></Card>); })()}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {milestones.map(m => { const isDelayed = m.status !== "done" && m.date_to && new Date(m.date_to) < new Date(); const dep = m.depends_on ? milestones.find(d => d.id === m.depends_on) : null; return (
                <Card key={m.id} style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: `4px solid ${isDelayed ? C.red : m.status === "done" ? C.accent : C.border}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{m.name}</div>
                      {isDelayed && <Badge bg={C.redLight} color={C.red}>Zpožděno</Badge>}
                      {dep && dep.status !== "done" && <Badge bg={C.yellowLight} color="#633806">⚠️ Čeká na: {dep.name}</Badge>}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>{m.date_from} – {m.date_to}{m.responsible && ` · 👤 ${m.responsible}`}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select value={m.status} onChange={async e => { await supabase.from("milestones").update({ status: e.target.value }).eq("id", m.id); loadMilestones(selectedProject); }} style={{ ...selectStyle, width: "auto", borderRadius: 20, fontSize: 12 }}><option value="inactive">Neaktivní</option><option value="active">Probíhá</option><option value="done">Hotovo</option><option value="delayed">Zpožděno</option></select>
                    <Btn onClick={() => { setMilestoneForm(m); setView("editMilestone"); }} variant="ghost" size="sm">Upravit</Btn>
                    <Btn onClick={() => deleteMilestone(m.id)} variant="danger" size="sm">Smazat</Btn>
                  </div>
                </Card>
              ); })}
            </div>
          </>
        )}

        {/* EDIT MILESTONE */}
        {view === "editMilestone" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><button onClick={() => { setView("milestones"); setMilestoneForm({}); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, cursor: "pointer", padding: 0 }}>← Timeline</button><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Milník</h2></div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormField label="Název *" span><TextInput value={milestoneForm.name} onChange={v => setMilestoneForm(f => ({ ...f, name: v }))} /></FormField>
                <FormField label="Datum od"><input type="date" value={milestoneForm.date_from || ""} onChange={e => setMilestoneForm(f => ({ ...f, date_from: e.target.value }))} style={inputStyle} /></FormField>
                <FormField label="Datum do"><input type="date" value={milestoneForm.date_to || ""} onChange={e => setMilestoneForm(f => ({ ...f, date_to: e.target.value }))} style={inputStyle} /></FormField>
                <FormField label="Odpovědná osoba"><TextInput value={milestoneForm.responsible} onChange={v => setMilestoneForm(f => ({ ...f, responsible: v }))} /></FormField>
                <FormField label="Závisí na"><SelectInput value={milestoneForm.depends_on} onChange={v => setMilestoneForm(f => ({ ...f, depends_on: v || null }))} options={milestones.filter(m => m.id !== milestoneForm.id).map(m => [m.id, m.name])} placeholder="-- bez závislosti --" /></FormField>
                <FormField label="Stav"><SelectInput value={milestoneForm.status} onChange={v => setMilestoneForm(f => ({ ...f, status: v }))} options={[["inactive","Neaktivní"],["active","Probíhá"],["done","Hotovo"],["delayed","Zpožděno"]]} placeholder="-- vyberte --" /></FormField>
                <FormField label="Poznámky" span><textarea value={milestoneForm.notes || ""} onChange={e => setMilestoneForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, height: 70, resize: "none" }} /></FormField>
              </div>
            </Card>
            <div style={{ display: "flex", gap: 10 }}><Btn onClick={saveMilestone} size="lg">Uložit</Btn><Btn onClick={() => { setView("milestones"); setMilestoneForm({}); }} variant="ghost" size="lg">Zrušit</Btn></div>
          </>
        )}

        {/* KONTAKTY */}
        {view === "contacts" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Kontakty ({contacts.length})</h2><Btn onClick={() => { setContactForm({}); setView("editContact"); }}>+ Nový kontakt</Btn></div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input type="text" placeholder="Hledat kontakt..." value={contactSearch} onChange={e => setContactSearch(e.target.value)} style={{ ...inputStyle, flex: 1, borderRadius: 20 }} />
              <button onClick={() => setContactSearch("")} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: `1px solid ${C.border}`, background: !contactSearch.startsWith("__expiring") ? C.accent : "#fff", color: !contactSearch.startsWith("__expiring") ? "#fff" : C.muted }}>Všechny</button>
              <button onClick={() => setContactSearch("__expiring")} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: `1px solid ${C.border}`, background: contactSearch.startsWith("__expiring") ? C.yellowLight : "#fff", color: contactSearch.startsWith("__expiring") ? "#633806" : C.muted }}>⚠️ Expirující</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {contacts.filter(c => { if (contactSearch === "__expiring") return reservations.some(r => r.contact_id === c.id && r.valid_until && new Date(r.valid_until) - new Date() < 3*24*60*60*1000 && new Date(r.valid_until) > new Date()); return !contactSearch || c.name?.toLowerCase().includes(contactSearch.toLowerCase()) || c.email?.toLowerCase().includes(contactSearch.toLowerCase()); }).map(c => {
                const hasExpiring = reservations.some(r => r.contact_id === c.id && r.valid_until && new Date(r.valid_until) - new Date() < 3*24*60*60*1000 && new Date(r.valid_until) > new Date());
                return (<Card key={c.id} style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.name}</div>{hasExpiring && <Badge bg={C.yellowLight} color="#633806">⚠️ Expiruje rezervace</Badge>}</div><div style={{ fontSize: 12, color: C.muted }}>{c.phone && `📞 ${c.phone}`}{c.email && ` · ✉️ ${c.email}`}{c.projects?.name && ` · 🏗 ${c.projects.name}`}</div></div>
                  <div style={{ display: "flex", gap: 8 }}><Btn onClick={() => { setContactForm(c); setView("editContact"); }} variant="ghost" size="sm">Upravit</Btn><Btn onClick={() => deleteContact(c.id)} variant="danger" size="sm">Smazat</Btn></div>
                </Card>);
              })}
            </div>
          </>
        )}

        {/* EDIT KONTAKT */}
        {view === "editContact" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><button onClick={() => { setView("contacts"); setContactForm({}); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, cursor: "pointer", padding: 0 }}>← Kontakty</button><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>{contactForm.id ? "Upravit kontakt" : "Nový kontakt"}</h2></div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormField label="Jméno a příjmení *" span><TextInput value={contactForm.name} onChange={v => setContactForm(f => ({ ...f, name: v }))} /></FormField>
                <FormField label="Telefon"><TextInput value={contactForm.phone} onChange={v => setContactForm(f => ({ ...f, phone: v }))} /></FormField>
                <FormField label="E-mail"><TextInput value={contactForm.email} onChange={v => setContactForm(f => ({ ...f, email: v }))} type="email" /></FormField>
                <FormField label="Typ kontaktu"><SelectInput value={contactForm.type} onChange={v => setContactForm(f => ({ ...f, type: v }))} options={[["zajemce","Zájemce"],["kupujici","Kupující"],["investor","Investor"],["makler","Makléř"],["partner","Partner"],["dodavatel","Dodavatel"]]} placeholder="-- vyberte --" /></FormField>
                <FormField label="Zdroj kontaktu"><SelectInput value={contactForm.source} onChange={v => setContactForm(f => ({ ...f, source: v }))} options={[["web","Web"],["sreality","Sreality"],["bezrealitky","Bezrealitky"],["doporuceni","Doporučení"],["telefon","Telefon"],["email","E-mail"],["kampan","Kampaň"]]} placeholder="-- neznámý --" /></FormField>
                <FormField label="Stav"><SelectInput value={contactForm.status} onChange={v => setContactForm(f => ({ ...f, status: v }))} options={[["lead","Zájemce"],["interested","Má zájem"],["reserved","Rezervoval"],["buyer","Kupující"],["lost","Ztracen"]]} placeholder="-- vyberte --" /></FormField>
                <FormField label="Projekt"><SelectInput value={contactForm.project_id} onChange={v => setContactForm(f => ({ ...f, project_id: v || null }))} options={projects.map(p => [p.id, p.name])} placeholder="-- bez projektu --" /></FormField>
                <div style={{ paddingTop: 20 }}><CheckboxField label="GDPR souhlas udělen" checked={contactForm.gdpr} onChange={v => setContactForm(f => ({ ...f, gdpr: v }))} /></div>
                <FormField label="Poznámka" span><textarea value={contactForm.note || ""} onChange={e => setContactForm(f => ({ ...f, note: e.target.value }))} style={{ ...inputStyle, height: 70, resize: "none" }} /></FormField>
              </div>
            </Card>
            {contactForm.id && <CommunicationLog contactId={contactForm.id} />}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}><Btn onClick={saveContact} size="lg">Uložit</Btn><Btn onClick={() => { setView("contacts"); setContactForm({}); }} variant="ghost" size="lg">Zrušit</Btn></div>
          </>
        )}

        {/* PIPELINE */}
        {view === "leads" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Obchodní pipeline ({leads.length})</h2><Btn onClick={() => { setLeadForm({}); setView("editLead"); }}>+ Nový lead</Btn></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, overflowX: "auto" }}>
              {[["new","Nový",C.blueLight,C.blue],["contacted","Kontaktován",C.yellowLight,"#7A4A0A"],["viewing","Prohlídka","#F0EFFE","#4A3A9A"],["reservation","Rezervace",C.accentLight,"#0F6E56"],["contract","Smlouva","#E8F5E9","#1B5E20"],["closed","Uzavřeno","#E8F5E9","#1B5E20"],["lost","Ztraceno",C.redLight,C.red]].map(([status, label, bg, color]) => {
                const sl = leads.filter(l => l.status === status);
                return (<div key={status} style={{ background: bg, borderRadius: 12, padding: "12px 10px", minHeight: 100 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 10, textAlign: "center" }}>{label} ({sl.length})</div>
                  {sl.map(l => (<div key={l.id} onClick={() => { setLeadForm(l); setView("editLead"); }} style={{ background: "#fff", borderRadius: 9, padding: "9px 11px", marginBottom: 7, cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}><div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{l.contacts?.name}</div><div style={{ fontSize: 11, color: C.muted }}>{l.projects?.name}</div>{l.next_contact_date && <div style={{ fontSize: 10, color: new Date(l.next_contact_date) < new Date() ? C.red : C.muted, marginTop: 2 }}>📅 {l.next_contact_date}</div>}</div>))}
                </div>);
              })}
            </div>
          </>
        )}

        {/* EDIT LEAD */}
        {view === "editLead" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><button onClick={() => { setView("leads"); setLeadForm({}); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, cursor: "pointer", padding: 0 }}>← Pipeline</button><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Lead</h2></div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormField label="Kontakt *"><SelectInput value={leadForm.contact_id} onChange={v => setLeadForm(f => ({ ...f, contact_id: v }))} options={contacts.map(c => [c.id, c.name])} placeholder="-- vyberte --" /></FormField>
                <FormField label="Projekt"><SelectInput value={leadForm.project_id} onChange={v => setLeadForm(f => ({ ...f, project_id: v || null }))} options={projects.map(p => [p.id, p.name])} placeholder="-- bez projektu --" /></FormField>
                <FormField label="Dispozice"><SelectInput value={leadForm.preferred_disp} onChange={v => setLeadForm(f => ({ ...f, preferred_disp: v }))} options={[["1+kk","1+kk"],["2+kk","2+kk"],["3+kk","3+kk"],["4+kk","4+kk"]]} placeholder="-- vše --" /></FormField>
                <FormField label="Rozpočet (Kč)"><TextInput value={leadForm.budget} onChange={v => setLeadForm(f => ({ ...f, budget: parseInt(v) || null }))} type="number" /></FormField>
                <FormField label="Stav leadu"><SelectInput value={leadForm.status} onChange={v => setLeadForm(f => ({ ...f, status: v }))} options={[["new","Nový"],["contacted","Kontaktován"],["viewing","Prohlídka"],["reservation","Rezervace"],["contract","Smlouva"],["closed","Uzavřeno"],["lost","Ztraceno"]]} placeholder="-- vyberte --" /></FormField>
                <FormField label="Obchodník"><TextInput value={leadForm.assigned_to} onChange={v => setLeadForm(f => ({ ...f, assigned_to: v }))} /></FormField>
                <FormField label="Pravděpodobnost (%)"><TextInput value={leadForm.probability} onChange={v => setLeadForm(f => ({ ...f, probability: parseInt(v) || 0 }))} type="number" /></FormField>
                <FormField label="Termín kontaktu"><input type="date" value={leadForm.next_contact_date || ""} onChange={e => setLeadForm(f => ({ ...f, next_contact_date: e.target.value }))} style={inputStyle} /></FormField>
                <FormField label="Další krok" span><TextInput value={leadForm.next_step} onChange={v => setLeadForm(f => ({ ...f, next_step: v }))} /></FormField>
                <FormField label="Poznámky" span><textarea value={leadForm.notes || ""} onChange={e => setLeadForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, height: 70, resize: "none" }} /></FormField>
              </div>
            </Card>
            <div style={{ display: "flex", gap: 10 }}><Btn onClick={saveLead} size="lg">Uložit</Btn>{leadForm.id && <Btn onClick={() => deleteLead(leadForm.id)} variant="danger" size="lg">Smazat</Btn>}<Btn onClick={() => { setView("leads"); setLeadForm({}); }} variant="ghost" size="lg">Zrušit</Btn></div>
          </>
        )}

        {/* REZERVACE */}
        {view === "reservations" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Rezervace ({reservations.length})</h2><Btn onClick={() => { setReservationForm({}); setView("editReservation"); }}>+ Nová rezervace</Btn></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {reservations.map(r => { const isExpiring = r.valid_until && new Date(r.valid_until) - new Date() < 3*24*60*60*1000; const isExpired = r.valid_until && new Date(r.valid_until) < new Date(); return (
                <Card key={r.id} style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: `4px solid ${isExpired ? C.red : isExpiring ? C.yellow : C.border}` }}>
                  <div><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{r.contacts?.name}</div>{isExpired && <Badge bg={C.redLight} color={C.red}>Expirováno</Badge>}{isExpiring && !isExpired && <Badge bg={C.yellowLight} color="#633806">Brzy expiruje</Badge>}</div><div style={{ fontSize: 12, color: C.muted }}>Byt č. {r.units?.unit_number} · {r.units?.disp}{r.valid_until && ` · Platnost do: ${r.valid_until}`}</div>{r.reservation_fee && <div style={{ fontSize: 12, color: C.accent, marginTop: 2, fontWeight: 600 }}>Záloha: {r.reservation_fee.toLocaleString("cs-CZ")} Kč</div>}</div>
                  <div style={{ display: "flex", gap: 8 }}><Btn onClick={() => { setReservationForm(r); setView("editReservation"); }} variant="ghost" size="sm">Upravit</Btn><Btn onClick={() => deleteReservation(r.id)} variant="danger" size="sm">Smazat</Btn></div>
                </Card>
              ); })}
            </div>
          </>
        )}

        {/* EDIT REZERVACE */}
        {view === "editReservation" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><button onClick={() => { setView("reservations"); setReservationForm({}); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, cursor: "pointer", padding: 0 }}>← Rezervace</button><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Rezervace</h2></div>
            {reservationForm.unit_id && (() => { const unit = selectedProject?.units?.find(u => u.id === reservationForm.unit_id); return unit ? (<Card style={{ marginBottom: 16, background: C.accentLight, border: `1px solid #9FE1CB` }}><div style={{ fontSize: 13, fontWeight: 600, color: "#0F6E56" }}>Rezervace bytu</div><div style={{ fontSize: 13, color: "#0F6E56", marginTop: 4 }}>Byt č. {unit.unit_number} · {unit.disp} · {unit.area} m²</div></Card>) : null; })()}
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormField label="Projekt"><SelectInput value={reservationForm._project_id} onChange={async v => { setReservationForm(f => ({ ...f, _project_id: v, unit_id: null })); if (v) { const { data } = await supabase.from("units").select("id, unit_number, disp, floor, status").eq("project_id", v).order("unit_number"); setReservationForm(f => ({ ...f, _project_units: data || [] })); } }} options={projects.map(p => [p.id, p.name])} placeholder="-- vyberte projekt --" /></FormField>
                <FormField label="Byt"><SelectInput value={reservationForm.unit_id} onChange={v => setReservationForm(f => ({ ...f, unit_id: v }))} options={(reservationForm._project_units || []).map(u => [u.id, `č. ${u.unit_number} · ${u.disp} · ${u.floor}. p.`])} placeholder="-- vyberte byt --" /></FormField>
                <FormField label="Kontakt *"><SelectInput value={reservationForm.contact_id} onChange={v => setReservationForm(f => ({ ...f, contact_id: v }))} options={contacts.map(c => [c.id, c.name])} placeholder="-- vyberte --" /></FormField>
                <FormField label="Stav"><SelectInput value={reservationForm.status} onChange={v => setReservationForm(f => ({ ...f, status: v }))} options={[["active","Aktivní"],["expired","Expirovaná"],["converted","Převedena"],["cancelled","Zrušena"]]} placeholder="-- vyberte --" /></FormField>
                <FormField label="Datum rezervace"><input type="date" value={reservationForm.reserved_at || ""} onChange={e => setReservationForm(f => ({ ...f, reserved_at: e.target.value }))} style={inputStyle} /></FormField>
                <FormField label="Platnost do"><input type="date" value={reservationForm.valid_until || ""} onChange={e => setReservationForm(f => ({ ...f, valid_until: e.target.value }))} style={inputStyle} /></FormField>
                <FormField label="Rezervační poplatek (Kč)"><TextInput value={reservationForm.reservation_fee} onChange={v => setReservationForm(f => ({ ...f, reservation_fee: parseInt(v) || null }))} type="number" /></FormField>
                <div></div>
                <FormField label="Dokumenty" span>
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" multiple onChange={async (e) => { const files = Array.from(e.target.files); const urls = []; for (const file of files) { const fileName = `reservations/${Date.now()}-${file.name}`; const { error } = await supabase.storage.from("documents").upload(fileName, file); if (!error) { const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName); urls.push({ name: file.name, url: urlData.publicUrl }); } } const existing = Array.isArray(reservationForm.documents) ? reservationForm.documents : []; setReservationForm(f => ({ ...f, documents: [...existing, ...urls] })); }} style={{ fontSize: 13 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>{(Array.isArray(reservationForm.documents) ? reservationForm.documents : []).map((doc, i) => (<div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.bg, borderRadius: 8, padding: "8px 12px" }}><a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: C.blue, textDecoration: "none" }}>📄 {doc.name}</a><button onClick={() => setReservationForm(f => ({ ...f, documents: f.documents.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 16 }}>×</button></div>))}</div>
                </FormField>
                <FormField label="Poznámky" span><textarea value={reservationForm.notes || ""} onChange={e => setReservationForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, height: 70, resize: "none" }} /></FormField>
              </div>
            </Card>
            <div style={{ display: "flex", gap: 10 }}><Btn onClick={saveReservation} size="lg">Uložit</Btn>{reservationForm.id && <Btn onClick={() => deleteReservation(reservationForm.id)} variant="danger" size="lg">Smazat</Btn>}<Btn onClick={() => { setView("reservations"); setReservationForm({}); }} variant="ghost" size="lg">Zrušit</Btn></div>
          </>
        )}

        {/* ÚKOLY */}
        {view === "tasks" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Úkoly</h2><Btn onClick={() => { setTaskForm({ priority: "medium", status: "todo" }); setView("editTask"); }}>+ Nový úkol</Btn></div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {[["today","📅 Dnes"],["week","📆 Týden"],["todo","🔵 Nesplněné"],["done","✅ Splněné"],["all","Vše"]].map(([f, l]) => (<button key={f} onClick={() => setTaskFilter(f)} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: `1px solid ${C.border}`, background: taskFilter === f ? C.accent : "#fff", color: taskFilter === f ? "#fff" : C.muted }}>{l}</button>))}
            </div>
            {taskFilter === "today" && (() => { const today = new Date().toISOString().split("T")[0]; const overdue = tasks.filter(t => t.due_date < today && t.status !== "done"); return overdue.length > 0 ? (<div style={{ background: C.redLight, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}><div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 6 }}>⚠️ Po termínu ({overdue.length})</div>{overdue.map(t => <div key={t.id} style={{ fontSize: 13, color: C.red, marginBottom: 4 }}>• {t.title} — {t.due_date}</div>)}</div>) : null; })()}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {tasks.filter(t => { const today = new Date().toISOString().split("T")[0]; const weekEnd = new Date(Date.now() + 7*24*60*60*1000).toISOString().split("T")[0]; if (taskFilter === "today") return t.due_date === today && t.status !== "done"; if (taskFilter === "week") return t.due_date <= weekEnd && t.status !== "done"; if (taskFilter === "todo") return t.status !== "done"; if (taskFilter === "done") return t.status === "done"; return true; }).map(t => {
                const today = new Date().toISOString().split("T")[0]; const isOverdue = t.due_date < today && t.status !== "done";
                const pc = { high: C.red, medium: C.yellow, low: C.accent }; const pl = { high: "Vysoká", medium: "Střední", low: "Nízká" };
                const ti = { call: "📞", email: "✉️", meeting: "🤝", document: "📄", price: "💰", viewing: "🏠", contract: "📝", general: "✅" };
                const checklist = Array.isArray(t.checklist) ? t.checklist : []; const doneItems = checklist.filter(c => c.done).length;
                return (
                  <Card key={t.id} style={{ borderLeft: `4px solid ${isOverdue ? C.red : pc[t.priority] || C.border}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <button onClick={() => completeTask(t.id, t.status)} style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, marginTop: 2, border: `2px solid ${t.status === "done" ? C.accent : C.border}`, background: t.status === "done" ? C.accent : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>{t.status === "done" ? "✓" : ""}</button>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 18 }}>{ti[t.type] || "✅"}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: t.status === "done" ? C.muted : C.text, textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</span>
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: (pc[t.priority] || C.accent) + "20", color: pc[t.priority] || C.accent, fontWeight: 600, marginLeft: "auto" }}>{pl[t.priority]}</span>
                        </div>
                        {t.description && <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>{t.description}</div>}
                        {checklist.length > 0 && <div style={{ marginBottom: 8 }}><div style={{ height: 4, background: C.border, borderRadius: 2, marginBottom: 4 }}><div style={{ height: 4, width: `${checklist.length > 0 ? (doneItems/checklist.length)*100 : 0}%`, background: C.accent, borderRadius: 2 }} /></div><div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{doneItems}/{checklist.length} splněno</div>{checklist.map((item, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: item.done ? C.muted : C.text, marginBottom: 4 }}><input type="checkbox" checked={item.done} onChange={async () => { const nc = checklist.map((c, j) => j === i ? { ...c, done: !c.done } : c); await supabase.from("tasks").update({ checklist: nc }).eq("id", t.id); loadTasks(); }} style={{ accentColor: C.accent }} /><span style={{ textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span></div>))}</div>}
                        <div style={{ display: "flex", gap: 12, fontSize: 11, color: C.muted, flexWrap: "wrap" }}>{t.due_date && <span style={{ color: isOverdue ? C.red : C.muted }}>📅 {t.due_date}</span>}{t.assigned_to && <span>👤 {t.assigned_to}</span>}{t.projects?.name && <span>🏗 {t.projects.name}</span>}{t.contacts?.name && <span>👥 {t.contacts.name}</span>}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><Btn onClick={() => { setTaskForm(t); setView("editTask"); }} variant="ghost" size="sm">✏️</Btn><Btn onClick={() => deleteTask(t.id)} variant="danger" size="sm">×</Btn></div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* EDIT ÚKOL */}
        {view === "editTask" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><button onClick={() => { setView("tasks"); setTaskForm({}); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, cursor: "pointer", padding: 0 }}>← Úkoly</button><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Úkol</h2></div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormField label="Název *" span><TextInput value={taskForm.title} onChange={v => setTaskForm(f => ({ ...f, title: v }))} /></FormField>
                <FormField label="Typ"><SelectInput value={taskForm.type} onChange={v => setTaskForm(f => ({ ...f, type: v }))} options={[["general","✅ Obecný"],["call","📞 Hovor"],["email","✉️ E-mail"],["meeting","🤝 Schůzka"],["document","📄 Dokument"],["price","💰 Cena"],["viewing","🏠 Prohlídka"],["contract","📝 Smlouva"]]} placeholder="-- vyberte --" /></FormField>
                <FormField label="Stav"><SelectInput value={taskForm.status} onChange={v => setTaskForm(f => ({ ...f, status: v }))} options={[["todo","K řešení"],["inprogress","Probíhá"],["done","Hotovo"]]} placeholder="-- vyberte --" /></FormField>
                <FormField label="Termín"><input type="date" value={taskForm.due_date || ""} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} style={inputStyle} /></FormField>
                <FormField label="Priorita"><SelectInput value={taskForm.priority} onChange={v => setTaskForm(f => ({ ...f, priority: v }))} options={[["high","🔴 Vysoká"],["medium","🟡 Střední"],["low","🟢 Nízká"]]} placeholder="-- vyberte --" /></FormField>
                <FormField label="Odpovědná osoba"><TextInput value={taskForm.assigned_to} onChange={v => setTaskForm(f => ({ ...f, assigned_to: v }))} /></FormField>
                <FormField label="Projekt"><SelectInput value={taskForm.project_id} onChange={v => setTaskForm(f => ({ ...f, project_id: v || null }))} options={projects.map(p => [p.id, p.name])} placeholder="-- bez projektu --" /></FormField>
                <FormField label="Kontakt"><SelectInput value={taskForm.contact_id} onChange={v => setTaskForm(f => ({ ...f, contact_id: v || null }))} options={contacts.map(c => [c.id, c.name])} placeholder="-- bez kontaktu --" /></FormField>
                <FormField label="Popis" span><textarea value={taskForm.description || ""} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, height: 70, resize: "none" }} /></FormField>
                <FormField label="Checklist" span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(Array.isArray(taskForm.checklist) ? taskForm.checklist : []).map((item, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={item.done} onChange={() => { const nc = taskForm.checklist.map((c, j) => j === i ? { ...c, done: !c.done } : c); setTaskForm(f => ({ ...f, checklist: nc })); }} style={{ accentColor: C.accent }} /><input type="text" value={item.text} onChange={e => { const nc = taskForm.checklist.map((c, j) => j === i ? { ...c, text: e.target.value } : c); setTaskForm(f => ({ ...f, checklist: nc })); }} style={{ ...inputStyle, flex: 1 }} /><button onClick={() => setTaskForm(f => ({ ...f, checklist: f.checklist.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 16 }}>×</button></div>))}
                    <button onClick={() => setTaskForm(f => ({ ...f, checklist: [...(Array.isArray(f.checklist) ? f.checklist : []), { text: "", done: false }] }))} style={{ background: "#f0f0f0", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: "#555", alignSelf: "flex-start" }}>+ Přidat položku</button>
                  </div>
                </FormField>
              </div>
            </Card>
            <div style={{ display: "flex", gap: 10 }}><Btn onClick={saveTask} size="lg">Uložit</Btn>{taskForm.id && <Btn onClick={() => deleteTask(taskForm.id)} variant="danger" size="lg">Smazat</Btn>}<Btn onClick={() => { setView("tasks"); setTaskForm({}); }} variant="ghost" size="lg">Zrušit</Btn></div>
          </>
        )}

        {/* DOKUMENTY */}
        {view === "documents" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Dokumenty ({documents.length})</h2><Btn onClick={() => { setDocumentForm({}); setView("editDocument"); }}>+ Nahrát dokument</Btn></div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <input type="text" placeholder="Hledat..." value={documentSearch} onChange={e => setDocumentSearch(e.target.value)} style={{ ...inputStyle, flex: 1, borderRadius: 20 }} />
              {["all","presentation","drawing","permit","contract","photo","other"].map(f => (<button key={f} onClick={() => setDocumentFilter(f)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", border: `1px solid ${C.border}`, background: documentFilter === f ? C.accent : "#fff", color: documentFilter === f ? "#fff" : C.muted }}>{ {"all":"Vše","presentation":"Prezentace","drawing":"Výkresy","permit":"Povolení","contract":"Smlouvy","photo":"Fotky","other":"Ostatní"}[f] }</button>))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {documents.filter(d => { if (documentFilter !== "all" && d.type !== documentFilter) return false; if (documentSearch && !d.name.toLowerCase().includes(documentSearch.toLowerCase())) return false; return true; }).map(d => { const isPdf = d.file_name?.toLowerCase().endsWith(".pdf"); const isImage = ["jpg","jpeg","png","webp"].some(ext => d.file_name?.toLowerCase().endsWith(ext)); return (
                <Card key={d.id} style={{ padding: 0, overflow: "hidden" }}>
                  {isImage ? <img src={d.url} alt={d.name} style={{ width: "100%", height: 120, objectFit: "cover" }} /> : <div style={{ height: 80, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>{isPdf ? "📄" : "📁"}</div>}
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{d.projects?.name && `🏗 ${d.projects.name}`}{d.contacts?.name && ` · 👤 ${d.contacts.name}`}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: d.is_public ? C.accentLight : "#f0f0f0", color: d.is_public ? "#0F6E56" : "#666" }}>{d.is_public ? "Veřejný" : "Interní"}</span>
                      <div style={{ display: "flex", gap: 6 }}><a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.blue, textDecoration: "none" }}>👁</a><button onClick={() => { setDocumentForm(d); setView("editDocument"); }} style={{ background: "none", border: "none", fontSize: 12, color: C.muted, cursor: "pointer" }}>✏️</button><button onClick={() => deleteDocument(d.id)} style={{ background: "none", border: "none", fontSize: 12, color: C.red, cursor: "pointer" }}>×</button></div>
                    </div>
                  </div>
                </Card>
              ); })}
            </div>
          </>
        )}

        {/* EDIT DOKUMENT */}
        {view === "editDocument" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><button onClick={() => { setView("documents"); setDocumentForm({}); }} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, cursor: "pointer", padding: 0 }}>← Dokumenty</button><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Dokument</h2></div>
            {!documentForm.id && <Card style={{ marginBottom: 16 }}><div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 10 }}>Soubor</div><input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip" onChange={async (e) => { const file = e.target.files[0]; if (!file) return; const fileName = `docs/${Date.now()}-${file.name}`; const { error } = await supabase.storage.from("documents").upload(fileName, file); if (!error) { const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName); setDocumentForm(f => ({ ...f, url: urlData.publicUrl, file_name: file.name, file_size: file.size, name: f.name || file.name })); } }} style={{ fontSize: 13 }} />{documentForm.url && <div style={{ fontSize: 12, color: C.accent, marginTop: 8 }}>✓ {documentForm.file_name}</div>}</Card>}
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FormField label="Název *" span><TextInput value={documentForm.name} onChange={v => setDocumentForm(f => ({ ...f, name: v }))} /></FormField>
                <FormField label="Typ"><SelectInput value={documentForm.type} onChange={v => setDocumentForm(f => ({ ...f, type: v }))} options={[["presentation","Prezentace"],["drawing","Výkres"],["permit","Stavební povolení"],["contract","Smlouva"],["reservation_contract","Rezervační smlouva"],["purchase_contract","Kupní smlouva"],["photo","Fotky"],["visualization","Vizualizace"],["price_list","Ceník"],["technical","Technická dok."],["other","Ostatní"]]} placeholder="-- vyberte --" /></FormField>
                <FormField label="Projekt"><SelectInput value={documentForm.project_id} onChange={v => setDocumentForm(f => ({ ...f, project_id: v || null }))} options={projects.map(p => [p.id, p.name])} placeholder="-- bez projektu --" /></FormField>
                <FormField label="Kontakt"><SelectInput value={documentForm.contact_id} onChange={v => setDocumentForm(f => ({ ...f, contact_id: v || null }))} options={contacts.map(c => [c.id, c.name])} placeholder="-- bez kontaktu --" /></FormField>
                <div style={{ paddingTop: 20 }}><CheckboxField label="Veřejný dokument (viditelný zákazníkům)" checked={documentForm.is_public} onChange={v => setDocumentForm(f => ({ ...f, is_public: v }))} /></div>
              </div>
            </Card>
            <div style={{ display: "flex", gap: 10 }}><Btn onClick={saveDocument} size="lg">Uložit</Btn><Btn onClick={() => { setView("documents"); setDocumentForm({}); }} variant="ghost" size="lg">Zrušit</Btn></div>
          </>
        )}

        {/* AI ASISTENT */}
        {view === "ai" && (
          <>
            <div style={{ marginBottom: 24 }}><h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>🤖 AI Asistent</h2><div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Analýzy a reporty generované umělou inteligencí</div></div>
            <Card style={{ marginBottom: 20 }}><FormField label="Vyberte projekt"><SelectInput value={aiSelectedProject} onChange={v => { setAiSelectedProject(v); setAiResult(""); }} options={projects.map(p => [p.id, p.name])} placeholder="-- vyberte projekt --" /></FormField></Card>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
              {[
                { icon: "📊", title: "Investor report", color: C.blue, fn: async () => { if (!aiSelectedProject) { alert("Vyberte projekt"); return; } const p = projects.find(pr => pr.id === aiSelectedProject); const pct = p.total_units > 0 ? Math.round((p.sold_units/p.total_units)*100) : 0; await callAI(`Vygeneruj profesionální investor report pro projekt:\n\nNázev: ${p.name}\nLokalita: ${p.location}\nTyp: ${p.type}\nDokončení: ${p.completion}\nCelkem bytů: ${p.total_units}\nProdáno: ${p.sold_units} (${pct}%)\nCena od: ${p.price_from?.toLocaleString("cs-CZ")} Kč\n\nReport obsahuje: 1) Executive summary, 2) Klíčové parametry, 3) Prodejní progress, 4) Silné stránky, 5) Doporučení. Piš česky.`); } },
                { icon: "🔍", title: "Kontrola dat", color: C.accent, fn: async () => { if (!aiSelectedProject) { alert("Vyberte projekt"); return; } const p = projects.find(pr => pr.id === aiSelectedProject); const { data: unitData } = await supabase.from("units").select("*").eq("project_id", aiSelectedProject); const units = unitData || []; const mp = []; if (!p.description) mp.push("popis"); if (!p.address) mp.push("adresa"); if (!p.lat) mp.push("poloha"); const ui = units.map(u => { const iss = []; if (!u.price_net) iss.push("cena"); if (!u.area) iss.push("plocha"); if (!u.images || u.images.length === 0) iss.push("fotky"); if (!u.floor_plan) iss.push("půdorys"); return iss.length > 0 ? `Byt č.${u.unit_number}: chybí ${iss.join(", ")}` : null; }).filter(Boolean); await callAI(`Zkontroluj data projektu:\n\nPROJEKT: ${p.name}\nChybí: ${mp.length > 0 ? mp.join(", ") : "vše ok"}\nBytů: ${units.length}\nByty s problémy:\n${ui.slice(0,10).join("\n")}\n\nNapiš doporučení. Piš česky.`); } },
                { icon: "💰", title: "Doporučení ceny", color: "#7A4A0A", fn: async () => { if (!aiSelectedProject) { alert("Vyberte projekt"); return; } const p = projects.find(pr => pr.id === aiSelectedProject); const { data: unitData } = await supabase.from("units").select("disp, price_per_sqm").eq("project_id", aiSelectedProject); const units = unitData || []; const avgPrice = units.filter(u => u.price_per_sqm).reduce((s, u, _, a) => s + u.price_per_sqm / a.length, 0); await callAI(`Analyzuj ceny projektu:\n\nPROJEKT: ${p.name}\nLokalita: ${p.location}\nPrůměr/m²: ${Math.round(avgPrice).toLocaleString("cs-CZ")} Kč\n\n1) Zhodnoť vs trh, 2) Doporuč ceny, 3) Navrhni strategii. Piš česky s čísly.`); } },
              ].map(item => (
                <Card key={item.title} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6, flex: 1 }}>{item.title}</div>
                  <button onClick={item.fn} style={{ background: item.color, color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Generovat</button>
                </Card>
              ))}
            </div>
            {(aiLoading || aiResult) && (<Card>{aiLoading ? (<div style={{ textAlign: "center", color: C.muted, padding: 30 }}><div style={{ fontSize: 32, marginBottom: 10 }}>🤖</div><div>AI analyzuje data...</div></div>) : (<><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Výsledek</div><button onClick={() => navigator.clipboard.writeText(aiResult)} style={{ background: "#f0f0f0", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer" }}>📋 Kopírovat</button></div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiResult}</div></>)}</Card>)}
          </>
        )}

        {/* NASTAVENÍ */}
        {view === "settings" && (
          <>
            <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 700, color: C.text }}>Nastavení webu</h2>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", marginBottom: 14 }}>Texty na hlavní stránce</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["hero_label","Malý text nahoře"],["hero_title","Hlavní nadpis"],["hero_subtitle","Podnadpis"],["company_name","Název firmy"],["phone","Telefon"]].map(([key, label]) => (<FormField key={key} label={label}><TextInput value={settings[key]} onChange={v => setSettings(s => ({ ...s, [key]: v }))} /></FormField>))}
              </div>
              <div style={{ marginTop: 14 }}>
                <FormField label="Logo firmy">
                  <input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files[0]; if (!file) return; const fileName = `settings/logo-${Date.now()}-${file.name}`; const { error } = await supabase.storage.from("project-images").upload(fileName, file); if (!error) { const { data: urlData } = supabase.storage.from("project-images").getPublicUrl(fileName); setSettings(s => ({ ...s, company_logo: urlData.publicUrl })); } }} style={{ fontSize: 13 }} />
                  {settings.company_logo && <img src={settings.company_logo} alt="Logo" style={{ height: 50, objectFit: "contain", marginTop: 10 }} />}
                </FormField>
              </div>
            </Card>
            <Btn size="lg" onClick={async () => { setSettingsLoading(true); for (const [key, value] of Object.entries(settings)) { await supabase.from("settings").upsert({ key, value }); } setSettingsLoading(false); alert("Uloženo!"); }}>{settingsLoading ? "Ukládám..." : "Uložit nastavení"}</Btn>
          </>
        )}

        {/* UŽIVATELÉ */}
        {view === "users" && currentUser?.role === "admin" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text }}>Uživatelé ({adminUsers.length})</h2><Btn onClick={() => setUserForm({ role: "agent" })}>+ Nový uživatel</Btn></div>
            {userForm.role !== undefined && (<Card style={{ marginBottom: 16 }}><div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>{userForm.id ? "Upravit" : "Nový uživatel"}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><FormField label="Celé jméno"><TextInput value={userForm.full_name} onChange={v => setUserForm(f => ({ ...f, full_name: v }))} /></FormField><FormField label="Uživatelské jméno *"><TextInput value={userForm.username} onChange={v => setUserForm(f => ({ ...f, username: v }))} /></FormField><FormField label={`Heslo ${userForm.id ? "(prázdné = beze změny)" : "*"}`}><input type="password" value={userForm.password || ""} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} style={inputStyle} /></FormField><FormField label="E-mail"><TextInput value={userForm.email} onChange={v => setUserForm(f => ({ ...f, email: v }))} type="email" /></FormField><FormField label="Role"><SelectInput value={userForm.role} onChange={v => setUserForm(f => ({ ...f, role: v }))} options={[["admin","Admin — plný přístup"],["agent","Makléř — omezený přístup"]]} placeholder="-- vyberte --" /></FormField></div><div style={{ display: "flex", gap: 10, marginTop: 16 }}><Btn onClick={saveAdminUser}>Uložit</Btn><Btn onClick={() => setUserForm({})} variant="ghost">Zrušit</Btn></div></Card>)}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {adminUsers.map(u => (<Card key={u.id} style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}><div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{u.full_name || u.username}</div><Badge bg={u.role === "admin" ? C.blueLight : C.accentLight} color={u.role === "admin" ? C.blue : "#0F6E56"}>{u.role === "admin" ? "Admin" : "Makléř"}</Badge>{u.id === currentUser?.id && <span style={{ fontSize: 11, color: C.muted }}>(vy)</span>}</div><div style={{ fontSize: 12, color: C.muted }}>@{u.username}{u.email && ` · ${u.email}`}</div></div><div style={{ display: "flex", gap: 8 }}><Btn onClick={() => setUserForm(u)} variant="ghost" size="sm">Upravit</Btn>{u.id !== currentUser?.id && <Btn onClick={() => deleteAdminUser(u.id)} variant="danger" size="sm">Smazat</Btn>}</div></Card>))}
            </div>
          </>
        )}

        {/* PDF EDITOR */}
        {pdfEditor && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: 16, width: "95vw", maxWidth: 1100, maxHeight: "95vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Upravit PDF nabídku</div><button onClick={() => setPdfEditor(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.muted }}>×</button></div>
              <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  {[["name","Název projektu","project"],["address","Adresa","project"],["unit_number","Číslo bytu","unit"],["disp","Dispozice","unit"],["area","Plocha (m²)","unit"],["floor","Patro","unit"],["price_net","Cena bez DPH","unit"],["agent_name","Jméno makléře","unit"],["agent_phone","Telefon makléře","unit"]].map(([field, label, obj]) => (<FormField key={field} label={label}><input type="text" value={pdfEditor[obj][field] || ""} onChange={e => setPdfEditor(prev => ({ ...prev, [obj]: { ...prev[obj], [field]: e.target.value } }))} style={inputStyle} /></FormField>))}
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Design PDF</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div><div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>Šablona</div><div style={{ display: "flex", gap: 8 }}>{[["minimal","Minimalistická"],["premium","Prémiová"],["color","Barevná"]].map(([v, l]) => (<button key={v} onClick={() => setPdfEditor(prev => ({ ...prev, template: v }))} style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, cursor: "pointer", border: `1px solid ${C.border}`, background: pdfEditor.template === v ? C.accent : "#fff", color: pdfEditor.template === v ? "#fff" : C.text }}>{l}</button>))}</div></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>{[["colorHeader","Barva hlavičky"],["colorPrice","Barva ceny"],["colorAccent","Barva akcentu"]].map(([field, label]) => (<FormField key={field} label={label}><input type="color" value={pdfEditor[field]} onChange={e => setPdfEditor(prev => ({ ...prev, [field]: e.target.value }))} style={{ width: "100%", height: 40, borderRadius: 8, border: `1px solid ${C.border}`, cursor: "pointer" }} /></FormField>))}</div>
                    <div><div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>Poloha fotek</div><div style={{ display: "flex", gap: 8 }}>{[["top","Nahoře"],["bottom","Dole"],["none","Skrýt"]].map(([v, l]) => (<button key={v} onClick={() => setPdfEditor(prev => ({ ...prev, photosPosition: v }))} style={{ flex: 1, padding: "8px", borderRadius: 9, fontSize: 12, cursor: "pointer", border: `1px solid ${C.border}`, background: pdfEditor.photosPosition === v ? C.accent : "#fff", color: pdfEditor.photosPosition === v ? "#fff" : C.text }}>{l}</button>))}</div></div>
                    <div><div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>Poloha makléře</div><div style={{ display: "flex", gap: 8 }}>{[["bottom","Dole"],["right","Vpravo"],["none","Skrýt"]].map(([v, l]) => (<button key={v} onClick={() => setPdfEditor(prev => ({ ...prev, agentPosition: v }))} style={{ flex: 1, padding: "8px", borderRadius: 9, fontSize: 12, cursor: "pointer", border: `1px solid ${C.border}`, background: pdfEditor.agentPosition === v ? C.accent : "#fff", color: pdfEditor.agentPosition === v ? "#fff" : C.text }}>{l}</button>))}</div></div>
                    <div><div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>Velikost fotky makléře</div><input type="range" min="50" max="200" value={pdfEditor.agentPhotoSize} onChange={e => setPdfEditor(prev => ({ ...prev, agentPhotoSize: parseInt(e.target.value) }))} style={{ width: "100%", accentColor: C.accent }} /><div style={{ fontSize: 11, color: C.muted, textAlign: "center" }}>{pdfEditor.agentPhotoSize} px</div></div>
                    <div><div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>Tvar fotky makléře</div><div style={{ display: "flex", gap: 8 }}>{[["circle","Kulatá"],["square","Čtvercová"],["rounded","Zaoblená"]].map(([v, l]) => (<button key={v} onClick={() => setPdfEditor(prev => ({ ...prev, agentPhotoShape: v }))} style={{ flex: 1, padding: "8px", borderRadius: 9, fontSize: 12, cursor: "pointer", border: `1px solid ${C.border}`, background: pdfEditor.agentPhotoShape === v ? C.accent : "#fff", color: pdfEditor.agentPhotoShape === v ? "#fff" : C.text }}>{l}</button>))}</div></div>
                    <div><div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8, textTransform: "uppercase" }}>Velikost ceny</div><div style={{ display: "flex", gap: 8 }}>{[["large","Velká"],["small","Malá"]].map(([v, l]) => (<button key={v} onClick={() => setPdfEditor(prev => ({ ...prev, priceSize: v }))} style={{ flex: 1, padding: "8px", borderRadius: 9, fontSize: 12, cursor: "pointer", border: `1px solid ${C.border}`, background: pdfEditor.priceSize === v ? C.accent : "#fff", color: pdfEditor.priceSize === v ? "#fff" : C.text }}>{l}</button>))}</div></div>
                  </div>
                </div>
              </div>
              <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
                <Btn onClick={async () => { const { previewUnitPDF } = await import("./UnitPDF"); const url = await previewUnitPDF(pdfEditor.project, pdfEditor.unit, { agentPhotoSize: pdfEditor.agentPhotoSize, agentPhotoShape: pdfEditor.agentPhotoShape, template: pdfEditor.template, colorHeader: pdfEditor.colorHeader, colorPrice: pdfEditor.colorPrice, colorAccent: pdfEditor.colorAccent, photosPosition: pdfEditor.photosPosition, agentPosition: pdfEditor.agentPosition, priceSize: pdfEditor.priceSize }); setPdfPreview(url); }} style={{ flex: 1 }}>Zobrazit náhled</Btn>
                <Btn onClick={() => setPdfEditor(null)} variant="ghost">Zrušit</Btn>
              </div>
            </div>
          </div>
        )}

        {/* PDF PREVIEW */}
        {pdfPreview && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#fff", borderRadius: 16, width: "80vw", height: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Náhled PDF</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setPdfPreview(null)} style={{ background: "none", border: "none", color: C.accent, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>← Upravit</button>
                  <a href={pdfPreview} download="nabidka.pdf" style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>Stáhnout</a>
                  <button onClick={() => { setPdfPreview(null); setPdfEditor(null); }} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, cursor: "pointer" }}>Zavřít</button>
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