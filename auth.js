/* PDV Pro — auth.js
   KeySetupScreen + LoginScreen
*/

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

console.log("[PDV] auth.js carregado");
