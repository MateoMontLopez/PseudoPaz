import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, Node, useReactFlow } from '@xyflow/react';
import { FlowchartNodeData } from './nodeTypes';

export type DecisionNodeType = Node<FlowchartNodeData, 'decision'>;

export const DecisionNode: React.FC<NodeProps<DecisionNodeType>> = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label || '¿Condición?');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { setNodes } = useReactFlow();

  useEffect(() => {
    setText(data.label);
  }, [data.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleFinishEditing = () => {
    setIsEditing(false);
    const newLabel = text.trim() || '¿Condición?';
    setText(newLabel);
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, label: newLabel },
          };
        }
        return node;
      })
    );
  };

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className="relative flex items-center justify-center w-[170px] h-[90px] select-none group"
    >
      {/* SVG del Rombo (Diamond) para bordes perfectos */}
      <svg
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none drop-shadow-md"
        viewBox="0 0 170 90"
      >
        <polygon
          points="85,3 167,45 85,87 3,45"
          className={`transition-colors duration-150 ${
            selected
              ? 'fill-amber-950/40 stroke-amber-400 stroke-2'
              : 'fill-zinc-900/90 stroke-amber-600/70 group-hover:stroke-amber-500 stroke-[1.5]'
          }`}
        />
      </svg>

      {/* Handle superior de entrada (Target) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-zinc-800 !border-2 !border-amber-400 hover:!scale-125 !transition-transform !-top-1"
      />

      {/* Handle izquierdo: Salida 'No' (Source) */}
      <div className="absolute -left-5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none select-none">
        <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/80 px-1 py-0.5 rounded border border-rose-800/60 shadow-xs mr-1">
          No
        </span>
      </div>
      <Handle
        type="source"
        id="no"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-zinc-800 !border-2 !border-rose-400 hover:!scale-125 !transition-transform !-left-1"
      />

      {/* Contenido centrado con edición inline */}
      <div className="relative z-10 max-w-[110px] text-center px-1">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleFinishEditing}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleFinishEditing();
              if (e.key === 'Escape') {
                setText(data.label);
                setIsEditing(false);
              }
            }}
            className="bg-transparent text-amber-200 text-xs font-mono font-medium text-center outline-none w-full border-b border-amber-400/50"
          />
        ) : (
          <span className="text-xs font-mono font-medium text-amber-300 block break-words leading-tight">
            {text}
          </span>
        )}
      </div>

      {/* Handle derecho: Salida 'Sí' (Source) */}
      <Handle
        type="source"
        id="yes"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-zinc-800 !border-2 !border-emerald-400 hover:!scale-125 !transition-transform !-right-1"
      />
      <div className="absolute -right-5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none select-none">
        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-800/60 shadow-xs ml-1">
          Sí
        </span>
      </div>

      {/* Handle inferior alternativo de salida (Source) */}
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-zinc-800 !border-2 !border-amber-400/60 hover:!scale-125 !transition-transform !-bottom-1"
      />
    </div>
  );
};
