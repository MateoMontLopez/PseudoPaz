import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput } from '@codemirror/language';
import { pseudocodeLanguage, pseudocodeTheme } from './pseudocodeLanguage';
import { useClipboardGuard } from './useClipboardGuard';
import { Code2, ShieldAlert } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  isClipboardGuardEnabled?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  isClipboardGuardEnabled = true,
}) => {
  const editorParentRef = useRef<HTMLDivElement | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  const { containerRef, warningMessage } = useClipboardGuard({
    enabled: isClipboardGuardEnabled,
  });

  // Inicializar CodeMirror 6
  useEffect(() => {
    if (!editorParentRef.current) return;

    const startState = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        bracketMatching(),
        indentOnInput(),
        pseudocodeLanguage,
        pseudocodeTheme,
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%',
            backgroundColor: '#09090b',
          },
          '.cm-content': {
            caretColor: '#38bdf8',
            fontFamily: "'JetBrains Mono', Consolas, monospace",
          },
          '&.cm-focused .cm-cursor': {
            borderLeftColor: '#38bdf8',
          },
          '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
            backgroundColor: 'rgba(56, 189, 248, 0.2) !important',
          },
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorParentRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
  }, []); // Montaje inicial

  // Sincronizar valor externo (por ejemplo cuando se reinicia por pérdida de foco)
  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (value !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
    }
  }, [value]);

  const lineCount = value.split('\n').length;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-full w-full bg-[#09090b] border-r border-zinc-800/80 overflow-hidden select-text"
    >
      {/* Barra superior de pestañas/información del editor */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/60 border-b border-zinc-800/80 select-none">
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-mono font-medium text-zinc-300">algoritmo.psc</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-zinc-500 font-mono">
          <span>{lineCount} {lineCount === 1 ? 'línea' : 'líneas'}</span>
          <span className="text-zinc-700">|</span>
          <span>UTF-8</span>
          {isClipboardGuardEnabled && (
            <>
              <span className="text-zinc-700">|</span>
              <span className="text-amber-500/90 flex items-center gap-1" title="Pegado y clic derecho bloqueados">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Anti-Paste
              </span>
            </>
          )}
        </div>
      </div>

      {/* Contenedor del Editor CodeMirror */}
      <div ref={editorParentRef} className="flex-1 w-full overflow-hidden" />

      {/* Banner de advertencia de Clipboard Guard */}
      {warningMessage && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-md text-xs shadow-lg backdrop-blur-md animate-in fade-in zoom-in duration-150">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{warningMessage}</span>
        </div>
      )}
    </div>
  );
};
