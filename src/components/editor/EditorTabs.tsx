import React from 'react';
import { WorkspaceFile } from '../../types/workspace';
import { FileCode2, X, Plus } from 'lucide-react';

interface EditorTabsProps {
  openFiles: WorkspaceFile[];
  activeFileId: string;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  onNewFile: () => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  openFiles,
  activeFileId,
  onSelectTab,
  onCloseTab,
  onNewFile,
}) => {
  return (
    <div className="h-9 bg-[var(--bg-surface-subtle)] border-b border-[var(--border-color)] flex items-stretch select-none overflow-x-auto scrollbar-none transition-colors duration-150">
      <div className="flex items-stretch min-w-0">
        {openFiles.map((file) => {
          const isActive = file.id === activeFileId;
          return (
            <div
              key={file.id}
              onClick={() => onSelectTab(file.id)}
              className={`group relative flex items-center space-x-2 px-3.5 border-r border-[var(--border-color)] text-xs cursor-pointer transition-colors whitespace-nowrap min-w-[120px] max-w-[200px] ${
                isActive
                  ? 'bg-[var(--bg-app)] text-[var(--text-primary)] font-medium'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {/* Línea indicadora activa superior o inferior */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-500 dark:bg-sky-400" />
              )}

              <FileCode2
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? 'text-sky-500 dark:text-sky-400' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                }`}
              />

              <span className="truncate font-mono text-[11.5px]">{file.name}</span>

              {openFiles.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(file.id);
                  }}
                  title={`Cerrar ${file.name}`}
                  className="ml-auto p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] opacity-60 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onNewFile}
        title="Crear nuevo archivo .psc"
        className="px-2.5 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
