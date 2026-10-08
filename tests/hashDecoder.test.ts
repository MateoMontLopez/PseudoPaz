import { describe, expect, it } from 'vitest';
import { computeAstSignature } from '../src/services/audit/hashDecoder.service';

describe('HashDecoder & AST Canonicalization', () => {
  it('debe generar la misma firma AST para dos códigos idénticos con diferentes variables y comentarios', async () => {
    const codeA = `
      Algoritmo SumaMayor
        Var x, z: entero;
        Leer x;
        Leer z;
        Si x > z Entonces
          Escribir "Mayor:", x;
        FinSi
      FinAlgoritmo
    `;

    const codeB = `
      Algoritmo CalculoModificado
        // Comentario adicional de otro estudiante
        Var a, b: entero;
        Leer a;
        Leer b;
        Si a > b Entonces
          Escribir "Mayor:", a;
        FinSi
      FinAlgoritmo
    `;

    const resA = await computeAstSignature(codeA);
    const resB = await computeAstSignature(codeB);

    expect(resA.hash).toBe(resB.hash);
    expect(resA.signature).toBe(resB.signature);
  });

  it('debe generar firmas AST distintas para códigos con lógica diferente', async () => {
    const codeA = `
      Algoritmo Condicional
        Var a: entero;
        Leer a;
        Si a > 10 Entonces
          Escribir a;
        FinSi
      FinAlgoritmo
    `;

    const codeB = `
      Algoritmo Bucle
        Var a: entero;
        Para a <- 1 Hasta 10 Hacer
          Escribir a;
        FinPara
      FinAlgoritmo
    `;

    const resA = await computeAstSignature(codeA);
    const resB = await computeAstSignature(codeB);

    expect(resA.hash).not.toBe(resB.hash);
  });
});
