import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { IDELayout } from './components/layout/IDELayout';
import { FileExplorer } from './components/sidebar/FileExplorer';
import { EditorTabs } from './components/editor/EditorTabs';
import { CodeEditor, CodeEditorHandle } from './components/editor/CodeEditor';
import { VirtualConsole } from './components/console/VirtualConsole';
import { SyntaxGuideDrawer } from './components/syntax/SyntaxGuideDrawer';
import { FlowchartCanvas } from './components/flowchart/FlowchartCanvas';
import { AppMode } from './components/layout/ModeSwitch';
import { ExportPdfModal } from './components/pdf/ExportPdfModal';
import { usePseudocodeRunner } from './hooks/usePseudocodeRunner';
import { useSessionGuard } from './hooks/useSessionGuard';
import { usePdfExporter } from './hooks/usePdfExporter';
import {
  WorkspaceFile,
  loadStoredFiles,
  saveStoredFiles,
} from './types/workspace';
import { AlertTriangle, X } from 'lucide-react';

export const App: React.FC = () => {
  // Estado de modo principal: 'code' (Editor) o 'flowchart' (DFD React Flow)
  const [mode, setMode] = useState<AppMode>('code');

  // Estado del sistema de archivos y pestañas
  const [files, setFiles] = useState<WorkspaceFile[]>(() => loadStoredFiles());
  const [openFileIds, setOpenFileIds] = useState<string[]>(() => {
    const stored = loadStoredFiles();
    return stored.length > 0 ? [stored[0].id] : [];
  });
  const [activeFileId, setActiveFileId] = useState<string>(() => {
    const stored = loadStoredFiles();
    return stored.length > 0 ? stored[0].id : '';
  });

  // Estado de visibilidad de paneles colapsables
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Referencias a componentes para interacciones imperativas
  const codeEditorRef = useRef<CodeEditorHandle | null>(null);
  const flowchartContainerRef = useRef<HTMLDivElement | null>(null);

  // Archivo actualmente activo
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];
  const code = activeFile ? activeFile.content : '';

  // Actualizar contenido del archivo activo y persistir
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setFiles((prevFiles) => {
        const updated = prevFiles.map((file) =>
          file.id === activeFileId ? { ...file, content: newCode } : file
        );
        saveStoredFiles(updated);
        return updated;
      });
    },
    [activeFileId]
  );

  // Hook del motor de ejecución Web Worker
  const {
    status,
    outputs,
    inputPrompt,
    executionTimeMs,
    run,
    stop,
    provideInput,
    clearConsole,
  } = usePseudocodeRunner();

  // Callback de reseteo de seguridad en Modo Examen por pérdida de foco
  const handleSessionReset = useCallback(() => {
    stop();
    const resetTemplate = `Algoritmo SinTitulo\n  \nFinAlgoritmo\n`;
    handleCodeChange(resetTemplate);
    clearConsole();
  }, [stop, handleCodeChange, clearConsole]);

  // Hook de seguridad de sesión (Modo Examen)
  const { isGuardEnabled, toggleGuard, toastMessage, clearToast } = useSessionGuard({
    onSessionReset: handleSessionReset,
    initialEnabled: false,
  });

  // Hook del exportador a PDF protegido con SHA-256
  const {
    isModalOpen,
    openExportModal,
    closeExportModal,
    executeExport,
  } = usePdfExporter({
    code,
    outputs,
    getFlowchartElement: () => flowchartContainerRef.current,
  });

  // Ejecutar el archivo activo
  const handleRun = useCallback(() => {
    if (!code.trim()) return;
    run(code);
  }, [code, run]);

  // Selección de archivo desde el explorador
  const handleSelectFile = useCallback(
    (fileId: string) => {
      setActiveFileId(fileId);
      if (!openFileIds.includes(fileId)) {
        setOpenFileIds((prev) => [...prev, fileId]);
      }
    },
    [openFileIds]
  );

  // Crear nuevo archivo .psc
  const handleCreateFile = useCallback((fileName: string) => {
    const id = `file_${Date.now()}`;
    const initialContent = `Algoritmo ${fileName.replace(/\.psc$/i, '')}\n    // Escribe tu código aquí\n    \nFinAlgoritmo\n`;
    const newFile: WorkspaceFile = {
      id,
      name: fileName,
      content: initialContent,
    };

    setFiles((prev) => {
      const updated = [...prev, newFile];
      saveStoredFiles(updated);
      return updated;
    });
    setOpenFileIds((prev) => [...prev, id]);
    setActiveFileId(id);
  }, []);

  // Eliminar archivo
  const handleDeleteFile = useCallback(
    (fileId: string) => {
      if (files.length <= 1) return;

      setFiles((prev) => {
        const updated = prev.filter((f) => f.id !== fileId);
        saveStoredFiles(updated);
        return updated;
      });

      setOpenFileIds((prev) => prev.filter((id) => id !== fileId));

      if (activeFileId === fileId) {
        const remaining = files.filter((f) => f.id !== fileId);
        if (remaining.length > 0) {
          setActiveFileId(remaining[0].id);
        }
      }
    },
    [files, activeFileId]
  );

  // Cerrar pestaña
  const handleCloseTab = useCallback(
    (fileId: string) => {
      if (openFileIds.length <= 1) return;

      const newOpenTabs = openFileIds.filter((id) => id !== fileId);
      setOpenFileIds(newOpenTabs);

      if (activeFileId === fileId) {
        setActiveFileId(newOpenTabs[newOpenTabs.length - 1]);
      }
    },
    [openFileIds, activeFileId]
  );

  // Inserción de plantilla de sintaxis desde el Drawer hacia CodeMirror
  const handleInsertSnippet = useCallback((snippet: string) => {
    if (codeEditorRef.current) {
      codeEditorRef.current.insertSnippet(snippet);
    }
  }, []);

  // Asegurar que activeFileId sea válido si cambian los archivos
  useEffect(() => {
    if (files.length > 0 && (!activeFileId || !files.some((f) => f.id === activeFileId))) {
      setActiveFileId(files[0].id);
      if (!openFileIds.includes(files[0].id)) {
        setOpenFileIds((prev) => [...prev, files[0].id]);
      }
    }
  }, [files, activeFileId, openFileIds]);

  const openFiles = files.filter((f) => openFileIds.includes(f.id));

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      {/* Zona 1: Header Principal Unificado */}
      <Header
        mode={mode}
        onModeChange={setMode}
        status={status}
        isGuardEnabled={isGuardEnabled}
        onRun={handleRun}
        onStop={stop}
        onToggleGuard={toggleGuard}
        onOpenExportModal={openExportModal}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isGuideOpen={isGuideOpen}
        onToggleGuide={() => setIsGuideOpen((prev) => !prev)}
      />

      {/* Toast flotante de pérdida de foco en Modo Examen */}
      {toastMessage && (
        <div className="fixed top-14 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-rose-950/90 border border-rose-600/40 text-rose-200 rounded-md shadow-2xl text-xs backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
          <button
            onClick={clearToast}
            className="p-1 text-rose-400 hover:text-rose-100 hover:bg-rose-900/50 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Contenedor Principal: Vistas Conmutables */}
      <div className="flex-1 w-full relative overflow-hidden">
        {/* Vista Editor de Pseudocódigo (Multi-Tab + Editor + Consola I/O + Sintaxis) */}
        <div className={`w-full h-full ${mode === 'code' ? 'flex' : 'hidden'}`}>
          <IDELayout
            onRunShortcut={handleRun}
            sidebar={
              <FileExplorer
                files={files}
                activeFileId={activeFileId}
                onSelectFile={handleSelectFile}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen((prev) => !prev)}
              />
            }
            tabs={
              <EditorTabs
                openFiles={openFiles}
                activeFileId={activeFileId}
                onSelectTab={setActiveFileId}
                onCloseTab={handleCloseTab}
                onNewFile={() => {
                  const defaultName = `algoritmo_${files.length + 1}.psc`;
                  handleCreateFile(defaultName);
                }}
              />
            }
            editor={
              <CodeEditor
                ref={codeEditorRef}
                value={code}
                filename={activeFile?.name}
                onChange={handleCodeChange}
                isClipboardGuardEnabled={true}
              />
            }
            consolePanel={
              <VirtualConsole
                outputs={outputs}
                status={status}
                inputPrompt={inputPrompt}
                executionTimeMs={executionTimeMs}
                onProvideInput={provideInput}
                onClearConsole={clearConsole}
              />
            }
            syntaxGuide={
              <SyntaxGuideDrawer
                isOpen={isGuideOpen}
                onClose={() => setIsGuideOpen(false)}
                onInsertSnippet={handleInsertSnippet}
              />
            }
          />
        </div>

        {/* Vista Diagrama de Flujo (DFD) con React Flow
            Mantenemos el contenedor disponible para permitir capturas con html-to-image
            incluso cuando el usuario está en la vista de Pseudocódigo */}
        <div
          ref={flowchartContainerRef}
          className={`w-full h-full ${
            mode === 'flowchart'
              ? 'block'
              : 'opacity-0 pointer-events-none fixed -left-[9999px] w-[1280px] h-[800px]'
          }`}
        >
          <FlowchartCanvas isExamMode={isGuardEnabled} />
        </div>
      </div>

      {/* Modal de Exportación a PDF con Certificación Criptográfica */}
      <ExportPdfModal
        isOpen={isModalOpen}
        onClose={closeExportModal}
        onConfirmExport={executeExport}
        code={code}
      />
    </div>
  );
};

export default App;
