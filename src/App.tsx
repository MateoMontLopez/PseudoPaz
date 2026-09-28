import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/layout/Header';
import { IDELayout } from './components/layout/IDELayout';
import { CodeEditor } from './components/editor/CodeEditor';
import { VirtualConsole } from './components/console/VirtualConsole';
import { FlowchartCanvas } from './components/flowchart/FlowchartCanvas';
import { AppMode } from './components/layout/ModeSwitch';
import { ExportPdfModal } from './components/pdf/ExportPdfModal';
import { usePseudocodeRunner } from './hooks/usePseudocodeRunner';
import { useSessionGuard } from './hooks/useSessionGuard';
import { usePdfExporter } from './hooks/usePdfExporter';
import { AlertTriangle, X } from 'lucide-react';

const INITIAL_CODE = `Algoritmo SinTitulo
  
FinAlgoritmo
`;

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('code');
  const [code, setCode] = useState<string>(INITIAL_CODE);

  const flowchartContainerRef = useRef<HTMLDivElement | null>(null);

  // Hook del motor Web Worker
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

  // Callback de borrado efímero de sesión cuando se pierde el foco en Modo Examen
  const handleSessionReset = useCallback(() => {
    stop();
    setCode('Algoritmo SinTitulo\n  \nFinAlgoritmo\n');
    clearConsole();
  }, [stop, clearConsole]);

  // Hook de seguridad de sesión
  const { isGuardEnabled, toggleGuard, toastMessage, clearToast } = useSessionGuard({
    onSessionReset: handleSessionReset,
    initialEnabled: false, // Inicia en Modo Práctica por defecto para no frustrar el testing, con toggle en Header
  });

  // Hook del exportador de PDF
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

  const handleRun = () => {
    if (!code.trim()) return;
    run(code);
  };

  const handleClearEditor = () => {
    setCode('Algoritmo SinTitulo\n  \nFinAlgoritmo\n');
    clearConsole();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans">
      {/* Barra Superior */}
      <Header
        mode={mode}
        onModeChange={setMode}
        status={status}
        isGuardEnabled={isGuardEnabled}
        onRun={handleRun}
        onStop={stop}
        onClearEditor={handleClearEditor}
        onToggleGuard={toggleGuard}
        onOpenExportModal={openExportModal}
      />

      {/* Toast minimalista de pérdida de foco */}
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

      {/* Contenedor de Vistas:
          Mantenemos FlowchartCanvas montado en el DOM con renderizado condicional o posicionamiento offscreen
          para permitir capturas PNG de alta resolución incluso desde la pestaña de Pseudocódigo */}
      <div className="flex-1 w-full relative overflow-hidden">
        {/* Vista Editor de Pseudocódigo */}
        <div className={`w-full h-full ${mode === 'code' ? 'flex' : 'hidden'}`}>
          <IDELayout
            onRunShortcut={handleRun}
            editor={
              <CodeEditor
                value={code}
                onChange={setCode}
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
          />
        </div>

        {/* Vista Diagrama de Flujo (DFD) */}
        <div
          ref={flowchartContainerRef}
          className={`w-full h-full ${mode === 'flowchart' ? 'block' : 'opacity-0 pointer-events-none fixed -left-[9999px] w-[1280px] h-[800px]'}`}
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
