import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, Node, useReactFlow } from '@xyflow/react';
import { FlowchartNodeData } from './nodeTypes';

export type TerminalNodeType = Node<FlowchartNodeData, 'terminal'>;

export const TerminalNode: React.FC<NodeProps<TerminalNodeType>> = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label || 'Inicio');
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
    const newLabel = text.trim() || 'Inicio';
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
      className={`relative group px-6 py-2.5 rounded-full border transition-all duration-150 select-none shadow-md min-w-[120px] text-center ${
        selected
          ? 'border-emerald-400 bg-emerald-950/40 ring-2 ring-emerald-500/30'
          : 'border-emerald-600/70 bg-zinc-900/90 hover:border-emerald-500'
      }`}
    >
      {/* Handle superior de entrada (Target) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-zinc-800 !border-2 !border-emerald-400 hover:!scale-125 !transition-transform"
      />

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
          className="bg-transparent text-emerald-200 text-xs font-mono font-medium text-center outline-none w-full border-b border-emerald-400/50"
        />
      ) : (
        <span className="text-xs font-mono font-medium text-emerald-300 block tracking-wide">
          {text}
        </span>
      )}

      {/* Handle inferior de salida (Source) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-zinc-800 !border-2 !border-emerald-400 hover:!scale-125 !transition-transform"
      />
    </div>
  );
};
