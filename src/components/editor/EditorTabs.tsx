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
    <div className="h-9 bg-[#0b0d13] border-b border-zinc-800/80 flex items-stretch select-none overflow-x-auto scrollbar-none">
      <div className="flex items-stretch min-w-0">
        {openFiles.map((file) => {
          const isActive = file.id === activeFileId;
          return (
            <div
              key={file.id}
              onClick={() => onSelectTab(file.id)}
              className={`group relative flex items-center space-x-2 px-3.5 border-r border-zinc-800/60 text-xs cursor-pointer transition-colors whitespace-nowrap min-w-[120px] max-w-[200px] ${
                isActive
                  ? 'bg-[#141824] text-zinc-100 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#11151e]'
              }`}
            >
              {/* Línea indicadora activa superior o inferior */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-400" />
              )}

              <FileCode2
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? 'text-sky-400' : 'text-zinc-500 group-hover:text-zinc-400'
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
                  className="ml-auto p-0.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60 opacity-60 group-hover:opacity-100 transition-opacity"
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
        className="px-2.5 flex items-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
