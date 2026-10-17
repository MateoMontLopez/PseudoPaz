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

export interface ArraySymbol {
  readonly name: string;
  readonly dimensions: number[];
  type?: DataType;
  readonly elements: Map<string, LiteralValue>;
}

export class Environment {
  private readonly symbols: Map<string, VariableSymbol> = new Map();
  private readonly arraySymbols: Map<string, ArraySymbol> = new Map();
  private readonly parent?: Environment;

  constructor(parent?: Environment) {
    this.parent = parent;
  }

  /**
   * Declara una nueva variable con su tipo estático.
   */
  public declare(name: string, type: DataType, line: number, column: number): void {
    const key = name.toLowerCase();
    const existingArray = this.arraySymbols.get(key);
    if (existingArray) {
      existingArray.type = type;
      return;
    }

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
   * Declara y dimensiona un arreglo o matriz (vector 1D, matriz 2D o N-D).
   */
  public declareArray(name: string, dimensions: number[], line: number, column: number): void {
    const key = name.toLowerCase();

    for (let i = 0; i < dimensions.length; i++) {
      const dim = dimensions[i];
      if (typeof dim !== 'number' || !Number.isInteger(dim) || dim <= 0) {
        throw new RuntimeError(
          `La dimensión ${i + 1} del arreglo '${name}' debe ser un número entero mayor a 0, se recibió '${dim}'`,
          line,
          column
        );
      }
    }

    if (this.arraySymbols.has(key)) {
      throw new RuntimeError(`El arreglo '${name}' ya fue dimensionado anteriormente`, line, column);
    }

    let declaredType: DataType | undefined = undefined;
    const existingVar = this.symbols.get(key);
    if (existingVar) {
      declaredType = existingVar.type;
    }

    this.arraySymbols.set(key, {
      name,
      dimensions,
      type: declaredType,
      elements: new Map(),
    });
  }

  /**
   * Asigna un valor a un elemento específico de un arreglo (indexación base 1).
   */
  public assignArrayElement(
    name: string,
    indices: number[],
    value: LiteralValue,
    line: number,
    column: number
  ): void {
    const key = name.toLowerCase();
    const arraySym = this.arraySymbols.get(key);

    if (arraySym !== undefined) {
      this.validateArrayIndices(arraySym, indices, line, column);

      if (arraySym.type !== undefined) {
        this.validateTypeCompatibility(arraySym.type, value, `${name}[${indices.join(', ')}]`, line, column);
      } else {
        arraySym.type = this.inferTypeFromValue(value);
      }

      arraySym.elements.set(indices.join(','), value);
      return;
    }

    if (this.parent !== undefined) {
      this.parent.assignArrayElement(name, indices, value, line, column);
      return;
    }

    throw new RuntimeError(
      `El arreglo '${name}' no ha sido dimensionado con 'Dimension'`,
      line,
      column
    );
  }

  /**
   * Obtiene el valor de un elemento de un arreglo (indexación base 1).
   */
  public getArrayElement(
    name: string,
    indices: number[],
    line: number,
    column: number
  ): LiteralValue {
    const key = name.toLowerCase();
    const arraySym = this.arraySymbols.get(key);

    if (arraySym !== undefined) {
      this.validateArrayIndices(arraySym, indices, line, column);
      const elementKey = indices.join(',');
      const val = arraySym.elements.get(elementKey);

      if (val === undefined) {
        throw new RuntimeError(
          `La posición [${indices.join(', ')}] del arreglo '${name}' no ha sido inicializada antes de su uso`,
          line,
          column
        );
      }

      return val;
    }

    if (this.parent !== undefined) {
      return this.parent.getArrayElement(name, indices, line, column);
    }

    throw new RuntimeError(
      `El arreglo '${name}' no ha sido dimensionado con 'Dimension'`,
      line,
      column
    );
  }

  private validateArrayIndices(
    arraySym: ArraySymbol,
    indices: number[],
    line: number,
    column: number
  ): void {
    if (indices.length !== arraySym.dimensions.length) {
      throw new RuntimeError(
        `El arreglo '${arraySym.name}' tiene ${arraySym.dimensions.length} dimensión(es), pero se accedió con ${indices.length} índice(s)`,
        line,
        column
      );
    }

    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i];
      const maxDim = arraySym.dimensions[i];

      if (typeof idx !== 'number' || !Number.isInteger(idx)) {
        throw new RuntimeError(
          `Los índices del arreglo '${arraySym.name}' deben ser enteros, se recibió '${idx}'`,
          line,
          column
        );
      }

      if (idx < 1 || idx > maxDim) {
        throw new RuntimeError(
          `Subíndice [${idx}] fuera de rango para el arreglo '${arraySym.name}'. El rango válido es 1..${maxDim}`,
          line,
          column
        );
      }
    }
  }

  public getArraySymbol(name: string): ArraySymbol | undefined {
    const key = name.toLowerCase();
    return this.arraySymbols.get(key) ?? this.parent?.getArraySymbol(name);
  }

  public getArrayType(name: string): DataType | undefined {
    return this.getArraySymbol(name)?.type;
  }

  public isArray(name: string): boolean {
    const key = name.toLowerCase();
    return this.arraySymbols.has(key) || (this.parent?.isArray(name) ?? false);
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
    return this.symbols.has(key) || this.arraySymbols.has(key) || (this.parent?.has(name) ?? false);
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

  /**
   * Obtiene una instantánea de todas las variables y arreglos definidos en el entorno
   * para su inspección visual en el depurador paso a paso.
   */
  public getVariableSnapshot(): Record<string, { name: string; type?: DataType; value: any; isArray?: boolean; dimensions?: number[] }> {
    const result: Record<string, { name: string; type?: DataType; value: any; isArray?: boolean; dimensions?: number[] }> =
      this.parent ? this.parent.getVariableSnapshot() : {};

    for (const [key, symbol] of this.symbols.entries()) {
      result[key] = {
        name: symbol.name,
        type: symbol.type,
        value: symbol.isInitialized ? symbol.value : '<no inicializado>',
        isArray: false,
      };
    }

    for (const [key, arrSymbol] of this.arraySymbols.entries()) {
      const elementsObj: Record<string, any> = {};
      for (const [elemKey, val] of arrSymbol.elements.entries()) {
        elementsObj[elemKey] = val;
      }

      result[key] = {
        name: arrSymbol.name,
        type: arrSymbol.type,
        value: elementsObj,
        isArray: true,
        dimensions: arrSymbol.dimensions,
      };
    }

    return result;
  }
}
