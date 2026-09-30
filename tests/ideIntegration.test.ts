import { describe, it, expect } from 'vitest';
import { DEFAULT_FILES, loadStoredFiles, saveStoredFiles } from '../src/types/workspace';
import { pseudocodeCompletionSource } from '../src/components/editor/pseudocodeAutocomplete';
import { Lexer } from '../src/engine/lexer/Lexer';
import { Parser } from '../src/engine/parser/Parser';
import { CompletionContext } from '@codemirror/autocomplete';

describe('Integración UI - Workspace Files y Autocompletado', () => {
  it('debe cargar los archivos iniciales por defecto (.psc)', () => {
    expect(DEFAULT_FILES.length).toBe(1);
    const names = DEFAULT_FILES.map((f) => f.name);
    expect(names).toContain('sin_titulo.psc');
  });

  it('todos los archivos iniciales por defecto deben compilar sintácticamente sin errores', () => {
    for (const file of DEFAULT_FILES) {
      const lexer = new Lexer(file.content);
      const tokens = lexer.tokenize();
      expect(tokens.length).toBeGreaterThan(0);

      const parser = new Parser(tokens);
      const ast = parser.parse();
      expect(ast).toBeDefined();
      expect(ast.nodeType).toBe('ProgramNode');
      expect(Array.isArray(ast.body)).toBe(true);
    }
  });

  it('debe persistir y recuperar archivos correctamente cuando localStorage está disponible', () => {
    const memoryStore: Record<string, string> = {};
    const mockStorage = {
      getItem: (key: string) => memoryStore[key] || null,
      setItem: (key: string, val: string) => {
        memoryStore[key] = val;
      },
      clear: () => {},
      removeItem: (key: string) => {
        delete memoryStore[key];
      },
      key: () => null,
      length: 0,
    };
    // @ts-expect-error simulación global
    globalThis.localStorage = mockStorage;

    const testFiles = [
      { id: '1', name: 'prueba.psc', content: 'Algoritmo Test\nFinAlgoritmo' },
    ];
    saveStoredFiles(testFiles);
    const loaded = loadStoredFiles();
    expect(loaded.length).toBe(1);
    expect(loaded[0].name).toBe('prueba.psc');
  });

  it('el autocompletado debe sugerir palabras reservadas del sistema (Definir, Mientras, Si, etc.)', () => {
    // Simular contexto de autocompletado para 'def'
    const mockContextDef = {
      matchBefore: () => ({ from: 0, to: 3, text: 'def' }),
      explicit: false,
    } as unknown as CompletionContext;

    const resDef = pseudocodeCompletionSource(mockContextDef);
    expect(resDef).not.toBeNull();
    const labelsDef = resDef?.options.map((o) => o.label);
    expect(labelsDef).toContain('Definir');

    // Simular contexto de autocompletado para 'mien'
    const mockContextMien = {
      matchBefore: () => ({ from: 0, to: 4, text: 'mien' }),
      explicit: false,
    } as unknown as CompletionContext;

    const resMien = pseudocodeCompletionSource(mockContextMien);
    expect(resMien).not.toBeNull();
    const labelsMien = resMien?.options.map((o) => o.label);
    expect(labelsMien).toContain('Mientras');

    // Simular contexto de autocompletado para 'si'
    const mockContextSi = {
      matchBefore: () => ({ from: 0, to: 2, text: 'si' }),
      explicit: false,
    } as unknown as CompletionContext;

    const resSi = pseudocodeCompletionSource(mockContextSi);
    expect(resSi).not.toBeNull();
    const labelsSi = resSi?.options.map((o) => o.label);
    expect(labelsSi).toContain('Si');
    expect(labelsSi).toContain('Sino');
  });
});
