import { Token, TokenType } from '../lexer/tokens';
import {
  ASTNodeType,
  AssignmentNode,
  DataType,
  ExpressionNode,
  ForStatementNode,
  IfStatementNode,
  PrintStatementNode,
  ProgramNode,
  ReadStatementNode,
  StatementNode,
  VariableDeclarationNode,
  WhileStatementNode,
} from './ast';

export class ParserError extends Error {
  public readonly line: number;
  public readonly column: number;

  constructor(message: string, line: number, column: number) {
    super(`[Error Sintáctico] Línea ${line}, Columna ${column}: ${message}`);
    this.name = 'ParserError';
    this.line = line;
    this.column = column;
  }
}

export class Parser {
  private readonly tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  /**
   * Parsea la lista de tokens y retorna el nodo raíz ProgramNode.
   */
  public parse(): ProgramNode {
    let name = 'AlgoritmoSinNombre';
    let line = 1;
    let column = 1;

    // Verificar si comienza con 'Algoritmo <nombre>'
    if (this.match(TokenType.ALGORITMO)) {
      line = this.previous().line;
      column = this.previous().column;

      if (this.check(TokenType.IDENTIFICADOR)) {
        name = this.advance().lexeme;
      }
      this.consumeOptionalSemicolon();
    } else if (this.match(TokenType.INICIO)) {
      line = this.previous().line;
      column = this.previous().column;
      this.consumeOptionalSemicolon();
    }

    const declarations: VariableDeclarationNode[] = [];
    const body: StatementNode[] = [];

    // Si hay una sección 'Var', parsearla
    if (this.match(TokenType.VAR)) {
      this.consumeOptionalSemicolon();
      while (!this.isAtEnd() && !this.isEndOfBlockOrProgram()) {
        if (this.check(TokenType.DEFINIR)) {
          declarations.push(this.parseDefinirDeclaration());
        } else if (this.isVarDeclarationAhead()) {
          declarations.push(this.parseVarDeclaration());
        } else {
          break;
        }
      }
    }

    // Parsea las sentencias del cuerpo
    while (!this.isAtEnd() && !this.isEndOfBlockOrProgram()) {
      // También permitir declaraciones inline con Definir o Var
      if (this.check(TokenType.DEFINIR)) {
        declarations.push(this.parseDefinirDeclaration());
      } else if (this.check(TokenType.VAR)) {
        this.advance();
        this.consumeOptionalSemicolon();
        while (!this.isAtEnd() && !this.isEndOfBlockOrProgram()) {
          if (this.check(TokenType.DEFINIR)) {
            declarations.push(this.parseDefinirDeclaration());
          } else if (this.isVarDeclarationAhead()) {
            declarations.push(this.parseVarDeclaration());
          } else {
            break;
          }
        }
      } else if (this.isVarDeclarationAhead()) {
        declarations.push(this.parseVarDeclaration());
      } else {
        const stmt = this.parseStatement();
        if (stmt) {
          body.push(stmt);
        }
      }
    }

    // Consumir cierre 'FinAlgoritmo' o 'Fin' si existía apertura
    if (this.match(TokenType.FINALGORITMO) || this.match(TokenType.FIN)) {
      this.consumeOptionalSemicolon();
    }

    return {
      nodeType: ASTNodeType.PROGRAM,
      name,
      declarations,
      body,
      line,
      column,
    };
  }

  private isEndOfBlockOrProgram(): boolean {
    return (
      this.check(TokenType.FINALGORITMO) ||
      this.check(TokenType.FIN) ||
      this.check(TokenType.FINSI) ||
      this.check(TokenType.SINO) ||
      this.check(TokenType.FINMIENTRAS) ||
      this.check(TokenType.FINPARA) ||
      this.check(TokenType.EOF)
    );
  }

  private isVarDeclarationAhead(): boolean {
    let offset = this.current;
    if (this.tokens[offset]?.type !== TokenType.IDENTIFICADOR) {
      return false;
    }

    while (offset < this.tokens.length) {
      if (this.tokens[offset]?.type === TokenType.IDENTIFICADOR) {
        offset++;
        if (this.tokens[offset]?.type === TokenType.COMA) {
          offset++;
          continue;
        } else if (this.tokens[offset]?.type === TokenType.DOS_PUNTOS) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    return false;
  }

  /**
   * Parsea: a, b, c : entero;
   */
  private parseVarDeclaration(): VariableDeclarationNode {
    const startToken = this.peek();
    const identifiers: string[] = [];

    const firstId = this.consume(
      TokenType.IDENTIFICADOR,
      'Se esperaba el nombre de la variable a declarar en la sección Var'
    );
    identifiers.push(firstId.lexeme);

    while (this.match(TokenType.COMA)) {
      const nextId = this.consume(
        TokenType.IDENTIFICADOR,
        'Se esperaba otro identificador después de la coma'
      );
      identifiers.push(nextId.lexeme);
    }

    this.consume(
      TokenType.DOS_PUNTOS,
      "Se esperaban dos puntos ':' antes del tipo de variable (ej: a, b : entero)"
    );

    const dataType = this.parseDataType();
    this.consumeOptionalSemicolon();

    return {
      nodeType: ASTNodeType.VARIABLE_DECLARATION,
      identifiers,
      dataType,
      line: startToken.line,
      column: startToken.column,
    };
  }

  /**
   * Parsea: Definir a, b Como Entero;
   */
  private parseDefinirDeclaration(): VariableDeclarationNode {
    const definirToken = this.consume(TokenType.DEFINIR, "Se esperaba 'Definir'");
    const identifiers: string[] = [];

    const firstId = this.consume(
      TokenType.IDENTIFICADOR,
      "Se esperaba el nombre de la variable después de 'Definir'"
    );
    identifiers.push(firstId.lexeme);

    while (this.match(TokenType.COMA)) {
      const nextId = this.consume(
        TokenType.IDENTIFICADOR,
        'Se esperaba otro identificador después de la coma'
      );
      identifiers.push(nextId.lexeme);
    }

    this.consume(TokenType.COMO, "Se esperaba la palabra 'Como' (ej: Definir x Como Entero)");
    const dataType = this.parseDataType();
    this.consumeOptionalSemicolon();

    return {
      nodeType: ASTNodeType.VARIABLE_DECLARATION,
      identifiers,
      dataType,
      line: definirToken.line,
      column: definirToken.column,
    };
  }

  private parseDataType(): DataType {
    if (this.match(TokenType.TIPO_ENTERO)) return 'entero';
    if (this.match(TokenType.TIPO_DECIMAL)) return 'decimal';
    if (this.match(TokenType.TIPO_CADENA)) return 'cadena';
    if (this.match(TokenType.TIPO_CARACTER)) return 'caracter';
    if (this.match(TokenType.TIPO_BOOLEANO)) return 'booleano';

    const currentToken = this.peek();
    throw new ParserError(
      `Tipo de dato no válido: '${currentToken.lexeme}'. Tipos válidos: entero, decimal, cadena, caracter, booleano`,
      currentToken.line,
      currentToken.column
    );
  }

  private parseStatement(): StatementNode {
    if (this.match(TokenType.SI)) {
      return this.parseIfStatement();
    }
    if (this.match(TokenType.MIENTRAS)) {
      return this.parseWhileStatement();
    }
    if (this.match(TokenType.PARA)) {
      return this.parseForStatement();
    }
    if (this.match(TokenType.LEER)) {
      return this.parseReadStatement();
    }
    if (this.match(TokenType.MOSTRAR)) {
      return this.parsePrintStatement();
    }
    if (this.check(TokenType.IDENTIFICADOR)) {
      return this.parseAssignmentStatement();
    }

    const token = this.peek();
    throw new ParserError(
      `Instrucción no reconocida o inesperada: '${token.lexeme}'`,
      token.line,
      token.column
    );
  }

  /**
   * Si <condicion> Entonces <sentencias> [Sino <sentencias>] FinSi
   */
  private parseIfStatement(): IfStatementNode {
    const ifToken = this.previous();
    const condition = this.parseExpression();

    this.consume(
      TokenType.ENTONCES,
      "Se esperaba la palabra clave 'Entonces' después de la condición del Si"
    );
    this.consumeOptionalSemicolon();

    const thenBranch: StatementNode[] = [];
    while (
      !this.isAtEnd() &&
      !this.check(TokenType.SINO) &&
      !this.check(TokenType.FINSI) &&
      !this.check(TokenType.FINALGORITMO)
    ) {
      thenBranch.push(this.parseStatement());
    }

    let elseBranch: StatementNode[] | undefined = undefined;
    if (this.match(TokenType.SINO)) {
      this.consumeOptionalSemicolon();
      elseBranch = [];
      while (
        !this.isAtEnd() &&
        !this.check(TokenType.FINSI) &&
        !this.check(TokenType.FINALGORITMO)
      ) {
        elseBranch.push(this.parseStatement());
      }
    }

    this.consume(TokenType.FINSI, "Se esperaba 'FinSi' para cerrar el bloque Si");
    this.consumeOptionalSemicolon();

    return {
      nodeType: ASTNodeType.IF_STATEMENT,
      condition,
      thenBranch,
      elseBranch,
      line: ifToken.line,
      column: ifToken.column,
    };
  }

  /**
   * Mientras <condicion> Hacer <sentencias> FinMientras
   */
  private parseWhileStatement(): WhileStatementNode {
    const whileToken = this.previous();
    const condition = this.parseExpression();

    this.consume(
      TokenType.HACER,
      "Se esperaba la palabra clave 'Hacer' después de la condición del Mientras"
    );
    this.consumeOptionalSemicolon();

    const body: StatementNode[] = [];
    while (
      !this.isAtEnd() &&
      !this.check(TokenType.FINMIENTRAS) &&
      !this.check(TokenType.FINALGORITMO)
    ) {
      body.push(this.parseStatement());
    }

    this.consume(
      TokenType.FINMIENTRAS,
      "Se esperaba 'FinMientras' para cerrar el bucle Mientras"
    );
    this.consumeOptionalSemicolon();

    return {
      nodeType: ASTNodeType.WHILE_STATEMENT,
      condition,
      body,
      line: whileToken.line,
      column: whileToken.column,
    };
  }

  /**
   * Para <id> <- <inicio> Hasta <fin> [Con Paso <paso>] [Hacer] <sentencias> FinPara
   */
  private parseForStatement(): ForStatementNode {
    const forToken = this.previous();
    const idToken = this.consume(
      TokenType.IDENTIFICADOR,
      "Se esperaba el nombre de la variable iteradora del bucle 'Para'"
    );

    if (!this.match(TokenType.ASIGNACION) && !this.match(TokenType.IGUAL)) {
      throw new ParserError(
        "Se esperaba '<-' o '=' para inicializar la variable del bucle Para",
        this.peek().line,
        this.peek().column
      );
    }

    const initialValue = this.parseExpression();

    this.consume(
      TokenType.HASTA,
      "Se esperaba la palabra clave 'Hasta' en el bucle Para"
    );
    const targetValue = this.parseExpression();

    let stepValue: ExpressionNode | undefined = undefined;
    if (this.match(TokenType.CON_PASO)) {
      stepValue = this.parseExpression();
    }

    // Opcionalmente puede tener 'Hacer'
    this.match(TokenType.HACER);
    this.consumeOptionalSemicolon();

    const body: StatementNode[] = [];
    while (
      !this.isAtEnd() &&
      !this.check(TokenType.FINPARA) &&
      !this.check(TokenType.FINALGORITMO)
    ) {
      body.push(this.parseStatement());
    }

    this.consume(TokenType.FINPARA, "Se esperaba 'FinPara' para cerrar el bucle Para");
    this.consumeOptionalSemicolon();

    return {
      nodeType: ASTNodeType.FOR_STATEMENT,
      identifier: idToken.lexeme,
      initialValue,
      targetValue,
      stepValue,
      body,
      line: forToken.line,
      column: forToken.column,
    };
  }

  /**
   * Leer <id1> [, <id2>, ...]
   */
  private parseReadStatement(): ReadStatementNode {
    const readToken = this.previous();
    const identifiers: string[] = [];

    const firstId = this.consume(
      TokenType.IDENTIFICADOR,
      "Se esperaba el nombre de la variable después de 'Leer'"
    );
    identifiers.push(firstId.lexeme);

    while (this.match(TokenType.COMA)) {
      const nextId = this.consume(
        TokenType.IDENTIFICADOR,
        'Se esperaba otro identificador después de la coma en Leer'
      );
      identifiers.push(nextId.lexeme);
    }

    this.consumeOptionalSemicolon();

    return {
      nodeType: ASTNodeType.READ_STATEMENT,
      identifiers,
      line: readToken.line,
      column: readToken.column,
    };
  }

  /**
   * Mostrar <expr1> [, <expr2>, ...]
   */
  private parsePrintStatement(): PrintStatementNode {
    const printToken = this.previous();
    const expressions: ExpressionNode[] = [];

    expressions.push(this.parseExpression());

    while (this.match(TokenType.COMA)) {
      expressions.push(this.parseExpression());
    }

    this.consumeOptionalSemicolon();

    return {
      nodeType: ASTNodeType.PRINT_STATEMENT,
      expressions,
      line: printToken.line,
      column: printToken.column,
    };
  }

  /**
   * <id> <- <expresion> o <id> = <expresion>
   */
  private parseAssignmentStatement(): AssignmentNode {
    const idToken = this.consume(
      TokenType.IDENTIFICADOR,
      'Se esperaba el identificador a asignar'
    );

    if (!this.match(TokenType.ASIGNACION) && !this.match(TokenType.IGUAL)) {
      throw new ParserError(
        `Se esperaba '<-' o '=' para realizar la asignación a '${idToken.lexeme}'`,
        this.peek().line,
        this.peek().column
      );
    }

    const value = this.parseExpression();
    this.consumeOptionalSemicolon();

    return {
      nodeType: ASTNodeType.ASSIGNMENT,
      identifier: idToken.lexeme,
      value,
      line: idToken.line,
      column: idToken.column,
    };
  }

  // ---------------- PARSER DE EXPRESIONES (PREVALENCIA DE OPERADORES) ----------------

  public parseExpression(): ExpressionNode {
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): ExpressionNode {
    let expr = this.parseLogicalAnd();

    while (this.match(TokenType.O)) {
      const operator = 'O';
      const right = this.parseLogicalAnd();
      expr = {
        nodeType: ASTNodeType.BINARY_EXPRESSION,
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column,
      };
    }

    return expr;
  }

  private parseLogicalAnd(): ExpressionNode {
    let expr = this.parseEquality();

    while (this.match(TokenType.Y)) {
      const operator = 'Y';
      const right = this.parseEquality();
      expr = {
        nodeType: ASTNodeType.BINARY_EXPRESSION,
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column,
      };
    }

    return expr;
  }

  private parseEquality(): ExpressionNode {
    let expr = this.parseComparison();

    while (this.match(TokenType.IGUAL) || this.match(TokenType.DISTINTO)) {
      const operator = this.previous().lexeme;
      const right = this.parseComparison();
      expr = {
        nodeType: ASTNodeType.BINARY_EXPRESSION,
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column,
      };
    }

    return expr;
  }

  private parseComparison(): ExpressionNode {
    let expr = this.parseAddition();

    while (
      this.match(TokenType.MAYOR) ||
      this.match(TokenType.MAYOR_IGUAL) ||
      this.match(TokenType.MENOR) ||
      this.match(TokenType.MENOR_IGUAL)
    ) {
      const operator = this.previous().lexeme;
      const right = this.parseAddition();
      expr = {
        nodeType: ASTNodeType.BINARY_EXPRESSION,
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column,
      };
    }

    return expr;
  }

  private parseAddition(): ExpressionNode {
    let expr = this.parseMultiplication();

    while (this.match(TokenType.SUMA) || this.match(TokenType.RESTA)) {
      const operator = this.previous().lexeme;
      const right = this.parseMultiplication();
      expr = {
        nodeType: ASTNodeType.BINARY_EXPRESSION,
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column,
      };
    }

    return expr;
  }

  private parseMultiplication(): ExpressionNode {
    let expr = this.parsePower();

    while (
      this.match(TokenType.MULTIPLICACION) ||
      this.match(TokenType.DIVISION) ||
      this.match(TokenType.MODULO)
    ) {
      const operator = this.previous().lexeme.toUpperCase();
      const right = this.parsePower();
      expr = {
        nodeType: ASTNodeType.BINARY_EXPRESSION,
        left: expr,
        operator: operator === 'MOD' ? '%' : operator,
        right,
        line: expr.line,
        column: expr.column,
      };
    }

    return expr;
  }

  private parsePower(): ExpressionNode {
    const expr = this.parseUnary();

    if (this.match(TokenType.POTENCIA)) {
      const operator = '^';
      // La potencia es asociativa por la derecha
      const right = this.parsePower();
      return {
        nodeType: ASTNodeType.BINARY_EXPRESSION,
        left: expr,
        operator,
        right,
        line: expr.line,
        column: expr.column,
      };
    }

    return expr;
  }

  private parseUnary(): ExpressionNode {
    if (this.match(TokenType.NO) || this.match(TokenType.RESTA)) {
      const operator = this.previous().type === TokenType.NO ? 'NO' : '-';
      const startLine = this.previous().line;
      const startCol = this.previous().column;
      const operand = this.parseUnary();
      return {
        nodeType: ASTNodeType.UNARY_EXPRESSION,
        operator,
        operand,
        line: startLine,
        column: startCol,
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): ExpressionNode {
    const token = this.peek();

    if (this.match(TokenType.LITERAL_BOOLEANO)) {
      return {
        nodeType: ASTNodeType.LITERAL,
        value: token.literal as boolean,
        rawType: 'booleano',
        line: token.line,
        column: token.column,
      };
    }

    if (this.match(TokenType.LITERAL_ENTERO)) {
      return {
        nodeType: ASTNodeType.LITERAL,
        value: token.literal as number,
        rawType: 'entero',
        line: token.line,
        column: token.column,
      };
    }

    if (this.match(TokenType.LITERAL_DECIMAL)) {
      return {
        nodeType: ASTNodeType.LITERAL,
        value: token.literal as number,
        rawType: 'decimal',
        line: token.line,
        column: token.column,
      };
    }

    if (this.match(TokenType.LITERAL_CADENA)) {
      const strVal = String(token.literal);
      return {
        nodeType: ASTNodeType.LITERAL,
        value: strVal,
        rawType: strVal.length === 1 ? 'caracter' : 'cadena',
        line: token.line,
        column: token.column,
      };
    }

    if (this.match(TokenType.IDENTIFICADOR)) {
      return {
        nodeType: ASTNodeType.IDENTIFIER,
        name: token.lexeme,
        line: token.line,
        column: token.column,
      };
    }

    if (this.match(TokenType.PARENTESIS_IZQ)) {
      const expr = this.parseExpression();
      this.consume(TokenType.PARENTESIS_DER, "Se esperaba ')' después de la expresión");
      return {
        nodeType: ASTNodeType.GROUPING,
        expression: expr,
        line: token.line,
        column: token.column,
      };
    }

    throw new ParserError(
      `Expresión inválida o inesperada cerca de '${token.lexeme}'`,
      token.line,
      token.column
    );
  }

  // ---------------- MÉTODOS AUXILIARES ----------------

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current] ?? {
      type: TokenType.EOF,
      lexeme: '',
      line: 0,
      column: 0,
    };
  }

  private previous(): Token {
    return this.tokens[this.current - 1] ?? {
      type: TokenType.EOF,
      lexeme: '',
      line: 0,
      column: 0,
    };
  }

  private consume(type: TokenType, errorMessage: string): Token {
    if (this.check(type)) return this.advance();
    const token = this.peek();
    throw new ParserError(errorMessage, token.line, token.column);
  }

  private consumeOptionalSemicolon(): void {
    while (this.match(TokenType.PUNTO_Y_COMA)) {
      // Ignorar punto y coma sobrantes
    }
  }
}
