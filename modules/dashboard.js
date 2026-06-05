/* PDV Pro — inbox.js | Inbox WhatsApp */

/* ============================================================
   CRM Module v1.0 — Pecuarão Gontijo
   Módulos: CRM + Kanban | Inbox WhatsApp | Agente IA (n8n)
   Integra com: Supabase · Evolution API · n8n.cloud
   ============================================================ */
// ── CREDENCIAIS ──────────────────────────────────────────────────────────────
                    // ── REACT ALIASES ────────────────────────────────────────────────────────────
    // ── UTILITÁRIOS ──────────────────────────────────────────────────────────────
    const fmtTime = ts => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };
  const fmtDate = ts => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };
  const fmtDateTime = ts => {
    if (!ts) return "";
    return fmtDate(ts) + " " + fmtTime(ts);
  };
    const avatarColor = name => {
    const colors = ["#E8682A","#4A5BC4","#4ade80","#f59e0b","#ec4899","#06b6d4","#8b5cf6"];
    let h = 0;
    for (let i = 0; i < (name||"").length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
    return colors[Math.abs(h) % colors.length];
  };
    // ── SUPABASE HELPERS ─────────────────────────────────────────────────────────
  const sb = {
    async get(table, params = "") {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers: _SB_H() });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    async post(table, body) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST", headers: _SB_H(), body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    async patch(table, match, body) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
        method: "PATCH", headers: _SB_H(), body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    async delete(table, match) {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
        method: "DELETE", headers: _SB_H()
      });
      return r.ok;
    },
    async upsert(table, body, conflict = "id") {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${conflict}`, {
        method: "POST",
        headers: { ..._SB_H(), Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(body)
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    }
  };

  // ── EVOLUTION API HELPERS ────────────────────────────────────────────────────
  const evo = {
    headers: { "Content-Type": "application/json", "apikey": EVO_KEY },
    async sendText(to, text) {
      const r = await fetch(`${EVO_URL}/message/sendText/${EVO_INST}`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ number: phoneNum(to), text })
      });
      return r.json();
    },
    async getChats() {
      const r = await fetch(`${EVO_URL}/chat/findChats/${EVO_INST}`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({})
      });
      if (!r.ok) return [];
      return r.json();
    },
    async getMessages(remoteJid, limit = 30) {
      const r = await fetch(`${EVO_URL}/chat/findMessages/${EVO_INST}`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ where: { key: { remoteJid } }, limit })
      });
      if (!r.ok) return [];
      const d = await r.json();
      return Array.isArray(d?.messages?.records) ? d.messages.records : [];
    }
  };

  // ── N8N API HELPERS ──────────────────────────────────────────────────────────
  const n8nApi = {
    headers: { "Content-Type": "application/json", "X-N8N-API-KEY": N8N_KEY },
    async getWorkflow() {
      const r = await fetch(`${N8N_URL}/api/v1/workflows/${N8N_WF_ID}`, { headers: this.headers });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    async activateWorkflow(active) {
      const r = await fetch(`${N8N_URL}/api/v1/workflows/${N8N_WF_ID}/${active ? "activate" : "deactivate"}`, {
        method: "POST", headers: this.headers
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    async updateWorkflow(data) {
      const r = await fetch(`${N8N_URL}/api/v1/workflows/${N8N_WF_ID}`, {
        method: "PUT", headers: this.headers, body: JSON.stringify(data)
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    },
    async getExecutions(limit = 20) {
      const r = await fetch(`${N8N_URL}/api/v1/executions?workflowId=${N8N_WF_ID}&limit=${limit}`, {
        headers: this.headers
      });
      if (!r.ok) return [];
      const d = await r.json();
      return d?.data || [];
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // COMPONENTES COMPARTILHADOS
  // ════════════════════════════════════════════════════════════════════════════

  function Avatar({ name, size = 36 }) {
    const bg = avatarColor(name);
    return React.createElement("div", {
      style: {
        width: size, height: size, borderRadius: "50%", background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.36, fontWeight: 700, color: "#fff", flexShrink: 0,
        fontFamily: "'Sora',sans-serif"
      }
    }, initials(name));
  }

  function Badge({ children, color = "#E8682A", bg }) {
    return React.createElement("span", {
      style: {
        display: "inline-flex", alignItems: "center", gap: 3,
        padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
        background: bg || color + "22", color, border: `1px solid ${color}44`,
        whiteSpace: "nowrap"
      }
    }, children);
  }

  function CrmBtn({ onClick, children, variant = "primary", style: extra = {}, disabled }) {
    const base = {
      display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
      borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      border: "none", transition: "opacity .15s", fontFamily: "'Sora',sans-serif",
      opacity: disabled ? 0.5 : 1, ...extra
    };
    const variants = {
      primary: { background: "#E8682A", color: "#fff" },
      secondary: { background: "#1a1c2e", color: "#e8e9f0", border: "1px solid #252845" },
      ghost: { background: "transparent", color: "#6a6d80", border: "1px solid #1a1c2e" },
      danger: { background: "#ff3b3b22", color: "#ff3b3b", border: "1px solid #ff3b3b44" },
      success: { background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044" }
    };
    return React.createElement("button", {
      onClick, disabled, style: { ...base, ...variants[variant] }
    }, children);
  }

  function CrmInput({ label, value, onChange, placeholder, type = "text", multiline, style: extra }) {
    const inputStyle = {
      width: "100%", background: "#0D1024", border: "1px solid #1e2232", borderRadius: 10,
      padding: "10px 12px", color: "#e8e9f0", fontSize: 13, fontFamily: "'Sora',sans-serif",
      outline: "none", resize: "vertical", ...extra
    };
    return React.createElement("div", { style: { marginBottom: 12 } },
      label && React.createElement("div", {
        style: { fontSize: 11, fontWeight: 600, color: "#6a6d80", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.8 }
      }, label),
      multiline
        ? React.createElement("textarea", { rows: 3, style: inputStyle, value, onChange, placeholder })
        : React.createElement("input", { type, style: inputStyle, value, onChange, placeholder })
    );
  }

  function Spinner({ size = 18 }) {
    return React.createElement("div", {
      style: {
        width: size, height: size, border: "2px solid #1e2232",
        borderTop: "2px solid #E8682A", borderRadius: "50%",
        animation: "spin .7s linear infinite", flexShrink: 0
      }
    });
  }

  function SectionHeader({ title, subtitle, action }) {
    return React.createElement("div", {
      style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }
    },
      React.createElement("div", null,
        React.createElement("div", { style: { fontSize: 17, fontWeight: 800, color: "#e8e9f0" } }, title),
        subtitle && React.createElement("div", { style: { fontSize: 12, color: "#6a6d80", marginTop: 2 } }, subtitle)
      ),
      action
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ABA 1 — CRM + KANBAN
  // ════════════════════════════════════════════════════════════════════════════

  const DEFAULT_KANBAN_COLS = [
    { id: "novo",       label: "Novo Lead",       color: "#4A5BC4" },
    { id: "contato",    label: "Contato Feito",   color: "#E8682A" },
    { id: "proposta",   label: "Proposta Enviada",color: "#f59e0b" },
    { id: "aguardando", label: "Aguardando",       color: "#06b6d4" },
    { id: "ganho",      label: "Ganho ✓",          color: "#4ade80" },
    { id: "perdido",    label: "Perdido ✗",        color: "#ff3b3b" }
  ];

  
  // ════════════════════════════════════════════════════════════════════════════
  // ABA 2 — INBOX WHATSAPP
  // ════════════════════════════════════════════════════════════════════════════

  function InboxPage({ S, notify }) {
    const [chats, setChats]       = useState([]);
    const [selChat, setSelChat]   = useState(null);
    const [msgs, setMsgs]         = useState([]);
    const [text, setText]         = useState("");
    const [sending, setSending]   = useState(false);
    const [loading, setLoading]   = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [humanChats, setHumanChats]   = useState(() => {
      try { return JSON.parse(localStorage.getItem("inbox_human") || "[]"); } catch { return []; }
    });
    const msgEndRef = useRef(null);
    const pollRef   = useRef(null);

    const loadChats = useCallback(async () => {
      setLoading(true);
      try {
        const data = await evo.getChats();
        const list = Array.isArray(data) ? data : (data?.chats || []);
        const filtered = list
          .filter(c => c.id?.endsWith("@s.whatsapp.net"))
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
          .slice(0, 50);
        setChats(filtered);
      } catch (e) {
        notify("Erro ao carregar chats: " + e.message, "error");
      }
      setLoading(false);
    }, []);

    const loadMessages = useCallback(async (chat) => {
      setLoadingMsgs(true);
      setMsgs([]);
      try {
        const data = await evo.getMessages(chat.id, 40);
        const sorted = data.sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0));
        setMsgs(sorted);
        setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } catch (e) {
        notify("Erro ao carregar mensagens", "warn");
      }
      setLoadingMsgs(false);
    }, []);

    useEffect(() => { loadChats(); }, []);

    useEffect(() => {
      if (!selChat) return;
      loadMessages(selChat);
      pollRef.current = setInterval(() => loadMessages(selChat), 8000);
      return () => clearInterval(pollRef.current);
    }, [selChat]);

    const sendMsg = async () => {
      if (!text.trim() || !selChat || sending) return;
      const t = text.trim();
      setText("");
      setSending(true);
      // Adiciona mensagem localmente
      const tmpMsg = {
        key: { fromMe: true, id: uid() },
        message: { conversation: t },
        messageTimestamp: Math.floor(Date.now() / 1000)
      };
      setMsgs(prev => [...prev, tmpMsg]);
      setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      try {
        await evo.sendText(selChat.id.replace("@s.whatsapp.net", ""), t);
        // Salva log no Supabase
        try {
          await sb.post("inbox_logs", {
            id: uid(),
            remote_jid: selChat.id,
            nome: selChat.pushName || selChat.id,
            mensagem: t,
            direcao: "enviada",
            atendente: "humano",
            created_at: new Date().toISOString()
          });
        } catch {}
      } catch (e) {
        notify("Erro ao enviar mensagem", "error");
      }
      setSending(false);
    };

    const toggleHuman = (chatId) => {
      const updated = humanChats.includes(chatId)
        ? humanChats.filter(id => id !== chatId)
        : [...humanChats, chatId];
      setHumanChats(updated);
      localStorage.setItem("inbox_human", JSON.stringify(updated));
      notify(humanChats.includes(chatId) ? "Tião assumiu o atendimento" : "Você assumiu o atendimento ✓");
    };

    const isHuman = chatId => humanChats.includes(chatId);

    const getMsgText = msg => {
      const m = msg.message;
      if (!m) return "[mensagem]";
      return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || "[mídia]";
    };

    // ── Chat List ────────────────────────────────────────────────────────────
    if (!selChat) return React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", padding: "16px 16px 80px", overflow: "auto" } },
      React.createElement(SectionHeader, {
        title: "Inbox WhatsApp",
        subtitle: loading ? "Carregando..." : `${chats.length} conversas`,
        action: React.createElement(CrmBtn, { variant: "ghost", onClick: loadChats, style: { padding: "6px 10px" } }, "🔄")
      }),
      loading
        ? React.createElement("div", { style: { display: "flex", justifyContent: "center", paddingTop: 48 } }, React.createElement(Spinner, { size: 32 }))
        : chats.length === 0
          ? React.createElement("div", { style: { textAlign: "center", padding: 48, color: "#6a6d80" } }, "📭 Nenhuma conversa encontrada")
          : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } },
            chats.map(chat => {
              const human = isHuman(chat.id);
              return React.createElement("div", {
                key: chat.id,
                onClick: () => setSelChat(chat),
                style: {
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  background: "#0F1220", borderRadius: 12, border: "1px solid #1e2232",
                  cursor: "pointer", borderLeft: `3px solid ${human ? "#4ade80" : "#E8682A"}`
                }
              },
                React.createElement(Avatar, { name: chat.pushName || chat.id, size: 42 }),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                  React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#e8e9f0" } }, chat.pushName || chat.id.replace("@s.whatsapp.net", "")),
                  React.createElement("div", { style: { fontSize: 12, color: "#6a6d80", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
                    chat.lastMessage?.message?.conversation || "..."
                  )
                ),
                React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 } },
                  React.createElement("div", { style: { fontSize: 10, color: "#6a6d80" } }, fmtTime((chat.updatedAt || 0) * 1000)),
                  React.createElement(Badge, { color: human ? "#4ade80" : "#E8682A" }, human ? "Humano" : "Tião")
                )
              );
            })
          )
    );

    // ── Chat Detail / Conversa ───────────────────────────────────────────────
    const chatName = selChat.pushName || selChat.id.replace("@s.whatsapp.net", "");
    const human = isHuman(selChat.id);

    return React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" } },
      // Header
      React.createElement("div", {
        style: {
          display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
          background: "#0D1024", borderBottom: "1px solid #1e2232"
        }
      },
        React.createElement("button", {
          onClick: () => setSelChat(null),
          style: { background: "none", border: "none", color: "#6a6d80", cursor: "pointer", fontSize: 20, padding: "0 4px" }
        }, "←"),
        React.createElement(Avatar, { name: chatName, size: 36 }),
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { style: { fontSize: 14, fontWeight: 700 } }, chatName),
          React.createElement("div", { style: { fontSize: 11, color: "#6a6d80" } }, selChat.id.replace("@s.whatsapp.net", ""))
        ),
        React.createElement(CrmBtn, {
          variant: human ? "success" : "secondary",
          onClick: () => toggleHuman(selChat.id),
          style: { padding: "6px 10px", fontSize: 11 }
        }, human ? "🙋 Você" : "🤖 Tião")
      ),
      // Aviso quando humano assumiu
      human && React.createElement("div", {
        style: { background: "#4ade8011", borderBottom: "1px solid #4ade8033", padding: "6px 16px", fontSize: 11, color: "#4ade80", textAlign: "center" }
      }, "✋ Você assumiu este atendimento — Tião está pausado para este contato"),
      // Mensagens
      React.createElement("div", { style: { flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 } },
        loadingMsgs
          ? React.createElement("div", { style: { display: "flex", justifyContent: "center", paddingTop: 48 } }, React.createElement(Spinner, { size: 24 }))
          : msgs.map((msg, i) => {
            const fromMe = msg.key?.fromMe;
            const t = getMsgText(msg);
            const ts = msg.messageTimestamp ? new Date(msg.messageTimestamp * 1000) : null;
            return React.createElement("div", {
              key: msg.key?.id || i,
              style: { display: "flex", justifyContent: fromMe ? "flex-end" : "flex-start" }
            },
              React.createElement("div", {
                style: {
                  maxWidth: "75%", padding: "8px 12px", borderRadius: fromMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: fromMe ? "#E8682A" : "#0F1220",
                  border: fromMe ? "none" : "1px solid #1e2232",
                  fontSize: 13, color: "#e8e9f0", lineHeight: 1.4
                }
              },
                React.createElement("div", null, t),
                ts && React.createElement("div", { style: { fontSize: 10, color: fromMe ? "rgba(255,255,255,.6)" : "#6a6d80", marginTop: 3, textAlign: "right" } },
                  fmtTime(ts)
                )
              )
            );
          }),
        React.createElement("div", { ref: msgEndRef })
      ),
      // Input
      React.createElement("div", {
        style: { padding: "10px 16px", background: "#0D1024", borderTop: "1px solid #1e2232", display: "flex", gap: 8, alignItems: "flex-end" }
      },
        React.createElement("textarea", {
          value: text,
          onChange: e => setText(e.target.value),
          onKeyDown: e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } },
          placeholder: "Digite uma mensagem...",
          rows: 1,
          style: {
            flex: 1, background: "#0F1220", border: "1px solid #1e2232", borderRadius: 12,
            padding: "10px 12px", color: "#e8e9f0", fontSize: 13, resize: "none",
            fontFamily: "'Sora',sans-serif", maxHeight: 100
          }
        }),
        React.createElement("button", {
          onClick: sendMsg,
          disabled: !text.trim() || sending,
          style: {
            width: 40, height: 40, borderRadius: "50%", background: text.trim() ? "#E8682A" : "#1e2232",
            border: "none", cursor: text.trim() ? "pointer" : "default", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .15s"
          }
        },
          sending ? React.createElement(Spinner, { size: 16 }) : React.createElement("svg", {
            width: 18, height: 18, viewBox: "0 0 24 24", fill: "none",
            stroke: "#fff", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round"
          }, React.createElement("path", { d: "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z" }))
        )
      )
    );
  }

window.InboxPage = InboxPage;
console.log("[PDV] inbox.js carregado");
