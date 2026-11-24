// Gabarita Open PDF Exam Generator — 100% Client-Side (Zero Backend)
(() => {
  const state = {
    questions: [],
    config: {
      title: "Lista de Exercícios — Revisão Vestibular",
      school: "Gabarita PAS · Material Aberto",
      teacher: "",
      date: new Date().toISOString().slice(0, 10),
      cols: "2",
      notes: "Leia cada item com atenção. Nos itens C/E, cada erro anula um acerto.",
      showStudent: true,
      showBubbles: true,
      showKey: true
    }
  };

  const $ = id => document.getElementById(id);
  const esc = s => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function setStatus(msg, isErr = false) {
    const el = $("statusMsg");
    el.textContent = msg;
    el.className = "status" + (isErr ? " err" : "");
    if (msg) setTimeout(() => { if (el.textContent === msg) el.textContent = ""; }, 5000);
  }

  // Parse plain text / markdown exam blocks into structured questions
  function parseTextBlocks(raw) {
    const blocks = raw.replace(/\r\n/g, "\n").split(/\n\s*\n+/).map(b => b.trim()).filter(Boolean);
    const parsed = [];
    for (const block of blocks) {
      const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
      if (!lines.length) continue;

      let gab = "";
      let tag = "";
      const opts = [];
      const textLines = [];

      for (const line of lines) {
        const gMatch = line.match(/^(?:gabarito|resposta|gab)\s*[:\-]\s*(.+)$/i);
        if (gMatch) { gab = gMatch[1].trim(); continue; }
        const optMatch = line.match(/^([A-Ea-e])[\)\.\-]\s+(.+)$/);
        if (optMatch) { opts.push({ l: optMatch[1].toUpperCase(), t: optMatch[2].trim() }); continue; }
        textLines.push(line);
      }

      let enunciado = textLines.join("\n").replace(/^(?:quest[aã]o\s*)?\d+[\)\.\-\:]\s*/i, "");
      const tagMatch = enunciado.match(/^\(([^)]{2,45})\)\s*/);
      if (tagMatch) {
        tag = tagMatch[1].trim();
        enunciado = enunciado.slice(tagMatch[0].length);
      }

      let tipo = "ce";
      if (opts.length >= 2) tipo = "mc";
      else if (gab && !/^[CE]$/i.test(gab)) tipo = "disc";

      parsed.push({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        tipo,
        tag: tag || "Questão",
        texto: enunciado,
        opcoes: opts,
        gabarito: gab.toUpperCase(),
        imagem: null
      });
    }
    return parsed;
  }

  // Parse CSV (columns: tipo,tag,texto,opcoes,gabarito)
  function parseCSV(raw) {
    const lines = raw.replace(/\r\n/g, "\n").split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];
    const sep = lines[0].includes(";") ? ";" : ",";
    const out = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ""));
      if (!cols[2] && !cols[0]) continue;
      const tipo = (cols[0] || "ce").toLowerCase();
      const optsRaw = cols[3] ? cols[3].split("|").map((o, idx) => ({ l: String.fromCharCode(65 + idx), t: o.trim() })) : [];
      out.push({
        id: String(Date.now() + Math.random()),
        tipo: ["ce", "mc", "disc"].includes(tipo) ? tipo : (optsRaw.length ? "mc" : "ce"),
        tag: cols[1] || "Questão",
        texto: cols[2] || "",
        opcoes: optsRaw,
        gabarito: (cols[4] || "").toUpperCase(),
        imagem: null
      });
    }
    return out;
  }

  // Handle uploaded files (JSON, TXT, MD, CSV, or Images)
  async function handleFiles(fileList) {
    let added = 0;
    for (const file of fileList) {
      const name = file.name.toLowerCase();
      if (file.type.startsWith("image/")) {
        const dataUrl = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        state.questions.push({
          id: String(Date.now() + Math.random()),
          tipo: "mc",
          tag: file.name.replace(/\.[^.]+$/, ""),
          texto: "Analise a imagem da questão abaixo e marque a resposta correta:",
          opcoes: [],
          gabarito: "",
          imagem: dataUrl
        });
        added++;
      } else if (name.endsWith(".json")) {
        try {
          const data = JSON.parse(await file.text());
          const arr = Array.isArray(data) ? data : (Array.isArray(data.questions) ? data.questions : []);
          arr.forEach(q => {
            state.questions.push({
              id: String(Date.now() + Math.random()),
              tipo: q.tipo || (q.opcoes && q.opcoes.length ? "mc" : "ce"),
              tag: q.tag || q.materia || "Questão",
              texto: q.texto || q.enunciado || "",
              opcoes: Array.isArray(q.opcoes) ? q.opcoes.map((o, idx) => typeof o === "string" ? { l: String.fromCharCode(65 + idx), t: o } : o) : [],
              gabarito: String(q.gabarito || "").toUpperCase(),
              imagem: q.imagem || null
            });
            added++;
          });
        } catch (e) {
          setStatus(`Erro ao ler JSON "${file.name}": formato inválido.`, true);
        }
      } else if (name.endsWith(".csv")) {
        const items = parseCSV(await file.text());
        state.questions.push(...items);
        added += items.length;
      } else {
        const items = parseTextBlocks(await file.text());
        state.questions.push(...items);
        added += items.length;
      }
    }
    if (added > 0) {
      setStatus(`${added} ${added === 1 ? "questão importada" : "questões importadas"} com sucesso!`);
      render();
    }
  }

  function renderAdmin() {
    $("qCount").textContent = state.questions.length;
    $("previewMeta").textContent = `${state.questions.length} ${state.questions.length === 1 ? "questão" : "questões"}`;
    const list = $("adminList");
    if (!state.questions.length) {
      list.innerHTML = `<div style="font-size:13px;color:var(--ink-3);text-align:center;padding:10px">Nenhuma questão adicionada ainda.</div>`;
      return;
    }
    list.innerHTML = state.questions.map((q, idx) => `
      <div class="q-item-admin">
        <div>
          <b>${idx + 1}. ${esc(q.tag)}</b>
          <small>${esc((q.texto || "[Imagem]").slice(0, 58))}${q.gabarito ? " · Gab: " + esc(q.gabarito) : ""}</small>
        </div>
        <div class="acts">
          <button type="button" class="btn btn-line btn-sm" data-mv="-1" data-i="${idx}" title="Subir">↑</button>
          <button type="button" class="btn btn-line btn-sm" data-mv="1" data-i="${idx}" title="Descer">↓</button>
          <button type="button" class="btn btn-bad btn-sm" data-del="${idx}" title="Remover">✕</button>
        </div>
      </div>
    `).join("");

    list.querySelectorAll("[data-del]").forEach(btn => {
      btn.onclick = () => { state.questions.splice(+btn.dataset.del, 1); render(); };
    });
    list.querySelectorAll("[data-mv]").forEach(btn => {
      btn.onclick = () => {
        const i = +btn.dataset.i, d = +btn.dataset.mv, j = i + d;
        if (j < 0 || j >= state.questions.length) return;
        [state.questions[i], state.questions[j]] = [state.questions[j], state.questions[i]];
        render();
      };
    });
  }

  function renderSheet() {
    const c = state.config;
    const sheet = $("sheet");
    if (!state.questions.length) {
      sheet.innerHTML = `
        <div class="empty-state">
          <h3>Sua folha de prova aparecerá aqui</h3>
          <p>Anexe um arquivo de questões (JSON, TXT, CSV ou imagens) ou clique em <strong>Carregar Exemplo</strong> no topo para testar agora.</p>
        </div>`;
      return;
    }

    const fmtDate = c.date ? c.date.split("-").reverse().join("/") : "";
    const metaParts = [c.teacher, fmtDate, `${state.questions.length} ${state.questions.length === 1 ? "item" : "itens"}`].filter(Boolean).join(" · ");

    const questionsHtml = state.questions.map((q, idx) => {
      const num = String(idx + 1).padStart(2, "0");
      let body = "";
      if (q.imagem) body += `<img class="q-img" src="${q.imagem}" alt="Imagem da questão ${idx + 1}">`;
      if (q.tipo === "mc" && q.opcoes.length) {
        body += `<ul class="q-opts">${q.opcoes.map(o => `<li><strong>${esc(o.l)})</strong> ${esc(o.t)}</li>`).join("")}</ul>`;
      } else if (q.tipo === "ce") {
        body += `<div class="q-ce">( &nbsp; ) CERTO &nbsp;&nbsp;&nbsp;&nbsp; ( &nbsp; ) ERRADO</div>`;
      } else if (q.tipo === "disc") {
        body += `<div class="q-lines"><i></i><i></i><i></i></div>`;
      }
      return `
        <section class="q-block">
          <div class="q-head"><span class="q-num">${num}</span><span class="q-tag">${esc(q.tag)}</span></div>
          ${q.texto ? `<p class="q-text">${esc(q.texto)}</p>` : ""}
          ${body}
        </section>`;
    }).join("");

    let bubblesHtml = "";
    if (c.showBubbles) {
      const rows = state.questions.map((q, idx) => {
        const letters = q.tipo === "ce" ? ["C", "E"] : (q.tipo === "mc" ? ["A", "B", "C", "D", "E"] : []);
        const bubs = letters.length
          ? letters.map(l => `<span class="bubble">${l}</span>`).join("")
          : `<span style="font-size:8pt;color:#666">Discursiva / Num.</span>`;
        return `<div class="bubble-row"><b>${String(idx + 1).padStart(2, "0")}</b>${bubs}</div>`;
      }).join("");
      bubblesHtml = `
        <section class="page-break">
          <h3 class="sub-sheet-title">Cartão-Resposta</h3>
          <div class="bubble-grid">${rows}</div>
        </section>`;
    }

    let keyHtml = "";
    if (c.showKey) {
      const rows = state.questions.map((q, idx) => `
        <tr>
          <td><strong>${String(idx + 1).padStart(2, "0")}</strong></td>
          <td>${esc(q.tag)}</td>
          <td>${q.tipo === "ce" ? "Certo/Errado" : (q.tipo === "mc" ? "Múltipla Escolha" : "Discursiva/Num.")}</td>
          <td><strong>${esc(q.gabarito || "—")}</strong></td>
        </tr>`).join("");
      keyHtml = `
        <section class="page-break">
          <h3 class="sub-sheet-title">Gabarito Oficial — ${esc(c.title)}</h3>
          <table class="key-table">
            <thead><tr><th style="width:55px">Item</th><th>Banca / Matéria</th><th style="width:130px">Tipo</th><th style="width:110px">Gabarito</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </section>`;
    }

    sheet.innerHTML = `
      <header class="exam-header">
        <div class="exam-top">
          <div>
            <div class="exam-inst">${esc(c.school)}</div>
            <h2 class="exam-title">${esc(c.title)}</h2>
            <div class="exam-meta">${esc(metaParts)}</div>
          </div>
        </div>
        ${c.showStudent ? `<div class="student-grid"><span><strong>Aluno(a):</strong></span><span><strong>Turma:</strong></span><span><strong>Nota:</strong></span></div>` : ""}
      </header>
      ${c.notes ? `<div class="exam-inst-box"><strong>Instruções:</strong> ${esc(c.notes)}</div>` : ""}
      <div class="questions ${c.cols === "1" ? "col1" : ""}">${questionsHtml}</div>
      ${bubblesHtml}
      ${keyHtml}
    `;
  }

  function render() {
    renderAdmin();
    renderSheet();
  }

  // Event wiring
  $("cfgDate").value = state.config.date;
  const bindCfg = (id, key, isCheck = false) => {
    $(id).addEventListener(isCheck ? "change" : "input", e => {
      state.config[key] = isCheck ? e.target.checked : e.target.value;
      renderSheet();
    });
  };
  bindCfg("cfgTitle", "title");
  bindCfg("cfgSchool", "school");
  bindCfg("cfgTeacher", "teacher");
  bindCfg("cfgDate", "date");
  bindCfg("cfgCols", "cols");
  bindCfg("cfgNotes", "notes");
  bindCfg("chkStudent", "showStudent", true);
  bindCfg("chkBubbles", "showBubbles", true);
  bindCfg("chkKey", "showKey", true);

  $("qTipo").addEventListener("change", e => {
    $("mcWrap").hidden = e.target.value !== "mc";
  });

  document.querySelectorAll(".tabs button").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("on"));
      btn.classList.add("on");
      const tab = btn.dataset.tab;
      $("manualForm").hidden = tab !== "manual";
      $("bulkBox").hidden = tab !== "bulk";
    };
  });

  $("manualForm").addEventListener("submit", async e => {
    e.preventDefault();
    const texto = $("qTexto").value.trim();
    const imgFile = $("qImg").files[0];
    if (!texto && !imgFile) return setStatus("Escreva o enunciado ou anexe uma imagem.", true);

    let imagem = null;
    if (imgFile) {
      imagem = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(imgFile);
      });
    }

    const tipo = $("qTipo").value;
    const opcoes = tipo === "mc"
      ? $("qOpts").value.split("\n").map(l => l.trim()).filter(Boolean).map((l, idx) => {
          const m = l.match(/^([A-Ea-e])[\)\.\-]\s*(.+)$/);
          return m ? { l: m[1].toUpperCase(), t: m[2] } : { l: String.fromCharCode(65 + idx), t: l };
        })
      : [];

    state.questions.push({
      id: String(Date.now() + Math.random()),
      tipo,
      tag: $("qTag").value.trim() || "Questão",
      texto,
      opcoes,
      gabarito: $("qGab").value.trim().toUpperCase(),
      imagem
    });

    $("qTexto").value = "";
    $("qOpts").value = "";
    $("qGab").value = "";
    $("qImg").value = "";
    setStatus("Questão adicionada!");
    render();
  });

  $("btnParseBulk").onclick = () => {
    const raw = $("bulkText").value.trim();
    if (!raw) return setStatus("Cole o texto das questões primeiro.", true);
    const items = parseTextBlocks(raw);
    if (!items.length) return setStatus("Não foi possível identificar questões no texto.", true);
    state.questions.push(...items);
    $("bulkText").value = "";
    setStatus(`${items.length} questões importadas do texto!`);
    render();
  };

  const dz = $("dropzone");
  $("fileInput").addEventListener("change", e => {
    if (e.target.files.length) handleFiles(e.target.files);
    e.target.value = "";
  });
  dz.addEventListener("dragover", e => { e.preventDefault(); dz.classList.add("over"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("over"));
  dz.addEventListener("drop", e => {
    e.preventDefault();
    dz.classList.remove("over");
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  });

  $("btnShuffle").onclick = () => {
    for (let i = state.questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.questions[i], state.questions[j]] = [state.questions[j], state.questions[i]];
    }
    render();
  };

  $("btnClear").onclick = () => {
    state.questions = [];
    render();
  };

  $("btnExportJson").onclick = () => {
    const blob = new Blob([JSON.stringify({ config: state.config, questions: state.questions }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lista-questoes.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  $("btnPrint").onclick = () => {
    if (!state.questions.length) return setStatus("Adicione pelo menos 1 questão antes de gerar o PDF.", true);
    window.print();
  };

  $("btnSample").onclick = async () => {
    try {
      const resp = await fetch("exemplo-questoes.json");
      if (resp.ok) {
        const data = await resp.json();
        state.questions = data;
        setStatus("Exemplo carregado!");
        render();
        return;
      }
    } catch (_) {}
    // Fallback when opened via file:// without local server
    state.questions = [
      { id: "s1", tipo: "ce", tag: "PAS 1 · História", texto: "Na Inglaterra do século XVI, o rompimento do rei Henrique VIII com a autoridade papal deu origem à Igreja Anglicana por meio do Ato de Supremacia.", opcoes: [], gabarito: "C", imagem: null },
      { id: "s2", tipo: "ce", tag: "PAS 1 · Biologia", texto: "Na fabricação de pão, o crescimento da massa deve-se à liberação de gás carbônico (CO₂) produzido durante a fermentação alcoólica realizada por leveduras.", opcoes: [], gabarito: "C", imagem: null },
      { id: "s3", tipo: "ce", tag: "PAS 1 · Química", texto: "A molécula de gás oxigênio (O₂) apresenta ligação covalente polar e geometria angular.", opcoes: [], gabarito: "E", imagem: null },
      { id: "s4", tipo: "ce", tag: "PAS 1 · Física", texto: "No ponto mais alto da trajetória de um lançamento oblíquo no vácuo, o vetor velocidade do projétil é nulo.", opcoes: [], gabarito: "E", imagem: null },
      { id: "s5", tipo: "mc", tag: "Vestibular · Geografia", texto: "Sobre o índice de Gini, indicador amplamente utilizado em estudos socioeconômicos, assinale a alternativa correta:", opcoes: [
        { l: "A", t: "Valores próximos de zero indicam menor desigualdade na distribuição de renda." },
        { l: "B", t: "Valores iguais a um representam distribuição de renda perfeitamente igualitária." },
        { l: "C", t: "Mede exclusivamente a taxa de alfabetização de um país." },
        { l: "D", t: "Não pode ser aplicado a comparações entre unidades federativas." }
      ], gabarito: "A", imagem: null },
      { id: "s6", tipo: "disc", tag: "PAS 1 · Matemática (Tipo B)", texto: "Calcule o valor de x na equação log₂(x) + log₂(4) = 5. Registre o resultado numérico obtido.", opcoes: [], gabarito: "008", imagem: null }
    ];
    setStatus("Exemplo carregado!");
    render();
  };

  // Load sample on first visit so preview is immediately rich
  $("btnSample").click();
})();
