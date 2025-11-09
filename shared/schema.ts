import { z } from "zod";

// Admin Schema
export const adminSchema = z.object({
  id: z.string(),
  username: z.string(),
  passwordHash: z.string(),
  createdAt: z.date(),
});

export const insertAdminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type Admin = z.infer<typeof adminSchema>;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

// Client Schema
export const clientSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  contactName: z.string(),
  contactEmail: z.string().email(),
  notificationEmails: z.array(z.string().email()),
  logoPath: z.string().nullable(),
  brandColor: z.string(),
  formSlug: z.string(),
  active: z.boolean(),
  createdAt: z.date(),
});

export const insertClientSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactEmail: z.string().email("Valid email is required"),
  notificationEmails: z.array(z.string().email()).min(1, "At least one notification email is required"),
  logoPath: z.string().nullable().optional(),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color").default("#E8764B"),
  formSlug: z.string().min(3, "Form slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  active: z.boolean().default(true),
});

export type Client = z.infer<typeof clientSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;

// Report Schema
export const reportSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  reportDate: z.date(),
  projectName: z.string(),
  formData: z.object({
    worksPerformed: z.string(),
    labourOnSite: z.string(),
    plantMachinery: z.string(),
    hoursWorked: z.string(),
    materialsUsed: z.string(),
    delaysWeather: z.string(),
    safetyIncidents: z.string(),
  }),
  aiAnalysis: z.any().nullable(),
  pdfPath: z.string().nullable(),
  status: z.enum(["processing", "completed", "failed"]),
  submittedAt: z.date(),
  processedAt: z.date().nullable(),
});

export const insertReportSchema = z.object({
  clientId: z.string(),
  reportDate: z.string().or(z.date()),
  projectName: z.string().min(1, "Project name is required"),
  worksPerformed: z.string().min(1, "Works performed is required"),
  labourOnSite: z.string().min(1, "Labour on site is required"),
  plantMachinery: z.string().optional().default(""),
  hoursWorked: z.string().min(1, "Hours worked is required"),
  materialsUsed: z.string().optional().default(""),
  delaysWeather: z.string().optional().default(""),
  safetyIncidents: z.string().optional().default("None reported"),
});

export type Report = z.infer<typeof reportSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;

// Image Schema
export const imageSchema = z.object({
  id: z.string(),
  reportId: z.string(),
  filePath: z.string(),
  fileName: z.string(),
  aiDescription: z.string().nullable(),
  imageOrder: z.number(),
  uploadedAt: z.date(),
});

export const insertImageSchema = z.object({
  reportId: z.string(),
  filePath: z.string(),
  fileName: z.string(),
  imageOrder: z.number(),
});

export type Image = z.infer<typeof imageSchema>;
export type InsertImage = z.infer<typeof insertImageSchema>;

// API Response Types
export type AuthResponse = {
  success: boolean;
  token?: string;
  admin?: Omit<Admin, 'passwordHash'>;
  error?: string;
};

export type ClientWithReportCount = Client & {
  reportCount: number;
};

export type ReportWithClient = Report & {
  client: Client;
  images: Image[];
};
