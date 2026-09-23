# PseudoPaz — IDE de Pseudocódigo Client-Side (PWA)

IDE moderno, ligero y minimalista para el aprendizaje de lógica de programación y pseudocódigo en español, con ejecución 100% Client-Side en Web Workers y guardias de seguridad académica.

## 🚀 Características

- **Compilación e Interpretación en Web Worker:**
  - Pipeline completo: `Lexer -> Parser -> Interpreter`.
  - Sin dependencias de servidor ni bloqueo del hilo principal (UI fluida a 60 FPS).
  - Guardián de ejecución (Timeout 3000 ms) contra bucles infinitos.
- **Sintaxis en Español Completa:**
  - Estructura: `Algoritmo`, `FinAlgoritmo`, `Var`, `Definir ... Como`.
  - Tipos: `entero`, `decimal`, `cadena`, `caracter`, `booleano`.
  - Control: `Si-Entonces-Sino-FinSi`, `Mientras-Hacer-FinMientras`, `Para-Hasta-Con Paso-FinPara`.
  - I/O: `Leer` (asíncrono interactivo) y `Mostrar`.
  - Operadores: `<-`, `=`, `+`, `-`, `*`, `/`, `%` (`MOD`), `^`, `>`, `<`, `>=`, `<=`, `<>`, `Y`, `O`, `NO`.
- **UI Minimalista (Single-Screen / SaaS Clean):**
  - Editor CodeMirror 6 con tema Zinc oscuro y resaltado en español.
  - Consola virtual tipo shell con prompt interactivo de entrada.
  - Split Pane ajustable entre editor y consola.
- **Guardias de Seguridad Académica:**
  - **Clipboard Guard:** Deshabilita copiar, pegar, arrastrar y clic derecho en el editor para exigir digitación manual.
  - **Session & Focus Guard:** Borrado efímero de código y consola si el estudiante cambia de pestaña o ventana en Modo Examen.

## 📁 Estructura del Proyecto

```text
src/
├── engine/                # Core Engine (Fase 1)
│   ├── lexer/             # Analizador Léxico y tokens
│   ├── parser/            # AST y Analizador Sintáctico
│   ├── interpreter/       # Tabla de símbolos (Environment) y Evaluador
│   └── worker/            # Web Worker y ExecutionController
├── components/            # UI Components (Fase 2)
│   ├── layout/            # Header e IDELayout (Split Pane)
│   ├── editor/            # CodeEditor (CodeMirror 6) y useClipboardGuard
│   └── console/           # VirtualConsole y ConsoleInput
├── hooks/                 # usePseudocodeRunner y useSessionGuard
├── App.tsx
└── main.tsx
```

## 🛠️ Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar pruebas unitarias
npm test

# Verificar tipos estrictos TypeScript
npm run typecheck
```
