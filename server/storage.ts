import { type Admin, type Client, type Report, type Image, type ClientWithReportCount, type ReportWithClient, admins, clients, reports, images } from "@shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, gte, lte, sql as drizzleSql } from "drizzle-orm";

export interface IStorage {
  // Admin
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(username: string, passwordHash: string): Promise<Admin>;

  // Clients
  getClient(id: string): Promise<Client | undefined>;
  getClientBySlug(slug: string): Promise<Client | undefined>;
  getAllClients(): Promise<ClientWithReportCount[]>;
  createClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client>;
  updateClient(id: string, client: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  // Reports
  getReport(id: string): Promise<ReportWithClient | undefined>;
  getAllReports(): Promise<ReportWithClient[]>;
  getReportsByClient(clientId: string): Promise<ReportWithClient[]>;
  createReport(report: Omit<Report, 'id' | 'submittedAt' | 'processedAt'>): Promise<Report>;
  updateReport(id: string, report: Partial<Omit<Report, 'id' | 'clientId' | 'submittedAt'>>): Promise<Report | undefined>;
  deleteReport(id: string): Promise<boolean>;

  // Images
  getImage(id: string): Promise<Image | undefined>;
  getImagesByReport(reportId: string): Promise<Image[]>;
  createImage(image: Omit<Image, 'id' | 'uploadedAt'>): Promise<Image>;
  updateImage(id: string, image: Partial<Omit<Image, 'id' | 'reportId' | 'uploadedAt'>>): Promise<Image | undefined>;

  // Stats
  getStats(): Promise<{
    totalClients: number;
    totalReports: number;
    processingReports: number;
    completedToday: number;
  }>;
}

export class MemStorage implements IStorage {
  private admins: Map<string, Admin>;
  private clients: Map<string, Client>;
  private reports: Map<string, Report>;
  private images: Map<string, Image>;

  constructor() {
    this.admins = new Map();
    this.clients = new Map();
    this.reports = new Map();
    this.images = new Map();
  }

  // Admin methods
  async getAdmin(id: string): Promise<Admin | undefined> {
    return this.admins.get(id);
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return Array.from(this.admins.values()).find(
      (admin) => admin.username === username
    );
  }

  async createAdmin(username: string, passwordHash: string): Promise<Admin> {
    const id = randomUUID();
    const admin: Admin = {
      id,
      username,
      passwordHash,
      createdAt: new Date(),
    };
    this.admins.set(id, admin);
    return admin;
  }

  // Client methods
  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientBySlug(slug: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(
      (client) => client.formSlug === slug
    );
  }

  async getAllClients(): Promise<ClientWithReportCount[]> {
    const clients = Array.from(this.clients.values());
    return clients.map(client => {
      const reportCount = Array.from(this.reports.values()).filter(
        r => r.clientId === client.id
      ).length;
      return { ...client, reportCount };
    });
  }

  async createClient(clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const id = randomUUID();
    const client: Client = {
      ...clientData,
      id,
      createdAt: new Date(),
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, clientData: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client | undefined> {
    const existing = this.clients.get(id);
    if (!existing) return undefined;

    const updated: Client = {
      ...existing,
      ...clientData,
    };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    const client = this.clients.get(id);
    if (!client) return false;

    // Delete all reports for this client (which cascades to images and files)
    const clientReports = Array.from(this.reports.values()).filter(
      r => r.clientId === id
    );
    for (const report of clientReports) {
      await this.deleteReport(report.id);
    }

    // Delete client logo if exists
    if (client.logoPath) {
      try {
        const fs = await import('fs/promises');
        await fs.unlink(client.logoPath);
      } catch (error) {
        console.error(`Failed to delete logo file ${client.logoPath}:`, error);
      }
    }

    return this.clients.delete(id);
  }

  // Report methods
  async getReport(id: string): Promise<ReportWithClient | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;

    const client = await this.getClient(report.clientId);
    if (!client) return undefined;

    const images = await this.getImagesByReport(id);
    return { ...report, client, images };
  }

  async getAllReports(): Promise<ReportWithClient[]> {
    const reports = Array.from(this.reports.values());
    const reportsWithData = await Promise.all(
      reports.map(async (report) => {
        const client = await this.getClient(report.clientId);
        const images = await this.getImagesByReport(report.id);
        return client ? { ...report, client, images } : null;
      })
    );
    return reportsWithData.filter((r): r is ReportWithClient => r !== null);
  }

  async getReportsByClient(clientId: string): Promise<ReportWithClient[]> {
    const reports = Array.from(this.reports.values()).filter(
      (r) => r.clientId === clientId
    );
    const client = await this.getClient(clientId);
    if (!client) return [];

    const reportsWithData = await Promise.all(
      reports.map(async (report) => {
        const images = await this.getImagesByReport(report.id);
        return { ...report, client, images };
      })
    );
    return reportsWithData;
  }

  async createReport(reportData: Omit<Report, 'id' | 'submittedAt' | 'processedAt'>): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      ...reportData,
      id,
      submittedAt: new Date(),
      processedAt: null,
    };
    this.reports.set(id, report);
    return report;
  }

  async updateReport(id: string, reportData: Partial<Omit<Report, 'id' | 'clientId' | 'submittedAt'>>): Promise<Report | undefined> {
    const existing = this.reports.get(id);
    if (!existing) return undefined;

    const updated: Report = {
      ...existing,
      ...reportData,
    };
    this.reports.set(id, updated);
    return updated;
  }

  async deleteReport(id: string): Promise<boolean> {
    const report = this.reports.get(id);
    if (!report) return false;

    // Delete associated images
    const imagesToDelete = Array.from(this.images.values()).filter(
      img => img.reportId === id
    );
    for (const img of imagesToDelete) {
      this.images.delete(img.id);
      // Delete image file if exists
      try {
        const fs = await import('fs/promises');
        await fs.unlink(img.filePath);
      } catch (error) {
        console.error(`Failed to delete image file ${img.filePath}:`, error);
      }
    }

    // Delete PDF file if exists
    if (report.pdfPath) {
      try {
        const fs = await import('fs/promises');
        await fs.unlink(report.pdfPath);
      } catch (error) {
        console.error(`Failed to delete PDF file ${report.pdfPath}:`, error);
      }
    }

    return this.reports.delete(id);
  }

  // Image methods
  async getImage(id: string): Promise<Image | undefined> {
    return this.images.get(id);
  }

  async getImagesByReport(reportId: string): Promise<Image[]> {
    return Array.from(this.images.values())
      .filter((img) => img.reportId === reportId)
      .sort((a, b) => a.imageOrder - b.imageOrder);
  }

  async createImage(imageData: Omit<Image, 'id' | 'uploadedAt'>): Promise<Image> {
    const id = randomUUID();
    const image: Image = {
      ...imageData,
      id,
      uploadedAt: new Date(),
    };
    this.images.set(id, image);
    return image;
  }

  async updateImage(id: string, imageData: Partial<Omit<Image, 'id' | 'reportId' | 'uploadedAt'>>): Promise<Image | undefined> {
    const existing = this.images.get(id);
    if (!existing) return undefined;

    const updated: Image = {
      ...existing,
      ...imageData,
    };
    this.images.set(id, updated);
    return updated;
  }

  // Stats methods
  async getStats(): Promise<{
    totalClients: number;
    totalReports: number;
    processingReports: number;
    completedToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allReports = Array.from(this.reports.values());

    return {
      totalClients: this.clients.size,
      totalReports: allReports.length,
      processingReports: allReports.filter((r) => r.status === "processing").length,
      completedToday: allReports.filter((r) => {
        const reportDate = new Date(r.submittedAt);
        reportDate.setHours(0, 0, 0, 0);
        return r.status === "completed" && reportDate.getTime() === today.getTime();
      }).length,
    };
  }
}

export class DbStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    const connection = neon(process.env.DATABASE_URL);
    this.db = drizzle(connection);
  }

  // Admin methods
  async getAdmin(id: string): Promise<Admin | undefined> {
    const result = await this.db.select().from(admins).where(eq(admins.id, id));
    return result[0];
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const result = await this.db.select().from(admins).where(eq(admins.username, username));
    return result[0];
  }

  async createAdmin(username: string, passwordHash: string): Promise<Admin> {
    const result = await this.db
      .insert(admins)
      .values({ username, passwordHash })
      .returning();
    return result[0];
  }

  // Client methods
  async getClient(id: string): Promise<Client | undefined> {
    const result = await this.db.select().from(clients).where(eq(clients.id, id));
    return result[0];
  }

  async getClientBySlug(slug: string): Promise<Client | undefined> {
    const result = await this.db.select().from(clients).where(eq(clients.formSlug, slug));
    return result[0];
  }

  async getAllClients(): Promise<ClientWithReportCount[]> {
    const allClients = await this.db.select().from(clients);
    const clientsWithCounts = await Promise.all(
      allClients.map(async (client) => {
        const reportCount = await this.db
          .select({ count: drizzleSql<number>`count(*)` })
          .from(reports)
          .where(eq(reports.clientId, client.id));
        return {
          ...client,
          reportCount: Number(reportCount[0]?.count || 0),
        };
      })
    );
    return clientsWithCounts;
  }

  async createClient(clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const result = await this.db
      .insert(clients)
      .values(clientData)
      .returning();
    return result[0];
  }

  async updateClient(id: string, clientData: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client | undefined> {
    const result = await this.db
      .update(clients)
      .set(clientData)
      .where(eq(clients.id, id))
      .returning();
    return result[0];
  }

  async deleteClient(id: string): Promise<boolean> {
    const client = await this.db.select().from(clients).where(eq(clients.id, id));
    if (!client[0]) return false;

    const clientData = client[0] as Client;

    // Delete all reports for this client (cascades to images and files)
    const clientReports = await this.db
      .select()
      .from(reports)
      .where(eq(reports.clientId, id));
    
    for (const report of clientReports) {
      await this.deleteReport((report as Report).id);
    }

    // Delete client logo if exists
    if (clientData.logoPath) {
      try {
        const fs = await import('fs/promises');
        await fs.unlink(clientData.logoPath);
      } catch (error) {
        console.error(`Failed to delete logo file ${clientData.logoPath}:`, error);
      }
    }

    // Delete client from database
    const deleteResult = await this.db.delete(clients).where(eq(clients.id, id)).returning();
    return deleteResult.length > 0;
  }

  // Report methods
  async getReport(id: string): Promise<ReportWithClient | undefined> {
    const reportResult = await this.db.select().from(reports).where(eq(reports.id, id));
    if (!reportResult[0]) return undefined;

    const report = reportResult[0] as Report;
    const clientResult = await this.getClient(report.clientId);
    if (!clientResult) return undefined;

    const imageList = await this.getImagesByReport(id);
    return { ...report, client: clientResult, images: imageList };
  }

  async getAllReports(): Promise<ReportWithClient[]> {
    const allReports = await this.db.select().from(reports);
    const reportsWithData = await Promise.all(
      allReports.map(async (report) => {
        const typedReport = report as Report;
        const client = await this.getClient(typedReport.clientId);
        const imageList = await this.getImagesByReport(typedReport.id);
        return client ? { ...typedReport, client, images: imageList } : null;
      })
    );
    return reportsWithData.filter((r): r is ReportWithClient => r !== null);
  }

  async getReportsByClient(clientId: string): Promise<ReportWithClient[]> {
    const clientReports = await this.db
      .select()
      .from(reports)
      .where(eq(reports.clientId, clientId));
    
    const client = await this.getClient(clientId);
    if (!client) return [];

    const reportsWithData = await Promise.all(
      clientReports.map(async (report) => {
        const typedReport = report as Report;
        const imageList = await this.getImagesByReport(typedReport.id);
        return { ...typedReport, client, images: imageList };
      })
    );
    return reportsWithData;
  }

  async createReport(reportData: Omit<Report, 'id' | 'submittedAt' | 'processedAt'>): Promise<Report> {
    const result = await this.db
      .insert(reports)
      .values({ ...reportData, processedAt: null })
      .returning();
    return result[0] as Report;
  }

  async updateReport(id: string, reportData: Partial<Omit<Report, 'id' | 'clientId' | 'submittedAt'>>): Promise<Report | undefined> {
    const result = await this.db
      .update(reports)
      .set(reportData)
      .where(eq(reports.id, id))
      .returning();
    return result[0] as Report | undefined;
  }

  async deleteReport(id: string): Promise<boolean> {
    const report = await this.db.select().from(reports).where(eq(reports.id, id));
    if (!report[0]) return false;

    const reportData = report[0] as Report;

    // Delete associated images from database and filesystem
    const imageList = await this.db.select().from(images).where(eq(images.reportId, id));
    for (const img of imageList) {
      try {
        const fs = await import('fs/promises');
        await fs.unlink(img.filePath);
      } catch (error) {
        console.error(`Failed to delete image file ${img.filePath}:`, error);
      }
    }
    await this.db.delete(images).where(eq(images.reportId, id));

    // Delete PDF file if exists
    if (reportData.pdfPath) {
      try {
        const fs = await import('fs/promises');
        await fs.unlink(reportData.pdfPath);
      } catch (error) {
        console.error(`Failed to delete PDF file ${reportData.pdfPath}:`, error);
      }
    }

    // Delete report from database
    const deleteResult = await this.db.delete(reports).where(eq(reports.id, id)).returning();
    return deleteResult.length > 0;
  }

  // Image methods
  async getImage(id: string): Promise<Image | undefined> {
    const result = await this.db.select().from(images).where(eq(images.id, id));
    return result[0];
  }

  async getImagesByReport(reportId: string): Promise<Image[]> {
    const result = await this.db
      .select()
      .from(images)
      .where(eq(images.reportId, reportId))
      .orderBy(images.imageOrder);
    return result;
  }

  async createImage(imageData: Omit<Image, 'id' | 'uploadedAt'>): Promise<Image> {
    const result = await this.db
      .insert(images)
      .values(imageData)
      .returning();
    return result[0];
  }

  async updateImage(id: string, imageData: Partial<Omit<Image, 'id' | 'reportId' | 'uploadedAt'>>): Promise<Image | undefined> {
    const result = await this.db
      .update(images)
      .set(imageData)
      .where(eq(images.id, id))
      .returning();
    return result[0];
  }

  // Stats methods
  async getStats(): Promise<{
    totalClients: number;
    totalReports: number;
    processingReports: number;
    completedToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const clientCount = await this.db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(clients);

    const reportCount = await this.db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(reports);

    const processingCount = await this.db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(reports)
      .where(eq(reports.status, "processing"));

    const completedTodayCount = await this.db
      .select({ count: drizzleSql<number>`count(*)` })
      .from(reports)
      .where(
        and(
          eq(reports.status, "completed"),
          gte(reports.submittedAt, today),
          lte(reports.submittedAt, tomorrow)
        )
      );

    return {
      totalClients: Number(clientCount[0]?.count || 0),
      totalReports: Number(reportCount[0]?.count || 0),
      processingReports: Number(processingCount[0]?.count || 0),
      completedToday: Number(completedTodayCount[0]?.count || 0),
    };
  }
}

export const storage = new DbStorage();
