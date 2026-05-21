/* PDV Pro v1.0 - Compilado em 21/05/2026, 15:35:32 */
(function() {
  "use strict";
  var useState  = React.useState;
  var useMemo   = React.useMemo;
  var useRef    = React.useRef;
  var useEffect = React.useEffect;
const fmt = v => Number(v || 0).toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL"
});
const LOGO_SRC = "https://joaopaulogontijo26-sketch.github.io/pdv-pecuarao/logo.jpg";
const LOJA = {
  nome: "Pecuarão Gontijo",
  sub: "Depósito & Agropecuária",
  tel: "(37) 99922-1020",
  whatsapp: "5537999221020",
  endereco: "Rua Guarani, 461 - Jardim Candidés",
  cidade: "Divinópolis/MG"
};
const todayStr = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const load = (k, d) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch {
    return d;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

// ── BANCO DE DADOS: SERVIDOR É A FONTE ÚNICA DE VERDADE ───────────────────────
// ── SUPABASE DIRETO ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://jyrugkklsacswgysjser.supabase.co";
const _SB_KEY = () => localStorage.getItem('_sb_key') || sessionStorage.getItem('_sb_key') || "";
const _SB_H = () => ({
  'Content-Type': 'application/json',
  'apikey': _SB_KEY(),
  'Authorization': 'Bearer ' + _SB_KEY(),
  'Prefer': 'return=representation'
});
const _toRow = {
  products: p => ({
    id: p.id,
    name: p.name,
    category: p.category || 'Outros',
    price: +(p.price || 0),
    price_atacado: +(p.priceAtacado || 0),
    cost_price: +(p.costPrice || 0),
    comissao_prod: +(p.comissaoProd || 0),
    atacado_habilitado: p.atacadoHabilitado || false,
    stock: +(p.stock || 0),
    min_stock: +(p.minStock || 5),
    unit: p.unit || 'unid',
    barcode: p.barcode || '',
    photo: p.photo || '',
    description: p.description || '',
    created_at: p.createdAt || Date.now()
  }),
  customers: c => ({
    id: c.id,
    name: c.name,
    phone: c.phone || '',
    email: c.email || '',
    cpf: c.cpf || '',
    rua: c.rua || '',
    numero: c.numero || '',
    bairro: c.bairro || '',
    cidade: c.cidade || '',
    uf: c.uf || '',
    cep: c.cep || '',
    obs: c.obs || '',
    purchases: c.purchases || 0,
    total_spent: +(c.totalSpent || 0),
    created_at: c.createdAt || Date.now()
  }),
  sales: s => ({
    id: s.id,
    date: s.date,
    time: s.time || '',
    customer: s.customer || '',
    customer_id: s.customerId || null,
    payment: s.payment || '',
    tipo: s.tipo || 'pdv',
    total: +(s.total || 0),
    desconto: +(s.desconto || 0),
    items: s.items || [],
    vendedor: s.vendedor || '',
    comissao_valor: +(s.comissaoValor || 0),
    comissao_paga: s.comissaoPaga || false,
    obs: s.obs || ''
  }),
  entregas: e => ({
    id: e.id,
    numero: e.numero || '',
    cliente: e.cliente || '',
    telefone: e.telefone || '',
    endereco: e.endereco || '',
    itens: e.itens || [],
    total: +(e.total || 0),
    status: e.status || 'pedido',
    pagamento: e.pagamento || 'pago',
    is_prazo: e.isPrazo || false,
    obs: e.obs || '',
    venda_id: e.vendaId || null,
    criado_em: e.criadoEm || Date.now(),
    criado_data: e.criadoData || '',
    criado_hora: e.criadoHora || ''
  }),
  fornecedores: f => ({
    id: f.id,
    nome: f.nome,
    cnpj: f.cnpj || '',
    telefone: f.telefone || '',
    email: f.email || '',
    contato: f.contato || '',
    rua: f.rua || '',
    numero: f.numero || '',
    bairro: f.bairro || '',
    cidade: f.cidade || '',
    uf: f.uf || '',
    cep: f.cep || '',
    obs: f.obs || '',
    created_at: f.createdAt || Date.now()
  })
};
async function syncSave(col, val) {
  const key = _SB_KEY();
  if (!key) return;
  try {
    if (col === 'categorias') {
      const rows = (Array.isArray(val) ? val : []).map((nome, i) => ({
        nome,
        ordem: i
      }));
      if (rows.length) await fetch(SUPABASE_URL + '/rest/v1/categorias?on_conflict=nome', {
        method: 'POST',
        headers: {
          ..._SB_H(),
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify(rows)
      });
      return;
    }
    if (col === 'settings') {
      const rows = Object.entries(val || {}).map(([k, v]) => ({
        key: k,
        value: v
      }));
      if (rows.length) await fetch(SUPABASE_URL + '/rest/v1/settings?on_conflict=key', {
        method: 'POST',
        headers: {
          ..._SB_H(),
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify(rows)
      });
      return;
    }
    const transform = _toRow[col];
    if (!transform || !Array.isArray(val)) return;
    const rows = val.map(transform);
    if (rows.length > 0) {
      for (let i = 0; i < rows.length; i += 200) {
        const batch = rows.slice(i, i + 200);
        await fetch(SUPABASE_URL + '/rest/v1/' + col + '?on_conflict=id', {
          method: 'POST',
          headers: {
            ..._SB_H(),
            Prefer: 'resolution=merge-duplicates'
          },
          body: JSON.stringify(batch)
        });
      }
      // Deleta do Supabase registros que foram removidos localmente
      const ids = rows.map(r => r.id).filter(Boolean);
      if (ids.length > 0) {
        await fetch(SUPABASE_URL + '/rest/v1/' + col + '?id=not.in.(' + ids.join(',') + ')', {
          method: 'DELETE',
          headers: {
            ..._SB_H(),
            'Content-Type': 'application/json'
          }
        });
      }
    } else {
      // Array vazio — deleta todos da tabela
      await fetch(SUPABASE_URL + '/rest/v1/' + col + '?id=neq._vazio_', {
        method: 'DELETE',
        headers: _SB_H()
      });
    }
  } catch (e) {
    console.warn('[PDV] syncSave falhou:', col, e.message);
  }
}
async function syncLoad() {
  const key = _SB_KEY();
  if (!key) {
    console.warn('[PDV] Configure a chave Supabase');
    return null;
  }
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/get_all_data', {
      method: 'POST',
      headers: _SB_H(),
      body: '{}',
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) throw new Error(await r.text());
    return await r.json();
  } catch (e) {
    console.warn('[PDV] syncLoad falhou:', e.message);
    return null;
  }
}
const PATHS = {
  home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  cart: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0",
  box: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
  receipt: "M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V4a2 2 0 0 0-2-2z M8 12h8 M8 16h6",
  list: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2 M9 12h6 M9 16h4",
  import: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  plus: "M12 5v14 M5 12h14",
  x: "M18 6L6 18 M6 6l12 12",
  search: "M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5z M16 16l3.5 3.5",
  alert: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  check: "M20 6L9 17l-5-5",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  menu: "M3 12h18 M3 6h18 M3 18h18",
  clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2",
  pdf: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 13h6 M9 17h3",
  truck: "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  printer: "M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z",
  mapPin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0",
  barcode: "M3 5v14 M7 5v14 M11 5v14 M15 5v14 M19 5v14 M1 9h2 M1 15h2 M21 9h2 M21 15h2",
  sliders: "M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6",
  image: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z M8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z",
  trending: "M23 6l-9.5 9.5-5-5L1 18",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9"
};
const Icon = ({
  name,
  size = 16,
  color
}) => {
  var _PATHS$name;
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color || "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      display: "inline-block",
      flexShrink: 0
    }
  }, (_PATHS$name = PATHS[name]) === null || _PATHS$name === void 0 ? void 0 : _PATHS$name.split(" M").map((d, i) => /*#__PURE__*/React.createElement("path", {
    key: i,
    d: i === 0 ? d : "M" + d
  })));
};

// Categorias padronizadas usadas em todo o sistema
const DEFAULT_CATS = ["Bebidas", "Lanches", "Doces", "Eletrônicos", "Vestuário", "Limpeza", "Higiene", "Ferramentas", "Ferragens", "Construção", "Hidráulica", "Elétrico", "Pesca", "Utilidades", "Outros"];
const loadCats = () => {
  const saved = load("pdv_categorias", null);
  return saved && saved.length > 0 ? saved : DEFAULT_CATS;
};
const saveCats = v => save("pdv_categorias", v);
const UNITS = ["unid", "cx", "kg", "g", "l", "ml", "m", "pç", "par", "dz", "pt", "sc"];
function Toast({
  toast
}) {
  if (!toast) return null;
  const clr = {
    success: "#4ade80",
    error: "#ff3b3b",
    warn: "#F07030",
    info: "#4A5BC4"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 90,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      padding: "11px 20px",
      borderRadius: 24,
      fontWeight: 600,
      fontSize: 13,
      fontFamily: "'Sora',sans-serif",
      whiteSpace: "nowrap",
      maxWidth: "calc(100vw - 32px)",
      animation: "popIn .25s ease",
      background: toast.type === "error" ? "#ff3b3b" : "#0F1220",
      border: "1px solid " + (clr[toast.type] || clr.success),
      color: toast.type === "error" ? "#fff" : clr[toast.type] || clr.success,
      boxShadow: "0 8px 32px rgba(0,0,0,.7)"
    }
  }, toast.msg);
}
function EmptyState({
  icon,
  title,
  desc,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "52px 20px 32px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 52,
      marginBottom: 10
    }
  }, icon), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "#888",
      marginBottom: 6
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#555",
      lineHeight: 1.6,
      marginBottom: 24
    }
  }, desc), action);
}
function Sheet({
  onClose,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 2000,
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "rgba(0,0,0,.72)"
    },
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      background: "#0F1220",
      borderRadius: "20px 20px 0 0",
      border: "1px solid #1e2232",
      borderBottom: "none",
      maxHeight: "92dvh",
      overflowY: "auto",
      padding: "0 18px 36px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 4,
      background: "#252845",
      borderRadius: 2,
      margin: "13px auto 20px"
    }
  }), children));
}
function DeleteSheet({
  label,
  onConfirm,
  onClose,
  S
}) {
  return /*#__PURE__*/React.createElement(Sheet, {
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      paddingBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 44,
      marginBottom: 12
    }
  }, "\uD83D\uDDD1\uFE0F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      marginBottom: 8
    }
  }, "Remover item?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#6a6d80",
      marginBottom: 26,
      lineHeight: 1.5
    }
  }, "Deseja remover ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "#e8e9f0"
    }
  }, "\"", label, "\""), "?"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: onClose
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn(),
      flex: 1,
      justifyContent: "center",
      background: "#ff3b3b",
      color: "#fff"
    },
    onClick: onConfirm
  }, "Remover"))));
}

// ── SCANNERS ───────────────────────────────────────────────────────────────────
function ScannerBase({
  S,
  onClose,
  onCode,
  title,
  subtitle
}) {
  const [status, setStatus] = useState("idle");
  const [manual, setManual] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detRef = useRef(null);
  const rafRef = useRef(null);
  const activeRef = useRef(false);
  const scannerDivRef = useRef(null);
  const stopAll = () => {
    var _detRef$current;
    activeRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if ((_detRef$current = detRef.current) !== null && _detRef$current !== void 0 && _detRef$current._quagga) {
      try {
        detRef.current._quagga.stop();
      } catch (_) {}
    }
  };
  const startScan = async () => {
    if (activeRef.current) return;
    activeRef.current = true;
    setStatus("scanning");
    const beep = () => {
      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.connect(g);
        g.connect(ac.destination);
        o.frequency.value = 1800;
        o.type = "square";
        g.gain.setValueAtTime(0.3, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
        o.start(ac.currentTime);
        o.stop(ac.currentTime + 0.12);
      } catch (_) {}
    };
    // Carrega Quagga2 — funciona em iOS Safari, Android, Chrome
    const loadQuagga = () => new Promise((res, rej) => {
      if (window.Quagga) {
        res(window.Quagga);
        return;
      }
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.7.4/dist/quagga.min.js";
      s.onload = () => res(window.Quagga);
      s.onerror = rej;
      document.head.appendChild(s);
    });
    try {
      const Quagga = await loadQuagga();
      // Garante que o elemento de vídeo existe
      await new Promise(r => setTimeout(r, 300));
      if (!scannerDivRef.current) {
        setStatus("error");
        return;
      }
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerDivRef.current,
          constraints: {
            facingMode: "environment",
            width: {
              ideal: 1280
            },
            height: {
              ideal: 720
            }
          }
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 0,
        frequency: 10,
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "code_128_reader", "code_39_reader", "upc_reader", "upc_e_reader"]
        },
        locate: true
      }, err => {
        if (err) {
          console.error("Quagga init:", err);
          setStatus("error");
          return;
        }
        if (!activeRef.current) {
          Quagga.stop();
          return;
        }
        Quagga.start();
        detRef.current = {
          _quagga: Quagga
        };
      });
      Quagga.onDetected(result => {
        var _result$codeResult;
        const code = result === null || result === void 0 || (_result$codeResult = result.codeResult) === null || _result$codeResult === void 0 ? void 0 : _result$codeResult.code;
        if (code && activeRef.current) {
          Quagga.stop();
          stopAll();
          beep();
          onCode(code);
        }
      });
    } catch (e) {
      console.error("Scanner error:", e);
      setStatus("error");
      activeRef.current = false;
    }
  };
  const handleClose = () => {
    stopAll();
    onClose();
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 3000,
      background: "#000",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "rgba(0,0,0,.85)",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "#fff"
    }
  }, "\uD83D\uDCF7 ", title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#4A5BC4",
      marginTop: 2
    }
  }, subtitle)), /*#__PURE__*/React.createElement("button", {
    onClick: handleClose,
    style: {
      background: "#ffffff20",
      border: "none",
      color: "#fff",
      borderRadius: 8,
      padding: "7px 14px",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 600,
      fontSize: 13
    }
  }, "Fechar")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }
  }, status === "idle" && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 48,
      marginBottom: 12
    }
  }, "\uD83D\uDCF7"), /*#__PURE__*/React.createElement("button", {
    onClick: startScan,
    style: {
      ...S.btn("primary"),
      padding: "12px 28px",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    size: 16
  }), " Ativar C\xE2mera")), status === "scanning" && /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      flex: 1,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("video", {
    ref: videoRef,
    style: {
      display: "none"
    },
    playsInline: true,
    muted: true,
    autoPlay: true
  }), /*#__PURE__*/React.createElement("div", {
    ref: scannerDivRef,
    id: "scanner-container",
    style: {
      width: "100%",
      height: "100%",
      position: "absolute",
      inset: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 260,
      height: 110,
      border: "2px solid #22d3ee",
      borderRadius: 8,
      boxShadow: "0 0 0 2000px rgba(0,0,0,.5)",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 2,
      top: "40%",
      background: "linear-gradient(90deg,transparent,#22d3ee,transparent)",
      animation: "scanline 1.5s ease-in-out infinite"
    }
  })))), status === "error" && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 40,
      marginBottom: 10
    }
  }, "\u26A0\uFE0F"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F07030",
      fontSize: 12
    }
  }, "C\xE2mera indispon\xEDvel. Use o campo abaixo."))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 18px 32px",
      background: "rgba(0,0,0,.92)",
      borderTop: "1px solid #1a1c2e",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#6a6d80",
      marginBottom: 8,
      fontWeight: 600
    }
  }, "Leitor USB ou digitar manualmente:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    style: {
      ...S.input,
      flex: 1,
      background: "#111318",
      fontSize: 16,
      letterSpacing: 2
    },
    placeholder: "0000000000000",
    value: manual,
    onChange: e => setManual(e.target.value),
    onKeyDown: e => e.key === "Enter" && manual.trim() && (stopAll(), onCode(manual.trim())),
    inputMode: "numeric"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => manual.trim() && (stopAll(), onCode(manual.trim())),
    disabled: !manual.trim(),
    style: {
      ...S.btn("primary"),
      padding: "10px 18px",
      flexShrink: 0,
      opacity: manual.trim() ? 1 : 0.4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 16
  })))), /*#__PURE__*/React.createElement("style", {
    dangerouslySetInnerHTML: {
      __html: "@keyframes scanline{0%,100%{top:10%}50%{top:80%}}"
    }
  }));
}

// ── PRODUCT SHEET ──────────────────────────────────────────────────────────────
function ProductSheet({
  initial,
  onSave,
  onClose,
  S,
  prefillName,
  cats
}) {
  const [form, setForm] = useState({
    name: (initial === null || initial === void 0 ? void 0 : initial.name) || prefillName || "",
    category: (initial === null || initial === void 0 ? void 0 : initial.category) || "Outros",
    price: (initial === null || initial === void 0 ? void 0 : initial.price) || "",
    priceAtacado: (initial === null || initial === void 0 ? void 0 : initial.priceAtacado) || "",
    atacadoHabilitado: (initial === null || initial === void 0 ? void 0 : initial.atacadoHabilitado) || false,
    costPrice: (initial === null || initial === void 0 ? void 0 : initial.costPrice) || "",
    comissaoProd: (initial === null || initial === void 0 ? void 0 : initial.comissaoProd) || "",
    stock: (initial === null || initial === void 0 ? void 0 : initial.stock) ?? "",
    minStock: (initial === null || initial === void 0 ? void 0 : initial.minStock) || "",
    unit: (initial === null || initial === void 0 ? void 0 : initial.unit) || "unid",
    barcode: (initial === null || initial === void 0 ? void 0 : initial.barcode) || "",
    photo: (initial === null || initial === void 0 ? void 0 : initial.photo) || "",
    description: (initial === null || initial === void 0 ? void 0 : initial.description) || ""
  });
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const photoRef = useRef(null);
  const photoGalRef = useRef(null);
  const [scanBC, setScanBC] = useState(false);
  const handlePhoto = async e => {
    var _e$target$files;
    const file = (_e$target$files = e.target.files) === null || _e$target$files === void 0 ? void 0 : _e$target$files[0];
    if (!file) return;
    const key = localStorage.getItem('_sb_key') || "";
    // Tenta upload para Supabase Storage
    if (key && SUPABASE_URL) {
      try {
        // Comprime a imagem antes de enviar
        const compressed = await new Promise(res => {
          const img = new Image();
          const url = URL.createObjectURL(file);
          img.onload = () => {
            const MAX = 800;
            let w = img.width,
              h = img.height;
            if (w > MAX) {
              h = Math.round(h * MAX / w);
              w = MAX;
            }
            if (h > MAX) {
              w = Math.round(w * MAX / h);
              h = MAX;
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            canvas.toBlob(blob => res(blob), 'image/jpeg', 0.75);
            URL.revokeObjectURL(url);
          };
          img.src = url;
        });
        const filename = `prod_${Date.now()}.jpg`;
        const r = await fetch(`${SUPABASE_URL}/storage/v1/object/fotos/${filename}`, {
          method: 'POST',
          headers: {
            'apikey': key,
            'Authorization': 'Bearer ' + key,
            'Content-Type': 'image/jpeg',
            'x-upsert': 'true'
          },
          body: compressed
        });
        if (r.ok) {
          const url = `${SUPABASE_URL}/storage/v1/object/public/fotos/${filename}`;
          set("photo", url);
          return;
        }
      } catch (err) {
        console.warn('[PDV] Storage falhou, usando base64:', err.message);
      }
    }
    // Fallback: base64 (comprimido)
    const r = new FileReader();
    r.onload = async ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 600;
        let w = img.width,
          h = img.height;
        if (w > MAX) {
          h = Math.round(h * MAX / w);
          w = MAX;
        }
        if (h > MAX) {
          w = Math.round(w * MAX / h);
          h = MAX;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        set("photo", canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = ev.target.result;
    };
    r.readAsDataURL(file);
  };
  const margemPDV = form.price && form.costPrice && +form.costPrice > 0 ? ((+form.price - +form.costPrice) / +form.costPrice * 100).toFixed(1) : null;
  const margemAtac = form.priceAtacado && form.costPrice && +form.costPrice > 0 ? ((+form.priceAtacado - +form.costPrice) / +form.costPrice * 100).toFixed(1) : null;
  return /*#__PURE__*/React.createElement(Sheet, {
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      marginBottom: 18
    }
  }, initial ? "✏️ Editar Produto" : "📦 Novo Produto"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 6
    }
  }, "Foto"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 68,
      height: 68,
      borderRadius: 10,
      border: "2px dashed #1a1c2e",
      overflow: "hidden",
      flexShrink: 0,
      background: "#0A0C1E",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, form.photo ? /*#__PURE__*/React.createElement("img", {
    src: form.photo,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    },
    alt: ""
  }) : /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 22,
    color: "#252845"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    ref: photoRef,
    type: "file",
    accept: "image/*",
    capture: "environment",
    style: {
      display: "none"
    },
    onChange: handlePhoto
  }), /*#__PURE__*/React.createElement("input", {
    ref: photoGalRef,
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: handlePhoto
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var _photoRef$current;
      return (_photoRef$current = photoRef.current) === null || _photoRef$current === void 0 ? void 0 : _photoRef$current.click();
    },
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center",
      padding: "8px",
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    size: 13
  }), " C\xE2mera"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var _photoGalRef$current;
      return (_photoGalRef$current = photoGalRef.current) === null || _photoGalRef$current === void 0 ? void 0 : _photoGalRef$current.click();
    },
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center",
      padding: "8px",
      fontSize: 11
    }
  }, "\uD83D\uDDBC\uFE0F Galeria")), form.photo && /*#__PURE__*/React.createElement("button", {
    onClick: () => set("photo", ""),
    style: {
      ...S.btn("danger"),
      justifyContent: "center",
      padding: "6px",
      fontSize: 11
    }
  }, "Remover")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Nome *"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "Ex: Cadeado 50mm",
    value: form.name,
    onChange: e => set("name", e.target.value),
    autoFocus: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Descri\xE7\xE3o"), /*#__PURE__*/React.createElement("textarea", {
    value: form.description,
    onChange: e => set("description", e.target.value),
    placeholder: "Detalhes, marca, modelo...",
    style: {
      ...S.input,
      height: 48,
      resize: "none",
      verticalAlign: "top",
      fontSize: 12,
      lineHeight: 1.4
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 90px",
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Categoria"), /*#__PURE__*/React.createElement("select", {
    style: S.input,
    value: form.category,
    onChange: e => set("category", e.target.value)
  }, (cats || loadCats()).map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Unidade"), /*#__PURE__*/React.createElement("select", {
    style: S.input,
    value: form.unit,
    onChange: e => set("unit", e.target.value)
  }, UNITS.map(u => /*#__PURE__*/React.createElement("option", {
    key: u
  }, u))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Pre\xE7o de Custo (R$)"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      border: "1px solid #22d3ee30"
    },
    type: "number",
    step: "0.01",
    min: "0",
    placeholder: "0,00",
    value: form.costPrice,
    onChange: e => set("costPrice", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => set("atacadoHabilitado", !form.atacadoHabilitado),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      padding: "11px 14px",
      borderRadius: 10,
      border: "1px solid " + (form.atacadoHabilitado ? "#f59e0b60" : "#1E2245"),
      background: form.atacadoHabilitado ? "#f59e0b12" : "#0A0C1E",
      cursor: "pointer",
      fontFamily: "'Sora',sans-serif",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 20,
      height: 20,
      borderRadius: 10,
      border: "2px solid " + (form.atacadoHabilitado ? "#f59e0b" : "#252845"),
      background: form.atacadoHabilitado ? "#f59e0b" : "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all .2s",
      flexShrink: 0
    }
  }, form.atacadoHabilitado && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 4,
      background: "#000"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: form.atacadoHabilitado ? "#f59e0b" : "#6a6d80"
    }
  }, "\uD83D\uDCE6 Habilitar Venda Atacado"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6080",
      marginTop: 1
    }
  }, form.atacadoHabilitado ? "Produto aparece na aba Venda Atacado" : "Produto não aparece na Venda Atacado")))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#E8682A",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
      marginTop: 4
    }
  }, "Pre\xE7os de Venda"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5,
      color: "#E8682A"
    }
  }, "\uD83C\uDFEA PDV / Varejo *"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      border: "1px solid #E8682A40"
    },
    type: "number",
    step: "0.01",
    min: "0",
    placeholder: "0,00",
    value: form.price,
    onChange: e => set("price", e.target.value)
  }), margemPDV && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#4ade80",
      marginTop: 3
    }
  }, "Margem: ", margemPDV, "%")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5,
      color: "#f59e0b"
    }
  }, "\uD83D\uDCE6 Atacado"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      border: "1px solid #f59e0b40"
    },
    type: "number",
    step: "0.01",
    min: "0",
    placeholder: "0,00",
    value: form.priceAtacado,
    onChange: e => set("priceAtacado", e.target.value)
  }), margemAtac && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#f59e0b",
      marginTop: 3
    }
  }, "Margem: ", margemAtac, "%"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5,
      color: "#4A5BC4"
    }
  }, "\uD83D\uDCB0 Comiss\xE3o do Produto (%)"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      border: "1px solid #22d3ee30"
    },
    type: "number",
    step: "0.1",
    min: "0",
    max: "100",
    placeholder: "Ex: 5 (para 5%)",
    value: form.comissaoProd,
    onChange: e => set("comissaoProd", e.target.value)
  }), form.comissaoProd && +form.comissaoProd > 0 && form.priceAtacado && +form.priceAtacado > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#4A5BC4",
      marginTop: 3
    }
  }, "= ", fmt(+form.priceAtacado * +form.comissaoProd / 100), " por unidade vendida no atacado")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Estoque *"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    type: "number",
    min: "0",
    placeholder: "0",
    value: form.stock,
    onChange: e => set("stock", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Estoque M\xEDn."), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    type: "number",
    min: "0",
    placeholder: "0",
    value: form.minStock,
    onChange: e => set("minStock", e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "C\xF3digo de Barras / SKU"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      paddingLeft: 34
    },
    placeholder: "Ex: 7891234567890",
    value: form.barcode,
    onChange: e => set("barcode", e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#5A6080"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "barcode",
    size: 15
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setScanBC(true),
    style: {
      ...S.btn("ghost"),
      padding: "10px 13px",
      border: "1px solid #22d3ee40",
      color: "#4A5BC4",
      background: "#22d3ee10",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    size: 17,
    color: "#4A5BC4"
  }))), form.barcode && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 11,
      color: "#4ade80"
    }
  }, "\u2713 C\xF3digo: ", form.barcode), scanBC && /*#__PURE__*/React.createElement(ScannerBase, {
    S: S,
    title: "Bipar C\xF3digo",
    subtitle: "Aponte para o c\xF3digo do produto",
    onCode: code => {
      set("barcode", code);
      setScanBC(false);
    },
    onClose: () => setScanBC(false)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: onClose
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: () => onSave(form)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14
  }), " ", initial ? "Salvar" : "Cadastrar")));
}

// ── CUSTOMER SHEET ─────────────────────────────────────────────────────────────
function CustomerSheet({
  initial,
  onSave,
  onClose,
  S
}) {
  const UFS = ["", "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
  const [form, setForm] = useState({
    name: (initial === null || initial === void 0 ? void 0 : initial.name) || "",
    phone: (initial === null || initial === void 0 ? void 0 : initial.phone) || "",
    email: (initial === null || initial === void 0 ? void 0 : initial.email) || "",
    cpf: (initial === null || initial === void 0 ? void 0 : initial.cpf) || "",
    cep: (initial === null || initial === void 0 ? void 0 : initial.cep) || "",
    rua: (initial === null || initial === void 0 ? void 0 : initial.rua) || "",
    numero: (initial === null || initial === void 0 ? void 0 : initial.numero) || "",
    complemento: (initial === null || initial === void 0 ? void 0 : initial.complemento) || "",
    bairro: (initial === null || initial === void 0 ? void 0 : initial.bairro) || "",
    cidade: (initial === null || initial === void 0 ? void 0 : initial.cidade) || "",
    uf: (initial === null || initial === void 0 ? void 0 : initial.uf) || ""
  });
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const buscaCep = async () => {
    const c = form.cep.replace(/\D/g, "");
    if (c.length !== 8) return;
    try {
      const r = await fetch("https://viacep.com.br/ws/" + c + "/json/");
      const d = await r.json();
      if (!d.erro) setForm(f => ({
        ...f,
        rua: d.logradouro || f.rua,
        bairro: d.bairro || f.bairro,
        cidade: d.localidade || f.cidade,
        uf: d.uf || f.uf
      }));
    } catch {}
  };
  return /*#__PURE__*/React.createElement(Sheet, {
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      marginBottom: 18
    }
  }, initial ? "✏️ Editar Cliente" : "👤 Novo Cliente"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#E8682A",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 10,
      paddingBottom: 6,
      borderBottom: "1px solid #1a1c2e"
    }
  }, "Dados Pessoais"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Nome *"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "Ana Silva",
    value: form.name,
    onChange: e => set("name", e.target.value),
    autoFocus: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Telefone"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    type: "tel",
    placeholder: "(00) 90000-0000",
    value: form.phone,
    onChange: e => set("phone", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "CPF / CNPJ"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "000.000.000-00",
    value: form.cpf,
    onChange: e => set("cpf", e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "E-mail"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    type: "email",
    placeholder: "email@exemplo.com",
    value: form.email,
    onChange: e => set("email", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#4A5BC4",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 10,
      paddingBottom: 6,
      borderBottom: "1px solid #1a1c2e"
    }
  }, "Endere\xE7o"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr auto",
      gap: 8,
      marginBottom: 10,
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "CEP"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "00000-000",
    value: form.cep,
    onChange: e => set("cep", e.target.value),
    onBlur: buscaCep
  })), /*#__PURE__*/React.createElement("button", {
    onClick: buscaCep,
    style: {
      ...S.btn("ghost"),
      padding: "11px 12px",
      fontSize: 12
    }
  }, "\uD83D\uDD0D")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 90px",
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Rua / Av."), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "Rua das Flores",
    value: form.rua,
    onChange: e => set("rua", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "N\xBA"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "471",
    value: form.numero,
    onChange: e => set("numero", e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Complemento"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "Apto 12",
    value: form.complemento,
    onChange: e => set("complemento", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Bairro"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "Jardim Candides",
    value: form.bairro,
    onChange: e => set("bairro", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 80px",
      gap: 10,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Cidade"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "Divin\xF3polis",
    value: form.cidade,
    onChange: e => set("cidade", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "UF"), /*#__PURE__*/React.createElement("select", {
    style: S.input,
    value: form.uf,
    onChange: e => set("uf", e.target.value)
  }, UFS.map(u => /*#__PURE__*/React.createElement("option", {
    key: u,
    value: u
  }, u || "--"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: onClose
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: () => onSave(form)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14
  }), " ", initial ? "Salvar" : "Cadastrar")));
}

// ── SISTEMA DE LOGIN ───────────────────────────────────────────────────────────
const ADMIN_PERMS = {
  pdv: true,
  atacado: true,
  estoque: true,
  clientes: true,
  historico: true,
  importar: true,
  entregas: true,
  lista: true,
  editarProdutos: true,
  excluirVendas: true,
  fornecedores: true
};
const DEFAULT_USERS = [{
  id: "admin",
  name: "Administrador",
  pin: "1234",
  role: "admin",
  permissions: ADMIN_PERMS,
  comissao: 0
}];
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
  const key = localStorage.getItem('_sb_key') || "";
  if (!key) return null;
  try {
    const r = await fetch("https://jyrugkklsacswgysjser.supabase.co/rest/v1/users?select=*&active=eq.true", {
      headers: {
        "apikey": key,
        "Authorization": "Bearer " + key
      }
    });
    if (!r.ok) return null;
    const rows = await r.json();
    if (!rows || rows.length === 0) return null;
    const users = rows.map(u => ({
      id: u.id,
      name: u.name,
      pin: u.pin,
      role: u.role || "vendedor",
      permissions: u.permissions || {},
      active: u.active !== false,
      createdAt: u.created_at
    }));
    save("pdv_users", users);
    return users;
  } catch (e) {
    console.warn("[PDV] loadUsersFromSupabase falhou:", e.message);
    return null;
  }
};
function KeySetupScreen({
  onDone
}) {
  const [key, setKey] = useState(localStorage.getItem('_sb_key') || "");
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState("");
  const testar = async () => {
    if (!key.trim()) {
      setMsg("Cole a chave acima");
      return;
    }
    setTesting(true);
    setMsg("Testando conexão...");
    try {
      const r = await fetch("https://jyrugkklsacswgysjser.supabase.co/rest/v1/rpc/get_all_data", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key.trim(),
          'Authorization': 'Bearer ' + key.trim()
        },
        body: '{}',
        signal: AbortSignal.timeout(8000)
      });
      if (r.ok) {
        localStorage.setItem('_sb_key', key.trim());
        sessionStorage.setItem('_sb_key', key.trim());
        setMsg("✅ Conectado!");
        setTimeout(() => onDone(), 1000);
      } else {
        const e = await r.text();
        setMsg("❌ Erro: " + e.slice(0, 80));
      }
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setTesting(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "#0A0C1E",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "'Sora',sans-serif"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: LOGO_SRC,
    alt: "Pecuar\xE3o Gontijo",
    style: {
      height: 70,
      objectFit: "contain",
      marginBottom: 16
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 800,
      color: "#E8682A",
      marginBottom: 4
    }
  }, "Configurar Supabase"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#5A6080",
      marginBottom: 24,
      textAlign: "center"
    }
  }, "Cole a chave ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#e8e9f0"
    }
  }, "JWT anon key"), /*#__PURE__*/React.createElement("br", null), "Supabase \u2192 Settings \u2192 ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#e8e9f0"
    }
  }, "Chaves JWT"), " \u2192 anon key", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: "#E8682A"
    }
  }, "(come\xE7a com eyJhbGci...)")), /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 420
    }
  }, /*#__PURE__*/React.createElement("textarea", {
    value: key,
    onChange: e => setKey(e.target.value),
    placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...",
    style: {
      width: "100%",
      height: 100,
      background: "#0F1220",
      border: "1px solid #1E2245",
      borderRadius: 10,
      color: "#e8e9f0",
      padding: 12,
      fontSize: 11,
      fontFamily: "monospace",
      resize: "none",
      boxSizing: "border-box"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: testar,
    disabled: testing,
    style: {
      width: "100%",
      marginTop: 12,
      padding: 14,
      background: "linear-gradient(135deg,#E8682A,#F07030)",
      border: "none",
      borderRadius: 10,
      color: "#fff",
      fontSize: 15,
      fontWeight: 700,
      cursor: "pointer"
    }
  }, testing ? "Testando..." : "🔗 Conectar ao Supabase"), msg && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: 10,
      background: "#0F1220",
      borderRadius: 8,
      fontSize: 13,
      color: msg.startsWith("✅") ? "#22c55e" : "#ff6b6b",
      textAlign: "center"
    }
  }, msg), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      padding: 12,
      background: "#0F1220",
      borderRadius: 8,
      fontSize: 11,
      color: "#5A6080",
      lineHeight: 1.6
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#e8e9f0"
    }
  }, "Onde encontrar a chave:"), /*#__PURE__*/React.createElement("br", null), "Supabase \u2192 Configura\xE7\xF5es \u2192 Chaves de API \u2192", /*#__PURE__*/React.createElement("br", null), "aba \"Legadas\" \u2192 copie a chave ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#E8682A"
    }
  }, "anon"))));
}
function LoginScreen({
  onLogin,
  S
}) {
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");
  const [sel, setSel] = useState(null);
  const users = loadUsers();
  const tentar = u => {
    const target = sel || u;
    if (!target) return;
    if (target.pin === pin || pin === "" && target.pin === "") {
      onLogin(target);
      setErro("");
    } else {
      setErro("PIN incorreto");
      setPin("");
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "#0A0C1E",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      fontFamily: "'Sora',sans-serif"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 48,
      marginBottom: 8
    }
  }, "\u26A1"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      background: "linear-gradient(135deg,#E8682A,#F07030)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginBottom: 4
    }
  }, "PDV Pro"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#3a3d50",
      marginBottom: 32,
      textTransform: "uppercase",
      letterSpacing: 2
    }
  }, "Sistema de Vendas"), !sel ? /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 320,
      padding: "0 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#5A6080",
      textAlign: "center",
      marginBottom: 16,
      textTransform: "uppercase",
      letterSpacing: 1
    }
  }, "Selecione o usu\xE1rio"), users.map(u => /*#__PURE__*/React.createElement("button", {
    key: u.id,
    onClick: () => {
      if (u.pin === "") onLogin(u);else setSel(u);
    },
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      width: "100%",
      background: "#0F1220",
      border: "1px solid #1a1c2e",
      borderRadius: 12,
      padding: "14px 16px",
      marginBottom: 10,
      cursor: "pointer",
      fontFamily: "inherit",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: 20,
      background: u.role === "admin" ? "linear-gradient(135deg,#E8682A,#F07030)" : "linear-gradient(135deg,#3b82f6,#2563eb)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
      flexShrink: 0
    }
  }, u.role === "admin" ? "👑" : "👤"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#e8e9f0"
    }
  }, u.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6080"
    }
  }, u.role === "admin" ? "Administrador" : u.role === "atacado" ? "Vendas Atacado" : "Vendedor"))))) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 300,
      padding: "0 20px",
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "#e8e9f0",
      marginBottom: 20
    }
  }, "\uD83D\uDC64 ", sel.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 8,
      marginBottom: 16
    }
  }, [1, 2, 3, 4, 5, 6, 7, 8, 9, "←", 0, "✓"].map((k, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => {
      if (k === "←") setPin(p => p.slice(0, -1));else if (k === "✓") tentar(sel);else setPin(p => p.length < 6 ? p + k : p);
    },
    style: {
      padding: "16px",
      borderRadius: 10,
      border: "none",
      fontSize: 18,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "inherit",
      background: k === "✓" ? "linear-gradient(135deg,#E8682A,#F07030)" : k === "←" ? "#1E2245" : "#0F1220",
      color: k === "✓" ? "#fff" : "#e8e9f0"
    }
  }, k))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      justifyContent: "center",
      marginBottom: 12
    }
  }, [0, 1, 2, 3, 4, 5].map(i => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      width: 10,
      height: 10,
      borderRadius: 5,
      background: i < pin.length ? "#E8682A" : "#1E2245"
    }
  }))), erro && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#ff3b3b",
      fontSize: 13,
      marginBottom: 8
    }
  }, erro), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSel(null);
      setPin("");
      setErro("");
    },
    style: {
      fontSize: 12,
      color: "#5A6080",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, "\u2190 Voltar"), (sel === null || sel === void 0 ? void 0 : sel.id) === "admin" && pin.length === 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      // Reseta permissões do admin no localStorage
      const users = loadUsers();
      const fixed = users.map(u => u.role === "admin" ? {
        ...u,
        permissions: ADMIN_PERMS
      } : u);
      saveUsers(fixed);
      setErro("Permissões do admin restauradas!");
    },
    style: {
      fontSize: 11,
      color: "#E8682A",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      marginTop: 4
    }
  }, "\uD83D\uDD27 Restaurar permiss\xF5es admin")));
}

// ── GESTÃO DE USUÁRIOS (Admin) ────────────────────────────────────────────────
function UsersPage({
  S,
  notify,
  currentUser,
  sales,
  persistS
}) {
  const [users, setUsers] = useState(() => loadUsers());
  const [sheet, setSheet] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [detailUser, setDetailUser] = useState(null); // usuário com painel aberto
  const [detailTab, setDetailTab] = useState("historico"); // historico | comissao
  const [periodo, setPeriodo] = useState("mes");
  const [relDe, setRelDe] = useState("");
  const [relAte, setRelAte] = useState("");
  const persistU = v => {
    setUsers(v);
    saveUsers(v);
  };
  const PERMS = [{
    k: "pdv",
    l: "PDV / Vendas"
  }, {
    k: "atacado",
    l: "Venda Atacado"
  }, {
    k: "estoque",
    l: "Estoque"
  }, {
    k: "clientes",
    l: "Clientes"
  }, {
    k: "historico",
    l: "Histórico"
  }, {
    k: "importar",
    l: "Importar NF-e"
  }, {
    k: "entregas",
    l: "Entregas"
  }, {
    k: "lista",
    l: "Lista de Compras"
  }, {
    k: "editarProdutos",
    l: "Editar Produtos"
  }, {
    k: "excluirVendas",
    l: "Excluir Vendas"
  }];
  const [form, setForm] = useState({
    name: "",
    pin: "",
    role: "vendedor",
    comissao: 0,
    permissions: {
      pdv: true,
      atacado: false,
      estoque: false,
      clientes: false,
      historico: false,
      importar: false,
      entregas: true,
      lista: true,
      editarProdutos: false,
      excluirVendas: false
    }
  });
  const setF = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const setPerm = (k, v) => setForm(f => ({
    ...f,
    permissions: {
      ...f.permissions,
      [k]: v
    }
  }));
  const openNew = () => {
    setEditUser(null);
    setForm({
      name: "",
      pin: "",
      role: "vendedor",
      comissao: 0,
      permissions: {
        pdv: true,
        atacado: false,
        estoque: false,
        clientes: false,
        historico: false,
        importar: false,
        entregas: true,
        lista: true,
        editarProdutos: false,
        excluirVendas: false
      }
    });
    setSheet(true);
  };
  const openEdit = u => {
    setEditUser(u);
    setForm({
      ...u
    });
    setSheet(true);
  };
  const saveUser = () => {
    if (!form.name.trim()) {
      notify("Informe o nome!", "error");
      return;
    }
    if (editUser) {
      persistU(users.map(u => u.id === editUser.id ? {
        ...u,
        ...form
      } : u));
      notify("Usuário atualizado ✓");
    } else {
      persistU([...users, {
        id: uid(),
        ...form
      }]);
      notify("Usuário criado ✓");
    }
    setSheet(false);
  };

  // Período selecionado
  const getPeriodRange = () => {
    const hoje = new Date();
    if (periodo === "semana") {
      const d = new Date(hoje);
      d.setDate(d.getDate() - 7);
      return {
        de: d.toISOString().slice(0, 10),
        ate: hoje.toISOString().slice(0, 10)
      };
    }
    if (periodo === "mes") {
      return {
        de: hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0") + "-01",
        ate: hoje.toISOString().slice(0, 10)
      };
    }
    if (periodo === "mesant") {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      const d2 = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
      return {
        de: d.toISOString().slice(0, 10),
        ate: d2.toISOString().slice(0, 10)
      };
    }
    return {
      de: relDe,
      ate: relAte
    };
  };

  // Todas as vendas de um usuário
  const vendasDoUsuario = u => (sales || []).filter(s => s.vendedor === u.name || s.customer === u.name).sort((a, b) => b.date.localeCompare(a.date));
  // Vendas atacado com comissão no período
  const vendasComComissao = u => {
    const {
      de,
      ate
    } = getPeriodRange();
    return (sales || []).filter(s => s.tipo === "atacado" && s.vendedor === u.name && s.date >= de && s.date <= (ate || "9999"));
  };

  // Marcar comissão como paga
  const marcarPaga = (saleId, paga) => {
    if (persistS) persistS((sales || []).map(s => s.id === saleId ? {
      ...s,
      comissaoPaga: paga,
      comissaoPagaEm: paga ? todayStr() : null
    } : s));
    notify(paga ? "Comissão marcada como paga ✓" : "Marcada como pendente", "success");
  };

  // Imprimir relatório de comissão
  const imprimirRelComissao = u => {
    const {
      de,
      ate
    } = getPeriodRange();
    const vendas = vendasComComissao(u);
    const pagas = vendas.filter(s => s.comissaoPaga);
    const pendentes = vendas.filter(s => !s.comissaoPaga);
    const totalPago = pagas.reduce((s, v) => s + (v.comissaoValor || 0), 0);
    const totalPendente = pendentes.reduce((s, v) => s + (v.comissaoValor || 0), 0);
    const totalVendido = vendas.reduce((s, v) => s + v.total, 0);
    const mkRow = (s, isPaga) => "<tr style='background:" + (isPaga ? "#f0fdf4" : "#fffbeb") + "'>" + "<td>" + s.date + " " + s.time + "</td>" + "<td>" + s.customer + "</td>" + "<td>" + s.items.map(i => i.qty + "× " + i.name).join(", ") + "</td>" + "<td style='text-align:right'>" + fmt(s.total) + "</td>" + "<td style='text-align:right;font-weight:700;color:" + (isPaga ? "#16a34a" : "#ca8a04") + "'>" + fmt(s.comissaoValor || 0) + "</td>" + "<td style='text-align:center'>" + (isPaga ? "✅ Pago em " + (s.comissaoPagaEm || "") : "⏳ Pendente") + "</td>" + "</tr>";
    const rows = [...pagas, ...pendentes].map(s => mkRow(s, !!s.comissaoPaga)).join("");
    const html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Comissão " + u.name + "</title>" + "<style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;}" + "table{width:100%;border-collapse:collapse;font-size:11px;}" + "th{background:#1a1a2e;color:#fff;padding:7px;text-align:left;font-size:10px;}" + "td{padding:6px 7px;border-bottom:1px solid #eee;}</style></head><body>" + "<div style='background:#1a1a2e;color:#fff;padding:16px;border-radius:8px;margin-bottom:16px'>" + "<div style='font-size:20px;font-weight:800'>💰 Relatório de Comissão — " + u.name + "</div>" + "<div style='font-size:12px;margin-top:4px;opacity:.8'>Período: " + de + " a " + (ate || todayStr()) + "</div></div>" + "<div style='display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px'>" + "<div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px'><div style='font-size:9px;color:#888;text-transform:uppercase'>Total Vendido</div><div style='font-size:16px;font-weight:800;color:#16a34a'>" + fmt(totalVendido) + "</div></div>" + "<div style='background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:10px'><div style='font-size:9px;color:#888;text-transform:uppercase'>Nº Vendas</div><div style='font-size:16px;font-weight:800;color:#2563eb'>" + vendas.length + "</div></div>" + "<div style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px'><div style='font-size:9px;color:#888;text-transform:uppercase'>✅ Comissão Paga</div><div style='font-size:16px;font-weight:800;color:#16a34a'>" + fmt(totalPago) + "</div></div>" + "<div style='background:#fefce8;border:1px solid #fef08a;border-radius:6px;padding:10px'><div style='font-size:9px;color:#888;text-transform:uppercase'>⏳ A Pagar</div><div style='font-size:16px;font-weight:800;color:#ca8a04'>" + fmt(totalPendente) + "</div></div>" + "</div>" + "<table><thead><tr><th>Data</th><th>Cliente</th><th>Itens</th><th>Venda</th><th>Comissão</th><th>Status</th></tr></thead><tbody>" + rows + "</tbody>" + "<tfoot><tr style='background:#1a1a2e;color:#fff;font-weight:700'><td colspan='3'>TOTAL</td><td>" + fmt(totalVendido) + "</td><td>" + fmt(totalPago + totalPendente) + "</td><td></td></tr></tfoot>" + "</table>" + "<div style='margin-top:16px;font-size:10px;color:#aaa;text-align:center'>Gerado em " + new Date().toLocaleString("pt-BR") + "</div>" + "</body></html>";
    const w = window.open("", "_blank", "width=820,height=650");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => {
        try {
          w.print();
        } catch (_) {}
      }, 600);
    } else notify("Permita pop-ups.", "warn");
  };

  // Painel de detalhe do usuário
  const UserDetail = ({
    u
  }) => {
    const todas = vendasDoUsuario(u);
    const comissao = vendasComComissao(u);
    const pagas = comissao.filter(s => s.comissaoPaga);
    const pendentes = comissao.filter(s => !s.comissaoPaga);
    const totalPago = pagas.reduce((s, v) => s + (v.comissaoValor || 0), 0);
    const totalPendente = pendentes.reduce((s, v) => s + (v.comissaoValor || 0), 0);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 12,
        borderTop: "1px solid #1a1c2e",
        paddingTop: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        marginBottom: 12
      }
    }, [["historico", "📋 Histórico"], ["comissao", "💰 Comissões"]].map(([t, l]) => /*#__PURE__*/React.createElement("button", {
      key: t,
      onClick: () => setDetailTab(t),
      style: {
        flex: 1,
        padding: "8px",
        borderRadius: 8,
        border: "1px solid " + (detailTab === t ? "#E8682A" : "#1E2245"),
        background: detailTab === t ? "#E8682A20" : "transparent",
        color: detailTab === t ? "#E8682A" : "#6a6d80",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 700
      }
    }, l))), detailTab === "historico" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#5A6080",
        marginBottom: 8
      }
    }, todas.length, " venda(s) no total"), todas.length === 0 ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#3a3d50",
        textAlign: "center",
        padding: "16px 0"
      }
    }, "Nenhuma venda registrada.") : /*#__PURE__*/React.createElement("div", {
      style: {
        maxHeight: 280,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 6
      }
    }, todas.slice(0, 50).map(s => {
      var _s$items;
      return /*#__PURE__*/React.createElement("div", {
        key: s.id,
        style: {
          background: "#0A0C1E",
          border: "1px solid " + (s.tipo === "atacado" ? "#f59e0b30" : "#1E2245"),
          borderRadius: 8,
          padding: "10px 12px"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 3
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          fontWeight: 700
        }
      }, s.customer), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          fontWeight: 800,
          color: "#4ade80"
        }
      }, fmt(s.total))), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10,
          color: "#5A6080"
        }
      }, s.date, " ", s.time), /*#__PURE__*/React.createElement("span", {
        style: {
          ...S.badge(s.payment === "A Prazo" ? "#ef4444" : "#4ade80"),
          fontSize: 10
        }
      }, s.payment), s.tipo === "atacado" && /*#__PURE__*/React.createElement("span", {
        style: {
          ...S.badge("#f59e0b"),
          fontSize: 10
        }
      }, "\uD83D\uDCE6 Atacado"), s.comissaoValor > 0 && /*#__PURE__*/React.createElement("span", {
        style: {
          ...S.badge("#4A5BC4"),
          fontSize: 10
        }
      }, "+", fmt(s.comissaoValor))), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 10,
          color: "#3a3d50",
          marginTop: 3
        }
      }, (_s$items = s.items) === null || _s$items === void 0 ? void 0 : _s$items.map(i => i.qty + "× " + i.name).join(", ")));
    }))), detailTab === "comissao" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 5,
        marginBottom: 10,
        flexWrap: "wrap"
      }
    }, [["semana", "7 dias"], ["mes", "Este mês"], ["mesant", "Mês ant."], ["custom", "Período"]].map(([p, l]) => /*#__PURE__*/React.createElement("button", {
      key: p,
      onClick: () => setPeriodo(p),
      style: {
        padding: "5px 10px",
        borderRadius: 20,
        border: "1px solid " + (periodo === p ? "#4A5BC4" : "#1E2245"),
        background: periodo === p ? "#22d3ee18" : "transparent",
        color: periodo === p ? "#4A5BC4" : "#6a6d80",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 11,
        fontWeight: 600
      }
    }, l))), periodo === "custom" && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.lbl,
        marginBottom: 3,
        fontSize: 9
      }
    }, "De"), /*#__PURE__*/React.createElement("input", {
      type: "date",
      style: {
        ...S.input,
        padding: "7px 10px",
        fontSize: 12
      },
      value: relDe,
      onChange: e => setRelDe(e.target.value)
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.lbl,
        marginBottom: 3,
        fontSize: 9
      }
    }, "At\xE9"), /*#__PURE__*/React.createElement("input", {
      type: "date",
      style: {
        ...S.input,
        padding: "7px 10px",
        fontSize: 12
      },
      value: relAte,
      onChange: e => setRelAte(e.target.value)
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.card,
        padding: 10,
        border: "1px solid #4ade8030"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.lbl,
        fontSize: 9,
        marginBottom: 3
      }
    }, "\u2705 Comiss\xE3o Paga"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 17,
        fontWeight: 800,
        color: "#4ade80"
      }
    }, fmt(totalPago)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#5A6080"
      }
    }, pagas.length, " venda(s)")), /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.card,
        padding: 10,
        border: "1px solid #f59e0b40"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.lbl,
        fontSize: 9,
        marginBottom: 3
      }
    }, "\u23F3 A Pagar"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 17,
        fontWeight: 800,
        color: "#f59e0b"
      }
    }, fmt(totalPendente)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#5A6080"
      }
    }, pendentes.length, " venda(s)"))), pendentes.length > 0 && /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        pendentes.forEach(s => marcarPaga(s.id, true));
      },
      style: {
        ...S.btn("primary"),
        width: "100%",
        justifyContent: "center",
        padding: "9px",
        fontSize: 12,
        marginBottom: 10,
        background: "linear-gradient(135deg,#22c55e,#16a34a)"
      }
    }, "\u2705 Marcar todas como pagas (", fmt(totalPendente), ")"), comissao.length === 0 ? /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#3a3d50",
        textAlign: "center",
        padding: "12px 0"
      }
    }, "Nenhuma venda atacado neste per\xEDodo.") : /*#__PURE__*/React.createElement("div", {
      style: {
        maxHeight: 240,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 6
      }
    }, comissao.map(s => /*#__PURE__*/React.createElement("div", {
      key: s.id,
      style: {
        background: "#0A0C1E",
        border: "1px solid " + (s.comissaoPaga ? "#4ade8030" : "#f59e0b30"),
        borderRadius: 8,
        padding: "10px 12px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 700,
        color: "#e8e9f0"
      }
    }, s.customer), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#5A6080"
      }
    }, s.date, " ", s.time)), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "right"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#5A6080"
      }
    }, fmt(s.total)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 800,
        color: s.comissaoPaga ? "#4ade80" : "#f59e0b"
      }
    }, "+", fmt(s.comissaoValor || 0)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10,
        color: s.comissaoPaga ? "#4ade80" : "#f59e0b",
        fontWeight: 600
      }
    }, s.comissaoPaga ? "✅ Pago em " + s.comissaoPagaEm : "⏳ Pendente"), /*#__PURE__*/React.createElement("button", {
      onClick: () => marcarPaga(s.id, !s.comissaoPaga),
      style: {
        padding: "4px 10px",
        borderRadius: 20,
        border: "1px solid " + (s.comissaoPaga ? "#ef444450" : "#4ade8050"),
        background: s.comissaoPaga ? "#ef444410" : "#4ade8010",
        color: s.comissaoPaga ? "#ef4444" : "#4ade80",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 10,
        fontWeight: 700
      }
    }, s.comissaoPaga ? "↩️ Desfazer" : "✅ Pagar"))))), /*#__PURE__*/React.createElement("button", {
      onClick: () => imprimirRelComissao(u),
      style: {
        ...S.btn("ghost"),
        width: "100%",
        justifyContent: "center",
        marginTop: 10,
        padding: "9px",
        fontSize: 12
      }
    }, "\uD83D\uDDA8\uFE0F Imprimir Relat\xF3rio")));
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#5A6080"
    }
  }, users.length, " usu\xE1rio(s)"), /*#__PURE__*/React.createElement("button", {
    style: S.btn("primary"),
    onClick: openNew
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 14
  }), " Novo Usu\xE1rio")), users.map(u => {
    const isOpen = detailUser === u.id;
    const todasVendas = vendasDoUsuario(u);
    const comissaoPendente = (sales || []).filter(s => s.tipo === "atacado" && s.vendedor === u.name && !s.comissaoPaga).reduce((s, v) => s + (v.comissaoValor || 0), 0);
    return /*#__PURE__*/React.createElement("div", {
      key: u.id,
      style: {
        ...S.card,
        marginBottom: 10,
        borderLeft: "3px solid " + (u.role === "admin" ? "#E8682A" : "#3b82f6")
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22,
        flexShrink: 0
      }
    }, u.role === "admin" ? "👑" : "👤"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 700
      }
    }, u.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#5A6080"
      }
    }, u.role === "admin" ? "Administrador" : u.role === "atacado" ? "Atacado" : "Vendedor", " \xB7 PIN: ", "•".repeat(u.pin.length || 1), u.comissao > 0 ? " · " + u.comissao + "% base" : ""))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 5,
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: {
        ...S.btn("ghost"),
        padding: "6px 9px",
        color: "#4A5BC4"
      },
      title: "Hist\xF3rico e Comiss\xF5es",
      onClick: () => {
        setDetailUser(isOpen ? null : u.id);
        setDetailTab("historico");
      }
    }, isOpen ? "▲" : "📊"), /*#__PURE__*/React.createElement("button", {
      style: {
        ...S.btn("ghost"),
        padding: "6px 9px"
      },
      onClick: () => openEdit(u)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "edit",
      size: 13
    })), u.id !== "admin" && /*#__PURE__*/React.createElement("button", {
      style: {
        ...S.btn("danger"),
        padding: "6px 9px"
      },
      onClick: () => persistU(users.filter(x => x.id !== u.id))
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trash",
      size: 13
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 5,
        marginBottom: isOpen ? 0 : 4
      }
    }, PERMS.filter(p => {
      var _u$permissions;
      return (_u$permissions = u.permissions) === null || _u$permissions === void 0 ? void 0 : _u$permissions[p.k];
    }).map(p => /*#__PURE__*/React.createElement("span", {
      key: p.k,
      style: S.badge("#4ade80")
    }, p.l)), todasVendas.length > 0 && /*#__PURE__*/React.createElement("span", {
      style: S.badge("#3b82f6")
    }, todasVendas.length, " vendas"), comissaoPendente > 0 && /*#__PURE__*/React.createElement("span", {
      style: S.badge("#f59e0b")
    }, "\u23F3 ", fmt(comissaoPendente))), isOpen && /*#__PURE__*/React.createElement(UserDetail, {
      u: u
    }));
  }), sheet && /*#__PURE__*/React.createElement(Sheet, {
    onClose: () => setSheet(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      marginBottom: 16
    }
  }, editUser ? "✏️ Editar Usuário" : "👤 Novo Usuário"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Nome *"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    value: form.name,
    onChange: e => setF("name", e.target.value),
    placeholder: "Nome do usu\xE1rio"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "PIN (4-6 d\xEDgitos)"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    type: "password",
    inputMode: "numeric",
    maxLength: 6,
    value: form.pin,
    onChange: e => setF("pin", e.target.value),
    placeholder: "1234"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Tipo"), /*#__PURE__*/React.createElement("select", {
    style: S.input,
    value: form.role,
    onChange: e => setF("role", e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "vendedor"
  }, "Vendedor"), /*#__PURE__*/React.createElement("option", {
    value: "atacado"
  }, "Atacado"), /*#__PURE__*/React.createElement("option", {
    value: "admin"
  }, "Administrador")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Comiss\xE3o base (%)"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    type: "number",
    min: "0",
    max: "100",
    step: "0.5",
    value: form.comissao || 0,
    onChange: e => setF("comissao", +e.target.value),
    placeholder: "0"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6080",
      marginTop: 3
    }
  }, "Usada quando o produto n\xE3o tem comiss\xE3o pr\xF3pria definida.")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#E8682A",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 10
    }
  }, "Permiss\xF5es"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 6,
      marginBottom: 20
    }
  }, PERMS.map(p => {
    var _form$permissions2, _form$permissions3, _form$permissions4, _form$permissions5, _form$permissions6, _form$permissions7;
    return /*#__PURE__*/React.createElement("button", {
      key: p.k,
      onClick: () => {
        var _form$permissions;
        return setPerm(p.k, !((_form$permissions = form.permissions) !== null && _form$permissions !== void 0 && _form$permissions[p.k]));
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 12px",
        borderRadius: 8,
        border: "1px solid " + ((_form$permissions2 = form.permissions) !== null && _form$permissions2 !== void 0 && _form$permissions2[p.k] ? "#4ade8050" : "#1E2245"),
        background: (_form$permissions3 = form.permissions) !== null && _form$permissions3 !== void 0 && _form$permissions3[p.k] ? "#4ade8012" : "#0A0C1E",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 600,
        color: (_form$permissions4 = form.permissions) !== null && _form$permissions4 !== void 0 && _form$permissions4[p.k] ? "#4ade80" : "#6a6d80",
        textAlign: "left"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 14,
        height: 14,
        borderRadius: 3,
        border: "2px solid " + ((_form$permissions5 = form.permissions) !== null && _form$permissions5 !== void 0 && _form$permissions5[p.k] ? "#4ade80" : "#252845"),
        background: (_form$permissions6 = form.permissions) !== null && _form$permissions6 !== void 0 && _form$permissions6[p.k] ? "#4ade80" : "transparent",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }
    }, ((_form$permissions7 = form.permissions) === null || _form$permissions7 === void 0 ? void 0 : _form$permissions7[p.k]) && /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#0A0C1E",
        fontSize: 10,
        fontWeight: 900
      }
    }, "\u2713")), p.l);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: () => setSheet(false)
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: saveUser
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14
  }), " Salvar"))));
}

// ── CART DRAWER ────────────────────────────────────────────────────────────────
function CustomerSearch({
  customers,
  value,
  onChange,
  S
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const filtered = q.trim() ? customers.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || (c.phone || '').includes(q) || (c.cpf || '').includes(q)) : customers;
  const selected = value === 'Avulso' ? null : customers.find(c => c.name === value);
  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      position: 'relative',
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      setOpen(!open);
      setQ('');
    },
    style: {
      ...S.input,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      userSelect: 'none'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: selected ? '#e8e9f0' : '#5A6080'
    }
  }, selected ? selected.name : '— Cliente Avulso —'), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      color: '#5A6080'
    }
  }, "\u25BC")), open && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      zIndex: 999,
      background: '#0F1220',
      border: '1px solid #1E2245',
      borderRadius: 10,
      maxHeight: 260,
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,.5)'
    }
  }, /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "\uD83D\uDD0D Buscar cliente...",
    style: {
      width: '100%',
      padding: '10px 14px',
      background: '#151830',
      border: 'none',
      borderBottom: '1px solid #1E2245',
      color: '#e8e9f0',
      fontSize: 13,
      outline: 'none',
      boxSizing: 'border-box'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      overflowY: 'auto',
      maxHeight: 200
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => {
      onChange('Avulso');
      setOpen(false);
    },
    style: {
      padding: '10px 14px',
      cursor: 'pointer',
      fontSize: 13,
      color: '#5A6080',
      borderBottom: '1px solid #1E2245',
      background: value === 'Avulso' ? '#1E2245' : 'transparent'
    }
  }, "\u2014 Cliente Avulso \u2014"), filtered.slice(0, 50).map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    onClick: () => {
      onChange(c.name);
      setOpen(false);
      setQ('');
    },
    style: {
      padding: '10px 14px',
      cursor: 'pointer',
      fontSize: 13,
      color: '#e8e9f0',
      borderBottom: '1px solid #1E2245',
      background: value === c.name ? '#1E2245' : 'transparent'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600
    }
  }, c.name), c.phone && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: '#5A6080'
    }
  }, c.phone))), filtered.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 14px',
      color: '#5A6080',
      fontSize: 13
    }
  }, "Nenhum cliente encontrado"))));
}
function CartDrawer({
  S,
  cart,
  customers,
  products,
  saleCustomer,
  setSaleCustomer,
  salePayment,
  setSalePayment,
  chgQty,
  rmCart,
  cartTotal,
  onFinalize,
  onFinalizeEntrega,
  onClose,
  onUpdateProduct
}) {
  const [isEntrega, setIsEntrega] = useState(false);
  const [avNome, setAvNome] = useState("");
  const [avRua, setAvRua] = useState("");
  const [avNum, setAvNum] = useState("");
  const [avBairro, setAvBairro] = useState("");
  const [avCidade, setAvCidade] = useState("");
  const [avObs, setAvObs] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editPreco, setEditPreco] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const [modoTotal, setModoTotal] = useState(false);
  const [infoItem, setInfoItem] = useState(null);
  const [editPV, setEditPV] = useState("");
  const [editandoPV, setEditandoPV] = useState(false);
  const [editInfoName, setEditInfoName] = useState(false);
  const [infoNameVal, setInfoNameVal] = useState("");
  const isAvulso = saleCustomer === "Avulso";
  const cliObj = customers.find(c => c.name === saleCustomer);
  const endFmt = cliObj ? [cliObj.rua && cliObj.rua + (cliObj.numero ? ", " + cliObj.numero : ""), cliObj.bairro, cliObj.cidade && cliObj.cidade + (cliObj.uf ? " - " + cliObj.uf : ""), cliObj.cep && "CEP: " + cliObj.cep].filter(Boolean).join(" · ") : "";
  const openEdit = item => {
    setEditItem(item.id);
    setEditNome(item.name);
    setEditPreco(String(item.price));
    setEditQty(String(item.qty));
    setEditTotal(String(+(item.price * item.qty).toFixed(2)));
    setModoTotal(false);
  };
  const closeEdit = () => setEditItem(null);
  const confirmEdit = () => {
    const p = parseFloat(editPreco) || 0;
    let q;
    if (modoTotal) {
      const t = parseFloat(editTotal) || 0;
      q = p > 0 ? +(t / p).toFixed(3) : 1;
    } else {
      q = parseFloat(editQty) || 1;
    }
    if (p <= 0 || q <= 0) {
      closeEdit();
      return;
    }
    const novoNome = editNome.trim();
    const orig = cart.find(i => i.id === editItem);
    chgQty(editItem, 0, {
      name: novoNome || undefined,
      price: p,
      qty: q
    });
    if (orig && onUpdateProduct) {
      const changed = novoNome && novoNome !== orig.name || p !== orig.price;
      if (changed) onUpdateProduct(editItem, {
        name: novoNome || orig.name,
        price: p
      });
    }
    closeEdit();
  };
  const handleEntrega = () => {
    if (isAvulso && !avNome.trim()) {
      var _document$getElementB;
      (_document$getElementB = document.getElementById("avNomeInput")) === null || _document$getElementB === void 0 || _document$getElementB.focus();
      return;
    }
    const parts = [];
    if (isAvulso) {
      if (avRua) parts.push(avRua + (avNum ? ", " + avNum : ""));
      if (avBairro) parts.push(avBairro);
      if (avCidade) parts.push(avCidade);
    }
    onFinalizeEntrega(isAvulso ? parts.join(" · ") : endFmt, isAvulso ? avNome.trim() : saleCustomer, avObs.trim());
  };
  const getProd = item => products ? products.find(p => p.id === item.id) : null;
  return /*#__PURE__*/React.createElement(Sheet, {
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      marginBottom: 16
    }
  }, "\uD83D\uDED2 Carrinho"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 6
    }
  }, "Cliente"), /*#__PURE__*/React.createElement(CustomerSearch, {
    customers: customers,
    value: saleCustomer,
    onChange: setSaleCustomer,
    S: S
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 6
    }
  }, "Pagamento"), /*#__PURE__*/React.createElement("select", {
    style: S.input,
    value: salePayment,
    onChange: e => setSalePayment(e.target.value)
  }, ["Dinheiro", "Cartão Débito", "Cartão Crédito", "Pix", "Vale Refeição", "A Prazo"].map(m => /*#__PURE__*/React.createElement("option", {
    key: m
  }, m)))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: "30dvh",
      overflowY: "auto",
      marginBottom: 6
    }
  }, cart.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#3a3d50",
      textAlign: "center",
      padding: "20px 0",
      fontSize: 13
    }
  }, "Carrinho vazio") : cart.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id
  }, editItem === item.id ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 0",
      borderBottom: "1px solid #1a1c26"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#E8682A",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.5
    }
  }, "\u270F\uFE0F Editando item"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Nome"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      fontSize: 13
    },
    value: editNome,
    onChange: e => setEditNome(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Pre\xE7o Unit\xE1rio (R$)"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      fontSize: 13
    },
    type: "number",
    step: "0.01",
    min: "0",
    value: editPreco,
    onChange: e => {
      setEditPreco(e.target.value);
      const p = parseFloat(e.target.value) || 0;
      const q = parseFloat(editQty) || 1;
      setEditTotal(String(+(p * q).toFixed(2)));
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setModoTotal(false),
    style: {
      flex: 1,
      padding: "7px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 700,
      fontSize: 12,
      background: !modoTotal ? "#E8682A" : "#1E2245",
      color: !modoTotal ? "#fff" : "#6a6d80"
    }
  }, "Por Quantidade"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setModoTotal(true),
    style: {
      flex: 1,
      padding: "7px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 700,
      fontSize: 12,
      background: modoTotal ? "#4ade80" : "#1E2245",
      color: modoTotal ? "#0A0C1E" : "#6a6d80"
    }
  }, "Por Valor Total")), modoTotal ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Valor Total (R$)"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      fontSize: 15,
      fontWeight: 700,
      border: "1px solid #4ade8060"
    },
    type: "number",
    step: "0.01",
    min: "0",
    value: editTotal,
    onChange: e => setEditTotal(e.target.value)
  }), parseFloat(editPreco) > 0 && parseFloat(editTotal) > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#4ade80",
      marginTop: 4
    }
  }, "Qtd calculada: ", +(parseFloat(editTotal) / parseFloat(editPreco)).toFixed(3), " unid.")) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Quantidade (aceita decimal: 1,5 kg)"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      fontSize: 15,
      fontWeight: 700,
      border: "1px solid #E8682A60"
    },
    type: "number",
    step: "0.001",
    min: "0.001",
    value: editQty,
    onChange: e => {
      setEditQty(e.target.value);
      const p = parseFloat(editPreco) || 0;
      const q = parseFloat(e.target.value) || 0;
      setEditTotal(String(+(p * q).toFixed(2)));
    }
  }), parseFloat(editPreco) > 0 && parseFloat(editQty) > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#E8682A",
      marginTop: 4
    }
  }, "Total: ", fmt(parseFloat(editPreco) * parseFloat(editQty)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: closeEdit,
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center",
      fontSize: 13
    }
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    onClick: confirmEdit,
    style: {
      ...S.btn("primary"),
      flex: 1,
      justifyContent: "center",
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13
  }), " Confirmar"))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 0",
      borderBottom: "1px solid #1a1c26"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setInfoItem(item);
      setEditPV(String(item.price));
      setEditandoPV(false);
    },
    style: {
      width: 24,
      height: 24,
      borderRadius: 12,
      background: "#1E2245",
      border: "1px solid #2a2d3a",
      color: "#5A6080",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 700,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, "?"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      cursor: "pointer"
    },
    onClick: () => openEdit(item)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, item.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#E8682A"
    }
  }, fmt(item.price), " \xD7 ", item.qty % 1 !== 0 ? item.qty.toFixed(3).replace(/\.?0+$/, "") : item.qty, " = ", fmt(item.price * item.qty))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 3,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => chgQty(item.id, -1),
    style: {
      ...S.btn("ghost"),
      padding: "4px 9px",
      fontSize: 17
    }
  }, "\u2212"), /*#__PURE__*/React.createElement("span", {
    onClick: () => openEdit(item),
    style: {
      minWidth: 28,
      textAlign: "center",
      fontWeight: 700,
      fontSize: 14,
      cursor: "pointer"
    }
  }, item.qty % 1 !== 0 ? item.qty.toFixed(2).replace(/\.?0+$/, "") : item.qty), /*#__PURE__*/React.createElement("button", {
    onClick: () => chgQty(item.id, +1),
    style: {
      ...S.btn("ghost"),
      padding: "4px 9px",
      fontSize: 17
    }
  }, "+")), /*#__PURE__*/React.createElement("button", {
    onClick: () => rmCart(item.id),
    style: {
      ...S.btn("danger"),
      padding: "6px 8px",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 13
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid #1e2232",
      paddingTop: 14,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsEntrega(e => !e),
    style: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: 12,
      cursor: "pointer",
      fontFamily: "'Sora',sans-serif",
      fontWeight: 700,
      fontSize: 13,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: isEntrega ? "linear-gradient(135deg,#0f2744,#0f1e3d)" : "#1E2245",
      border: "1px solid " + (isEntrega ? "#3b82f660" : "#1E2245"),
      transition: "all .2s"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "truck",
    size: 17,
    color: isEntrega ? "#3b82f6" : "#6a6d80"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: isEntrega ? "#60a5fa" : "#8a8da0",
      fontSize: 13,
      fontWeight: 700
    }
  }, "Criar Pedido de Entrega"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: isEntrega ? "#3b82f690" : "#5A6080",
      fontSize: 11,
      fontWeight: 400
    }
  }, isEntrega ? "✓ Ativo" : "Toque para ativar"))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 42,
      height: 24,
      borderRadius: 12,
      position: "relative",
      flexShrink: 0,
      background: isEntrega ? "#3b82f6" : "#252845",
      transition: "background .2s"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 18,
      height: 18,
      borderRadius: 9,
      background: "#fff",
      position: "absolute",
      top: 3,
      left: isEntrega ? 21 : 3,
      transition: "left .2s",
      boxShadow: "0 1px 4px rgba(0,0,0,.4)"
    }
  }))), isEntrega && isAvulso && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: 14,
      background: "#0A0C1E",
      border: "1px solid #3b82f630",
      borderRadius: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#3b82f6",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 12
    }
  }, "\uD83D\uDCCB Dados do Destinat\xE1rio"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5,
      color: "#60a5fa"
    }
  }, "Nome *"), /*#__PURE__*/React.createElement("input", {
    id: "avNomeInput",
    style: {
      ...S.input,
      border: "1px solid " + (avNome.trim() ? "#3b82f650" : "#1E2245")
    },
    placeholder: "Nome completo",
    value: avNome,
    onChange: e => setAvNome(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 80px",
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Rua / Av."), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "Rua das Flores",
    value: avRua,
    onChange: e => setAvRua(e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "N\xBA"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "471",
    value: avNum,
    onChange: e => setAvNum(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Bairro"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "Centro",
    value: avBairro,
    onChange: e => setAvBairro(e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Cidade"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "Divin\xF3polis",
    value: avCidade,
    onChange: e => setAvCidade(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Observa\xE7\xE3o"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...S.input,
      height: 60,
      resize: "none",
      verticalAlign: "top",
      fontSize: 13,
      lineHeight: 1.4
    },
    placeholder: "Ex: Ligar antes, port\xE3o azul...",
    value: avObs,
    onChange: e => setAvObs(e.target.value)
  }))), isEntrega && !isAvulso && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      padding: 14,
      background: "#0A0C1E",
      border: "1px solid #3b82f630",
      borderRadius: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#3b82f6",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 10
    }
  }, "\uD83D\uDCCB Dados da Entrega"), endFmt ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      marginBottom: 12,
      padding: "8px 10px",
      background: "#0F1220",
      border: "1px solid #1a1c2e",
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mapPin",
    size: 13,
    color: "#3b82f6"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#6a6d80",
      lineHeight: 1.5
    }
  }, endFmt)) : /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12,
      padding: "8px 10px",
      background: "#0F1220",
      border: "1px solid #f59e0b30",
      borderRadius: 8,
      fontSize: 12,
      color: "#f59e0b"
    }
  }, "\u26A0\uFE0F Sem endere\xE7o cadastrado."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6080",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 5
    }
  }, "Observa\xE7\xE3o ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#252845",
      fontWeight: 400
    }
  }, "(opcional)")), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...S.input,
      height: 60,
      resize: "none",
      verticalAlign: "top",
      fontSize: 13,
      lineHeight: 1.4
    },
    placeholder: "Ex: Ligar antes, port\xE3o azul...",
    value: avObs,
    onChange: e => setAvObs(e.target.value)
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#7a7d8e"
    }
  }, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 26,
      fontWeight: 800,
      color: "#4ade80"
    }
  }, fmt(cartTotal))), isEntrega ? /*#__PURE__*/React.createElement("button", {
    onClick: handleEntrega,
    disabled: isAvulso && !avNome.trim(),
    style: {
      ...S.btn("primary"),
      width: "100%",
      padding: "15px",
      fontSize: 15,
      justifyContent: "center",
      borderRadius: 14,
      background: isAvulso && !avNome.trim() ? "#1E2245" : "linear-gradient(135deg,#3b82f6,#2563eb)",
      color: isAvulso && !avNome.trim() ? "#5A6080" : "#fff",
      boxShadow: isAvulso && !avNome.trim() ? "none" : "0 6px 24px rgba(59,130,246,.4)",
      cursor: isAvulso && !avNome.trim() ? "not-allowed" : "pointer"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "truck",
    size: 16
  }), isAvulso && !avNome.trim() ? "Informe o nome para continuar" : "Finalizar + Criar Entrega") : /*#__PURE__*/React.createElement("button", {
    onClick: onFinalize,
    style: {
      ...S.btn("primary"),
      width: "100%",
      padding: "15px",
      fontSize: 15,
      justifyContent: "center",
      borderRadius: 14,
      boxShadow: "0 6px 24px rgba(255,107,53,.35)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 16
  }), " Finalizar Venda"), cart.length > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => rmCart("__all__"),
    style: {
      ...S.btn("danger"),
      width: "100%",
      padding: "10px",
      fontSize: 12,
      justifyContent: "center",
      marginTop: 8,
      borderRadius: 10
    }
  }, "Limpar Carrinho")), infoItem && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 4000,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "rgba(0,0,0,.7)"
    },
    onClick: () => {
      setInfoItem(null);
      setEditandoPV(false);
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      background: "#0F1220",
      borderRadius: "20px 20px 0 0",
      border: "1px solid #1e2232",
      width: "100%",
      maxWidth: 480,
      padding: "20px 20px 36px",
      maxHeight: "85dvh",
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 4,
      background: "#252845",
      borderRadius: 2,
      margin: "0 auto 18px"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 16
    }
  }, editInfoName ? /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    style: {
      ...S.input,
      fontSize: 15,
      fontWeight: 800,
      flex: 1
    },
    value: infoNameVal,
    onChange: e => setInfoNameVal(e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter" && infoNameVal.trim()) {
        onUpdateProduct(infoItem.id, {
          name: infoNameVal.trim()
        });
        setInfoItem(i => ({
          ...i,
          name: infoNameVal.trim()
        }));
        setEditInfoName(false);
      }
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      flex: 1
    }
  }, "\u2139\uFE0F ", infoItem.name), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (editInfoName && infoNameVal.trim()) {
        onUpdateProduct(infoItem.id, {
          name: infoNameVal.trim()
        });
        setInfoItem(i => ({
          ...i,
          name: infoNameVal.trim()
        }));
      }
      setEditInfoName(!editInfoName);
      setInfoNameVal(infoItem.name);
    },
    style: {
      ...S.btn(editInfoName ? "primary" : "ghost"),
      padding: "5px 9px",
      flexShrink: 0,
      fontSize: 11
    }
  }, editInfoName ? "✓ Ok" : "✏️")), (() => {
    const p = getProd(infoItem);
    const precoAtual = parseFloat(editPV) || infoItem.price;
    const margem = (p === null || p === void 0 ? void 0 : p.costPrice) > 0 ? ((precoAtual - p.costPrice) / p.costPrice * 100).toFixed(1) : null;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.card,
        padding: 12,
        gridColumn: "1/-1",
        border: "1px solid #E8682A40"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.lbl,
        fontSize: 10
      }
    }, "Pre\xE7o de Venda"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setEditandoPV(!editandoPV);
        setEditPV(String(infoItem.price));
      },
      style: {
        ...S.btn(editandoPV ? "danger" : "ghost"),
        padding: "4px 10px",
        fontSize: 11
      }
    }, editandoPV ? "✕ Cancelar" : "✏️ Editar")), editandoPV ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("input", {
      autoFocus: true,
      type: "number",
      step: "0.01",
      min: "0",
      style: {
        ...S.input,
        fontSize: 20,
        fontWeight: 800,
        color: "#E8682A",
        border: "1px solid #E8682A60",
        marginBottom: 6
      },
      value: editPV,
      onChange: e => setEditPV(e.target.value),
      onKeyDown: e => {
        if (e.key === "Enter") {
          const np = parseFloat(editPV);
          if (np > 0 && onUpdateProduct) {
            onUpdateProduct(infoItem.id, {
              price: np
            });
            chgQty(infoItem.id, 0, {
              price: np
            });
            setInfoItem(i => ({
              ...i,
              price: np
            }));
            setEditandoPV(false);
          }
        }
      }
    }), (p === null || p === void 0 ? void 0 : p.costPrice) > 0 && parseFloat(editPV) > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#4A5BC4",
        marginBottom: 6
      }
    }, "Nova margem: ", ((parseFloat(editPV) - p.costPrice) / p.costPrice * 100).toFixed(1), "%"), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        const np = parseFloat(editPV);
        if (np > 0 && onUpdateProduct) {
          onUpdateProduct(infoItem.id, {
            price: np
          });
          chgQty(infoItem.id, 0, {
            price: np
          });
          setInfoItem(i => ({
            ...i,
            price: np
          }));
          setEditandoPV(false);
        }
      },
      style: {
        ...S.btn("primary"),
        width: "100%",
        justifyContent: "center",
        padding: "10px"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 14
    }), " Salvar novo pre\xE7o")) : /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 22,
        fontWeight: 800,
        color: "#E8682A"
      }
    }, fmt(infoItem.price))), /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.card,
        padding: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.lbl,
        fontSize: 10,
        marginBottom: 4
      }
    }, "Pre\xE7o de Custo"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 800,
        color: (p === null || p === void 0 ? void 0 : p.costPrice) > 0 ? "#4ade80" : "#3a3d50"
      }
    }, (p === null || p === void 0 ? void 0 : p.costPrice) > 0 ? fmt(p.costPrice) : "—")), /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.card,
        padding: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.lbl,
        fontSize: 10,
        marginBottom: 4
      }
    }, "Margem de Lucro"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 18,
        fontWeight: 800,
        color: margem ? "#4A5BC4" : "#3a3d50"
      }
    }, margem ? margem + "%" : "—")), /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.card,
        padding: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.lbl,
        fontSize: 10,
        marginBottom: 4
      }
    }, "Estoque Atual"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 800,
        color: (p === null || p === void 0 ? void 0 : p.stock) > 0 ? "#a78bfa" : "#ff3b3b"
      }
    }, p ? p.stock + " " + (p.unit || "unid") : "—")), /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.card,
        padding: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.lbl,
        fontSize: 10,
        marginBottom: 4
      }
    }, "Entrada no Estoque"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        fontWeight: 600,
        color: "#6a6d80"
      }
    }, p !== null && p !== void 0 && p.createdAt ? new Date(p.createdAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }) : "—")), (p === null || p === void 0 ? void 0 : p.description) && /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.card,
        padding: 12,
        gridColumn: "1/-1"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.lbl,
        fontSize: 10,
        marginBottom: 4
      }
    }, "Descri\xE7\xE3o"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#6a6d80"
      }
    }, p.description)), (p === null || p === void 0 ? void 0 : p.barcode) && /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.card,
        padding: 12,
        gridColumn: "1/-1"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...S.lbl,
        fontSize: 10,
        marginBottom: 4
      }
    }, "C\xF3digo de Barras"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontFamily: "monospace",
        color: "#4A5BC4"
      }
    }, p.barcode)));
  })(), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setInfoItem(null);
      setEditandoPV(false);
    },
    style: {
      ...S.btn("ghost"),
      width: "100%",
      justifyContent: "center",
      marginTop: 16,
      padding: "12px"
    }
  }, "Fechar"))));
}

// ── VENDA ATACADO ─────────────────────────────────────────────────────────────
function AtacadoPage({
  S,
  products,
  customers,
  persistP,
  persistS,
  persistC,
  persistE,
  sales,
  notify,
  currentUser
}) {
  const [items, setItems] = useState([]);
  const [photoModal, setPhotoModal] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Todos");
  const [step, setStep] = useState("grid"); // grid | edit | finalizar
  const [editingId, setEditingId] = useState(null);
  // Finalizar form
  const [cliente, setCliente] = useState("Avulso");
  const [payment, setPayment] = useState("Dinheiro");
  const [desconto, setDesconto] = useState(0);
  const [obs, setObs] = useState("");
  const [pagamento, setPagamento] = useState("pago");
  // Entrega
  const [avNome, setAvNome] = useState("");
  const [avRua, setAvRua] = useState("");
  const [avNum, setAvNum] = useState("");
  const [avBairro, setAvBairro] = useState("");
  const [avCidade, setAvCidade] = useState("");
  const [avObs, setAvObs] = useState("");
  const comissao = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.comissao) || 0;
  // Calcula comissão total: usa comissaoProd do produto se definida, senão comissão do usuário
  const calcComissaoItem = item => {
    const rate = item.comissaoProd > 0 ? item.comissaoProd : comissao;
    return item.precoUnit * (1 - (item.descItem || 0) / 100) * item.qty * rate / 100;
  };
  const cats = ["Todos", ...Array.from(new Set(products.map(p => p.category)))];
  const filtered = products.filter(p => p.stock > 0 && p.atacadoHabilitado === true // só produtos habilitados para atacado
  && (filterCat === "Todos" || p.category === filterCat) && p.name.toLowerCase().includes(search.toLowerCase()));
  const addItem = p => {
    setItems(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? {
        ...i,
        qty: i.qty + 1
      } : i);
      return [...prev, {
        ...p,
        qty: 1,
        precoUnit: p.priceAtacado || p.price,
        descItem: 0,
        comissaoProd: p.comissaoProd || 0
      }];
    });
    notify(p.name + " ✓", "info");
  };
  const updateItem = (id, k, v) => setItems(prev => prev.map(i => i.id === id ? {
    ...i,
    [k]: v
  } : i));
  const removeItem = id => setItems(prev => prev.filter(i => i.id !== id));
  const subtotal = items.reduce((s, i) => s + i.precoUnit * (1 - (i.descItem || 0) / 100) * i.qty, 0);
  const total = subtotal * (1 - desconto / 100);
  const comissaoValor = items.reduce((s, i) => s + calcComissaoItem(i), 0) * (1 - desconto / 100);
  const isAvulso = cliente === "Avulso";
  const cliObj = customers.find(c => c.name === cliente);
  const endCli = cliObj ? [cliObj.rua && cliObj.rua + (cliObj.numero ? ", " + cliObj.numero : ""), cliObj.bairro, cliObj.cidade && cliObj.cidade + (cliObj.uf ? " - " + cliObj.uf : "")].filter(Boolean).join(" · ") : "";
  const finalizar = () => {
    if (items.length === 0) {
      notify("Adicione produtos!", "error");
      return;
    }
    if (isAvulso && !avNome.trim()) {
      notify("Informe o nome do destinatário!", "error");
      return;
    }
    const saleId = uid();
    const saleItems = items.map(i => ({
      name: i.name,
      qty: i.qty,
      price: i.precoUnit * (1 - (i.descItem || 0) / 100),
      comissaoProd: i.comissaoProd || 0,
      comissaoItem: calcComissaoItem(i)
    }));
    const newSale = {
      id: saleId,
      customer: isAvulso ? avNome.trim() : cliente,
      items: saleItems,
      total,
      payment,
      date: todayStr(),
      time: nowTime(),
      createdAt: Date.now(),
      tipo: "atacado",
      desconto,
      comissao,
      comissaoValor,
      vendedor: (currentUser === null || currentUser === void 0 ? void 0 : currentUser.name) || "",
      obs
    };
    persistS([newSale, ...sales]);
    persistP(products.map(p => {
      const ci = items.find(i => i.id === p.id);
      return ci ? {
        ...p,
        stock: Math.max(0, p.stock - ci.qty)
      } : p;
    }));
    if (!isAvulso) persistC(customers.map(c => c.name === cliente ? {
      ...c,
      purchases: c.purchases + 1,
      totalSpent: c.totalSpent + total,
      lastVisit: todayStr()
    } : c));
    // Cria pedido de entrega automaticamente
    const pedidosAtuais = pedidos || [];
    const enderecoEntrega = isAvulso ? [avRua && avRua + (avNum ? ", " + avNum : ""), avBairro, avCidade].filter(Boolean).join(" · ") : endCli;
    const novoPedido = {
      id: uid(),
      numero: "PED-" + String(pedidosAtuais.length + 1).padStart(4, "0"),
      cliente: isAvulso ? avNome.trim() : cliente,
      telefone: (cliObj === null || cliObj === void 0 ? void 0 : cliObj.phone) || "",
      endereco: enderecoEntrega,
      itens: saleItems,
      total,
      obs: avObs || obs,
      pagamento,
      status: "pedido",
      isPrazo: payment === "A Prazo",
      tipo: "atacado",
      criadoEm: Date.now(),
      criadoData: todayStr(),
      criadoHora: nowTime(),
      vendaId: saleId
    };
    persistE([novoPedido, ...pedidosAtuais]);
    notify("Venda atacado finalizada! Entrega criada: " + novoPedido.numero + (comissao > 0 ? " · Comissão: " + fmt(comissaoValor) : "") + " ✓");
    setItems([]);
    setCliente("Avulso");
    setDesconto(0);
    setObs("");
    setPagamento("pago");
    setAvNome("");
    setAvRua("");
    setAvNum("");
    setAvBairro("");
    setAvCidade("");
    setAvObs("");
    setStep("grid");
  };

  // ── STEP: GRID (igual PDV) ──────────────────────────────────────────────────
  if (step === "grid") return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginBottom: 12,
      padding: "10px 14px",
      borderColor: "#f59e0b30",
      background: "linear-gradient(135deg,#1a1200,#0f1117)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#f59e0b"
    }
  }, "\uD83D\uDCE6 Venda Atacado"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#6a6d80",
      marginTop: 2
    }
  }, "Comiss\xE3o: ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "#4ade80"
    }
  }, comissao, "%"))), items.length > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => setStep("edit"),
    style: {
      ...S.btn("primary"),
      padding: "9px 14px",
      fontSize: 13,
      borderRadius: 20
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cart",
    size: 14
  }), " ", items.length, " \xB7 ", fmt(total))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#5A6080"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 14
  })), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      paddingLeft: 34
    },
    placeholder: "Buscar produto...",
    value: search,
    onChange: e => setSearch(e.target.value)
  }), search && /*#__PURE__*/React.createElement("button", {
    onClick: () => setSearch(""),
    style: {
      position: "absolute",
      right: 8,
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      color: "#5A6080",
      cursor: "pointer",
      fontSize: 18
    }
  }, "\xD7"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      overflowX: "auto",
      marginBottom: 12,
      paddingBottom: 2,
      scrollbarWidth: "none"
    }
  }, cats.map(cat => /*#__PURE__*/React.createElement("button", {
    key: cat,
    onClick: () => setFilterCat(cat),
    style: {
      ...S.btn(filterCat === cat ? "primary" : "ghost"),
      padding: "7px 13px",
      fontSize: 12,
      whiteSpace: "nowrap",
      flexShrink: 0
    }
  }, cat))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(2,1fr)",
      gap: 10
    }
  }, filtered.map(prod => {
    const inCart = items.find(i => i.id === prod.id);
    return /*#__PURE__*/React.createElement("div", {
      key: prod.id,
      onClick: () => addItem(prod),
      style: {
        background: "#0F1220",
        border: "1px solid " + (inCart ? "#f59e0b" : "#1E2245"),
        borderRadius: 12,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color .15s",
        position: "relative",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent"
      },
      onTouchStart: e => e.currentTarget.style.transform = "scale(.96)",
      onTouchEnd: e => e.currentTarget.style.transform = "none"
    }, prod.photo ? /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        height: 80,
        overflow: "hidden",
        background: "#0a0c14",
        cursor: "zoom-in",
        position: "relative"
      },
      onClick: e => {
        e.stopPropagation();
        setPhotoModal(prod);
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: prod.photo,
      style: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
      },
      alt: ""
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        bottom: 4,
        right: 4,
        background: "rgba(0,0,0,.55)",
        borderRadius: 6,
        padding: "2px 6px",
        fontSize: 10,
        color: "#fff"
      }
    }, "\uD83D\uDD0D")) : /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        height: 6,
        background: "#0a0c14"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 10
      }
    }, inCart && /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 6,
        right: 6,
        background: "#f59e0b",
        color: "#000",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 800,
        padding: "1px 7px",
        zIndex: 1
      }
    }, inCart.qty), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#5A6080",
        marginBottom: 2
      }
    }, prod.category), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 4,
        lineHeight: 1.3
      }
    }, prod.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: "#f59e0b"
      }
    }, fmt(prod.priceAtacado || prod.price)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        marginTop: 2,
        color: prod.stock < 10 ? "#F07030" : "#5A6080"
      }
    }, prod.stock, " ", prod.unit || "unid")));
  })), items.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 20,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 100,
      width: "calc(100% - 32px)",
      maxWidth: 440
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setStep("edit"),
    style: {
      ...S.btn("primary"),
      width: "100%",
      padding: "15px",
      fontSize: 15,
      justifyContent: "center",
      borderRadius: 16,
      background: "linear-gradient(135deg,#f59e0b,#d97706)",
      boxShadow: "0 6px 28px rgba(245,158,11,.4)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cart",
    size: 18
  }), " ", items.length, " ite", items.length > 1 ? "ns" : "m", " \xB7 ", fmt(total))), photoModal && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.92)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    },
    onClick: () => setPhotoModal(null)
  }, /*#__PURE__*/React.createElement("img", {
    src: photoModal.photo,
    style: {
      maxWidth: "100%",
      maxHeight: "70vh",
      objectFit: "contain",
      borderRadius: 14,
      boxShadow: "0 8px 48px rgba(0,0,0,.8)"
    },
    alt: ""
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      color: "#e8e9f0",
      fontSize: 16,
      fontWeight: 700,
      textAlign: "center"
    }
  }, photoModal.name), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#f59e0b",
      fontSize: 20,
      fontWeight: 800,
      marginTop: 4
    }
  }, fmt(photoModal.priceAtacado || photoModal.price)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#5A6080",
      marginTop: 8
    }
  }, "Toque para fechar")));

  // ── STEP: EDIT ITEMS ───────────────────────────────────────────────────────
  if (step === "edit") return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setStep("grid"),
    style: {
      ...S.btn("ghost"),
      padding: "8px 12px"
    }
  }, "\u2190 Produtos"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      flex: 1
    }
  }, "Revisar Pedido"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setStep("finalizar"),
    style: {
      ...S.btn("primary"),
      padding: "9px 14px",
      fontSize: 13
    }
  }, "Finalizar \u2192")), items.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    style: {
      ...S.card,
      marginBottom: 8,
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      flex: 1,
      marginRight: 8
    }
  }, item.name), /*#__PURE__*/React.createElement("button", {
    onClick: () => removeItem(item.id),
    style: {
      ...S.btn("danger"),
      padding: "4px 7px"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 12
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 72px",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 3,
      fontSize: 9
    }
  }, "Qtd"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      padding: "7px 10px",
      fontSize: 13
    },
    type: "number",
    min: "0.1",
    step: "0.1",
    value: item.qty,
    onChange: e => updateItem(item.id, "qty", +e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 3,
      fontSize: 9
    }
  }, "Pre\xE7o Unit. R$"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      padding: "7px 10px",
      fontSize: 13
    },
    type: "number",
    step: "0.01",
    min: "0",
    value: item.precoUnit,
    onChange: e => updateItem(item.id, "precoUnit", +e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 3,
      fontSize: 9
    }
  }, "Desc. %"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      padding: "7px 10px",
      fontSize: 13
    },
    type: "number",
    min: "0",
    max: "100",
    value: item.descItem || 0,
    onChange: e => updateItem(item.id, "descItem", +e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#4ade80",
      marginTop: 5,
      textAlign: "right",
      fontWeight: 700
    }
  }, "= ", fmt(item.precoUnit * (1 - (item.descItem || 0) / 100) * item.qty)))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      padding: 14,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 6
    }
  }, "Desconto Geral (%)"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      marginBottom: 10
    },
    type: "number",
    min: "0",
    max: "100",
    value: desconto,
    onChange: e => setDesconto(+e.target.value),
    placeholder: "0"
  }), desconto > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#f59e0b",
      marginBottom: 8
    }
  }, "Desconto: -", fmt(subtotal * desconto / 100)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 18,
      fontWeight: 800,
      color: "#4ade80"
    }
  }, /*#__PURE__*/React.createElement("span", null, "TOTAL"), /*#__PURE__*/React.createElement("span", null, fmt(total))), comissao > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12,
      color: "#4A5BC4",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, "Sua comiss\xE3o (", comissao, "%)"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700
    }
  }, fmt(comissaoValor)))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setStep("finalizar"),
    style: {
      ...S.btn("primary"),
      width: "100%",
      justifyContent: "center",
      padding: "14px",
      fontSize: 15,
      marginTop: 12,
      borderRadius: 14,
      background: "linear-gradient(135deg,#f59e0b,#d97706)",
      boxShadow: "0 6px 24px rgba(245,158,11,.35)"
    }
  }, "Finalizar Pedido \u2192 ", fmt(total)));

  // ── STEP: FINALIZAR (entrega obrigatória) ───────────────────────────────────
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: () => setStep("edit"),
    style: {
      ...S.btn("ghost"),
      marginBottom: 14
    }
  }, "\u2190 Voltar"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#f59e0b",
      marginBottom: 12
    }
  }, "\uD83D\uDCCB Dados do Pedido"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Cliente"), /*#__PURE__*/React.createElement(CustomerSearch, {
    customers: customers,
    value: cliente,
    onChange: setCliente,
    S: S
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Pagamento"), /*#__PURE__*/React.createElement("select", {
    style: {
      ...S.input,
      marginBottom: 10
    },
    value: payment,
    onChange: e => setPayment(e.target.value)
  }, ["Dinheiro", "Cartão Débito", "Cartão Crédito", "Pix", "Boleto", "A Prazo"].map(m => /*#__PURE__*/React.createElement("option", {
    key: m
  }, m))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Situa\xE7\xE3o do Pagamento"), /*#__PURE__*/React.createElement("select", {
    style: {
      ...S.input,
      marginBottom: 10
    },
    value: pagamento,
    onChange: e => setPagamento(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "pago"
  }, "\u2705 Pago"), /*#__PURE__*/React.createElement("option", {
    value: "troco"
  }, "\uD83D\uDCB5 Levar Troco"), /*#__PURE__*/React.createElement("option", {
    value: "maquina"
  }, "\uD83D\uDCF2 Levar M\xE1quina"), /*#__PURE__*/React.createElement("option", {
    value: "troco_maquina"
  }, "\uD83D\uDCB5\uD83D\uDCF2 Levar Troco + M\xE1quina")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Observa\xE7\xE3o"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...S.input,
      height: 52,
      resize: "none",
      verticalAlign: "top",
      fontSize: 13
    },
    value: obs,
    onChange: e => setObs(e.target.value),
    placeholder: "Obs do pedido..."
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginBottom: 12,
      border: "1px solid #3b82f650",
      background: "linear-gradient(135deg,#0f2744,#0f1117)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "#60a5fa",
      marginBottom: 12
    }
  }, "\uD83D\uDE9A Endere\xE7o de Entrega"), isAvulso ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5,
      color: "#60a5fa"
    }
  }, "Nome do Destinat\xE1rio *"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      marginBottom: 10,
      border: "1px solid " + (avNome.trim() ? "#3b82f650" : "#1E2245")
    },
    placeholder: "Nome completo",
    value: avNome,
    onChange: e => setAvNome(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 80px",
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Rua / Av."), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "Rua das Flores",
    value: avRua,
    onChange: e => setAvRua(e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "N\xBA"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "100",
    value: avNum,
    onChange: e => setAvNum(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Bairro"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "Centro",
    value: avBairro,
    onChange: e => setAvBairro(e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Cidade"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "Divin\xF3polis",
    value: avCidade,
    onChange: e => setAvCidade(e.target.value)
  })))) : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 12px",
      background: "#0A0C1E",
      border: "1px solid #1a1c2e",
      borderRadius: 8,
      fontSize: 12,
      color: "#6a6d80",
      marginBottom: 10
    }
  }, endCli ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "mapPin",
    size: 12,
    color: "#3b82f6"
  }), " ", endCli) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#f59e0b"
    }
  }, "\u26A0\uFE0F Sem endere\xE7o cadastrado para este cliente.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Observa\xE7\xE3o da Entrega"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...S.input,
      height: 52,
      resize: "none",
      verticalAlign: "top",
      fontSize: 13
    },
    placeholder: "Ex: Ligar antes, port\xE3o azul...",
    value: avObs,
    onChange: e => setAvObs(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginBottom: 14,
      padding: 12
    }
  }, items.map(i => /*#__PURE__*/React.createElement("div", {
    key: i.id,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "5px 0",
      borderBottom: "1px solid #14161e",
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", null, i.qty, "\xD7 ", i.name, i.descItem > 0 ? " (-" + i.descItem + "%)" : ""), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700
    }
  }, fmt(i.precoUnit * (1 - (i.descItem || 0) / 100) * i.qty)))), desconto > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "6px 0",
      fontSize: 12,
      color: "#f59e0b"
    }
  }, /*#__PURE__*/React.createElement("span", null, "Desconto (", desconto, "%)"), /*#__PURE__*/React.createElement("span", null, "-", fmt(subtotal * desconto / 100))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      paddingTop: 8,
      fontSize: 16,
      fontWeight: 800,
      color: "#4ade80"
    }
  }, /*#__PURE__*/React.createElement("span", null, "TOTAL"), /*#__PURE__*/React.createElement("span", null, fmt(total))), comissao > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12,
      color: "#4A5BC4",
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, "Comiss\xE3o (", comissao, "%)"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 700
    }
  }, fmt(comissaoValor)))), /*#__PURE__*/React.createElement("button", {
    onClick: finalizar,
    disabled: isAvulso && !avNome.trim(),
    style: {
      ...S.btn("primary"),
      width: "100%",
      justifyContent: "center",
      padding: "15px",
      fontSize: 15,
      borderRadius: 14,
      background: isAvulso && !avNome.trim() ? "#1E2245" : "linear-gradient(135deg,#f59e0b,#d97706)",
      color: isAvulso && !avNome.trim() ? "#5A6080" : "#000",
      fontWeight: 800,
      boxShadow: isAvulso && !avNome.trim() ? "none" : "0 6px 24px rgba(245,158,11,.4)",
      cursor: isAvulso && !avNome.trim() ? "not-allowed" : "pointer"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 16
  }), " ", isAvulso && !avNome.trim() ? "Informe o destinatário" : "Confirmar + Criar Entrega"));
}

// ── LISTA DE COMPRAS ────────────────────────────────────────────────────────────
const FASES = [{
  id: "pendente",
  label: "Pendente",
  emoji: "🕐",
  color: "#94a3b8",
  bg: "#94a3b815",
  border: "#94a3b840"
}, {
  id: "procurando",
  label: "Procurando",
  emoji: "🔍",
  color: "#f59e0b",
  bg: "#f59e0b15",
  border: "#f59e0b50"
}, {
  id: "carrinho",
  label: "No Carrinho",
  emoji: "🛒",
  color: "#3b82f6",
  bg: "#3b82f615",
  border: "#3b82f650"
}, {
  id: "comprado",
  label: "Comprado",
  emoji: "✅",
  color: "#22c55e",
  bg: "#22c55e15",
  border: "#22c55e50"
}, {
  id: "faltou",
  label: "Não tinha",
  emoji: "❌",
  color: "#ef4444",
  bg: "#ef444415",
  border: "#ef444450"
}];
const FASE_MAP = Object.fromEntries(FASES.map(f => [f.id, f]));
function ListaComprasPage({
  S,
  notify
}) {
  const [items, setItems] = useState(() => load("pdv_lista_compras", []));
  const [input, setInput] = useState("");
  const [qty, setQty] = useState("");
  const [filterFase, setFilterFase] = useState("todas");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [faseMenu, setFaseMenu] = useState(null);
  const inputRef = useRef(null);
  const persist = v => {
    setItems(v);
    syncSave("lista_compras", v);
  };
  const addItem = () => {
    var _inputRef$current2;
    const name = input.trim();
    if (!name) {
      var _inputRef$current;
      (_inputRef$current = inputRef.current) === null || _inputRef$current === void 0 || _inputRef$current.focus();
      return;
    }
    persist([{
      id: uid(),
      name,
      qty: qty.trim() || "",
      fase: "pendente",
      createdAt: Date.now()
    }, ...items]);
    setInput("");
    setQty("");
    (_inputRef$current2 = inputRef.current) === null || _inputRef$current2 === void 0 || _inputRef$current2.focus();
    notify('"' + name + '" adicionado ✓');
  };
  const setFase = (id, fase) => {
    persist(items.map(i => i.id === id ? {
      ...i,
      fase
    } : i));
    setFaseMenu(null);
  };
  const removeItem = id => persist(items.filter(i => i.id !== id));
  const saveEdit = id => {
    if (!editText.trim()) return;
    persist(items.map(i => i.id === id ? {
      ...i,
      name: editText.trim()
    } : i));
    setEditId(null);
  };
  const filtered = items.filter(i => (filterFase === "todas" || i.fase === filterFase) && i.name.toLowerCase().includes(search.toLowerCase()));
  const counts = Object.fromEntries(FASES.map(f => [f.id, items.filter(i => i.fase === f.id).length]));
  const totalOk = counts["comprado"] || 0;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#5A6080"
    }
  }, totalOk, "/", items.length, " conclu\xEDdos"), totalOk > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      persist(items.filter(i => i.fase !== "comprado"));
      notify("Comprados removidos.", "warn");
    },
    style: {
      ...S.btn("danger"),
      padding: "6px 12px",
      fontSize: 12
    }
  }, "Limpar \u2705")), items.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      height: 5,
      background: "#1E2245",
      borderRadius: 10,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: totalOk / items.length * 100 + "%",
      background: "linear-gradient(90deg,#4ade80,#22c55e)",
      borderRadius: 10,
      transition: "width .4s"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginBottom: 12,
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    value: input,
    onChange: e => setInput(e.target.value),
    onKeyDown: e => e.key === "Enter" && addItem(),
    placeholder: "Nome do produto...",
    style: {
      ...S.input,
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: qty,
    onChange: e => setQty(e.target.value),
    onKeyDown: e => e.key === "Enter" && addItem(),
    placeholder: "Qtd.",
    style: {
      ...S.input,
      width: 70,
      textAlign: "center"
    }
  })), /*#__PURE__*/React.createElement("button", {
    onClick: addItem,
    style: {
      ...S.btn("primary"),
      width: "100%",
      justifyContent: "center",
      padding: "11px"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 15
  }), " Adicionar")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#5A6080"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 14
  })), /*#__PURE__*/React.createElement("input", {
    value: search,
    onChange: e => setSearch(e.target.value),
    placeholder: "Pesquisar...",
    style: {
      ...S.input,
      paddingLeft: 32
    }
  }), search && /*#__PURE__*/React.createElement("button", {
    onClick: () => setSearch(""),
    style: {
      position: "absolute",
      right: 10,
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      color: "#5A6080",
      cursor: "pointer",
      fontSize: 18
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      overflowX: "auto",
      marginBottom: 14,
      paddingBottom: 2,
      scrollbarWidth: "none"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setFilterFase("todas"),
    style: {
      flexShrink: 0,
      padding: "7px 13px",
      borderRadius: 20,
      border: "none",
      cursor: "pointer",
      fontFamily: "'Sora',sans-serif",
      fontWeight: 700,
      fontSize: 11,
      background: filterFase === "todas" ? "linear-gradient(135deg,#E8682A,#F07030)" : "#1E2245",
      color: filterFase === "todas" ? "#fff" : "#6a6d80"
    }
  }, "Todas (", items.length, ")"), FASES.map(f => /*#__PURE__*/React.createElement("button", {
    key: f.id,
    onClick: () => setFilterFase(f.id),
    style: {
      flexShrink: 0,
      padding: "7px 12px",
      borderRadius: 20,
      cursor: "pointer",
      fontFamily: "'Sora',sans-serif",
      fontWeight: 700,
      fontSize: 11,
      background: filterFase === f.id ? f.bg : "#1E2245",
      border: "1px solid " + (filterFase === f.id ? f.border : "#1E2245"),
      color: filterFase === f.id ? f.color : "#6a6d80"
    }
  }, f.emoji, " ", f.label, counts[f.id] > 0 ? " (" + counts[f.id] + ")" : ""))), filtered.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "\uD83D\uDECD\uFE0F",
    title: items.length === 0 ? "Lista vazia" : "Nenhum item",
    desc: items.length === 0 ? "Adicione produtos acima" : "Tente outro filtro"
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, filtered.map(item => {
    const fase = FASE_MAP[item.fase];
    return /*#__PURE__*/React.createElement("div", {
      key: item.id,
      style: {
        ...S.card,
        borderLeft: "4px solid " + fase.color,
        border: "1px solid " + fase.border,
        borderLeft: "4px solid " + fase.color,
        padding: "12px 14px",
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setFaseMenu(faseMenu === item.id ? null : item.id),
      style: {
        flexShrink: 0,
        background: fase.bg,
        border: "1px solid " + fase.border,
        borderRadius: 20,
        padding: "4px 10px",
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 700,
        color: fase.color,
        fontFamily: "inherit"
      }
    }, fase.emoji, " ", fase.label), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, editId === item.id ? /*#__PURE__*/React.createElement("input", {
      autoFocus: true,
      value: editText,
      onChange: e => setEditText(e.target.value),
      onKeyDown: e => {
        if (e.key === "Enter") saveEdit(item.id);
        if (e.key === "Escape") setEditId(null);
      },
      onBlur: () => saveEdit(item.id),
      style: {
        ...S.input,
        padding: "5px 10px",
        fontSize: 14,
        fontWeight: 700,
        border: "1px solid #E8682A"
      }
    }) : /*#__PURE__*/React.createElement("div", {
      onDoubleClick: () => {
        setEditId(item.id);
        setEditText(item.name);
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        textDecoration: item.fase === "comprado" ? "line-through" : "none",
        color: item.fase === "comprado" ? "#5A6080" : "#e8e9f0"
      }
    }, item.name), item.qty && /*#__PURE__*/React.createElement("span", {
      style: {
        ...S.badge("#94a3b8"),
        fontSize: 11,
        flexShrink: 0
      }
    }, item.qty))), /*#__PURE__*/React.createElement("button", {
      onClick: () => removeItem(item.id),
      style: {
        background: "none",
        border: "none",
        color: "#252845",
        cursor: "pointer",
        padding: "4px 6px",
        fontSize: 20,
        lineHeight: 1,
        flexShrink: 0
      }
    }, "\xD7")), faseMenu === item.id && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 300
      },
      onClick: () => setFaseMenu(null)
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        right: 0,
        zIndex: 301,
        background: "#0A0C1E",
        border: "1px solid #1a1c2e",
        borderRadius: 14,
        padding: 8,
        boxShadow: "0 16px 48px rgba(0,0,0,.7)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        fontWeight: 700,
        color: "#5A6080",
        textTransform: "uppercase",
        letterSpacing: 1,
        padding: "4px 10px 8px"
      }
    }, "Alterar fase:"), FASES.map(f => /*#__PURE__*/React.createElement("button", {
      key: f.id,
      onClick: () => setFase(item.id, f.id),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        width: "100%",
        background: item.fase === f.id ? f.bg : "transparent",
        border: "1px solid " + (item.fase === f.id ? f.border : "transparent"),
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "'Sora',sans-serif",
        color: item.fase === f.id ? f.color : "#8a8da0",
        fontWeight: item.fase === f.id ? 700 : 500,
        fontSize: 13,
        textAlign: "left"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 17
      }
    }, f.emoji), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1
      }
    }, f.label), item.fase === f.id && /*#__PURE__*/React.createElement("span", null, "\u2713"))))));
  })));
}

// ── IMPORTAR ────────────────────────────────────────────────────────────────────
function ImportarPage({
  S,
  products,
  persistP,
  notify
}) {
  const [parsed, setParsed] = useState([]);
  const [step, setStep] = useState("input");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const fileRef = useRef(null);
  const getCategoria = nome => {
    const d = nome.toLowerCase();
    if (/torneira|valvula|reparo|sifao|tubo|hidro|ducha|chuveiro|registro/.test(d)) return "Hidráulica";
    if (/interruptor|tomada|fio|cabo|disjuntor|lampada|led/.test(d)) return "Elétrico";
    if (/broca|martelo|serra|chave|alicate|parafuso|prego|porca|marreta/.test(d)) return "Ferramentas";
    if (/cadeado|fechadura|gancho|pitao|suporte/.test(d)) return "Ferragens";
    if (/soda|cola|varal|trincha|rolo|pincel|tinta/.test(d)) return "Limpeza";
    if (/linha|pesca|anzol/.test(d)) return "Pesca";
    if (/macarico|botijao/.test(d)) return "Construção";
    if (/suporte.*tv|rack|antena/.test(d)) return "Eletrônicos";
    return "Outros";
  };
  const makeProduto = (desc, unidade, qtd, precoNF, barcode) => {
    const CX = /\bC(\d{1,4})\b/i;
    const DZ = {
      DZ: 12
    };
    let unitsPerBox = DZ[unidade.toUpperCase()] || 1;
    const cxM = desc.match(CX);
    if (cxM) unitsPerBox = parseInt(cxM[1]);
    const precoUnitario = unitsPerBox > 1 ? +(precoNF / unitsPerBox).toFixed(2) : precoNF;
    const estoque = Math.round(qtd * unitsPerBox);
    const nome = desc.replace(/^\d{3,8}\s*/, "").replace(/\bC\d{1,4}\b/i, "").replace(/\s{2,}/g, " ").trim().slice(0, 40);
    return {
      id: uid(),
      nomeOriginal: desc,
      nome,
      categoria: getCategoria(nome),
      quantidade: qtd,
      unidade: unidade.toUpperCase(),
      unitsPerBox,
      precoUnitario,
      estoque,
      barcode: barcode || "",
      observacao: unitsPerBox > 1 ? unitsPerBox + " un/emb → " + fmt(precoUnitario) + "/un" : "",
      selected: true
    };
  };
  const parseXML = xmlText => {
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    const dets = doc.querySelectorAll("det");
    if (dets.length === 0) throw new Error("XML sem itens <det>.");
    const produtos = [];
    const seen = new Set();
    dets.forEach(det => {
      const prod = det.querySelector("prod");
      if (!prod) return;
      const xProd = prod.querySelector("xProd");
      const qCom = prod.querySelector("qCom");
      const vUnCom = prod.querySelector("vUnCom");
      const uCom = prod.querySelector("uCom");
      const cEAN = prod.querySelector("cEAN");
      if (!xProd) return;
      const desc = xProd.textContent.trim();
      const unid = (uCom ? uCom.textContent.trim() : "UN").toUpperCase();
      const qtd = parseFloat((qCom ? qCom.textContent : "1").replace(",", ".")) || 1;
      const preco = parseFloat((vUnCom ? vUnCom.textContent : "0").replace(",", ".")) || 0;
      if (preco <= 0) return;
      const key = desc.toLowerCase().replace(/\s+/g, "").slice(0, 20);
      if (seen.has(key)) return;
      seen.add(key);
      const barcode = cEAN && cEAN.textContent !== "SEM GTIN" ? cEAN.textContent : "";
      produtos.push(makeProduto(desc, unid, qtd, preco, barcode));
    });
    if (produtos.length === 0) throw new Error("Nenhum produto no XML.");
    return produtos;
  };
  const parseCSV = text => {
    var _text$split$, _text$split$2;
    const sep = (_text$split$ = text.split("\n")[0]) !== null && _text$split$ !== void 0 && _text$split$.includes(";") ? ";" : (_text$split$2 = text.split("\n")[0]) !== null && _text$split$2 !== void 0 && _text$split$2.includes("\t") ? "\t" : ",";
    const linhas = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (linhas.length < 2) throw new Error("CSV vazio.");
    const header = linhas[0].toLowerCase().split(sep).map(h => h.replace(/"/g, "").trim());
    const iN = header.findIndex(h => /nome|descri|produto/.test(h));
    const iP = header.findIndex(h => /preco|valor|vunit|price/.test(h));
    const iQ = header.findIndex(h => /qtd|quant|estoque|qty/.test(h));
    const iU = header.findIndex(h => /unid|unit/.test(h));
    const produtos = [];
    const seen = new Set();
    for (let i = iN >= 0 ? 1 : 0; i < linhas.length; i++) {
      const cols = linhas[i].split(sep).map(p => p.replace(/"/g, "").trim());
      const clean = idx => idx >= 0 && cols[idx] ? cols[idx] : "";
      const num = idx => parseFloat(clean(idx).replace(",", ".")) || 0;
      let desc, preco, qtd, unid;
      if (iN >= 0 && iP >= 0) {
        desc = clean(iN);
        preco = num(iP);
        qtd = iQ >= 0 ? num(iQ) || 1 : 1;
        unid = iU >= 0 ? clean(iU) || "UN" : "UN";
      } else {
        desc = cols.find(p => isNaN(parseFloat(p.replace(",", "."))) && p.length > 3) || "";
        const nums = cols.map(p => parseFloat(p.replace(",", ".")) || 0).filter(n => n > 0);
        preco = nums.length > 0 ? Math.min(...nums) : 0;
        qtd = 1;
        unid = "UN";
      }
      if (!desc || desc.length < 2 || preco <= 0) continue;
      const key = desc.toLowerCase().replace(/\s+/g, "").slice(0, 20);
      if (seen.has(key)) continue;
      seen.add(key);
      produtos.push(makeProduto(desc, unid, qtd, preco, ""));
    }
    if (produtos.length === 0) throw new Error("Nenhum produto no CSV.");
    return produtos;
  };

  // ── PARSER DE ORÇAMENTO PDF (formato Grupo Bartolomeu / atacadista) ──────────
  // Formato: COD-X DESCRICAO / MARCA: X COD NCM: X / COD.BARRAS: X / I/S UN QTD DESC% LIQUIDO UNIT. TOTAL
  const parseOrcamentoPDF = text => {
    const produtos = [];
    const linhas = text.split("\n").map(l => l.trim()).filter(Boolean);
    let i = 0;

    // Padrão de linha de dados: S/I? UNIDADE QTD PERC% LIQUIDO UNIT TOTAL
    // Ex: "S DZ 1 1,00 % 87,16 7,26 87,16" ou "UN 25 1,00 % 4,73 4,73 118,18"
    const reData = /^(S\s+I?\s*|I\s+)?(DZ|PT|CX|UN|KG|MC|RL|PC|MT|LT|MR|GL)\s+(\d+)\s+([\d,]+)\s*%\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)$/i;

    // Padrão de código: "120607-0 DESCRICAO..."
    const reCod = /^(\d{3,6}-\d)\s+(.+)$/;
    const pNum = v => parseFloat((v || "0").replace(/\./g, "").replace(",", "."));
    const UN_MULT = {
      DZ: 12,
      PT: 1,
      CX: 1,
      UN: 1,
      KG: 1,
      MC: 1,
      RL: 1,
      PC: 1,
      MT: 1,
      LT: 1,
      MR: 1,
      GL: 1
    };
    while (i < linhas.length) {
      const linha = linhas[i];
      const mCod = linha.match(reCod);
      if (mCod) {
        const cod = mCod[1];
        const desc = mCod[2].trim();
        let marca = "",
          barcode = "",
          un = "UN",
          qtd = 1,
          unitPrice = 0,
          liquido = 0;
        i++;

        // Lê linhas seguintes até encontrar linha de dados
        while (i < linhas.length) {
          const l = linhas[i];
          // Linha de MARCA
          if (l.startsWith("MARCA:")) {
            marca = l.replace(/^MARCA:\s*/, "").split(/\s+COD\s+NCM:/)[0].trim();
            i++;
            continue;
          }
          // Linha de COD.BARRAS — pega o menor código (EAN-13 sem leading digit)
          if (l.startsWith("COD.BARRAS:")) {
            const bcs = l.replace("COD.BARRAS:", "").trim().split(/\s+/);
            // Prefere o código de 13 dígitos
            const bc13 = bcs.find(b => /^\d{13}$/.test(b));
            const bc = bc13 || bcs.find(b => /^\d{8,}$/.test(b)) || "";
            barcode = bc;
            i++;
            // Linha seguinte pode ser segundo barcode (começa com número, sem label)
            if (i < linhas.length && /^\d{8,13}$/.test(linhas[i])) {
              i++;
            }
            continue;
          }
          // Linha de dados: UN QTD DESC% LIQUIDO UNIT TOTAL
          const mD = l.match(reData);
          if (mD) {
            un = (mD[2] || "UN").toUpperCase();
            qtd = parseInt(mD[3]) || 1;
            liquido = pNum(mD[5]);
            unitPrice = pNum(mD[6]);
            i++;
            break;
          }
          // Se linha parece ser próximo produto ou rodapé, para
          if (reCod.test(l) || l.startsWith("Qtd.") || l.startsWith("ORCA") || l.startsWith("PRECO")) {
            break;
          }
          i++;
        }
        if (unitPrice <= 0 && liquido > 0) unitPrice = liquido;
        if (unitPrice <= 0) continue;

        // Calcula unidades por embalagem e estoque
        const multEmb = UN_MULT[un] || 1;
        const estoqueTotal = qtd * multEmb;
        const unPDV = un === "DZ" ? "unid" : un === "KG" ? "kg" : un === "MT" ? "m" : "unid";

        // Nome limpo: remove códigos do final (C6, C24, C100, etc.)
        const nome = desc.replace(/\s+C\d+$/, "").replace(/COD NCM:.*/, "").trim().slice(0, 60);
        produtos.push({
          id: uid(),
          nomeOriginal: desc,
          nome,
          marca,
          categoria: getCategoria(nome),
          quantidade: qtd,
          unidade: un,
          unitsPerBox: multEmb,
          precoUnitario: unitPrice,
          estoque: estoqueTotal,
          barcode,
          codigoProduto: cod,
          observacao: multEmb > 1 ? multEmb + "un/emb → R$" + unitPrice.toFixed(2) + "/un" : "",
          selected: true
        });
      } else {
        i++;
      }
    }
    if (produtos.length === 0) throw new Error("Nenhum produto encontrado. Verifique se é um orçamento no formato correto.");
    return produtos;
  };
  const parseTXT = text => {
    const LIXO = /^[-=*.]{4,}$|^[A-Z]{30,}$|DANFE|CHAVE DE ACESSO|CNPJ|FONE|PROTOCOLO|TRANSPORTADOR|COMPROVANTE|BOLETO|VENCIMENTO|ASSINATURA|DECLARO|EVITE|PAGAVEL|INSCRICAO|RESERVADO|IMPRESSO|BASE DE|DADOS DO PRODUTO|DESCRICAO DOS|PESO BRUTO/i;
    const rawLines = text.split("\n").map(l => l.trim()).filter(l => l.length > 1 && !LIXO.test(l));
    const SOLO_PRICE = /^\d{1,6}[,.]\d{2}$/;
    const STARTS_PROD = /^\d{4,8}\s+[A-Z]/;
    const HAS_COMP = /\b(UN|CX|DZ|PT|SC|KG|%)\s+[\d,.]+\s+[\d,.]+/i;
    const lines = [];
    rawLines.forEach(cur => {
      if (SOLO_PRICE.test(cur) && lines.length > 0) {
        lines[lines.length - 1] += " " + cur;
      } else if (!STARTS_PROD.test(cur) && lines.length > 0 && !HAS_COMP.test(lines[lines.length - 1]) && cur.length < 60 && !/^\d{4,}/.test(cur)) {
        lines[lines.length - 1] += " " + cur;
      } else {
        lines.push(cur);
      }
    });
    const RE = /^(?:\d{3,8}\s+)?(.+?)\s+(UN|CX|DZ|PT|SC|KG|LT|MT|PC|PR|GR|ML|%)\s+([\d]+[,.]?[\d]*)\s+([\d]+[,.]\d{2})\s*$/i;
    const produtos = [];
    const seen = new Set();
    lines.forEach(line => {
      if (line.length < 8) return;
      const m = line.match(RE);
      if (!m) return;
      const [, desc, unid, qtdStr, precoStr] = m;
      if (!desc || desc.length < 3) return;
      const key = desc.toLowerCase().replace(/\s+/g, "").slice(0, 20);
      if (seen.has(key)) return;
      seen.add(key);
      const qtd = parseFloat(qtdStr.replace(",", ".")) || 1;
      const preco = parseFloat(precoStr.replace(",", ".")) || 0;
      if (preco <= 0) return;
      produtos.push(makeProduto(desc.trim(), unid, qtd, preco, ""));
    });
    if (produtos.length === 0) throw new Error("Nenhum produto reconhecido. Formato:\nDESCRIÇÃO UNIDADE QTD PREÇO\nEx: CADEADO 50MM UN 5,00 193,70");
    return produtos;
  };
  const parsePDF = async file => {
    setStatusMsg("Carregando PDF.js...");
    if (!window.pdfjsLib) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        s.onload = res;
        s.onerror = () => rej(new Error("Falha ao carregar PDF.js"));
        document.head.appendChild(s);
      });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
    setStatusMsg("Extraindo texto...");
    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({
      data: buf
    }).promise;
    const np = Math.min(pdf.numPages, 10);
    const pageTexts = [];
    for (let p = 1; p <= np; p++) {
      setStatusMsg("Lendo pág. " + p + "/" + np + "...");
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      const byY = {};
      tc.items.forEach(item => {
        const y = Math.round(item.transform[5]);
        if (!byY[y]) byY[y] = [];
        byY[y].push(item.str);
      });
      const sortedY = Object.keys(byY).map(Number).sort((a, b) => b - a);
      pageTexts.push(...sortedY.map(y => byY[y].join(" ").trim()).filter(Boolean));
    }
    const fullText = pageTexts.join("\n");
    // Detecta orçamento pelo conteúdo (tem COD NCM: ou COD.BARRAS:)
    if (fullText.includes("COD NCM:") || fullText.includes("COD.BARRAS:") || fullText.includes("ORCAMENTO Nº") || fullText.includes("ORÇAMENTO")) {
      return parseOrcamentoPDF(fullText);
    }
    return parseTXT(fullText);
  };
  const handleFile = async e => {
    var _e$target$files2;
    const file = (_e$target$files2 = e.target.files) === null || _e$target$files2 === void 0 ? void 0 : _e$target$files2[0];
    if (!file) return;
    e.target.value = "";
    const name = file.name.toLowerCase();
    setLoading(true);
    setStatusMsg("Lendo arquivo...");
    try {
      let produtos = [];
      if (name.endsWith(".xml")) {
        const text = await file.text();
        produtos = parseXML(text);
        notify(produtos.length + " item(ns) do XML ✓");
      } else if (name.endsWith(".csv")) {
        const text = await file.text();
        produtos = parseCSV(text);
        notify(produtos.length + " item(ns) do CSV ✓");
      } else if (name.endsWith(".pdf")) {
        produtos = await parsePDF(file);
        notify(produtos.length + " item(ns) do PDF ✓");
      } else if (name.endsWith(".txt")) {
        const text = await file.text();
        produtos = parseTXT(text);
        notify(produtos.length + " item(ns) do TXT ✓");
      } else throw new Error("Use XML, CSV, PDF ou TXT.");
      setParsed(produtos);
      setStep("review");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  };
  const importarSelecionados = () => {
    const sel = parsed.filter(p => p.selected);
    if (sel.length === 0) {
      notify("Selecione ao menos um.", "warn");
      return;
    }
    let novos = 0,
      atualizados = 0,
      ignorados = 0;
    const np = [...products];
    sel.forEach(p => {
      // Busca por código de barras primeiro (mais preciso), depois por nome
      let idx = -1;
      if (p.barcode) idx = np.findIndex(x => x.barcode && x.barcode.trim() === p.barcode.trim());
      if (idx < 0) idx = np.findIndex(x => x.name.toLowerCase().trim() === p.nome.toLowerCase().trim());
      // Busca parcial: nome do produto contém o nome da NF ou vice-versa
      if (idx < 0) {
        const nNorm = p.nome.toLowerCase().replace(/\s+/g, " ").trim();
        idx = np.findIndex(x => {
          const xNorm = x.name.toLowerCase().replace(/\s+/g, " ").trim();
          return xNorm.includes(nNorm) || nNorm.includes(xNorm);
        });
      }
      if (idx >= 0) {
        // Produto existe — atualiza estoque e preço custo
        np[idx] = {
          ...np[idx],
          costPrice: p.precoUnitario,
          // preço NF é o custo
          stock: np[idx].stock + p.estoque,
          barcode: p.barcode || np[idx].barcode
        };
        atualizados++;
      } else {
        // Produto novo
        np.unshift({
          id: uid(),
          name: p.nome,
          category: p.categoria,
          price: 0,
          // varejo p/ preencher depois
          priceAtacado: 0,
          // atacado p/ preencher depois
          costPrice: p.precoUnitario,
          // custo = preço NF
          stock: p.estoque,
          unit: "unid",
          barcode: p.barcode || "",
          minStock: 0,
          photo: "",
          description: "",
          createdAt: Date.now()
        });
        novos++;
      }
    });
    persistP(np);
    notify(novos + " novo(s), " + atualizados + " atualizado(s) ✓");
    setStep("done");
    setParsed([]);
  };
  const saveEdit = idx => {
    setParsed(parsed.map((x, i) => i === idx ? {
      ...editForm,
      id: x.id,
      selected: x.selected
    } : x));
    setEditingIdx(null);
  };
  if (step === "done") return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "48px 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 64,
      marginBottom: 16
    }
  }, "\u2705"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 800,
      color: "#4ade80",
      marginBottom: 8
    }
  }, "Importa\xE7\xE3o conclu\xEDda!"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#5A6080",
      marginBottom: 28
    }
  }, "Produtos adicionados ao estoque."), /*#__PURE__*/React.createElement("button", {
    style: S.btn("primary"),
    onClick: () => setStep("input")
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "import",
    size: 14
  }), " Nova Importa\xE7\xE3o"));
  if (step === "review") return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700
    }
  }, "Revisar Produtos"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#5A6080",
      marginTop: 2
    }
  }, parsed.filter(p => p.selected).length, "/", parsed.length, " selecionados")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      padding: "7px 12px",
      fontSize: 12
    },
    onClick: () => setStep("input")
  }, "\u2190 Voltar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      padding: "9px 14px"
    },
    onClick: importarSelecionados
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "import",
    size: 14
  }), " Importar"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setParsed(p => p.map(x => ({
      ...x,
      selected: true
    }))),
    style: {
      ...S.btn("ghost"),
      padding: "6px 12px",
      fontSize: 12
    }
  }, "Sel. todos"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setParsed(p => p.map(x => ({
      ...x,
      selected: false
    }))),
    style: {
      ...S.btn("ghost"),
      padding: "6px 12px",
      fontSize: 12
    }
  }, "Desmarcar")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, parsed.map((prod, idx) => /*#__PURE__*/React.createElement("div", {
    key: prod.id,
    style: {
      ...S.card,
      borderLeft: "3px solid " + (prod.selected ? "#4ade80" : "#252845"),
      opacity: prod.selected ? 1 : 0.5
    }
  }, editingIdx === idx ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Nome"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      fontSize: 13
    },
    value: editForm.nome,
    onChange: e => setEditForm(f => ({
      ...f,
      nome: e.target.value
    }))
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Pre\xE7o Unit."), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      fontSize: 13
    },
    type: "number",
    step: "0.01",
    value: editForm.precoUnitario,
    onChange: e => setEditForm(f => ({
      ...f,
      precoUnitario: +e.target.value
    }))
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Estoque"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      fontSize: 13
    },
    type: "number",
    value: editForm.estoque,
    onChange: e => setEditForm(f => ({
      ...f,
      estoque: +e.target.value
    }))
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Un./Emb."), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      fontSize: 13
    },
    type: "number",
    min: "1",
    value: editForm.unitsPerBox || 1,
    onChange: e => setEditForm(f => ({
      ...f,
      unitsPerBox: +e.target.value
    }))
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Categoria"), /*#__PURE__*/React.createElement("select", {
    style: {
      ...S.input,
      fontSize: 13
    },
    value: editForm.categoria,
    onChange: e => setEditForm(f => ({
      ...f,
      categoria: e.target.value
    }))
  }, loadCats().map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center",
      fontSize: 13
    },
    onClick: () => setEditingIdx(null)
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      flex: 1,
      justifyContent: "center",
      fontSize: 13
    },
    onClick: () => saveEdit(idx)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13
  }), " Salvar"))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setParsed(p => p.map(x => x.id === prod.id ? {
      ...x,
      selected: !x.selected
    } : x)),
    style: {
      width: 22,
      height: 22,
      borderRadius: 6,
      border: "2px solid " + (prod.selected ? "#4ade80" : "#252845"),
      background: prod.selected ? "#4ade80" : "transparent",
      cursor: "pointer",
      flexShrink: 0,
      marginTop: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, prod.selected && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0A0C1E",
      fontSize: 12,
      fontWeight: 900
    }
  }, "\u2713")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      marginBottom: 3
    }
  }, prod.nome), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6080",
      marginBottom: 5,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, prod.nomeOriginal), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.badge("#E8682A")
  }, fmt(prod.precoUnitario), "/un"), /*#__PURE__*/React.createElement("span", {
    style: S.badge("#4A5BC4")
  }, prod.estoque, " unid."), /*#__PURE__*/React.createElement("span", {
    style: S.badge("#a78bfa")
  }, prod.categoria), prod.unitsPerBox > 1 && /*#__PURE__*/React.createElement("span", {
    style: S.badge("#f59e0b")
  }, prod.unitsPerBox, " un/emb"), prod.barcode && /*#__PURE__*/React.createElement("span", {
    style: S.badge("#4ade80")
  }, "EAN: ", prod.barcode)), prod.observacao ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6080",
      marginTop: 4
    }
  }, prod.observacao) : null), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setEditingIdx(idx);
      setEditForm({
        ...prod
      });
    },
    style: {
      ...S.btn("ghost"),
      padding: "6px 9px",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit",
    size: 14
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 16,
      borderTop: "1px solid #1a1c2e",
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: () => setStep("input")
  }, "\u2190 Voltar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      flex: 1,
      justifyContent: "center",
      padding: "12px"
    },
    onClick: importarSelecionados
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "import",
    size: 15
  }), " Importar ", parsed.filter(p => p.selected).length)));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginBottom: 14,
      padding: 16,
      borderColor: "#22d3ee30",
      background: "linear-gradient(135deg,#0a1520,#0f1117)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#4A5BC4",
      marginBottom: 10
    }
  }, "\uD83D\uDCE5 Importar NF-e / Or\xE7amento"), [["🗂️", "XML NF-e (SEFAZ) — lê campos estruturados da nota"], ["📊", "CSV — detecta separador e colunas automaticamente"], ["📄", "PDF — extrai texto via PDF.js (DANFE ou Orçamento atacadista)"], ["📝", "TXT — DESCRIÇÃO UNIDADE QTD PREÇO por linha"], ["📦", "Detecta C24, C200... e divide preço por unidade"]].map(([ic, tx]) => /*#__PURE__*/React.createElement("div", {
    key: tx,
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      flexShrink: 0
    }
  }, ic), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#6a6d80",
      lineHeight: 1.4
    }
  }, tx)))), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: ".xml,.csv,.pdf,.txt,text/xml,text/csv,application/pdf,text/plain",
    style: {
      display: "none"
    },
    onChange: handleFile
  }), loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      padding: 24,
      textAlign: "center",
      borderColor: "#22d3ee30"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32,
      marginBottom: 8,
      animation: "spin 1.2s linear infinite"
    }
  }, "\u2699\uFE0F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "#4A5BC4",
      marginBottom: 4
    }
  }, statusMsg || "Processando...")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 14
    }
  }, [{
    label: "XML NF-e",
    ext: ".xml",
    emoji: "🗂️",
    color: "#4A5BC4",
    desc: "Nota fiscal SEFAZ"
  }, {
    label: "CSV",
    ext: ".csv",
    emoji: "📊",
    color: "#4ade80",
    desc: "Planilha de produtos"
  }, {
    label: "PDF",
    ext: ".pdf",
    emoji: "📄",
    color: "#f59e0b",
    desc: "DANFE ou orçamento"
  }, {
    label: "TXT",
    ext: ".txt",
    emoji: "📝",
    color: "#a78bfa",
    desc: "Texto livre"
  }].map(ft => /*#__PURE__*/React.createElement("button", {
    key: ft.ext,
    onClick: () => {
      fileRef.current.accept = ft.ext;
      fileRef.current.click();
    },
    style: {
      ...S.card,
      padding: "14px 10px",
      border: "1px solid " + ft.color + "30",
      cursor: "pointer",
      background: "#0F1220",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      borderRadius: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 28
    }
  }, ft.emoji), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: ft.color
    }
  }, ft.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#5A6080",
      textAlign: "center"
    }
  }, ft.desc)))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 6
    }
  }, "Ou cole o texto manualmente:"), /*#__PURE__*/React.createElement("textarea", {
    placeholder: "Formato NF-e:\n029554 SODA CAUSTICA 500G C24 CX 1,00 371,07\n004073 CADEADO 50MM UN 5,00 193,70",
    style: {
      ...S.input,
      height: 160,
      resize: "vertical",
      verticalAlign: "top",
      fontFamily: "monospace",
      fontSize: 12,
      lineHeight: 1.5
    },
    onPaste: e => {
      const txt = e.clipboardData.getData("text");
      if (txt.trim().length > 0) {
        e.preventDefault();
        try {
          var _txt$split$;
          const prods = txt.includes("<det") ? parseXML(txt) : txt.includes(",") && ((_txt$split$ = txt.split("\n")[0]) === null || _txt$split$ === void 0 ? void 0 : _txt$split$.split(",").length) > 2 ? parseCSV(txt) : parseTXT(txt);
          setParsed(prods);
          setStep("review");
          notify(prods.length + " produto(s) ✓");
        } catch (err) {
          notify(err.message, "error");
        }
      }
    }
  })));
}

// ── ENTREGAS ────────────────────────────────────────────────────────────────────
function EntregasPage({
  S,
  sales,
  customers,
  notify,
  pedidos: pedidosProp,
  persistE: persistEProp,
  onReload
}) {
  const [pedidos, setPedidos] = useState(() => pedidosProp || load("pdv_entregas", []));
  useEffect(() => {
    if (pedidosProp) setPedidos(pedidosProp);
  }, [pedidosProp]);
  const persistE = v => {
    setPedidos(v);
    if (persistEProp) persistEProp(v);else {
      save("pdv_entregas", v);
      syncSave("entregas", v);
    }
  };
  const [tab, setTab] = useState("pedido");
  const [newPedido, setNewPedido] = useState(false);
  const [obsEdit, setObsEdit] = useState({});
  const [nForm, setNForm] = useState({
    cliente: "",
    telefone: "",
    endereco: "",
    obs: "",
    vendaId: "",
    pagamento: "pago"
  });
  const setNF = (k, v) => setNForm(f => ({
    ...f,
    [k]: v
  }));
  const STATUS = [{
    id: "pedido",
    label: "Pedido",
    emoji: "📋",
    color: "#94a3b8",
    bg: "#94a3b815",
    border: "#94a3b840"
  }, {
    id: "separando",
    label: "Separando",
    emoji: "📦",
    color: "#f59e0b",
    bg: "#f59e0b15",
    border: "#f59e0b50"
  }, {
    id: "rota",
    label: "Em Rota",
    emoji: "🚚",
    color: "#3b82f6",
    bg: "#3b82f615",
    border: "#3b82f650"
  }, {
    id: "concluido",
    label: "Concluído",
    emoji: "✅",
    color: "#22c55e",
    bg: "#22c55e15",
    border: "#22c55e50"
  }];
  const ST = Object.fromEntries(STATUS.map(s => [s.id, s]));
  const counts = Object.fromEntries(STATUS.map(s => [s.id, pedidos.filter(p => p.status === s.id).length]));
  const filtered = pedidos.filter(p => p.status === tab);
  const criarPedido = form => {
    const vendaSel = sales.find(s => s.id === form.vendaId);
    const vendaSelecionadaEntrega = sales.find(s => s.id === form.vendaId);
    const novo = {
      id: uid(),
      numero: "PED-" + String(pedidos.length + 1).padStart(4, "0"),
      cliente: form.cliente || "Avulso",
      telefone: form.telefone || "",
      endereco: form.endereco || "",
      itens: (vendaSel === null || vendaSel === void 0 ? void 0 : vendaSel.items) || [],
      total: (vendaSel === null || vendaSel === void 0 ? void 0 : vendaSel.total) || 0,
      obs: form.obs || "",
      pagamento: form.pagamento || "pago",
      status: "pedido",
      isPrazo: (vendaSelecionadaEntrega === null || vendaSelecionadaEntrega === void 0 ? void 0 : vendaSelecionadaEntrega.payment) === "A Prazo" || false,
      criadoEm: Date.now(),
      criadoData: todayStr(),
      criadoHora: nowTime(),
      vendaId: form.vendaId || null
    };
    persistE([novo, ...pedidos]);
    setNewPedido(false);
    notify("Pedido " + novo.numero + " criado! ✓");
  };
  const moverStatus = (id, novoStatus) => {
    var _ST$novoStatus;
    persistE(pedidos.map(p => p.id === id ? {
      ...p,
      status: novoStatus,
      atualizadoEm: Date.now()
    } : p));
    notify("Status: " + ((_ST$novoStatus = ST[novoStatus]) === null || _ST$novoStatus === void 0 ? void 0 : _ST$novoStatus.label) + " ✓");
  };
  const salvarObs = id => {
    persistE(pedidos.map(p => p.id === id ? {
      ...p,
      obs: obsEdit[id] ?? p.obs
    } : p));
    setObsEdit(o => {
      const n = {
        ...o
      };
      delete n[id];
      return n;
    });
    notify("Observação salva ✓");
  };
  const excluirPedido = id => {
    persistE(pedidos.filter(p => p.id !== id));
    notify("Pedido removido.", "warn");
  };
  const imprimirBrowser = ped => {
    const st = ST[ped.status];
    const itemRows = (ped.itens || []).map(i => "<tr><td>" + i.name + "</td><td style='text-align:center'>" + i.qty + "x</td><td style='text-align:right;font-weight:600'>" + fmt(i.price * i.qty) + "</td></tr>").join("");
    const css = "body{font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;color:#111;}table{width:100%;border-collapse:collapse;font-size:12px;}th{background:#f3f4f6;padding:6px;text-align:left;font-size:10px;text-transform:uppercase;}td{padding:6px;border-bottom:1px solid #f3f4f6;}.total{font-size:16px;font-weight:800;text-align:right;margin-top:10px;color:#2D3A8C;}@media print{body{max-width:100%;padding:8px}}";
    const pgStatus = ped.pagamento || "";
    const pgLabel = pgStatus === "pago" ? "✅ PAGO" : pgStatus === "troco" ? "💵 LEVAR TROCO" : pgStatus === "maquina" ? "📲 LEVAR MÁQUINA" : pgStatus === "troco_maquina" ? "💵📲 LEVAR TROCO + MÁQUINA" : "";
    const pgColor = pgStatus === "pago" ? "#27ae60" : "#e74c3c";
    const html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + ped.numero + "</title><style>" + css + "</style></head><body>" + "<div style='background:#2D3A8C;color:#fff;padding:14px;text-align:center;border-radius:8px;margin-bottom:16px'>" + "<img src='" + LOGO_SRC + "' alt='logo' style='height:44px;display:block;margin:0 auto 6px'/>" + "<div style='font-size:15px;font-weight:800;letter-spacing:1px'>PEDIDO DE ENTREGA</div>" + "<div style='font-size:11px;margin-top:3px;opacity:.85'>" + ped.numero + " · " + ped.criadoData + " " + ped.criadoHora + "</div>" + "</div>" + "<div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px;margin-bottom:12px;font-size:12px'>" + "<div style='display:flex;justify-content:space-between;margin-bottom:4px'>" + "<span><b>Status:</b> " + st.emoji + " " + st.label + "</span>" + "<span><b>Total:</b> <span style='color:#2D3A8C;font-weight:800'>" + fmt(ped.total) + "</span></span></div>" + "<b>Cliente:</b> " + ped.cliente + (ped.telefone ? " · 📞" + ped.telefone : "") + "<br>" + (ped.endereco ? "<b>Endereço:</b> 📍" + ped.endereco + "<br>" : "") + "</div>" + "<table><thead><tr><th>Produto</th><th style='text-align:center'>Qtd</th><th style='text-align:right'>Valor</th></tr></thead><tbody>" + itemRows + "</tbody></table>" + "<div class='total'>TOTAL: " + fmt(ped.total) + "</div>" + (pgLabel ? "<div style='margin-top:10px;padding:10px;border-radius:6px;border:2px solid " + pgColor + ";font-size:13px;font-weight:800;text-align:center;color:" + pgColor + "'>" + pgLabel + "</div>" : "") + (ped.obs ? "<div style='background:#fffbeb;border:1px solid #fef08a;padding:8px;border-radius:6px;font-size:12px;margin-top:8px'><b>Obs:</b> " + ped.obs + "</div>" : "") + "<div style='border-top:2px solid #2D3A8C;margin-top:20px;padding-top:14px;font-size:11px;color:#888;text-align:center'>" + "Assinatura do recebedor: _______________________________<br><br>Data: _____ / _____ / _______<br><br>" + "<b style='color:#2D3A8C'>Pecuarão Gontijo</b> · Rua Guarani, 461 · (37) 99922-1020" + "</div>" + "</body></html>";
    // Usa iframe para evitar bloqueio de popup
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        // Fallback: window.open
        const w = window.open("", "_blank", "width=520,height=750");
        if (w) {
          w.document.write(html);
          w.document.close();
          setTimeout(() => {
            try {
              w.print();
            } catch (_) {}
          }, 400);
        } else notify("Permita pop-ups para imprimir.", "warn");
      }
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch (_) {}
      }, 3000);
    }, 500);
  };
  const vendaSelecionada = sales.find(s => s.id === nForm.vendaId);
  const clienteSel = customers.find(c => c.name === ((vendaSelecionada === null || vendaSelecionada === void 0 ? void 0 : vendaSelecionada.customer) || nForm.cliente));
  const enderecoDoCliente = clienteSel ? [clienteSel.rua && clienteSel.rua + (clienteSel.numero ? ", " + clienteSel.numero : ""), clienteSel.bairro, clienteSel.cidade && clienteSel.cidade + (clienteSel.uf ? " - " + clienteSel.uf : ""), clienteSel.cep && "CEP: " + clienteSel.cep].filter(Boolean).join(" · ") : "";
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      overflowX: "auto",
      marginBottom: 14,
      paddingBottom: 2,
      scrollbarWidth: "none"
    }
  }, STATUS.map(st => /*#__PURE__*/React.createElement("button", {
    key: st.id,
    onClick: () => setTab(st.id),
    style: {
      flexShrink: 0,
      padding: "8px 13px",
      borderRadius: 20,
      cursor: "pointer",
      fontFamily: "'Sora',sans-serif",
      fontWeight: 700,
      fontSize: 12,
      background: tab === st.id ? st.bg : "#1E2245",
      border: "1px solid " + (tab === st.id ? st.border : "#1E2245"),
      color: tab === st.id ? st.color : "#6a6d80"
    }
  }, st.emoji, " ", st.label, " ", counts[st.id] > 0 ? "(" + counts[st.id] + ")" : ""))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setNewPedido(true),
    style: {
      ...S.btn("primary"),
      flex: 1,
      justifyContent: "center",
      padding: "11px"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 15
  }), " Novo Pedido de Entrega"), onReload && /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      notify("Atualizando...");
      const ok = await onReload();
      if (ok) notify("Entregas atualizadas! ✓");
    },
    style: {
      ...S.btn("ghost"),
      padding: "11px 14px",
      fontSize: 13
    }
  }, "\uD83D\uDD04")), filtered.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: ST[tab].emoji,
    title: "Nenhum pedido " + ST[tab].label.toLowerCase(),
    desc: tab === "pedido" ? "Crie um novo pedido acima." : "Mova pedidos para esta fase."
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, filtered.map(ped => {
    const st = ST[ped.status];
    return /*#__PURE__*/React.createElement("div", {
      key: ped.id,
      style: {
        ...S.card,
        borderLeft: "4px solid " + st.color,
        border: "1px solid " + st.border,
        borderLeft: "4px solid " + st.color
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        color: st.color
      }
    }, ped.numero), /*#__PURE__*/React.createElement("span", {
      style: {
        ...S.badge(st.color),
        fontSize: 10
      }
    }, st.emoji, " ", st.label), ped.tipo === "atacado" && /*#__PURE__*/React.createElement("span", {
      style: {
        ...S.badge("#f59e0b"),
        fontSize: 10
      }
    }, "\uD83D\uDCE6 Atacado")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        marginBottom: 2
      }
    }, ped.cliente), ped.telefone && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#6a6d80",
        display: "flex",
        alignItems: "center",
        gap: 5
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "phone",
      size: 11,
      color: "#6a6d80"
    }), ped.telefone)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 800,
        color: "#4ade80",
        flexShrink: 0,
        marginLeft: 8
      }
    }, fmt(ped.total))), ped.endereco && /*#__PURE__*/React.createElement("div", {
      style: {
        background: "#0A0C1E",
        border: "1px solid #1a1c2e",
        borderRadius: 8,
        padding: "7px 10px",
        marginBottom: 8,
        fontSize: 12,
        color: "#6a6d80",
        display: "flex",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "mapPin",
      size: 12,
      color: "#3b82f6"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        lineHeight: 1.4
      }
    }, ped.endereco)), ped.itens && ped.itens.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#5A6080",
        marginBottom: 8,
        lineHeight: 1.4
      }
    }, ped.itens.map(i => i.qty + "× " + i.name).join(", ")), obsEdit[ped.id] !== undefined ? /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("textarea", {
      value: obsEdit[ped.id],
      onChange: e => setObsEdit(o => ({
        ...o,
        [ped.id]: e.target.value
      })),
      placeholder: "Observa\xE7\xF5es...",
      style: {
        ...S.input,
        height: 60,
        resize: "none",
        verticalAlign: "top",
        fontSize: 13,
        lineHeight: 1.4
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        marginTop: 5
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setObsEdit(o => {
        const n = {
          ...o
        };
        delete n[ped.id];
        return n;
      }),
      style: {
        ...S.btn("ghost"),
        flex: 1,
        justifyContent: "center",
        padding: "7px",
        fontSize: 12
      }
    }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
      onClick: () => salvarObs(ped.id),
      style: {
        ...S.btn("primary"),
        flex: 1,
        justifyContent: "center",
        padding: "7px",
        fontSize: 12
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " Salvar"))) : ped.obs && /*#__PURE__*/React.createElement("div", {
      style: {
        background: "#0a0c14",
        border: "1px solid #f59e0b30",
        borderRadius: 8,
        padding: "7px 10px",
        marginBottom: 8,
        fontSize: 12,
        color: "#f59e0b",
        lineHeight: 1.4
      }
    }, "\uD83D\uDCAC ", ped.obs), (() => {
      const PG = {
        pago: {
          l: "✅ Pago",
          c: "#27ae60"
        },
        troco: {
          l: "💵 Levar Troco",
          c: "#f39c12"
        },
        maquina: {
          l: "📲 Levar Máquina",
          c: "#3b82f6"
        },
        troco_maquina: {
          l: "💵📲 Troco + Máq.",
          c: "#e67e22"
        }
      };
      const pg = PG[ped.pagamento || "pago"] || PG.pago;
      return /*#__PURE__*/React.createElement("div", {
        style: {
          marginBottom: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 10,
          color: "#5A6080",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 4
        }
      }, "Situa\xE7\xE3o do Pagamento"), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 5,
          flexWrap: "wrap"
        }
      }, Object.entries(PG).map(([k, v]) => /*#__PURE__*/React.createElement("button", {
        key: k,
        onClick: () => persistE(pedidos.map(p => p.id === ped.id ? {
          ...p,
          pagamento: k
        } : p)),
        style: {
          padding: "5px 10px",
          borderRadius: 20,
          border: "1px solid " + (ped.pagamento === k ? v.c + "80" : v.c + "25"),
          background: ped.pagamento === k ? v.c + "18" : "transparent",
          color: ped.pagamento === k ? v.c : "#6a6d80",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 11,
          fontWeight: ped.pagamento === k ? 700 : 500
        }
      }, v.l))));
    })(), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#3a3d50",
        marginBottom: 10
      }
    }, "Criado: ", ped.criadoData, " ", ped.criadoHora), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: "1px solid #14161e",
        paddingTop: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 5,
        flexWrap: "wrap",
        marginBottom: 7
      }
    }, STATUS.filter(s => s.id !== ped.status).map(s => /*#__PURE__*/React.createElement("button", {
      key: s.id,
      onClick: () => moverStatus(ped.id, s.id),
      style: {
        flexGrow: 1,
        padding: "7px 8px",
        borderRadius: 8,
        border: "1px solid " + s.border,
        background: s.bg,
        color: s.color,
        cursor: "pointer",
        fontFamily: "'Sora',sans-serif",
        fontWeight: 600,
        fontSize: 11,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4
      }
    }, s.emoji, " ", s.label))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setObsEdit(o => ({
        ...o,
        [ped.id]: ped.obs || ""
      })),
      style: {
        ...S.btn("ghost"),
        flex: 1,
        justifyContent: "center",
        padding: "7px",
        fontSize: 12
      }
    }, "\uD83D\uDCAC Obs"), /*#__PURE__*/React.createElement("button", {
      onClick: () => imprimirBrowser(ped),
      style: {
        ...S.btn("ghost"),
        flex: 1,
        justifyContent: "center",
        padding: "7px",
        fontSize: 12
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "printer",
      size: 13
    }), " Imprimir Pedido"), /*#__PURE__*/React.createElement("button", {
      onClick: () => excluirPedido(ped.id),
      style: {
        ...S.btn("danger"),
        padding: "7px 9px"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trash",
      size: 13
    })))));
  })), newPedido && /*#__PURE__*/React.createElement(Sheet, {
    onClose: () => setNewPedido(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      marginBottom: 18
    }
  }, "\uD83D\uDE9A Novo Pedido de Entrega"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 6
    }
  }, "Importar de uma Venda (opcional)"), /*#__PURE__*/React.createElement("select", {
    style: S.input,
    value: nForm.vendaId,
    onChange: e => {
      const v = sales.find(s => s.id === e.target.value);
      if (v) {
        const cli = customers.find(c => c.name === v.customer);
        const end = cli ? [cli.rua && cli.rua + (cli.numero ? ", " + cli.numero : ""), cli.bairro, cli.cidade && cli.cidade + (cli.uf ? " - " + cli.uf : ""), cli.cep && "CEP: " + cli.cep].filter(Boolean).join(" · ") : "";
        setNForm(f => ({
          ...f,
          vendaId: e.target.value,
          cliente: v.customer,
          telefone: (cli === null || cli === void 0 ? void 0 : cli.phone) || "",
          endereco: end
        }));
      } else setNF("vendaId", "");
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Selecionar venda \u2014"), sales.slice(0, 50).map(s => /*#__PURE__*/React.createElement("option", {
    key: s.id,
    value: s.id
  }, s.date, " \xB7 ", s.customer, " \xB7 ", fmt(s.total))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Cliente *"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "Nome do cliente",
    value: nForm.cliente,
    onChange: e => setNF("cliente", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Telefone"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    type: "tel",
    placeholder: "(00) 90000-0000",
    value: nForm.telefone,
    onChange: e => setNF("telefone", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Endere\xE7o"), /*#__PURE__*/React.createElement("textarea", {
    value: nForm.endereco,
    onChange: e => setNF("endereco", e.target.value),
    placeholder: "Rua, n\xFAmero, bairro, cidade...",
    style: {
      ...S.input,
      height: 68,
      resize: "none",
      verticalAlign: "top",
      fontSize: 13,
      lineHeight: 1.4
    }
  }), enderecoDoCliente && !nForm.endereco && /*#__PURE__*/React.createElement("button", {
    onClick: () => setNF("endereco", enderecoDoCliente),
    style: {
      ...S.btn("ghost"),
      width: "100%",
      justifyContent: "center",
      marginTop: 5,
      fontSize: 12,
      padding: "7px"
    }
  }, "\uD83D\uDCCD Usar endere\xE7o do cadastro")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Observa\xE7\xF5es"), /*#__PURE__*/React.createElement("textarea", {
    value: nForm.obs,
    onChange: e => setNF("obs", e.target.value),
    placeholder: "Ex: Ligar antes, port\xE3o azul...",
    style: {
      ...S.input,
      height: 60,
      resize: "none",
      verticalAlign: "top",
      fontSize: 13,
      lineHeight: 1.4
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: () => {
      setNewPedido(false);
      setNForm({
        cliente: "",
        telefone: "",
        endereco: "",
        obs: "",
        vendaId: ""
      });
    }
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: () => {
      if (!nForm.cliente.trim()) {
        notify("Informe o cliente!", "error");
        return;
      }
      criarPedido({
        ...nForm
      });
      setNForm({
        cliente: "",
        telefone: "",
        endereco: "",
        obs: "",
        vendaId: ""
      });
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "truck",
    size: 14
  }), " Criar Pedido"))));
}

// ── BACKUP LIST ────────────────────────────────────────────────────────────────
function BackupList({
  S,
  notify
}) {
  const [backups, setBackups] = useState([]);
  useState(() => {
    fetch('/api/backups').then(r => r.json()).then(d => setBackups(d)).catch(() => setBackups([]));
  });
  const restore = name => {
    if (!window.confirm('Restaurar "' + name + '"? Estado atual será salvo antes.')) return;
    fetch('/api/restore/' + encodeURIComponent(name), {
      method: 'POST'
    }).then(r => r.json()).then(d => {
      if (d.ok) {
        notify('Restaurado! Recarregando...', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else notify('Erro: ' + (d.error || 'falha'), 'error');
    }).catch(() => notify('Servidor offline', 'error'));
  };
  const download = name => window.open('/api/backup?name=' + encodeURIComponent(name), '_blank');
  if (backups.length === 0) return /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#3a3d50",
      padding: "8px 0"
    }
  }, "Nenhum backup encontrado no servidor.");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 180,
      overflowY: "auto"
    }
  }, backups.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.name,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 0",
      borderBottom: "1px solid #14161e"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: "#e8e9f0"
    }
  }, b.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#5A6080"
    }
  }, new Date(b.date).toLocaleString("pt-BR"), " \xB7 ", Math.round(b.size / 1024), "KB")), /*#__PURE__*/React.createElement("button", {
    onClick: () => download(b.name),
    title: "Baixar",
    style: {
      ...S.btn("ghost"),
      padding: "4px 8px",
      fontSize: 11
    }
  }, "\u2B07\uFE0F"), /*#__PURE__*/React.createElement("button", {
    onClick: () => restore(b.name),
    title: "Restaurar",
    style: {
      ...S.btn("ghost"),
      padding: "4px 8px",
      fontSize: 11,
      color: "#f59e0b"
    }
  }, "\u21A9\uFE0F"))));
}

// ── FORNECEDORES ──────────────────────────────────────────────────────────────
const loadFornecedores = () => load("pdv_fornecedores", []);
const saveFornecedores = v => save("pdv_fornecedores", v);
function FornecedoresPage({
  S,
  notify
}) {
  const [lista, setLista] = useState(() => loadFornecedores());
  const [sheet, setSheet] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState({
    nome: "",
    cnpj: "",
    telefone: "",
    email: "",
    contato: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: "",
    obs: ""
  });
  const setF = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const persist = v => {
    setLista(v);
    saveFornecedores(v);
    syncSave("fornecedores", v);
  };
  const openNew = () => {
    setEditItem(null);
    setForm({
      nome: "",
      cnpj: "",
      telefone: "",
      email: "",
      contato: "",
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      uf: "MG",
      cep: "",
      obs: ""
    });
    setSheet(true);
  };
  const openEdit = f => {
    setEditItem(f);
    setForm({
      ...f
    });
    setSheet(true);
  };
  const saveF = () => {
    if (!form.nome.trim()) {
      notify("Informe o nome!", "error");
      return;
    }
    if (editItem) {
      persist(lista.map(x => x.id === editItem.id ? {
        ...x,
        ...form
      } : x));
      notify("Fornecedor atualizado ✓");
    } else {
      if (lista.find(x => x.nome.toLowerCase() === form.nome.toLowerCase().trim())) {
        notify("Fornecedor já cadastrado!", "warn");
        return;
      }
      persist([{
        id: uid(),
        createdAt: Date.now(),
        ...form
      }, ...lista]);
      notify("Fornecedor cadastrado ✓");
    }
    setSheet(false);
  };
  const buscarCEP = async () => {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) {
      notify("CEP inválido", "warn");
      return;
    }
    try {
      const r = await fetch("https://viacep.com.br/ws/" + cep + "/json/");
      const d = await r.json();
      if (d.erro) {
        notify("CEP não encontrado", "warn");
        return;
      }
      setForm(f => ({
        ...f,
        rua: d.logradouro || "",
        bairro: d.bairro || "",
        cidade: d.localidade || "",
        uf: d.uf || ""
      }));
    } catch (e) {
      notify("Erro ao buscar CEP", "error");
    }
  };
  const filtrados = lista.filter(f => !busca || f.nome.toLowerCase().includes(busca.toLowerCase()) || (f.cnpj || "").includes(busca) || (f.cidade || "").toLowerCase().includes(busca.toLowerCase()));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#5A6080"
    }
  }, lista.length, " fornecedor(es)"), /*#__PURE__*/React.createElement("button", {
    style: S.btn("primary"),
    onClick: openNew
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 14
  }), " Novo Fornecedor")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#5A6080"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 14
  })), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      paddingLeft: 34
    },
    placeholder: "Buscar por nome, CNPJ ou cidade...",
    value: busca,
    onChange: e => setBusca(e.target.value)
  })), filtrados.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      color: "#3a3d50",
      fontSize: 13,
      padding: "40px 0"
    }
  }, "Nenhum fornecedor cadastrado."), filtrados.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.id,
    style: {
      ...S.card,
      marginBottom: 10,
      borderLeft: "3px solid #3b82f6"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      marginBottom: 2
    }
  }, f.nome), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6080",
      display: "flex",
      flexWrap: "wrap",
      gap: 8
    }
  }, f.cnpj && /*#__PURE__*/React.createElement("span", null, "CNPJ: ", f.cnpj), f.telefone && /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCDE ", f.telefone), f.contato && /*#__PURE__*/React.createElement("span", null, "\uD83D\uDC64 ", f.contato)), (f.rua || f.cidade) && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6080",
      marginTop: 3
    }
  }, "\uD83D\uDCCD ", [f.rua && f.rua + (f.numero ? ", " + f.numero : ""), f.bairro, f.cidade && f.cidade + (f.uf ? " - " + f.uf : "")].filter(Boolean).join(" · ")), f.email && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#3b82f6",
      marginTop: 2
    }
  }, "\u2709\uFE0F ", f.email), f.obs && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6080",
      marginTop: 4,
      fontStyle: "italic"
    }
  }, f.obs)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexShrink: 0,
      marginLeft: 8
    }
  }, f.telefone && /*#__PURE__*/React.createElement("a", {
    href: "https://wa.me/55" + f.telefone.replace(/\D/g, ""),
    target: "_blank",
    style: {
      ...S.btn("ghost"),
      padding: "6px 9px",
      color: "#25d366",
      textDecoration: "none"
    }
  }, "\uD83D\uDCAC"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      padding: "6px 9px"
    },
    onClick: () => openEdit(f)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit",
    size: 13
  })), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("danger"),
      padding: "6px 9px"
    },
    onClick: () => persist(lista.filter(x => x.id !== f.id))
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 13
  })))))), sheet && /*#__PURE__*/React.createElement(Sheet, {
    onClose: () => setSheet(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      marginBottom: 16
    }
  }, editItem ? "✏️ Editar Fornecedor" : "🏭 Novo Fornecedor"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Nome / Raz\xE3o Social *"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    value: form.nome,
    onChange: e => setF("nome", e.target.value),
    placeholder: "Ex: Distribuidora ABC Ltda"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "CNPJ"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    value: form.cnpj,
    onChange: e => setF("cnpj", e.target.value),
    placeholder: "00.000.000/0001-00"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Telefone / WhatsApp"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    value: form.telefone,
    onChange: e => setF("telefone", e.target.value),
    placeholder: "(37) 99999-9999"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "E-mail"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    value: form.email,
    onChange: e => setF("email", e.target.value),
    placeholder: "contato@empresa.com"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Contato / Vendedor"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    value: form.contato,
    onChange: e => setF("contato", e.target.value),
    placeholder: "Nome do respons\xE1vel"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 8,
      marginTop: 4,
      color: "#3b82f6"
    }
  }, "Endere\xE7o"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "CEP"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input
    },
    value: form.cep,
    onChange: e => setF("cep", e.target.value),
    placeholder: "35500-000",
    maxLength: 9
  }), /*#__PURE__*/React.createElement("button", {
    onClick: buscarCEP,
    style: {
      ...S.btn("ghost"),
      padding: "10px 12px",
      flexShrink: 0,
      fontSize: 12
    }
  }, "\uD83D\uDD0D")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 80px",
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Rua / Av."), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    value: form.rua,
    onChange: e => setF("rua", e.target.value),
    placeholder: "Rua das Flores"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "N\xBA"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    value: form.numero,
    onChange: e => setF("numero", e.target.value),
    placeholder: "100"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 60px",
      gap: 10,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Bairro"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    value: form.bairro,
    onChange: e => setF("bairro", e.target.value),
    placeholder: "Centro"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Cidade"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    value: form.cidade,
    onChange: e => setF("cidade", e.target.value),
    placeholder: "Divin\xF3polis"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "UF"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    value: form.uf,
    onChange: e => setF("uf", e.target.value),
    placeholder: "MG",
    maxLength: 2
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Observa\xE7\xF5es"), /*#__PURE__*/React.createElement("textarea", {
    style: {
      ...S.input,
      height: 56,
      resize: "none",
      verticalAlign: "top",
      fontSize: 13
    },
    value: form.obs,
    onChange: e => setF("obs", e.target.value),
    placeholder: "Prazo de pagamento, condi\xE7\xF5es, etc."
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: () => setSheet(false)
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: saveF
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14
  }), " Salvar"))), photoModal && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.92)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    },
    onClick: () => setPhotoModal(null)
  }, /*#__PURE__*/React.createElement("img", {
    src: photoModal.photo,
    style: {
      maxWidth: "100%",
      maxHeight: "70vh",
      objectFit: "contain",
      borderRadius: 14
    },
    alt: ""
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      color: "#e8e9f0",
      fontSize: 16,
      fontWeight: 700,
      textAlign: "center"
    }
  }, photoModal.name), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#f59e0b",
      fontSize: 20,
      fontWeight: 800,
      marginTop: 4
    }
  }, fmt(photoModal.priceAtacado || photoModal.price)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#5A6080",
      marginTop: 8
    }
  }, "Toque para fechar")));
}

// ── CATEGORY SHEET ─────────────────────────────────────────────────────────────
function CatSheet({
  S,
  cats,
  onSave,
  onClose
}) {
  // Cada item: { id, name }
  const toItems = arr => arr.map((name, i) => ({
    id: i + "_" + name,
    name
  }));
  const [list, setList] = useState(() => toItems(cats));
  const [newCat, setNewCat] = useState("");
  const inputRef = useRef(null);
  const updateName = (id, name) => setList(l => l.map(x => x.id === id ? {
    ...x,
    name
  } : x));
  const addCat = () => {
    var _inputRef$current3;
    const v = newCat.trim();
    if (!v || list.some(x => x.name.toLowerCase() === v.toLowerCase())) return;
    setList(l => [...l, {
      id: Date.now() + "",
      name: v
    }]);
    setNewCat("");
    (_inputRef$current3 = inputRef.current) === null || _inputRef$current3 === void 0 || _inputRef$current3.focus();
  };
  const removeCat = id => {
    if (list.length <= 1) return;
    setList(l => l.filter(x => x.id !== id));
  };
  const moveUp = idx => {
    if (idx === 0) return;
    const l = [...list];
    [l[idx - 1], l[idx]] = [l[idx], l[idx - 1]];
    setList(l);
  };
  const moveDown = idx => {
    if (idx === list.length - 1) return;
    const l = [...list];
    [l[idx], l[idx + 1]] = [l[idx + 1], l[idx]];
    setList(l);
  };
  const resetDefault = () => setList(toItems(DEFAULT_CATS));
  const handleSave = () => {
    const names = list.map(x => x.name.trim()).filter(Boolean);
    onSave(names);
    onClose();
  };
  return /*#__PURE__*/React.createElement(Sheet, {
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      marginBottom: 4
    }
  }, "\uD83C\uDFF7\uFE0F Categorias"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#5A6080",
      marginBottom: 16
    }
  }, "Edite o nome direto no campo. Toque + para adicionar."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    style: {
      ...S.input,
      flex: 1
    },
    placeholder: "Nome da nova categoria...",
    value: newCat,
    onChange: e => setNewCat(e.target.value),
    onKeyDown: e => e.key === "Enter" && addCat()
  }), /*#__PURE__*/React.createElement("button", {
    onClick: addCat,
    disabled: !newCat.trim(),
    style: {
      ...S.btn("primary"),
      padding: "10px 14px",
      flexShrink: 0,
      opacity: newCat.trim() ? 1 : 0.4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 15
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      marginBottom: 16,
      maxHeight: "50dvh",
      overflowY: "auto"
    }
  }, list.map((item, idx) => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "#0F1220",
      border: "1px solid #1a1c2e",
      borderRadius: 10,
      padding: "8px 10px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 1,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("button", {
    onMouseDown: e => {
      e.preventDefault();
      moveUp(idx);
    },
    disabled: idx === 0,
    style: {
      background: "none",
      border: "none",
      color: idx === 0 ? "#252845" : "#6a6d80",
      cursor: idx === 0 ? "default" : "pointer",
      padding: "2px 5px",
      fontSize: 11,
      lineHeight: 1
    }
  }, "\u25B2"), /*#__PURE__*/React.createElement("button", {
    onMouseDown: e => {
      e.preventDefault();
      moveDown(idx);
    },
    disabled: idx === list.length - 1,
    style: {
      background: "none",
      border: "none",
      color: idx === list.length - 1 ? "#252845" : "#6a6d80",
      cursor: idx === list.length - 1 ? "default" : "pointer",
      padding: "2px 5px",
      fontSize: 11,
      lineHeight: 1
    }
  }, "\u25BC")), /*#__PURE__*/React.createElement("input", {
    style: {
      flex: 1,
      background: "transparent",
      border: "none",
      outline: "none",
      color: "#e8e9f0",
      fontFamily: "'Sora',sans-serif",
      fontWeight: 600,
      fontSize: 14,
      padding: "2px 0"
    },
    value: item.name,
    onChange: e => updateName(item.id, e.target.value),
    onKeyDown: e => {
      if (e.key === "Enter") e.target.blur();
    }
  }), /*#__PURE__*/React.createElement("button", {
    onMouseDown: e => {
      e.preventDefault();
      removeCat(item.id);
    },
    disabled: list.length <= 1,
    style: {
      ...S.btn("danger"),
      padding: "5px 7px",
      flexShrink: 0,
      opacity: list.length <= 1 ? 0.3 : 1
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 13
  }))))), /*#__PURE__*/React.createElement("button", {
    onClick: resetDefault,
    style: {
      ...S.btn("ghost"),
      width: "100%",
      justifyContent: "center",
      marginBottom: 12,
      fontSize: 12,
      padding: "9px"
    }
  }, "\uD83D\uDD04 Restaurar categorias padr\xE3o (", DEFAULT_CATS.length, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: onClose
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: handleSave
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14
  }), " Salvar ", list.length, " categorias")));
}

// ── MAIN APP ────────────────────────────────────────────────────────────────────
function PDVApp() {
  var _NAV$find;
  const [keyReady, setKeyReady] = useState(!!localStorage.getItem('_sb_key'));
  // Re-verifica a chave a cada vez que o app carrega
  useEffect(() => {
    const k = localStorage.getItem('_sb_key');
    if (!k) setKeyReady(false);
  }, []);
  const [currentUser, setCurrentUser] = useState(() => {
    const u = load("pdv_session", null);
    // Sempre atualiza permissões do admin ao carregar sessão
    if (u && u.role === "admin") return {
      ...u,
      permissions: ADMIN_PERMS
    };
    return u;
  });
  const [page, setPage] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(false);
  const [products, setProducts] = useState(() => load("pdv_products", []));
  const [customers, setCustomers] = useState(() => load("pdv_customers", []));
  const [sales, setSales] = useState(() => load("pdv_sales", []));
  const [pedidos, setPedidos] = useState(() => load("pdv_entregas", []));
  const [fornecedores, setFornecedores] = useState(() => load("pdv_fornecedores", []));
  const [appReady, setAppReady] = useState(false);
  // Todos os hooks acima — return condicional só depois
  if (!keyReady) return /*#__PURE__*/React.createElement(KeySetupScreen, {
    onDone: () => setKeyReady(true)
  });
  const [serverOk, setServerOk] = useState(null);
  const persistP = v => {
    setProducts(v);
    syncSave("products", v);
  };
  const persistC = v => {
    setCustomers(v);
    syncSave("customers", v);
  };
  const persistS = v => {
    setSales(v);
    syncSave("sales", v);
  };
  const persistE = v => {
    setPedidos(v);
    syncSave("entregas", v);
  };
  const persistForn = v => {
    setFornecedores(v);
    syncSave("fornecedores", v);
  };
  const [cart, setCart] = useState([]);
  const [saleCustomer, setSaleCustomer] = useState("Avulso");
  const [salePayment, setSalePayment] = useState("Dinheiro");
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchProd, setSearchProd] = useState("");
  const [searchCust, setSearchCust] = useState("");
  const [filterCat, setFilterCat] = useState("Todos");
  const [prodSheet, setProdSheet] = useState(false);
  const [custSheet, setCustSheet] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [editCust, setEditCust] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [prodSheetPrefill, setProdSheetPrefill] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [filterAvail, setFilterAvail] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [photoModal, setPhotoModal] = useState(null);
  const [editSale, setEditSale] = useState(null); // venda sendo editada no histórico
  const [editSaleForm, setEditSaleForm] = useState({
    customer: "",
    payment: "",
    date: "",
    items: []
  }); // product with photo
  const [cats, setCats] = useState(() => loadCats());
  const [catSheet, setCatSheet] = useState(false);
  const persistCats = v => {
    setCats(v);
    saveCats(v);
    syncSave("categorias", v);
  };
  const notify = (msg, type = "success") => {
    setToast({
      msg,
      type
    });
    setTimeout(() => setToast(null), 2600);
  };

  // ── SYNC: carrega do servidor e polling 8s ───────────────────────────────
  const _syncRef = useRef(false);
  // Carrega dados do Supabase uma vez ao iniciar (sem polling)
  if (!_syncRef.current) {
    _syncRef.current = true;
    syncLoad().then(async data => {
      if (data) {
        if (Array.isArray(data.products)) setProducts(data.products);
        if (Array.isArray(data.customers)) setCustomers(data.customers);
        if (Array.isArray(data.sales)) setSales(data.sales);
        if (Array.isArray(data.entregas)) setPedidos(data.entregas);
        if (Array.isArray(data.fornecedores)) setFornecedores(data.fornecedores);
        if (Array.isArray(data.categorias) && data.categorias.length) setCats(data.categorias);
        setServerOk(true);
      } else {
        setServerOk(false);
      }
      const sbUsers = await loadUsersFromSupabase();
      if (sbUsers && sbUsers.length > 0) setUsers(sbUsers);
      setAppReady(true);
    }).catch(() => {
      setServerOk(false);
      setAppReady(true);
    });
  }
  // Recarrega dados manualmente (botão Atualizar)
  const reloadFromSupabase = async (showNotify = true) => {
    try {
      const data = await syncLoad();
      if (data) {
        if (Array.isArray(data.products)) setProducts(data.products);
        if (Array.isArray(data.customers)) setCustomers(data.customers);
        if (Array.isArray(data.sales)) setSales(data.sales);
        if (Array.isArray(data.entregas)) setPedidos(data.entregas);
        if (Array.isArray(data.fornecedores)) setFornecedores(data.fornecedores);
        if (Array.isArray(data.categorias) && data.categorias.length) setCats(data.categorias);
        setServerOk(true);
        if (showNotify) notify('Dados atualizados! ✓');
        return true;
      }
    } catch (e) {
      console.warn('reload error', e);
    }
    return false;
  };
  const saveProduct = form => {
    if (!form.name || !form.price || form.stock === "") {
      notify("Preencha todos os campos!", "error");
      return;
    }
    const item = {
      name: form.name.trim(),
      category: form.category,
      price: +form.price,
      priceAtacado: form.priceAtacado ? +form.priceAtacado : 0,
      costPrice: form.costPrice ? +form.costPrice : 0,
      comissaoProd: form.comissaoProd ? +form.comissaoProd : 0,
      atacadoHabilitado: form.atacadoHabilitado || false,
      stock: +form.stock,
      minStock: form.minStock ? +form.minStock : 0,
      unit: form.unit || "unid",
      barcode: form.barcode || "",
      photo: form.photo || "",
      description: form.description || ""
    };
    if (editProd) {
      persistP(products.map(x => x.id === editProd.id ? {
        ...x,
        ...item
      } : x));
      notify("Produto atualizado! ✓");
    } else {
      if (products.find(p => p.name.toLowerCase() === item.name.toLowerCase())) {
        notify('"' + item.name + '" já existe!', "warn");
        return;
      }
      persistP([{
        id: uid(),
        ...item,
        createdAt: Date.now()
      }, ...products]);
      notify("Produto cadastrado! ✓");
    }
    setEditProd(null);
    setProdSheetPrefill("");
    setProdSheet(false);
  };
  const saveCustomer = form => {
    if (!form.name) {
      notify("Informe o nome!", "error");
      return;
    }
    const base = {
      name: form.name,
      email: form.email || "",
      phone: form.phone || "",
      cpf: form.cpf || "",
      rua: form.rua || "",
      numero: form.numero || "",
      complemento: form.complemento || "",
      bairro: form.bairro || "",
      cidade: form.cidade || "",
      uf: form.uf || "",
      cep: form.cep || ""
    };
    if (editCust) {
      persistC(customers.map(x => x.id === editCust.id ? {
        ...x,
        ...base
      } : x));
      notify("Cliente atualizado! ✓");
    } else {
      persistC([{
        id: uid(),
        ...base,
        purchases: 0,
        totalSpent: 0,
        lastVisit: todayStr(),
        createdAt: Date.now()
      }, ...customers]);
      notify("Cliente cadastrado! ✓");
    }
    setEditCust(null);
    setCustSheet(false);
  };
  const updateProduct = (prodId, changes) => persistP(products.map(p => p.id === prodId ? {
    ...p,
    ...changes
  } : p));
  const addToCart = p => {
    if (p.stock <= 0) {
      notify("Produto sem estoque!", "error");
      return;
    }
    setCart(c => {
      const ex = c.find(i => i.id === p.id);
      if (ex) {
        if (ex.qty >= p.stock) {
          notify("Estoque insuficiente!", "error");
          return c;
        }
        return c.map(i => i.id === p.id ? {
          ...i,
          qty: i.qty + 1
        } : i);
      }
      return [...c, {
        ...p,
        qty: 1
      }];
    });
    notify(p.name + " ✓", "info");
  };
  const rmCart = id => {
    if (id === "__all__") setCart([]);else setCart(c => c.filter(i => i.id !== id));
  };
  const chgQty = (id, d, override) => setCart(c => c.map(i => {
    if (i.id !== id) return i;
    if (override) return {
      ...i,
      name: override.name || i.name,
      price: override.price != null ? override.price : i.price,
      qty: Math.max(0.001, override.qty != null ? override.qty : i.qty + d)
    };
    return {
      ...i,
      qty: Math.max(1, i.qty + d)
    };
  }));
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const doFinalizeSale = (criarEntrega = false, enderecoEntrega = "", nomeEntrega = "", obsEntrega = "") => {
    if (cart.length === 0) {
      notify("Carrinho vazio!", "error");
      return;
    }
    const saleId = uid();
    const nomeCliente = nomeEntrega || saleCustomer;
    const newSale = {
      id: saleId,
      customer: nomeCliente,
      items: cart.map(i => ({
        name: i.name,
        qty: i.qty,
        price: i.price
      })),
      total: cartTotal,
      payment: salePayment,
      date: todayStr(),
      time: nowTime(),
      createdAt: Date.now()
    };
    persistS([newSale, ...sales]);
    persistP(products.map(prod => {
      const ci = cart.find(i => i.id === prod.id);
      return ci ? {
        ...prod,
        stock: Math.max(0, prod.stock - ci.qty)
      } : prod;
    }));
    if (saleCustomer !== "Avulso") persistC(customers.map(c => c.name === saleCustomer ? {
      ...c,
      purchases: c.purchases + 1,
      totalSpent: c.totalSpent + cartTotal,
      lastVisit: todayStr()
    } : c));
    if (criarEntrega) {
      const cliObj = customers.find(c => c.name === saleCustomer);
      const peds = load("pdv_entregas", []);
      const novoPedido = {
        id: uid(),
        numero: "PED-" + String(peds.length + 1).padStart(4, "0"),
        cliente: nomeEntrega || saleCustomer,
        telefone: (cliObj === null || cliObj === void 0 ? void 0 : cliObj.phone) || "",
        endereco: enderecoEntrega || "",
        itens: cart.map(i => ({
          name: i.name,
          qty: i.qty,
          price: i.price
        })),
        total: cartTotal,
        obs: obsEntrega || "",
        status: "pedido",
        isPrazo: salePayment === "A Prazo",
        criadoEm: Date.now(),
        criadoData: todayStr(),
        criadoHora: nowTime(),
        vendaId: saleId
      };
      save("pdv_entregas", [novoPedido, ...peds]);
      notify("Venda finalizada + Entrega criada! 🚚");
    } else notify("Venda de " + fmt(cartTotal) + " finalizada! ✓");
    setCart([]);
    setSaleCustomer("Avulso");
    setCartOpen(false);
  };
  const finalizeSale = () => doFinalizeSale(false);
  const finalizeSaleComEntrega = (endereco, nome, obs) => doFinalizeSale(true, endereco, nome, obs);

  // Gera HTML do recibo de venda

  // Converte número para extenso em PT-BR
  const numExtenso = n => {
    if (n === 0) return "zero";
    const u = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    const d = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    const c = ["", "cem", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
    const partes = [];
    let v = Math.round(n * 100);
    const cents = v % 100;
    v = Math.floor(v / 100);
    const milhar = Math.floor(v / 1000);
    const resto = v % 1000;
    const centenas = Math.floor(resto / 100);
    const dezenas = Math.floor(resto % 100 / 10);
    const unidades = resto % 100;
    if (milhar > 0) partes.push(milhar === 1 ? "mil" : numExtenso(milhar) + " mil");
    if (centenas > 0) {
      if (unidades === 0 && dezenas === 0 && centenas === 1) partes.push("cem");else partes.push(c[centenas]);
    }
    if (unidades < 20 && unidades > 0) partes.push(u[unidades]);else {
      if (dezenas > 0) partes.push(d[dezenas]);
      if (unidades % 10 > 0) partes.push(u[unidades % 10]);
    }
    let reais = partes.join(" e ") || "zero";
    reais += v === 1 ? " real" : " reais";
    if (cents > 0) reais += " e " + (cents < 20 ? u[cents] : d[Math.floor(cents / 10)] + (cents % 10 > 0 ? " e " + u[cents % 10] : "")) + (cents === 1 ? " centavo" : " centavos");
    return reais;
  };
  const gerarNotaPromissoria = (nome, cpf, endereco, telefone, total, dataEmissao, numRef) => {
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const dt = new Date(dataEmissao + "T12:00");
    const dia = dt.getDate();
    const mes = meses[dt.getMonth()];
    const ano = dt.getFullYear();
    const ext = numExtenso(total);
    return ["<div style='font-family:Arial,sans-serif;max-width:620px;margin:32px auto;border:2px solid #2D3A8C;border-radius:4px;padding:0;page-break-before:always'>",
    // Cabeçalho
    "<div style='background:#2D3A8C;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center'>", "  <div style='display:flex;align-items:center;gap:12px'><img src='" + LOGO_SRC + "' alt='logo' style='height:40px'/>" + "<div><div style='font-size:16px;font-weight:900;letter-spacing:2px'>NOTA PROMISSÓRIA</div>" + "<div style='font-size:10px;opacity:.8'>Pecuarão Gontijo - Depósito & Agropecuária</div></div></div>", "  <div style='text-align:right;font-size:11px'>Nº: " + (numRef || "_______") + "<br>Emissão: " + new Date().toLocaleDateString("pt-BR") + "</div>", "</div>",
    // Valor e vencimento
    "<div style='display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid #ddd'>", "  <div style='padding:14px 20px;border-right:1px solid #ddd'>", "    <div style='font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px'>Valor</div>", "    <div style='font-size:22px;font-weight:900;color:#c0392b'>" + fmt(total) + "</div>", "  </div>", "  <div style='padding:14px 20px'>", "    <div style='font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px'>Vencimento</div>", "    <div style='font-size:16px;font-weight:700'>_____ / _____ / __________</div>", "  </div>", "</div>",
    // Texto legal
    "<div style='padding:18px 20px;font-size:13px;line-height:2;border-bottom:1px solid #ddd'>", "  Aos <u>&nbsp;&nbsp;<b>" + dia + "</b>&nbsp;&nbsp;</u> dias do mês de <u>&nbsp;&nbsp;<b>" + mes + "</b>&nbsp;&nbsp;</u> de <u>&nbsp;&nbsp;<b>" + ano + "</b>&nbsp;&nbsp;</u>,", "  pagarei por esta única via de <strong>NOTA PROMISSÓRIA</strong> a", "  <u><b> PECUARÃO GONTIJO - DEPÓSITO & AGROPECUÁRIA </b></u>, ou à sua ordem,", "  a quantia de:<br>", "  <div style='border:1px dashed #999;border-radius:4px;padding:8px 12px;margin:8px 0;font-style:italic;color:#333;background:#fafafa'><b>" + ext.charAt(0).toUpperCase() + ext.slice(1) + "</b></div>", "  em moeda corrente nacional, com vencimento em _____ / _____ / __________, no endereço:<br>", "  <b>Rua Guarani, 461 - Jardim Candidés - Divinópolis/MG | Tel: (37) 99922-1020</b>", "</div>",
    // Devedor
    "<div style='padding:14px 20px;border-bottom:1px solid #ddd;font-size:12px'>", "  <b>Devedor:</b> " + (nome || "_".repeat(40)) + (cpf ? " &nbsp;|&nbsp; <b>CPF/CNPJ:</b> " + cpf : "") + (telefone ? " &nbsp;|&nbsp; <b>Tel:</b> " + telefone : "") + "<br>", "  <b>Endereço:</b> " + (endereco || "_".repeat(60)), "</div>",
    // Assinaturas
    "<div style='display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:24px 20px'>", "  <div>", "    <div style='border-top:2px solid #333;padding-top:8px;text-align:center;font-size:11px'>", "      Assinatura do Devedor<br><span style='color:#888;font-size:10px'>" + (nome || "") + "</span>", "    </div>", "  </div>", "  <div>", "    <div style='border-top:2px solid #333;padding-top:8px;text-align:center;font-size:11px'>", "      Assinatura do Credor<br><span style='color:#888;font-size:10px'>Pecuarão Gontijo</span>", "    </div>", "  </div>", "</div>", "<div style='background:#f8f8f8;border-top:1px solid #ddd;padding:8px 20px;font-size:9px;color:#aaa;text-align:center'>", "Este título é regido pela Lei nº 7.357/85 e legislação cambial vigente.", "</div>", "</div>"].join("");
  };
  const htmlRecibo = (s, cliente) => {
    const isPrazo = s.payment === "A Prazo";
    const dataStr = s.date || todayStr();
    const itemRows = s.items.map(i => "<tr><td>" + i.name + "</td><td style='text-align:center'>" + i.qty + "</td><td style='text-align:right;font-weight:600'>" + fmt(i.price * i.qty) + "</td></tr>").join("");
    const endCli = cliente ? [cliente.rua && cliente.rua + (cliente.numero ? ", " + cliente.numero : ""), cliente.bairro, cliente.cidade && cliente.cidade + (cliente.uf ? " - " + cliente.uf : "")].filter(Boolean).join(", ") : "";
    const promissoria = isPrazo ? gerarNotaPromissoria((cliente === null || cliente === void 0 ? void 0 : cliente.name) || s.customer, (cliente === null || cliente === void 0 ? void 0 : cliente.cpf) || "", endCli, (cliente === null || cliente === void 0 ? void 0 : cliente.phone) || "", s.total, dataStr, s.id.slice(-6).toUpperCase()) : "";
    const css = "body{font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;color:#111;}table{width:100%;border-collapse:collapse;font-size:13px;}th{background:#f3f4f6;padding:7px 8px;text-align:left;font-size:11px;text-transform:uppercase;}td{padding:7px 8px;border-bottom:1px solid #f3f4f6;}.total{font-size:17px;font-weight:700;text-align:right;margin-top:8px;color:#e74c3c;}@media print{body{max-width:100%;padding:10px}}";
    return "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Recibo</title><style>" + css + "</style></head><body>" + "<div style='background:#2D3A8C;color:#fff;padding:14px;text-align:center;border-radius:8px;margin-bottom:16px'>" + "<img src='" + LOGO_SRC + "' alt='logo' style='height:48px;display:block;margin:0 auto 8px'/>" + "<div style='font-size:16px;font-weight:800;letter-spacing:1px'>RECIBO DE VENDA</div>" + "<div style='font-size:11px;margin-top:4px'>" + s.date + " " + s.time + " · Nº " + s.id.slice(-8).toUpperCase() + "</div></div>" + "<div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px;margin-bottom:14px'>" + "<div style='font-size:11px;color:#888;text-transform:uppercase;margin-bottom:4px'>Cliente</div>" + "<div style='font-weight:700;font-size:14px'>" + ((cliente === null || cliente === void 0 ? void 0 : cliente.name) || s.customer) + "</div>" + (cliente !== null && cliente !== void 0 && cliente.cpf ? "<div style='font-size:12px;color:#666'>CPF/CNPJ: " + cliente.cpf + "</div>" : "") + (cliente !== null && cliente !== void 0 && cliente.phone ? "<div style='font-size:12px;color:#666'>Tel: " + cliente.phone + "</div>" : "") + (endCli ? "<div style='font-size:12px;color:#666'>" + endCli + "</div>" : "") + "</div>" + "<table><thead><tr><th>Produto</th><th>Qtd</th><th>Total</th></tr></thead><tbody>" + itemRows + "</tbody></table>" + "<div class='total'>TOTAL: " + fmt(s.total) + "</div>" + "<div style='display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#666'>" + "<span>Pagamento: <b>" + s.payment + "</b></span>" + (isPrazo ? "<span style='color:#c0392b;font-weight:700'>⚠️ A PRAZO</span>" : "") + "</div>" + "<div style='margin-top:20px;border-top:2px solid #2D3A8C;padding-top:14px;text-align:center'>" + "<div style='font-size:13px;font-weight:700;color:#2D3A8C'>Pecuarão Gontijo</div>" + "<div style='font-size:11px;color:#666'>Rua Guarani, 461 - Jardim Candidés - Divinópolis/MG</div>" + "<div style='font-size:11px;color:#666'>📞 (37) 99922-1020 · CNPJ: 62.321.434/0001-40</div>" + "<div style='font-size:12px;margin-top:8px;color:#E8682A;font-style:italic'>Obrigado pela preferência! 🐾</div>" + "</div>" + promissoria + "</body></html>";
  };
  const imprimirRecibo = s => {
    const cliente = customers.find(c => c.name === s.customer);
    const html = htmlRecibo(s, cliente);
    const w = window.open("", "_blank", "width=500,height=750");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => {
        try {
          w.print();
        } catch (_) {}
      }, 600);
    } else notify("Permita pop-ups para imprimir.", "warn");
  };
  const compartilharRecibo = s => {
    const cliente = customers.find(c => c.name === s.customer);
    const isPrazo = s.payment === "A Prazo";
    const linhas = ["🧾 *RECIBO DE VENDA*", "📅 " + s.date + " " + s.time, "", "👤 *Cliente:* " + ((cliente === null || cliente === void 0 ? void 0 : cliente.name) || s.customer), cliente !== null && cliente !== void 0 && cliente.cpf ? "📋 CPF/CNPJ: " + cliente.cpf : "", "", "*Itens:*", ...s.items.map(i => "• " + i.qty + "× " + i.name + " — " + fmt(i.price * i.qty)), "", "💰 *TOTAL: " + fmt(s.total) + "*", "💳 Pagamento: " + s.payment, isPrazo ? "⚠️ *Venda a prazo — aguardando pagamento*" : "", "", "Obrigado pela preferência! 🙏"].filter(v => v !== null && v !== undefined && v !== "");
    const texto = linhas.join("\n");
    if (navigator.share) {
      navigator.share({
        title: "Recibo de Venda",
        text: texto
      }).catch(() => {});
    } else {
      // Tenta abrir WhatsApp
      const tel = cliente !== null && cliente !== void 0 && cliente.phone ? cliente.phone.replace(/\D/g, "") : "";
      if (tel) {
        window.open("https://wa.me/55" + tel + "?text=" + encodeURIComponent(texto), "_blank");
      } else {
        var _navigator$clipboard;
        (_navigator$clipboard = navigator.clipboard) === null || _navigator$clipboard === void 0 || _navigator$clipboard.writeText(texto).then(() => notify("Texto copiado!")).catch(() => notify("Copie o texto manualmente", "warn"));
      }
    }
  };
  const exportPDF = async () => {
    if (sales.length === 0) {
      notify("Nenhuma venda.", "warn");
      return;
    }
    notify("Gerando PDF...", "info");
    try {
      for (const src of ["https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js"]) {
        if (!document.querySelector('script[src="' + src + '"]')) await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = src;
          s.onload = res;
          s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      const {
        jsPDF
      } = window.jspdf;
      const d = new jsPDF();
      d.setFontSize(18);
      d.setTextColor(255, 107, 53);
      d.text("PDV Pro — Relatório de Vendas", 14, 22);
      d.setFontSize(10);
      d.setTextColor(120);
      d.text("Gerado: " + new Date().toLocaleString("pt-BR") + " · Total: " + fmt(sales.reduce((s, v) => s + v.total, 0)), 14, 30);
      d.autoTable({
        startY: 36,
        head: [["Cliente", "Itens", "Total", "Pagamento", "Data"]],
        body: sales.map(s => [s.customer, s.items.map(i => i.qty + "× " + i.name).join(", "), fmt(s.total), s.payment, s.date + " " + s.time]),
        theme: "striped",
        headStyles: {
          fillColor: [255, 107, 53]
        },
        styles: {
          fontSize: 9
        }
      });
      d.save("pdv-vendas.pdf");
      notify("PDF exportado! ✓");
    } catch {
      notify("Erro ao gerar PDF.", "error");
    }
  };
  const categories = useMemo(() => ["Todos", ...Array.from(new Set(products.map(p => p.category)))], products);
  const filtProd = useMemo(() => products.filter(p => (filterCat === "Todos" || p.category === filterCat) && p.name.toLowerCase().includes(searchProd.toLowerCase())), [products, filterCat, searchProd]);
  const filtProdSorted = useMemo(() => {
    let list = filtProd.filter(p => {
      if (filterAvail === "instock") return p.stock > 0;
      if (filterAvail === "low") return p.stock > 0 && p.stock < 10;
      if (filterAvail === "out") return p.stock === 0;
      return true;
    });
    if (priceMin !== "") list = list.filter(p => p.price >= +priceMin);
    if (priceMax !== "") list = list.filter(p => p.price <= +priceMax);
    if (searchProd && searchProd.match(/^[0-9]{6,}/)) {
      const byBarcode = products.filter(p => p.barcode && p.barcode.includes(searchProd));
      if (byBarcode.length > 0) list = [...new Map([...byBarcode, ...list].map(p => [p.id, p])).values()];
    }
    return [...list].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "nameZ") return b.name.localeCompare(a.name);
      if (sortBy === "priceAsc") return a.price - b.price;
      if (sortBy === "priceDesc") return b.price - a.price;
      if (sortBy === "stock") return b.stock - a.stock;
      if (sortBy === "stockAsc") return a.stock - b.stock;
      return 0;
    });
  }, [filtProd, filterAvail, priceMin, priceMax, sortBy, searchProd, products]);
  const todaySales = sales.filter(s => s.date === todayStr());
  const todayRev = todaySales.reduce((s, v) => s + v.total, 0);
  const totalRev = sales.reduce((s, v) => s + v.total, 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock < (p.minStock || 10));
  const outStock = products.filter(p => p.stock === 0);
  const listaItems = load("pdv_lista_compras", []);
  const listaPendentes = listaItems.filter(i => i.fase !== "comprado" && i.fase !== "faltou").length;
  const entregasData = load("pdv_entregas", []);
  const entregasAtivas = entregasData.filter(e => e.status !== "concluido").length;
  const perm = k => {
    var _currentUser$permissi;
    return (currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) === "admin" || (currentUser === null || currentUser === void 0 || (_currentUser$permissi = currentUser.permissions) === null || _currentUser$permissi === void 0 ? void 0 : _currentUser$permissi[k]) === true;
  };
  const NAV = [{
    id: "dashboard",
    label: "Dashboard",
    icon: "home",
    perm: true
  }, {
    id: "pdv",
    label: "PDV / Vendas",
    icon: "cart",
    perm: perm("pdv")
  }, {
    id: "atacado",
    label: "Venda Atacado",
    icon: "trending",
    perm: perm("atacado")
  }, {
    id: "entregas",
    label: "Entregas",
    icon: "truck",
    perm: perm("entregas")
  }, {
    id: "lista",
    label: "Lista de Compras",
    icon: "list",
    perm: perm("lista")
  }, {
    id: "importar",
    label: "Importar NF-e",
    icon: "import",
    perm: perm("importar")
  }, {
    id: "estoque",
    label: "Estoque",
    icon: "box",
    perm: perm("estoque")
  }, {
    id: "clientes",
    label: "Clientes",
    icon: "users",
    perm: perm("clientes")
  }, {
    id: "historico",
    label: "Histórico",
    icon: "receipt",
    perm: perm("historico")
  }, {
    id: "usuarios",
    label: "Usuários",
    icon: "users",
    perm: (currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) === "admin"
  }, {
    id: "fornecedores",
    label: "Fornecedores",
    icon: "users",
    perm: perm("fornecedores") || (currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) === "admin"
  }].filter(n => n.perm);
  const goTo = id => {
    setPage(id);
    setSideOpen(false);
  };
  const endFmtC = c => {
    const parts = [];
    if (c.rua) parts.push(c.rua + (c.numero ? ", " + c.numero : ""));
    if (c.complemento) parts.push(c.complemento);
    if (c.bairro) parts.push(c.bairro);
    if (c.cidade) parts.push(c.cidade + (c.uf ? " - " + c.uf : ""));
    if (c.cep) parts.push("CEP: " + c.cep);
    return parts.join(" · ");
  };
  const S = {
    app: {
      display: "flex",
      height: "100dvh",
      fontFamily: "'Sora',sans-serif",
      background: "#0A0C1E",
      color: "#e8e9f0",
      overflow: "hidden"
    },
    main: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      minWidth: 0
    },
    topbar: {
      background: "#0D1024",
      borderBottom: "1px solid #1a1c2e",
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      flexShrink: 0
    },
    content: {
      flex: 1,
      overflowY: "auto",
      overflowX: "hidden",
      padding: "16px 16px 100px"
    },
    card: {
      background: "#0F1220",
      border: "1px solid #1a1c2e",
      borderRadius: 12,
      padding: 16
    },
    statCard: a => ({
      background: "#0F1220",
      border: "1px solid " + a + "22",
      borderRadius: 12,
      padding: 14
    }),
    lbl: {
      fontSize: 11,
      color: "#5A6080",
      textTransform: "uppercase",
      letterSpacing: 1
    },
    badge: c => ({
      display: "inline-flex",
      alignItems: "center",
      padding: "2px 9px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      background: c + "22",
      color: c
    }),
    btn: (v = "primary") => ({
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "10px 16px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontFamily: "'Sora',sans-serif",
      fontWeight: 600,
      fontSize: 13,
      transition: "opacity .15s",
      ...(v === "primary" ? {
        background: "linear-gradient(135deg,#E8682A,#F07030)",
        color: "#fff"
      } : v === "danger" ? {
        background: "#ff3b3b18",
        color: "#ff3b3b"
      } : {
        background: "#1E2245",
        color: "#8a8da0"
      })
    }),
    input: {
      background: "#0A0C1E",
      border: "1px solid #1a1c2e",
      borderRadius: 8,
      padding: "11px 13px",
      color: "#e8e9f0",
      fontFamily: "'Sora',sans-serif",
      fontSize: 14,
      outline: "none",
      width: "100%",
      boxSizing: "border-box"
    }
  };
  if (!currentUser) return /*#__PURE__*/React.createElement(LoginScreen, {
    S: S,
    onLogin: u => {
      setCurrentUser(u);
      save("pdv_session", u);
    }
  });
  if (!appReady) return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      background: "#0A0C1E",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Sora',sans-serif"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: {
      LOGO_SRC
    },
    alt: "Pecuar\xE3o Gontijo",
    style: {
      height: 80,
      objectFit: "contain",
      marginBottom: 16
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#5A6080",
      marginBottom: 28
    }
  }, "Sincronizando dados do servidor..."), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 200,
      height: 3,
      background: "#1E2245",
      borderRadius: 2,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: "45%",
      background: "linear-gradient(90deg,#E8682A,#F07030)",
      borderRadius: 2,
      animation: "slide 1.2s ease infinite"
    }
  })), /*#__PURE__*/React.createElement("style", {
    dangerouslySetInnerHTML: {
      __html: "@keyframes slide{0%{transform:translateX(-200%)}100%{transform:translateX(600%)}}"
    }
  }));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("link", {
    href: "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap",
    rel: "stylesheet"
  }), /*#__PURE__*/React.createElement("div", {
    style: S.app
  }, sideOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "rgba(0,0,0,.70)"
    },
    onClick: () => setSideOpen(false)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 255,
      background: "#0D1024",
      borderRight: "1px solid #1a1c2e",
      display: "flex",
      flexDirection: "column",
      padding: "24px 0",
      zIndex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 18px 20px",
      borderBottom: "1px solid #1a1c2e",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: {
      LOGO_SRC
    },
    alt: "Pecuar\xE3o",
    style: {
      height: 30,
      objectFit: "contain",
      maxWidth: 120
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#3a3d50",
      textTransform: "uppercase",
      letterSpacing: 2,
      marginTop: 3
    }
  }, "Sistema de Vendas")), NAV.map(n => /*#__PURE__*/React.createElement("button", {
    key: n.id,
    onClick: () => goTo(n.id),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "13px 18px",
      cursor: "pointer",
      border: "none",
      background: page === n.id ? "linear-gradient(90deg,rgba(255,107,53,.18),transparent)" : "transparent",
      color: page === n.id ? "#E8682A" : "#6a6d80",
      fontSize: 13,
      fontWeight: page === n.id ? 600 : 400,
      borderLeft: "3px solid " + (page === n.id ? "#E8682A" : "transparent"),
      width: "100%",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: n.icon,
    size: 15
  }), n.label, n.id === "pdv" && cartCount > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.badge("#E8682A"),
      marginLeft: "auto",
      fontSize: 11
    }
  }, cartCount), n.id === "lista" && listaPendentes > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.badge("#f59e0b"),
      marginLeft: "auto",
      fontSize: 11
    }
  }, listaPendentes), n.id === "entregas" && entregasAtivas > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.badge("#3b82f6"),
      marginLeft: "auto",
      fontSize: 11
    }
  }, entregasAtivas))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      padding: "14px 18px",
      borderTop: "1px solid #1a1c2e",
      fontSize: 11,
      color: "#252845",
      lineHeight: 1.7
    }
  }, products.length, " produtos \xB7 ", customers.length, " clientes", /*#__PURE__*/React.createElement("br", null), sales.length, " vendas"))), /*#__PURE__*/React.createElement("div", {
    style: S.main
  }, /*#__PURE__*/React.createElement("div", {
    style: S.topbar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSideOpen(true),
    style: {
      background: "none",
      border: "none",
      color: "#e8e9f0",
      cursor: "pointer",
      padding: 4,
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "menu",
    size: 22
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700
    }
  }, (_NAV$find = NAV.find(n => n.id === page)) === null || _NAV$find === void 0 ? void 0 : _NAV$find.label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 7,
      alignItems: "center"
    }
  }, lowStock.length + outStock.length > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      ...S.badge("#F07030"),
      cursor: "pointer",
      fontSize: 11,
      gap: 4
    },
    onClick: () => goTo("estoque")
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert",
    size: 10,
    color: "#F07030"
  }), lowStock.length + outStock.length), page === "pdv" && /*#__PURE__*/React.createElement("button", {
    onClick: () => setCartOpen(true),
    style: {
      ...S.btn("primary"),
      padding: "7px 13px",
      borderRadius: 20,
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cart",
    size: 13
  }), cartCount > 0 ? cartCount + " · " + fmt(cartTotal) : "Carrinho"), page !== "pdv" && /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.badge("#4A5BC4"),
      fontSize: 11
    }
  }, new Date().toLocaleDateString("pt-BR")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      fontSize: 10,
      padding: "3px 9px",
      borderRadius: 20,
      background: serverOk === true ? "#4ade8018" : serverOk === false ? "#ff3b3b18" : "#f59e0b18",
      border: "1px solid " + (serverOk === true ? "#4ade8040" : serverOk === false ? "#ff3b3b40" : "#f59e0b40"),
      color: serverOk === true ? "#4ade80" : serverOk === false ? "#ff3b3b" : "#f59e0b"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 3,
      background: serverOk === true ? "#4ade80" : serverOk === false ? "#ff3b3b" : "#f59e0b"
    }
  }), serverOk === true ? "Sync" : serverOk === false ? "Offline" : "..."), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCurrentUser(null);
      save("pdv_session", null);
    },
    style: {
      ...S.btn("ghost"),
      padding: "5px 8px",
      fontSize: 11
    },
    title: "Sair"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "logout",
    size: 14
  })))), /*#__PURE__*/React.createElement("div", {
    style: S.content
  }, page === "dashboard" && (products.length === 0 && sales.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "\uD83C\uDFEA",
    title: "Bem-vindo ao PDV Pro!",
    desc: "Importe uma NF-e ou cadastre produtos para come\xE7ar.",
    action: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        justifyContent: "center",
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: S.btn("primary"),
      onClick: () => goTo("importar")
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "import",
      size: 14
    }), " Importar NF-e"), /*#__PURE__*/React.createElement("button", {
      style: S.btn(),
      onClick: () => {
        goTo("estoque");
        setTimeout(() => setProdSheet(true), 80);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 14
    }), " Novo Produto"))
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 14
    }
  }, [{
    label: "Vendas Hoje",
    value: todaySales.length,
    sub: "transações",
    accent: "#E8682A"
  }, {
    label: "Receita Hoje",
    value: fmt(todayRev),
    sub: "faturamento",
    accent: "#4A5BC4"
  }, {
    label: "Receita Total",
    value: fmt(totalRev),
    sub: "acumulado",
    accent: "#a78bfa"
  }, {
    label: "Produtos",
    value: products.length,
    sub: "cadastrados",
    accent: "#4ade80"
  }].map((st, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: S.statCard(st.accent)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, st.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      color: st.accent
    }
  }, st.value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#252845",
      marginTop: 1
    }
  }, st.sub)))), page === "dashboard" && (currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) === "admin" && /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginBottom: 12,
      borderColor: "#a78bfa30"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700
    }
  }, "\uD83D\uDCBE Backup de Dados"), /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      try {
        const r = await fetch('/api/backup', {
          method: 'POST'
        });
        const d = await r.json();
        if (d.ok) notify('Backup criado: ' + d.name + ' ✓');else notify('Erro ao criar backup', 'error');
      } catch (e) {
        // offline — exporta localStorage
        const data = {
          products,
          customers,
          sales
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json'
        });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'pdv-backup-' + todayStr() + '.json';
        a.click();
        notify('Backup exportado localmente ✓');
      }
    },
    style: {
      ...S.btn("primary"),
      padding: "7px 12px",
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "import",
    size: 13
  }), " Fazer Backup")), /*#__PURE__*/React.createElement(BackupList, {
    S: S,
    notify: notify
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginBottom: 12,
      cursor: "pointer",
      padding: "12px 14px"
    },
    onClick: () => goTo("importar")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      marginBottom: 2
    }
  }, "\uD83D\uDCE5 Importar NF-e / Or\xE7amento"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#5A6080"
    }
  }, "PDF, XML, CSV, TXT \u2192 cadastro autom\xE1tico")), /*#__PURE__*/React.createElement(Icon, {
    name: "import",
    size: 15,
    color: "#4A5BC4"
  }))), listaPendentes > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginBottom: 12,
      cursor: "pointer",
      borderLeft: "3px solid #f59e0b"
    },
    onClick: () => goTo("lista")
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      marginBottom: 2
    }
  }, "\uD83D\uDECD\uFE0F Lista de Compras"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#5A6080"
    }
  }, listaPendentes, " item(ns) pendente(s)")), /*#__PURE__*/React.createElement("span", {
    style: S.badge("#f59e0b")
  }, listaPendentes))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700
    }
  }, "\xDAltimas Vendas"), sales.length > 0 && /*#__PURE__*/React.createElement("button", {
    onClick: exportPDF,
    style: {
      ...S.btn("ghost"),
      padding: "6px 10px",
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pdf",
    size: 13
  }), " PDF")), sales.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#3a3d50",
      fontSize: 13
    }
  }, "Nenhuma venda ainda.") : sales.slice(0, 5).map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: "1px solid #14161e",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, s.customer), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6080"
    }
  }, s.time, " \xB7 ", s.payment)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      color: "#4ade80",
      fontSize: 14
    }
  }, fmt(s.total))))), lowStock.length + outStock.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      marginBottom: 10
    }
  }, "\u26A0\uFE0F Alertas de Estoque"), [...outStock, ...lowStock].map(p => /*#__PURE__*/React.createElement("div", {
    key: p.id,
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "7px 0",
      borderBottom: "1px solid #14161e"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, p.name), /*#__PURE__*/React.createElement("span", {
    style: S.badge(p.stock === 0 ? "#ff3b3b" : "#F07030")
  }, p.stock === 0 ? "Esgotado" : p.stock + " unid.")))))), page === "pdv" && (products.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "\uD83D\uDCE6",
    title: "Nenhum produto",
    desc: "Importe uma NF-e ou cadastre produtos.",
    action: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        justifyContent: "center",
        flexWrap: "wrap"
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: S.btn("primary"),
      onClick: () => goTo("importar")
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "import",
      size: 14
    }), " Importar"), /*#__PURE__*/React.createElement("button", {
      style: S.btn(),
      onClick: () => goTo("estoque")
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 14
    }), " Estoque"))
  }) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 8,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#5A6080"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 14
  })), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      paddingLeft: 34,
      paddingRight: 36
    },
    placeholder: "Buscar ou bipar c\xF3digo...",
    value: searchProd,
    onChange: e => setSearchProd(e.target.value)
  }), searchProd ? /*#__PURE__*/React.createElement("button", {
    onClick: () => setSearchProd(""),
    style: {
      position: "absolute",
      right: 8,
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      color: "#5A6080",
      cursor: "pointer",
      fontSize: 18
    }
  }, "\xD7") : /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#5A6080"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "barcode",
    size: 15
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setScannerOpen(true),
    style: {
      ...S.btn("ghost"),
      padding: "10px 12px",
      flexShrink: 0,
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    size: 17,
    color: "#4A5BC4"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowFilters(f => !f),
    style: {
      ...S.btn(showFilters ? "primary" : "ghost"),
      padding: "10px 12px",
      flexShrink: 0,
      borderRadius: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sliders",
    size: 17
  }))), showFilters && /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginBottom: 10,
      padding: 14,
      border: "1px solid #E8682A30"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: "#E8682A",
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 1
    }
  }, "\uD83D\uDD0D Filtros"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Ordenar por"), /*#__PURE__*/React.createElement("select", {
    style: {
      ...S.input,
      fontSize: 12,
      padding: "8px 10px"
    },
    value: sortBy,
    onChange: e => setSortBy(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "name"
  }, "Nome A-Z"), /*#__PURE__*/React.createElement("option", {
    value: "nameZ"
  }, "Nome Z-A"), /*#__PURE__*/React.createElement("option", {
    value: "priceAsc"
  }, "Menor pre\xE7o"), /*#__PURE__*/React.createElement("option", {
    value: "priceDesc"
  }, "Maior pre\xE7o"), /*#__PURE__*/React.createElement("option", {
    value: "stock"
  }, "Mais estoque"), /*#__PURE__*/React.createElement("option", {
    value: "stockAsc"
  }, "Menos estoque"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Disponibilidade"), /*#__PURE__*/React.createElement("select", {
    style: {
      ...S.input,
      fontSize: 12,
      padding: "8px 10px"
    },
    value: filterAvail,
    onChange: e => setFilterAvail(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "Todos"), /*#__PURE__*/React.createElement("option", {
    value: "instock"
  }, "Com estoque"), /*#__PURE__*/React.createElement("option", {
    value: "low"
  }, "Estoque baixo"), /*#__PURE__*/React.createElement("option", {
    value: "out"
  }, "Esgotados")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Faixa de Pre\xE7o"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      fontSize: 12,
      padding: "8px 10px"
    },
    type: "number",
    placeholder: "R$ m\xEDn",
    value: priceMin,
    onChange: e => setPriceMin(e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      fontSize: 12,
      padding: "8px 10px"
    },
    type: "number",
    placeholder: "R$ m\xE1x",
    value: priceMax,
    onChange: e => setPriceMax(e.target.value)
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setSortBy("name");
      setFilterAvail("all");
      setPriceMin("");
      setPriceMax("");
    },
    style: {
      ...S.btn("danger"),
      width: "100%",
      justifyContent: "center",
      padding: "7px",
      fontSize: 12
    }
  }, "Limpar filtros")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      overflowX: "auto",
      marginBottom: 12,
      paddingBottom: 2,
      scrollbarWidth: "none"
    }
  }, categories.map(cat => /*#__PURE__*/React.createElement("button", {
    key: cat,
    onClick: () => setFilterCat(cat),
    style: {
      ...S.btn(filterCat === cat ? "primary" : "ghost"),
      padding: "7px 13px",
      fontSize: 12,
      whiteSpace: "nowrap",
      flexShrink: 0
    }
  }, cat))), filtProdSorted.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "36px 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 40,
      marginBottom: 10
    }
  }, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#666",
      marginBottom: 6
    }
  }, "Nenhum produto encontrado"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#444",
      marginBottom: 20
    }
  }, searchProd ? searchProd + " não está no catálogo." : "Tente outro filtro."), searchProd && /*#__PURE__*/React.createElement("button", {
    style: S.btn("primary"),
    onClick: () => {
      setEditProd(null);
      setProdSheetPrefill(searchProd);
      setProdSheet(true);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 14
  }), " Cadastrar [", searchProd, "]")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(2,1fr)",
      gap: 10
    }
  }, filtProdSorted.map(prod => {
    const inCart = cart.find(i => i.id === prod.id);
    return /*#__PURE__*/React.createElement("div", {
      key: prod.id,
      onClick: () => addToCart(prod),
      style: {
        background: "#0F1220",
        border: "1px solid " + (inCart ? "#E8682A" : "#1E2245"),
        borderRadius: 12,
        overflow: "hidden",
        cursor: prod.stock > 0 ? "pointer" : "not-allowed",
        opacity: prod.stock > 0 ? 1 : .45,
        transition: "border-color .15s",
        position: "relative",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent"
      },
      onTouchStart: e => {
        if (prod.stock > 0) e.currentTarget.style.transform = "scale(.96)";
      },
      onTouchEnd: e => {
        e.currentTarget.style.transform = "none";
      }
    }, prod.photo ? /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        height: 90,
        overflow: "hidden",
        background: "#0a0c14",
        cursor: "zoom-in",
        position: "relative"
      },
      onClick: e => {
        e.stopPropagation();
        setPhotoModal(prod);
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: prod.photo,
      style: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
      },
      alt: ""
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        bottom: 4,
        right: 4,
        background: "rgba(0,0,0,.55)",
        borderRadius: 6,
        padding: "2px 6px",
        fontSize: 10,
        color: "#fff"
      }
    }, "\uD83D\uDD0D Zoom")) : /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        height: 6,
        background: "#0a0c14"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 12
      }
    }, inCart && /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 8,
        right: 8,
        background: "#E8682A",
        color: "#fff",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 800,
        padding: "1px 7px",
        zIndex: 1
      }
    }, inCart.qty), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#5A6080",
        marginBottom: 3
      }
    }, prod.category), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 600,
        marginBottom: 6,
        lineHeight: 1.3,
        paddingRight: inCart ? 28 : 0
      }
    }, prod.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 800,
        color: "#E8682A"
      }
    }, fmt(prod.price)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        marginTop: 3,
        color: prod.stock === 0 ? "#ff3b3b" : prod.stock < 10 ? "#F07030" : "#5A6080"
      }
    }, prod.stock === 0 ? "Esgotado" : prod.stock + " " + (prod.unit || "unid"))));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 80
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 20,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 100,
      width: "calc(100% - 32px)",
      maxWidth: 440
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setCartOpen(true),
    style: {
      ...S.btn("primary"),
      width: "100%",
      padding: "15px",
      fontSize: 15,
      justifyContent: "center",
      borderRadius: 16,
      boxShadow: "0 6px 28px rgba(255,107,53,.4)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cart",
    size: 18
  }), cartCount === 0 ? "Ver Carrinho" : cartCount + " ite" + (cartCount > 1 ? "ns" : "m") + " · " + fmt(cartTotal))), photoModal && /*#__PURE__*/React.createElement("div", {
    onClick: () => setPhotoModal(null),
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 4000,
      background: "rgba(0,0,0,.95)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 20
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: photoModal.photo,
    style: {
      maxWidth: "100%",
      maxHeight: "70vh",
      objectFit: "contain",
      borderRadius: 14,
      boxShadow: "0 8px 48px rgba(0,0,0,.8)"
    },
    alt: ""
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      color: "#e8e9f0",
      fontSize: 16,
      fontWeight: 700,
      textAlign: "center"
    }
  }, photoModal.name), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#E8682A",
      fontSize: 20,
      fontWeight: 800,
      marginTop: 4
    }
  }, fmt(photoModal.price)), photoModal.priceAtacado > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#f59e0b",
      fontSize: 14,
      fontWeight: 700,
      marginTop: 2
    }
  }, "\uD83D\uDCE6 Atacado: ", fmt(photoModal.priceAtacado)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#5A6080",
      marginTop: 2
    }
  }, photoModal.stock, " ", photoModal.unit || "unid", " em estoque"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPhotoModal(null),
    style: {
      marginTop: 22,
      padding: "10px 32px",
      borderRadius: 20,
      border: "none",
      background: "#1E2245",
      color: "#e8e9f0",
      cursor: "pointer",
      fontFamily: "'Sora',sans-serif",
      fontSize: 13,
      fontWeight: 600
    }
  }, "\u2715 Fechar")), scannerOpen && /*#__PURE__*/React.createElement(ScannerBase, {
    S: S,
    title: "Leitor de C\xF3digo",
    subtitle: "Aponte para o c\xF3digo de barras do produto",
    onCode: code => {
      const p = products.find(x => x.barcode && x.barcode.trim() === code.trim());
      if (p) {
        addToCart(p);
        notify(p.name + " ✓", "info");
      } else notify("Código não encontrado: " + code, "warn");
      setScannerOpen(false);
    },
    onClose: () => setScannerOpen(false)
  }))), page === "atacado" && /*#__PURE__*/React.createElement(AtacadoPage, {
    S: S,
    products: products,
    customers: customers,
    persistP: persistP,
    persistS: persistS,
    persistC: persistC,
    persistE: v => {
      syncSave("entregas", v);
    },
    sales: sales,
    notify: notify,
    currentUser: currentUser
  }), page === "entregas" && /*#__PURE__*/React.createElement(EntregasPage, {
    S: S,
    sales: sales,
    customers: customers,
    notify: notify,
    pedidos: pedidos,
    persistE: persistE,
    onReload: reloadFromSupabase
  }), page === "usuarios" && /*#__PURE__*/React.createElement(UsersPage, {
    S: S,
    notify: notify,
    currentUser: currentUser,
    sales: sales,
    persistS: persistS
  }), page === "fornecedores" && /*#__PURE__*/React.createElement(FornecedoresPage, {
    S: S,
    notify: notify
  }), page === "lista" && /*#__PURE__*/React.createElement(ListaComprasPage, {
    S: S,
    notify: notify
  }), page === "importar" && /*#__PURE__*/React.createElement(ImportarPage, {
    S: S,
    products: products,
    persistP: persistP,
    notify: notify
  }), page === "estoque" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginBottom: 12,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#5A6080"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 14
  })), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      paddingLeft: 34
    },
    placeholder: "Buscar...",
    value: searchProd,
    onChange: e => setSearchProd(e.target.value)
  })), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      flexShrink: 0,
      fontSize: 12,
      padding: "9px 12px"
    },
    onClick: () => goTo("importar")
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "import",
    size: 13
  }), " Importar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      flexShrink: 0
    },
    onClick: () => {
      setEditProd(null);
      setProdSheet(true);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 14
  }), " Novo"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      flexShrink: 0,
      fontSize: 12,
      padding: "9px 11px"
    },
    title: "Gerenciar Categorias",
    onClick: () => setCatSheet(true)
  }, "\uD83C\uDFF7\uFE0F")), products.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "\uD83D\uDCE6",
    title: "Nenhum produto",
    desc: "Importe NF-e ou cadastre manualmente.",
    action: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        justifyContent: "center"
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: S.btn("primary"),
      onClick: () => goTo("importar")
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "import",
      size: 14
    }), " Importar"), /*#__PURE__*/React.createElement("button", {
      style: S.btn(),
      onClick: () => {
        setEditProd(null);
        setProdSheet(true);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 14
    }), " Cadastrar"))
  }) : products.filter(p => p.name.toLowerCase().includes(searchProd.toLowerCase())).map(prod => /*#__PURE__*/React.createElement("div", {
    key: prod.id,
    style: {
      ...S.card,
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 8,
      padding: "12px 14px"
    }
  }, prod.photo && /*#__PURE__*/React.createElement("img", {
    src: prod.photo,
    style: {
      width: 40,
      height: 40,
      borderRadius: 8,
      objectFit: "cover",
      flexShrink: 0
    },
    alt: ""
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 2
    }
  }, prod.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6080"
    }
  }, prod.category, prod.barcode ? " · " + prod.barcode : "")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right",
      flexShrink: 0,
      marginRight: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: "#E8682A",
      marginBottom: 3
    }
  }, fmt(prod.price)), /*#__PURE__*/React.createElement("span", {
    style: S.badge(prod.stock === 0 ? "#ff3b3b" : prod.stock < (prod.minStock || 10) ? "#F07030" : "#4ade80")
  }, prod.stock === 0 ? "Esgotado" : prod.stock + " " + (prod.stock < (prod.minStock || 10) ? "⚠️" : "ok"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      padding: "7px 9px"
    },
    onClick: () => {
      setEditProd(prod);
      setProdSheet(true);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit",
    size: 13
  })), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("danger"),
      padding: "7px 9px"
    },
    onClick: () => setDeleteTarget({
      label: prod.name,
      onConfirm: () => {
        persistP(products.filter(x => x.id !== prod.id));
        notify("Produto removido.", "warn");
        setDeleteTarget(null);
      }
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 13
  })))))), page === "clientes" && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginBottom: 12,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#5A6080"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 14
  })), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      paddingLeft: 34
    },
    placeholder: "Buscar cliente...",
    value: searchCust,
    onChange: e => setSearchCust(e.target.value)
  })), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      flexShrink: 0
    },
    onClick: () => {
      setEditCust(null);
      setCustSheet(true);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 14
  }), " Novo")), customers.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "\uD83D\uDC65",
    title: "Nenhum cliente",
    desc: "Cadastre clientes para identificar vendas.",
    action: /*#__PURE__*/React.createElement("button", {
      style: S.btn("primary"),
      onClick: () => {
        setEditCust(null);
        setCustSheet(true);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 14
    }), " Cadastrar")
  }) : customers.filter(c => c.name.toLowerCase().includes(searchCust.toLowerCase())).map(c => /*#__PURE__*/React.createElement("div", {
    key: c.id,
    style: {
      ...S.card,
      marginBottom: 10,
      borderLeft: "3px solid #E8682A"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      marginBottom: 1
    }
  }, c.name), c.cpf && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6080"
    }
  }, "CPF/CNPJ: ", c.cpf)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center",
      flexShrink: 0,
      marginLeft: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.badge(c.purchases > 15 ? "#4ade80" : c.purchases > 5 ? "#4A5BC4" : "#a78bfa")
  }, c.purchases > 15 ? "VIP" : c.purchases > 5 ? "Frequente" : "Novo"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      padding: "5px 7px"
    },
    onClick: () => {
      setEditCust(c);
      setCustSheet(true);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit",
    size: 13
  })), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("danger"),
      padding: "5px 7px"
    },
    onClick: () => setDeleteTarget({
      label: c.name,
      onConfirm: () => {
        persistC(customers.filter(x => x.id !== c.id));
        notify("Cliente removido.", "warn");
        setDeleteTarget(null);
      }
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 13
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "2px 16px",
      marginBottom: 8
    }
  }, c.phone && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#6a6d80"
    }
  }, "\uD83D\uDCDE ", c.phone), c.email && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#6a6d80"
    }
  }, "\u2709\uFE0F ", c.email)), endFmtC(c) && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#0A0C1E",
      border: "1px solid #1a1c2e",
      borderRadius: 8,
      padding: "7px 10px",
      marginBottom: 10,
      fontSize: 12,
      color: "#6a6d80",
      lineHeight: 1.5,
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0
    }
  }, "\uD83D\uDCCD"), /*#__PURE__*/React.createElement("span", null, endFmtC(c))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      flexWrap: "wrap",
      paddingTop: 8,
      borderTop: "1px solid #14161e"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      fontSize: 10
    }
  }, "Compras"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      color: "#E8682A"
    }
  }, c.purchases)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      fontSize: 10
    }
  }, "Total Gasto"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      color: "#4ade80",
      fontSize: 13
    }
  }, fmt(c.totalSpent))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      fontSize: 10
    }
  }, "\xDAltima Visita"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600
    }
  }, new Date(c.lastVisit + "T12:00").toLocaleDateString("pt-BR"))))))), page === "historico" && (sales.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "\uD83E\uDDFE",
    title: "Nenhuma venda",
    desc: "O hist\xF3rico aparece ap\xF3s a primeira venda."
  }) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#5A6080"
    }
  }, sales.length, " venda", sales.length !== 1 ? "s" : "", " \xB7 ", fmt(totalRev)), /*#__PURE__*/React.createElement("button", {
    onClick: exportPDF,
    style: {
      ...S.btn("ghost"),
      padding: "7px 12px",
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pdf",
    size: 14
  }), " PDF")), sales.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.id,
    style: {
      ...S.card,
      marginBottom: 8,
      borderLeft: "3px solid " + (s.payment === "A Prazo" ? "#ef4444" : s.payment.includes("Pix") ? "#4A5BC4" : s.payment.includes("Cartão") ? "#a78bfa" : "#4ade80")
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700
    }
  }, s.customer), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 800,
      color: "#4ade80"
    }
  }, fmt(s.total))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#6a6d80",
      marginBottom: 6,
      lineHeight: 1.4
    }
  }, s.items.map(i => i.qty + "× " + i.name).join(", ")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.badge(s.payment === "A Prazo" ? "#ef4444" : s.payment.includes("Pix") ? "#4A5BC4" : s.payment.includes("Cartão") ? "#a78bfa" : "#4ade80")
  }, s.payment === "A Prazo" ? "⚠️ A Prazo" : s.payment), s.tipo === "atacado" && /*#__PURE__*/React.createElement("span", {
    style: S.badge("#f59e0b")
  }, "\uD83D\uDCE6 Atacado"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#3a3d50",
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 10
  }), new Date(s.date + "T12:00").toLocaleDateString("pt-BR"), " ", s.time)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      borderTop: "1px solid #14161e",
      paddingTop: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => imprimirRecibo(s),
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center",
      padding: "7px",
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "printer",
    size: 12
  }), " ", s.payment === "A Prazo" ? "Recibo + Promissória" : "Recibo"), /*#__PURE__*/React.createElement("button", {
    onClick: () => compartilharRecibo(s),
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center",
      padding: "7px",
      fontSize: 11
    }
  }, "\uD83D\uDCE4 Enviar"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setEditSale(s);
      setEditSaleForm({
        customer: s.customer,
        payment: s.payment,
        date: s.date,
        items: s.items.map(i => ({
          ...i
        }))
      });
    },
    style: {
      ...S.btn("ghost"),
      padding: "7px 9px"
    },
    title: "Editar venda"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit",
    size: 13
  })), perm("excluirVendas") && /*#__PURE__*/React.createElement("button", {
    onClick: () => setDeleteTarget({
      label: "Venda " + s.customer,
      onConfirm: () => {
        persistS(sales.filter(x => x.id !== s.id));
        setDeleteTarget(null);
        notify("Venda removida.", "warn");
      }
    }),
    style: {
      ...S.btn("danger"),
      padding: "7px 9px"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 12
  }))))))))), editSale && /*#__PURE__*/React.createElement(Sheet, {
    onClose: () => setEditSale(null)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      marginBottom: 16
    }
  }, "\u270F\uFE0F Editar Venda"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Cliente"), /*#__PURE__*/React.createElement("select", {
    style: S.input,
    value: editSaleForm.customer,
    onChange: e => setEditSaleForm(f => ({
      ...f,
      customer: e.target.value
    }))
  }, /*#__PURE__*/React.createElement("option", {
    value: "Avulso"
  }, "\u2014 Cliente Avulso \u2014"), customers.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id
  }, c.name)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Forma de Pagamento"), /*#__PURE__*/React.createElement("select", {
    style: S.input,
    value: editSaleForm.payment,
    onChange: e => setEditSaleForm(f => ({
      ...f,
      payment: e.target.value
    }))
  }, ["Dinheiro", "Cartão Débito", "Cartão Crédito", "Pix", "Vale Refeição", "A Prazo"].map(m => /*#__PURE__*/React.createElement("option", {
    key: m
  }, m)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Data"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    type: "date",
    value: editSaleForm.date,
    onChange: e => setEditSaleForm(f => ({
      ...f,
      date: e.target.value
    }))
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#E8682A",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8
    }
  }, "Itens"), editSaleForm.items.map((item, idx) => /*#__PURE__*/React.createElement("div", {
    key: idx,
    style: {
      ...S.card,
      padding: 10,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 6
    }
  }, item.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr auto",
      gap: 8,
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 3,
      fontSize: 9
    }
  }, "Qtd"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      padding: "7px 10px",
      fontSize: 13
    },
    type: "number",
    step: "0.001",
    min: "0",
    value: item.qty,
    onChange: e => setEditSaleForm(f => ({
      ...f,
      items: f.items.map((x, i) => i === idx ? {
        ...x,
        qty: +e.target.value
      } : x)
    }))
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 3,
      fontSize: 9
    }
  }, "Pre\xE7o Unit."), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      padding: "7px 10px",
      fontSize: 13
    },
    type: "number",
    step: "0.01",
    min: "0",
    value: item.price,
    onChange: e => setEditSaleForm(f => ({
      ...f,
      items: f.items.map((x, i) => i === idx ? {
        ...x,
        price: +e.target.value
      } : x)
    }))
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setEditSaleForm(f => ({
      ...f,
      items: f.items.filter((_, i) => i !== idx)
    })),
    style: {
      ...S.btn("danger"),
      padding: "8px 10px"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 12
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#E8682A",
      marginTop: 4,
      textAlign: "right"
    }
  }, "Total: ", fmt(item.qty * item.price)))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 800,
      color: "#4ade80",
      textAlign: "right",
      marginBottom: 16
    }
  }, "Total: ", fmt(editSaleForm.items.reduce((s, i) => s + i.qty * i.price, 0))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: () => setEditSale(null)
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: () => {
      const newTotal = editSaleForm.items.reduce((s, i) => s + i.qty * i.price, 0);
      persistS(sales.map(x => x.id === editSale.id ? {
        ...x,
        customer: editSaleForm.customer,
        payment: editSaleForm.payment,
        date: editSaleForm.date,
        items: editSaleForm.items,
        total: newTotal
      } : x));
      notify("Venda atualizada ✓");
      setEditSale(null);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14
  }), " Salvar"))), prodSheet && /*#__PURE__*/React.createElement(ProductSheet, {
    S: S,
    initial: editProd,
    prefillName: prodSheetPrefill,
    cats: cats,
    onSave: saveProduct,
    onClose: () => {
      setProdSheet(false);
      setEditProd(null);
      setProdSheetPrefill("");
    }
  }), custSheet && /*#__PURE__*/React.createElement(CustomerSheet, {
    S: S,
    initial: editCust,
    onSave: saveCustomer,
    onClose: () => {
      setCustSheet(false);
      setEditCust(null);
    }
  }), cartOpen && /*#__PURE__*/React.createElement(CartDrawer, {
    S: S,
    cart: cart,
    customers: customers,
    products: products,
    onUpdateProduct: updateProduct,
    saleCustomer: saleCustomer,
    setSaleCustomer: setSaleCustomer,
    salePayment: salePayment,
    setSalePayment: setSalePayment,
    chgQty: chgQty,
    rmCart: rmCart,
    cartTotal: cartTotal,
    onFinalize: finalizeSale,
    onFinalizeEntrega: finalizeSaleComEntrega,
    onClose: () => setCartOpen(false)
  }), deleteTarget && /*#__PURE__*/React.createElement(DeleteSheet, {
    S: S,
    label: deleteTarget.label,
    onConfirm: deleteTarget.onConfirm,
    onClose: () => setDeleteTarget(null)
  }), catSheet && /*#__PURE__*/React.createElement(CatSheet, {
    S: S,
    cats: cats,
    onSave: persistCats,
    onClose: () => setCatSheet(false)
  }), /*#__PURE__*/React.createElement(Toast, {
    toast: toast
  }), /*#__PURE__*/React.createElement("style", {
    dangerouslySetInnerHTML: {
      __html: "*{box-sizing:border-box;}::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-track{background:#080a10;}::-webkit-scrollbar-thumb{background:#1a1c2e;border-radius:4px;}@keyframes popIn{from{transform:translateX(-50%) translateY(10px);opacity:0;}to{transform:translateX(-50%) translateY(0);opacity:1;}}@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}select{appearance:none;}input:focus,select:focus,textarea:focus{border-color:#E8682A!important;box-shadow:0 0 0 3px rgba(255,107,53,.1);}input::placeholder,textarea::placeholder{color:#2a2d3a;}button:active{opacity:.75;}"
    }
  })));
}
  // Expõe o app para o index.html
  window.PDVApp = PDVApp;
  console.log("[PDV] App carregado com sucesso");
})();