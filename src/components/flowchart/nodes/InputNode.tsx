import React, { useState, useRef, useEffect } from 'react';
import { NodeProps, Node, useReactFlow } from '@xyflow/react';
import { FlowchartNodeData } from './nodeTypes';
import { NodeHandles } from './NodeHandles';

export type InputNodeType = Node<FlowchartNodeData, 'input'>;
export type IONodeType = Node<FlowchartNodeData, 'io'>;

/**
 * Símbolo ANSI para Entrada de Datos (Paralelogramo).
 * Utilizado para la operación "Leer".
 * Fondo 100% transparente sin recuadros blancos indeseados.
 */
export const InputNode: React.FC<NodeProps<InputNodeType | IONodeType>> = ({
  id,
  data,
  selected,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label || 'Leer variable');
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
    const newLabel = text.trim() || 'Leer variable';
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
      className="relative flex items-center justify-center min-w-[150px] max-w-[240px] h-[52px] px-6 select-none group cursor-pointer"
    >
      {/* 4 Handles Source y 4 Handles Target (Top, Bottom, Left, Right) */}
      <NodeHandles
        color="#c084fc"
        topOffset={{ target: '42%', source: '58%' }}
        bottomOffset={{ target: '42%', source: '58%' }}
        leftOffset={{ target: '38%', source: '62%' }}
        rightOffset={{ target: '38%', source: '62%' }}
      />

      {/* SVG del Paralelogramo ANSI para bordes nítidos sin fondos blancos */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 160 52"
      >
        <polygon
          points="18,3 157,3 142,49 3,49"
          fill={selected ? 'rgba(192, 132, 252, 0.25)' : 'var(--node-bg)'}
          stroke={selected ? '#c084fc' : '#9333ea'}
          strokeWidth={selected ? 2 : 1.5}
          style={{
            filter: selected
              ? 'drop-shadow(0 0 8px rgba(192, 132, 252, 0.5))'
              : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))',
            transition: 'all 0.15s ease-in-out',
          }}
        />
      </svg>

      {/* Contenido / Texto editable centrado */}
      <div className="relative z-10 max-w-[130px] px-1 text-center">
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
            className="bg-transparent text-purple-700 dark:text-purple-200 text-xs font-mono font-medium text-center outline-none w-full border-b border-purple-400/60"
          />
        ) : (
          <span className="text-xs font-mono font-medium text-purple-700 dark:text-purple-200 block break-words leading-tight">
            {text}
          </span>
        )}
      </div>
    </div>
  );
};

export const IONode = InputNode;
