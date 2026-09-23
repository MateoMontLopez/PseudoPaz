import { DataType, LiteralValue } from '../parser/ast';

export class RuntimeError extends Error {
  public readonly line: number;
  public readonly column: number;

  constructor(message: string, line: number, column: number) {
    super(`[Error en Tiempo de Ejecución] Línea ${line}, Columna ${column}: ${message}`);
    this.name = 'RuntimeError';
    this.line = line;
    this.column = column;
  }
}

export interface VariableSymbol {
  readonly name: string;
  readonly type: DataType;
  value?: LiteralValue;
  isInitialized: boolean;
}

export class Environment {
  private readonly symbols: Map<string, VariableSymbol> = new Map();
  private readonly parent?: Environment;

  constructor(parent?: Environment) {
    this.parent = parent;
  }

  /**
   * Declara una nueva variable con su tipo estático.
   */
  public declare(name: string, type: DataType, line: number, column: number): void {
    const key = name.toLowerCase();
    if (this.symbols.has(key)) {
      throw new RuntimeError(`La variable '${name}' ya fue declarada anteriormente en este ámbito`, line, column);
    }

    this.symbols.set(key, {
      name,
      type,
      isInitialized: false,
    });
  }

  /**
   * Asigna un valor a una variable existente, validando compatibilidad de tipos estricta.
   */
  public assign(name: string, value: LiteralValue, line: number, column: number): void {
    const key = name.toLowerCase();
    const symbol = this.symbols.get(key);

    if (symbol !== undefined) {
      this.validateTypeCompatibility(symbol.type, value, name, line, column);
      symbol.value = value;
      symbol.isInitialized = true;
      return;
    }

    if (this.parent !== undefined) {
      this.parent.assign(name, value, line, column);
      return;
    }

    // Si la variable no fue declarada explícitamente en modo laxo, podemos inferir o requerir declaración.
    // Para aprendizaje estricto de lógica, requerir declaración previa o inferir tipo seguro.
    // Si no está declarada, inferimos su tipo y la declaramos para no frustrar a estudiantes principiantes.
    const inferredType = this.inferTypeFromValue(value);
    this.symbols.set(key, {
      name,
      type: inferredType,
      value,
      isInitialized: true,
    });
  }

  /**
   * Obtiene el valor de una variable, comprobando que esté inicializada.
   */
  public get(name: string, line: number, column: number): LiteralValue {
    const key = name.toLowerCase();
    const symbol = this.symbols.get(key);

    if (symbol !== undefined) {
      if (!symbol.isInitialized || symbol.value === undefined) {
        throw new RuntimeError(`La variable '${name}' no ha sido inicializada antes de su uso`, line, column);
      }
      return symbol.value;
    }

    if (this.parent !== undefined) {
      return this.parent.get(name, line, column);
    }

    throw new RuntimeError(`La variable '${name}' no está definida ni declarada`, line, column);
  }

  /**
   * Retorna información del símbolo (tipo, inicialización) si existe.
   */
  public getSymbol(name: string): VariableSymbol | undefined {
    const key = name.toLowerCase();
    return this.symbols.get(key) ?? this.parent?.getSymbol(name);
  }

  public has(name: string): boolean {
    const key = name.toLowerCase();
    return this.symbols.has(key) || (this.parent?.has(name) ?? false);
  }

  /**
   * Comprueba que el valor a asignar coincida con el tipo declarado.
   */
  private validateTypeCompatibility(
    expectedType: DataType,
    value: LiteralValue,
    varName: string,
    line: number,
    column: number
  ): void {
    switch (expectedType) {
      case 'entero': {
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          throw new RuntimeError(
            `Tipo incompatible: No se puede asignar el valor '${String(value)}' a la variable entera '${varName}'`,
            line,
            column
          );
        }
        break;
      }
      case 'decimal': {
        if (typeof value !== 'number') {
          throw new RuntimeError(
            `Tipo incompatible: No se puede asignar el valor '${String(value)}' a la variable decimal '${varName}'`,
            line,
            column
          );
        }
        break;
      }
      case 'cadena': {
        if (typeof value !== 'string') {
          throw new RuntimeError(
            `Tipo incompatible: Se esperaba una cadena de texto para la variable '${varName}', pero se recibió '${typeof value}'`,
            line,
            column
          );
        }
        break;
      }
      case 'caracter': {
        if (typeof value !== 'string' || value.length !== 1) {
          throw new RuntimeError(
            `Tipo incompatible: Se esperaba un solo carácter para la variable '${varName}', pero se recibió '${String(value)}'`,
            line,
            column
          );
        }
        break;
      }
      case 'booleano': {
        if (typeof value !== 'boolean') {
          throw new RuntimeError(
            `Tipo incompatible: Se esperaba un valor booleano (Verdadero/Falso) para la variable '${varName}'`,
            line,
            column
          );
        }
        break;
      }
    }
  }

  private inferTypeFromValue(value: LiteralValue): DataType {
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'entero' : 'decimal';
    }
    if (typeof value === 'boolean') {
      return 'booleano';
    }
    if (typeof value === 'string') {
      return value.length === 1 ? 'caracter' : 'cadena';
    }
    return 'cadena';
  }
}
