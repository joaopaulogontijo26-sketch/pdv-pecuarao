/* PDV Pro — fornecedores.js
   FornecedoresPage + BackupList
*/

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

console.log("[PDV] fornecedores.js carregado");
