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
  { tag: t.keyword, color: '#38bdf8', fontWeight: '600' },          // Sky blue (Algoritmo, Si, Para...)
  { tag: t.typeName, color: '#34d399', fontWeight: '500' },         // Emerald (entero, cadena...)
  { tag: t.logicOperator, color: '#c084fc', fontWeight: '600' },     // Purple (Y, O, NO, MOD)
  { tag: t.bool, color: '#f472b6', fontWeight: '500' },              // Pink (Verdadero, Falso)
  { tag: t.string, color: '#fbbf24' },                               // Amber ("hola")
  { tag: t.number, color: '#67e8f9' },                               // Cyan (123, 45.6)
  { tag: t.operator, color: '#f87171', fontWeight: '600' },          // Rose (<-, +, =)
  { tag: t.lineComment, color: '#71717a', fontStyle: 'italic' },     // Zinc 500
  { tag: t.blockComment, color: '#71717a', fontStyle: 'italic' },    // Zinc 500
  { tag: t.variableName, color: '#f4f4f5' },                         // Zinc 100
  { tag: t.punctuation, color: '#a1a1aa' },                          // Zinc 400
]);

export const pseudocodeTheme = syntaxHighlighting(pseudocodeHighlightStyle);
