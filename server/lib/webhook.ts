import FormData from 'form-data';
import { promises as fs } from 'fs';
import axios from 'axios';
import path from 'path';

const WEBHOOK_URL = 'https://tradease.app.n8n.cloud/webhook/0b7c5bc5-bee3-4192-8f73-3c80d9c44fbc';

// TradeEase AI logo as base64 (placeholder - you can replace with actual logo)
const TRADEASE_LOGO_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMjAwIDYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iNjAiIGZpbGw9IiNFODc2NEIiLz48dGV4dCB4PSIxMDAiIHk9IjM1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VHJhZGVFYXNlIEFJPC90ZXh0Pjwvc3ZnPg==';

interface WebhookPayload {
  reportId: string;
  clientId: string;
  clientName: string;
  projectName: string;
  reportDate: string;
  formData: any;
  aiAnalysis: any;
  pdfPath: string;
  notificationEmails: string[];
  clientLogoPath?: string | null;
  clientBrandColor?: string;
}

async function generateEmailHtml(payload: WebhookPayload): Promise<string> {
  // Convert client logo to base64 if it exists
  let clientLogoBase64 = '';
  if (payload.clientLogoPath) {
    try {
      const logoBuffer = await fs.readFile(payload.clientLogoPath);
      const ext = path.extname(payload.clientLogoPath).toLowerCase();
      let mimeType = 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.svg') mimeType = 'image/svg+xml';
      clientLogoBase64 = `data:${mimeType};base64,${logoBuffer.toString('base64')}`;
    } catch (error) {
      console.warn('[Webhook] Failed to load client logo:', error);
    }
  }

  const brandColor = payload.clientBrandColor || '#E8764B';
  const formattedDate = new Date(payload.reportDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Extract key data from form submission
  const worksPerformed = payload.formData?.worksPerformed || 'N/A';
  const labourOnSite = payload.formData?.labourOnSite || 'N/A';
  const hoursWorked = payload.formData?.hoursWorked || 'N/A';
  const materialsUsed = payload.formData?.materialsUsed || 'N/A';
  const safetyIncidents = payload.formData?.safetyIncidents || 'None reported';

  // Extract AI analysis highlights
  const weather = payload.aiAnalysis?.site_conditions?.weather || 'N/A';
  const totalWorkers = payload.aiAnalysis?.workforce?.total_workers || 'N/A';
  const manHours = payload.aiAnalysis?.workforce?.man_hours || 'N/A';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Site Report - ${payload.projectName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header with TradeEase AI branding -->
          <tr>
            <td style="background-color: ${brandColor}; padding: 30px 20px; text-align: center;">
              <img src="${TRADEASE_LOGO_BASE64}" alt="TradeEase AI" style="max-width: 200px; height: auto; margin-bottom: 15px;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Daily Site Report</h1>
            </td>
          </tr>

          <!-- Client Logo (if exists) -->
          ${clientLogoBase64 ? `
          <tr>
            <td style="padding: 20px; text-align: center; background-color: #fafafa; border-bottom: 1px solid #e0e0e0;">
              <img src="${clientLogoBase64}" alt="${payload.clientName}" style="max-width: 150px; max-height: 80px; object-fit: contain;">
            </td>
          </tr>
          ` : ''}

          <!-- Report Summary -->
          <tr>
            <td style="padding: 30px 20px;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">${payload.projectName}</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                A new daily site report has been generated and analyzed by TradeEase AI for ${formattedDate}.
              </p>

              <!-- Report Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <tr>
                  <td>
                    <p style="margin: 8px 0; color: #555; font-size: 14px;">
                      <strong style="color: #333;">Company:</strong> ${payload.clientName}
                    </p>
                    <p style="margin: 8px 0; color: #555; font-size: 14px;">
                      <strong style="color: #333;">Project:</strong> ${payload.projectName}
                    </p>
                    <p style="margin: 8px 0; color: #555; font-size: 14px;">
                      <strong style="color: #333;">Report Date:</strong> ${formattedDate}
                    </p>
                    <p style="margin: 8px 0; color: #555; font-size: 14px;">
                      <strong style="color: #333;">Report ID:</strong> ${payload.reportId.slice(0, 8).toUpperCase()}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- AI Analysis Highlights -->
              <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid ${brandColor}; padding-bottom: 8px;">
                📊 AI Analysis Highlights
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 10px 0;">
                    <p style="margin: 5px 0; color: #555; font-size: 14px;">
                      <strong style="color: #333;">Weather:</strong> ${weather}
                    </p>
                    <p style="margin: 5px 0; color: #555; font-size: 14px;">
                      <strong style="color: #333;">Total Workers:</strong> ${totalWorkers}
                    </p>
                    <p style="margin: 5px 0; color: #555; font-size: 14px;">
                      <strong style="color: #333;">Man-Hours:</strong> ${manHours}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Works Performed -->
              <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid ${brandColor}; padding-bottom: 8px;">
                🔨 Works Performed
              </h3>
              <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; white-space: pre-wrap;">${worksPerformed}</p>

              <!-- Labour & Hours -->
              <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid ${brandColor}; padding-bottom: 8px;">
                👷 Labour & Hours
              </h3>
              <p style="margin: 5px 0; color: #555; font-size: 14px;">
                <strong style="color: #333;">Labour on Site:</strong> ${labourOnSite}
              </p>
              <p style="margin: 5px 0 20px 0; color: #555; font-size: 14px;">
                <strong style="color: #333;">Hours Worked:</strong> ${hoursWorked}
              </p>

              <!-- Materials Used -->
              <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid ${brandColor}; padding-bottom: 8px;">
                📦 Materials Used
              </h3>
              <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; white-space: pre-wrap;">${materialsUsed}</p>

              <!-- Safety -->
              <h3 style="color: #333; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid ${brandColor}; padding-bottom: 8px;">
                ⚠️ Safety Incidents
              </h3>
              <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">${safetyIncidents}</p>

              <!-- PDF Attachment Notice -->
              <div style="background-color: #e8f4fd; border-left: 4px solid #2196F3; padding: 15px; margin-top: 30px; border-radius: 4px;">
                <p style="margin: 0; color: #1976D2; font-size: 14px;">
                  <strong>📄 Complete Report:</strong> The attached PDF contains the full detailed report with AI analysis, site photos, and comprehensive documentation.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; color: #999; font-size: 12px;">
                This report was automatically generated and analyzed by <strong>TradeEase AI</strong>
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                Powered by GPT-5 Vision • © ${new Date().getFullYear()} TradeEase AI
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return html;
}

export async function sendToWebhook(payload: WebhookPayload): Promise<void> {
  try {
    console.log(`[Webhook] Sending report ${payload.reportId} to n8n webhook...`);

    // Generate email HTML with base64 images
    const emailHtml = await generateEmailHtml(payload);

    const form = new FormData();
    
    // Add PDF file as attachment
    const pdfBuffer = await fs.readFile(payload.pdfPath);
    form.append('pdf', pdfBuffer, {
      filename: `report_${payload.reportId}.pdf`,
      contentType: 'application/pdf',
    });

    // Add all the report data as JSON string
    const reportData = {
      reportId: payload.reportId,
      clientId: payload.clientId,
      clientName: payload.clientName,
      projectName: payload.projectName,
      reportDate: payload.reportDate,
      formData: payload.formData,
      aiAnalysis: payload.aiAnalysis,
      notificationEmails: payload.notificationEmails,
      emailHtml: emailHtml,
    };

    form.append('data', JSON.stringify(reportData, null, 2));

    console.log(`[Webhook] Payload size: PDF + ${JSON.stringify(reportData).length} bytes of JSON data`);

    const response = await axios.post(WEBHOOK_URL, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    console.log(`[Webhook] Successfully sent report ${payload.reportId} to n8n (status: ${response.status})`);
  } catch (error: any) {
    console.error(`[Webhook] Failed to send to n8n:`, error.message);
    if (error.response) {
      console.error(`[Webhook] Response status: ${error.response.status}`);
      console.error(`[Webhook] Response data:`, error.response.data);
    }
    // Don't throw - we don't want to fail the whole process if webhook fails
  }
}
