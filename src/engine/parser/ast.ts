/**
 * Tipos de datos estáticos reconocidos por el lenguaje de pseudocódigo.
 */
export type DataType = 'entero' | 'decimal' | 'cadena' | 'caracter' | 'booleano';

export type LiteralValue = number | string | boolean;

/**
 * Tipos discriminadores para todos los nodos del AST.
 */
export enum ASTNodeType {
  PROGRAM = 'ProgramNode',
  VARIABLE_DECLARATION = 'VariableDeclarationNode',
  ASSIGNMENT = 'AssignmentNode',
  IF_STATEMENT = 'IfStatementNode',
  WHILE_STATEMENT = 'WhileStatementNode',
  FOR_STATEMENT = 'ForStatementNode',
  PRINT_STATEMENT = 'PrintStatementNode',
  READ_STATEMENT = 'ReadStatementNode',
  BINARY_EXPRESSION = 'BinaryExpressionNode',
  UNARY_EXPRESSION = 'UnaryExpressionNode',
  LITERAL = 'LiteralNode',
  IDENTIFIER = 'IdentifierNode',
  GROUPING = 'GroupingExpressionNode',
}

export interface BaseASTNode {
  readonly nodeType: ASTNodeType;
  readonly line: number;
  readonly column: number;
}

// ---------------- EXPRESIONES ----------------

export type ExpressionNode =
  | BinaryExpressionNode
  | UnaryExpressionNode
  | LiteralNode
  | IdentifierNode
  | GroupingExpressionNode;

export interface BinaryExpressionNode extends BaseASTNode {
  readonly nodeType: ASTNodeType.BINARY_EXPRESSION;
  readonly left: ExpressionNode;
  readonly operator: string; // '+', '-', '*', '/', '%', '^', '=', '<>', '<', '<=', '>', '>=', 'Y', 'O'
  readonly right: ExpressionNode;
}

export interface UnaryExpressionNode extends BaseASTNode {
  readonly nodeType: ASTNodeType.UNARY_EXPRESSION;
  readonly operator: string; // '-', 'NO'
  readonly operand: ExpressionNode;
}

export interface LiteralNode extends BaseASTNode {
  readonly nodeType: ASTNodeType.LITERAL;
  readonly value: LiteralValue;
  readonly rawType: DataType;
}

export interface IdentifierNode extends BaseASTNode {
  readonly nodeType: ASTNodeType.IDENTIFIER;
  readonly name: string;
}

export interface GroupingExpressionNode extends BaseASTNode {
  readonly nodeType: ASTNodeType.GROUPING;
  readonly expression: ExpressionNode;
}

// ---------------- SENTENCIAS ----------------

export type StatementNode =
  | VariableDeclarationNode
  | AssignmentNode
  | IfStatementNode
  | WhileStatementNode
  | ForStatementNode
  | PrintStatementNode
  | ReadStatementNode;

export interface VariableDeclarationNode extends BaseASTNode {
  readonly nodeType: ASTNodeType.VARIABLE_DECLARATION;
  readonly identifiers: string[];
  readonly dataType: DataType;
}

export interface AssignmentNode extends BaseASTNode {
  readonly nodeType: ASTNodeType.ASSIGNMENT;
  readonly identifier: string;
  readonly value: ExpressionNode;
}

export interface IfStatementNode extends BaseASTNode {
  readonly nodeType: ASTNodeType.IF_STATEMENT;
  readonly condition: ExpressionNode;
  readonly thenBranch: StatementNode[];
  readonly elseBranch?: StatementNode[];
}

export interface WhileStatementNode extends BaseASTNode {
  readonly nodeType: ASTNodeType.WHILE_STATEMENT;
  readonly condition: ExpressionNode;
  readonly body: StatementNode[];
}

export interface ForStatementNode extends BaseASTNode {
  readonly nodeType: ASTNodeType.FOR_STATEMENT;
  readonly identifier: string;
  readonly initialValue: ExpressionNode;
  readonly targetValue: ExpressionNode;
  readonly stepValue?: ExpressionNode; // Si no se especifica, por defecto es 1
  readonly body: StatementNode[];
}

export interface PrintStatementNode extends BaseASTNode {
  readonly nodeType: ASTNodeType.PRINT_STATEMENT;
  readonly expressions: ExpressionNode[];
}

export interface ReadStatementNode extends BaseASTNode {
  readonly nodeType: ASTNodeType.READ_STATEMENT;
  readonly identifiers: string[];
}

// ---------------- NODO RAÍZ DEL PROGRAMA ----------------

export interface ProgramNode extends BaseASTNode {
  readonly nodeType: ASTNodeType.PROGRAM;
  readonly name: string;
  readonly declarations: VariableDeclarationNode[];
  readonly body: StatementNode[];
}
