-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionEntry" (
    "id" TEXT NOT NULL,
    "chromePlatingDate" TIMESTAMP(3) NOT NULL,
    "customerDcNo" TEXT,
    "customerDcDate" TIMESTAMP(3),
    "hydriseDcNo" TEXT,
    "hydriseDcDate" TIMESTAMP(3),
    "customerId" TEXT NOT NULL,
    "employeeId" TEXT,
    "rodDiaMm" DOUBLE PRECISION NOT NULL,
    "rodLengthMm" DOUBLE PRECISION NOT NULL,
    "chromePlatingMicrons" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "area" DOUBLE PRECISION NOT NULL,
    "costPerSqIn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "additionalRequirements" TEXT,
    "inTime" TEXT,
    "outTime" TEXT,
    "temperature" DOUBLE PRECISION,
    "density" DOUBLE PRECISION,
    "cathodeCurrent" DOUBLE PRECISION,
    "anodeCurrent" DOUBLE PRECISION,
    "currentReading" TEXT,
    "chromeThickness" TEXT,
    "remarks" TEXT,
    "status" "EntryStatus" NOT NULL DEFAULT 'PENDING',
    "redoOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionEntry_redoOfId_key" ON "ProductionEntry"("redoOfId");

-- CreateIndex
CREATE INDEX "ProductionEntry_chromePlatingDate_idx" ON "ProductionEntry"("chromePlatingDate");

-- CreateIndex
CREATE INDEX "ProductionEntry_customerId_idx" ON "ProductionEntry"("customerId");

-- CreateIndex
CREATE INDEX "ProductionEntry_status_idx" ON "ProductionEntry"("status");

-- AddForeignKey
ALTER TABLE "ProductionEntry" ADD CONSTRAINT "ProductionEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionEntry" ADD CONSTRAINT "ProductionEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionEntry" ADD CONSTRAINT "ProductionEntry_redoOfId_fkey" FOREIGN KEY ("redoOfId") REFERENCES "ProductionEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
