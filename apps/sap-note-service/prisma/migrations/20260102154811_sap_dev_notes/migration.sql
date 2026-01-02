-- CreateTable
CREATE TABLE "SapNote" (
    "id" TEXT NOT NULL,
    "noteNumber" TEXT NOT NULL,
    "priority" TEXT,
    "cvssScore" DOUBLE PRECISION,
    "cvssVector" TEXT,
    "confidence" INTEGER NOT NULL,
    "correction" TEXT,
    "rawText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SapNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SapNoteComponent" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "fromVersion" TEXT,
    "toVersion" TEXT,

    CONSTRAINT "SapNoteComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SapNote_noteNumber_key" ON "SapNote"("noteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SapNoteComponent_noteId_component_key" ON "SapNoteComponent"("noteId", "component");

-- AddForeignKey
ALTER TABLE "SapNoteComponent" ADD CONSTRAINT "SapNoteComponent_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "SapNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
