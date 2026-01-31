/*
  Warnings:

  - Added the required column `stack` to the `SapNoteComponent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SapNoteComponent" ADD COLUMN     "stack" TEXT NOT NULL;
