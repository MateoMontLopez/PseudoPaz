import React, { useState, useRef, useEffect } from 'react';
import { NodeProps, Node, useReactFlow } from '@xyflow/react';
import { FlowchartNodeData } from './nodeTypes';
import { NodeHandles } from './NodeHandles';

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
      style={{ background: 'transparent' }}
      className={`relative group px-6 py-2.5 rounded-full border transition-all duration-150 select-none shadow-md min-w-[125px] text-center cursor-pointer ${
        selected
          ? 'border-emerald-400 bg-emerald-950/40 ring-2 ring-emerald-500/30'
          : 'border-emerald-600/70 bg-zinc-900/90 hover:border-emerald-500'
      }`}
    >
      {/* 4 Handles Source y 4 Handles Target (Top, Bottom, Left, Right) */}
      <NodeHandles
        color="#34d399"
        topOffset={{ target: '40%', source: '60%' }}
        bottomOffset={{ target: '40%', source: '60%' }}
        leftOffset={{ target: '35%', source: '65%' }}
        rightOffset={{ target: '35%', source: '65%' }}
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
    </div>
  );
};
