import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// SUPABASE CONFIG — replace with your project values
// ============================================================
const SUPABASE_URL = "https://ugweofmjhpxrilvmbcmd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnd2VvZm1qaHB4cmlsdm1iY21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NjkwMjAsImV4cCI6MjA5NTQ0NTAyMH0.DGUuoYhHYnPUR7aUcIl0qdFh974AA2E1NZd1f_K-PVU";

const supabase = (() => {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
  const q = (table, params = "") =>
    fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, { headers }).then((r) => r.json());
  const post = (table, body) =>
    fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify(body),
    }).then((r) => r.json());
  const patch = (table, id, body) =>
    fetch(`${SUPABASE_URL}/rest/v1/${table}?part_id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify(body),
    }).then((r) => r.json());
  const del = (table, id) =>
    fetch(`${SUPABASE_URL}/rest/v1/${table}?part_id=eq.${id}`, {
      method: "DELETE",
      headers,
    });
  const upload = async (file) => {
    const ext = file.name.split(".").pop();
    const path = `parts/${Date.now()}.${ext}`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/part-photos/${path}`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/part-photos/${path}`;
  };
  return { q, post, patch, del, upload };
})();

// ============================================================
// CONSTANTS
// ============================================================
const BAYS = ["A", "B", "C", "D"];
const LEVELS = [1, 2, 3, 4, 5];
const ALL_BLOCKS = BAYS.flatMap((b) => LEVELS.map((l) => `${b}${l}`));
const CATEGORIES = ["Electronics", "Mechanical", "Pneumatics", "Sensors", "Cables", "Fasteners", "Tools", "Other"];

// ============================================================
// STYLES
// ============================================================
const G = {
  bg: "#0d0f0e",
  panel: "#141716",
  card: "#1a1e1c",
  border: "#2a2f2d",
  accent: "#c8f04a",
  accentDim: "#8aaa2a",
  accentGlow: "rgba(200,240,74,0.15)",
  text: "#e8ede9",
  muted: "#7a8a7d",
  danger: "#ff4f4f",
  warn: "#ffb347",
  empty: "#111413",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${G.bg};
    color: ${G.text};
    font-family: 'IBM Plex Mono', monospace;
    min-height: 100vh;
    overflow-x: hidden;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${G.bg}; }
  ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 2px; }

  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  /* HEADER */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    height: 56px;
    border-bottom: 1px solid ${G.border};
    background: ${G.panel};
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .header-logo {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 22px;
    letter-spacing: 2px;
    color: ${G.accent};
    text-transform: uppercase;
  }
  .header-logo span { color: ${G.muted}; font-weight: 400; }
  .header-status {
    font-size: 10px;
    color: ${G.muted};
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: ${G.accent};
    box-shadow: 0 0 6px ${G.accent};
    animation: pulse 2s infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  /* NAV */
  .nav {
    display: flex;
    gap: 2px;
    padding: 8px 16px;
    background: ${G.panel};
    border-bottom: 1px solid ${G.border};
    overflow-x: auto;
  }
  .nav-btn {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 6px 16px;
    border: 1px solid transparent;
    border-radius: 3px;
    background: transparent;
    color: ${G.muted};
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .nav-btn:hover { color: ${G.text}; border-color: ${G.border}; }
  .nav-btn.active {
    background: ${G.accentGlow};
    border-color: ${G.accent};
    color: ${G.accent};
  }

  /* MAIN */
  .main { flex: 1; padding: 24px; max-width: 1200px; margin: 0 auto; width: 100%; }

  /* SETUP BANNER */
  .setup-banner {
    background: #1a1500;
    border: 1px solid #554400;
    border-radius: 6px;
    padding: 16px 20px;
    margin-bottom: 24px;
    font-size: 11px;
    color: ${G.warn};
    line-height: 1.8;
  }
  .setup-banner strong { color: #ffd080; display: block; margin-bottom: 6px; font-size: 13px; }
  .setup-banner code {
    background: #2a1f00;
    border: 1px solid #554400;
    border-radius: 3px;
    padding: 2px 6px;
    font-family: 'IBM Plex Mono', monospace;
    color: #ffd080;
    font-size: 10px;
  }

  /* SECTION TITLE */
  .section-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 20px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${G.text};
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${G.border};
  }

  /* RACK GRID */
  .rack-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .rack-legend {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    color: ${G.muted};
    letter-spacing: 0.5px;
  }
  .legend-dot {
    width: 10px; height: 10px;
    border-radius: 2px;
  }

  .rack-wrapper {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }
  .rack-levels {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 0;
  }
  .rack-level-label {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: ${G.muted};
    letter-spacing: 1px;
    width: 28px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 600;
  }

  .rack-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    flex: 1;
  }
  .bay-header {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 14px;
    letter-spacing: 2px;
    color: ${G.muted};
    text-align: center;
    margin-bottom: 2px;
  }
  .rack-headers {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 4px;
    margin-left: 36px;
  }

  .block-cell {
    height: 80px;
    border: 1px solid ${G.border};
    border-radius: 4px;
    background: ${G.empty};
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    position: relative;
    overflow: hidden;
  }
  .block-cell::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%);
    pointer-events: none;
  }
  .block-cell.has-items {
    background: #162018;
    border-color: #2d4030;
  }
  .block-cell.has-items:hover {
    border-color: ${G.accent};
    background: #1c2a1e;
    box-shadow: 0 0 16px ${G.accentGlow};
    transform: translateY(-1px);
  }
  .block-cell.empty:hover {
    border-color: ${G.border};
    background: #151918;
  }
  .block-id {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 22px;
    letter-spacing: 1px;
    color: ${G.muted};
    line-height: 1;
  }
  .block-cell.has-items .block-id { color: ${G.accent}; }
  .block-count {
    font-size: 10px;
    color: ${G.muted};
    letter-spacing: 0.5px;
  }
  .block-cell.has-items .block-count { color: #7aaa7d; }
  .block-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: ${G.accent};
    transition: width 0.3s;
  }

  /* SEARCH */
  .search-bar-wrap {
    position: relative;
    margin-bottom: 20px;
  }
  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: ${G.muted};
    font-size: 14px;
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    background: ${G.card};
    border: 1px solid ${G.border};
    border-radius: 4px;
    color: ${G.text};
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    padding: 12px 14px 12px 40px;
    outline: none;
    transition: border-color 0.15s;
  }
  .search-input:focus { border-color: ${G.accent}; }
  .search-input::placeholder { color: ${G.muted}; }

  /* PARTS TABLE */
  .parts-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  .parts-table th {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: ${G.muted};
    padding: 10px 14px;
    text-align: left;
    border-bottom: 1px solid ${G.border};
    background: ${G.panel};
  }
  .parts-table td {
    padding: 10px 14px;
    border-bottom: 1px solid ${G.border};
    vertical-align: middle;
    color: ${G.text};
  }
  .parts-table tr:hover td { background: ${G.card}; }
  .part-thumb {
    width: 36px;
    height: 36px;
    border-radius: 3px;
    object-fit: cover;
    border: 1px solid ${G.border};
  }
  .part-thumb-placeholder {
    width: 36px;
    height: 36px;
    border-radius: 3px;
    background: ${G.border};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: ${G.muted};
  }
  .block-badge {
    display: inline-block;
    background: ${G.accentGlow};
    border: 1px solid ${G.accentDim};
    color: ${G.accent};
    border-radius: 3px;
    padding: 2px 8px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 1px;
  }
  .cat-badge {
    display: inline-block;
    background: ${G.card};
    border: 1px solid ${G.border};
    color: ${G.muted};
    border-radius: 3px;
    padding: 2px 8px;
    font-size: 10px;
    letter-spacing: 0.5px;
  }
  .qty-num {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 18px;
    color: ${G.text};
  }

  /* ACTION BUTTONS */
  .btn {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 8px 18px;
    border-radius: 3px;
    border: 1px solid;
    cursor: pointer;
    transition: all 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn-primary {
    background: ${G.accent};
    border-color: ${G.accent};
    color: ${G.bg};
  }
  .btn-primary:hover { background: #d4ff50; box-shadow: 0 0 16px ${G.accentGlow}; }
  .btn-ghost {
    background: transparent;
    border-color: ${G.border};
    color: ${G.muted};
  }
  .btn-ghost:hover { border-color: ${G.text}; color: ${G.text}; }
  .btn-danger {
    background: transparent;
    border-color: #ff4f4f44;
    color: ${G.danger};
    font-size: 11px;
    padding: 5px 12px;
  }
  .btn-danger:hover { background: #ff4f4f22; border-color: ${G.danger}; }
  .btn-sm { padding: 5px 12px; font-size: 11px; }
  .btn-edit {
    background: transparent;
    border-color: ${G.border};
    color: ${G.muted};
    font-size: 11px;
    padding: 5px 12px;
  }
  .btn-edit:hover { border-color: ${G.accent}; color: ${G.accent}; }

  /* MODAL */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.8);
    backdrop-filter: blur(4px);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    animation: fadeIn 0.15s;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal {
    background: ${G.panel};
    border: 1px solid ${G.border};
    border-radius: 8px;
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp 0.2s;
  }
  @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:none;opacity:1} }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid ${G.border};
  }
  .modal-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 18px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${G.text};
  }
  .modal-close {
    background: transparent;
    border: none;
    color: ${G.muted};
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
    line-height: 1;
    transition: color 0.15s;
  }
  .modal-close:hover { color: ${G.text}; }
  .modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
  .modal-footer {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 16px 24px;
    border-top: 1px solid ${G.border};
  }

  /* FORM */
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-label {
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: ${G.muted};
  }
  .field-input, .field-select, .field-textarea {
    background: ${G.card};
    border: 1px solid ${G.border};
    border-radius: 4px;
    color: ${G.text};
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    padding: 10px 12px;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
  }
  .field-input:focus, .field-select:focus, .field-textarea:focus { border-color: ${G.accent}; }
  .field-select option { background: ${G.card}; }
  .field-textarea { resize: vertical; min-height: 80px; }

  /* PHOTO UPLOAD */
  .photo-upload {
    border: 2px dashed ${G.border};
    border-radius: 6px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.15s;
    position: relative;
    overflow: hidden;
  }
  .photo-upload:hover { border-color: ${G.accent}; background: ${G.accentGlow}; }
  .photo-upload input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  .photo-upload-text { font-size: 11px; color: ${G.muted}; margin-top: 6px; }
  .photo-preview {
    width: 100%;
    height: 140px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid ${G.border};
    margin-top: 8px;
  }

  /* BLOCK DETAIL PANEL */
  .block-detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }
  .block-detail-id {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 56px;
    color: ${G.accent};
    line-height: 1;
    letter-spacing: 2px;
  }
  .block-detail-meta { color: ${G.muted}; font-size: 11px; line-height: 2; }

  /* STATS ROW */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }
  .stat-card {
    background: ${G.card};
    border: 1px solid ${G.border};
    border-radius: 6px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .stat-label { font-size: 10px; color: ${G.muted}; letter-spacing: 1px; text-transform: uppercase; }
  .stat-value {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800;
    font-size: 32px;
    color: ${G.accent};
    line-height: 1;
  }
  .stat-sub { font-size: 10px; color: ${G.muted}; }

  /* EMPTY STATE */
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: ${G.muted};
  }
  .empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.4; }
  .empty-text { font-size: 12px; letter-spacing: 0.5px; }

  /* TOAST */
  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: ${G.card};
    border: 1px solid ${G.border};
    border-radius: 6px;
    padding: 12px 20px;
    font-size: 12px;
    color: ${G.text};
    z-index: 999;
    animation: toastIn 0.2s;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    max-width: 320px;
  }
  .toast.success { border-color: ${G.accentDim}; color: ${G.accent}; }
  .toast.error { border-color: #ff4f4f66; color: ${G.danger}; }
  @keyframes toastIn { from{transform:translateX(20px);opacity:0} to{transform:none;opacity:1} }

  /* LOADING */
  .spinner {
    display: inline-block;
    width: 16px; height: 16px;
    border: 2px solid ${G.border};
    border-top-color: ${G.accent};
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin { to{transform:rotate(360deg)} }

  /* TOOLBAR */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 10px;
  }

  /* RESPONSIVE */
  @media (max-width: 700px) {
    .main { padding: 12px; }
    .rack-grid { grid-template-columns: repeat(4, 1fr); gap: 5px; }
    .block-cell { height: 60px; }
    .block-id { font-size: 16px; }
    .block-count { display: none; }
    .parts-table th:nth-child(4), .parts-table td:nth-child(4),
    .parts-table th:nth-child(5), .parts-table td:nth-child(5) { display: none; }
  }
`;

// ============================================================
// TOAST HOOK
// ============================================================
function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  return { toast, show };
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [tab, setTab] = useState("rack");
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPart, setEditPart] = useState(null);
  const [search, setSearch] = useState("");
  const { toast, show } = useToast();
  const isSetup = SUPABASE_URL.includes("YOUR_PROJECT");

  // ---------- fetch parts ----------
  const fetchParts = useCallback(async () => {
    if (isSetup) {
      // demo data
      setParts([
        { part_id: 1, part_name: "Servo Motor SG90", category: "Mechanical", quantity: 12, block_location: "A1", photo_url: null, notes: "Mini servo" },
        { part_id: 2, part_name: "ESP32 Dev Board", category: "Electronics", quantity: 5, block_location: "A2", photo_url: null, notes: "" },
        { part_id: 3, part_name: "Ultrasonic Sensor", category: "Sensors", quantity: 8, block_location: "B3", photo_url: null, notes: "HC-SR04" },
        { part_id: 4, part_name: "M3 Bolts 10mm", category: "Fasteners", quantity: 200, block_location: "C1", photo_url: null, notes: "" },
        { part_id: 5, part_name: "Stepper Driver A4988", category: "Electronics", quantity: 6, block_location: "A1", photo_url: null, notes: "" },
        { part_id: 6, part_name: "PVC Tube 20mm", category: "Mechanical", quantity: 3, block_location: "D5", photo_url: null, notes: "1m lengths" },
      ]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await supabase.q("inventory", "?select=*&order=part_name.asc");
    if (Array.isArray(data)) setParts(data);
    setLoading(false);
  }, [isSetup]);

  useEffect(() => { fetchParts(); }, [fetchParts]);

  // ---------- block counts ----------
  const blockCounts = {};
  parts.forEach((p) => {
    blockCounts[p.block_location] = (blockCounts[p.block_location] || 0) + 1;
  });
  const maxCount = Math.max(...Object.values(blockCounts), 1);

  // ---------- filtered parts ----------
  const filteredParts = parts.filter((p) => {
    const q = search.toLowerCase();
    if (!q) return selectedBlock ? p.block_location === selectedBlock : true;
    return (
      p.part_name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.block_location?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    );
  }).filter((p) => (tab === "rack" && selectedBlock ? p.block_location === selectedBlock : true));

  // ---------- save part ----------
  const savePart = async (formData, file) => {
    let photoUrl = formData.photo_url;
    if (file) {
      if (!isSetup) {
        photoUrl = URL.createObjectURL(file);
      } else {
        photoUrl = await supabase.upload(file);
      }
    }
    const payload = { ...formData, photo_url: photoUrl };
    delete payload.photo_url_file;

    if (isSetup) {
      if (editPart) {
        setParts((prev) => prev.map((p) => (p.part_id === editPart.part_id ? { ...p, ...payload } : p)));
      } else {
        setParts((prev) => [...prev, { ...payload, part_id: Date.now() }]);
      }
      show(editPart ? "Part updated ✓" : "Part added ✓");
      setModalOpen(false);
      setEditPart(null);
      return;
    }

    if (editPart) {
      await supabase.patch("inventory", editPart.part_id, payload);
      show("Part updated ✓");
    } else {
      await supabase.post("inventory", payload);
      show("Part added ✓");
    }
    await fetchParts();
    setModalOpen(false);
    setEditPart(null);
  };

  // ---------- delete part ----------
  const deletePart = async (part) => {
    if (!confirm(`Delete "${part.part_name}"?`)) return;
    if (isSetup) {
      setParts((prev) => prev.filter((p) => p.part_id !== part.part_id));
    } else {
      await supabase.del("inventory", part.part_id);
      await fetchParts();
    }
    show("Part deleted", "error");
  };

  const openAdd = () => { setEditPart(null); setModalOpen(true); };
  const openEdit = (p) => { setEditPart(p); setModalOpen(true); };

  // ---------- stats ----------
  const totalParts = parts.reduce((s, p) => s + (p.quantity || 0), 0);
  const occupiedBlocks = Object.keys(blockCounts).length;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* HEADER */}
        <header className="header">
          <div className="header-logo">RACK<span>OS</span></div>
          <div className="header-status">
            <div className="dot" />
            {isSetup ? "DEMO MODE" : "LIVE"} &nbsp;·&nbsp; {parts.length} PARTS &nbsp;·&nbsp; {occupiedBlocks}/20 BLOCKS
          </div>
        </header>

        {/* NAV */}
        <nav className="nav">
          {[
            { key: "rack", label: "🗄 Rack View" },
            { key: "search", label: "🔍 Search Parts" },
            { key: "manage", label: "⚙ Manage" },
          ].map((t) => (
            <button
              key={t.key}
              className={`nav-btn ${tab === t.key ? "active" : ""}`}
              onClick={() => { setTab(t.key); setSelectedBlock(null); setSearch(""); }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <main className="main">
          {/* SETUP BANNER */}
          {isSetup && (
            <div className="setup-banner">
              <strong>⚠ SUPABASE NOT CONNECTED — Running in Demo Mode</strong>
              Replace <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> at the top of this file with your project values.<br />
              Then create table: <code>inventory</code> with columns: <code>part_id (int8, PK)</code>, <code>part_name (text)</code>, <code>category (text)</code>, <code>quantity (int4)</code>, <code>block_location (text)</code>, <code>photo_url (text)</code>, <code>notes (text)</code><br />
              Enable <code>Storage bucket: part-photos</code> (public) for photo uploads.
            </div>
          )}

          {/* ========== RACK VIEW ========== */}
          {tab === "rack" && !selectedBlock && (
            <>
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-label">Total Parts</div>
                  <div className="stat-value">{totalParts}</div>
                  <div className="stat-sub">{parts.length} unique SKUs</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Occupied Blocks</div>
                  <div className="stat-value">{occupiedBlocks}</div>
                  <div className="stat-sub">of 20 total</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Empty Blocks</div>
                  <div className="stat-value" style={{ color: G.muted }}>{20 - occupiedBlocks}</div>
                  <div className="stat-sub">available</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Categories</div>
                  <div className="stat-value">{new Set(parts.map((p) => p.category)).size}</div>
                  <div className="stat-sub">in use</div>
                </div>
              </div>

              <div className="section-title">Storage Rack — 4 Bays × 5 Levels</div>

              <div className="rack-container">
                <div className="rack-legend">
                  <div className="legend-item"><div className="legend-dot" style={{ background: "#162018", border: `1px solid #2d4030` }} />Has items</div>
                  <div className="legend-item"><div className="legend-dot" style={{ background: G.empty, border: `1px solid ${G.border}` }} />Empty</div>
                  <div className="legend-item" style={{ color: G.muted }}>Click block to view contents</div>
                </div>

                <div className="rack-headers">
                  {BAYS.map((b) => <div key={b} className="bay-header">BAY {b}</div>)}
                </div>

                <div className="rack-wrapper">
                  <div className="rack-levels">
                    {[...LEVELS].reverse().map((l) => (
                      <div key={l} className="rack-level-label">L{l}</div>
                    ))}
                  </div>
                  <div className="rack-grid">
                    {[...LEVELS].reverse().flatMap((l) =>
                      BAYS.map((b) => {
                        const id = `${b}${l}`;
                        const count = blockCounts[id] || 0;
                        const pct = count ? (count / maxCount) * 100 : 0;
                        return (
                          <div
                            key={id}
                            className={`block-cell ${count > 0 ? "has-items" : "empty"}`}
                            onClick={() => { setSelectedBlock(id); }}
                          >
                            <div className="block-id">{id}</div>
                            <div className="block-count">{count > 0 ? `${count} item${count > 1 ? "s" : ""}` : "empty"}</div>
                            {count > 0 && <div className="block-bar" style={{ width: `${pct}%` }} />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========== BLOCK DETAIL ========== */}
          {tab === "rack" && selectedBlock && (
            <>
              <div className="block-detail-header">
                <div className="block-detail-id">{selectedBlock}</div>
                <div className="block-detail-meta">
                  Bay {selectedBlock[0]} &nbsp;·&nbsp; Level {selectedBlock[1]}<br />
                  {blockCounts[selectedBlock] || 0} unique SKUs stored here
                </div>
              </div>
              <div className="toolbar">
                <button className="btn btn-ghost" onClick={() => setSelectedBlock(null)}>← Back to Rack</button>
                <button className="btn btn-primary" onClick={() => { setEditPart({ block_location: selectedBlock }); setModalOpen(true); }}>+ Add Part Here</button>
              </div>
              <PartsTable parts={parts.filter((p) => p.block_location === selectedBlock)} onEdit={openEdit} onDelete={deletePart} />
            </>
          )}

          {/* ========== SEARCH VIEW ========== */}
          {tab === "search" && (
            <>
              <div className="section-title">Search Parts</div>
              <div className="search-bar-wrap">
                <span className="search-icon">🔍</span>
                <input
                  className="search-input"
                  placeholder="Type part name, category, block ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              {loading ? (
                <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" /></div>
              ) : (
                <PartsTable
                  parts={search ? filteredParts : parts}
                  onEdit={openEdit}
                  onDelete={deletePart}
                  onBlockClick={(b) => { setSelectedBlock(b); setTab("rack"); }}
                />
              )}
            </>
          )}

          {/* ========== MANAGE VIEW ========== */}
          {tab === "manage" && (
            <>
              <div className="section-title">Manage Inventory</div>
              <div className="toolbar">
                <div className="search-bar-wrap" style={{ flex: 1, marginBottom: 0 }}>
                  <span className="search-icon">🔍</span>
                  <input
                    className="search-input"
                    placeholder="Filter parts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" onClick={openAdd}>+ Add Part</button>
              </div>
              {loading ? (
                <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" /></div>
              ) : (
                <PartsTable
                  parts={search ? filteredParts : parts}
                  onEdit={openEdit}
                  onDelete={deletePart}
                  editable
                  onBlockClick={(b) => { setSelectedBlock(b); setTab("rack"); }}
                />
              )}
            </>
          )}
        </main>

        {/* MODAL */}
        {modalOpen && (
          <PartModal
            part={editPart}
            onSave={savePart}
            onClose={() => { setModalOpen(false); setEditPart(null); }}
          />
        )}

        {/* TOAST */}
        {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
      </div>
    </>
  );
}

// ============================================================
// PARTS TABLE
// ============================================================
function PartsTable({ parts, onEdit, onDelete, editable, onBlockClick }) {
  if (!parts.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📦</div>
        <div className="empty-text">No parts found</div>
      </div>
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="parts-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Part Name</th>
            <th>Category</th>
            <th>Qty</th>
            <th>Block</th>
            <th>Notes</th>
            {editable && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {parts.map((p) => (
            <tr key={p.part_id}>
              <td>
                {p.photo_url
                  ? <img src={p.photo_url} alt={p.part_name} className="part-thumb" />
                  : <div className="part-thumb-placeholder">📦</div>}
              </td>
              <td style={{ fontWeight: 500 }}>{p.part_name}</td>
              <td><span className="cat-badge">{p.category || "—"}</span></td>
              <td><span className="qty-num">{p.quantity ?? "—"}</span></td>
              <td>
                <span
                  className="block-badge"
                  style={{ cursor: onBlockClick ? "pointer" : "default" }}
                  onClick={() => onBlockClick?.(p.block_location)}
                >
                  {p.block_location || "—"}
                </span>
              </td>
              <td style={{ color: G.muted, fontSize: 11, maxWidth: 160 }}>{p.notes || "—"}</td>
              {editable && (
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-edit" onClick={() => onEdit(p)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => onDelete(p)}>Del</button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// PART MODAL
// ============================================================
function PartModal({ part, onSave, onClose }) {
  const [form, setForm] = useState({
    part_name: part?.part_name || "",
    category: part?.category || CATEGORIES[0],
    quantity: part?.quantity ?? "",
    block_location: part?.block_location || "A1",
    notes: part?.notes || "",
    photo_url: part?.photo_url || "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(part?.photo_url || null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!form.part_name.trim()) return alert("Part name is required");
    setSaving(true);
    await onSave(form, file);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{part?.part_id ? "Edit Part" : "Add New Part"}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* Photo */}
          <div className="field">
            <div className="field-label">Photo</div>
            <div className="photo-upload" onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
              {preview
                ? <img src={preview} alt="preview" className="photo-preview" />
                : <>
                    <div style={{ fontSize: 32 }}>📷</div>
                    <div className="photo-upload-text">Tap to take photo or choose from gallery</div>
                  </>
              }
            </div>
          </div>

          <div className="field">
            <div className="field-label">Part Name *</div>
            <input className="field-input" value={form.part_name} onChange={set("part_name")} placeholder="e.g. Servo Motor SG90" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <div className="field-label">Category</div>
              <select className="field-select" value={form.category} onChange={set("category")}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <div className="field-label">Quantity</div>
              <input className="field-input" type="number" value={form.quantity} onChange={set("quantity")} placeholder="0" min="0" />
            </div>
          </div>

          <div className="field">
            <div className="field-label">Block Location</div>
            <select className="field-select" value={form.block_location} onChange={set("block_location")}>
              {ALL_BLOCKS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>

          <div className="field">
            <div className="field-label">Notes</div>
            <textarea className="field-textarea" value={form.notes} onChange={set("notes")} placeholder="Specs, part number, supplier..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" /> Saving…</> : (part?.part_id ? "Update Part" : "Add Part")}
          </button>
        </div>
      </div>
    </div>
  );
}
