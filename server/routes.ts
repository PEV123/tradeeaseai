import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { initializeAdmin, hashPassword, verifyPassword, generateToken, verifyToken } from "./lib/auth";
import { analyzeReport } from "./lib/openai";
import { generatePDF } from "./lib/pdf-generator";
import { sendReportEmail } from "./lib/email";
import { loginSchema, insertClientSchema, insertReportSchema, updateSettingsSchema } from "@shared/schema";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

// Configure multer for file uploads
const storage_multer = multer.memoryStorage();
const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware to verify admin token
function requireAuth(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Invalid token" });
  }

  (req as any).adminId = decoded.adminId;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default admin
  await initializeAdmin();

  // Create storage directories
  await fs.mkdir(path.join(process.cwd(), 'storage', 'logos'), { recursive: true });
  await fs.mkdir(path.join(process.cwd(), 'storage', 'images'), { recursive: true });
  await fs.mkdir(path.join(process.cwd(), 'storage', 'pdfs'), { recursive: true });

  // ========== PUBLIC ROUTES ==========

  // Get client by form slug (public)
  app.get("/api/public/client/:slug", async (req: Request, res: Response) => {
    try {
      const client = await storage.getClientBySlug(req.params.slug);
      
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }

      res.json(client);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Submit report (public)
  app.post("/api/reports/submit", upload.any(), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      const data = JSON.parse(req.body.data);
      
      // Validate report data
      const validated = insertReportSchema.parse(data);

      // Create report
      const report = await storage.createReport({
        clientId: validated.clientId,
        reportDate: new Date(validated.reportDate),
        projectName: validated.projectName,
        formData: {
          worksPerformed: validated.worksPerformed,
          labourOnSite: validated.labourOnSite,
          plantMachinery: validated.plantMachinery || "",
          hoursWorked: validated.hoursWorked,
          materialsUsed: validated.materialsUsed || "",
          delaysWeather: validated.delaysWeather || "",
          safetyIncidents: validated.safetyIncidents || "None reported",
        },
        aiAnalysis: null,
        pdfPath: null,
        status: "processing",
      });

      // Process and save images
      const imageBase64Array: string[] = [];
      const imagePaths: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Determine file extension from mimetype
          let ext = 'jpg';
          if (file.mimetype === 'image/png') ext = 'png';
          else if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') ext = 'jpg';
          else if (file.mimetype === 'image/webp') ext = 'webp';
          
          const fileName = `${report.id}_${i}_${Date.now()}.${ext}`;
          const filePath = path.join('storage', 'images', fileName);

          // Try to process with Sharp for optimization, fallback to raw save if it fails
          try {
            await sharp(file.buffer)
              .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 85 })
              .toFile(filePath);
          } catch (sharpError) {
            console.warn(`Sharp processing failed for image ${i}, saving raw file:`, sharpError);
            // Fallback: save raw buffer directly
            const fs = await import('fs/promises');
            await fs.writeFile(filePath, file.buffer);
          }

          // Convert to base64 for GPT-5
          const base64 = file.buffer.toString('base64');
          imageBase64Array.push(base64);
          imagePaths.push(filePath);

          // Save image record
          await storage.createImage({
            reportId: report.id,
            filePath,
            fileName,
            aiDescription: null,
            imageOrder: i,
          });
        } catch (imageError) {
          console.error(`Error processing image ${i}:`, imageError);
          // Continue processing other images even if one fails
        }
      }

      // Process in background
      (async () => {
        try {
          // Get client
          const client = await storage.getClient(validated.clientId);
          if (!client) throw new Error("Client not found");

          // Analyze with GPT-5
          const aiAnalysis = await analyzeReport(validated, imageBase64Array);

          // Update image descriptions from AI
          const images = await storage.getImagesByReport(report.id);
          if (aiAnalysis.photo_documentation?.image_descriptions) {
            for (let i = 0; i < images.length; i++) {
              const description = aiAnalysis.photo_documentation.image_descriptions[i];
              if (description) {
                await storage.updateImage(images[i].id, { aiDescription: description });
              }
            }
          }

          // Update report with AI analysis
          await storage.updateReport(report.id, {
            aiAnalysis,
            processedAt: new Date(),
          });

          // Generate PDF
          const updatedReport = await storage.getReport(report.id);
          if (updatedReport) {
            const pdfPath = await generatePDF(updatedReport, client, images);

            // Update report with PDF path and mark as completed
            await storage.updateReport(report.id, {
              pdfPath,
              status: "completed",
            });

            // Send email notification
            await sendReportEmail(client, report.id, validated.projectName, new Date(validated.reportDate), pdfPath);
          }
        } catch (error: any) {
          console.error("Error processing report:", error);
          await storage.updateReport(report.id, {
            status: "failed",
            processedAt: new Date(),
          });
        }
      })();

      res.json({ success: true, reportId: report.id });
    } catch (error: any) {
      console.error("Error submitting report:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ========== ADMIN ROUTES ==========

  // Admin login
  app.post("/api/admin/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }

      const isValid = await verifyPassword(password, admin.passwordHash);
      if (!isValid) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }

      const token = generateToken(admin.id);

      res.json({
        success: true,
        token,
        admin: {
          id: admin.id,
          username: admin.username,
        },
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  // Get dashboard stats
  app.get("/api/admin/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all clients
  app.get("/api/admin/clients", requireAuth, async (req: Request, res: Response) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get client by ID
  app.get("/api/admin/clients/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get reports for a specific client
  app.get("/api/admin/clients/:id/reports", requireAuth, async (req: Request, res: Response) => {
    try {
      const reports = await storage.getReportsByClient(req.params.id);
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete client
  app.delete("/api/admin/clients/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteClient(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Client not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting client:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create client
  app.post("/api/admin/clients", requireAuth, upload.single('logo'), async (req: Request, res: Response) => {
    try {
      const data = JSON.parse(req.body.data);
      const validated = insertClientSchema.parse(data);

      let logoPath: string | null = null;

      // Process logo if uploaded
      if (req.file) {
        const fileName = `${Date.now()}_${req.file.originalname}`;
        logoPath = path.join('storage', 'logos', fileName);

        await sharp(req.file.buffer)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .png()
          .toFile(logoPath);
      }

      const client = await storage.createClient({
        companyName: validated.companyName,
        contactName: validated.contactName,
        contactEmail: validated.contactEmail,
        notificationEmails: validated.notificationEmails,
        logoPath,
        brandColor: validated.brandColor,
        formSlug: validated.formSlug,
        active: validated.active,
      });

      res.json(client);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update client
  app.put("/api/admin/clients/:id", requireAuth, upload.single('logo'), async (req: Request, res: Response) => {
    try {
      const data = JSON.parse(req.body.data);
      const validated = insertClientSchema.parse(data);

      const existing = await storage.getClient(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Client not found" });
      }

      let logoPath = existing.logoPath;

      // Process new logo if uploaded
      if (req.file) {
        const fileName = `${Date.now()}_${req.file.originalname}`;
        logoPath = path.join('storage', 'logos', fileName);

        await sharp(req.file.buffer)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .png()
          .toFile(logoPath);
      }

      const updated = await storage.updateClient(req.params.id, {
        companyName: validated.companyName,
        contactName: validated.contactName,
        contactEmail: validated.contactEmail,
        notificationEmails: validated.notificationEmails,
        logoPath,
        brandColor: validated.brandColor,
        formSlug: validated.formSlug,
        active: validated.active,
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get all reports
  app.get("/api/admin/reports", requireAuth, async (req: Request, res: Response) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get report by ID (protected)
  app.get("/api/reports/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download PDF (protected)
  app.get("/api/reports/download/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const report = await storage.getReport(req.params.id);
      if (!report || !report.pdfPath) {
        return res.status(404).json({ error: "PDF not found" });
      }

      res.download(report.pdfPath, `report-${req.params.id}.pdf`);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete report
  app.delete("/api/admin/reports/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteReport(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting report:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all settings
  app.get("/api/admin/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      // Don't expose raw API keys - only return status
      const hasApiKey = Boolean(await storage.getSetting('openai_api_key'));
      res.json({ openai_api_key: hasApiKey ? '***configured***' : null });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update settings
  app.put("/api/admin/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validated = updateSettingsSchema.parse(req.body);
      
      if (validated.openaiApiKey !== undefined) {
        // Normalize: trim whitespace and convert empty strings to null
        const normalizedKey = validated.openaiApiKey.trim() || null;
        
        // Reject whitespace-only values
        if (normalizedKey === null || normalizedKey.length === 0) {
          return res.status(400).json({ error: "OpenAI API key cannot be empty or whitespace-only" });
        }
        
        await storage.setSetting('openai_api_key', normalizedKey);
      }
      
      // Don't expose the raw API key in response - just return status
      const hasApiKey = Boolean(await storage.getSetting('openai_api_key'));
      res.json({ openai_api_key: hasApiKey ? '***configured***' : null });
    } catch (error: any) {
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid settings data", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Serve uploaded files
  app.use('/storage', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
  app.use('/storage', express.static(path.join(process.cwd(), 'storage')));

  const httpServer = createServer(app);
  return httpServer;
}
