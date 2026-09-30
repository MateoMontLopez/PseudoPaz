import React from 'react';
import { BookOpen, X, CornerDownLeft, Sparkles } from 'lucide-react';

interface SyntaxGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSnippet: (snippet: string) => void;
}

interface SyntaxItem {
  id: string;
  name: string;
  description: string;
  category: 'structure' | 'control' | 'io';
  code: string;
  badgeColor: string;
}

const SYNTAX_ITEMS: SyntaxItem[] = [
  // Estructura principal
  {
    id: 'algoritmo',
    name: 'ALGORITMO',
    description: 'Bloque maestro del algoritmo',
    category: 'structure',
    badgeColor: 'bg-sky-500',
    code: `Algoritmo NombreAlgoritmo
    // Definir variables
    Definir x Como Entero
    
    // Instrucciones
    
FinAlgoritmo
`,
  },
  {
    id: 'definir',
    name: 'DEFINIR VARIABLE',
    description: 'Declaración estática de tipo',
    category: 'structure',
    badgeColor: 'bg-emerald-400',
    code: `Definir variable Como Entero
`,
  },

  // Control de flujo
  {
    id: 'si_entonces',
    name: 'SI / ENTONCES',
    description: 'Bifurcación condicional alternativa',
    category: 'control',
    badgeColor: 'bg-purple-400',
    code: `Si condicion Entonces
    // instrucciones si es verdadero
Sino
    // instrucciones si es falso
FinSi
`,
  },
  {
    id: 'mientras',
    name: 'MIENTRAS',
    description: 'Bucle con evaluación al inicio',
    category: 'control',
    badgeColor: 'bg-purple-400',
    code: `Mientras condicion Hacer
    // instrucciones
FinMientras
`,
  },
  {
    id: 'para_hasta',
    name: 'PARA / HASTA',
    description: 'Bucle con contador determinado',
    category: 'control',
    badgeColor: 'bg-purple-400',
    code: `Para i <- 1 Hasta limite Con Paso 1 Hacer
    // instrucciones
FinPara
`,
  },
  {
    id: 'repetir',
    name: 'REPETIR / HASTA QUE',
    description: 'Bucle con evaluación al final',
    category: 'control',
    badgeColor: 'bg-purple-400',
    code: `Repetir
    // instrucciones
Hasta Que condicion
`,
  },

  // Entrada y Salida (I/O)
  {
    id: 'leer',
    name: 'LEER variable',
    description: 'Capturar dato desde la consola',
    category: 'io',
    badgeColor: 'bg-amber-400',
    code: `Leer variable
`,
  },
  {
    id: 'escribir',
    name: 'ESCRIBIR mensaje',
    description: 'Imprimir texto o valor en pantalla',
    category: 'io',
    badgeColor: 'bg-amber-400',
    code: `Escribir "Mensaje: ", variable
`,
  },
  {
    id: 'asignacion',
    name: 'ASIGNACIÓN (<-)',
    description: 'Asignar expresión a variable',
    category: 'io',
    badgeColor: 'bg-rose-400',
    code: `variable <- valor
`,
  },
];

export const SyntaxGuideDrawer: React.FC<SyntaxGuideDrawerProps> = ({
  isOpen,
  onClose,
  onInsertSnippet,
}) => {
  if (!isOpen) return null;

  return (
    <aside className="w-72 h-full bg-[#0d1017] border-l border-zinc-800/80 flex flex-col select-none text-zinc-300 font-sans shrink-0 transition-all duration-150 animate-in slide-in-from-right-4">
      {/* Cabecera del Panel de Guía */}
      <div className="h-10 px-3.5 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/40 text-[11px] font-bold tracking-wider text-zinc-400">
        <div className="flex items-center space-x-1.5 text-zinc-300">
          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
          <span>GUÍA DE SINTAXIS</span>
        </div>

        <button
          onClick={onClose}
          title="Cerrar panel de guía"
          className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Introducción rápida */}
      <div className="p-3 border-b border-zinc-800/60 bg-zinc-900/30">
        <div className="flex items-center space-x-1.5 text-[10px] text-sky-400 font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-3 h-3" />
          <span>REFERENCIA RÁPIDA</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Haz clic en cualquier bloque para insertar la plantilla en el cursor del editor.
        </p>
      </div>

      {/* Lista de Tarjetas de Sintaxis con Scroll */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Sección: Estructura Principal */}
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>Estructura Principal</span>
          </div>
          <div className="space-y-2">
            {SYNTAX_ITEMS.filter((i) => i.category === 'structure').map((item) => (
              <button
                key={item.id}
                onClick={() => onInsertSnippet(item.code)}
                className="w-full text-left p-2.5 rounded-md bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-sky-500/40 transition-all group cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-sky-400 group-hover:text-sky-300">
                    {item.name}
                  </span>
                  <CornerDownLeft className="w-3 h-3 text-zinc-600 group-hover:text-sky-400 transition-colors" />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">{item.description}</p>
                <pre className="mt-1.5 p-1.5 bg-zinc-950/80 rounded text-[9.5px] font-mono text-zinc-400 group-hover:text-zinc-300 overflow-x-hidden line-clamp-3">
                  {item.code.trim()}
                </pre>
              </button>
            ))}
          </div>
        </div>

        {/* Sección: Control de Flujo */}
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Control de Flujo</span>
          </div>
          <div className="space-y-2">
            {SYNTAX_ITEMS.filter((i) => i.category === 'control').map((item) => (
              <button
                key={item.id}
                onClick={() => onInsertSnippet(item.code)}
                className="w-full text-left p-2.5 rounded-md bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-purple-500/40 transition-all group cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-purple-400 group-hover:text-purple-300">
                    {item.name}
                  </span>
                  <CornerDownLeft className="w-3 h-3 text-zinc-600 group-hover:text-purple-400 transition-colors" />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">{item.description}</p>
                <pre className="mt-1.5 p-1.5 bg-zinc-950/80 rounded text-[9.5px] font-mono text-zinc-400 group-hover:text-zinc-300 overflow-x-hidden line-clamp-3">
                  {item.code.trim()}
                </pre>
              </button>
            ))}
          </div>
        </div>

        {/* Sección: Entrada y Salida */}
        <div>
          <div className="flex items-center space-x-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Entrada y Salida (I/O)</span>
          </div>
          <div className="space-y-2">
            {SYNTAX_ITEMS.filter((i) => i.category === 'io').map((item) => (
              <button
                key={item.id}
                onClick={() => onInsertSnippet(item.code)}
                className="w-full text-left p-2.5 rounded-md bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-amber-500/40 transition-all group cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-amber-400 group-hover:text-amber-300">
                    {item.name}
                  </span>
                  <CornerDownLeft className="w-3 h-3 text-zinc-600 group-hover:text-amber-400 transition-colors" />
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">{item.description}</p>
                <pre className="mt-1.5 p-1.5 bg-zinc-950/80 rounded text-[9.5px] font-mono text-zinc-400 group-hover:text-zinc-300 overflow-x-hidden line-clamp-2">
                  {item.code.trim()}
                </pre>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
