import { describe, it, expect } from 'vitest';
import { Text, EditorState } from '@codemirror/state';
import { IndentContext } from '@codemirror/language';
import {
  OPEN_KEYWORD_REGEX,
  CLOSE_KEYWORD_REGEX,
  INTERMEDIATE_KEYWORD_REGEX,
  computeBlockScopes,
  pseudocodeIndent,
  cleanLine,
} from '../src/components/editor/pseudocodeIndent';

describe('Auto-Indentación y Guías de Ramificación en Pseudocódigo', () => {
  describe('Detección de Palabras Clave Estructurales', () => {
    it('detecta aperturas de bloque (Algoritmo, Entonces, Hacer, Repetir, Segun, Caso)', () => {
      expect(OPEN_KEYWORD_REGEX.test('Algoritmo calcular')).toBe(true);
      expect(OPEN_KEYWORD_REGEX.test('Proceso principal')).toBe(true);
      expect(OPEN_KEYWORD_REGEX.test('Inicio')).toBe(true);
      expect(OPEN_KEYWORD_REGEX.test('Si x > 0 Entonces')).toBe(true);
      expect(OPEN_KEYWORD_REGEX.test('Mientras contador < 10 Hacer')).toBe(true);
      expect(OPEN_KEYWORD_REGEX.test('Para i <- 1 Hasta 100 Con Paso 1 Hacer')).toBe(true);
      expect(OPEN_KEYWORD_REGEX.test('Repetir')).toBe(true);
      expect(OPEN_KEYWORD_REGEX.test('Segun opcion Hacer')).toBe(true);
      expect(OPEN_KEYWORD_REGEX.test('Caso 1:')).toBe(true);
      expect(OPEN_KEYWORD_REGEX.test('De Otro Modo:')).toBe(true);
    });

    it('detecta cierres de bloque (FinAlgoritmo, FinSi, FinPara, FinMientras, Hasta Que, FinSegun)', () => {
      expect(CLOSE_KEYWORD_REGEX.test('FinAlgoritmo')).toBe(true);
      expect(CLOSE_KEYWORD_REGEX.test('FinProceso')).toBe(true);
      expect(CLOSE_KEYWORD_REGEX.test('Fin')).toBe(true);
      expect(CLOSE_KEYWORD_REGEX.test('FinSi')).toBe(true);
      expect(CLOSE_KEYWORD_REGEX.test('Fin Si')).toBe(true);
      expect(CLOSE_KEYWORD_REGEX.test('FinPara')).toBe(true);
      expect(CLOSE_KEYWORD_REGEX.test('Fin Para')).toBe(true);
      expect(CLOSE_KEYWORD_REGEX.test('FinMientras')).toBe(true);
      expect(CLOSE_KEYWORD_REGEX.test('Fin Mientras')).toBe(true);
      expect(CLOSE_KEYWORD_REGEX.test('Hasta Que x == 10')).toBe(true);
      expect(CLOSE_KEYWORD_REGEX.test('Hasta x > 0')).toBe(true);
      expect(CLOSE_KEYWORD_REGEX.test('FinSegun')).toBe(true);
      expect(CLOSE_KEYWORD_REGEX.test('Fin Segun')).toBe(true);
    });

    it('detecta ramas intermedias (Sino, Sino Si, Caso)', () => {
      expect(INTERMEDIATE_KEYWORD_REGEX.test('Sino')).toBe(true);
      expect(INTERMEDIATE_KEYWORD_REGEX.test('Sino Si x < 0 Entonces')).toBe(true);
      expect(INTERMEDIATE_KEYWORD_REGEX.test('Caso 2:')).toBe(true);
      expect(INTERMEDIATE_KEYWORD_REGEX.test('De Otro Modo:')).toBe(true);
    });

    it('ignora comentarios y cadenas al limpiar líneas', () => {
      expect(cleanLine('Si x > 0 Entonces // abre condicion')).toBe('Si x > 0 Entonces');
      expect(cleanLine('Mostrar "FinSi no debe ser cierre";')).toBe('Mostrar "";');
    });
  });

  describe('Cálculo de Jerarquía de Bloques (computeBlockScopes)', () => {
    it('construye los ámbitos de bloque anidados correctamente', () => {
      const code = [
        'Algoritmo prueba',
        '    Si x > 0 Entonces',
        '        Escribir "Mayor"',
        '    Sino',
        '        Escribir "Menor o igual"',
        '    FinSi',
        'FinAlgoritmo',
      ].join('\n');

      const doc = Text.of(code.split('\n'));
      const scopes = computeBlockScopes(doc);

      expect(scopes.length).toBe(2);

      // Bloque Si (interno)
      const ifScope = scopes.find((s) => s.type === 'si');
      expect(ifScope).toBeDefined();
      expect(ifScope?.startLine).toBe(2);
      expect(ifScope?.endLine).toBe(6);
      expect(ifScope?.indentCol).toBe(4);
      expect(ifScope?.subBranches).toContain(4); // Línea de Sino

      // Bloque Algoritmo (externo)
      const algoScope = scopes.find((s) => s.type === 'algoritmo');
      expect(algoScope).toBeDefined();
      expect(algoScope?.startLine).toBe(1);
      expect(algoScope?.endLine).toBe(7);
      expect(algoScope?.indentCol).toBe(0);
    });

    it('mantiene bloques abiertos hasta el final del doc si no han sido cerrados aún', () => {
      const code = [
        'Algoritmo enProgreso',
        '    Mientras true Hacer',
        '        Escribir "bucle"',
      ].join('\n');

      const doc = Text.of(code.split('\n'));
      const scopes = computeBlockScopes(doc);

      expect(scopes.length).toBe(2);
      const whileScope = scopes.find((s) => s.type === 'mientras');
      expect(whileScope?.startLine).toBe(2);
      expect(whileScope?.endLine).toBe(3); // Extendido hasta la última línea del doc
    });
  });

  describe('Cálculo de Auto-Indentación (pseudocodeIndent)', () => {
    it('aumenta automáticamente 4 espacios al presionar Enter tras apertura', () => {
      const code = [
        'Algoritmo miCodigo',
        '', // Posición tras Enter en Algoritmo
      ].join('\n');

      const state = EditorState.create({ doc: code });
      const context = new IndentContext(state, { pos: state.doc.line(2).from });

      const indent = pseudocodeIndent(context, state.doc.line(2).from);
      expect(indent).toBe(4);
    });

    it('aumenta sangría (+4) tras Si ... Entonces', () => {
      const code = [
        'Algoritmo miCodigo',
        '    Si x > 0 Entonces',
        '', // Línea tras Enter
      ].join('\n');

      const state = EditorState.create({ doc: code });
      const context = new IndentContext(state, { pos: state.doc.line(3).from });

      const indent = pseudocodeIndent(context, state.doc.line(3).from);
      expect(indent).toBe(8);
    });

    it('des-indenta automáticamente (-4) al escribir FinSi o FinAlgoritmo', () => {
      const code = [
        'Algoritmo miCodigo',
        '    Si x > 0 Entonces',
        '        Escribir "Hola"',
        '        FinSi', // Usuario escribió FinSi a nivel 8, debe des-indentar a 4
      ].join('\n');

      const state = EditorState.create({ doc: code });
      const context = new IndentContext(state);

      const indent = pseudocodeIndent(context, state.doc.line(4).from, 'FinSi');
      expect(indent).toBe(4);
    });

    it('des-indenta automáticamente (-4) al escribir Sino', () => {
      const code = [
        'Algoritmo miCodigo',
        '    Si x > 0 Entonces',
        '        Escribir "Hola"',
        '        Sino', // Usuario escribió Sino, debe alinearse con el Si a nivel 4
      ].join('\n');

      const state = EditorState.create({ doc: code });
      const context = new IndentContext(state);

      const indent = pseudocodeIndent(context, state.doc.line(4).from, 'Sino');
      expect(indent).toBe(4);
    });

    it('des-indenta a nivel 0 al escribir FinAlgoritmo tras instrucciones de nivel 4', () => {
      const code = [
        'Algoritmo miCodigo',
        '    Escribir "Adios"',
        '    FinAlgoritmo', // Debe des-indentar a nivel 0
      ].join('\n');

      const state = EditorState.create({ doc: code });
      const context = new IndentContext(state);

      const indent = pseudocodeIndent(context, state.doc.line(3).from, 'FinAlgoritmo');
      expect(indent).toBe(0);
    });
  });
});
