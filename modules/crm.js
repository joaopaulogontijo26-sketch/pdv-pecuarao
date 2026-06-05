/* ============================================================
   PDV Pro — core.js
   Configurações globais, Supabase, utilitários, ícones
   ============================================================ */
"use strict";

// ── REACT ALIASES ────────────────────────────────────────────
var useState  = React.useState;
var useMemo   = React.useMemo;
var useRef    = React.useRef;
var useEffect = React.useEffect;
var useCallback = React.useCallback;

// ── LOJA ─────────────────────────────────────────────────────
const LOJA = {
  nome: "Pecuarão Gontijo",
  sub: "Depósito & Agropecuária",
  tel: "(37) 99922-1020",
  whatsapp: "5537999221020",
  endereco: "Rua Guarani, 461 - Jardim Candidés",
  cidade: "Divinópolis/MG"
};

// ── UTILITÁRIOS ──────────────────────────────────────────────
const fmt       = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const todayStr  = () => new Date().toISOString().slice(0, 10);
const nowTime   = () => new Date().toTimeString().slice(0, 5);
const uid       = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ── API LOCAL (PostgREST no VPS) ─────────────────────────────
const SUPABASE_URL = "https://api.pecuaraogontijo.shop";
const _SB_KEY = () => localStorage.getItem('_sb_key') || sessionStorage.getItem('_sb_key') || "pdv_local";
const _SB_H = () => ({
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
});

const _toRow = {
  products: p => ({ id: p.id, name: p.name, category: p.category || 'Outros', price: +(p.price||0), price_atacado: +(p.priceAtacado||0), cost_price: +(p.costPrice||0), comissao_prod: +(p.comissaoProd||0), atacado_habilitado: p.atacadoHabilitado||false, stock: +(p.stock||0), min_stock: +(p.minStock||5), unit: p.unit||'unid', barcode: p.barcode||'', photo: p.photo||'', description: p.description||'', created_at: p.createdAt||Date.now() }),
  customers: c => ({ id: c.id, name: c.name, phone: c.phone||'', email: c.email||'', cpf: c.cpf||'', rua: c.rua||'', numero: c.numero||'', bairro: c.bairro||'', cidade: c.cidade||'', uf: c.uf||'', cep: c.cep||'', obs: c.obs||'', purchases: c.purchases||0, total_spent: +(c.totalSpent||0), created_at: c.createdAt||Date.now() }),
  sales: s => ({ id: s.id, date: s.date, time: s.time||'', customer: s.customer||'', customer_id: s.customerId||null, payment: s.payment||'', tipo: s.tipo||'pdv', total: +(s.total||0), desconto: +(s.desconto||0), items: s.items||[], vendedor: s.vendedor||'', comissao_valor: +(s.comissaoValor||0), comissao_paga: s.comissaoPaga||false, obs: s.obs||'' }),
  entregas: e => ({ id: e.id, numero: e.numero||'', cliente: e.cliente||'', telefone: e.telefone||'', endereco: e.endereco||'', itens: e.itens||[], total: +(e.total||0), status: e.status||'pedido', pagamento: e.pagamento||'pago', is_prazo: e.isPrazo||false, obs: e.obs||'', venda_id: e.vendaId||null, criado_em: e.criadoEm||Date.now(), criado_data: e.criadoData||'', criado_hora: e.criadoHora||'' }),
  fornecedores: f => ({ id: f.id, nome: f.nome, cnpj: f.cnpj||'', telefone: f.telefone||'', email: f.email||'', contato: f.contato||'', rua: f.rua||'', numero: f.numero||'', bairro: f.bairro||'', cidade: f.cidade||'', uf: f.uf||'', cep: f.cep||'', obs: f.obs||'', created_at: f.createdAt||Date.now() })
};

async function syncSave(col, val) {
  const key = _SB_KEY(); if (!key) return;
  try {
    if (col === 'categorias') {
      const rows = (Array.isArray(val)?val:[]).map((nome,i)=>({nome,ordem:i}));
      if (rows.length) await fetch(SUPABASE_URL+'/rest/v1/categorias?on_conflict=nome',{method:'POST',headers:{..._SB_H(),Prefer:'resolution=merge-duplicates'},body:JSON.stringify(rows)});
      return;
    }
    if (col === 'settings') {
      const rows = Object.entries(val||{}).map(([k,v])=>({key:k,value:v}));
      if (rows.length) await fetch(SUPABASE_URL+'/rest/v1/settings?on_conflict=key',{method:'POST',headers:{..._SB_H(),Prefer:'resolution=merge-duplicates'},body:JSON.stringify(rows)});
      return;
    }
    const transform = _toRow[col];
    if (!transform||!Array.isArray(val)) return;
    const rows = val.map(transform);
    if (rows.length > 0) {
      for (let i=0;i<rows.length;i+=200) {
        const batch = rows.slice(i,i+200);
        await fetch(SUPABASE_URL+'/rest/v1/'+col+'?on_conflict=id',{method:'POST',headers:{..._SB_H(),Prefer:'resolution=merge-duplicates'},body:JSON.stringify(batch)});
      }
      const ids = rows.map(r=>r.id).filter(Boolean);
      if (ids.length>0) await fetch(SUPABASE_URL+'/rest/v1/'+col+'?id=not.in.('+ids.join(',')+')',{method:'DELETE',headers:{..._SB_H(),'Content-Type':'application/json'}});
    } else {
      await fetch(SUPABASE_URL+'/rest/v1/'+col+'?id=neq._vazio_',{method:'DELETE',headers:_SB_H()});
    }
  } catch(e) { console.warn('[PDV] syncSave falhou:',col,e.message); }
}

async function syncLoad() {
  const key = _SB_KEY(); if (!key) { console.warn('[PDV] Configure a chave Supabase'); return null; }
  try {
    const r = await fetch(SUPABASE_URL+'/rest/v1/rpc/get_all_data',{method:'POST',headers:_SB_H(),body:'{}',signal:AbortSignal.timeout(10000)});
    if (!r.ok) throw new Error(await r.text());
    return await r.json();
  } catch(e) { console.warn('[PDV] syncLoad falhou:',e.message); return null; }
}

// ── ÍCONES ───────────────────────────────────────────────────
const PATHS = {
  home:"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  cart:"M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0",
  box:"M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12",
  users:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
  receipt:"M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V4a2 2 0 0 0-2-2z M8 12h8 M8 16h6",
  list:"M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2 M9 12h6 M9 16h4",
  import:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  plus:"M12 5v14 M5 12h14", x:"M18 6L6 18 M6 6l12 12",
  search:"M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5z M16 16l3.5 3.5",
  alert:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  check:"M20 6L9 17l-5-5",
  edit:"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:"M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  menu:"M3 12h18 M3 6h18 M3 18h18",
  clock:"M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2",
  pdf:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 13h6 M9 17h3",
  truck:"M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  printer:"M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z",
  mapPin:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  phone:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  camera:"M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
  barcode:"M3 5v14 M7 5v14 M11 5v14 M15 5v14 M19 5v14 M1 9h2 M1 15h2 M21 9h2 M21 15h2",
  sliders:"M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6",
  image:"M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z M8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z",
  trending:"M23 6l-9.5 9.5-5-5L1 18",
  logout:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  kanban:"M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z",
  bot:"M12 2a2 2 0 0 1 2 2v1h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4V4a2 2 0 0 1 2-2z M8 12h.01 M16 12h.01 M9 16s1 1 3 1 3-1 3-1",
  inbox:"M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"
};

const Icon = ({name, size=16, color}) => {
  const d = PATHS[name];
  return React.createElement("svg", {width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:color||"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",style:{display:"inline-block",flexShrink:0}},
    d?.split(" M").map((seg,i) => React.createElement("path",{key:i, d:i===0?seg:"M"+seg}))
  );
};

// ── CATEGORIAS / UNIDADES ─────────────────────────────────────
const DEFAULT_CATS = ["Bebidas","Lanches","Doces","Eletrônicos","Vestuário","Limpeza","Higiene","Ferramentas","Ferragens","Construção","Hidráulica","Elétrico","Pesca","Utilidades","Outros"];
const loadCats = () => { const s = load("pdv_categorias",null); return s&&s.length>0?s:DEFAULT_CATS; };
const saveCats = v => save("pdv_categorias", v);
const UNITS = ["unid","cx","kg","g","l","ml","m","pç","par","dz","pt","sc"];

// ── PERMISSÕES ────────────────────────────────────────────────
const ADMIN_PERMS = { pdv:true, atacado:true, entregas:true, lista:true, importar:true, estoque:true, clientes:true, historico:true, fornecedores:true, dashboard:true };
const DEFAULT_USERS = [{ id:"admin-001", name:"João Paulo", pin:"1234", role:"admin", active:true, permissions:ADMIN_PERMS }];

const loadUsers = () => {
  const u = load("pdv_users", null);
  if (!u || u.length === 0) return DEFAULT_USERS;
  // Garante que admin sempre tem todas as permissões
  return u.map(x => x.role === "admin" ? {
    ...x,
    permissions: {
      ...ADMIN_PERMS,
      ...(x.permissions || {})
    },
    role: "admin"
  } : x);
};
const saveUsers = v => {
  save("pdv_users", v);
  // Sincroniza com Supabase
  const key = localStorage.getItem('_sb_key') || "";
  if (!key) return;
  const rows = v.map(u => ({
    id: u.id,
    name: u.name,
    pin: u.pin,
    role: u.role || "vendedor",
    permissions: u.permissions || {},
    active: u.active !== false,
    created_at: u.createdAt || Date.now()
  }));
  fetch("https://jyrugkklsacswgysjser.supabase.co/rest/v1/users?on_conflict=id", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": "Bearer " + key,
      "Prefer": "resolution=merge-duplicates"
    },
    body: JSON.stringify(rows)
  }).catch(e => console.warn("[PDV] saveUsers falhou:", e.message));
};

const loadUsersFromSupabase = async () => {
  try {
    const r = await fetch(SUPABASE_URL+"/rest/v1/users?select=*&active=eq.true", {headers:_SB_H()});
    if (!r.ok) return null;
    const rows = await r.json();
    return rows.map(u => ({ id:u.id, name:u.name, pin:u.pin||"", role:u.role||"vendedor", active:u.active!==false, permissions:u.permissions||{}, comissao:+(u.comissao||0), email:u.email||"" }));
  } catch(e) { console.warn("[PDV] loadUsersFromSupabase falhou:",e.message); return null; }
};

console.log("[PDV] core.js carregado");
