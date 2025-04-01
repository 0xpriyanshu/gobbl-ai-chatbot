// app/models/onboarding.server.ts
import prisma from "../db.server";

export async function getOnboardingData(shop: string) {
  try {
    return await prisma.onboardingData.findUnique({
      where: { shop }
    });
  } catch (error) {
    console.error("Error fetching onboarding data:", error);
    return null;
  }
}

export async function saveOnboardingData(
  shop: string, 
  data: { 
    businessName: string; 
    contactEmail: string; 
    industry: string;
    acceptedTerms: boolean;
  }
) {
  try {
    return await prisma.onboardingData.upsert({
      where: { shop },
      update: {
        ...data,
        isComplete: true,
        updatedAt: new Date()
      },
      create: {
        shop,
        ...data,
        isComplete: true
      }
    });
  } catch (error) {
    console.error("Error saving onboarding data:", error);
    return null;
  }
}

export async function isOnboardingComplete(shop: string) {
  try {
    const data = await getOnboardingData(shop);
    return data?.isComplete || false;
  } catch (error) {
    console.error("Error checking onboarding completion:", error);
    return false;
  }
}