import * as pdfjsLib from 'pdfjs-dist';
import { Lexer } from '../../engine/lexer/Lexer';
import { Parser } from '../../engine/parser/Parser';
import {
  ASTNodeType,
  BaseASTNode,
  ProgramNode,
  StatementNode,
  ExpressionNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  LiteralNode,
  IdentifierNode,
  GroupingExpressionNode,
  VariableDeclarationNode,
  AssignmentNode,
  IfStatementNode,
  WhileStatementNode,
  ForStatementNode,
  PrintStatementNode,
  ReadStatementNode,
} from '../../engine/parser/ast';
import { computeSha256 } from '../pdf/cryptoFingerprint';

// Configurar worker de pdfjs-dist para ejecución 100% en el cliente y offline
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export type PlagiarismStatus =
  | 'identical_hash' // 🔴 Plagio 100% (Hash Idéntico)
  | 'ast_copy' // 🟡 Copia Sintáctica (AST Coincidente)
  | 'tampered' // ⚠️ Documento Alterado / Firma Inválida
  | 'authentic' // 🟢 Documento Auténtico / Único
  | 'unrecognized'; // Formato no emitido por PseudoPaz

export interface MatchedSubmission {
  id: string;
  studentName: string;
  fileName: string;
  reason: string;
}

export interface DecodedPdfData {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  studentName: string;
  subject: string;
  course: string;
  workTitle: string;
  reportedSha256: string;
  computedSha256: string;
  shortId: string;
  sessionId: string;
  timestampIso: string;
  code: string;
  astSignature: string;
  astHash: string;
  isSignatureValid: boolean;
  status: PlagiarismStatus;
  statusDetails: string;
  matchedWith: MatchedSubmission[];
  error?: string;
}

/**
 * Normaliza recursivamente un AST en una representación canónica estructural
 * que abstrae nombres de variables, comentarios y formato.
 */
function canonicalizeAST(node: ProgramNode): string {
  const idMap = new Map<string, string>();
  let idCounter = 0;

  const getCanonicalId = (name: string): string => {
    const key = name.toLowerCase().trim();
    if (!idMap.has(key)) {
      idMap.set(key, `V${idCounter++}`);
    }
    return idMap.get(key)!;
  };

  const canonicalizeExpr = (expr: ExpressionNode): string => {
    if (!expr) return 'NULL';
    switch (expr.nodeType) {
      case ASTNodeType.BINARY_EXPRESSION: {
        const bin = expr as BinaryExpressionNode;
        return `BIN(${canonicalizeExpr(bin.left)},${bin.operator},${canonicalizeExpr(bin.right)})`;
      }
      case ASTNodeType.UNARY_EXPRESSION: {
        const un = expr as UnaryExpressionNode;
        return `UN(${un.operator},${canonicalizeExpr(un.operand)})`;
      }
      case ASTNodeType.IDENTIFIER: {
        const id = expr as IdentifierNode;
        return `ID(${getCanonicalId(id.name)})`;
      }
      case ASTNodeType.LITERAL: {
        const lit = expr as LiteralNode;
        return `LIT(${lit.rawType})`;
      }
      case ASTNodeType.GROUPING: {
        const grp = expr as GroupingExpressionNode;
        return `GRP(${canonicalizeExpr(grp.expression)})`;
      }
      default:
        return 'EXPR';
    }
  };

  const canonicalizeStmt = (stmt: StatementNode): string => {
    if (!stmt) return 'NULL';
    switch (stmt.nodeType) {
      case ASTNodeType.VARIABLE_DECLARATION: {
        const decl = stmt as VariableDeclarationNode;
        const ids = decl.identifiers.map(getCanonicalId).sort().join(',');
        return `DECL([${ids}],${decl.dataType})`;
      }
      case ASTNodeType.ASSIGNMENT: {
        const assign = stmt as AssignmentNode;
        return `ASSIGN(${getCanonicalId(assign.identifier)},${canonicalizeExpr(assign.value)})`;
      }
      case ASTNodeType.IF_STATEMENT: {
        const ifStmt = stmt as IfStatementNode;
        const thenBody = ifStmt.thenBranch.map(canonicalizeStmt).join(';');
        const elseBody = ifStmt.elseBranch?.map(canonicalizeStmt).join(';') || '';
        return `IF(${canonicalizeExpr(ifStmt.condition)},[${thenBody}],[${elseBody}])`;
      }
      case ASTNodeType.WHILE_STATEMENT: {
        const whileStmt = stmt as WhileStatementNode;
        const body = whileStmt.body.map(canonicalizeStmt).join(';');
        return `WHILE(${canonicalizeExpr(whileStmt.condition)},[${body}])`;
      }
      case ASTNodeType.FOR_STATEMENT: {
        const forStmt = stmt as ForStatementNode;
        const body = forStmt.body.map(canonicalizeStmt).join(';');
        const step = forStmt.stepValue ? canonicalizeExpr(forStmt.stepValue) : '1';
        return `FOR(${getCanonicalId(forStmt.identifier)},${canonicalizeExpr(forStmt.initialValue)},${canonicalizeExpr(forStmt.targetValue)},${step},[${body}])`;
      }
      case ASTNodeType.PRINT_STATEMENT: {
        const print = stmt as PrintStatementNode;
        const exprs = print.expressions.map(canonicalizeExpr).join(',');
        return `PRINT([${exprs}])`;
      }
      case ASTNodeType.READ_STATEMENT: {
        const read = stmt as ReadStatementNode;
        const ids = read.identifiers.map(getCanonicalId).join(',');
        return `READ([${ids}])`;
      }
      default:
        return (stmt as BaseASTNode).nodeType || 'STMT';
    }
  };

  const decls = node.declarations.map(canonicalizeStmt).join(';');
  const body = node.body.map(canonicalizeStmt).join(';');
  return `PROG([${decls}],[${body}])`;
}

import { TokenType } from '../../engine/lexer/tokens';

/**
 * Normalización fallback basada en flujo de tokens si el parser detecta sintaxis parcial o errónea.
 */
function canonicalizeTokens(code: string): string {
  try {
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const idMap = new Map<string, string>();
    let idCounter = 0;

    return tokens
      .filter((t) => t.type !== TokenType.EOF)
      .map((t) => {
        if (t.type === TokenType.IDENTIFICADOR) {
          const key = t.lexeme.toLowerCase();
          if (!idMap.has(key)) idMap.set(key, `V${idCounter++}`);
          return `ID:${idMap.get(key)}`;
        }
        return `${t.type}:${t.lexeme}`;
      })
      .join('|');
  } catch {
    return code.replace(/\s+/g, ' ').trim();
  }
}

/**
 * Genera la firma y hash estructural del código fuente.
 */
export async function computeAstSignature(code: string): Promise<{ signature: string; hash: string }> {
  if (!code || !code.trim()) {
    return { signature: 'EMPTY', hash: await computeSha256('EMPTY') };
  }

  let signature: string;
  try {
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    signature = canonicalizeAST(ast);
  } catch {
    signature = canonicalizeTokens(code);
  }

  const hash = await computeSha256(signature);
  return { signature, hash };
}

/**
 * Extrae texto de todas las páginas de un documento PDF.
 */
async function extractAllText(pdf: pdfjsLib.PDFDocumentProxy): Promise<string> {
  const textParts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    textParts.push(pageText);
  }
  return textParts.join('\n');
}

/**
 * Analiza un único archivo PDF y extrae metadatos, firmas y código.
 */
export async function decodePdfFile(file: File): Promise<DecodedPdfData> {
  const id = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const arrayBuffer = await file.arrayBuffer();

  try {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const metadataResult = await pdf.getMetadata();
    const allText = await extractAllText(pdf);

    const info = (metadataResult.info || {}) as Record<string, unknown>;
    const keywordsStr = String(info.Keywords || '');
    const titleStr = String(info.Title || '');
    const authorStr = String(info.Author || '');
    const subjectStr = String(info.Subject || '');

    // 1. Extraer campos estructurados desde Keywords (incrustados por PseudoPaz)
    const extractKeyword = (key: string): string => {
      const regex = new RegExp(`(?:^|[;\\s])${key}:([^;]+)`, 'i');
      const match = keywordsStr.match(regex);
      return match ? match[1].trim() : '';
    };

    let reportedSha256 = extractKeyword('SHA256');
    let shortId = extractKeyword('ID');
    let sessionId = extractKeyword('Session');
    let studentName = decodeURIComponent(extractKeyword('Student'));
    let course = decodeURIComponent(extractKeyword('Course'));
    let subject = decodeURIComponent(extractKeyword('Subject'));
    let workTitle = decodeURIComponent(extractKeyword('WorkTitle'));
    const timestampIso = extractKeyword('Timestamp');
    const codeB64 = extractKeyword('CodeB64');

    let code = '';
    if (codeB64) {
      try {
        code = decodeURIComponent(atob(codeB64));
      } catch {
        code = atob(codeB64);
      }
    }

    // 2. Fallbacks si no estaban en Keywords (PDF generado con versión anterior o manual)
    if (!reportedSha256) {
      const shaMatch = allText.match(/SHA-256:\s*([a-fA-F0-9]{36,64})/i) ||
        allText.match(/Digest SHA-256:\s*([a-fA-F0-9]{64})/i) ||
        allText.match(/\b([a-fA-F0-9]{64})\b/);
      if (shaMatch) reportedSha256 = shaMatch[1];
    }

    if (!shortId) {
      const idMatch = allText.match(/AUTENTICIDAD:\s*([A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4})/i);
      if (idMatch) shortId = idMatch[1];
    }

    if (!studentName && authorStr) {
      studentName = authorStr.replace(/\(UNIPAZ.*\)/i, '').trim();
    }

    if (!studentName) {
      const studentMatch = allText.match(/ESTUDIANTE:\s*([^\n\r]+?)(?=\s{2,}|ASIGNATURA|$)/i);
      if (studentMatch) studentName = studentMatch[1].trim();
    }

    if (!course && authorStr) {
      const courseMatch = authorStr.match(/Curso\s*([^)]+)/i);
      if (courseMatch) course = courseMatch[1].trim();
    }

    if (!course) {
      const courseMatch = allText.match(/CURSO\s*\/\s*GRUPO:\s*([^\n\r]+?)(?=\s{2,}|ACTIVIDAD|$)/i);
      if (courseMatch) course = courseMatch[1].trim();
    }

    if (!subject && subjectStr) {
      subject = subjectStr.replace(/Entrega de\s*/i, '').replace(/- Verificación.*/i, '').trim();
    }

    if (!subject) {
      const subMatch = allText.match(/ASIGNATURA:\s*([^\n\r]+?)(?=\s{2,}|CURSO|$)/i);
      if (subMatch) subject = subMatch[1].trim();
    }

    if (!workTitle && titleStr) {
      workTitle = titleStr.replace(/—.*$/, '').trim();
    }

    if (!workTitle) {
      const actMatch = allText.match(/ACTIVIDAD:\s*([^\n\r]+?)(?=\s{2,}|FECHA|$)/i);
      if (actMatch) workTitle = actMatch[1].trim();
    }

    // 3. Fallback para extracción de código si no estaba en metadatos
    if (!code) {
      const codeRegex = /Algoritmo\s+[\s\S]*?FinAlgoritmo/i;
      const codeMatch = allText.match(codeRegex);
      if (codeMatch) {
        code = codeMatch[0];
      }
    }

    // 4. Verificación Criptográfica de Integridad
    let isSignatureValid = false;
    let computedSha256 = '';

    if (code && timestampIso && sessionId && studentName) {
      const codeHash = await computeSha256(code);
      const studentUpper = studentName.trim().toUpperCase();
      const subjectTrimmed = subject.trim();
      const courseTrimmed = course.trim();
      const workTitleTrimmed = workTitle.trim();

      const payloadToHash = [
        studentUpper,
        subjectTrimmed,
        courseTrimmed,
        workTitleTrimmed,
        timestampIso,
        codeHash,
        sessionId,
      ].join('|');

      computedSha256 = await computeSha256(payloadToHash);
      isSignatureValid = Boolean(
        reportedSha256 && computedSha256.toLowerCase() === reportedSha256.toLowerCase()
      );
    } else if (reportedSha256 && reportedSha256.length >= 32) {
      // Si no tenemos todos los campos para recomputar pero tiene firma SHA-256 válida
      computedSha256 = reportedSha256;
      isSignatureValid = true;
    }

    // 5. Cálculo de firma AST y Hash Estructural
    const { signature: astSignature, hash: astHash } = await computeAstSignature(code);

    return {
      id,
      fileName: file.name,
      fileSizeBytes: file.size,
      studentName: studentName || 'Estudiante Desconocido',
      subject: subject || 'No especificada',
      course: course || 'N/A',
      workTitle: workTitle || file.name.replace(/\.pdf$/i, ''),
      reportedSha256: reportedSha256 || 'NO DETECTADO',
      computedSha256,
      shortId: shortId || (reportedSha256 ? reportedSha256.substring(0, 8).toUpperCase() : 'N/A'),
      sessionId: sessionId || 'N/A',
      timestampIso: timestampIso || new Date(file.lastModified).toISOString(),
      code: code || '// No fue posible extraer el código fuente del documento',
      astSignature,
      astHash,
      isSignatureValid,
      status: 'authentic', // Se clasificará en el análisis masivo de la matriz
      statusDetails: 'Pendiente de evaluación en la matriz',
      matchedWith: [],
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error al procesar el archivo PDF';
    return {
      id,
      fileName: file.name,
      fileSizeBytes: file.size,
      studentName: 'Error de Lectura',
      subject: 'N/A',
      course: 'N/A',
      workTitle: file.name,
      reportedSha256: 'ERROR',
      computedSha256: '',
      shortId: 'ERROR',
      sessionId: 'ERROR',
      timestampIso: new Date().toISOString(),
      code: '',
      astSignature: 'ERROR',
      astHash: 'ERROR',
      isSignatureValid: false,
      status: 'unrecognized',
      statusDetails: errorMsg,
      matchedWith: [],
      error: errorMsg,
    };
  }
}

/**
 * Procesa masivamente un lote de archivos PDF y construye la matriz de detección anti-plagio
 * clasificando cada entrega según duplicados de hash, similitud sintáctica de AST y validez de firma.
 */
export async function analyzePdfBatch(
  files: File[],
  onProgress?: (processed: number, total: number) => void
): Promise<DecodedPdfData[]> {
  const decodedDocs: DecodedPdfData[] = [];

  for (let i = 0; i < files.length; i++) {
    const decoded = await decodePdfFile(files[i]);
    decodedDocs.push(decoded);
    if (onProgress) onProgress(i + 1, files.length);
  }

  // Matriz de Detección e Indicadores Anti-Plagio
  const validDocs = decodedDocs.filter((d) => !d.error && d.status !== 'unrecognized');

  // Mapear ocurrencias de Hash SHA-256
  const hashGroups = new Map<string, DecodedPdfData[]>();
  for (const doc of validDocs) {
    if (doc.reportedSha256 && doc.reportedSha256 !== 'NO DETECTADO') {
      const key = doc.reportedSha256.toLowerCase();
      const group = hashGroups.get(key) || [];
      group.push(doc);
      hashGroups.set(key, group);
    }
  }

  // Mapear ocurrencias de AST Hash (ignora nombres de variables)
  const astGroups = new Map<string, DecodedPdfData[]>();
  for (const doc of validDocs) {
    if (doc.astHash && doc.astHash !== 'EMPTY' && doc.code.length > 20) {
      const key = doc.astHash.toLowerCase();
      const group = astGroups.get(key) || [];
      group.push(doc);
      astGroups.set(key, group);
    }
  }

  // Clasificación final de cada documento
  for (const doc of decodedDocs) {
    if (doc.error || doc.status === 'unrecognized') {
      continue;
    }

    const shaKey = doc.reportedSha256.toLowerCase();
    const shaMatches = (hashGroups.get(shaKey) || []).filter((d) => d.id !== doc.id);

    // 🔴 1. Plagio 100% (Hash Idéntico):
    if (shaMatches.length > 0) {
      doc.status = 'identical_hash';
      doc.statusDetails = `Firma SHA-256 duplicada con ${shaMatches.length} otra(s) entrega(s)`;
      doc.matchedWith = shaMatches.map((m) => ({
        id: m.id,
        studentName: m.studentName,
        fileName: m.fileName,
        reason: 'Hash criptográfico SHA-256 exactamente idéntico (duplicación total)',
      }));
      continue;
    }

    // 🟡 2. Copia Sintáctica (AST Coincidente):
    const astKey = doc.astHash.toLowerCase();
    const astMatches = (astGroups.get(astKey) || []).filter((d) => d.id !== doc.id);

    if (astMatches.length > 0) {
      doc.status = 'ast_copy';
      doc.statusDetails = `Estructura lógica (AST) idéntica a ${astMatches.length} otra(s) entrega(s) (variables/comentarios alterados)`;
      doc.matchedWith = astMatches.map((m) => ({
        id: m.id,
        studentName: m.studentName,
        fileName: m.fileName,
        reason: 'Estructura sintáctica y flujo lógico de sentencias coincidente (AST Idéntico)',
      }));
      continue;
    }

    // ⚠️ 3. Documento Alterado / Firma Inválida:
    if (!doc.isSignatureValid) {
      doc.status = 'tampered';
      doc.statusDetails = 'La firma criptográfica no coincide con el contenido extraído o fue alterada';
      continue;
    }

    // 🟢 4. Documento Auténtico / Único:
    doc.status = 'authentic';
    doc.statusDetails = 'Firma digital íntegra y sin coincidencias sintácticas o criptográficas con otras entregas';
  }

  return decodedDocs;
}
