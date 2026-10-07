import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface NodeHandlesProps {
  color?: string; // color hexadecimal o clase
  topOffset?: { target: string; source: string };
  bottomOffset?: { target: string; source: string };
  leftOffset?: { target: string; source: string };
  rightOffset?: { target: string; source: string };
  customIds?: {
    topTarget?: string;
    topSource?: string;
    bottomTarget?: string;
    bottomSource?: string;
    leftTarget?: string;
    leftSource?: string;
    rightTarget?: string;
    rightSource?: string;
  };
}

export const NodeHandles: React.FC<NodeHandlesProps> = ({
  color = '#38bdf8',
  topOffset = { target: '40%', source: '60%' },
  bottomOffset = { target: '40%', source: '60%' },
  leftOffset = { target: '40%', source: '60%' },
  rightOffset = { target: '40%', source: '60%' },
  customIds = {},
}) => {
  const commonStyle = (borderColor: string, isSource: boolean) => ({
    width: '9px',
    height: '9px',
    backgroundColor: isSource ? borderColor : '#18181b',
    border: `2px solid ${borderColor}`,
    transition: 'transform 0.15s ease, background-color 0.15s ease',
    zIndex: 10,
  });

  return (
    <>
      {/* 1. BORDE SUPERIOR (TOP): Target y Source */}
      <Handle
        type="target"
        id={customIds.topTarget || 'top-target'}
        position={Position.Top}
        isConnectable={true}
        style={{
          ...commonStyle(color, false),
          left: topOffset.target,
        }}
        className="hover:!scale-130 !cursor-crosshair"
        title="Conexión entrante (Top Target)"
      />
      <Handle
        type="source"
        id={customIds.topSource || 'top-source'}
        position={Position.Top}
        isConnectable={true}
        style={{
          ...commonStyle(color, true),
          left: topOffset.source,
        }}
        className="hover:!scale-130 !cursor-crosshair"
        title="Conexión saliente (Top Source)"
      />

      {/* 2. BORDE INFERIOR (BOTTOM): Target y Source */}
      <Handle
        type="target"
        id={customIds.bottomTarget || 'bottom-target'}
        position={Position.Bottom}
        isConnectable={true}
        style={{
          ...commonStyle(color, false),
          left: bottomOffset.target,
        }}
        className="hover:!scale-130 !cursor-crosshair"
        title="Conexión entrante (Bottom Target)"
      />
      <Handle
        type="source"
        id={customIds.bottomSource || 'bottom-source'}
        position={Position.Bottom}
        isConnectable={true}
        style={{
          ...commonStyle(color, true),
          left: bottomOffset.source,
        }}
        className="hover:!scale-130 !cursor-crosshair"
        title="Conexión saliente (Bottom Source)"
      />

      {/* 3. BORDE IZQUIERDO (LEFT): Target y Source */}
      <Handle
        type="target"
        id={customIds.leftTarget || 'left-target'}
        position={Position.Left}
        isConnectable={true}
        style={{
          ...commonStyle(color, false),
          top: leftOffset.target,
        }}
        className="hover:!scale-130 !cursor-crosshair"
        title="Conexión entrante (Left Target)"
      />
      <Handle
        type="source"
        id={customIds.leftSource || 'left-source'}
        position={Position.Left}
        isConnectable={true}
        style={{
          ...commonStyle(color, true),
          top: leftOffset.source,
        }}
        className="hover:!scale-130 !cursor-crosshair"
        title="Conexión saliente (Left Source)"
      />

      {/* 4. BORDE DERECHO (RIGHT): Target y Source */}
      <Handle
        type="target"
        id={customIds.rightTarget || 'right-target'}
        position={Position.Right}
        isConnectable={true}
        style={{
          ...commonStyle(color, false),
          top: rightOffset.target,
        }}
        className="hover:!scale-130 !cursor-crosshair"
        title="Conexión entrante (Right Target)"
      />
      <Handle
        type="source"
        id={customIds.rightSource || 'right-source'}
        position={Position.Right}
        isConnectable={true}
        style={{
          ...commonStyle(color, true),
          top: rightOffset.source,
        }}
        className="hover:!scale-130 !cursor-crosshair"
        title="Conexión saliente (Right Source)"
      />
    </>
  );
};
