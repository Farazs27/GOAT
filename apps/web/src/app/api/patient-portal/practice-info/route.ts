import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError } from "@/lib/auth";
import { UserRole } from "@dentflow/shared-types";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const practice = await prisma.practice.findUnique({
      where: {
        id: user.practiceId,
      },
      select: {
        name: true,
        addressStreet: true,
        addressCity: true,
        addressPostal: true,
        phone: true,
        email: true,
        settings: true,
      },
    });

    if (!practice) {
      return NextResponse.json(
        { error: "Praktijk niet gevonden" },
        { status: 404 }
      );
    }

    // Parse settings if stored as JSON string
    const settings =
      typeof practice.settings === "string"
        ? JSON.parse(practice.settings)
        : practice.settings || {};

    return NextResponse.json({
      name: practice.name,
      address: {
        street: practice.addressStreet,
        city: practice.addressCity,
        postal: practice.addressPostal,
      },
      contact: {
        phone: practice.phone,
        email: practice.email,
      },
      settings: {
        openingHours: settings.openingHours || {},
        accessibility: settings.accessibility || {},
        emergency: settings.emergency || {},
        houseRules: settings.houseRules || [],
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
