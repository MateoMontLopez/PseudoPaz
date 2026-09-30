import React, { useState, useRef, useEffect } from 'react';
import { NodeProps, Node, useReactFlow } from '@xyflow/react';
import { FlowchartNodeData } from './nodeTypes';
import { NodeHandles } from './NodeHandles';

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
      style={{ background: 'transparent' }}
      className={`relative group px-5 py-3 rounded-md border transition-all duration-150 select-none shadow-md min-w-[130px] max-w-[240px] text-center cursor-pointer ${
        selected
          ? 'border-sky-400 bg-sky-950/40 ring-2 ring-sky-500/30'
          : 'border-sky-700/60 bg-zinc-900/90 hover:border-sky-500'
      }`}
    >
      {/* 4 Handles Source y 4 Handles Target (Top, Bottom, Left, Right) */}
      <NodeHandles
        color="#38bdf8"
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
          className="bg-transparent text-zinc-100 text-xs font-mono font-medium text-center outline-none w-full border-b border-sky-400/50"
        />
      ) : (
        <span className="text-xs font-mono font-medium text-zinc-200 block break-words">
          {text}
        </span>
      )}
    </div>
  );
};
