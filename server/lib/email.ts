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
  // Import storage to fetch email template settings
  const { storage } = await import("../storage");
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

  // Trade Ease AI logo (always shown at top)
  const tradeaseLogoUrl = `${baseUrl}/storage/assets/tradeease-logo.png`;
  
  // Client logo (shown below Trade Ease AI logo if exists)
  let clientLogoUrl: string | null = null;
  if (client.logoPath) {
    // Convert storage path to public URL
    if (client.logoPath.startsWith('public/')) {
      clientLogoUrl = `${baseUrl}/storage/${client.logoPath.substring(7)}`;
    } else if (client.logoPath.startsWith('storage/')) {
      clientLogoUrl = `${baseUrl}/${client.logoPath}`;
    } else {
      clientLogoUrl = `${baseUrl}/storage/${client.logoPath}`;
    }
  }

  // Sanitize brand color to prevent CSS injection (must be valid hex color)
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  const safeBrandColor = hexColorRegex.test(client.brandColor) ? client.brandColor : '#E8764B';

  // Load email template settings from database
  const emailSubject = await storage.getSetting('email_subject') || 'Daily Site Report';
  const emailHeaderText = await storage.getSetting('email_header_text') || 'A new daily site report has been generated';
  const emailFooterText = await storage.getSetting('email_footer_text') || 'This report was automatically generated and sent by TradeaseAI.';

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@tradeaseai.com",
    to: client.notificationEmails.join(", "),
    subject: `${emailSubject} - ${projectName} - ${reportDate.toLocaleDateString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <!-- Trade Ease AI Logo Header -->
        <div style="background-color: ${safeBrandColor}; padding: 20px; text-align: center;">
          <img src="${tradeaseLogoUrl}" alt="Trade Ease AI" style="max-width: 200px; height: auto; margin-bottom: 10px;" />
          <h1 style="color: white; margin: 0;">Daily Site Report</h1>
        </div>
        
        <!-- Client Logo Section -->
        ${clientLogoUrl ? `
        <div style="padding: 20px; text-align: center; background-color: #fafafa; border-bottom: 1px solid #e0e0e0;">
          <img src="${clientLogoUrl}" alt="${client.companyName}" style="max-width: 150px; max-height: 80px; object-fit: contain;" />
        </div>
        ` : ''}
        
        <div style="padding: 20px; background-color: #f5f5f5;">
          <h2 style="color: #333; margin-top: 0;">${projectName}</h2>
          <p style="color: #666; font-size: 16px;">
            ${emailHeaderText} for ${reportDate.toLocaleDateString()}.
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
            ${emailFooterText}
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
