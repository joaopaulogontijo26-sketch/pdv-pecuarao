/* ============================================================
   CRM Module v1.0 — Pecuarão Gontijo
   Módulos: CRM + Kanban | Inbox WhatsApp | Agente IA (n8n)
   Integra com: Supabase · Evolution API · n8n.cloud
   ============================================================ */
(function () {
  "use strict";

  // ── CREDENCIAIS ──────────────────────────────────────────────────────────────
  const EVO_URL      = "https://evo.pecuaraogontijo.shop";
  const EVO_KEY      = "09C2AA929F60-4FD0-BD8A-E4C5F5F29FFC";
  const EVO_INST     = "pecuarao";
  const N8N_URL      = "https://n8n.pecuaraogontijo.shop";
  const N8N_KEY      = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNDQ1YTM2Mi1mNGJkLTRlYWYtYWRlNi0wZWU2MzNlNmQ3ZjciLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZmQ2NDhjNjQtYTNlNy00YTM1LWIxZjQtMDU2NWRmM2ZlZjQ1IiwiaWF0IjoxNzgwNTkzMTM4LCJleHAiOjE3ODMxMzc2MDB9.szvq5tGLUg5FQK5vbx3209O--o_uXaVoCJbl1A8vSjk";
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

  // ════════════════════════════════════════════════════════════════════════════
  // ABA 3 — AGENTE IA (n8n)
  // ════════════════════════════════════════════════════════════════════════════

  function AgentePage({ S, notify }) {
    const [wf, setWf]               = useState(null);
    const [execs, setExecs]         = useState([]);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [toggling, setToggling]   = useState(false);
    const [promptNode, setPromptNode] = useState(null);
    const [editPrompt, setEditPrompt] = useState("");
    const [showPrompt, setShowPrompt] = useState(false);
    const [tab, setTab]             = useState("status"); // status | prompt | execucoes

    const loadAll = useCallback(async () => {
      setLoading(true);
      try {
        const [wfData, execData] = await Promise.all([
          n8nApi.getWorkflow(),
          n8nApi.getExecutions(15)
        ]);
        setWf(wfData);
        setExecs(Array.isArray(execData) ? execData : []);
        // Encontra nó com prompt (AI Agent ou Set node com prompt)
        const nodes = wfData?.nodes || [];
        const aiNode = nodes.find(n =>
          n.type?.includes("agent") || n.type?.includes("openAi") || n.type?.includes("lmChat") ||
          n.parameters?.systemMessage || n.parameters?.prompt
        );
        if (aiNode) {
          setPromptNode(aiNode);
          setEditPrompt(aiNode.parameters?.systemMessage || aiNode.parameters?.prompt || "");
        }
      } catch (e) {
        notify("Erro ao carregar workflow: " + e.message, "error");
      }
      setLoading(false);
    }, []);

    useEffect(() => { loadAll(); }, []);

    const toggleActive = async () => {
      if (!wf || toggling) return;
      setToggling(true);
      try {
        const updated = await n8nApi.activateWorkflow(!wf.active);
        setWf(updated);
        notify(updated.active ? "Tião ativado ✓" : "Tião pausado");
      } catch (e) {
        notify("Erro: " + e.message, "error");
      }
      setToggling(false);
    };

    const savePrompt = async () => {
      if (!wf || !promptNode || saving) return;
      setSaving(true);
      try {
        const updatedNodes = wf.nodes.map(n => {
          if (n.name !== promptNode.name) return n;
          return {
            ...n,
            parameters: {
              ...n.parameters,
              ...(n.parameters?.systemMessage !== undefined ? { systemMessage: editPrompt } : {}),
              ...(n.parameters?.prompt !== undefined ? { prompt: editPrompt } : {})
            }
          };
        });
        const updated = await n8nApi.updateWorkflow({ ...wf, nodes: updatedNodes });
        setWf(updated);
        setPromptNode(updatedNodes.find(n => n.name === promptNode.name));
        setShowPrompt(false);
        notify("Prompt do Tião atualizado ✓");
      } catch (e) {
        notify("Erro ao salvar prompt: " + e.message, "error");
      }
      setSaving(false);
    };

    const execStatus = exec => {
      if (exec.status === "success") return { label: "Sucesso", color: "#4ade80" };
      if (exec.status === "error") return { label: "Erro", color: "#ff3b3b" };
      if (exec.status === "running") return { label: "Rodando", color: "#f59e0b" };
      return { label: exec.status || "—", color: "#6a6d80" };
    };

    const stats = useMemo(() => ({
      total: execs.length,
      sucesso: execs.filter(e => e.status === "success").length,
      erro: execs.filter(e => e.status === "error").length,
      hoje: execs.filter(e => {
        const d = new Date(e.startedAt);
        const now = new Date();
        return d.toDateString() === now.toDateString();
      }).length
    }), [execs]);

    if (loading) return React.createElement("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" } },
      React.createElement(Spinner, { size: 40 })
    );

    return React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", padding: "16px 16px 80px", overflowY: "auto" } },
      // Header com status do agente
      React.createElement("div", {
        style: {
          background: "#0F1220", border: "1px solid #1e2232", borderRadius: 16,
          padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 14
        }
      },
        React.createElement("div", {
          style: {
            width: 52, height: 52, borderRadius: "50%", background: "#1a1c2e",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0
          }
        }, "🤖"),
        React.createElement("div", { style: { flex: 1 } },
          React.createElement("div", { style: { fontSize: 16, fontWeight: 800, color: "#e8e9f0" } }, "Tião — Agente IA"),
          React.createElement("div", { style: { fontSize: 12, color: "#6a6d80", marginBottom: 6 } }, "Atendimento WhatsApp · Pecuarão Gontijo"),
          React.createElement(Badge, { color: wf?.active ? "#4ade80" : "#ff3b3b" }, wf?.active ? "● Ativo" : "● Pausado")
        ),
        React.createElement(CrmBtn, {
          variant: wf?.active ? "danger" : "success",
          onClick: toggleActive,
          disabled: toggling,
          style: { flexShrink: 0 }
        }, toggling ? React.createElement(Spinner, { size: 14 }) : (wf?.active ? "⏸ Pausar" : "▶ Ativar"))
      ),

      // Abas
      React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 16 } },
        [["status", "📊 Status"], ["prompt", "✏️ Prompt"], ["execucoes", "🕒 Execuções"]].map(([id, label]) =>
          React.createElement("button", {
            key: id,
            onClick: () => setTab(id),
            style: {
              flex: 1, padding: "8px 4px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              border: "none", cursor: "pointer", fontFamily: "'Sora',sans-serif",
              background: tab === id ? "#E8682A" : "#0F1220",
              color: tab === id ? "#fff" : "#6a6d80",
              transition: "background .15s"
            }
          }, label)
        )
      ),

      // Tab: Status
      tab === "status" && React.createElement("div", null,
        React.createElement("div", {
          style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }
        },
          [
            { label: "Execuções totais", value: stats.total, color: "#4A5BC4" },
            { label: "Hoje", value: stats.hoje, color: "#E8682A" },
            { label: "Sucesso", value: stats.sucesso, color: "#4ade80" },
            { label: "Erros", value: stats.erro, color: "#ff3b3b" }
          ].map(({ label, value, color }) =>
            React.createElement("div", {
              key: label,
              style: { background: "#0F1220", border: `1px solid ${color}33`, borderRadius: 12, padding: "14px 16px" }
            },
              React.createElement("div", { style: { fontSize: 24, fontWeight: 800, color } }, value),
              React.createElement("div", { style: { fontSize: 11, color: "#6a6d80", marginTop: 2 } }, label)
            )
          )
        ),
        React.createElement("div", {
          style: { background: "#0F1220", border: "1px solid #1e2232", borderRadius: 12, padding: 14 }
        },
          React.createElement("div", { style: { fontSize: 12, fontWeight: 700, color: "#6a6d80", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 } }, "Informações do Workflow"),
          [
            ["ID", wf?.id],
            ["Nome", wf?.name],
            ["Criado em", wf?.createdAt ? fmtDateTime(wf.createdAt) : "—"],
            ["Atualizado", wf?.updatedAt ? fmtDateTime(wf.updatedAt) : "—"],
            ["Nós", wf?.nodes?.length || 0]
          ].map(([k, v]) =>
            React.createElement("div", {
              key: k,
              style: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1a1c2e", fontSize: 12 }
            },
              React.createElement("span", { style: { color: "#6a6d80" } }, k),
              React.createElement("span", { style: { color: "#e8e9f0", fontWeight: 600, textAlign: "right", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis" } }, String(v || "—"))
            )
          )
        )
      ),

      // Tab: Prompt
      tab === "prompt" && React.createElement("div", null,
        !promptNode
          ? React.createElement("div", {
            style: { background: "#0F1220", border: "1px solid #f59e0b33", borderRadius: 12, padding: 20, textAlign: "center" }
          },
            React.createElement("div", { style: { fontSize: 32, marginBottom: 8 } }, "⚠️"),
            React.createElement("div", { style: { fontSize: 14, fontWeight: 700, color: "#f59e0b", marginBottom: 6 } }, "Nó de prompt não encontrado"),
            React.createElement("div", { style: { fontSize: 12, color: "#6a6d80", lineHeight: 1.5 } },
              "O sistema não encontrou automaticamente o nó de prompt no workflow.",
              React.createElement("br"), "Edite manualmente em: ",
              React.createElement("a", { href: `${N8N_URL}/workflow/${N8N_WF_ID}`, target: "_blank", style: { color: "#E8682A" } }, "Abrir n8n")
            )
          )
          : React.createElement("div", null,
            React.createElement("div", {
              style: { background: "#0D1024", border: "1px solid #1e2232", borderRadius: 10, padding: "10px 12px", marginBottom: 12, fontSize: 12 }
            },
              React.createElement("span", { style: { color: "#6a6d80" } }, "Editando nó: "),
              React.createElement("span", { style: { color: "#E8682A", fontWeight: 700 } }, promptNode.name || promptNode.type)
            ),
            React.createElement("textarea", {
              value: editPrompt,
              onChange: e => setEditPrompt(e.target.value),
              rows: 14,
              style: {
                width: "100%", background: "#0D1024", border: "1px solid #1e2232", borderRadius: 12,
                padding: "12px", color: "#e8e9f0", fontSize: 12, fontFamily: "monospace",
                resize: "vertical", marginBottom: 12, lineHeight: 1.6
              }
            }),
            React.createElement("div", { style: { display: "flex", gap: 8 } },
              React.createElement(CrmBtn, {
                variant: "ghost",
                onClick: () => setEditPrompt(promptNode.parameters?.systemMessage || promptNode.parameters?.prompt || ""),
                style: { flex: 1, justifyContent: "center" }
              }, "↩ Reverter"),
              React.createElement(CrmBtn, {
                onClick: savePrompt,
                disabled: saving,
                style: { flex: 2, justifyContent: "center" }
              }, saving ? React.createElement(Spinner, { size: 14 }) : "💾 Salvar Prompt")
            ),
            React.createElement("div", { style: { marginTop: 10, textAlign: "center" } },
              React.createElement("a", {
                href: `${N8N_URL}/workflow/${N8N_WF_ID}`,
                target: "_blank",
                style: { fontSize: 12, color: "#E8682A", textDecoration: "none" }
              }, "🔗 Abrir workflow completo no n8n →")
            )
          )
      ),

      // Tab: Execuções
      tab === "execucoes" && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
        execs.length === 0
          ? React.createElement("div", { style: { textAlign: "center", padding: 48, color: "#6a6d80" } }, "⚡ Nenhuma execução recente")
          : execs.map((exec, i) => {
            const st = execStatus(exec);
            return React.createElement("div", {
              key: exec.id || i,
              style: { background: "#0F1220", border: `1px solid ${st.color}33`, borderRadius: 12, padding: "12px 14px" }
            },
              React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 } },
                React.createElement(Badge, { color: st.color }, st.label),
                React.createElement("span", { style: { fontSize: 11, color: "#6a6d80" } }, exec.startedAt ? fmtDateTime(exec.startedAt) : "—")
              ),
              React.createElement("div", { style: { fontSize: 11, color: "#6a6d80" } }, "ID: " + (exec.id || "—")),
              exec.stoppedAt && React.createElement("div", { style: { fontSize: 11, color: "#6a6d80" } },
                "Duração: " + Math.round((new Date(exec.stoppedAt) - new Date(exec.startedAt)) / 1000) + "s"
              )
            );
          })
      )
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // REGISTRO GLOBAL — injeta as páginas no PDV Pro
  // ════════════════════════════════════════════════════════════════════════════

  window.CRMPage    = CRMPage;
  window.InboxPage  = InboxPage;
  window.AgentePage = AgentePage;

  console.log("[CRM Module] Carregado com sucesso — CRMPage, InboxPage, AgentePage disponíveis");
})();
