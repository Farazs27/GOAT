import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@nexiom/shared-types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    if (!user.patientId) {
      throw new ApiError("Geen patient ID gevonden", 400);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "OTHER";
    const title = (formData.get("title") as string) || file?.name || "Document";

    if (!file) {
      throw new ApiError("Geen bestand geselecteerd", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new ApiError("Bestand is te groot (max 10MB)", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ApiError(
        "Bestandstype niet toegestaan. Upload een afbeelding, PDF of Word-document.",
        400
      );
    }

    // Get patient's practice
    const patient = await prisma.patient.findUnique({
      where: { id: user.patientId },
      select: { practiceId: true },
    });

    if (!patient) {
      throw new ApiError("Patient niet gevonden", 404);
    }

    // Upload to Vercel Blob
    const blob = await put(
      `patient-uploads/${user.patientId}/${Date.now()}-${file.name}`,
      file,
      { access: "public" }
    );

    // Create document record with PENDING_REVIEW status
    const document = await prisma.document.create({
      data: {
        practiceId: patient.practiceId,
        patientId: user.patientId,
        uploadedByPatientId: user.patientId,
        documentType: category,
        title,
        s3Key: blob.url,
        fileSize: file.size,
        mimeType: file.type,
        approvalStatus: "PENDING_REVIEW",
      },
    });

    return Response.json(
      {
        id: document.id,
        title: document.title,
        documentType: document.documentType,
        mimeType: document.mimeType,
        fileSize: Number(document.fileSize),
        approvalStatus: document.approvalStatus,
        createdAt: document.createdAt,
        url: blob.url,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
