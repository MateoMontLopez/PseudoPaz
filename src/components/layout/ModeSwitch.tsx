import React from 'react';
import { Code2, GitFork } from 'lucide-react';

export type AppMode = 'code' | 'flowchart';

interface ModeSwitchProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

export const ModeSwitch: React.FC<ModeSwitchProps> = ({ mode, onModeChange }) => {
  return (
    <div className="flex items-center p-0.5 bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] rounded-md select-none font-mono text-xs transition-colors">
      <button
        onClick={() => onModeChange('code')}
        className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all cursor-pointer ${
          mode === 'code'
            ? 'bg-[var(--bg-active)] text-sky-500 dark:text-sky-400 font-semibold shadow-xs'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        title="Modo Editor de Pseudocódigo y Consola"
      >
        <Code2 className="w-3.5 h-3.5" />
        <span className="font-sans text-xs">Pseudocódigo</span>
      </button>

      <button
        onClick={() => onModeChange('flowchart')}
        className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all cursor-pointer ${
          mode === 'flowchart'
            ? 'bg-[var(--bg-active)] text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        title="Modo Diagrama de Flujo (DFD) Independiente"
      >
        <GitFork className="w-3.5 h-3.5 rotate-90" />
        <span className="font-sans text-xs">Diagrama DFD</span>
      </button>
    </div>
  );
};
