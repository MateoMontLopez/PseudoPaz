import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, Node, useReactFlow } from '@xyflow/react';
import { FlowchartNodeData } from './nodeTypes';

export type OutputNodeType = Node<FlowchartNodeData, 'output'>;

/**
 * Símbolo ANSI para Salida de Datos / Impresión en pantalla (Documento / Salida estándar).
 * Utilizado para operaciones de "Mostrar" o "Escribir".
 */
export const OutputNode: React.FC<NodeProps<OutputNodeType>> = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label || 'Mostrar "Resultado"');
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
    const newLabel = text.trim() || 'Mostrar resultado';
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
      className="relative group min-w-[130px] max-w-[240px] px-6 pt-3 pb-5 text-center cursor-pointer select-none"
    >
      {/* Fondo SVG con forma ANSI de Documento / Salida de Datos */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 160 60"
      >
        <path
          d="M 2 2 L 158 2 L 158 48 C 135 38, 105 38, 80 48 C 55 58, 25 58, 2 48 Z"
          fill={selected ? 'rgba(8, 47, 73, 0.75)' : 'rgba(8, 47, 73, 0.5)'}
          stroke={selected ? '#22d3ee' : '#0891b2'}
          strokeWidth={selected ? 2 : 1.5}
          style={{
            filter: selected
              ? 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.5))'
              : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35))',
            transition: 'all 0.15s ease-in-out',
          }}
        />
      </svg>

      {/* Handle superior de entrada (Target) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-zinc-800 !border-2 !border-cyan-400 hover:!scale-125 !transition-transform !-top-[5px]"
      />

      {/* Handle izquierdo */}
      <Handle
        type="target"
        id="left"
        position={Position.Left}
        className="!w-2 !h-2 !bg-zinc-800 !border-2 !border-cyan-400/80 hover:!scale-125 !transition-transform !top-[40%]"
      />

      {/* Contenido / Texto editable */}
      <div className="relative z-10 px-1 py-0.5">
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
            className="bg-transparent text-cyan-200 text-xs font-mono font-medium text-center outline-none w-full border-b border-cyan-400/60"
          />
        ) : (
          <span className="text-xs font-mono font-medium text-cyan-200 block break-words">
            {text}
          </span>
        )}
      </div>

      {/* Handle derecho */}
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className="!w-2 !h-2 !bg-zinc-800 !border-2 !border-cyan-400/80 hover:!scale-125 !transition-transform !top-[40%]"
      />

      {/* Handle inferior de salida (Source) - alineado con la onda del documento */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-zinc-800 !border-2 !border-cyan-400 hover:!scale-125 !transition-transform !bottom-[3px]"
      />
    </div>
  );
};
