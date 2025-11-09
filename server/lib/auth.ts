import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "../storage";

const JWT_SECRET = process.env.JWT_SECRET || "tradease-ai-secret-key-change-in-production";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(adminId: string): string {
  return jwt.sign({ adminId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { adminId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { adminId: string };
  } catch {
    return null;
  }
}

export async function initializeAdmin() {
  const existingAdmin = await storage.getAdminByUsername("admin");
  if (!existingAdmin) {
    const passwordHash = await hashPassword("admin123");
    await storage.createAdmin("admin", passwordHash);
    console.log("✅ Default admin created (username: admin, password: admin123)");
  }
}
