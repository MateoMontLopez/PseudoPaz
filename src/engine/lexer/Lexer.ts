import { Token, TokenType } from './tokens';

export class LexerError extends Error {
  public readonly line: number;
  public readonly column: number;

  constructor(message: string, line: number, column: number) {
    super(`[Error Léxico] Línea ${line}, Columna ${column}: ${message}`);
    this.name = 'LexerError';
    this.line = line;
    this.column = column;
  }
}

/**
 * Mapa de palabras reservadas del lenguaje (en minúsculas para coincidencia case-insensitive).
 */
const KEYWORDS: Record<string, TokenType> = {
  algoritmo: TokenType.ALGORITMO,
  finalgoritmo: TokenType.FINALGORITMO,
  inicio: TokenType.INICIO,
  fin: TokenType.FIN,
  var: TokenType.VAR,
  definir: TokenType.DEFINIR,
  como: TokenType.COMO,

  // Tipos
  entero: TokenType.TIPO_ENTERO,
  decimal: TokenType.TIPO_DECIMAL,
  real: TokenType.TIPO_DECIMAL,
  cadena: TokenType.TIPO_CADENA,
  texto: TokenType.TIPO_CADENA,
  caracter: TokenType.TIPO_CARACTER,
  booleano: TokenType.TIPO_BOOLEANO,
  logico: TokenType.TIPO_BOOLEANO,

  // Control
  si: TokenType.SI,
  entonces: TokenType.ENTONCES,
  sino: TokenType.SINO,
  finsi: TokenType.FINSI,
  mientras: TokenType.MIENTRAS,
  hacer: TokenType.HACER,
  finmientras: TokenType.FINMIENTRAS,
  para: TokenType.PARA,
  hasta: TokenType.HASTA,
  finpara: TokenType.FINPARA,

  // I/O
  leer: TokenType.LEER,
  mostrar: TokenType.MOSTRAR,
  escribir: TokenType.MOSTRAR,

  // Operadores en texto
  mod: TokenType.MODULO,
  y: TokenType.Y,
  o: TokenType.O,
  no: TokenType.NO,

  // Booleanos literales
  verdadero: TokenType.LITERAL_BOOLEANO,
  falso: TokenType.LITERAL_BOOLEANO,
  true: TokenType.LITERAL_BOOLEANO,
  false: TokenType.LITERAL_BOOLEANO,
};

export class Lexer {
  private readonly source: string;
  private start: number = 0;
  private current: number = 0;
  private line: number = 1;
  private column: number = 1;
  private startColumn: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source;
  }

  /**
   * Tokeniza todo el código fuente y retorna la lista de tokens finalizada con EOF.
   */
  public tokenize(): Token[] {
    this.tokens = [];
    this.start = 0;
    this.current = 0;
    this.line = 1;
    this.column = 1;

    while (!this.isAtEnd()) {
      this.start = this.current;
      this.startColumn = this.column;
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.EOF,
      lexeme: '',
      line: this.line,
      column: this.column,
    });

    return this.tokens;
  }

  private scanToken(): void {
    const char = this.advance();

    switch (char) {
      // Delimitadores y agrupación
      case '(':
        this.addToken(TokenType.PARENTESIS_IZQ);
        break;
      case ')':
        this.addToken(TokenType.PARENTESIS_DER);
        break;
      case ',':
        this.addToken(TokenType.COMA);
        break;
      case ';':
        this.addToken(TokenType.PUNTO_Y_COMA);
        break;
      case ':':
        if (this.match('=')) {
          this.addToken(TokenType.ASIGNACION); // :=
        } else {
          this.addToken(TokenType.DOS_PUNTOS);
        }
        break;

      // Operadores aritméticos
      case '+':
        this.addToken(TokenType.SUMA);
        break;
      case '-':
        this.addToken(TokenType.RESTA);
        break;
      case '*':
        this.addToken(TokenType.MULTIPLICACION);
        break;
      case '%':
        this.addToken(TokenType.MODULO);
        break;
      case '^':
        this.addToken(TokenType.POTENCIA);
        break;

      // División o Comentarios
      case '/':
        if (this.match('/')) {
          // Comentario de una sola línea
          while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
          }
        } else if (this.match('*')) {
          // Comentario multilínea /* ... */
          this.scanBlockComment();
        } else {
          this.addToken(TokenType.DIVISION);
        }
        break;

      // Asignación y comparadores
      case '<':
        if (this.match('-')) {
          this.addToken(TokenType.ASIGNACION); // <-
        } else if (this.match('>')) {
          this.addToken(TokenType.DISTINTO); // <>
        } else if (this.match('=')) {
          this.addToken(TokenType.MENOR_IGUAL); // <=
        } else {
          this.addToken(TokenType.MENOR); // <
        }
        break;

      case '>':
        if (this.match('=')) {
          this.addToken(TokenType.MAYOR_IGUAL); // >=
        } else {
          this.addToken(TokenType.MAYOR); // >
        }
        break;

      case '=':
        if (this.match('=')) {
          this.addToken(TokenType.IGUAL); // ==
        } else {
          // En pseudocódigo, '=' se usa tanto en comparación como en asignación
          this.addToken(TokenType.IGUAL);
        }
        break;

      case '!':
        if (this.match('=')) {
          this.addToken(TokenType.DISTINTO); // !=
        } else {
          this.addToken(TokenType.NO); // !
        }
        break;

      case '&':
        if (this.match('&')) {
          this.addToken(TokenType.Y);
        } else {
          throw new LexerError(`Carácter inesperado '&'. Quizá quiso escribir '&&' o 'Y'`, this.line, this.startColumn);
        }
        break;

      case '|':
        if (this.match('|')) {
          this.addToken(TokenType.O);
        } else {
          throw new LexerError(`Carácter inesperado '|'. Quizá quiso escribir '||' o 'O'`, this.line, this.startColumn);
        }
        break;

      // Espacios en blanco y saltos de línea
      case ' ':
      case '\r':
      case '\t':
        // Ignorar espacios en blanco
        break;

      case '\n':
        this.line++;
        this.column = 1;
        break;

      // Cadenas de texto
      case '"':
      case "'":
        this.scanString(char);
        break;

      default:
        if (this.isDigit(char)) {
          this.scanNumber();
        } else if (this.isAlpha(char)) {
          this.scanIdentifierOrKeyword();
        } else {
          throw new LexerError(`Carácter no reconocido: '${char}'`, this.line, this.startColumn);
        }
        break;
    }
  }

  private scanString(quoteChar: string): void {
    let result = '';
    while (this.peek() !== quoteChar && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }

      if (this.peek() === '\\') {
        this.advance(); // saltar la barra invertida
        const escapeChar = this.advance();
        switch (escapeChar) {
          case 'n':
            result += '\n';
            break;
          case 't':
            result += '\t';
            break;
          case 'r':
            result += '\r';
            break;
          case '"':
            result += '"';
            break;
          case "'":
            result += "'";
            break;
          case '\\':
            result += '\\';
            break;
          default:
            result += escapeChar;
            break;
        }
      } else {
        result += this.advance();
      }
    }

    if (this.isAtEnd()) {
      throw new LexerError('Cadena de texto sin cerrar. Falta comilla de cierre', this.line, this.startColumn);
    }

    // Consumir la comilla de cierre
    this.advance();

    const lexeme = this.source.substring(this.start, this.current);
    this.tokens.push({
      type: TokenType.LITERAL_CADENA,
      lexeme,
      literal: result,
      line: this.line,
      column: this.startColumn,
    });
  }

  private scanNumber(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    let isDecimal = false;
    // Verificar si hay parte fraccionaria: número.dígitos
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      isDecimal = true;
      // Consumir el '.'
      this.advance();

      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const lexeme = this.source.substring(this.start, this.current);
    const value = isDecimal ? parseFloat(lexeme) : parseInt(lexeme, 10);

    this.tokens.push({
      type: isDecimal ? TokenType.LITERAL_DECIMAL : TokenType.LITERAL_ENTERO,
      lexeme,
      literal: value,
      line: this.line,
      column: this.startColumn,
    });
  }

  private scanIdentifierOrKeyword(): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    let lexeme = this.source.substring(this.start, this.current);
    const lower = lexeme.toLowerCase();

    // Manejo especial de "Con Paso" si encontramos "con" y la siguiente palabra es "paso"
    if (lower === 'con') {
      const savedCurrent = this.current;
      const savedColumn = this.column;

      // Buscar espacios en blanco
      while (this.peek() === ' ' || this.peek() === '\t') {
        this.advance();
      }

      const pasoStart = this.current;
      while (this.isAlpha(this.peek())) {
        this.advance();
      }

      const nextWord = this.source.substring(pasoStart, this.current).toLowerCase();
      if (nextWord === 'paso') {
        lexeme = this.source.substring(this.start, this.current);
        this.tokens.push({
          type: TokenType.CON_PASO,
          lexeme,
          line: this.line,
          column: this.startColumn,
        });
        return;
      } else {
        // Revertir
        this.current = savedCurrent;
        this.column = savedColumn;
      }
    }

    const type = KEYWORDS[lower];

    if (type !== undefined) {
      if (type === TokenType.LITERAL_BOOLEANO) {
        const boolVal = lower === 'verdadero' || lower === 'true';
        this.tokens.push({
          type,
          lexeme,
          literal: boolVal,
          line: this.line,
          column: this.startColumn,
        });
      } else {
        this.tokens.push({
          type,
          lexeme,
          line: this.line,
          column: this.startColumn,
        });
      }
    } else {
      this.tokens.push({
        type: TokenType.IDENTIFICADOR,
        lexeme,
        line: this.line,
        column: this.startColumn,
      });
    }
  }

  private scanBlockComment(): void {
    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peekNext() === '/') {
        this.advance(); // *
        this.advance(); // /
        return;
      }
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }
    throw new LexerError('Comentario multilínea sin cerrar', this.line, this.startColumn);
  }

  private advance(): string {
    const char = this.source.charAt(this.current);
    this.current++;
    this.column++;
    return char;
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;

    this.current++;
    this.column++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.current + 1);
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (
      (char >= 'a' && char <= 'z') ||
      (char >= 'A' && char <= 'Z') ||
      char === '_' ||
      char === 'á' ||
      char === 'é' ||
      char === 'í' ||
      char === 'ó' ||
      char === 'ú' ||
      char === 'Á' ||
      char === 'É' ||
      char === 'Í' ||
      char === 'Ó' ||
      char === 'Ú' ||
      char === 'ñ' ||
      char === 'Ñ'
    );
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private addToken(type: TokenType, literal?: string | number | boolean): void {
    const lexeme = this.source.substring(this.start, this.current);
    this.tokens.push({
      type,
      lexeme,
      literal,
      line: this.line,
      column: this.startColumn,
    });
  }
}
