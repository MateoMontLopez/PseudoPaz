import React, { useState, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { IDELayout } from './components/layout/IDELayout';
import { CodeEditor } from './components/editor/CodeEditor';
import { VirtualConsole } from './components/console/VirtualConsole';
import { FlowchartCanvas } from './components/flowchart/FlowchartCanvas';
import { AppMode } from './components/layout/ModeSwitch';
import { usePseudocodeRunner } from './hooks/usePseudocodeRunner';
import { useSessionGuard } from './hooks/useSessionGuard';
import { AlertTriangle, X } from 'lucide-react';

const INITIAL_CODE = `Algoritmo SumaInteractiva
  // Declaración de variables
  Var
    limite, suma, i: entero;
    nombre: cadena;

  Mostrar "====================================";
  Mostrar "   BIENVENIDO A PSEUDOPAZ IDE       ";
  Mostrar "====================================";

  Mostrar "¿Cuál es tu nombre?";
  Leer nombre;
  Mostrar "¡Hola,", nombre, "! Vamos a calcular una suma acumulada.";

  Mostrar "¿Hasta qué número entero deseas sumar?";
  Leer limite;

  suma <- 0;
  Para i <- 1 Hasta limite Hacer
    suma <- suma + i;
  FinPara

  Mostrar "------------------------------------";
  Mostrar "La sumatoria total de 1 a", limite, "es:", suma;
  Mostrar "¡Ejecución terminada exitosamente!";
FinAlgoritmo
`;

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('code');
  const [code, setCode] = useState<string>(INITIAL_CODE);

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
    setCode('// Sesión borrada por pérdida de foco\n');
    clearConsole();
  }, [stop, clearConsole]);

  // Hook de seguridad de sesión
  const { isGuardEnabled, toggleGuard, toastMessage, clearToast } = useSessionGuard({
    onSessionReset: handleSessionReset,
    initialEnabled: false, // Inicia en Modo Práctica por defecto para no frustrar el testing, con toggle en Header
  });

  const handleRun = () => {
    if (!code.trim()) return;
    run(code);
  };

  const handleClearEditor = () => {
    setCode('');
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

      {/* Vista condicional según el modo seleccionado */}
      {mode === 'code' ? (
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
      ) : (
        <main className="flex-1 w-full h-[calc(100vh-48px)] overflow-hidden">
          <FlowchartCanvas isExamMode={isGuardEnabled} />
        </main>
      )}
    </div>
  );
};

export default App;
