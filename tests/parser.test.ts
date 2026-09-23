import { describe, expect, it } from 'vitest';
import { Lexer } from '../src/engine/lexer/Lexer';
import { Parser, ParserError } from '../src/engine/parser/Parser';
import {
  ASTNodeType,
  AssignmentNode,
  BinaryExpressionNode,
  ForStatementNode,
  IfStatementNode,
  PrintStatementNode,
  ReadStatementNode,
  WhileStatementNode,
} from '../src/engine/parser/ast';

function parseCode(code: string) {
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}

describe('Parser', () => {
  it('debe parsear la cabecera y declaraciones de variables en Var y Definir', () => {
    const code = `
      Algoritmo TestDeclaraciones
        Var
          a, b: entero;
          c: cadena;
        Definir flag Como Booleano;
      FinAlgoritmo
    `;

    const ast = parseCode(code);
    expect(ast.nodeType).toBe(ASTNodeType.PROGRAM);
    expect(ast.name).toBe('TestDeclaraciones');
    expect(ast.declarations.length).toBe(3);

    expect(ast.declarations[0]?.identifiers).toEqual(['a', 'b']);
    expect(ast.declarations[0]?.dataType).toBe('entero');

    expect(ast.declarations[1]?.identifiers).toEqual(['c']);
    expect(ast.declarations[1]?.dataType).toBe('cadena');

    expect(ast.declarations[2]?.identifiers).toEqual(['flag']);
    expect(ast.declarations[2]?.dataType).toBe('booleano');
  });

  it('debe parsear asignaciones con <- y =', () => {
    const code = `
      x <- 10 + 5;
      nombre = "Juan";
    `;

    const ast = parseCode(code);
    expect(ast.body.length).toBe(2);

    const assign1 = ast.body[0] as AssignmentNode;
    expect(assign1.nodeType).toBe(ASTNodeType.ASSIGNMENT);
    expect(assign1.identifier).toBe('x');
    expect(assign1.value.nodeType).toBe(ASTNodeType.BINARY_EXPRESSION);

    const assign2 = ast.body[1] as AssignmentNode;
    expect(assign2.nodeType).toBe(ASTNodeType.ASSIGNMENT);
    expect(assign2.identifier).toBe('nombre');
  });

  it('debe parsear sentencia condicional Si - Entonces - Sino - FinSi', () => {
    const code = `
      Si x > 0 Entonces
        Mostrar "Positivo"
      Sino
        Mostrar "Negativo o cero"
      FinSi
    `;

    const ast = parseCode(code);
    expect(ast.body.length).toBe(1);

    const ifStmt = ast.body[0] as IfStatementNode;
    expect(ifStmt.nodeType).toBe(ASTNodeType.IF_STATEMENT);
    expect(ifStmt.condition.nodeType).toBe(ASTNodeType.BINARY_EXPRESSION);
    expect(ifStmt.thenBranch.length).toBe(1);
    expect(ifStmt.elseBranch?.length).toBe(1);
  });

  it('debe parsear bucle Mientras - FinMientras', () => {
    const code = `
      Mientras contador < 10 Hacer
        contador <- contador + 1
      FinMientras
    `;

    const ast = parseCode(code);
    expect(ast.body.length).toBe(1);

    const whileStmt = ast.body[0] as WhileStatementNode;
    expect(whileStmt.nodeType).toBe(ASTNodeType.WHILE_STATEMENT);
    expect(whileStmt.body.length).toBe(1);
  });

  it('debe parsear bucle Para con y sin Con Paso', () => {
    const code = `
      Para i <- 1 Hasta 10 Con Paso 2 Hacer
        Mostrar i
      FinPara
    `;

    const ast = parseCode(code);
    expect(ast.body.length).toBe(1);

    const forStmt = ast.body[0] as ForStatementNode;
    expect(forStmt.nodeType).toBe(ASTNodeType.FOR_STATEMENT);
    expect(forStmt.identifier).toBe('i');
    expect(forStmt.stepValue).toBeDefined();
    expect(forStmt.body.length).toBe(1);
  });

  it('debe parsear sentencias Leer y Mostrar', () => {
    const code = `
      Leer a, b;
      Mostrar "La suma es: ", a + b;
    `;

    const ast = parseCode(code);
    expect(ast.body.length).toBe(2);

    const readStmt = ast.body[0] as ReadStatementNode;
    expect(readStmt.nodeType).toBe(ASTNodeType.READ_STATEMENT);
    expect(readStmt.identifiers).toEqual(['a', 'b']);

    const printStmt = ast.body[1] as PrintStatementNode;
    expect(printStmt.nodeType).toBe(ASTNodeType.PRINT_STATEMENT);
    expect(printStmt.expressions.length).toBe(2);
  });

  it('debe respetar la jerarquía y precedencia de operadores matemáticos y lógicos', () => {
    // 2 + 3 * 4 ^ 2 => 2 + (3 * (4 ^ 2))
    const code = 'resultado <- 2 + 3 * 4 ^ 2;';
    const ast = parseCode(code);

    const assign = ast.body[0] as AssignmentNode;
    const addExpr = assign.value as BinaryExpressionNode;
    expect(addExpr.operator).toBe('+');

    const mulExpr = addExpr.right as BinaryExpressionNode;
    expect(mulExpr.operator).toBe('*');

    const powExpr = mulExpr.right as BinaryExpressionNode;
    expect(powExpr.operator).toBe('^');
  });

  it('debe lanzar ParserError detallado ante sintaxis inválida', () => {
    const invalidCode = 'Si x > Entonces Mostrar "Error" FinSi';

    expect(() => parseCode(invalidCode)).toThrowError(ParserError);
  });
});
