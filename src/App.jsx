import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────
// SUPABASE CONFIG
// ─────────────────────────────────────────────
const SUPABASE_URL     = "https://ugweofmjhpxrilvmbcmd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnd2VvZm1qaHB4cmlsdm1iY21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NjkwMjAsImV4cCI6MjA5NTQ0NTAyMH0.DGUuoYhHYnPUR7aUcIl0qdFh974AA2E1NZd1f_K-PVU";

const DB = {
  h: {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  },
  async getAll() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/inventory?select=*&order=part_name.asc`, { headers: this.h });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async insert(row) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/inventory`, {
      method: "POST",
      headers: { ...this.h, Prefer: "return=representation" },
      body: JSON.stringify(row),
    });
    if (!r.ok) throw new Error(await r.text());
    const d = await r.json();
    return Array.isArray(d) ? d[0] : d;
  },
  async update(id, row) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/inventory?part_id=eq.${id}`, {
      method: "PATCH",
      headers: { ...this.h, Prefer: "return=representation" },
      body: JSON.stringify(row),
    });
    if (!r.ok) throw new Error(await r.text());
    const d = await r.json();
    return Array.isArray(d) ? d[0] : d;
  },
  async remove(id) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/inventory?part_id=eq.${id}`, {
      method: "DELETE", headers: this.h,
    });
    if (!r.ok) throw new Error(await r.text());
  },
};

// ─────────────────────────────────────────────
// RACK 1  — Metal shelf  4 cols × 5 levels = 20 slots
// IDs: R1-A5 (top-left) … R1-D1 (bottom-right)
// ─────────────────────────────────────────────
const R1_COLS   = ["A","B","C","D"];
const R1_LEVELS = [5,4,3,2,1];          // display top→bottom
const R1_SLOTS  = R1_LEVELS.flatMap(l => R1_COLS.map(c => `R1-${c}${l}`));

// ─────────────────────────────────────────────
// RACK 2  — ACO 39-drawer cabinet
// Small: 5 rows × 6 cols = 30 drawers  → R2-S1-1 … R2-S5-6
// Big  : 3 rows × 3 cols =  9 drawers  → R2-B1-1 … R2-B3-3
// ─────────────────────────────────────────────
const R2_S_ROWS = [1,2,3,4,5];
const R2_S_COLS = [1,2,3,4,5,6];
const R2_B_ROWS = [1,2,3];
const R2_B_COLS = [1,2,3];

const R2_SMALL_SLOTS = R2_S_ROWS.flatMap(r => R2_S_COLS.map(c => `R2-S${r}-${c}`));
const R2_BIG_SLOTS   = R2_B_ROWS.flatMap(r => R2_B_COLS.map(c => `R2-B${r}-${c}`));
const R2_SLOTS       = [...R2_SMALL_SLOTS, ...R2_BIG_SLOTS];

const ALL_SLOTS  = [...R1_SLOTS, ...R2_SLOTS];
const TOTAL_SLOTS = ALL_SLOTS.length; // 20 + 39 = 59

const CATEGORIES = ["Electronics","Mechanical","Pneumatics","Sensors","Cables","Fasteners","Tools","Other"];

// ─────────────────────────────────────────────
// CSS — white / light industrial
// ─────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:#f0f2f0;color:#1a1e1a;font-family:'IBM Plex Mono',monospace;min-height:100vh}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#f0f2f0}::-webkit-scrollbar-thumb{background:#c8cfc8;border-radius:2px}

.app{display:flex;flex-direction:column;min-height:100vh}

.hdr{display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:54px;background:#fff;border-bottom:2px solid #e0e5e0;position:sticky;top:0;z-index:100}
.logo{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:22px;letter-spacing:3px;text-transform:uppercase;color:#1a1e1a}
.logo span{color:#4a7c59}
.hdr-meta{font-size:10px;color:#7a8a7a;letter-spacing:1px;display:flex;align-items:center;gap:8px}
.live-dot{width:7px;height:7px;border-radius:50%;background:#4a7c59;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}

.nav{display:flex;gap:2px;padding:8px 16px;background:#fff;border-bottom:1px solid #e0e5e0;overflow-x:auto}
.nav-btn{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;padding:7px 18px;border:1px solid transparent;border-radius:4px;background:transparent;color:#7a8a7a;cursor:pointer;transition:all .15s;white-space:nowrap}
.nav-btn:hover{color:#1a1e1a;border-color:#c8cfc8}
.nav-btn.active{background:#edf5ef;border-color:#4a7c59;color:#2d5c3a}

.main{flex:1;padding:24px;max-width:1400px;margin:0 auto;width:100%}

.stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:28px}
.stat{background:#fff;border:1px solid #e0e5e0;border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:3px}
.stat-lbl{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#7a8a7a}
.stat-val{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:34px;color:#2d5c3a;line-height:1}
.stat-sub{font-size:9px;color:#aab5aa}

.sec-title{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:18px;letter-spacing:2px;text-transform:uppercase;color:#1a1e1a;margin-bottom:16px;display:flex;align-items:center;gap:12px}
.sec-title::after{content:'';flex:1;height:1px;background:#e0e5e0}

.racks-wrap{display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start}

/* ── RACK 1: Metal shelf ── */
.rack1-card{background:#fff;border:1px solid #d4dbd4;border-radius:10px;padding:16px;flex:0 0 auto;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.rack-title{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:15px;letter-spacing:2px;text-transform:uppercase;color:#2d5c3a;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.rack-title span{font-weight:400;font-size:11px;color:#aab5aa}
.r1-col-hdrs{display:grid;grid-template-columns:26px repeat(4,72px);gap:5px;margin-bottom:4px}
.r1-col-hdr{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:11px;letter-spacing:1px;color:#aab5aa;text-align:center}
.r1-row{display:grid;grid-template-columns:26px repeat(4,72px);gap:5px;margin-bottom:5px}
.r1-lbl{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:11px;color:#aab5aa;display:flex;align-items:center;justify-content:center}
.slot1{height:70px;border-radius:5px;border:1.5px solid #e0e5e0;background:#f7f9f7;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;position:relative;overflow:hidden;transition:all .13s}
.slot1.filled{background:#edf5ef;border-color:#b0d4bb}
.slot1:hover{border-color:#4a7c59;background:#e4f0e7;transform:translateY(-1px);box-shadow:0 3px 10px rgba(74,124,89,.15)}
.slot1-id{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:14px;color:#c8cfc8;letter-spacing:.5px;line-height:1}
.slot1.filled .slot1-id{color:#2d5c3a}
.slot1-cnt{font-size:9px;color:#aab5aa}
.slot1.filled .slot1-cnt{color:#4a7c59;font-weight:500}
.slot-bar{position:absolute;bottom:0;left:0;height:3px;background:#4a7c59;transition:width .3s}

/* ── RACK 2: ACO 39-drawer ── */
.rack2-card{background:#fff;border:2px solid #e8c840;border-radius:10px;padding:16px;flex:1 1 360px;box-shadow:0 2px 16px rgba(232,200,64,.12)}
.rack2-inner{background:#1a1e1a;border-radius:6px;padding:10px 8px}
.r2-section-lbl{font-size:9px;color:#7a8a7a;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px;padding-left:2px}
.r2-divider{border-top:2px solid #e8c840;margin:8px 0;opacity:.5}

/* small drawers grid */
.r2-small-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-bottom:4px}
.drawer-s{height:36px;border-radius:3px;border:1px solid #2a2f2a;background:#111;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;position:relative;overflow:hidden;transition:all .12s}
.drawer-s.filled{background:#1a2f1e;border-color:#3a6040}
.drawer-s:hover{border-color:#e8c840 !important;background:#222 !important}
.drawer-s.filled:hover{background:#203828 !important}
.d-id{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:9px;color:#555;letter-spacing:.3px;line-height:1}
.drawer-s.filled .d-id{color:#6dbf7e}
.d-cnt{font-size:7px;color:#444}
.drawer-s.filled .d-cnt{color:#4a9c5a}
.d-handle-s{position:absolute;bottom:2px;right:3px;width:8px;height:2px;background:#2a2f2a;border-radius:1px}
.drawer-s.filled .d-handle-s{background:#3a6040}
.d-bar{position:absolute;bottom:0;left:0;height:2px;background:#4a9c5a}

/* big drawers grid */
.r2-big-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
.drawer-b{height:52px;border-radius:3px;border:1px solid #2a2f2a;background:#111;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;position:relative;overflow:hidden;transition:all .12s}
.drawer-b.filled{background:#1a2f1e;border-color:#3a6040}
.drawer-b:hover{border-color:#e8c840 !important;background:#222 !important}
.drawer-b.filled:hover{background:#203828 !important}
.d-id-b{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:12px;color:#555;letter-spacing:.5px;line-height:1}
.drawer-b.filled .d-id-b{color:#6dbf7e}
.d-cnt-b{font-size:9px;color:#444}
.drawer-b.filled .d-cnt-b{color:#4a9c5a}
.d-handle-b{position:absolute;bottom:5px;right:6px;width:14px;height:3px;background:#2a2f2a;border-radius:1px}
.drawer-b.filled .d-handle-b{background:#3a6040}

.legend{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:16px}
.leg-item{display:flex;align-items:center;gap:5px;font-size:10px;color:#7a8a7a}
.leg-dot{width:10px;height:10px;border-radius:2px;border:1.5px solid}

.search-wrap{position:relative;margin-bottom:18px}
.search-ico{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#aab5aa;font-size:14px;pointer-events:none}
.search-inp{width:100%;background:#fff;border:1.5px solid #e0e5e0;border-radius:6px;color:#1a1e1a;font-family:'IBM Plex Mono',monospace;font-size:13px;padding:11px 13px 11px 38px;outline:none;transition:border-color .15s}
.search-inp:focus{border-color:#4a7c59}
.search-inp::placeholder{color:#c8cfc8}

.tbl-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12px}
thead th{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#7a8a7a;padding:9px 14px;text-align:left;border-bottom:2px solid #e0e5e0;background:#f7f9f7}
tbody td{padding:10px 14px;border-bottom:1px solid #f0f2f0;color:#1a1e1a;vertical-align:middle}
tbody tr:hover td{background:#f7f9f7}
.badge-slot{display:inline-block;background:#edf5ef;border:1px solid #b0d4bb;color:#2d5c3a;border-radius:4px;padding:2px 9px;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:12px;letter-spacing:.5px;cursor:pointer}
.badge-slot:hover{background:#d4ebda}
.badge-cat{display:inline-block;background:#f7f9f7;border:1px solid #e0e5e0;color:#7a8a7a;border-radius:4px;padding:2px 9px;font-size:10px;letter-spacing:.5px}
.qty-num{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:18px;color:#1a1e1a}

.btn{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;padding:8px 18px;border-radius:4px;border:1.5px solid;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px}
.btn-primary{background:#2d5c3a;border-color:#2d5c3a;color:#fff}
.btn-primary:hover{background:#3a7a4a;border-color:#3a7a4a;box-shadow:0 3px 10px rgba(45,92,58,.25)}
.btn-ghost{background:#fff;border-color:#e0e5e0;color:#7a8a7a}
.btn-ghost:hover{border-color:#1a1e1a;color:#1a1e1a}
.btn-del{background:#fff;border-color:#ffcdd2;color:#c62828;font-size:11px;padding:5px 12px}
.btn-del:hover{background:#ffebee;border-color:#c62828}
.btn-edit{background:#fff;border-color:#e0e5e0;color:#7a8a7a;font-size:11px;padding:5px 12px}
.btn-edit:hover{border-color:#2d5c3a;color:#2d5c3a}

.toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px}
.blk-hdr{display:flex;align-items:center;gap:16px;margin-bottom:22px}
.blk-big-id{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:44px;color:#2d5c3a;line-height:1;letter-spacing:2px}
.blk-meta{color:#7a8a7a;font-size:11px;line-height:2}

.overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);backdrop-filter:blur(3px);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn .15s}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{background:#fff;border:1px solid #d4dbd4;border-radius:10px;width:100%;max-width:500px;max-height:92vh;overflow-y:auto;animation:slideUp .18s;box-shadow:0 16px 48px rgba(0,0,0,.15)}
@keyframes slideUp{from{transform:translateY(18px);opacity:0}to{transform:none;opacity:1}}
.modal-hdr{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #e0e5e0}
.modal-title{font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:18px;letter-spacing:2px;text-transform:uppercase;color:#1a1e1a}
.modal-x{background:transparent;border:none;color:#aab5aa;font-size:20px;cursor:pointer;padding:4px;line-height:1}
.modal-x:hover{color:#1a1e1a}
.modal-body{padding:22px;display:flex;flex-direction:column;gap:15px}
.modal-ftr{display:flex;gap:10px;justify-content:flex-end;padding:14px 22px;border-top:1px solid #e0e5e0}

.field{display:flex;flex-direction:column;gap:5px}
.field-lbl{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#7a8a7a;font-weight:500}
.field-inp,.field-sel,.field-ta{background:#f7f9f7;border:1.5px solid #e0e5e0;border-radius:5px;color:#1a1e1a;font-family:'IBM Plex Mono',monospace;font-size:12px;padding:9px 11px;outline:none;transition:border-color .15s;width:100%}
.field-inp:focus,.field-sel:focus,.field-ta:focus{border-color:#4a7c59;background:#fff}
.field-sel option,.field-sel optgroup{background:#fff;color:#1a1e1a}
.field-ta{resize:vertical;min-height:72px}
.field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}

.empty{text-align:center;padding:52px 20px;color:#aab5aa}
.empty-ico{font-size:44px;margin-bottom:10px;opacity:.4}
.empty-txt{font-size:12px;letter-spacing:.5px}

.toast{position:fixed;bottom:22px;right:22px;z-index:999;background:#fff;border:1.5px solid #e0e5e0;border-radius:7px;padding:11px 20px;font-size:12px;color:#1a1e1a;box-shadow:0 8px 28px rgba(0,0,0,.12);animation:toastIn .2s;max-width:300px}
.toast.ok{border-color:#b0d4bb;color:#2d5c3a}
.toast.err{border-color:#ffcdd2;color:#c62828}
@keyframes toastIn{from{transform:translateX(16px);opacity:0}to{transform:none;opacity:1}}

.spin{display:inline-block;width:14px;height:14px;border:2px solid #e0e5e0;border-top-color:#4a7c59;border-radius:50%;animation:sp .6s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}

.err-banner{background:#fff8f8;border:1.5px solid #ffcdd2;border-radius:7px;padding:14px 18px;margin-bottom:20px;font-size:11px;color:#c62828;line-height:1.7}
.err-banner strong{display:block;margin-bottom:4px;font-size:13px}
.err-banner code{background:#ffebee;border-radius:3px;padding:1px 5px;font-size:10px;word-break:break-all}

@media(max-width:700px){
  .main{padding:12px}
  .racks-wrap{flex-direction:column}
  thead th:nth-child(5),tbody td:nth-child(5){display:none}
}
`;

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function useToast() {
  const [t, setT] = useState(null);
  const show = useCallback((msg, type = "ok") => {
    setT({ msg, type });
    setTimeout(() => setT(null), 3200);
  }, []);
  return { t, show };
}

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────
export default function App() {
  const [tab, setTab]             = useState("rack");
  const [parts, setParts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [dbError, setDbError]     = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPart, setEditPart]   = useState(null);
  const [search, setSearch]       = useState("");
  const { t, show } = useToast();

  const fetchParts = useCallback(async () => {
    setLoading(true); setDbError(null);
    try {
      const data = await DB.getAll();
      setParts(Array.isArray(data) ? data : []);
    } catch (e) { setDbError(e.message); setParts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchParts(); }, [fetchParts]);

  // Counts per slot
  const slotCounts = {};
  parts.forEach(p => { if (p.block_location) slotCounts[p.block_location] = (slotCounts[p.block_location] || 0) + 1; });
  const maxCount = Math.max(...Object.values(slotCounts), 1);

  const totalQty      = parts.reduce((s, p) => s + (p.quantity || 0), 0);
  const occupiedSlots = Object.keys(slotCounts).length;

  const visibleParts = parts.filter(p => {
    if (tab === "rack" && selectedSlot) return p.block_location === selectedSlot;
    const q = search.toLowerCase();
    if (!q) return true;
    return [p.part_name, p.category, p.block_location, p.notes].some(f => f?.toLowerCase().includes(q));
  });

  const savePart = async (form) => {
    const isEditing = editPart && editPart.part_id;
    const payload = {
      part_name:      form.part_name.trim(),
      category:       form.category,
      quantity:       parseInt(form.quantity) || 0,
      block_location: form.block_location,
      notes:          form.notes.trim(),
    };
    try {
      if (isEditing) {
        const updated = await DB.update(editPart.part_id, payload);
        setParts(prev => prev.map(p => p.part_id === editPart.part_id ? { ...p, ...payload, ...(updated || {}) } : p));
        show("Part updated ✓");
      } else {
        const created = await DB.insert(payload);
        setParts(prev => [...prev, created ?? { ...payload, part_id: Date.now() }]);
        show("Part added ✓");
      }
      setModalOpen(false); setEditPart(null);
    } catch (e) { show("Save failed: " + e.message, "err"); }
  };

  const deletePart = async (p) => {
    if (!confirm(`Delete "${p.part_name}"?`)) return;
    try {
      await DB.remove(p.part_id);
      setParts(prev => prev.filter(x => x.part_id !== p.part_id));
      show("Deleted", "err");
    } catch (e) { show("Delete failed: " + e.message, "err"); }
  };

  const openAdd  = (prefill = null) => { setEditPart(prefill); setModalOpen(true); };
  const openEdit = (p) => { setEditPart(p); setModalOpen(true); };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {/* HEADER */}
        <header className="hdr">
          <div className="logo">RACK<span>OS</span></div>
          <div className="hdr-meta">
            <div className="live-dot" />
            LIVE &nbsp;·&nbsp; {parts.length} PARTS &nbsp;·&nbsp; {occupiedSlots}/{TOTAL_SLOTS} SLOTS
          </div>
        </header>

        {/* NAV */}
        <nav className="nav">
          {[
            { key:"rack",   label:"🗄 Rack View" },
            { key:"search", label:"🔍 Search" },
            { key:"manage", label:"⚙ Manage" },
          ].map(n => (
            <button key={n.key} className={`nav-btn ${tab===n.key?"active":""}`}
              onClick={() => { setTab(n.key); setSelectedSlot(null); setSearch(""); }}>
              {n.label}
            </button>
          ))}
        </nav>

        <main className="main">
          {/* DB ERROR */}
          {dbError && (
            <div className="err-banner">
              <strong>⚠ Supabase Error — table may not exist yet</strong>
              {dbError}<br/>
              Run in Supabase SQL Editor:<br/>
              <code>
                create table inventory (part_id bigint generated always as identity primary key, part_name text not null, category text, quantity int4 default 0, block_location text, notes text);
                alter table inventory enable row level security;
                create policy "all" on inventory for all using (true) with check (true);
              </code>
            </div>
          )}

          {/* ══ RACK VIEW — Dashboard ══ */}
          {tab === "rack" && !selectedSlot && (
            <>
              <div className="stats-row">
                <div className="stat">
                  <div className="stat-lbl">Total Items</div>
                  <div className="stat-val">{totalQty}</div>
                  <div className="stat-sub">{parts.length} unique SKUs</div>
                </div>
                <div className="stat">
                  <div className="stat-lbl">Rack 1 Used</div>
                  <div className="stat-val">{R1_SLOTS.filter(s=>slotCounts[s]).length}</div>
                  <div className="stat-sub">of 20 slots</div>
                </div>
                <div className="stat">
                  <div className="stat-lbl">Rack 2 Used</div>
                  <div className="stat-val">{R2_SLOTS.filter(s=>slotCounts[s]).length}</div>
                  <div className="stat-sub">of 39 drawers</div>
                </div>
                <div className="stat">
                  <div className="stat-lbl">Free Slots</div>
                  <div className="stat-val" style={{color:"#aab5aa"}}>{TOTAL_SLOTS - occupiedSlots}</div>
                  <div className="stat-sub">of {TOTAL_SLOTS} total</div>
                </div>
              </div>

              <div className="sec-title">Storage — Rack 1 (Metal) + Rack 2 (ACO 39)</div>

              <div className="legend">
                <div className="leg-item"><div className="leg-dot" style={{background:"#edf5ef",borderColor:"#b0d4bb"}}/>Rack 1 filled</div>
                <div className="leg-item"><div className="leg-dot" style={{background:"#f7f9f7",borderColor:"#e0e5e0"}}/>Rack 1 empty</div>
                <div className="leg-item"><div className="leg-dot" style={{background:"#1a2f1e",borderColor:"#3a6040"}}/>Rack 2 filled</div>
                <div className="leg-item"><div className="leg-dot" style={{background:"#111",borderColor:"#2a2f2a"}}/>Rack 2 empty</div>
                <div className="leg-item" style={{color:"#aab5aa"}}>Click any slot/drawer → contents</div>
              </div>

              <div className="racks-wrap">
                {/* RACK 1 — Metal Shelf */}
                <div className="rack1-card">
                  <div className="rack-title">🗄 Rack 1 <span>Metal Shelf · 4 Col × 5 Level · 20 slots</span></div>
                  <div className="r1-col-hdrs">
                    <div/>
                    {R1_COLS.map(c => <div key={c} className="r1-col-hdr">{c}</div>)}
                  </div>
                  {R1_LEVELS.map(lvl => (
                    <div key={lvl} className="r1-row">
                      <div className="r1-lbl">L{lvl}</div>
                      {R1_COLS.map(col => {
                        const id    = `R1-${col}${lvl}`;
                        const count = slotCounts[id] || 0;
                        const pct   = count ? Math.max(20, (count/maxCount)*100) : 0;
                        return (
                          <div key={id} className={`slot1 ${count>0?"filled":""}`} onClick={() => setSelectedSlot(id)} title={id}>
                            <div className="slot1-id">{col}{lvl}</div>
                            <div className="slot1-cnt">{count>0 ? `${count} item${count>1?"s":""}` : "empty"}</div>
                            {count>0 && <div className="slot-bar" style={{width:`${pct}%`}}/>}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* RACK 2 — ACO 39 Drawer */}
                <div className="rack2-card">
                  <div className="rack-title" style={{color:"#b8940a"}}>
                    🗃 Rack 2 <span style={{color:"#aab5aa"}}>ACO 39-Drawer Cabinet · 30 Small + 9 Big</span>
                  </div>
                  <div className="rack2-inner">
                    {/* Small drawers — 5 rows × 6 cols */}
                    <div className="r2-section-lbl">Small Drawers — 15.3 × 6.2 × 3.7 cm</div>
                    {R2_S_ROWS.map(row => (
                      <div key={row} className="r2-small-grid" style={{marginBottom:4}}>
                        {R2_S_COLS.map(col => {
                          const id    = `R2-S${row}-${col}`;
                          const count = slotCounts[id] || 0;
                          const pct   = count ? Math.max(20,(count/maxCount)*100) : 0;
                          return (
                            <div key={id} className={`drawer-s ${count>0?"filled":""}`} onClick={() => setSelectedSlot(id)} title={id}>
                              <div className="d-id">S{row}-{col}</div>
                              {count>0 && <div className="d-cnt">{count}</div>}
                              <div className="d-handle-s"/>
                              {count>0 && <div className="d-bar" style={{width:`${pct}%`}}/>}
                            </div>
                          );
                        })}
                      </div>
                    ))}

                    <div className="r2-divider"/>

                    {/* Big drawers — 3 rows × 3 cols */}
                    <div className="r2-section-lbl">Big Drawers — 15.3 × 12.7 × 5.8 cm</div>
                    {R2_B_ROWS.map(row => (
                      <div key={row} className="r2-big-grid" style={{marginBottom:5}}>
                        {R2_B_COLS.map(col => {
                          const id    = `R2-B${row}-${col}`;
                          const count = slotCounts[id] || 0;
                          const pct   = count ? Math.max(20,(count/maxCount)*100) : 0;
                          return (
                            <div key={id} className={`drawer-b ${count>0?"filled":""}`} onClick={() => setSelectedSlot(id)} title={id}>
                              <div className="d-id-b">B{row}-{col}</div>
                              {count>0 && <div className="d-cnt-b">{count} item{count>1?"s":""}</div>}
                              <div className="d-handle-b"/>
                              {count>0 && <div className="d-bar" style={{width:`${pct}%`,height:3}}/>}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══ RACK VIEW — Slot detail ══ */}
          {tab === "rack" && selectedSlot && (
            <>
              <div className="blk-hdr">
                <div className="blk-big-id">{selectedSlot}</div>
                <div className="blk-meta">
                  {selectedSlot.startsWith("R1") ? "Rack 1 — Metal Shelf" : "Rack 2 — ACO 39 Cabinet"}<br/>
                  {selectedSlot.startsWith("R2-S") ? "Small Drawer" : selectedSlot.startsWith("R2-B") ? "Big Drawer" : `Col ${selectedSlot[3]} · Level ${selectedSlot[4]}`}<br/>
                  {slotCounts[selectedSlot] || 0} SKU(s) here
                </div>
              </div>
              <div className="toolbar">
                <button className="btn btn-ghost" onClick={() => setSelectedSlot(null)}>← Back</button>
                <button className="btn btn-primary" onClick={() => openAdd({ block_location: selectedSlot })}>+ Add Part Here</button>
              </div>
              {loading
                ? <div style={{textAlign:"center",padding:40}}><div className="spin"/></div>
                : <PartsTable parts={visibleParts} onEdit={openEdit} onDelete={deletePart} editable/>
              }
            </>
          )}

          {/* ══ SEARCH VIEW ══ */}
          {tab === "search" && (
            <>
              <div className="sec-title">Search Parts</div>
              <div className="search-wrap">
                <span className="search-ico">🔍</span>
                <input className="search-inp" autoFocus
                  placeholder="Part name, category, slot ID, notes…"
                  value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
              {loading
                ? <div style={{textAlign:"center",padding:40}}><div className="spin"/></div>
                : <PartsTable parts={visibleParts} onEdit={openEdit} onDelete={deletePart}
                    onSlotClick={id => { setSelectedSlot(id); setTab("rack"); }}/>
              }
            </>
          )}

          {/* ══ MANAGE VIEW ══ */}
          {tab === "manage" && (
            <>
              <div className="sec-title">Manage Inventory</div>
              <div className="toolbar">
                <div className="search-wrap" style={{flex:1,marginBottom:0}}>
                  <span className="search-ico">🔍</span>
                  <input className="search-inp" placeholder="Filter parts…"
                    value={search} onChange={e => setSearch(e.target.value)}/>
                </div>
                <button className="btn btn-primary" onClick={() => openAdd()}>+ Add Part</button>
              </div>
              {loading
                ? <div style={{textAlign:"center",padding:40}}><div className="spin"/></div>
                : <PartsTable parts={visibleParts} onEdit={openEdit} onDelete={deletePart} editable
                    onSlotClick={id => { setSelectedSlot(id); setTab("rack"); }}/>
              }
            </>
          )}
        </main>

        {modalOpen && (
          <PartModal
            part={editPart}
            onSave={savePart}
            onClose={() => { setModalOpen(false); setEditPart(null); }}
          />
        )}

        {t && <div className={`toast ${t.type}`}>{t.msg}</div>}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// PARTS TABLE
// ─────────────────────────────────────────────
function PartsTable({ parts, onEdit, onDelete, editable, onSlotClick }) {
  if (!parts.length) return (
    <div className="empty"><div className="empty-ico">📦</div><div className="empty-txt">No parts found</div></div>
  );
  return (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Part Name</th><th>Category</th><th>Qty</th><th>Slot</th><th>Notes</th>
            {editable && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {parts.map(p => (
            <tr key={p.part_id}>
              <td style={{fontWeight:500}}>{p.part_name}</td>
              <td><span className="badge-cat">{p.category||"—"}</span></td>
              <td><span className="qty-num">{p.quantity??0}</span></td>
              <td>
                <span className="badge-slot"
                  onClick={() => onSlotClick?.(p.block_location)}
                  style={{cursor:onSlotClick?"pointer":"default"}}>
                  {p.block_location||"—"}
                </span>
              </td>
              <td style={{color:"#7a8a7a",fontSize:11,maxWidth:160}}>{p.notes||"—"}</td>
              {editable && (
                <td>
                  <div style={{display:"flex",gap:6}}>
                    <button className="btn btn-edit" onClick={() => onEdit(p)}>Edit</button>
                    <button className="btn btn-del"  onClick={() => onDelete(p)}>Del</button>
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

// ─────────────────────────────────────────────
// PART MODAL
// ─────────────────────────────────────────────
function PartModal({ part, onSave, onClose }) {
  const isEditing = part && part.part_id;
  const [form, setForm] = useState({
    part_name:      part?.part_name      || "",
    category:       part?.category       || CATEGORIES[0],
    quantity:       part?.quantity       ?? "",
    block_location: part?.block_location || ALL_SLOTS[0],
    notes:          part?.notes          || "",
  });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.part_name.trim()) { alert("Part name is required"); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hdr">
          <div className="modal-title">{isEditing ? "Edit Part" : "Add New Part"}</div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <div className="field-lbl">Part Name *</div>
            <input className="field-inp" value={form.part_name} onChange={set("part_name")}
              placeholder="e.g. Servo Motor SG90" autoFocus/>
          </div>
          <div className="field-row">
            <div className="field">
              <div className="field-lbl">Category</div>
              <select className="field-sel" value={form.category} onChange={set("category")}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <div className="field-lbl">Quantity</div>
              <input className="field-inp" type="number" min="0"
                value={form.quantity} onChange={set("quantity")} placeholder="0"/>
            </div>
          </div>
          <div className="field">
            <div className="field-lbl">Location</div>
            <select className="field-sel" value={form.block_location} onChange={set("block_location")}>
              <optgroup label="── Rack 1: Metal Shelf ──">
                {R1_LEVELS.flatMap(l => R1_COLS.map(c => {
                  const id = `R1-${c}${l}`;
                  return <option key={id} value={id}>{id} — Col {c}, Level {l}</option>;
                }))}
              </optgroup>
              <optgroup label="── Rack 2: Small Drawers ──">
                {R2_S_ROWS.flatMap(r => R2_S_COLS.map(c => {
                  const id = `R2-S${r}-${c}`;
                  return <option key={id} value={id}>{id} — Small Row {r}, Col {c}</option>;
                }))}
              </optgroup>
              <optgroup label="── Rack 2: Big Drawers ──">
                {R2_B_ROWS.flatMap(r => R2_B_COLS.map(c => {
                  const id = `R2-B${r}-${c}`;
                  return <option key={id} value={id}>{id} — Big Row {r}, Col {c}</option>;
                }))}
              </optgroup>
            </select>
          </div>
          <div className="field">
            <div className="field-lbl">Notes</div>
            <textarea className="field-ta" value={form.notes} onChange={set("notes")}
              placeholder="Part number, specs, supplier…"/>
          </div>
        </div>
        <div className="modal-ftr">
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spin"/> Saving…</> : isEditing ? "Update Part" : "Add Part"}
          </button>
        </div>
      </div>
    </div>
  );
}
