-- CreateTable
CREATE TABLE "OnboardingData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "acceptedTerms" BOOLEAN NOT NULL DEFAULT false,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingData_shop_key" ON "OnboardingData"("shop");
