/**
 * Tipos de tokens soportados por el analizador léxico de pseudocódigo.
 */
export enum TokenType {
  // Palabras clave de estructura
  ALGORITMO = 'ALGORITMO',
  FINALGORITMO = 'FINALGORITMO',
  INICIO = 'INICIO',
  FIN = 'FIN',
  VAR = 'VAR',
  DEFINIR = 'DEFINIR',
  COMO = 'COMO',

  // Tipos de datos estáticos
  TIPO_ENTERO = 'TIPO_ENTERO',
  TIPO_DECIMAL = 'TIPO_DECIMAL',
  TIPO_CADENA = 'TIPO_CADENA',
  TIPO_CARACTER = 'TIPO_CARACTER',
  TIPO_BOOLEANO = 'TIPO_BOOLEANO',

  // Estructuras de control
  SI = 'SI',
  ENTONCES = 'ENTONCES',
  SINO = 'SINO',
  FINSI = 'FINSI',
  MIENTRAS = 'MIENTRAS',
  HACER = 'HACER',
  FINMIENTRAS = 'FINMIENTRAS',
  PARA = 'PARA',
  HASTA = 'HASTA',
  CON_PASO = 'CON_PASO',
  FINPARA = 'FINPARA',

  // Entrada y salida
  LEER = 'LEER',
  MOSTRAR = 'MOSTRAR',

  // Operadores de asignación
  ASIGNACION = 'ASIGNACION', // <- o :=

  // Operadores aritméticos
  SUMA = 'SUMA', // +
  RESTA = 'RESTA', // -
  MULTIPLICACION = 'MULTIPLICACION', // *
  DIVISION = 'DIVISION', // /
  MODULO = 'MODULO', // % o MOD
  POTENCIA = 'POTENCIA', // ^

  // Operadores de comparación / relacionales
  IGUAL = 'IGUAL', // = o ==
  DISTINTO = 'DISTINTO', // <> o !=
  MENOR = 'MENOR', // <
  MENOR_IGUAL = 'MENOR_IGUAL', // <=
  MAYOR = 'MAYOR', // >
  MAYOR_IGUAL = 'MAYOR_IGUAL', // >=

  // Operadores lógicos
  Y = 'Y', // Y o &&
  O = 'O', // O o ||
  NO = 'NO', // NO o !

  // Literales
  LITERAL_ENTERO = 'LITERAL_ENTERO',
  LITERAL_DECIMAL = 'LITERAL_DECIMAL',
  LITERAL_CADENA = 'LITERAL_CADENA',
  LITERAL_BOOLEANO = 'LITERAL_BOOLEANO',

  // Delimitadores y puntuación
  PARENTESIS_IZQ = 'PARENTESIS_IZQ', // (
  PARENTESIS_DER = 'PARENTESIS_DER', // )
  COMA = 'COMA', // ,
  DOS_PUNTOS = 'DOS_PUNTOS', // :
  PUNTO_Y_COMA = 'PUNTO_Y_COMA', // ;

  // Identificador y fin de archivo
  IDENTIFICADOR = 'IDENTIFICADOR',
  EOF = 'EOF',
}

/**
 * Representa un Token generado por el Lexer con metadatos de depuración y ubicación.
 */
export interface Token {
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal?: string | number | boolean;
  readonly line: number;
  readonly column: number;
}
