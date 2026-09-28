import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, Node, useReactFlow } from '@xyflow/react';
import { FlowchartNodeData } from './nodeTypes';

export type ProcessNodeType = Node<FlowchartNodeData, 'process'>;

export const ProcessNode: React.FC<NodeProps<ProcessNodeType>> = ({ id, data, selected }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label || 'x <- 1');
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
    const newLabel = text.trim() || 'Proceso';
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
      className={`relative group px-5 py-3 rounded-md border transition-all duration-150 select-none shadow-md min-w-[130px] max-w-[240px] text-center ${
        selected
          ? 'border-sky-400 bg-sky-950/40 ring-2 ring-sky-500/30'
          : 'border-sky-700/60 bg-zinc-900/90 hover:border-sky-500'
      }`}
    >
      {/* Handle superior de entrada (Target) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-zinc-800 !border-2 !border-sky-400 hover:!scale-125 !transition-transform"
      />

      {/* Handle izquierdo */}
      <Handle
        type="target"
        id="left"
        position={Position.Left}
        className="!w-2 !h-2 !bg-zinc-800 !border-2 !border-sky-400/80 hover:!scale-125 !transition-transform"
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
          className="bg-transparent text-zinc-100 text-xs font-mono font-medium text-center outline-none w-full border-b border-sky-400/50"
        />
      ) : (
        <span className="text-xs font-mono font-medium text-zinc-200 block break-words">
          {text}
        </span>
      )}

      {/* Handle derecho */}
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className="!w-2 !h-2 !bg-zinc-800 !border-2 !border-sky-400/80 hover:!scale-125 !transition-transform"
      />

      {/* Handle inferior de salida (Source) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-zinc-800 !border-2 !border-sky-400 hover:!scale-125 !transition-transform"
      />
    </div>
  );
};
