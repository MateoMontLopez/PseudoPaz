import React from 'react';
import {
  Maximize2,
  Trash2,
  HelpCircle,
  PlusCircle,
} from 'lucide-react';

interface SidebarToolbarProps {
  onClearCanvas: () => void;
  onFitView: () => void;
  onAddNodeClick: (type: string, label: string) => void;
}

interface SymbolItem {
  type: string;
  name: string;
  description: string;
  defaultLabel: string;
  icon: React.ReactNode;
  colorClass: string;
  badge: string;
}

const SYMBOLS: SymbolItem[] = [
  {
    type: 'terminal',
    name: 'Terminal',
    description: 'Inicio o Fin del algoritmo',
    defaultLabel: 'Inicio',
    icon: (
      <div className="w-9 h-5 rounded-full border-2 border-emerald-500 bg-emerald-950/40 flex items-center justify-center text-[10px] text-emerald-300 font-mono">
        Inicio
      </div>
    ),
    colorClass: 'border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/20 text-emerald-300',
    badge: 'Óvalo',
  },
  {
    type: 'process',
    name: 'Proceso',
    description: 'Asignaciones y cálculos',
    defaultLabel: 'x <- 10',
    icon: (
      <div className="w-9 h-6 rounded-sm border-2 border-sky-500 bg-sky-950/40 flex items-center justify-center text-[10px] text-sky-300 font-mono">
        x &lt;- 1
      </div>
    ),
    colorClass: 'border-sky-500/50 hover:border-sky-400 bg-sky-950/20 text-sky-300',
    badge: 'Rectángulo',
  },
  {
    type: 'input',
    name: 'Entrada',
    description: 'Lectura de variables (Leer)',
    defaultLabel: 'Leer variable',
    icon: (
      <div className="w-9 h-6 -skew-x-12 rounded-xs border-2 border-purple-500 bg-purple-950/40 flex items-center justify-center text-[9px] text-purple-300 font-mono">
        <span className="skew-x-12">Leer</span>
      </div>
    ),
    colorClass: 'border-purple-500/50 hover:border-purple-400 bg-purple-950/20 text-purple-300',
    badge: 'Paralelogramo',
  },
  {
    type: 'output',
    name: 'Salida / Impresión',
    description: 'Mostrar o imprimir datos (Mostrar)',
    defaultLabel: 'Mostrar resultado',
    icon: (
      <div className="w-9 h-6 flex items-center justify-center">
        <svg viewBox="0 0 36 24" className="w-9 h-6 overflow-visible">
          <path
            d="M 1 1 L 35 1 L 35 18 C 30 14, 23 14, 18 18 C 13 22, 6 22, 1 18 Z"
            fill="rgba(6, 182, 212, 0.25)"
            stroke="#06b6d4"
            strokeWidth="1.5"
          />
          <text
            x="18"
            y="11"
            fill="#67e8f9"
            fontSize="7"
            fontFamily="monospace"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            Mostrar
          </text>
        </svg>
      </div>
    ),
    colorClass: 'border-cyan-500/50 hover:border-cyan-400 bg-cyan-950/20 text-cyan-300',
    badge: 'Documento',
  },
  {
    type: 'decision',
    name: 'Decisión',
    description: 'Condición con caminos Sí / No',
    defaultLabel: '¿x > 0?',
    icon: (
      <div className="w-6 h-6 rotate-45 border-2 border-amber-500 bg-amber-950/40 flex items-center justify-center text-[8px] text-amber-300 font-mono">
        <span className="-rotate-45">?</span>
      </div>
    ),
    colorClass: 'border-amber-500/50 hover:border-amber-400 bg-amber-950/20 text-amber-300',
    badge: 'Rombo',
  },
];

export const SidebarToolbar: React.FC<SidebarToolbarProps> = ({
  onClearCanvas,
  onFitView,
  onAddNodeClick,
}) => {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, label }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col justify-between select-none transition-colors duration-150">
      {/* Sección Superior: Paleta de Figuras */}
      <div className="p-3.5 space-y-4 overflow-y-auto">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Símbolos ANSI
            </h3>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">Arrastrar o Clic</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">
            Arrastra una figura al lienzo o haz clic para agregarla.
          </p>
        </div>

        <div className="space-y-2">
          {SYMBOLS.map((sym) => (
            <div
              key={sym.type}
              draggable
              onDragStart={(e) => onDragStart(e, sym.type, sym.defaultLabel)}
              onClick={() => onAddNodeClick(sym.type, sym.defaultLabel)}
              className="group flex items-center justify-between p-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01] active:scale-95 shadow-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="shrink-0 flex items-center justify-center w-10">
                  {sym.icon}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      {sym.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] block leading-tight">
                    {sym.description}
                  </span>
                </div>
              </div>
              <PlusCircle className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        {/* Guía rápida de atajos */}
        <div className="mt-4 p-3 rounded-md bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] space-y-1.5">
          <div className="flex items-center space-x-1.5 text-[var(--text-primary)] font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span>Guía de Diagramación</span>
          </div>
          <ul className="space-y-1 text-[var(--text-secondary)] list-disc list-inside text-[10.5px]">
            <li><strong className="text-[var(--text-primary)]">Doble clic</strong> en nodo para editar texto.</li>
            <li>Arrastra desde los <strong className="text-[var(--text-primary)]">puntos</strong> para conectar.</li>
            <li>En <strong className="text-amber-500 dark:text-amber-400">Decisión</strong>: derecha = Sí, izquierda = No.</li>
            <li>Selecciona y presiona <strong className="text-[var(--text-primary)]">Supr</strong> para borrar.</li>
          </ul>
        </div>
      </div>

      {/* Sección Inferior: Controles de lienzo */}
      <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-surface-subtle)] space-y-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={onFitView}
            title="Ajustar y centrar diagrama a la vista"
            className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] rounded text-xs transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Centrar</span>
          </button>

          <button
            onClick={onClearCanvas}
            title="Borrar todo el diagrama"
            className="flex items-center justify-center space-x-1.5 py-1.5 px-2.5 bg-[var(--bg-surface)] hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 text-[var(--text-secondary)] border border-[var(--border-color)] rounded text-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>

        <div className="text-[10.5px] text-center text-[var(--text-muted)] font-mono">
          Módulo DFD Independiente
        </div>
      </div>
    </aside>
  );
};
