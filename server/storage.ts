import { type Admin, type Client, type Report, type Image, type ClientWithReportCount, type ReportWithClient } from "@shared/schema";
import { randomUUID } from "crypto";

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

export const storage = new MemStorage();
