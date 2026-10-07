import React, { useEffect, useRef, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput } from '@codemirror/language';
import { pseudocodeLanguage, pseudocodeTheme } from './pseudocodeLanguage';
import { useClipboardGuard } from './useClipboardGuard';
import { WorkspaceFile } from '../../hooks/useWorkspaceStore';
import { Code2, ShieldAlert, Plus, X } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  files?: WorkspaceFile[];
  activeFileId?: string;
  onSwitchFile?: (fileId: string) => void;
  onCreateFile?: () => void;
  onCloseFile?: (fileId: string) => void;
  isClipboardGuardEnabled?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  files,
  activeFileId,
  onSwitchFile,
  onCreateFile,
  onCloseFile,
  isClipboardGuardEnabled = true,
}) => {
  const editorParentRef = useRef<HTMLDivElement | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  // Inserción segura de texto en el cursor al autorizar pegado interno
  const handlePasteInternal = useCallback((textToInsert: string) => {
    const view = editorViewRef.current;
    if (!view) return;

    view.dispatch(view.state.replaceSelection(textToInsert));
    view.focus();
  }, []);

  const { containerRef, warningMessage } = useClipboardGuard({
    enabled: isClipboardGuardEnabled,
    onPasteInternal: handlePasteInternal,
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

  // Sincronizar valor externo cuando cambia el archivo activo o por reseteo
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
      {/* Barra superior de pestañas del espacio de trabajo (Multi-Tab) */}
      <div className="flex items-center justify-between px-2 bg-zinc-900/80 border-b border-zinc-800/80 select-none overflow-x-auto no-scrollbar">
        {/* Lista de pestañas */}
        <div className="flex items-center space-x-1 py-1">
          {files && files.length > 0 ? (
            files.map((file) => {
              const isActive = file.id === activeFileId;
              return (
                <div
                  key={file.id}
                  onClick={() => onSwitchFile?.(file.id)}
                  className={`group flex items-center space-x-1.5 px-3 py-1.5 rounded-t-md text-xs font-mono transition-colors cursor-pointer border-t-2 ${
                    isActive
                      ? 'bg-[#09090b] text-sky-400 border-sky-500 font-medium'
                      : 'bg-zinc-900/40 text-zinc-400 border-transparent hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                >
                  <Code2 className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-zinc-500'}`} />
                  <span className="truncate max-w-[120px]">{file.name}</span>

                  {/* Botón de cerrar pestaña si hay más de 1 */}
                  {files.length > 1 && onCloseFile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseFile(file.id);
                      }}
                      title="Cerrar pestaña"
                      className="opacity-0 group-hover:opacity-100 p-0.5 ml-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1.5 text-xs font-mono font-medium text-sky-400 border-t-2 border-sky-500 bg-[#09090b]">
              <Code2 className="w-4 h-4 text-sky-400" />
              <span>Trabajo1.psc</span>
            </div>
          )}

          {/* Botón para añadir nueva pestaña */}
          {onCreateFile && (
            <button
              onClick={onCreateFile}
              title="Nueva pestaña (.psc)"
              className="flex items-center justify-center p-1.5 ml-1 text-zinc-400 hover:text-sky-400 hover:bg-zinc-800/60 rounded transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Metadatos e indicador de seguridad */}
        <div className="hidden sm:flex items-center space-x-3 text-[11px] text-zinc-500 font-mono pr-2">
          <span>{lineCount} {lineCount === 1 ? 'línea' : 'líneas'}</span>
          <span className="text-zinc-700">|</span>
          <span>UTF-8</span>
          {isClipboardGuardEnabled && (
            <>
              <span className="text-zinc-700">|</span>
              <span className="text-amber-500/90 flex items-center gap-1" title="Pegado externo bloqueado en esta sesión">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Internal Guard
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
