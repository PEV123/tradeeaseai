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

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@tradeaseai.com",
    to: client.notificationEmails.join(", "),
    subject: `Daily Site Report - ${projectName} - ${reportDate.toLocaleDateString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${client.brandColor}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">TradeaseAI Daily Report</h1>
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
