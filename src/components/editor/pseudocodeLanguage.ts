import { StreamLanguage, StringStream, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

const KEYWORDS = new Set([
  'algoritmo',
  'finalgoritmo',
  'inicio',
  'fin',
  'var',
  'definir',
  'como',
  'si',
  'entonces',
  'sino',
  'finsi',
  'mientras',
  'hacer',
  'finmientras',
  'para',
  'hasta',
  'con',
  'paso',
  'finpara',
  'leer',
  'mostrar',
  'escribir',
]);

const TYPES = new Set([
  'entero',
  'decimal',
  'real',
  'cadena',
  'texto',
  'caracter',
  'booleano',
  'logico',
]);

const LOGIC_OPERATORS = new Set(['y', 'o', 'no', 'mod']);

const BOOLEANS = new Set(['verdadero', 'falso', 'true', 'false']);

interface ParserState {
  inBlockComment: boolean;
}

export const pseudocodeLanguage = StreamLanguage.define<ParserState>({
  name: 'pseudocode-es',
  startState() {
    return { inBlockComment: false };
  },
  tokenTable: {
    keyword: t.keyword,
    typeName: t.typeName,
    logicOperator: t.logicOperator,
    bool: t.bool,
    string: t.string,
    number: t.number,
    operator: t.operator,
    lineComment: t.lineComment,
    blockComment: t.blockComment,
    variableName: t.variableName,
    punctuation: t.punctuation,
  },
  token(stream: StringStream, state: ParserState): string | null {
    if (state.inBlockComment) {
      if (stream.match('*/')) {
        state.inBlockComment = false;
        return 'blockComment';
      }
      stream.next();
      return 'blockComment';
    }

    if (stream.eatSpace()) {
      return null;
    }

    // Comentarios de una línea
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'lineComment';
    }

    // Comentarios multilínea
    if (stream.match('/*')) {
      state.inBlockComment = true;
      return 'blockComment';
    }

    // Cadenas de texto
    if (stream.match(/^"([^"\\]|\\.)*"/)) {
      return 'string';
    }
    if (stream.match(/^'([^'\\]|\\.)*'/)) {
      return 'string';
    }

    // Asignación y Operadores compuestos
    if (stream.match(/^(<-|:=|<=|>=|<>|!=|==|\&\&|\|\|)/)) {
      return 'operator';
    }

    // Operadores simples
    if (stream.match(/^[+\-*\/%^=<>]/)) {
      return 'operator';
    }

    // Delimitadores
    if (stream.match(/^[(),:;]/)) {
      return 'punctuation';
    }

    // Números
    if (stream.match(/^[0-9]+(\.[0-9]+)?/)) {
      return 'number';
    }

    // Identificadores y Palabras Reservadas
    if (stream.match(/^[a-zA-ZáéíóúñÁÉÍÓÚÑ_][a-zA-Z0-9áéíóúñÁÉÍÓÚÑ_]*/)) {
      const word = stream.current().toLowerCase();

      if (KEYWORDS.has(word)) {
        return 'keyword';
      }
      if (TYPES.has(word)) {
        return 'typeName';
      }
      if (LOGIC_OPERATORS.has(word)) {
        return 'logicOperator';
      }
      if (BOOLEANS.has(word)) {
        return 'bool';
      }

      return 'variableName';
    }

    stream.next();
    return null;
  },
});

export const pseudocodeHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: 'var(--syntax-keyword, #38bdf8)', fontWeight: '600' },
  { tag: t.typeName, color: 'var(--syntax-type, #34d399)', fontWeight: '500' },
  { tag: t.logicOperator, color: 'var(--syntax-logic, #c084fc)', fontWeight: '600' },
  { tag: t.bool, color: 'var(--syntax-bool, #f472b6)', fontWeight: '500' },
  { tag: t.string, color: 'var(--syntax-string, #fbbf24)' },
  { tag: t.number, color: 'var(--syntax-number, #67e8f9)' },
  { tag: t.operator, color: 'var(--syntax-operator, #f87171)', fontWeight: '600' },
  { tag: t.lineComment, color: 'var(--syntax-comment, #71717a)', fontStyle: 'italic' },
  { tag: t.blockComment, color: 'var(--syntax-comment, #71717a)', fontStyle: 'italic' },
  { tag: t.variableName, color: 'var(--syntax-variable, #f4f4f5)' },
  { tag: t.punctuation, color: 'var(--syntax-punctuation, #a1a1aa)' },
]);

export const pseudocodeTheme = syntaxHighlighting(pseudocodeHighlightStyle);
