# PseudoPaz — IDE de Pseudocódigo y Diagramas de Flujo (PWA)

IDE moderno, ligero y minimalista para el aprendizaje de lógica de programación y pseudocódigo en español, con ejecución 100% Client-Side en Web Workers, diagramación gráfica DFD independiente y guardias de seguridad académica.

---

## 🚀 Características Principales

- **Compilación e Interpretación en Web Worker:**
  - Pipeline completo: `Lexer -> Parser -> Interpreter`.
  - Sin dependencias de servidor ni bloqueo del hilo principal (UI fluida a 60 FPS).
  - Guardián de ejecución (Timeout 3000 ms) contra bucles infinitos.
- **UI Minimalista (Single-Screen / SaaS Clean):**
  - Editor CodeMirror 6 con tema Zinc oscuro y resaltado en español.
  - Consola virtual tipo shell con prompt interactivo de entrada (`Leer`).
  - Split Pane ajustable entre editor y consola.
  - Inicio limpio: el editor inicia con la plantilla mínima (`Algoritmo SinTitulo ... FinAlgoritmo`).
- **Módulo Independiente de Diagramas de Flujo (DFD):**
  - Lienzo vectorial interactivo basado en React Flow con Zoom, Pan y Snap to Grid.
  - Símbolos ANSI estándar: Terminal (Óvalo), Proceso (Rectángulo), Entrada/Salida (Paralelogramo) y Decisión (Rombo con salidas automáticas `Sí` y `No`).
  - Edición inline mediante doble clic sobre cualquier figura.
  - Inicio limpio: el lienzo DFD inicia completamente vacío listo para diagramar.
  - **100% Independiente:** No existe traducción automática código <-> diagrama para estimular el razonamiento lógico del estudiante.
- **Guardias de Seguridad Académica:**
  - **Clipboard Guard:** Deshabilita copiar, pegar, arrastrar y clic derecho en el editor para exigir digitación manual.
  - **Session & Focus Guard:** Borrado efímero de código, consola y diagramas si el estudiante cambia de pestaña o ventana en Modo Examen.

---

## 📖 Guía de Sintaxis de Pseudocódigo

El motor de PseudoPaz está diseñado en español con tipado estático y evaluación estricta en tiempo de ejecución.

### 1. Estructura Básica de un Programa
Todo algoritmo debe iniciar con la palabra clave `Algoritmo` seguida de su nombre y concluir con `FinAlgoritmo`:

```pseudocode
Algoritmo MiPrimerAlgoritmo
  // Instrucciones del programa aquí
FinAlgoritmo
```

*(Las palabras clave son insensibles a mayúsculas/minúsculas: `Algoritmo`, `algoritmo`, `ALGORITMO` son válidas).*

---

### 2. Declaración de Variables y Tipos de Datos

Las variables se pueden declarar en una sección `Var` al inicio del algoritmo o en línea con la palabra `Definir`:

```pseudocode
Var
  edad, contador: entero;
  salario, promedio: decimal;
  nombre, ciudad: cadena;
  letra: caracter;
  esMayor: booleano;
```

O también:
```pseudocode
Definir x, y Como Entero;
Definir mensaje Como Cadena;
```

#### Tipos de Datos Soportados:
| Tipo | Equivalente | Descripción | Ejemplos |
|---|---|---|---|
| `entero` | `Entero` | Números enteros sin decimales | `0`, `42`, `-10` |
| `decimal` | `real`, `Real` | Números reales con coma/punto flotante | `3.14`, `-0.75`, `10.0` |
| `cadena` | `texto`, `Texto` | Texto entre comillas dobles o simples | `"Hola"`, `'UNIPAZ'` |
| `caracter` | `Caracter` | Un único carácter | `'A'`, `"Z"`, `'1'` |
| `booleano` | `logico`, `Logico` | Valores de verdad | `Verdadero`, `Falso`, `true`, `false` |

> **Nota:** El motor realiza comprobación estricta de tipos. Asignar un valor decimal a una variable entera o un texto a un booleano arrojará un error descriptivo en la consola.

---

### 3. Asignación y Operadores

Para asignar un valor a una variable se utiliza el operador flecha `<-` (o el signo `=`):

```pseudocode
x <- 10;
nombre <- "Carlos";
esActivo <- Verdadero;
```

#### Operadores Disponibles:
- **Aritméticos:**
  - `+` : Suma numérica o concatenación de cadenas (`"Total: " + total`).
  - `-` : Resta y negación unaria (`-5`).
  - `*` : Multiplicación.
  - `/` : División real (valida división por cero).
  - `%` o `MOD` : Módulo o residuo de la división entera.
  - `^` : Potencia (`2 ^ 3` es 8).
- **Relacionales (Comparación):**
  - `=` o `==` : Igual que.
  - `<>` o `!=` : Distinto / No igual que.
  - `<` : Menor que.
  - `<=` : Menor o igual que.
  - `>` : Mayor que.
  - `>=` : Mayor o igual que.
- **Lógicos (Booleanos):**
  - `Y` o `&&` : Conjunción lógica (AND con cortocircuito).
  - `O` o `||` : Disyunción lógica (OR con cortocircuito).
  - `NO` o `!` : Negación lógica (NOT).

---

### 4. Entrada y Salida (I/O)

- **`Mostrar` o `Escribir`:** Imprime valores en la consola virtual. Puedes separar múltiples expresiones con comas `,`:
  ```pseudocode
  Mostrar "Hola,", nombre, "tu edad es:", edad;
  ```
- **`Leer`:** Pausa asíncronamente la ejecución y despliega un campo de entrada interactivo con auto-foco en la consola virtual:
  ```pseudocode
  Mostrar "Ingrese su edad:";
  Leer edad;
  ```

---

### 5. Estructuras de Control

#### A. Condicional `Si - Entonces - Sino - FinSi`
```pseudocode
Si edad >= 18 Entonces
  Mostrar "Es mayor de edad.";
Sino
  Mostrar "Es menor de edad.";
FinSi
```

#### B. Bucle `Mientras - Hacer - FinMientras`
Se ejecuta mientras la condición booleana sea verdadera:
```pseudocode
Mientras contador < 5 Hacer
  Mostrar "Iteración:", contador;
  contador <- contador + 1;
FinMientras
```

#### C. Bucle `Para - Hasta - Con Paso - FinPara`
Itera una variable desde un valor inicial hasta un valor final. La cláusula `Con Paso` es opcional (por defecto es 1):
```pseudocode
Para i <- 1 Hasta 10 Con Paso 2 Hacer
  Mostrar "Número impar:", i;
FinPara
```

---

## 💡 Ejemplo Completo Guiado

A continuación se muestra un algoritmo completo que integra declaración estricta de variables, lectura interactiva con `Leer`, bucle `Para`, condicional `Si-Entonces-Sino` y formateo de salida:

```pseudocode
Algoritmo ControlCalificaciones
  // 1. Declaración de variables
  Var
    nombre: cadena;
    numMaterias, i: entero;
    nota, suma, promedio: decimal;
    aprobado: booleano;

  // 2. Encabezado e interacción con el usuario
  Mostrar "======================================";
  Mostrar "    SISTEMA DE CONTROL DE NOTAS       ";
  Mostrar "======================================";

  Mostrar "¿Cuál es el nombre del estudiante?";
  Leer nombre;

  Mostrar "¿Cuántas materias desea promediar?";
  Leer numMaterias;

  // 3. Acumulación de notas mediante bucle Para
  suma <- 0.0;
  Para i <- 1 Hasta numMaterias Hacer
    Mostrar "Ingrese la nota de la materia #", i, ":";
    Leer nota;
    suma <- suma + nota;
  FinPara

  // 4. Cálculo del promedio y estado
  promedio <- suma / numMaterias;
  aprobado <- promedio >= 3.0;

  // 5. Impresión de resultados
  Mostrar "--------------------------------------";
  Mostrar "Estudiante:", nombre;
  Mostrar "Materias evaluadas:", numMaterias;
  Mostrar "Promedio general:", promedio;

  Si aprobado Entonces
    Mostrar "Resultado final: ¡APROBADO! Excelente trabajo.";
  Sino
    Mostrar "Resultado final: REPROBADO. Debe presentar habilitación.";
  FinSi

  Mostrar "======================================";
FinAlgoritmo
```

---

## 📁 Estructura del Proyecto

```text
src/
├── engine/                # Motor de compilación e interpretación (Fase 1)
│   ├── lexer/             # Analizador Léxico y Tokens
│   ├── parser/            # AST y Analizador Sintáctico Descendente Recursivo
│   ├── interpreter/       # Tabla de Símbolos (Environment) y Evaluador
│   └── worker/            # Web Worker Sandbox y ExecutionController (Timeout 3000ms)
├── components/            # Componentes de la Interfaz (Fases 2 y 3)
│   ├── layout/            # Header, ModeSwitch e IDELayout (Splitter ajustable)
│   ├── editor/            # CodeEditor (CodeMirror 6) y useClipboardGuard
│   ├── console/           # VirtualConsole (Terminal I/O) y ConsoleInput
│   └── flowchart/         # Módulo DFD (React Flow Canvas, Símbolos ANSI y Toolbar)
│       └── nodes/         # TerminalNode, ProcessNode, IONode, DecisionNode
├── hooks/                 # usePseudocodeRunner y useSessionGuard
├── App.tsx                # Orquestador de la aplicación
└── main.tsx               # Entrada de React
```

---

## 🛠️ Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción (Vite + Web Worker)
npm run build

# Ejecutar pruebas unitarias (Vitest)
npm test

# Verificar tipos estrictos de TypeScript
npm run typecheck

# Ejecutar demostración interactiva en terminal Node
npm run demo
```
