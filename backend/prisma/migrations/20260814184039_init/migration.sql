-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA');

-- CreateTable
CREATE TABLE "usuario" (
    "uuid" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rgm" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "frequencia" INTEGER NOT NULL DEFAULT 0,
    "e_admin" BOOLEAN NOT NULL DEFAULT false,
    "dta_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dta_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "usuario_dia_aula" (
    "uuid" TEXT NOT NULL,
    "usuario_uuid" TEXT NOT NULL,
    "dia_pedido" "DiaSemana" NOT NULL,
    "dia_atribuido" "DiaSemana" NOT NULL,
    "realocado" BOOLEAN NOT NULL DEFAULT false,
    "dta_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_dia_aula_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "aula" (
    "uuid" TEXT NOT NULL,
    "data_aula" TIMESTAMP(3) NOT NULL,
    "dia_aula" "DiaSemana" NOT NULL,
    "qr_code_presenca" TEXT NOT NULL,
    "qtd_aluno" INTEGER NOT NULL DEFAULT 0,
    "qtd_presenca" INTEGER NOT NULL DEFAULT 0,
    "finalizada" BOOLEAN NOT NULL DEFAULT false,
    "dta_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dta_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aula_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "presenca" (
    "uuid" TEXT NOT NULL,
    "aula_uuid" TEXT NOT NULL,
    "usuario_uuid" TEXT NOT NULL,
    "marcado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presenca_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "doacao" (
    "uuid" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    "dta_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doacao_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "material_doado" (
    "uuid" TEXT NOT NULL,
    "doacao_id" TEXT NOT NULL,
    "material_doado" TEXT NOT NULL,
    "dta_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_doado_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_rgm_key" ON "usuario"("rgm");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_dia_aula_usuario_uuid_dia_atribuido_key" ON "usuario_dia_aula"("usuario_uuid", "dia_atribuido");

-- CreateIndex
CREATE UNIQUE INDEX "aula_qr_code_presenca_key" ON "aula"("qr_code_presenca");

-- CreateIndex
CREATE UNIQUE INDEX "presenca_aula_uuid_usuario_uuid_key" ON "presenca"("aula_uuid", "usuario_uuid");

-- AddForeignKey
ALTER TABLE "usuario_dia_aula" ADD CONSTRAINT "usuario_dia_aula_usuario_uuid_fkey" FOREIGN KEY ("usuario_uuid") REFERENCES "usuario"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca" ADD CONSTRAINT "presenca_aula_uuid_fkey" FOREIGN KEY ("aula_uuid") REFERENCES "aula"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca" ADD CONSTRAINT "presenca_usuario_uuid_fkey" FOREIGN KEY ("usuario_uuid") REFERENCES "usuario"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_doado" ADD CONSTRAINT "material_doado_doacao_id_fkey" FOREIGN KEY ("doacao_id") REFERENCES "doacao"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
