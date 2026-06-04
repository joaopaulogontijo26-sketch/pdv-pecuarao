/* PDV Pro — app-main.js
   PDVApp — navegação, state global, renders das páginas
*/

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

  // ── SYNC: cache-first + background sync ─────────────────────────────────
  const _syncRef = useRef(false);
  // ── CACHE KEYS ────────────────────────────────────────────────────────────
  const CACHE_KEY = 'pdv_sb_cache';
  const CACHE_TS  = 'pdv_sb_cache_ts';
  const applyData = (data) => {
    if (Array.isArray(data.products))   setProducts(data.products);
    if (Array.isArray(data.customers))  setCustomers(data.customers);
    if (Array.isArray(data.sales))      setSales(data.sales);
    if (Array.isArray(data.entregas))   setPedidos(data.entregas);
    if (Array.isArray(data.fornecedores)) setFornecedores(data.fornecedores);
    if (Array.isArray(data.categorias) && data.categorias.length) setCats(data.categorias);
  };
  if (!_syncRef.current) {
    _syncRef.current = true;
    // 1. Aplica cache instantaneamente (sem esperar rede)
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        applyData(parsed);
        setAppReady(true); // mostra o app imediatamente com dados do cache
      }
    } catch {}
    // 2. Busca dados frescos do Supabase em background
    syncLoad().then(async data => {
      if (data) {
        applyData(data);
        setServerOk(true);
        // Salva no cache para próxima abertura
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
          localStorage.setItem(CACHE_TS, Date.now().toString());
        } catch {}
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
  }, {
    id: "crm",
    label: "CRM & Kanban",
    icon: "kanban",
    perm: (currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) === "admin"
  }, {
    id: "inbox",
    label: "Inbox WhatsApp",
    icon: "inbox",
    perm: (currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) === "admin"
  }, {
    id: "agente",
    label: "Agente IA (Tião)",
    icon: "bot",
    perm: (currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) === "admin"
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
  }), page === "crm" && window.CRMPage && /*#__PURE__*/React.createElement(window.CRMPage, {
    S: S,
    customers: customers,
    notify: notify
  }), page === "inbox" && window.InboxPage && /*#__PURE__*/React.createElement(window.InboxPage, {
    S: S,
    notify: notify
  }), page === "agente" && window.AgentePage && /*#__PURE__*/React.createElement(window.AgentePage, {
    S: S,
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
console.log("[PDV] app-main.js carregado");
