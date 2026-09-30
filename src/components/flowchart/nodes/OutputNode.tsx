import React, { useState, useRef, useEffect } from 'react';
import { NodeProps, Node, useReactFlow } from '@xyflow/react';
import { FlowchartNodeData } from './nodeTypes';
import { NodeHandles } from './NodeHandles';

export type OutputNodeType = Node<FlowchartNodeData, 'output'>;

/**
 * Símbolo ANSI para Salida de Datos / Impresión en pantalla (Documento).
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
      style={{ background: 'transparent' }}
      className="relative group min-w-[140px] max-w-[240px] h-[58px] px-6 pt-2.5 pb-4 text-center cursor-pointer select-none flex items-center justify-center"
    >
      {/* 4 Handles Source y 4 Handles Target (Top, Bottom, Left, Right) */}
      <NodeHandles
        color="#22d3ee"
        topOffset={{ target: '40%', source: '60%' }}
        bottomOffset={{ target: '40%', source: '60%' }}
        leftOffset={{ target: '35%', source: '65%' }}
        rightOffset={{ target: '35%', source: '65%' }}
      />

      {/* Fondo SVG con forma ANSI de Documento / Salida de Datos */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 160 58"
      >
        <path
          d="M 2 2 L 158 2 L 158 46 C 135 36, 105 36, 80 46 C 55 56, 25 56, 2 46 Z"
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

      {/* Contenido / Texto editable */}
      <div className="relative z-10 px-1 py-0.5 max-w-[130px]">
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
          <span className="text-xs font-mono font-medium text-cyan-200 block break-words leading-tight">
            {text}
          </span>
        )}
      </div>
    </div>
  );
};
