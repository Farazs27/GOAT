import { prisma } from './prisma';

interface AuditLogParams {
  userId?: string;
  practiceId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
  userAgent?: string;
  bsnAccessed?: boolean;
  bsnAccessReason?: string;
}

export async function createAuditLog(params: AuditLogParams) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      practiceId: params.practiceId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      oldValues: params.oldValues as any,
      newValues: params.newValues as any,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      bsnAccessed: params.bsnAccessed ?? false,
      bsnAccessReason: params.bsnAccessReason,
    },
  });
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
