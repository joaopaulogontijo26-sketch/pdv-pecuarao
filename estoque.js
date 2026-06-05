/* PDV Pro — clientes_sheet.js
   CustomerSheet — formulário de clientes
*/

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

console.log("[PDV] clientes_sheet.js carregado");
