import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Senha padrao dos usuarios importados da planilha: 3 primeiras letras do
 * nome + "@" + 4 ultimos digitos do RGM. Ex: nome "Joao Silva", rgm
 * "2021001234" -> "joa@1234".
 */
export function gerarSenhaPadrao(nome: string, rgm: string): string {
  const letras = nome.trim().slice(0, 3).toLowerCase();
  const digitos = rgm.trim().slice(-4);
  return `${letras}@${digitos}`;
}

export function hashSenha(senhaPlana: string): Promise<string> {
  return bcrypt.hash(senhaPlana, SALT_ROUNDS);
}

export function compararSenha(senhaPlana: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senhaPlana, hash);
}
