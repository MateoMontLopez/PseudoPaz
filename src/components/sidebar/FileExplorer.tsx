import React, { useState } from 'react';
import { WorkspaceFile } from '../../types/workspace';
import { FileCode2, Plus, Trash2, FolderGit2, X, Check } from 'lucide-react';

interface FileExplorerProps {
  files: WorkspaceFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCreateFile: (fileName: string) => void;
  onDeleteFile: (fileId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  isOpen,
  onToggle,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewFileName('');
    setErrorMessage(null);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewFileName('');
    setErrorMessage(null);
  };

  const handleConfirmCreate = () => {
    let name = newFileName.trim();
    if (!name) {
      setErrorMessage('Ingresa un nombre');
      return;
    }

    if (!name.endsWith('.psc')) {
      name = `${name}.psc`;
    }

    // Comprobar si ya existe
    if (files.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
      setErrorMessage('Ya existe ese archivo');
      return;
    }

    onCreateFile(name);
    setIsCreating(false);
    setNewFileName('');
    setErrorMessage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmCreate();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelCreate();
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="w-56 h-full bg-[#0d1017] border-r border-zinc-800/80 flex flex-col select-none text-zinc-300 font-sans shrink-0 transition-all duration-150">
      {/* Cabecera del Explorador */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/40 text-[11px] font-bold tracking-wider text-zinc-400">
        <div className="flex items-center space-x-1.5 text-zinc-300">
          <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
          <span>EXPLORADOR</span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={handleStartCreate}
            title="Nuevo archivo de pseudocódigo (.psc)"
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-sky-300 rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggle}
            title="Cerrar panel del explorador"
            className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Input de creación de archivo nuevo */}
      {isCreating && (
        <div className="p-2 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center space-x-1 bg-zinc-950 border border-sky-500/60 rounded px-1.5 py-1">
            <FileCode2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="nombre.psc"
              autoFocus
              className="w-full bg-transparent text-xs text-zinc-100 outline-none font-mono"
            />
            <button
              onClick={handleConfirmCreate}
              className="p-0.5 hover:bg-zinc-800 text-emerald-400 rounded"
              title="Crear"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={handleCancelCreate}
              className="p-0.5 hover:bg-zinc-800 text-zinc-400 rounded"
              title="Cancelar"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          {errorMessage && (
            <p className="text-[10px] text-rose-400 mt-1 pl-1">{errorMessage}</p>
          )}
        </div>
      )}

      {/* Lista de archivos */}
      <div className="flex-1 overflow-y-auto py-1">
        <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          Archivos del Algoritmo
        </div>
        <div className="space-y-0.5">
          {files.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <div
                key={file.id}
                onClick={() => onSelectFile(file.id)}
                className={`group flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer transition-colors border-l-2 ${
                  isActive
                    ? 'bg-zinc-800/80 text-sky-300 border-sky-400 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileCode2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-sky-400' : 'text-zinc-500 group-hover:text-zinc-400'
                    }`}
                  />
                  <span className="truncate font-mono text-[11.5px]">{file.name}</span>
                </div>

                {files.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.id);
                    }}
                    title={`Eliminar ${file.name}`}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700/60 text-zinc-500 hover:text-rose-400 rounded transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer del explorador */}
      <div className="p-2.5 border-t border-zinc-800/80 text-[10px] text-zinc-500 flex items-center space-x-2 bg-zinc-950/20">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span className="truncate">Espacio de trabajo local (.psc)</span>
      </div>
    </aside>
  );
};
