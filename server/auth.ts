import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { queryOne, runSql } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'apex-car-rental-super-secure-luxury-jwt-secret-2025';

export interface AdminPayload {
  id: string;
  username: string;
  email: string;
  role: string;
  name: string;
  mustChangePassword?: boolean;
}

export function generateToken(admin: AdminPayload): string {
  return jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      name: admin.name,
      mustChangePassword: Boolean(admin.mustChangePassword)
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }

  // Verify user still exists in database
  const user = queryOne('SELECT id, username, email, role, name, must_change_password FROM admin_users WHERE id = ?', [payload.id]);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: Admin account no longer exists' });
    return;
  }

  (req as any).adminUser = user;
  next();
}

export { bcrypt };
