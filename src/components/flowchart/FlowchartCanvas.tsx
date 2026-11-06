import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  useReactFlow,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TerminalNode } from './nodes/TerminalNode';
import { ProcessNode } from './nodes/ProcessNode';
import { InputNode, IONode } from './nodes/InputNode';
import { OutputNode } from './nodes/OutputNode';
import { DecisionNode } from './nodes/DecisionNode';
import { SidebarToolbar } from './SidebarToolbar';
import { useFlowchartSecurity } from './useFlowchartSecurity';
import { useTheme } from '../../hooks/useTheme';
import { ShieldAlert } from 'lucide-react';

const nodeTypes = {
  terminal: TerminalNode,
  process: ProcessNode,
  input: InputNode,
  io: IONode,
  output: OutputNode,
  decision: DecisionNode,
};

// Diagrama inicial vacío
const INITIAL_NODES: Node[] = [];
const INITIAL_EDGES: Edge[] = [];

interface FlowchartCanvasInnerProps {
  isExamMode: boolean;
}

const FlowchartCanvasInner: React.FC<FlowchartCanvasInnerProps> = ({
  isExamMode,
}) => {
  const { isDark } = useTheme();
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  // Reinicio de seguridad si se pierde el foco en modo examen
  const handleSecurityReset = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  // Hook de seguridad
  useFlowchartSecurity({
    containerRef,
    isExamMode,
    onSecurityReset: handleSecurityReset,
    onWarning: (msg) => {
      setWarningMessage(msg);
      setTimeout(() => setWarningMessage(null), 3500);
    },
  });

  // Conexión interactiva entre handles con trazos coloreados sin etiquetas de texto
  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const sourceHandle = connection.sourceHandle || '';

      let strokeColor = '#38bdf8'; // Default sky blue

      if (sourceNode) {
        switch (sourceNode.type) {
          case 'decision': {
            const isYes =
              sourceHandle === 'yes' ||
              sourceHandle.includes('yes') ||
              sourceHandle.includes('right');
            const isNo =
              sourceHandle === 'no' ||
              sourceHandle.includes('no') ||
              sourceHandle.includes('left');

            if (isNo) {
              strokeColor = '#f87171'; // Rose para No
            } else if (isYes) {
              strokeColor = '#34d399'; // Emerald para Sí
            } else {
              strokeColor = '#34d399'; // Emerald para Sí por defecto
            }
            break;
          }

          case 'input':
          case 'io': {
            strokeColor = '#c084fc'; // Purple
            break;
          }

          case 'output': {
            strokeColor = '#22d3ee'; // Cyan
            break;
          }

          case 'process': {
            strokeColor = '#38bdf8'; // Sky
            break;
          }

          case 'terminal': {
            strokeColor = '#34d399'; // Emerald
            break;
          }

          default:
            strokeColor = '#38bdf8';
            break;
        }
      }

      const newEdge: Edge = {
        ...connection,
        id: `e-${connection.source}-${sourceHandle || 'def'}-${connection.target}-${Date.now()}`,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
          width: 14,
          height: 14,
        },
        style: {
          stroke: strokeColor,
          strokeWidth: 2,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [nodes, setEdges]
  );

  // Manejo de Drag & Drop desde la paleta lateral
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData) return;

      try {
        const { type, label } = JSON.parse(rawData);
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        const newNode: Node = {
          id: `node-${Date.now()}`,
          type,
          position,
          data: { label },
        };

        setNodes((nds) => nds.concat(newNode));
      } catch (e) {
        // Ignorar datos no válidos
      }
    },
    [screenToFlowPosition, setNodes]
  );

  // Añadir nodo haciendo clic desde la barra lateral
  const handleAddNodeClick = useCallback(
    (type: string, label: string) => {
      const position = {
        x: 320 + (Math.random() - 0.5) * 60,
        y: 180 + (Math.random() - 0.5) * 60,
      };

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type,
        position,
        data: { label },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const handleClearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#09090b]">
      {/* Barra de herramientas lateral */}
      <SidebarToolbar
        onClearCanvas={handleClearCanvas}
        onFitView={() => fitView({ duration: 400 })}
        onAddNodeClick={handleAddNodeClick}
      />

      {/* Área del Lienzo React Flow + Barra de Información Superior */}
      <div className="flex-1 h-full flex flex-col relative overflow-hidden">
        {/* Barra superior del Lienzo DFD (Modo Edición Visual) */}
        <div
          className={`h-10 px-4 border-b flex items-center justify-between z-20 shrink-0 select-none transition-colors duration-150 ${
            isDark
              ? 'bg-[#0d1017] border-zinc-800/80 text-zinc-300'
              : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className={isDark ? 'text-zinc-500' : 'text-slate-400'}>workspace /</span>
            <span className={`font-medium ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
              diagrama_flujo.dfd
            </span>
            <span className={isDark ? 'text-zinc-700' : 'text-slate-300'}>|</span>
            <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              {nodes.length} {nodes.length === 1 ? 'nodo' : 'nodos'}, {edges.length}{' '}
              {edges.length === 1 ? 'conexión' : 'conexiones'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-medium">
              Modo Edición Visual
            </span>
          </div>
        </div>

        {/* Lienzo Interactivo React Flow */}
        <div
          ref={containerRef}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="flex-1 w-full relative overflow-hidden"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            snapToGrid
            snapGrid={[15, 15]}
            deleteKeyCode={['Backspace', 'Delete']}
            className={isDark ? 'bg-[#09090b]' : 'bg-[#f8fafc]'}
          >
            <Background
              color={isDark ? '#27272a' : '#cbd5e1'}
              gap={18}
              size={1.5}
              variant={BackgroundVariant.Dots}
            />
            <Controls
              className={
                isDark
                  ? '!bg-zinc-900 !border-zinc-800 !rounded-md !shadow-lg [&>button]:!bg-zinc-900 [&>button]:!border-zinc-800 [&>button]:!text-zinc-300 hover:[&>button]:!bg-zinc-800'
                  : '!bg-white !border-slate-300 !rounded-md !shadow-lg [&>button]:!bg-white [&>button]:!border-slate-300 [&>button]:!text-slate-700 hover:[&>button]:!bg-slate-100'
              }
              showInteractive={false}
            />
          </ReactFlow>

          {/* Mensaje sutil cuando el lienzo está vacío */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none space-y-2 z-10">
              <p
                className={`text-xs font-mono font-medium ${
                  isDark ? 'text-zinc-500' : 'text-slate-400'
                }`}
              >
                Lienzo de Diagrama DFD Vacío
              </p>
              <p className={`text-[11px] ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                Arrastra símbolos desde la paleta lateral o haz clic en ellos para empezar.
              </p>
            </div>
          )}

          {/* Notificación de advertencia o error en el canvas */}
          {warningMessage && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 px-3.5 py-2 bg-amber-500/15 border border-amber-500/40 text-amber-500 dark:text-amber-300 rounded-md text-xs shadow-2xl backdrop-blur-md animate-in fade-in duration-150">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-medium">{warningMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export interface FlowchartCanvasProps {
  isExamMode?: boolean;
}

export const FlowchartCanvas: React.FC<FlowchartCanvasProps> = ({
  isExamMode = false,
}) => {
  return (
    <ReactFlowProvider>
      <FlowchartCanvasInner isExamMode={isExamMode} />
    </ReactFlowProvider>
  );
};
