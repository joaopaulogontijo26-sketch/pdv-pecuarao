/* PDV Pro — agente.js | Agente IA Tião */

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

window.AgentePage = AgentePage;
console.log("[PDV] agente.js carregado");
