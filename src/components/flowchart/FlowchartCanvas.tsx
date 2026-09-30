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
import { convertDFDToPseudocode } from './dfdToCode';
import { VirtualConsole } from '../console/VirtualConsole';
import {
  RunnerStatus,
  ConsoleOutputItem,
  InputPromptState,
} from '../../hooks/usePseudocodeRunner';
import {
  Play,
  Square,
  Terminal,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

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
  onRunCode?: (code: string) => void;
  onStop?: () => void;
  status?: RunnerStatus;
  outputs?: ConsoleOutputItem[];
  inputPrompt?: InputPromptState | null;
  executionTimeMs?: number | null;
  onProvideInput?: (value: string) => void;
  onClearConsole?: () => void;
}

const FlowchartCanvasInner: React.FC<FlowchartCanvasInnerProps> = ({
  isExamMode,
  onRunCode,
  onStop,
  status = 'idle',
  outputs = [],
  inputPrompt = null,
  executionTimeMs = null,
  onProvideInput = () => {},
  onClearConsole = () => {},
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const isRunning = status === 'running' || status === 'waiting_input';

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

  // Conexión interactiva entre handles con estilo de línea fluido y etiquetas dinámicas de origen
  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const sourceHandle = connection.sourceHandle || '';

      let label = 'Flujo';
      let strokeColor = '#38bdf8'; // Default sky blue
      let bgColor = '#0c4a6e';

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
              label = 'No';
              strokeColor = '#f87171'; // Rose
              bgColor = '#4c0519';
            } else if (isYes) {
              label = 'Sí';
              strokeColor = '#34d399'; // Emerald
              bgColor = '#064e3b';
            } else {
              label = 'Sí';
              strokeColor = '#34d399'; // Emerald
              bgColor = '#064e3b';
            }
            break;
          }

          case 'input':
          case 'io': {
            label = 'Leer';
            strokeColor = '#c084fc'; // Purple
            bgColor = '#3b0764';
            break;
          }

          case 'output': {
            label = 'Mostrar';
            strokeColor = '#22d3ee'; // Cyan
            bgColor = '#083344';
            break;
          }

          case 'process': {
            label = 'Proceso';
            strokeColor = '#38bdf8'; // Sky
            bgColor = '#0c4a6e';
            break;
          }

          case 'terminal': {
            const isFin = /fin/i.test(String(sourceNode.data?.label || ''));
            label = isFin ? 'Fin' : 'Inicio';
            strokeColor = '#34d399'; // Emerald
            bgColor = '#064e3b';
            break;
          }

          default:
            label = 'Flujo';
            strokeColor = '#38bdf8';
            bgColor = '#0c4a6e';
            break;
        }
      }

      const newEdge: Edge = {
        ...connection,
        id: `e-${connection.source}-${sourceHandle || 'def'}-${connection.target}-${Date.now()}`,
        type: 'smoothstep',
        label,
        labelStyle: {
          fill: strokeColor,
          fontWeight: 700,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', Consolas, monospace",
        },
        labelBgStyle: {
          fill: bgColor,
          fillOpacity: 0.95,
          rx: 4,
          ry: 4,
          stroke: strokeColor,
          strokeWidth: 1,
        },
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 4,
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

  // Ejecución directa del DFD
  const handleRunDFD = useCallback(() => {
    if (!onRunCode) return;

    const result = convertDFDToPseudocode(nodes, edges);
    if (!result.success || !result.code) {
      setWarningMessage(result.error || 'No se pudo generar código desde el diagrama.');
      setTimeout(() => setWarningMessage(null), 4000);
      return;
    }

    // Abrir automáticamente la consola y despachar la ejecución al Web Worker
    setIsConsoleOpen(true);
    onRunCode(result.code);
  }, [nodes, edges, onRunCode]);

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#09090b]">
      {/* Barra de herramientas lateral */}
      <SidebarToolbar
        onClearCanvas={handleClearCanvas}
        onFitView={() => fitView({ duration: 400 })}
        onAddNodeClick={handleAddNodeClick}
      />

      {/* Área del Lienzo React Flow + Barra de Acciones + Consola Embebida */}
      <div className="flex-1 h-full flex flex-col relative overflow-hidden">
        {/* Barra superior de acciones del Lienzo DFD */}
        <div className="h-10 px-4 bg-[#0d1017] border-b border-zinc-800/80 flex items-center justify-between z-20 shrink-0 select-none">
          <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400">
            <span className="text-zinc-500">workspace /</span>
            <span className="text-zinc-200 font-medium">diagrama_flujo.dfd</span>
            <span className="text-zinc-700">|</span>
            <span className="text-[11px] text-zinc-500">
              {nodes.length} {nodes.length === 1 ? 'nodo' : 'nodos'}, {edges.length}{' '}
              {edges.length === 1 ? 'conexión' : 'conexiones'}
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Botón destacado: [ ▶️ Ejecutar DFD ] */}
            {!isRunning ? (
              <button
                onClick={handleRunDFD}
                title="Convertir DFD a código ejecutable y correr en Web Worker"
                className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded text-xs font-semibold transition-all shadow-md shadow-emerald-950/40 active:scale-95 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ejecutar DFD</span>
              </button>
            ) : (
              <button
                onClick={onStop}
                title="Detener ejecución del DFD"
                className="flex items-center space-x-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition-all shadow-md shadow-rose-950/40 active:scale-95 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Detener</span>
              </button>
            )}

            {/* Botón para alternar la consola I/O en la vista de diagrama */}
            <button
              onClick={() => setIsConsoleOpen((prev) => !prev)}
              title={isConsoleOpen ? 'Ocultar consola de salida' : 'Mostrar consola de salida'}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${
                isConsoleOpen
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Consola</span>
              {outputs.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300 font-mono">
                  {outputs.length}
                </span>
              )}
              {isConsoleOpen ? (
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              ) : (
                <ChevronUp className="w-3 h-3 text-zinc-400" />
              )}
            </button>
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
            className="bg-[#09090b]"
          >
            <Background
              color="#27272a"
              gap={18}
              size={1.5}
              variant={BackgroundVariant.Dots}
            />
            <Controls
              className="!bg-zinc-900 !border-zinc-800 !rounded-md !shadow-lg [&>button]:!bg-zinc-900 [&>button]:!border-zinc-800 [&>button]:!text-zinc-300 hover:[&>button]:!bg-zinc-800"
              showInteractive={false}
            />
          </ReactFlow>

          {/* Mensaje sutil cuando el lienzo está vacío */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-zinc-600 space-y-2 z-10">
              <p className="text-xs font-mono text-zinc-500 font-medium">
                Lienzo de Diagrama DFD Vacío
              </p>
              <p className="text-[11px] text-zinc-600">
                Arrastra símbolos desde la paleta lateral o haz clic en ellos para empezar.
              </p>
            </div>
          )}

          {/* Notificación de advertencia o error en el canvas */}
          {warningMessage && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 px-3.5 py-2 bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded-md text-xs shadow-2xl backdrop-blur-md animate-in fade-in duration-150">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-medium">{warningMessage}</span>
            </div>
          )}
        </div>

        {/* Panel inferior embebido de Consola Virtual I/O para ejecución directa desde DFD */}
        {isConsoleOpen && (
          <div className="h-56 w-full border-t border-zinc-800/80 bg-[#0d0d10] flex flex-col shrink-0 z-20 animate-in slide-in-from-bottom-4 duration-150">
            <VirtualConsole
              outputs={outputs}
              status={status}
              inputPrompt={inputPrompt}
              executionTimeMs={executionTimeMs}
              onProvideInput={onProvideInput}
              onClearConsole={onClearConsole}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export interface FlowchartCanvasProps {
  isExamMode?: boolean;
  onRunCode?: (code: string) => void;
  onStop?: () => void;
  status?: RunnerStatus;
  outputs?: ConsoleOutputItem[];
  inputPrompt?: InputPromptState | null;
  executionTimeMs?: number | null;
  onProvideInput?: (value: string) => void;
  onClearConsole?: () => void;
}

export const FlowchartCanvas: React.FC<FlowchartCanvasProps> = ({
  isExamMode = false,
  onRunCode,
  onStop,
  status = 'idle',
  outputs = [],
  inputPrompt = null,
  executionTimeMs = null,
  onProvideInput,
  onClearConsole,
}) => {
  return (
    <ReactFlowProvider>
      <FlowchartCanvasInner
        isExamMode={isExamMode}
        onRunCode={onRunCode}
        onStop={onStop}
        status={status}
        outputs={outputs}
        inputPrompt={inputPrompt}
        executionTimeMs={executionTimeMs}
        onProvideInput={onProvideInput}
        onClearConsole={onClearConsole}
      />
    </ReactFlowProvider>
  );
};
