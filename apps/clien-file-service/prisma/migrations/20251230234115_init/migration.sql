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

-- CreateIndex
CREATE UNIQUE INDEX "System_sid_key" ON "System"("sid");

-- CreateIndex
CREATE INDEX "AbapComponent_systemSid_idx" ON "AbapComponent"("systemSid");

-- CreateIndex
CREATE INDEX "JavaComponent_systemSid_idx" ON "JavaComponent"("systemSid");

-- AddForeignKey
ALTER TABLE "AbapComponent" ADD CONSTRAINT "AbapComponent_systemSid_fkey" FOREIGN KEY ("systemSid") REFERENCES "System"("sid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JavaComponent" ADD CONSTRAINT "JavaComponent_systemSid_fkey" FOREIGN KEY ("systemSid") REFERENCES "System"("sid") ON DELETE CASCADE ON UPDATE CASCADE;
