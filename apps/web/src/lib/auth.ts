import jwt from 'jsonwebtoken';
import { UserRole, RolePermissions, Permission } from '@dentflow/shared-types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  practiceId: string;
  permissions: Permission[];
  patientId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  practiceId: string;
  permissions: Permission[];
  patientId?: string;
}

export function signAccessToken(payload: Omit<JwtPayload, 'permissions'>, expiresIn = '5m'): string {
  const permissions = RolePermissions[payload.role] || [];
  return jwt.sign({ ...payload, permissions }, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function signRefreshToken(payload: Omit<JwtPayload, 'permissions'>, expiresIn = '8h'): string {
  const permissions = RolePermissions[payload.role] || [];
  return jwt.sign({ ...payload, permissions }, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export async function withAuth(request: Request): Promise<AuthUser> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Niet geautoriseerd', 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      practiceId: payload.practiceId,
      permissions: payload.permissions,
      patientId: payload.patientId,
    };
  } catch {
    throw new AuthError('Ongeldige of verlopen token', 401);
  }
}

export function requireRoles(user: AuthUser, roles: UserRole[]): void {
  if (!roles.includes(user.role)) {
    throw new AuthError('Onvoldoende rechten', 403);
  }
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function handleError(error: unknown): Response {
  if (error instanceof AuthError) {
    return Response.json({ message: error.message }, { status: error.status });
  }
  if (error instanceof ApiError) {
    return Response.json({ message: error.message }, { status: error.status });
  }
  console.error('Unhandled error:', error);
  return Response.json({ message: 'Interne serverfout' }, { status: 500 });
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
