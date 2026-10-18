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

  it('debe ejecutar el algoritmo EjemploVector con Dimension y bucle Para', async () => {
    const code = `
      // Ejemplo de Vector
      Algoritmo EjemploVector
          Definir i Como Entero
          Dimension notas[3]
          
          notas[1] <- 85
          notas[2] <- 90
          notas[3] <- 100
          
          Para i <- 1 Hasta 3 Con Paso 1 Hacer
              Escribir "Nota ", i, ": ", notas[i]
          FinPara
      FinAlgoritmo
    `;

    const { prints } = await runProgram(code);
    expect(prints).toEqual([
      'Nota  1 :  85',
      'Nota  2 :  90',
      'Nota  3 :  100',
    ]);
  });

  it('debe ejecutar el algoritmo EjemploMatriz con Dimension [2, 2]', async () => {
    const code = `
      // Ejemplo de Matriz
      Algoritmo EjemploMatriz
          Definir f, c Como Entero
          Dimension tabla[2, 2]
          
          tabla[1, 1] <- 5
          tabla[1, 2] <- 10
          tabla[2, 1] <- 15
          tabla[2, 2] <- 20
          
          Para f <- 1 Hasta 2 Con Paso 1 Hacer
              Para c <- 1 Hasta 2 Con Paso 1 Hacer
                  Escribir "Posicion [", f, ",", c, "]: ", tabla[f, c]
              FinPara
          FinPara
      FinAlgoritmo
    `;

    const { prints } = await runProgram(code);
    expect(prints).toEqual([
      'Posicion [ 1 , 1 ]:  5',
      'Posicion [ 1 , 2 ]:  10',
      'Posicion [ 2 , 1 ]:  15',
      'Posicion [ 2 , 2 ]:  20',
    ]);
  });

  it('debe admitir indexación con paréntesis (compatibilidad PSeInt)', async () => {
    const code = `
      Algoritmo TestParentesis
          Dimension notas(2)
          notas(1) <- 99
          notas(2) <- 88
          Escribir notas(1), notas(2)
      FinAlgoritmo
    `;

    const { prints } = await runProgram(code);
    expect(prints).toEqual(['99 88']);
  });

  it('debe resolver expresiones dinámicas en índices (ej. matriz[i + 1, j * 2] <- valor)', async () => {
    const code = `
      Algoritmo TestExpresionesDinamicas
          Definir i, j Como Entero
          Dimension m[3, 4]
          i <- 1
          j <- 2
          m[i + 1, j * 2] <- 777
          Escribir "Valor:", m[2, 4]
      FinAlgoritmo
    `;

    const { prints } = await runProgram(code);
    expect(prints).toEqual(['Valor: 777']);
  });

  it('debe validar la indexación base 1 de PSeInt y lanzar RuntimeError en índice 0 o fuera de rango', async () => {
    const codeZero = `
      Dimension v[5]
      v[0] <- 10
    `;
    await expect(runProgram(codeZero)).rejects.toThrowError(RuntimeError);

    const codeOutOfBounds = `
      Dimension v[5]
      v[6] <- 10
    `;
    await expect(runProgram(codeOutOfBounds)).rejects.toThrowError(RuntimeError);
  });

  it('debe permitir capturar valores en arreglos con Leer', async () => {
    const code = `
      Definir datos Como Entero
      Dimension datos[2]
      Leer datos[1], datos[2]
      Escribir "Suma:", datos[1] + datos[2]
    `;

    const { prints } = await runProgram(code, {
      datos: '50',
    });
    expect(prints).toEqual(['Suma: 100']);
  });

  it('debe ejecutar condicionales encadenados SinoSi y Sino Si adecuadamente', async () => {
    const code = `
      Algoritmo Calificaciones
        Definir nota Como Entero
        Definir resultado Como Texto
        
        nota <- 85
        Si nota >= 90 Entonces
          resultado <- "A"
        SinoSi nota >= 80 Entonces
          resultado <- "B"
        Sino Si nota >= 70 Entonces
          resultado <- "C"
        Sino
          resultado <- "F"
        FinSi
        
        Escribir "Nota 85:", resultado

        nota <- 75
        Si nota >= 90 Entonces
          resultado <- "A"
        SinoSi nota >= 80 Entonces
          resultado <- "B"
        Sino Si nota >= 70 Entonces
          resultado <- "C"
        Sino
          resultado <- "F"
        FinSi

        Escribir "Nota 75:", resultado

        nota <- 50
        Si nota >= 90 Entonces
          resultado <- "A"
        SinoSi nota >= 80 Entonces
          resultado <- "B"
        Sino Si nota >= 70 Entonces
          resultado <- "C"
        Sino
          resultado <- "F"
        FinSi

        Escribir "Nota 50:", resultado
      FinAlgoritmo
    `;

    const { prints } = await runProgram(code);
    expect(prints).toEqual([
      'Nota 85: B',
      'Nota 75: C',
      'Nota 50: F',
    ]);
  });
});
