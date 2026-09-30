import { Node, Edge } from '@xyflow/react';

export interface DFDConversionResult {
  success: boolean;
  code?: string;
  error?: string;
}

/**
 * Normaliza una expresión de asignación o sentencia.
 * Por ejemplo: "x = 10" -> "x <- 10"
 */
function normalizeStatement(stmt: string): string {
  let cleaned = stmt.trim();
  // Reemplazar asignaciones '=' por '<-' si no es comparación '==' o '<=' o '>='
  if (!cleaned.includes('<-') && !cleaned.includes(':=') && cleaned.includes('=')) {
    cleaned = cleaned.replace(/(^|[^<>=!])=([^=])/g, '$1<-$2');
  }
  return cleaned;
}

/**
 * Limpia y formatea la condición de un nodo de decisión.
 */
function cleanCondition(cond: string): string {
  let cleaned = cond.replace(/[¿?]/g, '').trim();
  if (cleaned.toLowerCase().startsWith('si ')) {
    cleaned = cleaned.substring(3).trim();
  }
  if (cleaned.toLowerCase().endsWith(' entonces')) {
    cleaned = cleaned.substring(0, cleaned.length - 9).trim();
  }
  return cleaned || 'Verdadero';
}

/**
 * Convierte un grafo interactivo de React Flow (nodos y conectores DFD)
 * a código pseudocódigo estándar ejecutable por el motor de PseudoPaz.
 */
export function convertDFDToPseudocode(
  nodes: Node[],
  edges: Edge[]
): DFDConversionResult {
  if (!nodes || nodes.length === 0) {
    return {
      success: false,
      error: 'El diagrama está vacío. Añade símbolos desde la barra lateral y conéctalos para ejecutar.',
    };
  }

  // 1. Encontrar el nodo de inicio
  // Prioridad 1: Nodo 'terminal' con label que contiene 'inicio'
  let startNode = nodes.find(
    (n) => n.type === 'terminal' && /inicio/i.test(n.data?.label as string || '')
  );

  // Prioridad 2: Primer nodo de tipo 'terminal'
  if (!startNode) {
    startNode = nodes.find((n) => n.type === 'terminal');
  }

  // Prioridad 3: Nodo con grado de entrada 0 (sin aristas que apunten a él)
  if (!startNode) {
    const targetNodeIds = new Set(edges.map((e) => e.target));
    startNode = nodes.find((n) => !targetNodeIds.has(n.id));
  }

  // Prioridad 4: El primer nodo cualquiera
  if (!startNode) {
    startNode = nodes[0];
  }

  // Obtener nombre del algoritmo del nodo de inicio
  let algoName = 'DiagramaDFD';
  if (startNode.data?.label) {
    const rawLabel = String(startNode.data.label).trim();
    const match = rawLabel.match(/inicio[:\s]+([a-zA-Z0-9_]+)/i);
    if (match) {
      algoName = match[1];
    } else if (rawLabel && !/inicio/i.test(rawLabel)) {
      algoName = rawLabel.replace(/[^a-zA-Z0-9_]/g, '') || 'DiagramaDFD';
    }
  }

  // Mapear nodos por ID para búsqueda rápida
  const nodeMap = new Map<string, Node>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Mapear aristas salientes por nodo origen
  const outgoingEdges = new Map<string, Edge[]>();
  edges.forEach((e) => {
    const list = outgoingEdges.get(e.source) || [];
    list.push(e);
    outgoingEdges.set(e.source, list);
  });

  const generatedStatements: string[] = [];
  const discoveredVariables = new Set<string>();
  const visitedNodesInPath = new Set<string>();

  // Función recursiva / iterativa de recorrido del grafo
  function traverseNode(currentNodeId: string, indent: string = '    '): void {
    if (visitedNodesInPath.has(currentNodeId)) {
      // Detección de bucle o ciclo hacia atrás
      return;
    }

    const node = nodeMap.get(currentNodeId);
    if (!node) return;

    visitedNodesInPath.add(currentNodeId);

    const label = String(node.data?.label || '').trim();

    switch (node.type) {
      case 'terminal': {
        if (/fin/i.test(label) && !/inicio/i.test(label)) {
          // Nodo terminal de fin
          return;
        }
        // Si es el nodo de inicio, simplemente avanzar al siguiente
        break;
      }

      case 'process': {
        // Puede contener múltiples asignaciones separadas por coma o salto de línea
        // Ej: "n <- 6, fact <- 1" o "x <- 10"
        const subStatements = label.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
        for (const rawSub of subStatements) {
          const norm = normalizeStatement(rawSub);
          generatedStatements.push(`${indent}${norm}`);

          // Extraer variable para declaración si es asignación
          const assignMatch = norm.match(/^([a-zA-ZáéíóúÁÉÍÓÚñÑ_][a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_]*)\s*(?:<-|:=)/);
          if (assignMatch) {
            discoveredVariables.add(assignMatch[1]);
          }
        }
        break;
      }

      case 'input':
      case 'io': {
        // Operación Leer
        let varName = label;
        if (varName.toLowerCase().startsWith('leer ')) {
          varName = varName.substring(5).trim();
        }
        // Limpiar "E/S:" o prefijos
        varName = varName.replace(/^(?:e\/s|lectura)[:\s]*/i, '').trim();

        // Extraer variables separadas por comas
        const vars = varName.split(',').map((v) => v.trim()).filter(Boolean);
        for (const v of vars) {
          const cleanVar = v.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ_0-9]/g, '');
          if (cleanVar) {
            generatedStatements.push(`${indent}Leer ${cleanVar}`);
            discoveredVariables.add(cleanVar);
          }
        }
        break;
      }

      case 'output': {
        // Operación Mostrar / Escribir
        let outContent = label;
        if (/^(?:mostrar|escribir)\s+/i.test(outContent)) {
          outContent = outContent.replace(/^(?:mostrar|escribir)\s+/i, '').trim();
        }
        // Si no tiene comillas y parece texto simple sin operadores, o es expresión
        generatedStatements.push(`${indent}Escribir ${outContent}`);
        break;
      }

      case 'decision': {
        const condition = cleanCondition(label);
        const outs = outgoingEdges.get(currentNodeId) || [];

        // Buscar arista 'Sí' y arista 'No'
        const yesEdge = outs.find((e) => {
          const lbl = String(e.label || '').toLowerCase();
          return (
            lbl === 'sí' ||
            lbl === 'si' ||
            e.sourceHandle === 'yes' ||
            e.sourceHandle?.includes('yes') ||
            e.sourceHandle?.includes('right')
          );
        });

        const noEdge = outs.find((e) => {
          const lbl = String(e.label || '').toLowerCase();
          return (
            lbl === 'no' ||
            e.sourceHandle === 'no' ||
            e.sourceHandle?.includes('no') ||
            e.sourceHandle?.includes('left')
          );
        });

        generatedStatements.push(`${indent}Si ${condition} Entonces`);

        if (yesEdge) {
          traverseNode(yesEdge.target, indent + '    ');
        }

        if (noEdge) {
          generatedStatements.push(`${indent}Sino`);
          traverseNode(noEdge.target, indent + '    ');
        }

        generatedStatements.push(`${indent}FinSi`);
        return; // Las ramas ya continuaron
      }

      default:
        break;
    }

    // Continuar con los nodos hijos (para nodos lineales)
    const outs = outgoingEdges.get(currentNodeId) || [];
    if (outs.length > 0) {
      traverseNode(outs[0].target, indent);
    }
  }

  // Iniciar recorrido
  traverseNode(startNode.id);

  // Declarar variables descubiertas
  const varDeclarations: string[] = [];
  if (discoveredVariables.size > 0) {
    const varList = Array.from(discoveredVariables).join(', ');
    varDeclarations.push(`    Definir ${varList} Como Real`);
  }

  // Ensamblar código final
  const lines: string[] = [
    `Algoritmo ${algoName}`,
    ...(varDeclarations.length > 0 ? [...varDeclarations, ''] : []),
    ...(generatedStatements.length > 0
      ? generatedStatements
      : ['    // Diagrama sin instrucciones ejecutables', '    Escribir "Ejecución DFD finalizada"']),
    'FinAlgoritmo',
  ];

  return {
    success: true,
    code: lines.join('\n'),
  };
}
