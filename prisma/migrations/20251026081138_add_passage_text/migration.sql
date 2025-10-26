/*
  Warnings:

  - Added the required column `passageText` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passageText` to the `ShareDraft` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "passageText" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ShareDraft" ADD COLUMN     "passageText" TEXT NOT NULL;
