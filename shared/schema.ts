import { z } from "zod";
import { pgTable, varchar, text, timestamp, boolean, jsonb, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

// Drizzle Tables
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  notificationEmails: text("notification_emails").array().notNull(),
  notificationPhoneNumber: varchar("notification_phone_number", { length: 20 }),
  notificationTime: varchar("notification_time", { length: 5 }),
  logoPath: varchar("logo_path", { length: 500 }),
  brandColor: varchar("brand_color", { length: 7 }).notNull().default("#E8764B"),
  formSlug: varchar("form_slug", { length: 100 }).notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  reportDate: timestamp("report_date").notNull(),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  formData: jsonb("form_data").notNull(),
  aiAnalysis: jsonb("ai_analysis"),
  pdfPath: varchar("pdf_path", { length: 500 }),
  status: varchar("status", { length: 50 }).notNull().default("processing"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const images = pgTable("images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull().references(() => reports.id),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull().default('image/jpeg'),
  aiDescription: text("ai_description"),
  imageOrder: integer("image_order").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate images for the same report and order
  uniqueReportImage: unique().on(table.reportId, table.imageOrder),
}));

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workers = pgTable("workers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id").notNull().references(() => reports.id, { onDelete: 'cascade' }),
  workerName: varchar("worker_name", { length: 255 }).notNull(),
  hoursWorked: text("hours_worked"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const clientUsers = pgTable("client_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  lastLogin: timestamp("last_login"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
  notificationPhoneNumber: z.string().nullable(),
  notificationTime: z.string().nullable(),
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
  notificationPhoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Must be a valid phone number with country code").optional().or(z.literal("")).nullable(),
  notificationTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be in HH:MM format (e.g., 17:00)").optional().or(z.literal("")).nullable(),
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
  mimeType: z.string(),
  aiDescription: z.string().nullable(),
  imageOrder: z.number(),
  uploadedAt: z.date(),
});

export const insertImageSchema = z.object({
  reportId: z.string(),
  filePath: z.string(),
  fileName: z.string(),
  mimeType: z.string().default('image/jpeg'),
  imageOrder: z.number(),
});

export type Image = z.infer<typeof imageSchema>;
export type InsertImage = z.infer<typeof insertImageSchema>;

// API Response Schema: Image with computed URL field
export const imageResponseSchema = imageSchema.extend({
  url: z.string().url(),
});

export type ImageResponse = z.infer<typeof imageResponseSchema>;

// Settings Schema
export const settingsSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string().nullable(),
  updatedAt: z.date(),
});

export const insertSettingsSchema = z.object({
  key: z.string(),
  value: z.string().nullable(),
});

export const updateSettingsSchema = z.object({
  openaiApiKey: z.string().min(1, "OpenAI API key is required").optional(),
  aiPrompt: z.string().optional(),
});

export type Settings = z.infer<typeof settingsSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;

// Worker Schema
export const workerSchema = z.object({
  id: z.string(),
  reportId: z.string(),
  workerName: z.string(),
  hoursWorked: z.string().nullable(),
  createdAt: z.date(),
});

export const insertWorkerSchema = z.object({
  reportId: z.string(),
  workerName: z.string().min(1, "Worker name is required"),
  hoursWorked: z.string().optional(),
});

export type Worker = z.infer<typeof workerSchema>;
export type InsertWorker = z.infer<typeof insertWorkerSchema>;

// Client User Schema
export const clientUserSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  lastLogin: z.date().nullable(),
  resetToken: z.string().nullable(),
  resetTokenExpiry: z.date().nullable(),
  active: z.boolean(),
  createdAt: z.date(),
});

export const insertClientUserSchema = z.object({
  clientId: z.string(),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const clientLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export type ClientUser = z.infer<typeof clientUserSchema>;
export type InsertClientUser = z.infer<typeof insertClientUserSchema>;
export type ClientLoginCredentials = z.infer<typeof clientLoginSchema>;

// API Response Types
export type AuthResponse = {
  success: boolean;
  token?: string;
  admin?: Omit<Admin, 'passwordHash'>;
  error?: string;
};

export type ClientAuthResponse = {
  success: boolean;
  token?: string;
  client?: Client;
  clientUser?: Omit<ClientUser, 'passwordHash'>;
  error?: string;
};

export type ClientWithReportCount = Client & {
  reportCount: number;
};

export type ReportWithClient = Report & {
  client: Client;
  images: Image[];
};
