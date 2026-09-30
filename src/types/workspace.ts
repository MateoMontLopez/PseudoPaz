export interface WorkspaceFile {
  id: string;
  name: string;
  content: string;
  isModified?: boolean;
}

export const DEFAULT_FILES: WorkspaceFile[] = [
  {
    id: 'factorial',
    name: 'factorial.psc',
    content: `// Algoritmo para calcular el factorial de un número con validación
Algoritmo Factorial
    Definir n, fact, i Como Entero
    
    Escribir "Ingrese un número entero positivo:"
    Leer n
    
    Si n < 0 Entonces
        Escribir "Error: El número debe ser mayor o igual a 0"
    Sino
        fact <- 1
        Para i <- 1 Hasta n Con Paso 1 Hacer
            fact <- fact * i
        FinPara
        
        Escribir "El factorial es: ", fact
    FinSi
FinAlgoritmo
`,
  },
  {
    id: 'fibonacci',
    name: 'fibonacci.psc',
    content: `// Algoritmo que genera los primeros términos de la serie de Fibonacci
Algoritmo Fibonacci
    Definir a, b, temp, i Como Entero
    
    a <- 0
    b <- 1
    
    Escribir "Serie de Fibonacci (primeros 10 términos):"
    Para i <- 1 Hasta 10 Con Paso 1 Hacer
        Escribir a
        temp <- a + b
        a <- b
        b <- temp
    FinPara
FinAlgoritmo
`,
  },
  {
    id: 'promedio',
    name: 'promedio.psc',
    content: `// Algoritmo para calcular el promedio de dos calificaciones
Algoritmo PromedioNotas
    Definir nota1, nota2, promedio Como Real
    
    Escribir "Ingrese la primera nota:"
    Leer nota1
    
    Escribir "Ingrese la segunda nota:"
    Leer nota2
    
    promedio <- (nota1 + nota2) / 2
    Escribir "El promedio obtenido es: ", promedio
    
    Si promedio >= 3.0 Entonces
        Escribir "Estado: APROBADO"
    Sino
        Escribir "Estado: REPROBADO"
    FinSi
FinAlgoritmo
`,
  },
  {
    id: 'temperatura',
    name: 'temperatura.psc',
    content: `// Algoritmo para conversión de Celsius a Fahrenheit
Algoritmo CelsiusAFahrenheit
    Definir celsius, fahrenheit Como Real
    
    Escribir "Ingrese los grados Celsius:"
    Leer celsius
    
    fahrenheit <- (celsius * 9 / 5) + 32
    Escribir "Equivalente en Fahrenheit: ", fahrenheit
FinAlgoritmo
`,
  },
];

const STORAGE_KEY = 'pseudopaz_workspace_files_v1';

export function loadStoredFiles(): WorkspaceFile[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('No se pudieron recuperar los archivos almacenados:', err);
  }
  return DEFAULT_FILES;
}

export function saveStoredFiles(files: WorkspaceFile[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    }
  } catch (err) {
    console.warn('No se pudieron guardar los archivos en el almacenamiento:', err);
  }
}
