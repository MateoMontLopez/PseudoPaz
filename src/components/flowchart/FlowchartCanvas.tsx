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
import { InputNode, IONode } from './nodes/IONode';
import { OutputNode } from './nodes/OutputNode';
import { DecisionNode } from './nodes/DecisionNode';
import { SidebarToolbar } from './SidebarToolbar';
import { useFlowchartSecurity } from './useFlowchartSecurity';
import { ShieldAlert } from 'lucide-react';

const nodeTypes = {
  terminal: TerminalNode,
  process: ProcessNode,
  input: InputNode,
  io: IONode, // Retrocompatibilidad para diagramas existentes
  output: OutputNode,
  decision: DecisionNode,
};

// Diagrama inicial vacío
const INITIAL_NODES: Node[] = [];
const INITIAL_EDGES: Edge[] = [];

interface FlowchartCanvasInnerProps {
  isExamMode: boolean;
}

const FlowchartCanvasInner: React.FC<FlowchartCanvasInnerProps> = ({ isExamMode }) => {
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
      setTimeout(() => setWarningMessage(null), 3000);
    },
  });

  // Conexión interactiva entre handles
  const onConnect = useCallback(
    (connection: Connection) => {
      const isFromDecisionYes = connection.sourceHandle === 'yes';
      const isFromDecisionNo = connection.sourceHandle === 'no';

      let label: string | undefined = undefined;
      let strokeColor = '#38bdf8';
      let labelStyle: React.CSSProperties | undefined = undefined;
      let labelBgStyle: React.CSSProperties | undefined = undefined;

      if (isFromDecisionYes) {
        label = 'Sí';
        strokeColor = '#34d399';
        labelStyle = { fill: '#34d399', fontWeight: 700, fontSize: 11, fontFamily: 'monospace' };
        labelBgStyle = { fill: '#064e3b', fillOpacity: 0.9, rx: 4, ry: 4 };
      } else if (isFromDecisionNo) {
        label = 'No';
        strokeColor = '#f87171';
        labelStyle = { fill: '#f87171', fontWeight: 700, fontSize: 11, fontFamily: 'monospace' };
        labelBgStyle = { fill: '#4c0519', fillOpacity: 0.9, rx: 4, ry: 4 };
      }

      const newEdge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.sourceHandle || 'def'}-${connection.target}-${Date.now()}`,
        type: 'smoothstep',
        label,
        labelStyle,
        labelBgStyle,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
        },
        style: {
          stroke: strokeColor,
          strokeWidth: 1.5,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
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
        x: 300 + (Math.random() - 0.5) * 80,
        y: 200 + (Math.random() - 0.5) * 80,
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

      {/* Área del Lienzo React Flow */}
      <div
        ref={containerRef}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className="flex-1 h-full w-full relative overflow-hidden"
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
            <p className="text-xs font-mono text-zinc-500 font-medium">Lienzo de Diagrama DFD Vacío</p>
            <p className="text-[11px] text-zinc-600">Arrastra símbolos desde la paleta lateral o haz clic en ellos para empezar.</p>
          </div>
        )}

        {/* Notificación de advertencia de seguridad en el canvas */}
        {warningMessage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-md text-xs shadow-lg backdrop-blur-md animate-in fade-in duration-150">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{warningMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export interface FlowchartCanvasProps {
  isExamMode?: boolean;
}

export const FlowchartCanvas: React.FC<FlowchartCanvasProps> = ({ isExamMode = false }) => {
  return (
    <ReactFlowProvider>
      <FlowchartCanvasInner isExamMode={isExamMode} />
    </ReactFlowProvider>
  );
};
