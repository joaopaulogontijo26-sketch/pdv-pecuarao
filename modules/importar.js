/* PDV Pro — pdv.js
   CustomerSearch + CartDrawer — PDV principal
*/

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

console.log("[PDV] pdv.js carregado");
