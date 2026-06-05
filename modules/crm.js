/* PDV Pro — crm.js | CRM + Kanban */

/* ============================================================
   CRM Module v1.0 — Pecuarão Gontijo
   Módulos: CRM + Kanban | Inbox WhatsApp | Agente IA (n8n)
   Integra com: Supabase · Evolution API · n8n.cloud
   ============================================================ */
// ── CREDENCIAIS ──────────────────────────────────────────────────────────────
  const EVO_URL      = "https://evo.pecuaraogontijo.shop";
  const EVO_KEY      = "09C2AA929F60-4FD0-BD8A-E4C5F5F29FFC";
  const EVO_INST     = "pecuarao";
  const N8N_URL      = "https://n8n.pecuaraogontijo.shop";
  const N8N_KEY      = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNDQ1YTM2Mi1mNGJkLTRlYWYtYWRlNi0wZWU2MzNlNmQ3ZjciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiYzEzZTE5ZjctNzcwNC00NjJmLWI1MzctMjMxZDgxZWYwYmQxIiwiaWF0IjoxNzgwNTk2OTc4LCJleHAiOjE3ODMxMzc2MDB9.wieLuibWOOiYeGkpJCzRu3p2zrUO3okSTm0ochC-t7E";
  const N8N_WF_ID    = "asGtimXyV6fUaFnA";
  const SUPABASE_URL = "https://jyrugkklsacswgysjser.supabase.co";
  const _SB_KEY      = () => localStorage.getItem('_sb_key') || sessionStorage.getItem('_sb_key') || "";
  const _SB_H        = () => ({
    'Content-Type': 'application/json',
    'apikey': _SB_KEY(),
    'Authorization': 'Bearer ' + _SB_KEY(),
    'Prefer': 'return=representation'
  });

  // ── REACT ALIASES ────────────────────────────────────────────────────────────
  const { useState, useEffect, useRef, useCallback, useMemo } = React;

  // ── UTILITÁRIOS ──────────────────────────────────────────────────────────────
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
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
  const phoneNum = p => (p || "").replace(/\D/g, "");
  const avatarColor = name => {
    const colors = ["#E8682A","#4A5BC4","#4ade80","#f59e0b","#ec4899","#06b6d4","#8b5cf6"];
    let h = 0;
    for (let i = 0; i < (name||"").length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
    return colors[Math.abs(h) % colors.length];
  };
  const initials = name => (name || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

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

  function CRMPage({ S, customers, notify }) {
    const [view, setView]       = useState("kanban"); // kanban | lista
    const [cards, setCards]     = useState([]);
    const [cols, setCols]       = useState(() => {
      try { return JSON.parse(localStorage.getItem("crm_cols")) || DEFAULT_KANBAN_COLS; } catch { return DEFAULT_KANBAN_COLS; }
    });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm]   = useState(false);
    const [showColForm, setShowColForm] = useState(false);
    const [editCard, setEditCard]   = useState(null);
    const [dragCard, setDragCard]   = useState(null);
    const [selCard, setSelCard]     = useState(null);
    const [newCol, setNewCol]       = useState({ label: "", color: "#E8682A" });

    // Carrega cards do Supabase
    const loadCards = useCallback(async () => {
      setLoading(true);
      try {
        const rows = await sb.get("crm_cards", "order=created_at.desc");
        setCards(Array.isArray(rows) ? rows : []);
      } catch (e) {
        // tabela pode não existir ainda, usa localStorage como fallback
        try {
          const local = JSON.parse(localStorage.getItem("crm_cards_local") || "[]");
          setCards(local);
        } catch { setCards([]); }
      }
      setLoading(false);
    }, []);

    useEffect(() => { loadCards(); }, []);

    const saveCard = async (card) => {
      const isNew = !card.id;
      const row = {
        id: card.id || uid(),
        titulo: card.titulo || card.name || "Sem título",
        cliente: card.cliente || "",
        telefone: card.telefone || "",
        coluna: card.coluna || cols[0]?.id || "novo",
        obs: card.obs || "",
        valor: parseFloat(card.valor || 0),
        responsavel: card.responsavel || "",
        origem: card.origem || "manual",
        created_at: card.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      try {
        await sb.upsert("crm_cards", row);
      } catch {
        // fallback localStorage
        const local = JSON.parse(localStorage.getItem("crm_cards_local") || "[]");
        const idx = local.findIndex(c => c.id === row.id);
        if (idx >= 0) local[idx] = row; else local.unshift(row);
        localStorage.setItem("crm_cards_local", JSON.stringify(local));
      }
      if (isNew) setCards(prev => [row, ...prev]);
      else setCards(prev => prev.map(c => c.id === row.id ? row : c));
      notify(isNew ? "Card criado ✓" : "Card atualizado ✓");
    };

    const moveCard = async (cardId, toCol) => {
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, coluna: toCol } : c));
      try {
        await sb.patch("crm_cards", `id=eq.${cardId}`, { coluna: toCol, updated_at: new Date().toISOString() });
      } catch {
        const local = JSON.parse(localStorage.getItem("crm_cards_local") || "[]");
        localStorage.setItem("crm_cards_local", JSON.stringify(local.map(c => c.id === cardId ? { ...c, coluna: toCol } : c)));
      }
    };

    const deleteCard = async (cardId) => {
      setCards(prev => prev.filter(c => c.id !== cardId));
      setSelCard(null);
      try { await sb.delete("crm_cards", `id=eq.${cardId}`); } catch {}
      notify("Card removido");
    };

    const saveCols = (newCols) => {
      setCols(newCols);
      localStorage.setItem("crm_cols", JSON.stringify(newCols));
    };

    // ── Kanban View ─────────────────────────────────────────────────────────
    const KanbanView = () => React.createElement("div", {
      style: { display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12, flex: 1 }
    },
      cols.map(col => {
        const colCards = cards.filter(c => c.coluna === col.id);
        return React.createElement("div", {
          key: col.id,
          style: { minWidth: 220, maxWidth: 240, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 },
          onDragOver: e => e.preventDefault(),
          onDrop: e => {
            e.preventDefault();
            if (dragCard && dragCard !== col.id) moveCard(dragCard, col.id);
            setDragCard(null);
          }
        },
          // Cabeçalho da coluna
          React.createElement("div", {
            style: {
              display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
              background: col.color + "18", borderRadius: 10, border: `1px solid ${col.color}30`
            }
          },
            React.createElement("div", { style: { width: 8, height: 8, borderRadius: "50%", background: col.color } }),
            React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: col.color, flex: 1 } }, col.label),
            React.createElement("span", { style: { fontSize: 11, color: "#6a6d80", background: "#0D1024", borderRadius: 99, padding: "1px 7px" } }, colCards.length)
          ),
          // Cards
          ...colCards.map(card => React.createElement("div", {
            key: card.id,
            draggable: true,
            onDragStart: () => setDragCard(card.id),
            onDragEnd: () => setDragCard(null),
            onClick: () => setSelCard(card),
            style: {
              background: "#0F1220", border: "1px solid #1e2232", borderRadius: 12,
              padding: "12px 12px 10px", cursor: "pointer",
              transition: "border-color .15s, transform .1s",
              borderLeft: `3px solid ${col.color}`,
              opacity: dragCard === card.id ? 0.5 : 1
            }
          },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#e8e9f0", marginBottom: 4, lineHeight: 1.3 } }, card.titulo),
            card.cliente && React.createElement("div", { style: { fontSize: 11, color: "#6a6d80", marginBottom: 4 } }, "👤 " + card.cliente),
            card.telefone && React.createElement("div", { style: { fontSize: 11, color: "#6a6d80", marginBottom: 4 } }, "📞 " + card.telefone),
            card.valor > 0 && React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#4ade80" } },
              Number(card.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
            ),
            card.responsavel && React.createElement("div", { style: { marginTop: 6, display: "flex", alignItems: "center", gap: 4 } },
              React.createElement(Avatar, { name: card.responsavel, size: 18 }),
              React.createElement("span", { style: { fontSize: 10, color: "#6a6d80" } }, card.responsavel)
            )
          )),
          // Botão add
          React.createElement("button", {
            onClick: () => { setEditCard({ coluna: col.id }); setShowForm(true); },
            style: {
              background: "transparent", border: "1px dashed #252845", borderRadius: 10,
              color: "#6a6d80", fontSize: 12, padding: "8px", cursor: "pointer",
              fontFamily: "'Sora',sans-serif", transition: "border-color .15s"
            }
          }, "+ Adicionar card")
        );
      }),
      // Botão nova coluna
      React.createElement("div", { style: { minWidth: 200, flexShrink: 0 } },
        React.createElement("button", {
          onClick: () => setShowColForm(true),
          style: {
            width: "100%", background: "transparent", border: "1px dashed #252845",
            borderRadius: 12, color: "#6a6d80", fontSize: 13, padding: "12px",
            cursor: "pointer", fontFamily: "'Sora',sans-serif"
          }
        }, "+ Nova coluna")
      )
    );

    // ── Lista View ───────────────────────────────────────────────────────────
    const ListView = () => React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
      cards.length === 0
        ? React.createElement("div", { style: { textAlign: "center", padding: 48, color: "#6a6d80" } }, "🎯 Nenhum card ainda")
        : cards.map(card => {
          const col = cols.find(c => c.id === card.coluna) || cols[0];
          return React.createElement("div", {
            key: card.id,
            onClick: () => setSelCard(card),
            style: {
              background: "#0F1220", border: "1px solid #1e2232", borderRadius: 12,
              padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12
            }
          },
            React.createElement(Avatar, { name: card.cliente || card.titulo, size: 38 }),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
              React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#e8e9f0" } }, card.titulo),
              React.createElement("div", { style: { fontSize: 12, color: "#6a6d80" } }, card.cliente || "—")
            ),
            col && React.createElement(Badge, { color: col.color }, col.label),
            card.valor > 0 && React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#4ade80", whiteSpace: "nowrap" } },
              Number(card.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
            )
          );
        })
    );

    // ── Form Card ────────────────────────────────────────────────────────────
    const CardForm = () => {
      const [form, setForm] = useState(editCard || { titulo: "", cliente: "", telefone: "", coluna: cols[0]?.id || "novo", obs: "", valor: "", responsavel: "" });
      const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
      return React.createElement("div", {
        style: {
          position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,.75)"
        },
        onClick: () => { setShowForm(false); setEditCard(null); }
      },
        React.createElement("div", {
          onClick: e => e.stopPropagation(),
          style: {
            width: "100%", background: "#0F1220", borderRadius: "20px 20px 0 0",
            border: "1px solid #1e2232", padding: "20px 18px 36px", maxHeight: "88dvh", overflowY: "auto"
          }
        },
          React.createElement("div", { style: { width: 36, height: 4, background: "#252845", borderRadius: 2, margin: "0 auto 20px" } }),
          React.createElement(SectionHeader, { title: form.id ? "Editar Card" : "Novo Card" }),
          React.createElement(CrmInput, { label: "Título", value: form.titulo, onChange: e => set("titulo", e.target.value), placeholder: "Ex: Lead WhatsApp - Ração" }),
          React.createElement(CrmInput, { label: "Cliente", value: form.cliente, onChange: e => set("cliente", e.target.value), placeholder: "Nome do cliente" }),
          React.createElement(CrmInput, { label: "Telefone", value: form.telefone, onChange: e => set("telefone", e.target.value), placeholder: "(37) 99999-9999", type: "tel" }),
          React.createElement(CrmInput, { label: "Valor (R$)", value: form.valor, onChange: e => set("valor", e.target.value), placeholder: "0,00", type: "number" }),
          React.createElement(CrmInput, { label: "Responsável", value: form.responsavel, onChange: e => set("responsavel", e.target.value), placeholder: "João Paulo / Juliano" }),
          React.createElement("div", { style: { marginBottom: 12 } },
            React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: "#6a6d80", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.8 } }, "Coluna"),
            React.createElement("select", {
              value: form.coluna,
              onChange: e => set("coluna", e.target.value),
              style: { width: "100%", background: "#0D1024", border: "1px solid #1e2232", borderRadius: 10, padding: "10px 12px", color: "#e8e9f0", fontSize: 13, fontFamily: "'Sora',sans-serif" }
            },
              cols.map(c => React.createElement("option", { key: c.id, value: c.id }, c.label))
            )
          ),
          React.createElement(CrmInput, { label: "Observações", value: form.obs, onChange: e => set("obs", e.target.value), placeholder: "Anotações sobre o lead...", multiline: true }),
          React.createElement("div", { style: { display: "flex", gap: 10 } },
            React.createElement(CrmBtn, { variant: "ghost", onClick: () => { setShowForm(false); setEditCard(null); }, style: { flex: 1, justifyContent: "center" } }, "Cancelar"),
            React.createElement(CrmBtn, { onClick: () => { saveCard(form); setShowForm(false); setEditCard(null); }, style: { flex: 1, justifyContent: "center" } }, "Salvar")
          )
        )
      );
    };

    // ── Card Detail ──────────────────────────────────────────────────────────
    const CardDetail = () => {
      const card = selCard;
      const col = cols.find(c => c.id === card.coluna);
      return React.createElement("div", {
        style: { position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,.75)" },
        onClick: () => setSelCard(null)
      },
        React.createElement("div", {
          onClick: e => e.stopPropagation(),
          style: { width: "100%", background: "#0F1220", borderRadius: "20px 20px 0 0", border: "1px solid #1e2232", padding: "20px 18px 36px" }
        },
          React.createElement("div", { style: { width: 36, height: 4, background: "#252845", borderRadius: 2, margin: "0 auto 16px" } }),
          React.createElement("div", { style: { display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 } },
            React.createElement(Avatar, { name: card.cliente || card.titulo, size: 48 }),
            React.createElement("div", { style: { flex: 1 } },
              React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color: "#e8e9f0" } }, card.titulo),
              card.cliente && React.createElement("div", { style: { fontSize: 13, color: "#6a6d80" } }, card.cliente),
              col && React.createElement(Badge, { color: col.color }, col.label)
            )
          ),
          card.telefone && React.createElement("div", { style: { padding: "10px 12px", background: "#0D1024", borderRadius: 10, marginBottom: 8, fontSize: 13, color: "#e8e9f0" } }, "📞 " + card.telefone),
          card.valor > 0 && React.createElement("div", { style: { padding: "10px 12px", background: "#0D1024", borderRadius: 10, marginBottom: 8, fontSize: 13, color: "#4ade80", fontWeight: 700 } },
            "💰 " + Number(card.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          ),
          card.responsavel && React.createElement("div", { style: { padding: "10px 12px", background: "#0D1024", borderRadius: 10, marginBottom: 8, fontSize: 13, color: "#e8e9f0" } }, "👤 " + card.responsavel),
          card.obs && React.createElement("div", { style: { padding: "10px 12px", background: "#0D1024", borderRadius: 10, marginBottom: 16, fontSize: 13, color: "#6a6d80", lineHeight: 1.5 } }, card.obs),
          React.createElement("div", { style: { fontSize: 11, color: "#444", marginBottom: 16 } }, "Criado em " + fmtDateTime(card.created_at)),
          React.createElement("div", { style: { display: "flex", gap: 8 } },
            React.createElement(CrmBtn, { variant: "secondary", onClick: () => { setEditCard(card); setSelCard(null); setShowForm(true); }, style: { flex: 1, justifyContent: "center" } }, "✏️ Editar"),
            card.telefone && React.createElement(CrmBtn, { variant: "success", onClick: () => window.open(`https://wa.me/${phoneNum(card.telefone)}`), style: { flex: 1, justifyContent: "center" } }, "💬 WhatsApp"),
            React.createElement(CrmBtn, { variant: "danger", onClick: () => deleteCard(card.id), style: { flex: 1, justifyContent: "center" } }, "🗑️")
          )
        )
      );
    };

    // ── Col Form ─────────────────────────────────────────────────────────────
    const ColForm = () => React.createElement("div", {
      style: { position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.75)" },
      onClick: () => setShowColForm(false)
    },
      React.createElement("div", {
        onClick: e => e.stopPropagation(),
        style: { background: "#0F1220", borderRadius: 16, border: "1px solid #1e2232", padding: 24, width: 300 }
      },
        React.createElement(SectionHeader, { title: "Nova Coluna" }),
        React.createElement(CrmInput, { label: "Nome da coluna", value: newCol.label, onChange: e => setNewCol(f => ({ ...f, label: e.target.value })), placeholder: "Ex: Em negociação" }),
        React.createElement("div", { style: { marginBottom: 16 } },
          React.createElement("div", { style: { fontSize: 11, fontWeight: 600, color: "#6a6d80", marginBottom: 5, textTransform: "uppercase" } }, "Cor"),
          React.createElement("input", {
            type: "color", value: newCol.color,
            onChange: e => setNewCol(f => ({ ...f, color: e.target.value })),
            style: { width: "100%", height: 40, border: "none", borderRadius: 8, cursor: "pointer", background: "none" }
          })
        ),
        React.createElement("div", { style: { display: "flex", gap: 8 } },
          React.createElement(CrmBtn, { variant: "ghost", onClick: () => setShowColForm(false), style: { flex: 1, justifyContent: "center" } }, "Cancelar"),
          React.createElement(CrmBtn, {
            onClick: () => {
              if (!newCol.label.trim()) return;
              const nc = { id: uid(), label: newCol.label.trim(), color: newCol.color };
              saveCols([...cols, nc]);
              setNewCol({ label: "", color: "#E8682A" });
              setShowColForm(false);
              notify("Coluna criada ✓");
            },
            style: { flex: 1, justifyContent: "center" }
          }, "Criar")
        )
      )
    );

    return React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", padding: "16px 16px 80px", overflow: "hidden" } },
      // Header
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 } },
        React.createElement(SectionHeader, {
          title: "CRM & Kanban",
          subtitle: `${cards.length} cards · ${cols.length} colunas`,
          action: React.createElement("div", { style: { display: "flex", gap: 8 } },
            React.createElement(CrmBtn, { variant: view === "kanban" ? "primary" : "secondary", onClick: () => setView("kanban"), style: { padding: "6px 10px" } }, "⠿"),
            React.createElement(CrmBtn, { variant: view === "lista" ? "primary" : "secondary", onClick: () => setView("lista"), style: { padding: "6px 10px" } }, "☰"),
            React.createElement(CrmBtn, { onClick: () => { setEditCard(null); setShowForm(true); } }, "+ Card")
          )
        })
      ),
      loading
        ? React.createElement("div", { style: { display: "flex", justifyContent: "center", paddingTop: 48 } }, React.createElement(Spinner, { size: 32 }))
        : React.createElement("div", { style: { flex: 1, overflow: view === "kanban" ? "hidden" : "auto" } },
          view === "kanban"
            ? React.createElement("div", { style: { height: "100%", overflowX: "auto", overflowY: "hidden" } }, React.createElement(KanbanView))
            : React.createElement(ListView)
        ),
      showForm && React.createElement(CardForm),
      showColForm && React.createElement(ColForm),
      selCard && React.createElement(CardDetail)
    );
  }

window.CRMPage = CRMPage;
console.log("[PDV] crm.js carregado");
