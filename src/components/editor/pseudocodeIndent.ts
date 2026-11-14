import { IndentContext, indentService, indentUnit } from '@codemirror/language';
import {
  ViewPlugin,
  ViewUpdate,
  Decoration,
  DecorationSet,
  WidgetType,
  EditorView,
} from '@codemirror/view';
import { Text } from '@codemirror/state';

export const INDENT_SIZE = 4; // 4 espacios por nivel de sangría estándar

/**
 * Expresiones regulares para detección de apertura, cierre y ramas intermedias en Pseudocódigo.
 */
export const OPEN_KEYWORD_REGEX =
  /^\s*(?:(?:algoritmo|proceso)\b.*|inicio\b|repetir\b|(?:si\b.*(?:\bentonces\b|\bthen\b))|(?:mientras\b.*(?:\bhacer\b|\bdo\b))|(?:para\b.*(?:\bhacer\b|\bdo\b))|(?:segun\b.*(?:\bhacer\b)?)|(?:caso\b.*:)|(?:de\s+otro\s+modo\s*:))\s*$/i;

export const CLOSE_KEYWORD_REGEX =
  /^\s*(?:finalgoritmo|finproceso|fin\b|finsi|fin\s+si|finpara|fin\s+para|finmientras|fin\s+mientras|hasta\s+que|hasta\b|finsegun|fin\s+segun)\b/i;

export const INTERMEDIATE_KEYWORD_REGEX =
  /^\s*(?:sino\s+si\b.*(?:\bentonces\b|\bthen\b)|sino\b|caso\b.*:|de\s+otro\s+modo\s*:)\s*$/i;

/**
 * Limpia comentarios de una línea y cadenas de texto para analizar únicamente la sintaxis estructural.
 */
export function cleanLine(lineText: string): string {
  let cleaned = lineText.replace(/\/\/.*$/, '');
  cleaned = cleaned.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  cleaned = cleaned.replace(/'(?:[^'\\]|\\.)*'/g, "''");
  return cleaned.trim();
}

export interface BlockScope {
  id: string;
  type: string;
  startLine: number; // 1-based
  endLine: number;   // 1-based
  indentCol: number; // Columna base de la estructura (ej. 0, 4, 8...)
  contentCol: number; // Columna del contenido interior (indentCol + 4)
  subBranches: number[]; // Líneas de ramas intermedias (ej. Sino)
}

/**
 * Analiza el documento completo y construye el árbol de bloques jerárquicos de pseudocódigo.
 */
export function computeBlockScopes(doc: Text): BlockScope[] {
  const scopes: BlockScope[] = [];
  const stack: Array<{
    id: string;
    type: string;
    startLine: number;
    indentCol: number;
    subBranches: number[];
  }> = [];

  for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
    const line = doc.line(lineNum);
    const rawText = line.text;
    const cleaned = cleanLine(rawText);
    if (!cleaned) continue;

    // Calcular la sangría física en espacios de la línea
    const indentMatch = rawText.match(/^\s*/);
    const lineIndent = indentMatch ? indentMatch[0].length : 0;

    // 1. Detección de CIERRES
    if (CLOSE_KEYWORD_REGEX.test(cleaned)) {
      if (stack.length > 0) {
        // Encontrar el bloque correspondiente más cercano en la pila
        let targetIdx = stack.length - 1;
        const lower = cleaned.toLowerCase();

        if (/^finsi\b|^fin\s+si\b/.test(lower)) {
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].type === 'si') {
              targetIdx = i;
              break;
            }
          }
        } else if (/^finpara\b|^fin\s+para\b/.test(lower)) {
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].type === 'para') {
              targetIdx = i;
              break;
            }
          }
        } else if (/^finmientras\b|^fin\s+mientras\b/.test(lower)) {
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].type === 'mientras') {
              targetIdx = i;
              break;
            }
          }
        } else if (/^hasta\b|^hasta\s+que\b/.test(lower)) {
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].type === 'repetir') {
              targetIdx = i;
              break;
            }
          }
        } else if (/^finsegun\b|^fin\s+segun\b/.test(lower)) {
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].type === 'segun') {
              targetIdx = i;
              break;
            }
          }
        } else if (/^finalgoritmo\b|^finproceso\b|^fin\b/.test(lower)) {
          for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].type === 'algoritmo') {
              targetIdx = i;
              break;
            }
          }
        }

        const popped = stack.splice(targetIdx, 1)[0];
        scopes.push({
          id: popped.id,
          type: popped.type,
          startLine: popped.startLine,
          endLine: lineNum,
          indentCol: popped.indentCol,
          contentCol: popped.indentCol + INDENT_SIZE,
          subBranches: popped.subBranches,
        });
      }
      continue;
    }

    // 2. Detección de RAMAS INTERMEDIAS (Sino, Sino Si, Caso)
    if (INTERMEDIATE_KEYWORD_REGEX.test(cleaned)) {
      if (stack.length > 0) {
        stack[stack.length - 1].subBranches.push(lineNum);
      }
      continue;
    }

    // 3. Detección de APERTURAS
    if (OPEN_KEYWORD_REGEX.test(cleaned)) {
      let type = 'bloque';
      const lower = cleaned.toLowerCase();
      if (/^algoritmo\b|^proceso\b|^inicio\b/.test(lower)) type = 'algoritmo';
      else if (/^si\b/.test(lower)) type = 'si';
      else if (/^para\b/.test(lower)) type = 'para';
      else if (/^mientras\b/.test(lower)) type = 'mientras';
      else if (/^repetir\b/.test(lower)) type = 'repetir';
      else if (/^segun\b/.test(lower)) type = 'segun';
      else if (/^caso\b|^de\s+otro\s+modo/.test(lower)) type = 'caso';

      stack.push({
        id: `${type}-${lineNum}-${Date.now()}`,
        type,
        startLine: lineNum,
        indentCol: lineIndent,
        subBranches: [],
      });
    }
  }

  // Cerrar bloques que quedaron abiertos hasta el final del archivo
  while (stack.length > 0) {
    const popped = stack.pop()!;
    scopes.push({
      id: popped.id,
      type: popped.type,
      startLine: popped.startLine,
      endLine: doc.lines,
      indentCol: popped.indentCol,
      contentCol: popped.indentCol + INDENT_SIZE,
      subBranches: popped.subBranches,
    });
  }

  return scopes;
}

/**
 * Función de cálculo de Auto-Indentación para CodeMirror 6.
 * Satisface:
 * 1. Enter tras apertura: +4 espacios respecto a la apertura.
 * 2. Escribir palabra de cierre o rama intermedia: alinear automáticamente al nivel del bloque.
 */
export function pseudocodeIndent(
  context: IndentContext,
  pos: number,
  textAfter?: string
): number | null {
  const { state } = context;
  const line = state.doc.lineAt(pos);
  const lineNum = line.number;

  // Analizar el texto a indentar en la línea actual
  const currentLineText = (textAfter ?? context.textAfterPos(pos) ?? line.text).trim();
  const cleanedCurrent = cleanLine(currentLineText);
  const isClosing = CLOSE_KEYWORD_REGEX.test(cleanedCurrent);
  const isIntermediate = INTERMEDIATE_KEYWORD_REGEX.test(cleanedCurrent);

  // Buscar la línea anterior con contenido no vacío
  let prevLineNum = lineNum - 1;
  let prevLineText = '';
  let prevLineIndent = 0;

  while (prevLineNum >= 1) {
    const prevLine = state.doc.line(prevLineNum);
    const cleaned = cleanLine(prevLine.text);
    if (cleaned.length > 0) {
      prevLineText = cleaned;
      const indentMatch = prevLine.text.match(/^\s*/);
      prevLineIndent = indentMatch ? indentMatch[0].length : 0;
      break;
    }
    prevLineNum--;
  }

  // Si no hay línea anterior (primera línea del documento)
  if (prevLineNum < 1) {
    return 0;
  }

  const prevOpensBlock = OPEN_KEYWORD_REGEX.test(prevLineText);

  // Caso A: La línea actual es un cierre o rama intermedia (FinSi, Sino, FinPara, etc.)
  if (isClosing || isIntermediate) {
    // Si la línea anterior acaba de abrir un bloque y el usuario escribió el cierre inmediatamente
    if (prevOpensBlock) {
      return prevLineIndent;
    }
    // Des-indentar reduciendo un nivel de sangría (4 espacios) respecto al cuerpo anterior
    return Math.max(0, prevLineIndent - INDENT_SIZE);
  }

  // Caso B: La línea anterior abrió un bloque (Enter tras Algoritmo, Entonces, Hacer, etc.)
  if (prevOpensBlock) {
    return prevLineIndent + INDENT_SIZE;
  }

  // Caso C: Línea normal de código dentro del bloque: heredar la sangría de la línea anterior
  return prevLineIndent;
}

/**
 * Servicio de indentación de CodeMirror 6.
 */
export const pseudocodeIndentService = indentService.of((context, pos) => {
  return pseudocodeIndent(context, pos);
});

/**
 * Extensión que fija el tamaño de unidad de sangría en 4 espacios.
 */
export const pseudocodeIndentUnit = indentUnit.of('    ');

/**
 * Widget que renderiza las guías visuales de sangría en una línea específica.
 */
class IndentGuidesWidget extends WidgetType {
  constructor(readonly guides: Array<{ col: number; active: boolean }>) {
    super();
  }

  toDOM(): HTMLElement {
    const container = document.createElement('span');
    container.className = 'cm-indent-guides-container';
    container.setAttribute('aria-hidden', 'true');

    for (const guide of this.guides) {
      const line = document.createElement('span');
      line.className = `cm-indent-guide ${guide.active ? 'cm-indent-guide-active' : ''}`;
      // Usar unidades 'ch' para alineación tipográfica monoespaciada exacta
      line.style.left = `${guide.col}ch`;
      container.appendChild(line);
    }

    return container;
  }

  eq(other: IndentGuidesWidget): boolean {
    if (this.guides.length !== other.guides.length) return false;
    return this.guides.every(
      (g, i) => g.col === other.guides[i].col && g.active === other.guides[i].active
    );
  }

  ignoreEvent(): boolean {
    return true;
  }
}

/**
 * Plugin de View de CodeMirror 6 para renderizar las guías de ramificación visual de bloques.
 */
export const indentGuidesPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const doc = view.state.doc;
      if (doc.lines === 0) return Decoration.none;

      // Determinar la línea actual del cursor para resaltar la rama activa
      const head = view.state.selection.main.head;
      const cursorLine = doc.lineAt(head).number;

      // Calcular los bloques del documento
      const scopes = computeBlockScopes(doc);

      // Encontrar el bloque activo más específico que envuelve el cursor
      let activeScope: BlockScope | null = null;
      let maxActiveLevel = -1;

      for (const scope of scopes) {
        if (cursorLine >= scope.startLine && cursorLine <= scope.endLine) {
          if (scope.indentCol > maxActiveLevel) {
            maxActiveLevel = scope.indentCol;
            activeScope = scope;
          }
        }
      }

      const builder: Array<{ from: number; deco: Decoration }> = [];

      // Iterar únicamente por los rangos visibles en el viewport para máxima fluidez a 60 FPS
      for (const { from, to } of view.visibleRanges) {
        const startLine = doc.lineAt(from).number;
        const endLine = doc.lineAt(to).number;

        for (let lineNum = startLine; lineNum <= endLine; lineNum++) {
          const line = doc.line(lineNum);

          // Determinar qué guías de bloque cruzan esta línea
          const lineGuides: Array<{ col: number; active: boolean }> = [];
          const seenCols = new Set<number>();

          for (const scope of scopes) {
            // La guía de ramificación conecta la apertura con el cierre
            if (lineNum >= scope.startLine && lineNum <= scope.endLine) {
              const guideCol = scope.indentCol;
              if (guideCol >= 0 && !seenCols.has(guideCol)) {
                seenCols.add(guideCol);
                const isActive = activeScope ? activeScope.indentCol === guideCol : false;
                lineGuides.push({ col: guideCol, active: isActive });
              }
            }
          }

          if (lineGuides.length > 0) {
            // Ordenar columnas de izquierda a derecha
            lineGuides.sort((a, b) => a.col - b.col);

            builder.push({
              from: line.from,
              deco: Decoration.widget({
                widget: new IndentGuidesWidget(lineGuides),
                side: -1,
              }),
            });
          }
        }
      }

      // Crear DecorationSet ordenado
      builder.sort((a, b) => a.from - b.from);
      return Decoration.set(builder.map((b) => b.deco.range(b.from)));
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);
