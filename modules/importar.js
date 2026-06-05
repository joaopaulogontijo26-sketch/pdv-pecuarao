/* PDV Pro — importar.js
   ImportarPage — importação de NF-e XML
*/

function ImportarPage({
  S,
  products,
  persistP,
  notify
}) {
  const [parsed, setParsed] = useState([]);
  const [step, setStep] = useState("input");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const fileRef = useRef(null);
  const getCategoria = nome => {
    const d = nome.toLowerCase();
    if (/torneira|valvula|reparo|sifao|tubo|hidro|ducha|chuveiro|registro/.test(d)) return "Hidráulica";
    if (/interruptor|tomada|fio|cabo|disjuntor|lampada|led/.test(d)) return "Elétrico";
    if (/broca|martelo|serra|chave|alicate|parafuso|prego|porca|marreta/.test(d)) return "Ferramentas";
    if (/cadeado|fechadura|gancho|pitao|suporte/.test(d)) return "Ferragens";
    if (/soda|cola|varal|trincha|rolo|pincel|tinta/.test(d)) return "Limpeza";
    if (/linha|pesca|anzol/.test(d)) return "Pesca";
    if (/macarico|botijao/.test(d)) return "Construção";
    if (/suporte.*tv|rack|antena/.test(d)) return "Eletrônicos";
    return "Outros";
  };
  const makeProduto = (desc, unidade, qtd, precoNF, barcode) => {
    const CX = /\bC(\d{1,4})\b/i;
    const DZ = {
      DZ: 12
    };
    let unitsPerBox = DZ[unidade.toUpperCase()] || 1;
    const cxM = desc.match(CX);
    if (cxM) unitsPerBox = parseInt(cxM[1]);
    const precoUnitario = unitsPerBox > 1 ? +(precoNF / unitsPerBox).toFixed(2) : precoNF;
    const estoque = Math.round(qtd * unitsPerBox);
    const nome = desc.replace(/^\d{3,8}\s*/, "").replace(/\bC\d{1,4}\b/i, "").replace(/\s{2,}/g, " ").trim().slice(0, 40);
    return {
      id: uid(),
      nomeOriginal: desc,
      nome,
      categoria: getCategoria(nome),
      quantidade: qtd,
      unidade: unidade.toUpperCase(),
      unitsPerBox,
      precoUnitario,
      estoque,
      barcode: barcode || "",
      observacao: unitsPerBox > 1 ? unitsPerBox + " un/emb → " + fmt(precoUnitario) + "/un" : "",
      selected: true
    };
  };
  const parseXML = xmlText => {
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    const dets = doc.querySelectorAll("det");
    if (dets.length === 0) throw new Error("XML sem itens <det>.");
    const produtos = [];
    const seen = new Set();
    dets.forEach(det => {
      const prod = det.querySelector("prod");
      if (!prod) return;
      const xProd = prod.querySelector("xProd");
      const qCom = prod.querySelector("qCom");
      const vUnCom = prod.querySelector("vUnCom");
      const uCom = prod.querySelector("uCom");
      const cEAN = prod.querySelector("cEAN");
      if (!xProd) return;
      const desc = xProd.textContent.trim();
      const unid = (uCom ? uCom.textContent.trim() : "UN").toUpperCase();
      const qtd = parseFloat((qCom ? qCom.textContent : "1").replace(",", ".")) || 1;
      const preco = parseFloat((vUnCom ? vUnCom.textContent : "0").replace(",", ".")) || 0;
      if (preco <= 0) return;
      const key = desc.toLowerCase().replace(/\s+/g, "").slice(0, 20);
      if (seen.has(key)) return;
      seen.add(key);
      const barcode = cEAN && cEAN.textContent !== "SEM GTIN" ? cEAN.textContent : "";
      produtos.push(makeProduto(desc, unid, qtd, preco, barcode));
    });
    if (produtos.length === 0) throw new Error("Nenhum produto no XML.");
    return produtos;
  };
  const parseCSV = text => {
    var _text$split$, _text$split$2;
    const sep = (_text$split$ = text.split("\n")[0]) !== null && _text$split$ !== void 0 && _text$split$.includes(";") ? ";" : (_text$split$2 = text.split("\n")[0]) !== null && _text$split$2 !== void 0 && _text$split$2.includes("\t") ? "\t" : ",";
    const linhas = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (linhas.length < 2) throw new Error("CSV vazio.");
    const header = linhas[0].toLowerCase().split(sep).map(h => h.replace(/"/g, "").trim());
    const iN = header.findIndex(h => /nome|descri|produto/.test(h));
    const iP = header.findIndex(h => /preco|valor|vunit|price/.test(h));
    const iQ = header.findIndex(h => /qtd|quant|estoque|qty/.test(h));
    const iU = header.findIndex(h => /unid|unit/.test(h));
    const produtos = [];
    const seen = new Set();
    for (let i = iN >= 0 ? 1 : 0; i < linhas.length; i++) {
      const cols = linhas[i].split(sep).map(p => p.replace(/"/g, "").trim());
      const clean = idx => idx >= 0 && cols[idx] ? cols[idx] : "";
      const num = idx => parseFloat(clean(idx).replace(",", ".")) || 0;
      let desc, preco, qtd, unid;
      if (iN >= 0 && iP >= 0) {
        desc = clean(iN);
        preco = num(iP);
        qtd = iQ >= 0 ? num(iQ) || 1 : 1;
        unid = iU >= 0 ? clean(iU) || "UN" : "UN";
      } else {
        desc = cols.find(p => isNaN(parseFloat(p.replace(",", "."))) && p.length > 3) || "";
        const nums = cols.map(p => parseFloat(p.replace(",", ".")) || 0).filter(n => n > 0);
        preco = nums.length > 0 ? Math.min(...nums) : 0;
        qtd = 1;
        unid = "UN";
      }
      if (!desc || desc.length < 2 || preco <= 0) continue;
      const key = desc.toLowerCase().replace(/\s+/g, "").slice(0, 20);
      if (seen.has(key)) continue;
      seen.add(key);
      produtos.push(makeProduto(desc, unid, qtd, preco, ""));
    }
    if (produtos.length === 0) throw new Error("Nenhum produto no CSV.");
    return produtos;
  };

  // ── PARSER DE ORÇAMENTO PDF (formato Grupo Bartolomeu / atacadista) ──────────
  // Formato: COD-X DESCRICAO / MARCA: X COD NCM: X / COD.BARRAS: X / I/S UN QTD DESC% LIQUIDO UNIT. TOTAL
  const parseOrcamentoPDF = text => {
    const produtos = [];
    const linhas = text.split("\n").map(l => l.trim()).filter(Boolean);
    let i = 0;

    // Padrão de linha de dados: S/I? UNIDADE QTD PERC% LIQUIDO UNIT TOTAL
    // Ex: "S DZ 1 1,00 % 87,16 7,26 87,16" ou "UN 25 1,00 % 4,73 4,73 118,18"
    const reData = /^(S\s+I?\s*|I\s+)?(DZ|PT|CX|UN|KG|MC|RL|PC|MT|LT|MR|GL)\s+(\d+)\s+([\d,]+)\s*%\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)$/i;

    // Padrão de código: "120607-0 DESCRICAO..."
    const reCod = /^(\d{3,6}-\d)\s+(.+)$/;
    const pNum = v => parseFloat((v || "0").replace(/\./g, "").replace(",", "."));
    const UN_MULT = {
      DZ: 12,
      PT: 1,
      CX: 1,
      UN: 1,
      KG: 1,
      MC: 1,
      RL: 1,
      PC: 1,
      MT: 1,
      LT: 1,
      MR: 1,
      GL: 1
    };
    while (i < linhas.length) {
      const linha = linhas[i];
      const mCod = linha.match(reCod);
      if (mCod) {
        const cod = mCod[1];
        const desc = mCod[2].trim();
        let marca = "",
          barcode = "",
          un = "UN",
          qtd = 1,
          unitPrice = 0,
          liquido = 0;
        i++;

        // Lê linhas seguintes até encontrar linha de dados
        while (i < linhas.length) {
          const l = linhas[i];
          // Linha de MARCA
          if (l.startsWith("MARCA:")) {
            marca = l.replace(/^MARCA:\s*/, "").split(/\s+COD\s+NCM:/)[0].trim();
            i++;
            continue;
          }
          // Linha de COD.BARRAS — pega o menor código (EAN-13 sem leading digit)
          if (l.startsWith("COD.BARRAS:")) {
            const bcs = l.replace("COD.BARRAS:", "").trim().split(/\s+/);
            // Prefere o código de 13 dígitos
            const bc13 = bcs.find(b => /^\d{13}$/.test(b));
            const bc = bc13 || bcs.find(b => /^\d{8,}$/.test(b)) || "";
            barcode = bc;
            i++;
            // Linha seguinte pode ser segundo barcode (começa com número, sem label)
            if (i < linhas.length && /^\d{8,13}$/.test(linhas[i])) {
              i++;
            }
            continue;
          }
          // Linha de dados: UN QTD DESC% LIQUIDO UNIT TOTAL
          const mD = l.match(reData);
          if (mD) {
            un = (mD[2] || "UN").toUpperCase();
            qtd = parseInt(mD[3]) || 1;
            liquido = pNum(mD[5]);
            unitPrice = pNum(mD[6]);
            i++;
            break;
          }
          // Se linha parece ser próximo produto ou rodapé, para
          if (reCod.test(l) || l.startsWith("Qtd.") || l.startsWith("ORCA") || l.startsWith("PRECO")) {
            break;
          }
          i++;
        }
        if (unitPrice <= 0 && liquido > 0) unitPrice = liquido;
        if (unitPrice <= 0) continue;

        // Calcula unidades por embalagem e estoque
        const multEmb = UN_MULT[un] || 1;
        const estoqueTotal = qtd * multEmb;
        const unPDV = un === "DZ" ? "unid" : un === "KG" ? "kg" : un === "MT" ? "m" : "unid";

        // Nome limpo: remove códigos do final (C6, C24, C100, etc.)
        const nome = desc.replace(/\s+C\d+$/, "").replace(/COD NCM:.*/, "").trim().slice(0, 60);
        produtos.push({
          id: uid(),
          nomeOriginal: desc,
          nome,
          marca,
          categoria: getCategoria(nome),
          quantidade: qtd,
          unidade: un,
          unitsPerBox: multEmb,
          precoUnitario: unitPrice,
          estoque: estoqueTotal,
          barcode,
          codigoProduto: cod,
          observacao: multEmb > 1 ? multEmb + "un/emb → R$" + unitPrice.toFixed(2) + "/un" : "",
          selected: true
        });
      } else {
        i++;
      }
    }
    if (produtos.length === 0) throw new Error("Nenhum produto encontrado. Verifique se é um orçamento no formato correto.");
    return produtos;
  };
  const parseTXT = text => {
    const LIXO = /^[-=*.]{4,}$|^[A-Z]{30,}$|DANFE|CHAVE DE ACESSO|CNPJ|FONE|PROTOCOLO|TRANSPORTADOR|COMPROVANTE|BOLETO|VENCIMENTO|ASSINATURA|DECLARO|EVITE|PAGAVEL|INSCRICAO|RESERVADO|IMPRESSO|BASE DE|DADOS DO PRODUTO|DESCRICAO DOS|PESO BRUTO/i;
    const rawLines = text.split("\n").map(l => l.trim()).filter(l => l.length > 1 && !LIXO.test(l));
    const SOLO_PRICE = /^\d{1,6}[,.]\d{2}$/;
    const STARTS_PROD = /^\d{4,8}\s+[A-Z]/;
    const HAS_COMP = /\b(UN|CX|DZ|PT|SC|KG|%)\s+[\d,.]+\s+[\d,.]+/i;
    const lines = [];
    rawLines.forEach(cur => {
      if (SOLO_PRICE.test(cur) && lines.length > 0) {
        lines[lines.length - 1] += " " + cur;
      } else if (!STARTS_PROD.test(cur) && lines.length > 0 && !HAS_COMP.test(lines[lines.length - 1]) && cur.length < 60 && !/^\d{4,}/.test(cur)) {
        lines[lines.length - 1] += " " + cur;
      } else {
        lines.push(cur);
      }
    });
    const RE = /^(?:\d{3,8}\s+)?(.+?)\s+(UN|CX|DZ|PT|SC|KG|LT|MT|PC|PR|GR|ML|%)\s+([\d]+[,.]?[\d]*)\s+([\d]+[,.]\d{2})\s*$/i;
    const produtos = [];
    const seen = new Set();
    lines.forEach(line => {
      if (line.length < 8) return;
      const m = line.match(RE);
      if (!m) return;
      const [, desc, unid, qtdStr, precoStr] = m;
      if (!desc || desc.length < 3) return;
      const key = desc.toLowerCase().replace(/\s+/g, "").slice(0, 20);
      if (seen.has(key)) return;
      seen.add(key);
      const qtd = parseFloat(qtdStr.replace(",", ".")) || 1;
      const preco = parseFloat(precoStr.replace(",", ".")) || 0;
      if (preco <= 0) return;
      produtos.push(makeProduto(desc.trim(), unid, qtd, preco, ""));
    });
    if (produtos.length === 0) throw new Error("Nenhum produto reconhecido. Formato:\nDESCRIÇÃO UNIDADE QTD PREÇO\nEx: CADEADO 50MM UN 5,00 193,70");
    return produtos;
  };
  const parsePDF = async file => {
    setStatusMsg("Carregando PDF.js...");
    if (!window.pdfjsLib) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        s.onload = res;
        s.onerror = () => rej(new Error("Falha ao carregar PDF.js"));
        document.head.appendChild(s);
      });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
    setStatusMsg("Extraindo texto...");
    const buf = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({
      data: buf
    }).promise;
    const np = Math.min(pdf.numPages, 10);
    const pageTexts = [];
    for (let p = 1; p <= np; p++) {
      setStatusMsg("Lendo pág. " + p + "/" + np + "...");
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      const byY = {};
      tc.items.forEach(item => {
        const y = Math.round(item.transform[5]);
        if (!byY[y]) byY[y] = [];
        byY[y].push(item.str);
      });
      const sortedY = Object.keys(byY).map(Number).sort((a, b) => b - a);
      pageTexts.push(...sortedY.map(y => byY[y].join(" ").trim()).filter(Boolean));
    }
    const fullText = pageTexts.join("\n");
    // Detecta orçamento pelo conteúdo (tem COD NCM: ou COD.BARRAS:)
    if (fullText.includes("COD NCM:") || fullText.includes("COD.BARRAS:") || fullText.includes("ORCAMENTO Nº") || fullText.includes("ORÇAMENTO")) {
      return parseOrcamentoPDF(fullText);
    }
    return parseTXT(fullText);
  };
  const handleFile = async e => {
    var _e$target$files2;
    const file = (_e$target$files2 = e.target.files) === null || _e$target$files2 === void 0 ? void 0 : _e$target$files2[0];
    if (!file) return;
    e.target.value = "";
    const name = file.name.toLowerCase();
    setLoading(true);
    setStatusMsg("Lendo arquivo...");
    try {
      let produtos = [];
      if (name.endsWith(".xml")) {
        const text = await file.text();
        produtos = parseXML(text);
        notify(produtos.length + " item(ns) do XML ✓");
      } else if (name.endsWith(".csv")) {
        const text = await file.text();
        produtos = parseCSV(text);
        notify(produtos.length + " item(ns) do CSV ✓");
      } else if (name.endsWith(".pdf")) {
        produtos = await parsePDF(file);
        notify(produtos.length + " item(ns) do PDF ✓");
      } else if (name.endsWith(".txt")) {
        const text = await file.text();
        produtos = parseTXT(text);
        notify(produtos.length + " item(ns) do TXT ✓");
      } else throw new Error("Use XML, CSV, PDF ou TXT.");
      setParsed(produtos);
      setStep("review");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
      setStatusMsg("");
    }
  };
  const importarSelecionados = () => {
    const sel = parsed.filter(p => p.selected);
    if (sel.length === 0) {
      notify("Selecione ao menos um.", "warn");
      return;
    }
    let novos = 0,
      atualizados = 0,
      ignorados = 0;
    const np = [...products];
    sel.forEach(p => {
      // Busca por código de barras primeiro (mais preciso), depois por nome
      let idx = -1;
      if (p.barcode) idx = np.findIndex(x => x.barcode && x.barcode.trim() === p.barcode.trim());
      if (idx < 0) idx = np.findIndex(x => x.name.toLowerCase().trim() === p.nome.toLowerCase().trim());
      // Busca parcial: nome do produto contém o nome da NF ou vice-versa
      if (idx < 0) {
        const nNorm = p.nome.toLowerCase().replace(/\s+/g, " ").trim();
        idx = np.findIndex(x => {
          const xNorm = x.name.toLowerCase().replace(/\s+/g, " ").trim();
          return xNorm.includes(nNorm) || nNorm.includes(xNorm);
        });
      }
      if (idx >= 0) {
        // Produto existe — atualiza estoque e preço custo
        np[idx] = {
          ...np[idx],
          costPrice: p.precoUnitario,
          // preço NF é o custo
          stock: np[idx].stock + p.estoque,
          barcode: p.barcode || np[idx].barcode
        };
        atualizados++;
      } else {
        // Produto novo
        np.unshift({
          id: uid(),
          name: p.nome,
          category: p.categoria,
          price: 0,
          // varejo p/ preencher depois
          priceAtacado: 0,
          // atacado p/ preencher depois
          costPrice: p.precoUnitario,
          // custo = preço NF
          stock: p.estoque,
          unit: "unid",
          barcode: p.barcode || "",
          minStock: 0,
          photo: "",
          description: "",
          createdAt: Date.now()
        });
        novos++;
      }
    });
    persistP(np);
    notify(novos + " novo(s), " + atualizados + " atualizado(s) ✓");
    setStep("done");
    setParsed([]);
  };
  const saveEdit = idx => {
    setParsed(parsed.map((x, i) => i === idx ? {
      ...editForm,
      id: x.id,
      selected: x.selected
    } : x));
    setEditingIdx(null);
  };
  if (step === "done") return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      padding: "48px 20px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 64,
      marginBottom: 16
    }
  }, "\u2705"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 800,
      color: "#4ade80",
      marginBottom: 8
    }
  }, "Importa\xE7\xE3o conclu\xEDda!"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#5A6080",
      marginBottom: 28
    }
  }, "Produtos adicionados ao estoque."), /*#__PURE__*/React.createElement("button", {
    style: S.btn("primary"),
    onClick: () => setStep("input")
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "import",
    size: 14
  }), " Nova Importa\xE7\xE3o"));
  if (step === "review") return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700
    }
  }, "Revisar Produtos"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#5A6080",
      marginTop: 2
    }
  }, parsed.filter(p => p.selected).length, "/", parsed.length, " selecionados")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      padding: "7px 12px",
      fontSize: 12
    },
    onClick: () => setStep("input")
  }, "\u2190 Voltar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      padding: "9px 14px"
    },
    onClick: importarSelecionados
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "import",
    size: 14
  }), " Importar"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setParsed(p => p.map(x => ({
      ...x,
      selected: true
    }))),
    style: {
      ...S.btn("ghost"),
      padding: "6px 12px",
      fontSize: 12
    }
  }, "Sel. todos"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setParsed(p => p.map(x => ({
      ...x,
      selected: false
    }))),
    style: {
      ...S.btn("ghost"),
      padding: "6px 12px",
      fontSize: 12
    }
  }, "Desmarcar")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, parsed.map((prod, idx) => /*#__PURE__*/React.createElement("div", {
    key: prod.id,
    style: {
      ...S.card,
      borderLeft: "3px solid " + (prod.selected ? "#4ade80" : "#252845"),
      opacity: prod.selected ? 1 : 0.5
    }
  }, editingIdx === idx ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Nome"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      fontSize: 13
    },
    value: editForm.nome,
    onChange: e => setEditForm(f => ({
      ...f,
      nome: e.target.value
    }))
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Pre\xE7o Unit."), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      fontSize: 13
    },
    type: "number",
    step: "0.01",
    value: editForm.precoUnitario,
    onChange: e => setEditForm(f => ({
      ...f,
      precoUnitario: +e.target.value
    }))
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Estoque"), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      fontSize: 13
    },
    type: "number",
    value: editForm.estoque,
    onChange: e => setEditForm(f => ({
      ...f,
      estoque: +e.target.value
    }))
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Un./Emb."), /*#__PURE__*/React.createElement("input", {
    style: {
      ...S.input,
      fontSize: 13
    },
    type: "number",
    min: "1",
    value: editForm.unitsPerBox || 1,
    onChange: e => setEditForm(f => ({
      ...f,
      unitsPerBox: +e.target.value
    }))
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 4
    }
  }, "Categoria"), /*#__PURE__*/React.createElement("select", {
    style: {
      ...S.input,
      fontSize: 13
    },
    value: editForm.categoria,
    onChange: e => setEditForm(f => ({
      ...f,
      categoria: e.target.value
    }))
  }, loadCats().map(c => /*#__PURE__*/React.createElement("option", {
    key: c
  }, c))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center",
      fontSize: 13
    },
    onClick: () => setEditingIdx(null)
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      flex: 1,
      justifyContent: "center",
      fontSize: 13
    },
    onClick: () => saveEdit(idx)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13
  }), " Salvar"))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setParsed(p => p.map(x => x.id === prod.id ? {
      ...x,
      selected: !x.selected
    } : x)),
    style: {
      width: 22,
      height: 22,
      borderRadius: 6,
      border: "2px solid " + (prod.selected ? "#4ade80" : "#252845"),
      background: prod.selected ? "#4ade80" : "transparent",
      cursor: "pointer",
      flexShrink: 0,
      marginTop: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, prod.selected && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#0A0C1E",
      fontSize: 12,
      fontWeight: 900
    }
  }, "\u2713")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      marginBottom: 3
    }
  }, prod.nome), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6080",
      marginBottom: 5,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, prod.nomeOriginal), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: S.badge("#E8682A")
  }, fmt(prod.precoUnitario), "/un"), /*#__PURE__*/React.createElement("span", {
    style: S.badge("#4A5BC4")
  }, prod.estoque, " unid."), /*#__PURE__*/React.createElement("span", {
    style: S.badge("#a78bfa")
  }, prod.categoria), prod.unitsPerBox > 1 && /*#__PURE__*/React.createElement("span", {
    style: S.badge("#f59e0b")
  }, prod.unitsPerBox, " un/emb"), prod.barcode && /*#__PURE__*/React.createElement("span", {
    style: S.badge("#4ade80")
  }, "EAN: ", prod.barcode)), prod.observacao ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#5A6080",
      marginTop: 4
    }
  }, prod.observacao) : null), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setEditingIdx(idx);
      setEditForm({
        ...prod
      });
    },
    style: {
      ...S.btn("ghost"),
      padding: "6px 9px",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit",
    size: 14
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      paddingTop: 16,
      borderTop: "1px solid #1a1c2e",
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("ghost"),
      flex: 1,
      justifyContent: "center"
    },
    onClick: () => setStep("input")
  }, "\u2190 Voltar"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...S.btn("primary"),
      flex: 1,
      justifyContent: "center",
      padding: "12px"
    },
    onClick: importarSelecionados
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "import",
    size: 15
  }), " Importar ", parsed.filter(p => p.selected).length)));
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginBottom: 14,
      padding: 16,
      borderColor: "#22d3ee30",
      background: "linear-gradient(135deg,#0a1520,#0f1117)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: "#4A5BC4",
      marginBottom: 10
    }
  }, "\uD83D\uDCE5 Importar NF-e / Or\xE7amento"), [["🗂️", "XML NF-e (SEFAZ) — lê campos estruturados da nota"], ["📊", "CSV — detecta separador e colunas automaticamente"], ["📄", "PDF — extrai texto via PDF.js (DANFE ou Orçamento atacadista)"], ["📝", "TXT — DESCRIÇÃO UNIDADE QTD PREÇO por linha"], ["📦", "Detecta C24, C200... e divide preço por unidade"]].map(([ic, tx]) => /*#__PURE__*/React.createElement("div", {
    key: tx,
    style: {
      display: "flex",
      gap: 8,
      marginBottom: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      flexShrink: 0
    }
  }, ic), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "#6a6d80",
      lineHeight: 1.4
    }
  }, tx)))), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: ".xml,.csv,.pdf,.txt,text/xml,text/csv,application/pdf,text/plain",
    style: {
      display: "none"
    },
    onChange: handleFile
  }), loading ? /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      padding: 24,
      textAlign: "center",
      borderColor: "#22d3ee30"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32,
      marginBottom: 8,
      animation: "spin 1.2s linear infinite"
    }
  }, "\u2699\uFE0F"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: "#4A5BC4",
      marginBottom: 4
    }
  }, statusMsg || "Processando...")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
      marginBottom: 14
    }
  }, [{
    label: "XML NF-e",
    ext: ".xml",
    emoji: "🗂️",
    color: "#4A5BC4",
    desc: "Nota fiscal SEFAZ"
  }, {
    label: "CSV",
    ext: ".csv",
    emoji: "📊",
    color: "#4ade80",
    desc: "Planilha de produtos"
  }, {
    label: "PDF",
    ext: ".pdf",
    emoji: "📄",
    color: "#f59e0b",
    desc: "DANFE ou orçamento"
  }, {
    label: "TXT",
    ext: ".txt",
    emoji: "📝",
    color: "#a78bfa",
    desc: "Texto livre"
  }].map(ft => /*#__PURE__*/React.createElement("button", {
    key: ft.ext,
    onClick: () => {
      fileRef.current.accept = ft.ext;
      fileRef.current.click();
    },
    style: {
      ...S.card,
      padding: "14px 10px",
      border: "1px solid " + ft.color + "30",
      cursor: "pointer",
      background: "#0F1220",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      borderRadius: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 28
    }
  }, ft.emoji), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: ft.color
    }
  }, ft.label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#5A6080",
      textAlign: "center"
    }
  }, ft.desc)))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.lbl,
      marginBottom: 6
    }
  }, "Ou cole o texto manualmente:"), /*#__PURE__*/React.createElement("textarea", {
    placeholder: "Formato NF-e:\n029554 SODA CAUSTICA 500G C24 CX 1,00 371,07\n004073 CADEADO 50MM UN 5,00 193,70",
    style: {
      ...S.input,
      height: 160,
      resize: "vertical",
      verticalAlign: "top",
      fontFamily: "monospace",
      fontSize: 12,
      lineHeight: 1.5
    },
    onPaste: e => {
      const txt = e.clipboardData.getData("text");
      if (txt.trim().length > 0) {
        e.preventDefault();
        try {
          var _txt$split$;
          const prods = txt.includes("<det") ? parseXML(txt) : txt.includes(",") && ((_txt$split$ = txt.split("\n")[0]) === null || _txt$split$ === void 0 ? void 0 : _txt$split$.split(",").length) > 2 ? parseCSV(txt) : parseTXT(txt);
          setParsed(prods);
          setStep("review");
          notify(prods.length + " produto(s) ✓");
        } catch (err) {
          notify(err.message, "error");
        }
      }
    }
  })));
}

// ── ENTREGAS ────────────────────────────────────────────────────────────────────

console.log("[PDV] importar.js carregado");
