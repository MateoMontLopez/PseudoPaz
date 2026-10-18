import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { PLATFORM_NAME, PLATFORM_VERSION } from '../../constants/platform';

interface IDELayoutProps {
  sidebar?: React.ReactNode;
  tabs?: React.ReactNode;
  editor: React.ReactNode;
  consolePanel: React.ReactNode;
  syntaxGuide?: React.ReactNode;
  onRunShortcut?: () => void;
  isTerminalVisible?: boolean;
  onToggleTerminal?: () => void;
  terminalOutputCount?: number;
  isExecutionRunning?: boolean;
}

export const IDELayout: React.FC<IDELayoutProps> = ({
  sidebar,
  tabs,
  editor,
  consolePanel,
  syntaxGuide,
  onRunShortcut,
  isTerminalVisible = true,
  onToggleTerminal,
  terminalOutputCount = 0,
  isExecutionRunning = false,
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
    <div className="flex-1 w-full h-full flex flex-col overflow-hidden relative">
      <div className="flex-1 w-full min-h-0 flex flex-row overflow-hidden relative">
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
              style={{ width: isTerminalVisible ? `${splitRatio}%` : '100%' }}
              className="h-full flex flex-col overflow-hidden transition-all duration-75"
            >
              {editor}
            </div>

            {/* Divisor ajustable (Splitter) */}
            {isTerminalVisible && (
              <div
                onMouseDown={handleMouseDown}
                onDoubleClick={handleDoubleClick}
                title="Arrastra para redimensionar (doble clic para centrar 50/50)"
                className="w-1.5 hover:w-2 -mx-0.5 z-10 h-full bg-[var(--bg-app)] hover:bg-sky-500/50 active:bg-sky-500 cursor-col-resize transition-all flex items-center justify-center group shrink-0 border-x border-[var(--border-color)]"
              >
                <div className="w-[1px] h-8 bg-[var(--border-color)] group-hover:bg-sky-400 group-active:bg-sky-300 rounded"></div>
              </div>
            )}

            {/* Zona 4: Consola Virtual (I/O) - Se retiene en el DOM para preservar logs e interactividad */}
            <div
              style={{ width: isTerminalVisible ? `${100 - splitRatio}%` : '0%' }}
              className={`h-full flex flex-col overflow-hidden transition-all duration-75 ${
                isTerminalVisible ? 'flex' : 'hidden'
              }`}
            >
              {consolePanel}
            </div>
          </div>
        </div>

        {/* Zona 4 (Complemento): Panel Desplegable de Guía de Sintaxis Rápida (Drawer) */}
        {syntaxGuide}
      </div>

      {/* Footer / Barra de Estado del IDE con Número de Versión y Acceso a Terminal */}
      <footer className="h-6 w-full bg-[var(--bg-surface-subtle)] border-t border-[var(--border-color)] px-3 flex items-center justify-between text-[10.5px] font-mono text-[var(--text-muted)] select-none shrink-0 z-10">
        <div className="flex items-center space-x-3">
          {onToggleTerminal && (
            <button
              onClick={onToggleTerminal}
              title={isTerminalVisible ? 'Minimizar / Ocultar panel de terminal' : 'Mostrar panel de terminal'}
              className={`flex items-center space-x-1.5 px-2 py-0.5 rounded transition-all cursor-pointer border ${
                isTerminalVisible
                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 font-semibold'
                  : 'bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border-[var(--border-color)] hover:border-sky-500/30'
              }`}
            >
              <Terminal className="w-3 h-3 text-sky-500 dark:text-sky-400" />
              <span>{isTerminalVisible ? 'Ocultar Terminal' : 'Mostrar Terminal'}</span>
              {terminalOutputCount > 0 && (
                <span className="px-1 py-0.2 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 text-[9px] font-mono font-bold">
                  {terminalOutputCount}
                </span>
              )}
              {isExecutionRunning && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping ml-0.5" />
              )}
            </button>
          )}

          <span className="text-[var(--border-color)]">|</span>
          <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>PSeInt Base 1</span>
          </span>
          <span className="text-[var(--border-color)]">|</span>
          <span>UTF-8</span>
          <span className="text-[var(--border-color)]">|</span>
          <span>Vectores &amp; Matrices</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[var(--text-secondary)]">{PLATFORM_NAME}</span>
          <span className="px-1.5 py-0.2 rounded bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-[9.5px]">
            {PLATFORM_VERSION}
          </span>
        </div>
      </footer>
    </div>
  );
};
