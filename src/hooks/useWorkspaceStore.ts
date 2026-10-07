import { useState, useCallback, useMemo } from 'react';

export interface WorkspaceFile {
  id: string;
  name: string;
  content: string; // Se actualiza en cada onChange del editor
}

export const DEFAULT_ALGORITHM_TEMPLATE = `Algoritmo SinTitulo
  
FinAlgoritmo
`;

const INITIAL_FILES: WorkspaceFile[] = [
  {
    id: 'file-1',
    name: 'Trabajo1.psc',
    content: DEFAULT_ALGORITHM_TEMPLATE,
  },
];

/**
 * Hook de gestión de archivos y pestañas del espacio de trabajo (Multi-tab Workspace Store):
 * - Mantiene el estado en tiempo real de cada archivo en memoria.
 * - Evita que el código de una pestaña se borre al conmutar a otra en Modo Práctica.
 * - Permite crear, cerrar y alternar entre múltiples pestañas (.psc).
 * - Provee función de reseteo total para Modo Examen cuando se produce una infracción de seguridad.
 */
export function useWorkspaceStore(initialFiles: WorkspaceFile[] = INITIAL_FILES) {
  const [files, setFiles] = useState<WorkspaceFile[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState<string>(initialFiles[0]?.id || 'file-1');

  // Obtener el archivo actualmente activo
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || files[0] || {
      id: 'fallback',
      name: 'Trabajo1.psc',
      content: DEFAULT_ALGORITHM_TEMPLATE,
    };
  }, [files, activeFileId]);

  // Actualizar el contenido del archivo activo en tiempo real
  const updateActiveFileContent = useCallback((newContent: string) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === activeFileId ? { ...file, content: newContent } : file
      )
    );
  }, [activeFileId]);

  // Cambiar de pestaña guardando la integridad de cada archivo
  const switchFile = useCallback((targetFileId: string) => {
    setActiveFileId(targetFileId);
  }, []);

  // Crear una nueva pestaña / archivo de trabajo
  const createFile = useCallback((customName?: string, customContent?: string): string => {
    const newId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    setFiles((prevFiles) => {
      const nextNumber = prevFiles.length + 1;
      const fileName = customName || `Trabajo${nextNumber}.psc`;
      const fileContent = customContent !== undefined ? customContent : DEFAULT_ALGORITHM_TEMPLATE;

      const newFile: WorkspaceFile = {
        id: newId,
        name: fileName,
        content: fileContent,
      };

      return [...prevFiles, newFile];
    });

    setActiveFileId(newId);
    return newId;
  }, []);

  // Cerrar una pestaña (evita cerrar si es la única abierta)
  const closeFile = useCallback((fileIdToClose: string) => {
    setFiles((prevFiles) => {
      if (prevFiles.length <= 1) {
        // Si es la única pestaña, reiniciar su contenido al template inicial
        return [
          {
            id: prevFiles[0]?.id || 'file-1',
            name: 'Trabajo1.psc',
            content: DEFAULT_ALGORITHM_TEMPLATE,
          },
        ];
      }

      const fileIndex = prevFiles.findIndex((f) => f.id === fileIdToClose);
      const filtered = prevFiles.filter((f) => f.id !== fileIdToClose);

      // Si se cerró la pestaña activa, activar una adyacente
      if (fileIdToClose === activeFileId) {
        const nextActiveIndex = Math.max(0, fileIndex - 1);
        const nextActiveFile = filtered[nextActiveIndex] || filtered[0];
        if (nextActiveFile) {
          setActiveFileId(nextActiveFile.id);
        }
      }

      return filtered;
    });
  }, [activeFileId]);

  // Renombrar archivo
  const renameFile = useCallback((fileId: string, newName: string) => {
    if (!newName.trim()) return;
    setFiles((prevFiles) =>
      prevFiles.map((file) =>
        file.id === fileId ? { ...file, name: newName.trim() } : file
      )
    );
  }, []);

  // Limpiar el contenido del archivo activo
  const resetActiveFileContent = useCallback(() => {
    updateActiveFileContent(DEFAULT_ALGORITHM_TEMPLATE);
  }, [updateActiveFileContent]);

  // Reseteo total de seguridad para Modo Examen
  const resetWorkspace = useCallback(() => {
    const defaultFile: WorkspaceFile = {
      id: 'file-1',
      name: 'Trabajo1.psc',
      content: DEFAULT_ALGORITHM_TEMPLATE,
    };
    setFiles([defaultFile]);
    setActiveFileId('file-1');
  }, []);

  return {
    files,
    activeFileId,
    activeFile,
    updateActiveFileContent,
    switchFile,
    createFile,
    closeFile,
    renameFile,
    resetActiveFileContent,
    resetWorkspace,
  };
}
