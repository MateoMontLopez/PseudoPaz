import * as readline from 'node:readline';
import { Lexer } from './engine/lexer/Lexer';
import { Parser } from './engine/parser/Parser';
import { Interpreter } from './engine/interpreter/Interpreter';
import { DataType } from './engine/parser/ast';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

const sampleCode = `
Algoritmo DemoLogica
  Var
    limite, suma, i: entero;
    nombre: cadena;

  Mostrar "=====================================";
  Mostrar "      IDE PSEUDOCÓDIGO - FASE 1      ";
  Mostrar "=====================================";

  Mostrar "¿Cómo te llamas?";
  Leer nombre;
  Mostrar "¡Hola,", nombre, "! Bienvenido al motor de pseudocódigo.";

  Mostrar "¿Hasta qué número entero deseas calcular la suma?";
  Leer limite;

  suma <- 0;
  Para i <- 1 Hasta limite Hacer
    suma <- suma + i;
  FinPara

  Mostrar "-------------------------------------";
  Mostrar "La suma de 1 hasta", limite, "es:", suma;
  Mostrar "Cálculo finalizado exitosamente.";
  Mostrar "=====================================";
FinAlgoritmo
`;

async function main() {
  console.log('--- Código Pseudocódigo a ejecutar ---');
  console.log(sampleCode.trim());
  console.log('--------------------------------------\n');

  try {
    // 1. Lexer
    const lexer = new Lexer(sampleCode);
    const tokens = lexer.tokenize();

    // 2. Parser
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // 3. Interpreter con I/O conectada a consola de Node.js
    const interpreter = new Interpreter({
      onPrint: (text: string) => {
        console.log(`[SALIDA] ${text}`);
      },
      onRead: async (varName: string, expectedType: DataType) => {
        const input = await askQuestion(`[ENTRADA] Ingrese valor para '${varName}' (${expectedType}): `);
        return input;
      },
    });

    await interpreter.execute(ast);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`\n❌ Error: ${err.message}`);
    } else {
      console.error(`\n❌ Error desconocido:`, err);
    }
  } finally {
    rl.close();
  }
}

void main();
