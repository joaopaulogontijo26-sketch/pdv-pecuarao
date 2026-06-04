/* PDV Pro — lista.js
   ListaComprasPage
*/

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

console.log("[PDV] lista.js carregado");
