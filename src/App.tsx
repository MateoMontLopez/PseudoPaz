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
import { LandingPage } from './components/landing/LandingPage';
import { HashAuditor } from './components/audit/HashAuditor';
import { PinModal } from './components/auth/PinModal';
import {
  WorkspaceFile,
  loadStoredFiles,
  saveStoredFiles,
} from './types/workspace';
import { useThemeProvider, ThemeContext } from './hooks/useTheme';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export type PageRoute = 'landing' | 'ide' | 'hash';

function getInitialRoute(): PageRoute {
  if (typeof window === 'undefined') return 'landing';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (path === '/hash' || path === '/audit' || hash === '#hash' || hash === '#audit') {
    return 'hash';
  }
  if (path === '/ide' || hash === '#ide') {
    return 'ide';
  }
  return 'landing';
}

export const App: React.FC = () => {
  const themeValue = useThemeProvider();

  // Enrutamiento principal de la aplicación
  const [currentRoute, setCurrentRoute] = useState<PageRoute>(getInitialRoute);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(() => {
    return (
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem('pseudopaz_teacher_auth') === 'true'
    );
  });

  const navigateTo = useCallback(
    (route: PageRoute) => {
      if (route === 'hash' && !isTeacherAuthenticated) {
        setIsPinModalOpen(true);
        return;
      }

      setCurrentRoute(route);
      const targetPath = route === 'landing' ? '/' : `/${route}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ route }, '', targetPath);
      }
    },
    [isTeacherAuthenticated]
  );

  // Manejar navegación con botones Atrás/Adelante del navegador
  useEffect(() => {
    const handlePopState = () => {
      const route = getInitialRoute();
      if (route === 'hash' && !isTeacherAuthenticated) {
        setIsPinModalOpen(true);
      } else {
        setCurrentRoute(route);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isTeacherAuthenticated]);

  // Si intentó ingresar directamente a /hash por URL sin estar autenticado, abrir PIN
  useEffect(() => {
    if (currentRoute === 'hash' && !isTeacherAuthenticated) {
      setIsPinModalOpen(true);
    }
  }, [currentRoute, isTeacherAuthenticated]);

  // Atajo de teclado global Ctrl + Shift + A para abrir el auditor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        navigateTo('hash');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateTo]);

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

  // Hook del motor de ejecución Web Worker con recolección de basura y timeout de 10s
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

  // Hook de seguridad de sesión (Modo Examen estricto vs Modo Práctica)
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

  // Estado para toast de confirmación de reinicio de motor
  const [resetToastMessage, setResetToastMessage] = useState<string | null>(null);
  const resetToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showResetToast = useCallback((msg: string) => {
    setResetToastMessage(msg);
    if (resetToastTimeoutRef.current) clearTimeout(resetToastTimeoutRef.current);
    resetToastTimeoutRef.current = setTimeout(() => {
      setResetToastMessage(null);
    }, 3200);
  }, []);

  // Manejador de Reinicio / Recarga del IDE (Soft & Hard Reset)
  const handleResetIDE = useCallback(
    async (event: React.MouseEvent) => {
      // B. Hard Reset (Shift + Clic - Recarga Forzada de PWA):
      if (event.shiftKey) {
        if ('caches' in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
          } catch (err) {
            console.warn('[PWA] Error limpiando caches:', err);
          }
        }
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((r) => r.unregister()));
          } catch (err) {
            console.warn('[PWA] Error desregistrando service workers:', err);
          }
        }
        window.location.reload();
        return;
      }

      // A. Soft Reset (Clic Normal - Reinicio de Motor en Caliente):
      // 1 & 2. Destruir sesión del worker y reinstanciar limpio
      stop();
      // 3 & 4. Limpiar consola I/O, cancelar Leer y poner en IDLE
      clearConsole();
      // 5. Preservar intacto el código del usuario en el editor y el archivo activo (no se altera activeFile)
      // 6. Mostrar notificación discreta
      showResetToast('Motor de ejecución reiniciado correctamente');
    },
    [stop, clearConsole, showResetToast]
  );

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
    <ThemeContext.Provider value={themeValue}>
      {/* Modal de Autenticación Docente (PIN) */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          if (currentRoute === 'hash') {
            navigateTo('landing');
          }
        }}
        onSuccess={() => {
          setIsTeacherAuthenticated(true);
          setIsPinModalOpen(false);
          setCurrentRoute('hash');
          if (window.location.pathname !== '/hash') {
            window.history.pushState({ route: 'hash' }, '', '/hash');
          }
        }}
      />

      {/* Vista 1: Landing Page de Bienvenida */}
      {currentRoute === 'landing' ? (
        <LandingPage
          onEnterIDE={() => navigateTo('ide')}
          onOpenAuditor={() => navigateTo('hash')}
        />
      ) : currentRoute === 'hash' && isTeacherAuthenticated ? (
        /* Vista 2: Auditor Anti-Plagio y Verificador SHA-256 */
        <HashAuditor
          onBackToIDE={() => navigateTo('ide')}
          onGoHome={() => navigateTo('landing')}
        />
      ) : (
        /* Vista 3: Entorno IDE de Pseudocódigo y Diagramas de Flujo */
        <div className="flex flex-col h-screen w-screen bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden font-sans transition-colors duration-150">
          {/* Zona 1: Header Principal Unificado */}
          <Header
            mode={mode}
            onModeChange={setMode}
            status={status}
            isGuardEnabled={isGuardEnabled}
            onRun={handleRun}
            onStop={stop}
            onResetIDE={handleResetIDE}
            onToggleGuard={toggleGuard}
            onOpenExportModal={openExportModal}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            isGuideOpen={isGuideOpen}
            onToggleGuide={() => setIsGuideOpen((prev) => !prev)}
            onGoHome={() => navigateTo('landing')}
            onOpenAuditor={() => navigateTo('hash')}
          />

          {/* Toast flotante de pérdida de foco en Modo Examen */}
          {toastMessage && (
            <div className="fixed top-14 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-rose-950/90 border border-rose-600/40 text-rose-200 rounded-md shadow-2xl text-xs backdrop-blur-md animate-in slide-from-top-2 duration-200">
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

          {/* Toast de confirmación de Soft Reset del motor */}
          {resetToastMessage && (
            <div className="fixed top-14 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-emerald-950/90 border border-emerald-600/40 text-emerald-200 rounded-md shadow-2xl text-xs backdrop-blur-md animate-in slide-from-top-2 duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{resetToastMessage}</span>
              <button
                onClick={() => setResetToastMessage(null)}
                className="p-1 text-emerald-400 hover:text-emerald-100 hover:bg-emerald-900/50 rounded transition-colors"
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
              <FlowchartCanvas
                isExamMode={isGuardEnabled}
                onRunCode={run}
                onStop={stop}
                status={status}
                outputs={outputs}
                inputPrompt={inputPrompt}
                executionTimeMs={executionTimeMs}
                onProvideInput={provideInput}
                onClearConsole={clearConsole}
              />
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
      )}
    </ThemeContext.Provider>
  );
};

export default App;
