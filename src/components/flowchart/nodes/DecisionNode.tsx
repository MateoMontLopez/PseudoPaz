import React, { useState, useRef, useEffect } from 'react';
import { NodeProps, Node, useReactFlow } from '@xyflow/react';
import { FlowchartNodeData } from './nodeTypes';
import { NodeHandles } from './NodeHandles';

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
      style={{ background: 'transparent' }}
      className="relative flex items-center justify-center w-[170px] h-[90px] select-none group cursor-pointer"
    >
      {/* 4 Handles Source y 4 Handles Target (Top, Bottom, Left, Right) */}
      <NodeHandles
        color="#fbbf24"
        topOffset={{ target: '40%', source: '60%' }}
        bottomOffset={{ target: '40%', source: '60%' }}
        leftOffset={{ target: '35%', source: '65%' }}
        rightOffset={{ target: '35%', source: '65%' }}
        customIds={{
          rightSource: 'yes',
          leftSource: 'no',
        }}
      />

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

      {/* Badge identificador del camino 'No' en la izquierda */}
      <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none select-none">
        <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/90 px-1 py-0.5 rounded border border-rose-800/60 shadow-xs mr-1">
          No
        </span>
      </div>

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

      {/* Badge identificador del camino 'Sí' en la derecha */}
      <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none select-none">
        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-800/60 shadow-xs ml-1">
          Sí
        </span>
      </div>
    </div>
  );
};
