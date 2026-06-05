/* PDV Pro — atacado.js
   AtacadoPage — vendas no atacado
*/

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

console.log("[PDV] atacado.js carregado");
