/* PDV Pro — estoque.js
   Scanner de código de barras + ProductSheet
*/

function ScannerBase({
  S,
  onClose,
  onCode,
  title,
  subtitle
}) {
  const [status, setStatus] = useState("idle");
  const [manual, setManual] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detRef = useRef(null);
  const rafRef = useRef(null);
  const activeRef = useRef(false);
  const scannerDivRef = useRef(null);
  const stopAll = () => {
    var _detRef$current;
    activeRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if ((_detRef$current = detRef.current) !== null && _detRef$current !== void 0 && _detRef$current._quagga) {
      try {
        detRef.current._quagga.stop();
      } catch (_) {}
    }
  };
  const startScan = async () => {
    if (activeRef.current) return;
    activeRef.current = true;
    setStatus("scanning");
    const beep = () => {
      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.connect(g);
        g.connect(ac.destination);
        o.frequency.value = 1800;
        o.type = "square";
        g.gain.setValueAtTime(0.3, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
        o.start(ac.currentTime);
        o.stop(ac.currentTime + 0.12);
      } catch (_) {}
    };
    // Carrega Quagga2 — funciona em iOS Safari, Android, Chrome
    const loadQuagga = () => new Promise((res, rej) => {
      if (window.Quagga) {
        res(window.Quagga);
        return;
      }
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.7.4/dist/quagga.min.js";
      s.onload = () => res(window.Quagga);
      s.onerror = rej;
      document.head.appendChild(s);
    });
    try {
      const Quagga = await loadQuagga();
      // Garante que o elemento de vídeo existe
      await new Promise(r => setTimeout(r, 300));
      if (!scannerDivRef.current) {
        setStatus("error");
        return;
      }
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerDivRef.current,
          constraints: {
            facingMode: "environment",
            width: {
              ideal: 1280
            },
            height: {
              ideal: 720
            }
          }
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: 0,
        frequency: 10,
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "code_128_reader", "code_39_reader", "upc_reader", "upc_e_reader"]
        },
        locate: true
      }, err => {
        if (err) {
          console.error("Quagga init:", err);
          setStatus("error");
          return;
        }
        if (!activeRef.current) {
          Quagga.stop();
          return;
        }
        Quagga.start();
        detRef.current = {
          _quagga: Quagga
        };
      });
      Quagga.onDetected(result => {
        var _result$codeResult;
        const code = result === null || result === void 0 || (_result$codeResult = result.codeResult) === null || _result$codeResult === void 0 ? void 0 : _result$codeResult.code;
        if (code && activeRef.current) {
          Quagga.stop();
          stopAll();
          beep();
          onCode(code);
        }
      });
    } catch (e) {
      console.error("Scanner error:", e);
      setStatus("error");
      activeRef.current = false;
    }
  };
  const handleClose = () => {
    stopAll();
    onClose();
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 3000,
      background: "#000",
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "rgba(0,0,0,.85)",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      color: "#fff"
    }
  }, "\uD83D\uDCF7 ", title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#4A5BC4",
      marginTop: 2
    }
  }, subtitle)), /*#__PURE__*/React.createElement("button", {
    onClick: handleClose,
    style: {
      background: "#ffffff20",
      border: "none",
      color: "#fff",
      borderRadius: 8,
      padding: "7px 14px",
      cursor: "pointer",
      fontFamily: "inherit",
      fontWeight: 600,
      fontSize: 13
    }
  }, "Fechar")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }
  }, status === "idle" && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 48,
      marginBottom: 12
    }
  }, "\uD83D\uDCF7"), /*#__PURE__*/React.createElement("button", {
    onClick: startScan,
    style: {
      ...S.btn("primary"),
      padding: "12px 28px",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    size: 16
  }), " Ativar C\xE2mera")), status === "scanning" && /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      flex: 1,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("video", {
    ref: videoRef,
    style: {
      display: "none"
    },
    playsInline: true,
    muted: true,
    autoPlay: true
  }), /*#__PURE__*/React.createElement("div", {
    ref: scannerDivRef,
    id: "scanner-container",
    style: {
      width: "100%",
      height: "100%",
      position: "absolute",
      inset: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 260,
      height: 110,
      border: "2px solid #22d3ee",
      borderRadius: 8,
      boxShadow: "0 0 0 2000px rgba(0,0,0,.5)",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 2,
      top: "40%",
      background: "linear-gradient(90deg,transparent,#22d3ee,transparent)",
      animation: "scanline 1.5s ease-in-out infinite"
    }
  })))), status === "error" && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 40,
      marginBottom: 10
    }
  }, "\u26A0\uFE0F"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#F07030",
      fontSize: 12
    }
  }, "C\xE2mera indispon\xEDvel. Use o campo abaixo."))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 18px 32px",
      background: "rgba(0,0,0,.92)",
      borderTop: "1px solid #1a1c2e",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#6a6d80",
      marginBottom: 8,
      fontWeight: 600
    }
  }, "Leitor USB ou digitar manualmente:"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    style: {
      ...S.input,
      flex: 1,
      background: "#111318",
      fontSize: 16,
      letterSpacing: 2
    },
    placeholder: "0000000000000",
    value: manual,
    onChange: e => setManual(e.target.value),
    onKeyDown: e => e.key === "Enter" && manual.trim() && (stopAll(), onCode(manual.trim())),
    inputMode: "numeric"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => manual.trim() && (stopAll(), onCode(manual.trim())),
    disabled: !manual.trim(),
    style: {
      ...S.btn("primary"),
      padding: "10px 18px",
      flexShrink: 0,
      opacity: manual.trim() ? 1 : 0.4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 16
  })))), /*#__PURE__*/React.createElement("style", {
    dangerouslySetInnerHTML: {
      __html: "@keyframes scanline{0%,100%{top:10%}50%{top:80%}}"
    }
  }));
}

// ── PRODUCT SHEET ──────────────────────────────────────────────────────────────
function ProductSheet({
  initial,
  onSave,
  onClose,
  S,
  prefillName,
  cats
}) {
  const [form, setForm] = useState({
    name: (initial === null || initial === void 0 ? void 0 : initial.name) || prefillName || "",
    category: (initial === null || initial === void 0 ? void 0 : initial.category) || "Outros",
    price: (initial === null || initial === void 0 ? void 0 : initial.price) || "",
    priceAtacado: (initial === null || initial === void 0 ? void 0 : initial.priceAtacado) || "",
    atacadoHabilitado: (initial === null || initial === void 0 ? void 0 : initial.atacadoHabilitado) || false,
    costPrice: (initial === null || initial === void 0 ? void 0 : initial.costPrice) || "",
    comissaoProd: (initial === null || initial === void 0 ? void 0 : initial.comissaoProd) || "",
    stock: (initial === null || initial === void 0 ? void 0 : initial.stock) ?? "",
    minStock: (initial === null || initial === void 0 ? void 0 : initial.minStock) || "",
    unit: (initial === null || initial === void 0 ? void 0 : initial.unit) || "unid",
    barcode: (initial === null || initial === void 0 ? void 0 : initial.barcode) || "",
    photo: (initial === null || initial === void 0 ? void 0 : initial.photo) || "",
    description: (initial === null || initial === void 0 ? void 0 : initial.description) || ""
  });
  const set = (k, v) => setForm(f => ({
    ...f,
    [k]: v
  }));
  const photoRef = useRef(null);
  const photoGalRef = useRef(null);
  const [scanBC, setScanBC] = useState(false);
  const handlePhoto = async e => {
    var _e$target$files;
    const file = (_e$target$files = e.target.files) === null || _e$target$files === void 0 ? void 0 : _e$target$files[0];
    if (!file) return;
    const key = localStorage.getItem('_sb_key') || "";
    // Tenta upload para Supabase Storage
    if (key && SUPABASE_URL) {
      try {
        // Comprime a imagem antes de enviar
        const compressed = await new Promise(res => {
          const img = new Image();
          const url = URL.createObjectURL(file);
          img.onload = () => {
            const MAX = 800;
            let w = img.width,
              h = img.height;
            if (w > MAX) {
              h = Math.round(h * MAX / w);
              w = MAX;
            }
            if (h > MAX) {
              w = Math.round(w * MAX / h);
              h = MAX;
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            canvas.toBlob(blob => res(blob), 'image/jpeg', 0.75);
            URL.revokeObjectURL(url);
          };
          img.src = url;
        });
        const filename = `prod_${Date.now()}.jpg`;
        const r = await fetch(`${SUPABASE_URL}/storage/v1/object/fotos/${filename}`, {
          method: 'POST',
          headers: {
            'apikey': key,
            'Authorization': 'Bearer ' + key,
            'Content-Type': 'image/jpeg',
            'x-upsert': 'true'
          },
          body: compressed
        });
        if (r.ok) {
          const url = `${SUPABASE_URL}/storage/v1/object/public/fotos/${filename}`;
          set("photo", url);
          return;
        }
      } catch (err) {
        console.warn('[PDV] Storage falhou, usando base64:', err.message);
      }
    }
    // Fallback: base64 (comprimido)
    const r = new FileReader();
    r.onload = async ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 600;
        let w = img.width,
          h = img.height;
        if (w > MAX) {
          h = Math.round(h * MAX / w);
          w = MAX;
        }
        if (h > MAX) {
          w = Math.round(w * MAX / h);
          h = MAX;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        set("photo", canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = ev.target.result;
    };
    r.readAsDataURL(file);
  };
  const margemPDV = form.price && form.costPrice && +form.costPrice > 0 ? ((+form.price - +form.costPrice) / +form.costPrice * 100).toFixed(1) : null;
  const margemAtac = form.priceAtacado && form.costPrice && +form.costPrice > 0 ? ((+form.priceAtacado - +form.costPrice) / +form.costPrice * 100).toFixed(1) : null;
  return /*#__PURE__*/React.createElement(Sheet, {
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 700,
      marginBottom: 18
    }
  }, initial ? "✏️ Editar Produto" : "📦 Novo Produto"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 6
    }
  }, "Foto"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 68,
      height: 68,
      borderRadius: 10,
      border: "2px dashed #1a1c2e",
      overflow: "hidden",
      flexShrink: 0,
      background: "#0A0C1E",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, form.photo ? /*#__PURE__*/React.createElement("img", {
    src: form.photo,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    },
    alt: ""
  }) : /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 22,
    color: "#252845"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    ref: photoRef,
    type: "file",
    accept: "image/*",
    capture: "environment",
    style: {
      display: "none"
    },
    onChange: handlePhoto
  }), /*#__PURE__*/React.createElement("input", {
    ref: photoGalRef,
    type: "file",
    accept: "image/*",
    style: {
      display: "none"
    },
    onChange: handlePhoto
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var _photoRef$current;
      return (_photoRef$current = photoRef.current) === null || _photoRef$current === void 0 ? void 0 : _photoRef$current.click();
    },
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center",
      padding: "8px",
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    size: 13
  }), " C\xE2mera"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      var _photoGalRef$current;
      return (_photoGalRef$current = photoGalRef.current) === null || _photoGalRef$current === void 0 ? void 0 : _photoGalRef$current.click();
    },
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center",
      padding: "8px",
      fontSize: 11
    }
  }, "\uD83D\uDDBC\uFE0F Galeria")), form.photo && /*#__PURE__*/React.createElement("button", {
    onClick: () => set("photo", ""),
    style: {
      ...S.btn("danger"),
      justifyContent: "center",
      padding: "6px",
      fontSize: 11
    }
  }, "Remover")))), /*#__PURE__*/React.createElement("div", {
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
    placeholder: "Ex: Cadeado 50mm",
    value: form.name,
    onChange: e => set("name", e.target.value),
    autoFocus: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Descri\xE7\xE3o"), /*#__PURE__*/React.createElement("textarea", {
    value: form.description,
    onChange: e => set("description", e.target.value),
    placeholder: "Detalhes, marca, modelo...",
    style: {
      ...S.input,
      height: 48,
      resize: "none",
      verticalAlign: "top",
      fontSize: 12,
      lineHeight: 1.4
    }
  })), /*#__PURE__*/React.createElement("div", {
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
  }, "Categoria"), /*#__PURE__*/React.createElement("select", {
    style: S.input,
    value: form.category,
    onChange: e => set("category", e.target.value)
  }, (cats || loadCats()).map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Unidade"), /*#__PURE__*/React.createElement("select", {
    style: S.input,
    value: form.unit,
    onChange: e => set("unit", e.target.value)
  }, UNITS.map(u => /*#__PURE__*/React.createElement("option", {
    key: u
  }, u))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Pre\xE7o de Custo (R$)"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      border: "1px solid #22d3ee30"
    },
    type: "number",
    step: "0.01",
    min: "0",
    placeholder: "0,00",
    value: form.costPrice,
    onChange: e => set("costPrice", e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => set("atacadoHabilitado", !form.atacadoHabilitado),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "100%",
      padding: "11px 14px",
      borderRadius: 10,
      border: "1px solid " + (form.atacadoHabilitado ? "#f59e0b60" : "#1E2245"),
      background: form.atacadoHabilitado ? "#f59e0b12" : "#0A0C1E",
      cursor: "pointer",
      fontFamily: "'Sora',sans-serif",
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 20,
      height: 20,
      borderRadius: 10,
      border: "2px solid " + (form.atacadoHabilitado ? "#f59e0b" : "#252845"),
      background: form.atacadoHabilitado ? "#f59e0b" : "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all .2s",
      flexShrink: 0
    }
  }, form.atacadoHabilitado && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 4,
      background: "#000"
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: form.atacadoHabilitado ? "#f59e0b" : "#6a6d80"
    }
  }, "\uD83D\uDCE6 Habilitar Venda Atacado"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6080",
      marginTop: 1
    }
  }, form.atacadoHabilitado ? "Produto aparece na aba Venda Atacado" : "Produto não aparece na Venda Atacado")))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      fontWeight: 700,
      color: "#E8682A",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
      marginTop: 4
    }
  }, "Pre\xE7os de Venda"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5,
      color: "#E8682A"
    }
  }, "\uD83C\uDFEA PDV / Varejo *"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      border: "1px solid #E8682A40"
    },
    type: "number",
    step: "0.01",
    min: "0",
    placeholder: "0,00",
    value: form.price,
    onChange: e => set("price", e.target.value)
  }), margemPDV && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#4ade80",
      marginTop: 3
    }
  }, "Margem: ", margemPDV, "%")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5,
      color: "#f59e0b"
    }
  }, "\uD83D\uDCE6 Atacado"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      border: "1px solid #f59e0b40"
    },
    type: "number",
    step: "0.01",
    min: "0",
    placeholder: "0,00",
    value: form.priceAtacado,
    onChange: e => set("priceAtacado", e.target.value)
  }), margemAtac && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#f59e0b",
      marginTop: 3
    }
  }, "Margem: ", margemAtac, "%"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5,
      color: "#4A5BC4"
    }
  }, "\uD83D\uDCB0 Comiss\xE3o do Produto (%)"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      border: "1px solid #22d3ee30"
    },
    type: "number",
    step: "0.1",
    min: "0",
    max: "100",
    placeholder: "Ex: 5 (para 5%)",
    value: form.comissaoProd,
    onChange: e => set("comissaoProd", e.target.value)
  }), form.comissaoProd && +form.comissaoProd > 0 && form.priceAtacado && +form.priceAtacado > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#4A5BC4",
      marginTop: 3
    }
  }, "= ", fmt(+form.priceAtacado * +form.comissaoProd / 100), " por unidade vendida no atacado")), /*#__PURE__*/React.createElement("div", {
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
  }, "Estoque *"), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    type: "number",
    min: "0",
    placeholder: "0",
    value: form.stock,
    onChange: e => set("stock", e.target.value)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "Estoque M\xEDn."), /*#__PURE__*/React.createElement("input", {
    style: S.input,
    type: "number",
    min: "0",
    placeholder: "0",
    value: form.minStock,
    onChange: e => set("minStock", e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 5
    }
  }, "C\xF3digo de Barras / SKU"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      paddingLeft: 34
    },
    placeholder: "Ex: 7891234567890",
    value: form.barcode,
    onChange: e => set("barcode", e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 10,
      top: "50%",
      transform: "translateY(-50%)",
      color: "#5A6080"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "barcode",
    size: 15
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setScanBC(true),
    style: {
      ...S.btn("ghost"),
      padding: "10px 13px",
      border: "1px solid #22d3ee40",
      color: "#4A5BC4",
      background: "#22d3ee10",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "camera",
    size: 17,
    color: "#4A5BC4"
  }))), form.barcode && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: 11,
      color: "#4ade80"
    }
  }, "\u2713 C\xF3digo: ", form.barcode), scanBC && /*#__PURE__*/React.createElement(ScannerBase, {
    S: S,
    title: "Bipar C\xF3digo",
    subtitle: "Aponte para o c\xF3digo do produto",
    onCode: code => {
      set("barcode", code);
      setScanBC(false);
    },
    onClose: () => setScanBC(false)
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

// ── CUSTOMER SHEET ─────────────────────────────────────────────────────────────

console.log("[PDV] estoque.js carregado");
