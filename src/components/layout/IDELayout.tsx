import React, { useState, useCallback, useEffect, useRef } from 'react';

interface IDELayoutProps {
  sidebar?: React.ReactNode;
  tabs?: React.ReactNode;
  editor: React.ReactNode;
  consolePanel: React.ReactNode;
  syntaxGuide?: React.ReactNode;
  onRunShortcut?: () => void;
}

export const IDELayout: React.FC<IDELayoutProps> = ({
  sidebar,
  tabs,
  editor,
  consolePanel,
  syntaxGuide,
  onRunShortcut,
}) => {
  const [splitRatio, setSplitRatio] = useState<number>(55); // 55% editor, 45% consola por defecto
  const isDraggingRef = useRef<boolean>(false);
  const centralContainerRef = useRef<HTMLDivElement | null>(null);

  // Atajos globales: Ctrl+Enter o F5 para ejecutar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (((e.ctrlKey || e.metaKey) && e.key === 'Enter') || e.key === 'F5') {
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
      if (!isDraggingRef.current || !centralContainerRef.current) return;

      const rect = centralContainerRef.current.getBoundingClientRect();
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
    setSplitRatio(50);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-row overflow-hidden relative">
      {/* Zona 2: Panel Izquierdo: Explorador de Archivos (Sidebar colapsable) */}
      {sidebar}

      {/* Zona 3 y Zona 4: Área Central con Pestañas + Split Pane (Editor / Consola) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Barra superior de pestañas del editor */}
        {tabs}

        {/* Contenedor flexible de división: Editor (Izquierda) + Consola I/O (Derecha) */}
        <div ref={centralContainerRef} className="flex-1 flex flex-row min-h-0 overflow-hidden relative">
          {/* Zona 3: Editor de Código */}
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
            className="w-1.5 hover:w-2 -mx-0.5 z-10 h-full bg-[var(--bg-app)] hover:bg-sky-500/50 active:bg-sky-500 cursor-col-resize transition-all flex items-center justify-center group shrink-0 border-x border-[var(--border-color)]"
          >
            <div className="w-[1px] h-8 bg-[var(--border-color)] group-hover:bg-sky-400 group-active:bg-sky-300 rounded"></div>
          </div>

          {/* Zona 4: Consola Virtual (I/O) */}
          <div
            style={{ width: `${100 - splitRatio}%` }}
            className="h-full flex flex-col overflow-hidden transition-all duration-75"
          >
            {consolePanel}
          </div>
        </div>
      </div>

      {/* Zona 4 (Complemento): Panel Desplegable de Guía de Sintaxis Rápida (Drawer) */}
      {syntaxGuide}
    </div>
  );
};
