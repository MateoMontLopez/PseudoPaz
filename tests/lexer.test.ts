import { describe, expect, it } from 'vitest';
import { Lexer, LexerError } from '../src/engine/lexer/Lexer';
import { TokenType } from '../src/engine/lexer/tokens';

describe('Lexer', () => {
  it('debe tokenizar palabras clave de estructura y tipos', () => {
    const source = `
      Algoritmo Test
        Var x, y: entero;
        Definir nombre Como Cadena;
        Inicio
        Fin
      FinAlgoritmo
    `;

    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const types = tokens.map((t) => t.type);
    expect(types).toContain(TokenType.ALGORITMO);
    expect(types).toContain(TokenType.VAR);
    expect(types).toContain(TokenType.TIPO_ENTERO);
    expect(types).toContain(TokenType.DEFINIR);
    expect(types).toContain(TokenType.COMO);
    expect(types).toContain(TokenType.TIPO_CADENA);
    expect(types).toContain(TokenType.INICIO);
    expect(types).toContain(TokenType.FIN);
    expect(types).toContain(TokenType.FINALGORITMO);
    expect(types[types.length - 1]).toBe(TokenType.EOF);
  });

  it('debe ser insensible a mayúsculas/minúsculas en palabras clave', () => {
    const source = 'algoritmo SI entonces SINO finsi MIENTRAS hacer finmientras PARA hasta con paso finpara LEER MOSTRAR';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    expect(tokens[0]?.type).toBe(TokenType.ALGORITMO);
    expect(tokens[1]?.type).toBe(TokenType.SI);
    expect(tokens[2]?.type).toBe(TokenType.ENTONCES);
    expect(tokens[3]?.type).toBe(TokenType.SINO);
    expect(tokens[4]?.type).toBe(TokenType.FINSI);
    expect(tokens[5]?.type).toBe(TokenType.MIENTRAS);
    expect(tokens[6]?.type).toBe(TokenType.HACER);
    expect(tokens[7]?.type).toBe(TokenType.FINMIENTRAS);
    expect(tokens[8]?.type).toBe(TokenType.PARA);
    expect(tokens[9]?.type).toBe(TokenType.HASTA);
    expect(tokens[10]?.type).toBe(TokenType.CON_PASO);
    expect(tokens[11]?.type).toBe(TokenType.FINPARA);
    expect(tokens[12]?.type).toBe(TokenType.LEER);
    expect(tokens[13]?.type).toBe(TokenType.MOSTRAR);
  });

  it('debe reconocer operadores y asignaciones', () => {
    const source = '<- = + - * / % ^ < <= > >= <> != Y O NO && || !';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    const expected = [
      TokenType.ASIGNACION,
      TokenType.IGUAL,
      TokenType.SUMA,
      TokenType.RESTA,
      TokenType.MULTIPLICACION,
      TokenType.DIVISION,
      TokenType.MODULO,
      TokenType.POTENCIA,
      TokenType.MENOR,
      TokenType.MENOR_IGUAL,
      TokenType.MAYOR,
      TokenType.MAYOR_IGUAL,
      TokenType.DISTINTO,
      TokenType.DISTINTO,
      TokenType.Y,
      TokenType.O,
      TokenType.NO,
      TokenType.Y,
      TokenType.O,
      TokenType.NO,
      TokenType.EOF,
    ];

    expect(tokens.map((t) => t.type)).toEqual(expected);
  });

  it('debe reconocer literales numéricos, cadenas y booleanos', () => {
    const source = `123 45.67 "Hola mundo" 'Pseudocódigo' Verdadero Falso`;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    expect(tokens[0]).toMatchObject({
      type: TokenType.LITERAL_ENTERO,
      literal: 123,
    });
    expect(tokens[1]).toMatchObject({
      type: TokenType.LITERAL_DECIMAL,
      literal: 45.67,
    });
    expect(tokens[2]).toMatchObject({
      type: TokenType.LITERAL_CADENA,
      literal: 'Hola mundo',
    });
    expect(tokens[3]).toMatchObject({
      type: TokenType.LITERAL_CADENA,
      literal: 'Pseudocódigo',
    });
    expect(tokens[4]).toMatchObject({
      type: TokenType.LITERAL_BOOLEANO,
      literal: true,
    });
    expect(tokens[5]).toMatchObject({
      type: TokenType.LITERAL_BOOLEANO,
      literal: false,
    });
  });

  it('debe omitir comentarios de una línea y multilínea', () => {
    const source = `
      // Comentario de una línea
      x <- 10;
      /* Comentario
         multilínea */
      y <- 20;
    `;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize().filter((t) => t.type !== TokenType.EOF);

    expect(tokens.length).toBe(8); // x, <-, 10, ;, y, <-, 20, ;
    expect(tokens[0]?.lexeme).toBe('x');
    expect(tokens[4]?.lexeme).toBe('y');
  });

  it('debe rastrear línea y columna con precisión', () => {
    const source = 'x <-\n  42';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();

    expect(tokens[0]).toMatchObject({ lexeme: 'x', line: 1, column: 1 });
    expect(tokens[1]).toMatchObject({ lexeme: '<-', line: 1, column: 3 });
    expect(tokens[2]).toMatchObject({ literal: 42, line: 2, column: 3 });
  });

  it('debe lanzar LexerError si una cadena no se cierra', () => {
    const source = 'mensaje <- "cadena sin cerrar';
    const lexer = new Lexer(source);

    expect(() => lexer.tokenize()).toThrowError(LexerError);
  });
});
