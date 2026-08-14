import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  emailDominio: process.env.EMAIL_DOMINIO ?? "@cs.unipe.edu.br",
  /** URL onde o frontend estatico e servido; usada para montar o link do QR code de presenca. */
  frontendUrl: (process.env.FRONTEND_URL ?? "http://localhost:5500").replace(/\/$/, ""),
  capacidadeMaximaPorDia: Number(process.env.CAPACIDADE_MAXIMA_POR_DIA ?? 11),
  google: {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL ?? "",
    privateKey: (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    planilhaDoacoesId: process.env.GOOGLE_SHEET_DOACOES_ID ?? "",
    planilhaFrequenciaId: process.env.GOOGLE_SHEET_FREQUENCIA_ID ?? "",
  },
};
