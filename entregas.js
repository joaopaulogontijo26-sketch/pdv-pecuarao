/* PDV Pro — entregas.js
   EntregasPage — pedidos e entregas
*/

function EntregasPage({
  S,
  sales,
  customers,
  notify,
  pedidos: pedidosProp,
  persistE: persistEProp,
  onReload
}) {
  const [pedidos, setPedidos] = useState(() => pedidosProp || load("pdv_entregas", []));
  useEffect(() => {
    if (pedidosProp) setPedidos(pedidosProp);
  }, [pedidosProp]);
  const persistE = v => {
    setPedidos(v);
    if (persistEProp) persistEProp(v);else {
      save("pdv_entregas", v);
      syncSave("entregas", v);
    }
  };
  const [tab, setTab] = useState("pedido");
  const [newPedido, setNewPedido] = useState(false);
  const [obsEdit, setObsEdit] = useState({});
  const [nForm, setNForm] = useState({
    cliente: "",
    telefone: "",
    endereco: "",
    obs: "",
    vendaId: "",
    pagamento: "pago"
  });
  const setNF = (k, v) => setNForm(f => ({
    ...f,
    [k]: v
  }));
  const STATUS = [{
    id: "pedido",
    label: "Pedido",
    emoji: "📋",
    color: "#94a3b8",
    bg: "#94a3b815",
    border: "#94a3b840"
  }, {
    id: "separando",
    label: "Separando",
    emoji: "📦",
    color: "#f59e0b",
    bg: "#f59e0b15",
    border: "#f59e0b50"
  }, {
    id: "rota",
    label: "Em Rota",
    emoji: "🚚",
    color: "#3b82f6",
    bg: "#3b82f615",
    border: "#3b82f650"
  }, {
    id: "concluido",
    label: "Concluído",
    emoji: "✅",
    color: "#22c55e",
    bg: "#22c55e15",
    border: "#22c55e50"
  }];
  const ST = Object.fromEntries(STATUS.map(s => [s.id, s]));
  const counts = Object.fromEntries(STATUS.map(s => [s.id, pedidos.filter(p => p.status === s.id).length]));
  const filtered = pedidos.filter(p => p.status === tab);
  const criarPedido = form => {
    const vendaSel = sales.find(s => s.id === form.vendaId);
    const vendaSelecionadaEntrega = sales.find(s => s.id === form.vendaId);
    const novo = {
      id: uid(),
      numero: "PED-" + String(pedidos.length + 1).padStart(4, "0"),
      cliente: form.cliente || "Avulso",
      telefone: form.telefone || "",
      endereco: form.endereco || "",
      itens: (vendaSel === null || vendaSel === void 0 ? void 0 : vendaSel.items) || [],
      total: (vendaSel === null || vendaSel === void 0 ? void 0 : vendaSel.total) || 0,
      obs: form.obs || "",
      pagamento: form.pagamento || "pago",
      status: "pedido",
      isPrazo: (vendaSelecionadaEntrega === null || vendaSelecionadaEntrega === void 0 ? void 0 : vendaSelecionadaEntrega.payment) === "A Prazo" || false,
      criadoEm: Date.now(),
      criadoData: todayStr(),
      criadoHora: nowTime(),
      vendaId: form.vendaId || null
    };
    persistE([novo, ...pedidos]);
    setNewPedido(false);
    notify("Pedido " + novo.numero + " criado! ✓");
  };
  const moverStatus = (id, novoStatus) => {
    var _ST$novoStatus;
    persistE(pedidos.map(p => p.id === id ? {
      ...p,
      status: novoStatus,
      atualizadoEm: Date.now()
    } : p));
    notify("Status: " + ((_ST$novoStatus = ST[novoStatus]) === null || _ST$novoStatus === void 0 ? void 0 : _ST$novoStatus.label) + " ✓");
  };
  const salvarObs = id => {
    persistE(pedidos.map(p => p.id === id ? {
      ...p,
      obs: obsEdit[id] ?? p.obs
    } : p));
    setObsEdit(o => {
      const n = {
        ...o
      };
      delete n[id];
      return n;
    });
    notify("Observação salva ✓");
  };
  const excluirPedido = id => {
    persistE(pedidos.filter(p => p.id !== id));
    notify("Pedido removido.", "warn");
  };
  const imprimirBrowser = ped => {
    const st = ST[ped.status];
    const itemRows = (ped.itens || []).map(i => "<tr><td>" + i.name + "</td><td style='text-align:center'>" + i.qty + "x</td><td style='text-align:right;font-weight:600'>" + fmt(i.price * i.qty) + "</td></tr>").join("");
    const css = "body{font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;color:#111;}table{width:100%;border-collapse:collapse;font-size:12px;}th{background:#f3f4f6;padding:6px;text-align:left;font-size:10px;text-transform:uppercase;}td{padding:6px;border-bottom:1px solid #f3f4f6;}.total{font-size:16px;font-weight:800;text-align:right;margin-top:10px;color:#2D3A8C;}@media print{body{max-width:100%;padding:8px}}";
    const pgStatus = ped.pagamento || "";
    const pgLabel = pgStatus === "pago" ? "✅ PAGO" : pgStatus === "troco" ? "💵 LEVAR TROCO" : pgStatus === "maquina" ? "📲 LEVAR MÁQUINA" : pgStatus === "troco_maquina" ? "💵📲 LEVAR TROCO + MÁQUINA" : "";
    const pgColor = pgStatus === "pago" ? "#27ae60" : "#e74c3c";
    const html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + ped.numero + "</title><style>" + css + "</style></head><body>" + "<div style='background:#2D3A8C;color:#fff;padding:14px;text-align:center;border-radius:8px;margin-bottom:16px'>" + "<img src='" + LOGO_SRC + "' alt='logo' style='height:44px;display:block;margin:0 auto 6px'/>" + "<div style='font-size:15px;font-weight:800;letter-spacing:1px'>PEDIDO DE ENTREGA</div>" + "<div style='font-size:11px;margin-top:3px;opacity:.85'>" + ped.numero + " · " + ped.criadoData + " " + ped.criadoHora + "</div>" + "</div>" + "<div style='background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:10px;margin-bottom:12px;font-size:12px'>" + "<div style='display:flex;justify-content:space-between;margin-bottom:4px'>" + "<span><b>Status:</b> " + st.emoji + " " + st.label + "</span>" + "<span><b>Total:</b> <span style='color:#2D3A8C;font-weight:800'>" + fmt(ped.total) + "</span></span></div>" + "<b>Cliente:</b> " + ped.cliente + (ped.telefone ? " · 📞" + ped.telefone : "") + "<br>" + (ped.endereco ? "<b>Endereço:</b> 📍" + ped.endereco + "<br>" : "") + "</div>" + "<table><thead><tr><th>Produto</th><th style='text-align:center'>Qtd</th><th style='text-align:right'>Valor</th></tr></thead><tbody>" + itemRows + "</tbody></table>" + "<div class='total'>TOTAL: " + fmt(ped.total) + "</div>" + (pgLabel ? "<div style='margin-top:10px;padding:10px;border-radius:6px;border:2px solid " + pgColor + ";font-size:13px;font-weight:800;text-align:center;color:" + pgColor + "'>" + pgLabel + "</div>" : "") + (ped.obs ? "<div style='background:#fffbeb;border:1px solid #fef08a;padding:8px;border-radius:6px;font-size:12px;margin-top:8px'><b>Obs:</b> " + ped.obs + "</div>" : "") + "<div style='border-top:2px solid #2D3A8C;margin-top:20px;padding-top:14px;font-size:11px;color:#888;text-align:center'>" + "Assinatura do recebedor: _______________________________<br><br>Data: _____ / _____ / _______<br><br>" + "<b style='color:#2D3A8C'>Pecuarão Gontijo</b> · Rua Guarani, 461 · (37) 99922-1020" + "</div>" + "</body></html>";
    // Usa iframe para evitar bloqueio de popup
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        // Fallback: window.open
        const w = window.open("", "_blank", "width=520,height=750");
        if (w) {
          w.document.write(html);
          w.document.close();
          setTimeout(() => {
            try {
              w.print();
            } catch (_) {}
          }, 400);
        } else notify("Permita pop-ups para imprimir.", "warn");
      }
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch (_) {}
      }, 3000);
    }, 500);
  };
  const vendaSelecionada = sales.find(s => s.id === nForm.vendaId);
  const clienteSel = customers.find(c => c.name === ((vendaSelecionada === null || vendaSelecionada === void 0 ? void 0 : vendaSelecionada.customer) || nForm.cliente));
  const enderecoDoCliente = clienteSel ? [clienteSel.rua && clienteSel.rua + (clienteSel.numero ? ", " + clienteSel.numero : ""), clienteSel.bairro, clienteSel.cidade && clienteSel.cidade + (clienteSel.uf ? " - " + clienteSel.uf : ""), clienteSel.cep && "CEP: " + clienteSel.cep].filter(Boolean).join(" · ") : "";
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      overflowX: "auto",
      marginBottom: 14,
      paddingBottom: 2,
      scrollbarWidth: "none"
    }
  }, STATUS.map(st => /*#__PURE__*/React.createElement("button", {
    key: st.id,
    onClick: () => setTab(st.id),
    style: {
      flexShrink: 0,
      padding: "8px 13px",
      borderRadius: 20,
      cursor: "pointer",
      fontFamily: "'Sora',sans-serif",
      fontWeight: 700,
      fontSize: 12,
      background: tab === st.id ? st.bg : "#1E2245",
      border: "1px solid " + (tab === st.id ? st.border : "#1E2245"),
      color: tab === st.id ? st.color : "#6a6d80"
    }
  }, st.emoji, " ", st.label, " ", counts[st.id] > 0 ? "(" + counts[st.id] + ")" : ""))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setNewPedido(true),
    style: {
      ...S.btn("primary"),
      flex: 1,
      justifyContent: "center",
      padding: "11px"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 15
  }), " Novo Pedido de Entrega"), onReload && /*#__PURE__*/React.createElement("button", {
    onClick: async () => {
      notify("Atualizando...");
      const ok = await onReload();
      if (ok) notify("Entregas atualizadas! ✓");
    },
    style: {
      ...S.btn("ghost"),
      padding: "11px 14px",
      fontSize: 13
    }
  }, "\uD83D\uDD04")), filtered.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: ST[tab].emoji,
    title: "Nenhum pedido " + ST[tab].label.toLowerCase(),
    desc: tab === "pedido" ? "Crie um novo pedido acima." : "Mova pedidos para esta fase."
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, filtered.map(ped => {
    const st = ST[ped.status];
    return /*#__PURE__*/React.createElement("div", {
      key: ped.id,
      style: {
        ...S.card,
        borderLeft: "4px solid " + st.color,
        border: "1px solid " + st.border,
        borderLeft: "4px solid " + st.color
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
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 3
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        fontWeight: 800,
        color: st.color
      }
    }, ped.numero), /*#__PURE__*/React.createElement("span", {
      style: {
        ...S.badge(st.color),
        fontSize: 10
      }
    }, st.emoji, " ", st.label), ped.tipo === "atacado" && /*#__PURE__*/React.createElement("span", {
      style: {
        ...S.badge("#f59e0b"),
        fontSize: 10
      }
    }, "\uD83D\uDCE6 Atacado")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        marginBottom: 2
      }
    }, ped.cliente), ped.telefone && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#6a6d80",
        display: "flex",
        alignItems: "center",
        gap: 5
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "phone",
      size: 11,
      color: "#6a6d80"
    }), ped.telefone)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 800,
        color: "#4ade80",
        flexShrink: 0,
        marginLeft: 8
      }
    }, fmt(ped.total))), ped.endereco && /*#__PURE__*/React.createElement("div", {
      style: {
        background: "#0A0C1E",
        border: "1px solid #1a1c2e",
        borderRadius: 8,
        padding: "7px 10px",
        marginBottom: 8,
        fontSize: 12,
        color: "#6a6d80",
        display: "flex",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "mapPin",
      size: 12,
      color: "#3b82f6"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        lineHeight: 1.4
      }
    }, ped.endereco)), ped.itens && ped.itens.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#5A6080",
        marginBottom: 8,
        lineHeight: 1.4
      }
    }, ped.itens.map(i => i.qty + "× " + i.name).join(", ")), obsEdit[ped.id] !== undefined ? /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("textarea", {
      value: obsEdit[ped.id],
      onChange: e => setObsEdit(o => ({
        ...o,
        [ped.id]: e.target.value
      })),
      placeholder: "Observa\xE7\xF5es...",
      style: {
        ...S.input,
        height: 60,
        resize: "none",
        verticalAlign: "top",
        fontSize: 13,
        lineHeight: 1.4
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        marginTop: 5
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setObsEdit(o => {
        const n = {
          ...o
        };
        delete n[ped.id];
        return n;
      }),
      style: {
        ...S.btn("ghost"),
        flex: 1,
        justifyContent: "center",
        padding: "7px",
        fontSize: 12
      }
    }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
      onClick: () => salvarObs(ped.id),
      style: {
        ...S.btn("primary"),
        flex: 1,
        justifyContent: "center",
        padding: "7px",
        fontSize: 12
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " Salvar"))) : ped.obs && /*#__PURE__*/React.createElement("div", {
      style: {
        background: "#0a0c14",
        border: "1px solid #f59e0b30",
        borderRadius: 8,
        padding: "7px 10px",
        marginBottom: 8,
        fontSize: 12,
        color: "#f59e0b",
        lineHeight: 1.4
      }
    }, "\uD83D\uDCAC ", ped.obs), (() => {
      const PG = {
        pago: {
          l: "✅ Pago",
          c: "#27ae60"
        },
        troco: {
          l: "💵 Levar Troco",
          c: "#f39c12"
        },
        maquina: {
          l: "📲 Levar Máquina",
          c: "#3b82f6"
        },
        troco_maquina: {
          l: "💵📲 Troco + Máq.",
          c: "#e67e22"
        }
      };
      const pg = PG[ped.pagamento || "pago"] || PG.pago;
      return /*#__PURE__*/React.createElement("div", {
        style: {
          marginBottom: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 10,
          color: "#5A6080",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 4
        }
      }, "Situa\xE7\xE3o do Pagamento"), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 5,
          flexWrap: "wrap"
        }
      }, Object.entries(PG).map(([k, v]) => /*#__PURE__*/React.createElement("button", {
        key: k,
        onClick: () => persistE(pedidos.map(p => p.id === ped.id ? {
          ...p,
          pagamento: k
        } : p)),
        style: {
          padding: "5px 10px",
          borderRadius: 20,
          border: "1px solid " + (ped.pagamento === k ? v.c + "80" : v.c + "25"),
          background: ped.pagamento === k ? v.c + "18" : "transparent",
          color: ped.pagamento === k ? v.c : "#6a6d80",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 11,
          fontWeight: ped.pagamento === k ? 700 : 500
        }
      }, v.l))));
    })(), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#3a3d50",
        marginBottom: 10
      }
    }, "Criado: ", ped.criadoData, " ", ped.criadoHora), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: "1px solid #14161e",
        paddingTop: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 5,
        flexWrap: "wrap",
        marginBottom: 7
      }
    }, STATUS.filter(s => s.id !== ped.status).map(s => /*#__PURE__*/React.createElement("button", {
      key: s.id,
      onClick: () => moverStatus(ped.id, s.id),
      style: {
        flexGrow: 1,
        padding: "7px 8px",
        borderRadius: 8,
        border: "1px solid " + s.border,
        background: s.bg,
        color: s.color,
        cursor: "pointer",
        fontFamily: "'Sora',sans-serif",
        fontWeight: 600,
        fontSize: 11,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4
      }
    }, s.emoji, " ", s.label))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setObsEdit(o => ({
        ...o,
        [ped.id]: ped.obs || ""
      })),
      style: {
        ...S.btn("ghost"),
        flex: 1,
        justifyContent: "center",
        padding: "7px",
        fontSize: 12
      }
    }, "\uD83D\uDCAC Obs"), /*#__PURE__*/React.createElement("button", {
      onClick: () => imprimirBrowser(ped),
      style: {
        ...S.btn("ghost"),
        flex: 1,
        justifyContent: "center",
        padding: "7px",
        fontSize: 12
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "printer",
      size: 13
    }), " Imprimir Pedido"), /*#__PURE__*/React.createElement("button", {
      onClick: () => excluirPedido(ped.id),
      style: {
        ...S.btn("danger"),
        padding: "7px 9px"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trash",
      size: 13
    })))));
  })), newPedido && /*#__PURE__*/React.createElement(Sheet, {
    onClose: () => setNewPedido(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      marginBottom: 18
    }
  }, "\uD83D\uDE9A Novo Pedido de Entrega"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 6
    }
  }, "Importar de uma Venda (opcional)"), /*#__PURE__*/React.createElement("select", {
    style: S.input,
    value: nForm.vendaId,
    onChange: e => {
      const v = sales.find(s => s.id === e.target.value);
      if (v) {
        const cli = customers.find(c => c.name === v.customer);
        const end = cli ? [cli.rua && cli.rua + (cli.numero ? ", " + cli.numero : ""), cli.bairro, cli.cidade && cli.cidade + (cli.uf ? " - " + cli.uf : ""), cli.cep && "CEP: " + cli.cep].filter(Boolean).join(" · ") : "";
        setNForm(f => ({
          ...f,
          vendaId: e.target.value,
          cliente: v.customer,
          telefone: (cli === null || cli === void 0 ? void 0 : cli.phone) || "",
          endereco: end
        }));
      } else setNF("vendaId", "");
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "\u2014 Selecionar venda \u2014"), sales.slice(0, 50).map(s => /*#__PURE__*/React.createElement("option", {
    key: s.id,
    value: s.id
  }, s.date, " \xB7 ", s.customer, " \xB7 ", fmt(s.total))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Cliente *"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    placeholder: "Nome do cliente",
    value: nForm.cliente,
    onChange: e => setNF("cliente", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Telefone"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    type: "tel",
    placeholder: "(00) 90000-0000",
    value: nForm.telefone,
    onChange: e => setNF("telefone", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Endere\xE7o"), /*#__PURE__*/React.createElement("textarea", {
    value: nForm.endereco,
    onChange: e => setNF("endereco", e.target.value),
    placeholder: "Rua, n\xFAmero, bairro, cidade...",
    style: {
      ...S.input,
      height: 68,
      resize: "none",
      verticalAlign: "top",
      fontSize: 13,
      lineHeight: 1.4
    }
  }), enderecoDoCliente && !nForm.endereco && /*#__PURE__*/React.createElement("button", {
    onClick: () => setNF("endereco", enderecoDoCliente),
    style: {
      ...S.btn("ghost"),
      width: "100%",
      justifyContent: "center",
      marginTop: 5,
      fontSize: 12,
      padding: "7px"
    }
  }, "\uD83D\uDCCD Usar endere\xE7o do cadastro")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Observa\xE7\xF5es"), /*#__PURE__*/React.createElement("textarea", {
    value: nForm.obs,
    onChange: e => setNF("obs", e.target.value),
    placeholder: "Ex: Ligar antes, port\xE3o azul...",
    style: {
      ...S.input,
      height: 60,
      resize: "none",
      verticalAlign: "top",
      fontSize: 13,
      lineHeight: 1.4
    }
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
    onClick: () => {
      setNewPedido(false);
      setNForm({
        cliente: "",
        telefone: "",
        endereco: "",
        obs: "",
        vendaId: ""
      });
    }
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: () => {
      if (!nForm.cliente.trim()) {
        notify("Informe o cliente!", "error");
        return;
      }
      criarPedido({
        ...nForm
      });
      setNForm({
        cliente: "",
        telefone: "",
        endereco: "",
        obs: "",
        vendaId: ""
      });
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "truck",
    size: 14
  }), " Criar Pedido"))));
}

// ── BACKUP LIST ────────────────────────────────────────────────────────────────
function BackupList({
  S,
  notify
}) {
  const [backups, setBackups] = useState([]);
  useState(() => {
    fetch('/api/backups').then(r => r.json()).then(d => setBackups(d)).catch(() => setBackups([]));
  });
  const restore = name => {
    if (!window.confirm('Restaurar "' + name + '"? Estado atual será salvo antes.')) return;
    fetch('/api/restore/' + encodeURIComponent(name), {
      method: 'POST'
    }).then(r => r.json()).then(d => {
      if (d.ok) {
        notify('Restaurado! Recarregando...', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else notify('Erro: ' + (d.error || 'falha'), 'error');
    }).catch(() => notify('Servidor offline', 'error'));
  };
  const download = name => window.open('/api/backup?name=' + encodeURIComponent(name), '_blank');
  if (backups.length === 0) return /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#3a3d50",
      padding: "8px 0"
    }
  }, "Nenhum backup encontrado no servidor.");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 180,
      overflowY: "auto"
    }
  }, backups.map(b => /*#__PURE__*/React.createElement("div", {
    key: b.name,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 0",
      borderBottom: "1px solid #14161e"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: "#e8e9f0"
    }
  }, b.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#5A6080"
    }
  }, new Date(b.date).toLocaleString("pt-BR"), " \xB7 ", Math.round(b.size / 1024), "KB")), /*#__PURE__*/React.createElement("button", {
    onClick: () => download(b.name),
    title: "Baixar",
    style: {
      ...S.btn("ghost"),
      padding: "4px 8px",
      fontSize: 11
    }
  }, "\u2B07\uFE0F"), /*#__PURE__*/React.createElement("button", {
    onClick: () => restore(b.name),
    title: "Restaurar",
    style: {
      ...S.btn("ghost"),
      padding: "4px 8px",
      fontSize: 11,
      color: "#f59e0b"
    }
  }, "\u21A9\uFE0F"))));
}

// ── FORNECEDORES ──────────────────────────────────────────────────────────────
const loadFornecedores = () => load("pdv_fornecedores", []);
const saveFornecedores = v => save("pdv_fornecedores", v);

console.log("[PDV] entregas.js carregado");
