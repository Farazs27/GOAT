import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nexiom/database";
import { withAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const formData = await request.formData();

    const patientId = formData.get("patientId") as string;
    const imageType = (formData.get("imageType") as string) || "PROFILE";
    const notes = (formData.get("notes") as string) || "";
    const file = formData.get("file") as File;

    if (!patientId || !file) {
      return NextResponse.json(
        { message: "Patient ID and file are required" },
        { status: 400 },
      );
    }

    // Verify patient belongs to user's practice
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        practiceId: user.practiceId,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { message: "Patient not found" },
        { status: 404 },
      );
    }

    // Convert file to base64 for storage (in production, use S3 or similar)
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Save to database
    const patientImage = await prisma.patientImage.create({
      data: {
        practiceId: user.practiceId,
        patientId,
        uploadedBy: user.id,
        fileName: file.name,
        filePath: dataUrl, // Storing as base64 data URL for now
        fileSize: file.size,
        mimeType: file.type,
        imageType,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      image: patientImage,
    });
  } catch (error: any) {
    console.error("Error uploading patient image:", error);
    if (error.status) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { message: "Failed to upload image" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const imageType = searchParams.get("imageType");

    if (!patientId) {
      return NextResponse.json(
        { message: "Patient ID is required" },
        { status: 400 },
      );
    }

    const images = await prisma.patientImage.findMany({
      where: {
        patientId,
        practiceId: user.practiceId,
        ...(imageType && { imageType }),
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        uploader: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ images });
  } catch (error: any) {
    console.error("Error fetching patient images:", error);
    if (error.status) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { message: "Failed to fetch images" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("id");

    if (!imageId) {
      return NextResponse.json(
        { message: "Image ID is required" },
        { status: 400 },
      );
    }

    // Verify image belongs to user's practice
    const image = await prisma.patientImage.findFirst({
      where: {
        id: imageId,
        practiceId: user.practiceId,
      },
    });

    if (!image) {
      return NextResponse.json({ message: "Image not found" }, { status: 404 });
    }

    await prisma.patientImage.delete({
      where: { id: imageId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting patient image:", error);
    if (error.status) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { message: "Failed to delete image" },
      { status: 500 },
    );
  }
}
