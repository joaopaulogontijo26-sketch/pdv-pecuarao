/* PDV Pro — usuarios.js
   UsersPage — gestão de usuários e comissões
*/

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

console.log("[PDV] usuarios.js carregado");
