import React, { useState, useCallback, useEffect, useRef } from 'react';

interface IDELayoutProps {
  editor: React.ReactNode;
  consolePanel: React.ReactNode;
  onRunShortcut?: () => void;
}

export const IDELayout: React.FC<IDELayoutProps> = ({
  editor,
  consolePanel,
  onRunShortcut,
}) => {
  const [splitRatio, setSplitRatio] = useState<number>(55); // 55% editor, 45% consola por defecto
  const isDraggingRef = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Atajo global Ctrl+Enter para ejecutar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (onRunShortcut) onRunShortcut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRunShortcut]);

  // Manejo de redimensionamiento arrastrando la barra divisoria
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = ((moveEvent.clientX - rect.left) / rect.width) * 100;

      // Limitar entre 25% y 75%
      const clampedRatio = Math.max(25, Math.min(75, newRatio));
      setSplitRatio(clampedRatio);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleDoubleClick = () => {
    // Restablecer al 50% con doble clic en el separador
    setSplitRatio(50);
  };

  return (
    <div ref={containerRef} className="flex-1 w-full flex flex-row overflow-hidden relative">
      {/* Panel Izquierdo: Editor */}
      <div
        style={{ width: `${splitRatio}%` }}
        className="h-full flex flex-col overflow-hidden transition-all duration-75"
      >
        {editor}
      </div>

      {/* Divisor ajustable (Splitter) */}
      <div
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        title="Arrastra para redimensionar (doble clic para centrar 50/50)"
        className="w-1.5 hover:w-2 -mx-0.5 z-10 h-full bg-transparent hover:bg-sky-500/50 active:bg-sky-500 cursor-col-resize transition-all flex items-center justify-center group"
      >
        <div className="w-[1px] h-8 bg-zinc-700 group-hover:bg-sky-400 group-active:bg-sky-300 rounded"></div>
      </div>

      {/* Panel Derecho: Consola I/O */}
      <div
        style={{ width: `${100 - splitRatio}%` }}
        className="h-full flex flex-col overflow-hidden transition-all duration-75"
      >
        {consolePanel}
      </div>
    </div>
  );
};
