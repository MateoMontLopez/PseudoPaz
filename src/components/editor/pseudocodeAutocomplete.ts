import { CompletionContext, CompletionResult, Completion } from '@codemirror/autocomplete';

/**
 * Palabras reservadas del sistema y estructuras para el autocompletado restringido.
 */
const SYSTEM_COMPLETIONS: Completion[] = [
  // Declaración y Estructura Principal
  { label: 'Algoritmo', type: 'keyword', boost: 10, detail: 'Estructura principal', info: 'Inicia el bloque del algoritmo' },
  { label: 'FinAlgoritmo', type: 'keyword', boost: 9, detail: 'Fin de algoritmo' },
  { label: 'Definir', type: 'keyword', boost: 10, detail: 'Declaración de variable', info: 'Definir <var> Como <Tipo>' },
  { label: 'Como', type: 'keyword', boost: 8, detail: 'Especificador de tipo' },
  { label: 'Var', type: 'keyword', boost: 7, detail: 'Sección de variables' },
  { label: 'Inicio', type: 'keyword', boost: 7, detail: 'Inicio de instrucciones' },
  { label: 'Fin', type: 'keyword', boost: 7, detail: 'Fin del bloque' },

  // Control Condicional
  { label: 'Si', type: 'keyword', boost: 10, detail: 'Condicional Si', info: 'Si <condicion> Entonces ... FinSi' },
  { label: 'Entonces', type: 'keyword', boost: 8, detail: 'Rama verdadera' },
  { label: 'Sino', type: 'keyword', boost: 8, detail: 'Rama falsa' },
  { label: 'FinSi', type: 'keyword', boost: 9, detail: 'Fin de condicional' },

  // Bucles e Iteración
  { label: 'Mientras', type: 'keyword', boost: 10, detail: 'Bucle Mientras', info: 'Mientras <condicion> Hacer ... FinMientras' },
  { label: 'Hacer', type: 'keyword', boost: 8, detail: 'Cuerpo de bucle' },
  { label: 'FinMientras', type: 'keyword', boost: 9, detail: 'Fin de Mientras' },
  { label: 'Para', type: 'keyword', boost: 10, detail: 'Bucle Para', info: 'Para <var> <- <inicio> Hasta <fin> Con Paso <paso> Hacer' },
  { label: 'Hasta', type: 'keyword', boost: 8, detail: 'Límite de bucle' },
  { label: 'Con', type: 'keyword', boost: 6, detail: 'Con Paso' },
  { label: 'Paso', type: 'keyword', boost: 6, detail: 'Incremento del bucle' },
  { label: 'FinPara', type: 'keyword', boost: 9, detail: 'Fin de Para' },
  { label: 'Repetir', type: 'keyword', boost: 8, detail: 'Bucle Repetir', info: 'Repetir ... Hasta Que <condicion>' },
  { label: 'Hasta Que', type: 'keyword', boost: 8, detail: 'Condición de salida' },

  // Entrada y Salida (I/O)
  { label: 'Leer', type: 'function', boost: 10, detail: 'Lectura de datos', info: 'Leer <variable>' },
  { label: 'Escribir', type: 'function', boost: 10, detail: 'Salida de datos', info: 'Escribir <expresion>' },
  { label: 'Mostrar', type: 'function', boost: 7, detail: 'Salida de datos (sinónimo)' },

  // Tipos de Datos
  { label: 'Entero', type: 'type', boost: 8, detail: 'Tipo numérico entero' },
  { label: 'Real', type: 'type', boost: 8, detail: 'Tipo numérico decimal' },
  { label: 'Decimal', type: 'type', boost: 6, detail: 'Tipo numérico decimal' },
  { label: 'Cadena', type: 'type', boost: 8, detail: 'Tipo texto entre comillas' },
  { label: 'Texto', type: 'type', boost: 6, detail: 'Tipo texto' },
  { label: 'Caracter', type: 'type', boost: 6, detail: 'Tipo carácter único' },
  { label: 'Booleano', type: 'type', boost: 7, detail: 'Tipo lógico (Verdadero / Falso)' },
  { label: 'Logico', type: 'type', boost: 6, detail: 'Tipo lógico' },

  // Literales y Operadores
  { label: 'Verdadero', type: 'constant', boost: 6, detail: 'Literal booleano' },
  { label: 'Falso', type: 'constant', boost: 6, detail: 'Literal booleano' },
  { label: 'MOD', type: 'operator', boost: 5, detail: 'Operador residuo entero' },
  { label: 'Y', type: 'operator', boost: 5, detail: 'Operador lógico Y (AND)' },
  { label: 'O', type: 'operator', boost: 5, detail: 'Operador lógico O (OR)' },
  { label: 'NO', type: 'operator', boost: 5, detail: 'Operador lógico NO (NOT)' },
];

/**
 * Autocompletado restringido exclusivamente al léxico y palabras reservadas del sistema.
 */
export function pseudocodeCompletionSource(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/[\wáéíóúÁÉÍÓÚñÑ]+/);
  if (!word || (word.from === word.to && !context.explicit)) {
    return null;
  }

  const query = word.text.toLowerCase();
  const matchedOptions = SYSTEM_COMPLETIONS.filter((item) =>
    item.label.toLowerCase().startsWith(query)
  );

  if (matchedOptions.length === 0) {
    return null;
  }

  return {
    from: word.from,
    options: matchedOptions,
    validFor: /^[\wáéíóúÁÉÍÓÚñÑ]*$/,
  };
}
