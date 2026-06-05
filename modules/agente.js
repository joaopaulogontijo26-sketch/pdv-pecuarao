/* PDV Pro — components.js
   Toast, Sheet, EmptyState, DeleteSheet, CatSheet
*/

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

console.log("[PDV] components.js carregado");
