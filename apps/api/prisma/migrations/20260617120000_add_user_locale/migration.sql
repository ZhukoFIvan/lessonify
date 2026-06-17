-- AlterTable
-- Предпочитаемый язык интерфейса (ru | en | uk). NULL → определяем по Accept-Language браузера.
ALTER TABLE "users" ADD COLUMN "locale" TEXT;
