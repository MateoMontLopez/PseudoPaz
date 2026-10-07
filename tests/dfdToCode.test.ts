import { describe, it, expect } from 'vitest';
import { convertDFDToPseudocode } from '../src/components/flowchart/dfdToCode';
import { Node, Edge } from '@xyflow/react';
import { Lexer } from '../src/engine/lexer/Lexer';
import { Parser } from '../src/engine/parser/Parser';
import { Interpreter } from '../src/engine/interpreter/Interpreter';

describe('DFD to Pseudocode Generator', () => {
  it('debe manejar diagramas vacíos con mensaje claro', () => {
    const result = convertDFDToPseudocode([], []);
    expect(result.success).toBe(false);
    expect(result.error).toContain('vacío');
  });

  it('debe convertir un flujo secuencial (Inicio -> Leer -> Proceso -> Mostrar -> Fin) y ser ejecutable', async () => {
    const nodes: Node[] = [
      { id: '1', type: 'terminal', position: { x: 0, y: 0 }, data: { label: 'Inicio: CalculoDoble' } },
      { id: '2', type: 'input', position: { x: 0, y: 100 }, data: { label: 'Leer num' } },
      { id: '3', type: 'process', position: { x: 0, y: 200 }, data: { label: 'doble <- num * 2' } },
      { id: '4', type: 'output', position: { x: 0, y: 300 }, data: { label: 'Mostrar "El doble es:", doble' } },
      { id: '5', type: 'terminal', position: { x: 0, y: 400 }, data: { label: 'Fin' } },
    ];

    const edges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5' },
    ];

    const result = convertDFDToPseudocode(nodes, edges);
    expect(result.success).toBe(true);
    expect(result.code).toBeDefined();

    const code = result.code!;
    expect(code).toContain('Algoritmo CalculoDoble');
    expect(code).toContain('Leer num');
    expect(code).toContain('doble <- num * 2');
    expect(code).toContain('Escribir "El doble es:", doble');
    expect(code).toContain('FinAlgoritmo');

    // Verificar que compila con el Lexer y Parser nativos de PseudoPaz
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    expect(ast).toBeDefined();
    expect(ast.nodeType).toBe('ProgramNode');

    // Ejecutar con el intérprete simulando lectura
    const printedOutputs: string[] = [];
    const interpreter = new Interpreter({
      onPrint: (msg) => printedOutputs.push(msg),
      onRead: async () => 7, // Valor ingresado simulado
    });

    await interpreter.execute(ast);
    expect(printedOutputs.some((msg) => msg.includes('14'))).toBe(true);
  });

  it('debe estructurar bifurcaciones condicionales (Decisión Sí / No)', () => {
    const nodes: Node[] = [
      { id: '1', type: 'terminal', position: { x: 0, y: 0 }, data: { label: 'Inicio' } },
      { id: '2', type: 'process', position: { x: 0, y: 100 }, data: { label: 'nota <- 4.5' } },
      { id: '3', type: 'decision', position: { x: 0, y: 200 }, data: { label: '¿nota >= 3.0?' } },
      { id: '4', type: 'output', position: { x: 100, y: 300 }, data: { label: 'Mostrar "Aprobado"' } },
      { id: '5', type: 'output', position: { x: -100, y: 300 }, data: { label: 'Mostrar "Reprobado"' } },
      { id: '6', type: 'terminal', position: { x: 0, y: 400 }, data: { label: 'Fin' } },
    ];

    const edges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4', label: 'Sí', sourceHandle: 'yes' },
      { id: 'e3-5', source: '3', target: '5', label: 'No', sourceHandle: 'no' },
      { id: 'e4-6', source: '4', target: '6' },
      { id: 'e5-6', source: '5', target: '6' },
    ];

    const result = convertDFDToPseudocode(nodes, edges);
    expect(result.success).toBe(true);
    const code = result.code!;
    expect(code).toContain('Si nota >= 3.0 Entonces');
    expect(code).toContain('Escribir "Aprobado"');
    expect(code).toContain('Sino');
    expect(code).toContain('Escribir "Reprobado"');
    expect(code).toContain('FinSi');

    // Compilar
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    expect(ast.nodeType).toBe('ProgramNode');
  });
});
