import {
  ASTNodeType,
  AssignmentNode,
  BinaryExpressionNode,
  DataType,
  ExpressionNode,
  ForStatementNode,
  IfStatementNode,
  LiteralValue,
  PrintStatementNode,
  ProgramNode,
  ReadStatementNode,
  StatementNode,
  UnaryExpressionNode,
  VariableDeclarationNode,
  WhileStatementNode,
} from '../parser/ast';
import { Environment, RuntimeError } from './Environment';

export interface InterpreterIO {
  onPrint: (output: string) => void;
  onRead: (variableName: string, expectedType: DataType) => Promise<string | number | boolean>;
  onStep?: (node: StatementNode, env: Environment) => Promise<void> | void;
}

export interface InterpreterOptions {
  io: InterpreterIO;
}

export class Interpreter {
  private readonly io: InterpreterIO;
  private isCancelled: boolean = false;
  private environment: Environment;

  constructor(options: InterpreterIO) {
    this.io = options;
    this.environment = new Environment();
  }

  public cancel(): void {
    this.isCancelled = true;
  }

  public getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Ejecuta el árbol AST del programa completo.
   */
  public async execute(program: ProgramNode): Promise<void> {
    this.isCancelled = false;
    this.environment = new Environment();

    // 1. Procesar declaraciones de variables iniciales
    for (const decl of program.declarations) {
      if (this.isCancelled) return;
      this.executeVariableDeclaration(decl, this.environment);
    }

    // 2. Ejecutar sentencias del cuerpo
    for (const stmt of program.body) {
      if (this.isCancelled) return;
      await this.executeStatement(stmt, this.environment);
    }
  }

  private executeVariableDeclaration(decl: VariableDeclarationNode, env: Environment): void {
    for (const id of decl.identifiers) {
      env.declare(id, decl.dataType, decl.line, decl.column);
    }
  }

  private async executeStatement(stmt: StatementNode, env: Environment): Promise<void> {
    if (this.isCancelled) return;

    if (this.io.onStep) {
      await this.io.onStep(stmt, env);
    }

    switch (stmt.nodeType) {
      case ASTNodeType.VARIABLE_DECLARATION:
        this.executeVariableDeclaration(stmt, env);
        break;

      case ASTNodeType.ASSIGNMENT:
        await this.executeAssignment(stmt, env);
        break;

      case ASTNodeType.IF_STATEMENT:
        await this.executeIfStatement(stmt, env);
        break;

      case ASTNodeType.WHILE_STATEMENT:
        await this.executeWhileStatement(stmt, env);
        break;

      case ASTNodeType.FOR_STATEMENT:
        await this.executeForStatement(stmt, env);
        break;

      case ASTNodeType.PRINT_STATEMENT:
        await this.executePrintStatement(stmt, env);
        break;

      case ASTNodeType.READ_STATEMENT:
        await this.executeReadStatement(stmt, env);
        break;

      default: {
        const _exhaustive: never = stmt;
        throw new Error(`Tipo de sentencia no soportado: ${JSON.stringify(_exhaustive)}`);
      }
    }
  }

  private async executeAssignment(stmt: AssignmentNode, env: Environment): Promise<void> {
    const value = await this.evaluateExpression(stmt.value, env);
    env.assign(stmt.identifier, value, stmt.line, stmt.column);
  }

  private async executeIfStatement(stmt: IfStatementNode, env: Environment): Promise<void> {
    const conditionVal = await this.evaluateExpression(stmt.condition, env);

    if (typeof conditionVal !== 'boolean') {
      throw new RuntimeError(
        `La condición en 'Si' debe ser de tipo booleano (Verdadero o Falso), pero se evaluó a '${typeof conditionVal}'`,
        stmt.line,
        stmt.column
      );
    }

    if (conditionVal) {
      for (const s of stmt.thenBranch) {
        if (this.isCancelled) return;
        await this.executeStatement(s, env);
      }
    } else if (stmt.elseBranch) {
      for (const s of stmt.elseBranch) {
        if (this.isCancelled) return;
        await this.executeStatement(s, env);
      }
    }
  }

  private async executeWhileStatement(stmt: WhileStatementNode, env: Environment): Promise<void> {
    while (!this.isCancelled) {
      const conditionVal = await this.evaluateExpression(stmt.condition, env);

      if (typeof conditionVal !== 'boolean') {
        throw new RuntimeError(
          `La condición en 'Mientras' debe ser de tipo booleano, pero se evaluó a '${typeof conditionVal}'`,
          stmt.line,
          stmt.column
        );
      }

      if (!conditionVal) break;

      for (const s of stmt.body) {
        if (this.isCancelled) return;
        await this.executeStatement(s, env);
      }
    }
  }

  private async executeForStatement(stmt: ForStatementNode, env: Environment): Promise<void> {
    const initial = await this.evaluateExpression(stmt.initialValue, env);
    const target = await this.evaluateExpression(stmt.targetValue, env);

    if (typeof initial !== 'number' || typeof target !== 'number') {
      throw new RuntimeError(
        "Los límites inicial y final del bucle 'Para' deben ser valores numéricos",
        stmt.line,
        stmt.column
      );
    }

    let step = 1;
    if (stmt.stepValue) {
      const evalStep = await this.evaluateExpression(stmt.stepValue, env);
      if (typeof evalStep !== 'number') {
        throw new RuntimeError(
          "El valor del paso ('Con Paso') en el bucle 'Para' debe ser numérico",
          stmt.line,
          stmt.column
        );
      }
      step = evalStep;
    } else {
      // Si el objetivo es menor que el inicio y no se especificó paso, el paso por defecto es -1
      if (target < initial) {
        step = -1;
      }
    }

    if (step === 0) {
      throw new RuntimeError("El incremento del bucle 'Para' no puede ser cero", stmt.line, stmt.column);
    }

    // Si la variable no está declarada, declararla como entero o decimal
    if (!env.has(stmt.identifier)) {
      const varType: DataType = Number.isInteger(initial) && Number.isInteger(step) ? 'entero' : 'decimal';
      env.declare(stmt.identifier, varType, stmt.line, stmt.column);
    }

    // Asignar valor inicial
    env.assign(stmt.identifier, initial, stmt.line, stmt.column);

    while (!this.isCancelled) {
      const currentVal = env.get(stmt.identifier, stmt.line, stmt.column) as number;

      if (step > 0 && currentVal > target) break;
      if (step < 0 && currentVal < target) break;

      for (const s of stmt.body) {
        if (this.isCancelled) return;
        await this.executeStatement(s, env);
      }

      const nextVal = (env.get(stmt.identifier, stmt.line, stmt.column) as number) + step;
      env.assign(stmt.identifier, nextVal, stmt.line, stmt.column);
    }
  }

  private async executePrintStatement(stmt: PrintStatementNode, env: Environment): Promise<void> {
    const outputs: string[] = [];

    for (const expr of stmt.expressions) {
      const val = await this.evaluateExpression(expr, env);
      outputs.push(this.formatOutputValue(val));
    }

    this.io.onPrint(outputs.join(' '));
  }

  private async executeReadStatement(stmt: ReadStatementNode, env: Environment): Promise<void> {
    for (const id of stmt.identifiers) {
      if (this.isCancelled) return;

      const symbol = env.getSymbol(id);
      const expectedType: DataType = symbol?.type ?? 'cadena';

      // Llamar al handler I/O asíncrono para pedir el dato al usuario
      const rawInput = await this.io.onRead(id, expectedType);

      // Convertir el input al tipo requerido
      const convertedValue = this.parseInputToType(rawInput, expectedType, id, stmt.line, stmt.column);

      env.assign(id, convertedValue, stmt.line, stmt.column);
    }
  }

  // ---------------- EVALUADOR DE EXPRESIONES ----------------

  private async evaluateExpression(expr: ExpressionNode, env: Environment): Promise<LiteralValue> {
    switch (expr.nodeType) {
      case ASTNodeType.LITERAL:
        return expr.value;

      case ASTNodeType.IDENTIFIER:
        return env.get(expr.name, expr.line, expr.column);

      case ASTNodeType.GROUPING:
        return this.evaluateExpression(expr.expression, env);

      case ASTNodeType.UNARY_EXPRESSION:
        return this.evaluateUnary(expr, env);

      case ASTNodeType.BINARY_EXPRESSION:
        return this.evaluateBinary(expr, env);

      default: {
        const _exhaustive: never = expr;
        throw new Error(`Expresión no soportada: ${JSON.stringify(_exhaustive)}`);
      }
    }
  }

  private async evaluateUnary(expr: UnaryExpressionNode, env: Environment): Promise<LiteralValue> {
    const operand = await this.evaluateExpression(expr.operand, env);

    if (expr.operator === '-') {
      if (typeof operand !== 'number') {
        throw new RuntimeError(
          `El operador unario '-' solo se puede aplicar a números, se recibió '${typeof operand}'`,
          expr.line,
          expr.column
        );
      }
      return -operand;
    }

    if (expr.operator === 'NO') {
      if (typeof operand !== 'boolean') {
        throw new RuntimeError(
          `El operador lógico 'NO' solo se puede aplicar a booleanos, se recibió '${typeof operand}'`,
          expr.line,
          expr.column
        );
      }
      return !operand;
    }

    throw new RuntimeError(`Operador unario no soportado: '${expr.operator}'`, expr.line, expr.column);
  }

  private async evaluateBinary(expr: BinaryExpressionNode, env: Environment): Promise<LiteralValue> {
    // Operadores lógicos con cortocircuito
    if (expr.operator === 'O') {
      const leftVal = await this.evaluateExpression(expr.left, env);
      if (typeof leftVal !== 'boolean') {
        throw new RuntimeError("El operador 'O' requiere operandos booleanos", expr.line, expr.column);
      }
      if (leftVal) return true;

      const rightVal = await this.evaluateExpression(expr.right, env);
      if (typeof rightVal !== 'boolean') {
        throw new RuntimeError("El operando derecho de 'O' requiere un valor booleano", expr.line, expr.column);
      }
      return rightVal;
    }

    if (expr.operator === 'Y') {
      const leftVal = await this.evaluateExpression(expr.left, env);
      if (typeof leftVal !== 'boolean') {
        throw new RuntimeError("El operador 'Y' requiere operandos booleanos", expr.line, expr.column);
      }
      if (!leftVal) return false;

      const rightVal = await this.evaluateExpression(expr.right, env);
      if (typeof rightVal !== 'boolean') {
        throw new RuntimeError("El operando derecho de 'Y' requiere un valor booleano", expr.line, expr.column);
      }
      return rightVal;
    }

    const left = await this.evaluateExpression(expr.left, env);
    const right = await this.evaluateExpression(expr.right, env);

    switch (expr.operator) {
      case '+': {
        // Concatenación de cadenas si alguno de los operandos es texto
        if (typeof left === 'string' || typeof right === 'string') {
          return this.formatOutputValue(left) + this.formatOutputValue(right);
        }
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right;
        }
        throw new RuntimeError(
          `Operación '+' no válida entre '${typeof left}' y '${typeof right}'`,
          expr.line,
          expr.column
        );
      }

      case '-': {
        this.assertNumbers(left, right, '-', expr.line, expr.column);
        return (left as number) - (right as number);
      }

      case '*': {
        this.assertNumbers(left, right, '*', expr.line, expr.column);
        return (left as number) * (right as number);
      }

      case '/': {
        this.assertNumbers(left, right, '/', expr.line, expr.column);
        if ((right as number) === 0) {
          throw new RuntimeError('División por cero no permitida', expr.line, expr.column);
        }
        return (left as number) / (right as number);
      }

      case '%': {
        this.assertNumbers(left, right, '% (MOD)', expr.line, expr.column);
        if ((right as number) === 0) {
          throw new RuntimeError('Módulo por cero no permitido', expr.line, expr.column);
        }
        return (left as number) % (right as number);
      }

      case '^': {
        this.assertNumbers(left, right, '^', expr.line, expr.column);
        return Math.pow(left as number, right as number);
      }

      case '=':
      case '==':
        return left === right;

      case '<>':
      case '!=':
        return left !== right;

      case '<':
        this.assertComparable(left, right, '<', expr.line, expr.column);
        return (left as number | string) < (right as number | string);

      case '<=':
        this.assertComparable(left, right, '<=', expr.line, expr.column);
        return (left as number | string) <= (right as number | string);

      case '>':
        this.assertComparable(left, right, '>', expr.line, expr.column);
        return (left as number | string) > (right as number | string);

      case '>=':
        this.assertComparable(left, right, '>=', expr.line, expr.column);
        return (left as number | string) >= (right as number | string);

      default:
        throw new RuntimeError(`Operador binario desconocido: '${expr.operator}'`, expr.line, expr.column);
    }
  }

  // ---------------- MÉTODOS AUXILIARES DE PARSEO Y VALIDACIÓN ----------------

  private formatOutputValue(val: LiteralValue): string {
    if (typeof val === 'boolean') {
      return val ? 'Verdadero' : 'Falso';
    }
    return String(val);
  }

  private parseInputToType(
    raw: string | number | boolean,
    targetType: DataType,
    varName: string,
    line: number,
    column: number
  ): LiteralValue {
    if (typeof raw === 'number' || typeof raw === 'boolean') {
      return raw;
    }

    const trimmed = raw.trim();

    switch (targetType) {
      case 'entero': {
        const parsed = Number(trimmed);
        if (isNaN(parsed) || !Number.isInteger(parsed)) {
          throw new RuntimeError(
            `El valor ingresado '${raw}' para la variable entera '${varName}' no es un número entero válido`,
            line,
            column
          );
        }
        return parsed;
      }
      case 'decimal': {
        const parsed = Number(trimmed);
        if (isNaN(parsed)) {
          throw new RuntimeError(
            `El valor ingresado '${raw}' para la variable decimal '${varName}' no es un número válido`,
            line,
            column
          );
        }
        return parsed;
      }
      case 'booleano': {
        const lower = trimmed.toLowerCase();
        if (lower === 'verdadero' || lower === 'true' || lower === 'v' || lower === '1') return true;
        if (lower === 'falso' || lower === 'false' || lower === 'f' || lower === '0') return false;
        throw new RuntimeError(
          `El valor ingresado '${raw}' para la variable '${varName}' no es un booleano válido (use Verdadero o Falso)`,
          line,
          column
        );
      }
      case 'caracter': {
        if (trimmed.length !== 1) {
          throw new RuntimeError(
            `Se esperaba un solo carácter para '${varName}', pero se ingresaron ${trimmed.length} caracteres`,
            line,
            column
          );
        }
        return trimmed;
      }
      case 'cadena':
      default:
        return raw;
    }
  }

  private assertNumbers(a: LiteralValue, b: LiteralValue, op: string, line: number, column: number): void {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new RuntimeError(
        `El operador '${op}' solo se puede aplicar a valores numéricos, se recibió '${typeof a}' y '${typeof b}'`,
        line,
        column
      );
    }
  }

  private assertComparable(a: LiteralValue, b: LiteralValue, op: string, line: number, column: number): void {
    if (
      (typeof a === 'number' && typeof b === 'number') ||
      (typeof a === 'string' && typeof b === 'string')
    ) {
      return;
    }
    throw new RuntimeError(
      `No se pueden comparar valores de tipos incompatibles con '${op}': '${typeof a}' y '${typeof b}'`,
      line,
      column
    );
  }
}
