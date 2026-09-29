const starterCode = `// Factorial con validación
ALGORITMO FactorialNum
VAR
    n, fact, i : ENTERO
INICIO
    ESCRIBIR "Ingrese un número entero positivo:"
    LEER n
    SI n < 0 ENTONCES
        ESCRIBIR "El número debe ser mayor o igual a 0"
    SINO
        fact <- 1
        PARA i <- 1 HASTA n HACER
            fact <- fact * i
        FINPARA
        ESCRIBIR "El factorial es: ", fact
    FINSI
FIN`;

const defaultFiles = [
  { name: 'factorial.psc', content: starterCode },
  { name: 'fibonacci.psc', content: `ALGORITMO Fibonacci\nVAR\n    a, b, i : ENTERO\nINICIO\n    a <- 0\n    b <- 1\n    PARA i <- 1 HASTA 10 HACER\n        ESCRIBIR a\n        b <- a + b\n        a <- b - a\n    FINPARA\nFIN` },
  { name: 'grades.psc', content: `ALGORITMO PromedioNotas\nVAR\n    nota1, nota2, promedio : REAL\nINICIO\n    LEER nota1\n    LEER nota2\n    promedio <- (nota1 + nota2) / 2\n    ESCRIBIR "Promedio: ", promedio\nFIN` },
  { name: 'average.psc', content: `ALGORITMO CalcularPromedio\nVAR\n    suma, cantidad : REAL\nINICIO\n    suma <- 0\n    cantidad <- 0\n    ESCRIBIR "Promedio calculado"\nFIN` },
  { name: 'temperature.psc', content: `ALGORITMO CelsiusAFahrenheit\nVAR\n    celsius, fahrenheit : REAL\nINICIO\n    LEER celsius\n    fahrenheit <- (celsius * 9 / 5) + 32\n    ESCRIBIR fahrenheit\nFIN` },
];

const storageKey = 'psudopaz-frontend-files-v1';
const preferencesKey = 'psudopaz-frontend-preferences-v1';
const state = {
  files: readStoredFiles(),
  activeName: 'factorial.psc',
  filter: 'all',
  view: 'files',
  messages: [],
  errors: 0,
  warnings: 0,
  toastTimer: 0,
};

const $ = (selector) => document.querySelector(selector);
const ide = $('#ide');
const codeInput = $('#code-input');
const syntaxLayer = $('#syntax-layer');
const lineNumbers = $('#line-numbers');
const consoleOutput = $('#console-output');
const statusbar = $('.statusbar');

function readStoredFiles() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(stored) && stored.length) return stored;
  } catch { /* Start with the sample files when storage is unavailable. */ }
  return structuredClone(defaultFiles);
}

function persistFiles() {
  if ($('#autosave')?.checked === false) return;
  try { localStorage.setItem(storageKey, JSON.stringify(state.files)); } catch { showToast('No se pudo guardar en el almacenamiento local.'); }
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function colorize(source) {
  const tokenPattern = /\/\/.*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:ENTERO|INTEGER|REAL|BOOLEANO|BOOLEAN|CADENA|STRING|CARACTER|CHAR)\b|\b(?:ALGORITMO|ALGORITHM|VAR|INICIO|BEGIN|FIN|END|SI|IF|ENTONCES|THEN|SINO|ELSE|FINSI|PARA|FOR|HASTA|TO|HACER|DO|FINPARA|MIENTRAS|WHILE|FINMIENTRAS|REPETIR|REPEAT|LEER|READ|ESCRIBIR|PRINT|WRITE)\b|\b(?:VERDADERO|FALSO|TRUE|FALSE)\b|\b\d+(?:\.\d+)?\b|<-|<=|>=|==|!=|[+*/=<>-]/gi;
  return source.split('\n').map((line) => {
    let cursor = 0;
    let html = '';
    for (const match of line.matchAll(tokenPattern)) {
      const token = match[0];
      const start = match.index;
      html += escapeHtml(line.slice(cursor, start));
      const type = token.startsWith('//') ? 'comment'
        : token.startsWith('"') || token.startsWith("'") ? 'string'
          : /^(ENTERO|INTEGER|REAL|BOOLEANO|BOOLEAN|CADENA|STRING|CARACTER|CHAR)$/i.test(token) ? 'type'
            : /^(VERDADERO|FALSO|TRUE|FALSE)$/i.test(token) ? 'boolean'
              : /^\d/.test(token) ? 'number'
                : /^(<-|<=|>=|==|!=|[+*/=<>-])$/.test(token) ? 'operator' : 'keyword';
      html += `<span class="token-${type}">${escapeHtml(token)}</span>`;
      cursor = start + token.length;
    }
    html += escapeHtml(line.slice(cursor));
    return html || ' ';
  }).join('\n') + '\n';
}

function updateEditor() {
  const file = getActiveFile();
  if (!file) return;
  codeInput.value = file.content;
  syntaxLayer.innerHTML = colorize(file.content);
  const lines = file.content.split('\n').length;
  lineNumbers.innerHTML = Array.from({ length: lines }, (_, index) => `${index + 1}`).join('<br>');
  $('#active-filename').textContent = file.name;
  $('#status-lines').textContent = `${lines} ${lines === 1 ? 'línea' : 'líneas'}`;
  $('#unsaved-dot').hidden = true;
  renderTabs();
  renderFiles();
  updateCursor();
}

function getActiveFile() { return state.files.find((file) => file.name === state.activeName) || state.files[0]; }

function renderTabs() {
  $('#tab-strip').innerHTML = state.files.map((file) => `
    <button class="file-tab${file.name === state.activeName ? ' is-active' : ''}" role="tab" aria-selected="${file.name === state.activeName}" data-name="${escapeHtml(file.name)}">
      <span class="tab-file-icon" aria-hidden="true">▤</span><span>${escapeHtml(file.name)}</span>
      <span class="tab-close" role="button" tabindex="0" aria-label="Cerrar ${escapeHtml(file.name)}" data-close="${escapeHtml(file.name)}">×</span>
    </button>`).join('');
}

function renderFiles() {
  $('#file-list').innerHTML = state.files.map((file) => `
    <button class="file-row${file.name === state.activeName ? ' is-active' : ''}" data-name="${escapeHtml(file.name)}">
      <span class="file-glyph" aria-hidden="true">▤</span><span>${escapeHtml(file.name)}</span>
    </button>`).join('');
}

function updateCursor() {
  const before = codeInput.value.slice(0, codeInput.selectionStart);
  const rows = before.split('\n');
  $('#cursor-position').textContent = `Ln ${rows.length}, Col ${rows.at(-1).length + 1}`;
}

function addMessage(text, type = 'info') {
  state.messages.push({ text, type, time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) });
  renderMessages();
}

function renderMessages() {
  const shown = state.messages.filter((message) => state.filter === 'all' || (state.filter === 'errors' && message.type === 'error') || (state.filter === 'warnings' && message.type === 'warning'));
  consoleOutput.innerHTML = shown.map((message) => `<div class="console-entry ${message.type}"><time class="console-time">[${message.time}]</time><span class="console-message">${escapeHtml(message.text)}</span></div>`).join('');
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
  $('#error-count').textContent = state.errors;
  $('#warning-count').textContent = state.warnings;
  $('#status-errors').textContent = `${state.errors} ${state.errors === 1 ? 'error' : 'errores'}`;
  $('#status-warnings').textContent = `${state.warnings} ${state.warnings === 1 ? 'aviso' : 'avisos'}`;
  statusbar.classList.toggle('has-errors', state.errors > 0);
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
}

function setStatus(message, kind = 'ready') {
  $('#status-text').textContent = message;
  statusbar.classList.toggle('is-compiling', kind === 'compiling');
  statusbar.classList.toggle('has-errors', kind === 'error');
}

function compilePreview() {
  const file = getActiveFile();
  if (!file) return;
  const runButton = $('#run-button');
  runButton.disabled = true;
  state.errors = 0;
  state.warnings = 0;
  setStatus('Compilando...', 'compiling');
  addMessage(`Analizando ${file.name}`, 'info');
  renderMessages();
  window.setTimeout(() => {
    const source = codeInput.value;
    const hasStart = /\b(INICIO|BEGIN)\b/i.test(source);
    const hasEnd = /\bFIN\b|\bEND\b/i.test(source);
    const hasAlgorithm = /\b(ALGORITMO|ALGORITHM)\b/i.test(source);
    const unclosedQuote = (source.match(/"/g) || []).length % 2 !== 0;
    const issues = [];
    if (!hasAlgorithm) issues.push('No se encontró ALGORITMO.');
    if (!hasStart) issues.push('No se encontró INICIO.');
    if (!hasEnd) issues.push('No se encontró FIN.');
    if (unclosedQuote) issues.push('Hay una cadena de texto sin cerrar.');
    if (issues.length) {
      state.errors = issues.length;
      issues.forEach((issue) => addMessage(issue, 'error'));
      setStatus('Con errores', 'error');
    } else {
      state.warnings = 1;
      addMessage('Estructura básica válida. La ejecución real requiere conectar el motor del compilador.', 'success');
      addMessage('Vista previa del frontend: no se ejecutaron instrucciones.', 'warning');
      setStatus('Con advertencias', 'ready');
    }
    runButton.disabled = false;
    renderMessages();
  }, 420);
}

function runDfd() {
  state.errors = 0;
  state.warnings = 0;
  setStatus('Ejecutando DFD...', 'compiling');
  addMessage('> Iniciando ejecución gráfica del diagrama factorial.dfd...', 'command');
  window.setTimeout(() => {
    addMessage('[Paso 1/7] Inicio: factorial', 'info');
    addMessage('[Paso 2/7] Asignación: n = 6, fact = 1', 'info');
    addMessage('[Paso 3/7] Condición n < 0 es falsa; continúa por rama No.', 'info');
    addMessage('[Paso 4/7] Bucle PARA completado: 6 iteraciones. fact = 720.', 'info');
    addMessage('Salida de pantalla: Total: 720', 'success');
    addMessage('Ejecución del diagrama finalizada con éxito (código de salida: 0).', 'success');
    setStatus('DFD ejecutado');
    renderMessages();
  }, 320);
  renderMessages();
}

let pdfLibraryPromise;

function loadPdfLibrary() {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (pdfLibraryPromise) return pdfLibraryPromise;
  pdfLibraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => window.jspdf?.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error('La biblioteca PDF no está disponible.'));
    script.onerror = () => reject(new Error('No se pudo cargar el generador PDF. Revisa tu conexión a internet.'));
    document.head.append(script);
  });
  return pdfLibraryPromise;
}

function getPdfTokens(line) {
  const pattern = /\/\/.*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:ENTERO|INTEGER|REAL|BOOLEANO|BOOLEAN|CADENA|STRING|CARACTER|CHAR)\b|\b(?:ALGORITMO|ALGORITHM|VAR|INICIO|BEGIN|FIN|END|SI|IF|ENTONCES|THEN|SINO|ELSE|FINSI|PARA|FOR|HASTA|TO|HACER|DO|FINPARA|MIENTRAS|WHILE|FINMIENTRAS|REPETIR|REPEAT|LEER|READ|ESCRIBIR|PRINT|WRITE)\b|\b(?:VERDADERO|FALSO|TRUE|FALSE)\b|\b\d+(?:\.\d+)?\b|<-|<=|>=|==|!=|[+*/=<>-]/gi;
  return [...line.matchAll(pattern)].map((match) => {
    const token = match[0];
    const type = token.startsWith('//') ? 'comment'
      : token.startsWith('"') || token.startsWith("'") ? 'string'
        : /^(ENTERO|INTEGER|REAL|BOOLEANO|BOOLEAN|CADENA|STRING|CARACTER|CHAR)$/i.test(token) ? 'type'
          : /^(VERDADERO|FALSO|TRUE|FALSE)$/i.test(token) ? 'boolean'
            : /^\d/.test(token) ? 'number'
              : /^(<-|<=|>=|==|!=|[+*/=<>-])$/.test(token) ? 'operator' : 'keyword';
    return { text: token, start: match.index, end: match.index + token.length, type };
  });
}

function drawPdfText(doc, text, type, x, y) {
  const styles = {
    plain: { color: [51, 65, 85], font: 'normal' },
    keyword: { color: [124, 58, 237], font: 'bold' },
    type: { color: [194, 65, 12], font: 'bold' },
    string: { color: [21, 128, 61], font: 'normal' },
    number: { color: [37, 99, 235], font: 'normal' },
    boolean: { color: [225, 29, 72], font: 'bold' },
    operator: { color: [225, 29, 72], font: 'bold' },
    comment: { color: [132, 145, 164], font: 'italic' },
  };
  const style = styles[type] || styles.plain;
  doc.setFont('courier', style.font);
  doc.setTextColor(...style.color);
  doc.text(text, x, y);
  return doc.getTextWidth(text);
}

function drawPdfCodeSegment(doc, line, start, end, x, y) {
  const tokens = getPdfTokens(line);
  let cursor = start;
  let currentX = x;
  for (const token of tokens) {
    const tokenStart = Math.max(start, token.start);
    const tokenEnd = Math.min(end, token.end);
    if (tokenStart >= tokenEnd) continue;
    if (tokenStart > cursor) currentX += drawPdfText(doc, line.slice(cursor, tokenStart), 'plain', currentX, y);
    currentX += drawPdfText(doc, line.slice(tokenStart, tokenEnd), token.type, currentX, y);
    cursor = tokenEnd;
  }
  if (cursor < end) drawPdfText(doc, line.slice(cursor, end), 'plain', currentX, y);
}

function drawPdfPageFrame(doc, file, author, date, lineCount, pageNumber, pageCount) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  doc.setFillColor(7, 143, 209);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  doc.setFillColor(7, 143, 209);
  doc.roundedRect(margin, 8, 5, 5, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('P.', margin + 2.5, 11.4, { align: 'center' });
  doc.setTextColor(23, 35, 52);
  doc.setFontSize(10);
  doc.text('PsudoPaz', margin + 7, 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(119, 134, 155);
  doc.setFontSize(7);
  doc.text('· Código Fuente Oficial', margin + 25, 11.5);
  doc.setDrawColor(191, 221, 241);
  doc.setFillColor(242, 249, 254);
  doc.roundedRect(pageWidth - margin - 45, 7, 45, 7, 3, 3, 'FD');
  doc.setFillColor(14, 165, 233);
  doc.circle(pageWidth - margin - 40, 10.5, 0.8, 'F');
  doc.setTextColor(18, 107, 155);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Pseudocódigo (.psc)', pageWidth - margin - 37, 11.5);

  const metadataY = 18;
  const metadataHeight = 20;
  const columnWidth = contentWidth / 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(224, 231, 239);
  doc.roundedRect(margin, metadataY, contentWidth, metadataHeight, 1.5, 1.5, 'FD');
  const values = [
    ['ARCHIVO', file.name, 'Algoritmo principal'],
    ['AUTOR', author || 'Sin especificar', 'Desarrollador'],
    ['FECHA', date, 'Documento exportado'],
    ['LÍNEAS', String(lineCount), 'Documento listo'],
  ];
  values.forEach(([label, value, detail], index) => {
    const x = margin + index * columnWidth;
    if (index) doc.line(x, metadataY + 3, x, metadataY + metadataHeight - 3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(102, 118, 139);
    doc.text(label, x + 4, metadataY + 5);
    doc.setFontSize(7.5);
    doc.setTextColor(23, 35, 52);
    doc.text(doc.splitTextToSize(value, columnWidth - 8)[0], x + 4, metadataY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(130, 145, 164);
    doc.text(detail, x + 4, metadataY + 15);
  });

  const panelTop = 43;
  const footerY = pageHeight - 10;
  const panelHeight = footerY - panelTop - 7;
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, panelTop, contentWidth, panelHeight, 1.5, 1.5, 'FD');
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 0.5, panelTop + 0.5, 8.5, panelHeight - 1, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 9, panelTop + 1, margin + 9, panelTop + panelHeight - 1);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(138, 152, 170);
  doc.text('Documento exportado desde PsudoPaz Web IDE', margin, footerY + 5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Página ${pageNumber} de ${pageCount}`, pageWidth - margin, footerY + 5, { align: 'right' });

  const codeX = margin + 12;
  const codeY = panelTop + 7;
  const lineHeight = 4.4;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  const charWidth = doc.getTextWidth('M');
  const maxChars = Math.max(24, Math.floor((pageWidth - margin - codeX - 4) / charWidth));
  const rowCount = Math.floor((panelHeight - 12) / lineHeight);
  return { codeX, codeY, lineHeight, maxChars, rowCount };
}

async function downloadPdf() {
  const button = $('#export-pdf');
  const file = getActiveFile();
  if (!file) return;
  button.disabled = true;
  try {
    saveFile();
    const JsPDF = await loadPdfLibrary();
    const source = codeInput.value;
    const lines = source.split('\n');
    const author = $('#author-name').value.trim() || 'Sin especificar';
    const date = new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(new Date());
    const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    doc.setProperties({ title: `${file.name} - PsudoPaz`, author, subject: 'Código fuente de pseudocódigo', creator: 'PsudoPaz Web IDE' });

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    const maxChars = Math.max(24, Math.floor((doc.internal.pageSize.getWidth() - 40) / doc.getTextWidth('M')));
    const rows = lines.flatMap((line, lineIndex) => {
      const segments = [];
      for (let start = 0; start < Math.max(1, line.length); start += maxChars) {
        segments.push({ line, lineNumber: lineIndex + 1, start, end: Math.min(line.length, start + maxChars), first: start === 0 });
      }
      return segments;
    });
    const firstFrame = drawPdfPageFrame(doc, file, author, date, lines.length, 1, 1);
    const pageCount = Math.max(1, Math.ceil(rows.length / firstFrame.rowCount));
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      if (pageIndex > 0) doc.addPage('letter', 'portrait');
      const frame = pageIndex === 0 ? firstFrame : drawPdfPageFrame(doc, file, author, date, lines.length, pageIndex + 1, pageCount);
      const pageRows = rows.slice(pageIndex * frame.rowCount, (pageIndex + 1) * frame.rowCount);
      pageRows.forEach((row, rowIndex) => {
        const y = frame.codeY + rowIndex * frame.lineHeight;
        if (row.first) {
          doc.setFont('courier', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.text(String(row.lineNumber), 14 + 7.5, y, { align: 'right' });
        }
        drawPdfCodeSegment(doc, row.line, row.start, row.end, frame.codeX, y);
      });
    }
    const safeName = file.name.replace(/\.psc$/i, '').replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'pseudocodigo';
    doc.save(`${safeName}.pdf`);
    setStatus('PDF descargado');
    showToast(`${safeName}.pdf descargado`);
    addMessage(`PDF descargado: ${safeName}.pdf`, 'success');
  } catch (error) {
    setStatus('No se pudo exportar el PDF', 'error');
    showToast(error.message || 'No se pudo generar el PDF.');
    addMessage(error.message || 'No se pudo generar el PDF.', 'error');
  } finally {
    button.disabled = false;
  }
}

function newFile() {
  const rawName = window.prompt('Nombre del archivo nuevo:', 'nuevo-algoritmo.psc');
  if (!rawName) return;
  const name = rawName.trim().endsWith('.psc') ? rawName.trim() : `${rawName.trim()}.psc`;
  if (!name || state.files.some((file) => file.name.toLowerCase() === name.toLowerCase())) {
    showToast('Ese nombre ya existe o no es válido.');
    return;
  }
  state.files.push({ name, content: 'ALGORITMO NuevoAlgoritmo\nVAR\nINICIO\n    \nFIN' });
  state.activeName = name;
  persistFiles();
  updateEditor();
  codeInput.focus();
  showToast(`${name} creado`);
}

function saveFile() {
  const file = getActiveFile();
  if (!file) return;
  file.content = codeInput.value;
  persistFiles();
  $('#unsaved-dot').hidden = true;
  showToast(`${file.name} guardado en este navegador`);
  addMessage(`Archivo guardado: ${file.name}`, 'info');
}

function closeTab(name) {
  if (state.files.length === 1) return showToast('Debe quedar al menos un archivo abierto.');
  state.files = state.files.filter((file) => file.name !== name);
  if (state.activeName === name) state.activeName = state.files[0].name;
  persistFiles();
  updateEditor();
}

function setView(view) {
  state.view = view;
  const isLupa = view === 'colors' || view === 'search';
  const activeView = isLupa ? 'search' : view;
  document.querySelectorAll('.activity-button[data-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.view === activeView));
  ide.classList.toggle('dfd-mode', view === 'dfd');
  ide.classList.toggle('colors-view', isLupa);
  ide.classList.toggle('search-view', view === 'search');
  $('#editor-panel').hidden = view === 'dfd';
  $('#dfd-panel').hidden = view !== 'dfd';
  $('#dfd-toolbox').hidden = view !== 'dfd';
  $('#color-reference').hidden = !isLupa;
  $('#explorer').hidden = isLupa || view === 'dfd';
  $('#console-title-label').textContent = view === 'dfd' ? 'TERMINAL DFD / SALIDA DE EJECUCIÓN' : 'CONSOLA';
  $('#explorer-title').textContent = view === 'dfd' ? 'DIAGRAMA' : 'EXPLORADOR';
  if (view === 'colors') {
    $('#search-row').hidden = true;
    return;
  }
  if (view === 'search') {
    $('#search-row').hidden = false;
    $('#search-input').focus();
  } else {
    $('#search-row').hidden = true;
  }
}

function setSearch(query) {
  const text = query.trim();
  const source = codeInput.value;
  if (!text) {
    syntaxLayer.innerHTML = colorize(source);
    $('#search-count').textContent = '';
    return;
  }
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = source.match(new RegExp(escaped, 'gi')) || [];
  const highlighted = colorize(source).replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="search-hit">$1</mark>');
  syntaxLayer.innerHTML = highlighted;
  $('#search-count').textContent = `${matches.length} resultado${matches.length === 1 ? '' : 's'}`;
}

function insertSnippet(snippet) {
  const start = codeInput.selectionStart;
  const end = codeInput.selectionEnd;
  const cleanSnippet = snippet.replaceAll('&lt;', '<').replaceAll('&gt;', '>');
  codeInput.setRangeText(cleanSnippet, start, end, 'end');
  codeInput.dispatchEvent(new Event('input', { bubbles: true }));
  codeInput.focus();
}

function runCommand(rawCommand) {
  const command = rawCommand.trim();
  if (!command) return;
  addMessage(`› ${command}`, 'command');
  const [verb, ...args] = command.split(/\s+/);
  switch (verb.toLowerCase()) {
    case 'run': compilePreview(); break;
    case 'save': saveFile(); break;
    case 'clear': state.messages = []; state.errors = 0; state.warnings = 0; setStatus('Listo'); renderMessages(); break;
    case 'ls': state.files.forEach((file) => addMessage(file.name, 'info')); break;
    case 'help':
      ['Comandos disponibles:', 'run   Compila la estructura del archivo activo', 'save  Guarda cambios localmente', 'clear Limpia la consola', 'ls    Lista los archivos', 'help  Muestra esta ayuda'].forEach((line) => addMessage(line, 'info'));
      break;
    default: addMessage(`Comando no reconocido: ${verb}. Escribe help para ver opciones.`, 'warning'); state.warnings += 1; renderMessages();
  }
  if (args.length && verb.toLowerCase() === 'run') showToast('run no recibe argumentos.');
}

function restorePreferences() {
  try {
    const prefs = JSON.parse(localStorage.getItem(preferencesKey) || '{}');
    if (prefs.authorName) $('#author-name').value = prefs.authorName;
    if (prefs.fontSize) $('#font-size').value = prefs.fontSize;
    if (prefs.lightMode) $('#light-mode').checked = true;
    if (prefs.autoSave === false) $('#autosave').checked = false;
  } catch { /* Ignore invalid saved preferences. */ }
  applyPreferences();
}

function applyPreferences() {
  document.documentElement.style.setProperty('--editor-size', `${$('#font-size').value}px`);
  document.body.classList.toggle('light-mode', $('#light-mode').checked);
  try {
    localStorage.setItem(preferencesKey, JSON.stringify({ authorName: $('#author-name').value.trim(), fontSize: $('#font-size').value, lightMode: $('#light-mode').checked, autoSave: $('#autosave').checked }));
  } catch { /* Preferences remain active for this session. */ }
}

$('#code-input').addEventListener('input', () => {
  const file = getActiveFile();
  file.content = codeInput.value;
  syntaxLayer.innerHTML = colorize(codeInput.value);
  lineNumbers.innerHTML = Array.from({ length: codeInput.value.split('\n').length }, (_, index) => `${index + 1}`).join('<br>');
  $('#status-lines').textContent = `${codeInput.value.split('\n').length} líneas`;
  $('#unsaved-dot').hidden = false;
  updateCursor();
  if ($('#search-input').value) setSearch($('#search-input').value);
  if ($('#autosave').checked) persistFiles();
});

codeInput.addEventListener('scroll', () => {
  syntaxLayer.scrollTop = codeInput.scrollTop;
  syntaxLayer.scrollLeft = codeInput.scrollLeft;
  lineNumbers.scrollTop = codeInput.scrollTop;
});
codeInput.addEventListener('keyup', updateCursor);
codeInput.addEventListener('click', updateCursor);
codeInput.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') {
    event.preventDefault();
    codeInput.setRangeText('    ', codeInput.selectionStart, codeInput.selectionEnd, 'end');
    codeInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
});

$('#file-list').addEventListener('click', (event) => {
  const button = event.target.closest('[data-name]');
  if (!button) return;
  state.activeName = button.dataset.name;
  updateEditor();
});
$('#tab-strip').addEventListener('click', (event) => {
  const close = event.target.closest('[data-close]');
  if (close) { event.stopPropagation(); return closeTab(close.dataset.close); }
  const tab = event.target.closest('[data-name]');
  if (tab) { state.activeName = tab.dataset.name; updateEditor(); }
});

$('#explorer-add').addEventListener('click', newFile);
$('#save-file').addEventListener('click', saveFile);
$('#export-pdf').addEventListener('click', downloadPdf);
$('#run-button').addEventListener('click', () => state.view === 'dfd' ? runDfd() : compilePreview());
$('#dfd-simulate').addEventListener('click', runDfd);
$('#dfd-step').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const active = button.classList.toggle('is-active');
  button.textContent = active ? 'Paso a paso activo' : 'Paso a paso';
  addMessage(active ? 'Modo de ejecución paso a paso activado.' : 'Modo de ejecución continua activado.', 'info');
});
document.querySelectorAll('.dfd-tool').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.dfd-tool').forEach((tool) => tool.classList.toggle('is-selected', tool === button));
  addMessage(`Herramienta seleccionada: ${button.dataset.dfdTool}`, 'info');
}));
$('#clear-console').addEventListener('click', () => runCommand('clear'));
$('#command-form').addEventListener('submit', (event) => {
  event.preventDefault();
  runCommand($('#command-input').value);
  $('#command-input').value = '';
});
document.querySelectorAll('.console-tab').forEach((button) => button.addEventListener('click', () => {
  state.filter = button.dataset.filter;
  document.querySelectorAll('.console-tab').forEach((tab) => tab.classList.toggle('is-active', tab === button));
  renderMessages();
}));
document.querySelectorAll('.activity-button[data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view === 'search' ? 'colors' : button.dataset.view)));

$('#sidebar-toggle').addEventListener('click', () => ide.classList.toggle('sidebar-hidden'));
$('#guide-toggle').addEventListener('click', () => {
  if (state.view === 'colors') {
    setView('files');
    ide.classList.remove('guide-hidden');
    return;
  }
  ide.classList.toggle('guide-hidden');
});
$('#guide-close').addEventListener('click', () => ide.classList.add('guide-hidden'));
$('#search-input').addEventListener('input', (event) => setSearch(event.target.value));
$('#close-search').addEventListener('click', () => { $('#search-input').value = ''; setSearch(''); setView('files'); });
document.querySelectorAll('.syntax-card').forEach((button) => button.addEventListener('click', () => insertSnippet(button.dataset.insert)));

const settingsModal = $('#settings-modal');
function closeSettings() { settingsModal.hidden = true; }
$('#settings-trigger').addEventListener('click', () => { settingsModal.hidden = false; });
$('#settings-close').addEventListener('click', closeSettings);
$('#settings-done').addEventListener('click', closeSettings);
settingsModal.addEventListener('click', (event) => { if (event.target === settingsModal) closeSettings(); });
$('#font-size').addEventListener('change', applyPreferences);
$('#light-mode').addEventListener('change', applyPreferences);
$('#autosave').addEventListener('change', applyPreferences);
$('#author-name').addEventListener('input', applyPreferences);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeSettings();
  if (event.key === 'F5') { event.preventDefault(); compilePreview(); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveFile(); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') { event.preventDefault(); setView('search'); }
});

restorePreferences();
updateEditor();
addMessage('Entorno listo. Escribe help para consultar los comandos.', 'info');