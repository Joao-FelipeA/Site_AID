-- Remove o campo email do usuario: login e "esqueci senha" passaram a
-- usar RGM, email nao e mais usado em nenhum fluxo do sistema.
ALTER TABLE "usuario" DROP COLUMN "email";
