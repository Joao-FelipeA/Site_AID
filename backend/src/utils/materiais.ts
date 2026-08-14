/** Divide um texto de materiais separados por virgula ou ponto em itens individuais e limpos. */
export function splitMateriais(texto: string): string[] {
  return texto
    .split(/[,.]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
