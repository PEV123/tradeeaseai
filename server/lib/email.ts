import nodemailer from "nodemailer";
import { type Client } from "@shared/schema";
import fs from "fs/promises";
import path from "path";
import { downloadFile, resolveStoragePaths } from "./storage-service";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendReportEmail(
  client: Client,
  reportId: string,
  projectName: string,
  reportDate: Date,
  pdfPath: string
): Promise<void> {
  // Resolve storage paths using unified helper
  let pdfBuffer: Buffer;
  const paths = resolveStoragePaths(pdfPath);
  if (paths.objectPath) {
    try {
      pdfBuffer = await downloadFile(paths.objectPath);
    } catch {
      const fullPath = path.isAbsolute(paths.filesystemPath) 
        ? paths.filesystemPath 
        : path.join(process.cwd(), paths.filesystemPath);
      pdfBuffer = await fs.readFile(fullPath);
    }
  } else {
    const fullPath = path.isAbsolute(paths.filesystemPath) 
      ? paths.filesystemPath 
      : path.join(process.cwd(), paths.filesystemPath);
    pdfBuffer = await fs.readFile(fullPath);
  }

  // Helper to normalize base URL: ensures scheme and removes trailing slashes
  function normalizeBaseUrl(url: string): string {
    let normalized = url.trim();
    // Add https:// scheme if missing
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }
    // Remove trailing slashes
    normalized = normalized.replace(/\/+$/, '');
    return normalized;
  }

  // Use Trade Ease AI logo from object storage (persistent public URL)
  // Logo is uploaded to public/assets/tradeease-logo.png and accessible at /storage/assets/tradeease-logo.png
  // Determine base URL: use PUBLIC_BASE_URL, REPLIT_DOMAINS, or fall back to dev domain
  let baseUrl: string;
  if (process.env.PUBLIC_BASE_URL) {
    baseUrl = normalizeBaseUrl(process.env.PUBLIC_BASE_URL);
  } else if (process.env.REPLIT_DOMAINS) {
    // REPLIT_DOMAINS format: "domain1.replit.app,domain2.replit.dev"
    const domains = process.env.REPLIT_DOMAINS.split(',').map(d => d.trim()).filter(d => d);
    if (domains.length > 0) {
      baseUrl = normalizeBaseUrl(domains[0]);
    } else {
      baseUrl = 'http://localhost:5000';
    }
  } else if (process.env.REPLIT_DEV_DOMAIN) {
    baseUrl = normalizeBaseUrl(process.env.REPLIT_DEV_DOMAIN);
  } else {
    // Development fallback
    baseUrl = 'http://localhost:5000';
  }
  const logoUrl = `${baseUrl}/storage/assets/tradeease-logo.png`;

  // Sanitize brand color to prevent CSS injection (must be valid hex color)
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  const safeBrandColor = hexColorRegex.test(client.brandColor) ? client.brandColor : '#E8764B';

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@tradeaseai.com",
    to: client.notificationEmails.join(", "),
    subject: `Daily Site Report - ${projectName} - ${reportDate.toLocaleDateString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${safeBrandColor}; padding: 20px; text-align: center;">
          <img src="${logoUrl}" alt="Trade Ease AI" style="max-width: 300px; height: auto; margin-bottom: 10px;" />
          <h1 style="color: white; margin: 0;">Daily Report</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f5f5f5;">
          <h2 style="color: #333; margin-top: 0;">${projectName}</h2>
          <p style="color: #666; font-size: 16px;">
            A new daily site report has been generated for ${reportDate.toLocaleDateString()}.
          </p>
          
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Company:</strong> ${client.companyName}</p>
            <p style="margin: 5px 0;"><strong>Project:</strong> ${projectName}</p>
            <p style="margin: 5px 0;"><strong>Report Date:</strong> ${reportDate.toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Report ID:</strong> ${reportId.slice(0, 8)}</p>
          </div>
          
          <p style="color: #666;">
            The attached PDF contains the complete daily site report with AI-analyzed data,
            workforce information, materials used, and site photos.
          </p>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            This report was automatically generated and sent by TradeaseAI.
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `report-${reportId.slice(0, 8)}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  // Only send email if SMTP credentials are configured
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${client.notificationEmails.join(", ")}`);
  } else {
    console.log(`⚠️ Email not sent (SMTP not configured). Would have sent to: ${client.notificationEmails.join(", ")}`);
  }
}
