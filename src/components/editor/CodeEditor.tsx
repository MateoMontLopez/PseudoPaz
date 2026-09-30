import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
} from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput } from '@codemirror/language';
import { autocompletion } from '@codemirror/autocomplete';
import { pseudocodeLanguage, pseudocodeTheme } from './pseudocodeLanguage';
import { pseudocodeCompletionSource } from './pseudocodeAutocomplete';
import { useClipboardGuard } from './useClipboardGuard';
import { ShieldAlert } from 'lucide-react';

export interface CodeEditorHandle {
  insertSnippet: (snippet: string) => void;
  focus: () => void;
  getEditorView: () => EditorView | null;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  filename?: string;
  isClipboardGuardEnabled?: boolean;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  (
    {
      value,
      onChange,
      filename = 'algoritmo.psc',
      isClipboardGuardEnabled = true,
    },
    ref
  ) => {
    const editorParentRef = useRef<HTMLDivElement | null>(null);
    const editorViewRef = useRef<EditorView | null>(null);
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

    const { containerRef, warningMessage } = useClipboardGuard({
      enabled: isClipboardGuardEnabled,
    });

    // Inserción de plantilla o fragmento de código en la posición actual del cursor
    const insertSnippet = useCallback((snippet: string) => {
      const view = editorViewRef.current;
      if (!view) return;

      const mainSel = view.state.selection.main;
      const cleanSnippet = snippet.replace(/\\n/g, '\n');

      view.dispatch({
        changes: {
          from: mainSel.from,
          to: mainSel.to,
          insert: cleanSnippet,
        },
        selection: {
          anchor: mainSel.from + cleanSnippet.length,
        },
        scrollIntoView: true,
      });

      view.focus();
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        insertSnippet,
        focus: () => {
          editorViewRef.current?.focus();
        },
        getEditorView: () => editorViewRef.current,
      }),
      [insertSnippet]
    );

    // Inicializar CodeMirror 6
    useEffect(() => {
      if (!editorParentRef.current) return;

      const domEventHandlers = EditorView.domEventHandlers({
        paste(event) {
          if (isClipboardGuardEnabled) {
            event.preventDefault();
            event.stopPropagation();
            return true;
          }
          return false;
        },
        drop(event) {
          if (isClipboardGuardEnabled) {
            event.preventDefault();
            event.stopPropagation();
            return true;
          }
          return false;
        },
        contextmenu(event) {
          if (isClipboardGuardEnabled) {
            event.preventDefault();
            event.stopPropagation();
            return true;
          }
          return false;
        },
      });

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
          autocompletion({
            override: [pseudocodeCompletionSource],
            defaultKeymap: true,
            maxRenderedOptions: 10,
          }),
          keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
          domEventHandlers,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString());
            }

            // Actualizar número de fila y columna del cursor
            const head = update.state.selection.main.head;
            const line = update.state.doc.lineAt(head);
            setCursorPos({
              line: line.number,
              col: head - line.from + 1,
            });
          }),
          EditorView.theme({
            '&': {
              height: '100%',
              backgroundColor: 'var(--cm-bg)',
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
            '.cm-tooltip-autocomplete': {
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              color: 'var(--text-primary)',
            },
            '.cm-tooltip-autocomplete ul li[aria-selected]': {
              backgroundColor: 'var(--bg-hover)',
              color: '#38bdf8',
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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        className="relative flex flex-col h-full w-full bg-[var(--cm-bg)] overflow-hidden select-text transition-colors duration-150"
      >
        {/* Barra superior de información del editor */}
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-[var(--bg-surface-subtle)] border-b border-[var(--border-color)] select-none text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-[var(--text-muted)] font-mono text-[11px]">workspace /</span>
            <span className="font-mono font-medium text-[var(--text-primary)] text-xs">{filename}</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-[var(--text-muted)] font-mono">
            <span>
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
            <span className="text-[var(--border-color)]">|</span>
            <span>
              {lineCount} {lineCount === 1 ? 'línea' : 'líneas'}
            </span>
            <span className="text-[var(--border-color)]">|</span>
            <span>UTF-8</span>
            {isClipboardGuardEnabled && (
              <>
                <span className="text-[var(--border-color)]">|</span>
                <span
                  className="text-amber-500 dark:text-amber-400/90 flex items-center gap-1.5"
                  title="Pegado, arrastre y menú contextual bloqueados con fines pedagógicos"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400"></span>
                  Anti-Paste
                </span>
              </>
            )}
          </div>
        </div>

        {/* Contenedor del Editor CodeMirror */}
        <div ref={editorParentRef} className="flex-1 w-full overflow-hidden" />

        {/* Banner de advertencia si intenta pegar o abrir menú contextual */}
        {warningMessage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 px-3.5 py-2 bg-amber-500/15 border border-amber-500/40 text-amber-300 rounded-md text-xs shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-150">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">{warningMessage}</span>
          </div>
        )}
      </div>
    );
  }
);

CodeEditor.displayName = 'CodeEditor';
