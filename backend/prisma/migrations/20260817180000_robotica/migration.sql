-- CreateEnum
CREATE TYPE "HorarioRobotica" AS ENUM ('H13', 'H14', 'H15', 'H16');

-- CreateEnum
CREATE TYPE "OrigemHorarioRobotica" AS ENUM ('PEDIDO', 'REALOCADO');

-- AlterTable
ALTER TABLE "usuario"
  ADD COLUMN "interesse_robotica" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "horario_robotica_pedido" "HorarioRobotica",
  ADD COLUMN "horario_robotica" "HorarioRobotica",
  ADD COLUMN "origem_horario_robotica" "OrigemHorarioRobotica",
  ADD COLUMN "frequencia_robotica" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "aula_robotica" (
    "uuid" TEXT NOT NULL,
    "data_aula" TIMESTAMP(3) NOT NULL,
    "horario" "HorarioRobotica" NOT NULL,
    "qr_code_presenca" TEXT NOT NULL,
    "qtd_aluno" INTEGER NOT NULL DEFAULT 0,
    "qtd_presenca" INTEGER NOT NULL DEFAULT 0,
    "finalizada" BOOLEAN NOT NULL DEFAULT false,
    "dta_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dta_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aula_robotica_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "presenca_robotica" (
    "uuid" TEXT NOT NULL,
    "aula_robotica_uuid" TEXT NOT NULL,
    "usuario_uuid" TEXT NOT NULL,
    "marcado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presenca_robotica_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "aula_robotica_qr_code_presenca_key" ON "aula_robotica"("qr_code_presenca");

-- CreateIndex
CREATE UNIQUE INDEX "presenca_robotica_aula_robotica_uuid_usuario_uuid_key" ON "presenca_robotica"("aula_robotica_uuid", "usuario_uuid");

-- AddForeignKey
ALTER TABLE "presenca_robotica" ADD CONSTRAINT "presenca_robotica_aula_robotica_uuid_fkey" FOREIGN KEY ("aula_robotica_uuid") REFERENCES "aula_robotica"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca_robotica" ADD CONSTRAINT "presenca_robotica_usuario_uuid_fkey" FOREIGN KEY ("usuario_uuid") REFERENCES "usuario"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
