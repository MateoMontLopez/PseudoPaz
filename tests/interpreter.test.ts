import { describe, expect, it } from 'vitest';
import { Lexer } from '../src/engine/lexer/Lexer';
import { Parser } from '../src/engine/parser/Parser';
import { Interpreter } from '../src/engine/interpreter/Interpreter';
import { RuntimeError } from '../src/engine/interpreter/Environment';

async function runProgram(code: string, mockInputs: Record<string, string> = {}) {
  const prints: string[] = [];
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();

  const interpreter = new Interpreter({
    onPrint: (output: string) => {
      prints.push(output);
    },
    onRead: async (varName: string) => {
      const val = mockInputs[varName] ?? mockInputs[varName.toLowerCase()] ?? '0';
      return val;
    },
  });

  await interpreter.execute(ast);
  return { prints, env: interpreter.getEnvironment() };
}

describe('Interpreter', () => {
  it('debe ejecutar operaciones aritméticas y asignación básica', () => {
    return expect(
      runProgram(`
        Algoritmo Calculo
          Var
            a, b, res: entero;
          a <- 10;
          b <- 20;
          res <- a + b * 2;
          Mostrar "Resultado:", res;
        FinAlgoritmo
      `)
    ).resolves.toMatchObject({
      prints: ['Resultado: 50'],
    });
  });

  it('debe evaluar correctamente condicionales Si - Entonces - Sino', async () => {
    const code = `
      edad <- 17;
      Si edad >= 18 Entonces
        Mostrar "Mayor de edad"
      Sino
        Mostrar "Menor de edad"
      FinSi
    `;

    const { prints } = await runProgram(code);
    expect(prints).toEqual(['Menor de edad']);
  });

  it('debe ejecutar un bucle Mientras calculando factorial', async () => {
    const code = `
      Var
        n, factorial, i: entero;
      n <- 5;
      factorial <- 1;
      i <- 1;
      Mientras i <= n Hacer
        factorial <- factorial * i;
        i <- i + 1;
      FinMientras
      Mostrar "Factorial:", factorial;
    `;

    const { prints, env } = await runProgram(code);
    expect(prints).toEqual(['Factorial: 120']);
    expect(env.get('factorial', 1, 1)).toBe(120);
  });

  it('debe ejecutar un bucle Para con incremento Con Paso', async () => {
    const code = `
      Var suma: entero;
      suma <- 0;
      Para k <- 1 Hasta 10 Con Paso 2 Hacer
        suma <- suma + k;
      FinPara
      Mostrar "Suma impares:", suma;
    `;

    // 1 + 3 + 5 + 7 + 9 = 25
    const { prints } = await runProgram(code);
    expect(prints).toEqual(['Suma impares: 25']);
  });

  it('debe manejar I/O asíncrono con Leer y Mostrar', async () => {
    const code = `
      Var base, altura, area: decimal;
      Leer base, altura;
      area <- (base * altura) / 2;
      Mostrar "Area:", area;
    `;

    const { prints } = await runProgram(code, {
      base: '10.5',
      altura: '4',
    });

    expect(prints).toEqual(['Area: 21']);
  });

  it('debe arrojar RuntimeError ante división por cero', async () => {
    const code = `
      x <- 10 / 0;
    `;

    await expect(runProgram(code)).rejects.toThrowError(RuntimeError);
  });

  it('debe comprobar compatibilidad estricta de tipos en el Environment', async () => {
    const code = `
      Var x: entero;
      x <- 3.14; // Inválido: decimal a entero
    `;

    await expect(runProgram(code)).rejects.toThrowError(RuntimeError);
  });

  it('debe arrojar error si se lee una variable no inicializada', async () => {
    const code = `
      Var a, b: entero;
      b <- a + 1;
    `;

    await expect(runProgram(code)).rejects.toThrowError(RuntimeError);
  });
});
