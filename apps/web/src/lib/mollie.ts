import createMollieClient from "@mollie/api-client";
import { prisma } from "@/lib/prisma";

export async function getMollieClient(practiceId: string) {
  // Try to get Mollie credential from database
  const credential = await prisma.credential.findFirst({
    where: {
      practiceId,
      type: "MOLLIE",
      isActive: true,
    },
  });

  const apiKey = credential?.apiKey || process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    throw new Error("Mollie API key niet geconfigureerd");
  }

  return createMollieClient({ apiKey });
}
