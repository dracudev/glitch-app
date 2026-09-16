/*
  Warnings:

  - You are about to drop the column `description` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `developerId` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `metacriticId` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `playCount` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `publisherId` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `rawgId` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `releaseDate` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `screenshots` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `steamId` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `videos` on the `games` table. All the data in the column will be lost.
  - You are about to drop the `developers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `game_genres` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `game_platforms` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `genres` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `platforms` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `publishers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "game_genres" DROP CONSTRAINT "game_genres_gameId_fkey";

-- DropForeignKey
ALTER TABLE "game_genres" DROP CONSTRAINT "game_genres_genreId_fkey";

-- DropForeignKey
ALTER TABLE "game_platforms" DROP CONSTRAINT "game_platforms_gameId_fkey";

-- DropForeignKey
ALTER TABLE "game_platforms" DROP CONSTRAINT "game_platforms_platformId_fkey";

-- DropForeignKey
ALTER TABLE "games" DROP CONSTRAINT "games_developerId_fkey";

-- DropForeignKey
ALTER TABLE "games" DROP CONSTRAINT "games_publisherId_fkey";

-- DropIndex
DROP INDEX "games_rawgId_key";

-- DropIndex
DROP INDEX "games_steamId_key";

-- AlterTable
ALTER TABLE "games" DROP COLUMN "description",
DROP COLUMN "developerId",
DROP COLUMN "metacriticId",
DROP COLUMN "playCount",
DROP COLUMN "publisherId",
DROP COLUMN "rawgId",
DROP COLUMN "releaseDate",
DROP COLUMN "screenshots",
DROP COLUMN "status",
DROP COLUMN "steamId",
DROP COLUMN "summary",
DROP COLUMN "videos";

-- DropTable
DROP TABLE "developers";

-- DropTable
DROP TABLE "game_genres";

-- DropTable
DROP TABLE "game_platforms";

-- DropTable
DROP TABLE "genres";

-- DropTable
DROP TABLE "platforms";

-- DropTable
DROP TABLE "publishers";

-- DropEnum
DROP TYPE "GameStatus";
