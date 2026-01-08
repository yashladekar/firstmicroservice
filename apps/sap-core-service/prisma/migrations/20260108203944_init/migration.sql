-- CreateTable
CREATE TABLE "System" (
    "sid" TEXT NOT NULL,
    "mainProduct" TEXT,
    "dbVersion" TEXT,
    "osType" TEXT,
    "osVersion" TEXT,
    "osPatch" TEXT,
    "kernelRelease" TEXT,
    "dbslVersion" TEXT,
    "dbslPatchLevel" TEXT,
    "vmJavaVersion" TEXT,
    "vmRuntimeVersion" TEXT,
    "javaKernelVersion" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "System_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "AbapComponent" (
    "id" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "release" TEXT NOT NULL,
    "spLevel" TEXT,
    "supportPackage" TEXT,
    "shortDescription" TEXT,
    "systemSid" TEXT NOT NULL,

    CONSTRAINT "AbapComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JavaComponent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendor" TEXT,
    "version" TEXT NOT NULL,
    "location" TEXT,
    "systemSid" TEXT NOT NULL,

    CONSTRAINT "JavaComponent_pkey" PRIMARY KEY ("id")
);

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
    "fixedInSp" TEXT,

    CONSTRAINT "SapNoteComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SapVulnerability" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "componentName" TEXT NOT NULL,
    "componentVersion" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "noteNumber" TEXT NOT NULL,
    "fromVersion" TEXT,
    "toVersion" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SapVulnerability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "System_sid_key" ON "System"("sid");

-- CreateIndex
CREATE INDEX "AbapComponent_systemSid_idx" ON "AbapComponent"("systemSid");

-- CreateIndex
CREATE INDEX "JavaComponent_systemSid_idx" ON "JavaComponent"("systemSid");

-- CreateIndex
CREATE UNIQUE INDEX "SapNote_noteNumber_key" ON "SapNote"("noteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SapNoteComponent_noteId_component_key" ON "SapNoteComponent"("noteId", "component");

-- CreateIndex
CREATE INDEX "SapVulnerability_systemId_idx" ON "SapVulnerability"("systemId");

-- CreateIndex
CREATE INDEX "SapVulnerability_noteId_idx" ON "SapVulnerability"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "SapVulnerability_systemId_componentName_noteId_key" ON "SapVulnerability"("systemId", "componentName", "noteId");

-- AddForeignKey
ALTER TABLE "AbapComponent" ADD CONSTRAINT "AbapComponent_systemSid_fkey" FOREIGN KEY ("systemSid") REFERENCES "System"("sid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JavaComponent" ADD CONSTRAINT "JavaComponent_systemSid_fkey" FOREIGN KEY ("systemSid") REFERENCES "System"("sid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SapNoteComponent" ADD CONSTRAINT "SapNoteComponent_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "SapNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SapVulnerability" ADD CONSTRAINT "SapVulnerability_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("sid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SapVulnerability" ADD CONSTRAINT "SapVulnerability_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "SapNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
