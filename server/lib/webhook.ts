import FormData from 'form-data';
import { promises as fs } from 'fs';
import axios from 'axios';

const WEBHOOK_URL = 'https://tradease.app.n8n.cloud/webhook/0b7c5bc5-bee3-4192-8f73-3c80d9c44fbc';

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
}

export async function sendToWebhook(payload: WebhookPayload): Promise<void> {
  try {
    console.log(`[Webhook] Sending report ${payload.reportId} to n8n webhook...`);

    const form = new FormData();
    
    // Add PDF file as attachment
    const pdfBuffer = await fs.readFile(payload.pdfPath);
    form.append('pdf', pdfBuffer, {
      filename: `report_${payload.reportId}.pdf`,
      contentType: 'application/pdf',
    });

    // Add all the report data as JSON
    form.append('reportId', payload.reportId);
    form.append('clientId', payload.clientId);
    form.append('clientName', payload.clientName);
    form.append('projectName', payload.projectName);
    form.append('reportDate', payload.reportDate);
    form.append('formData', JSON.stringify(payload.formData));
    form.append('aiAnalysis', JSON.stringify(payload.aiAnalysis));
    form.append('notificationEmails', JSON.stringify(payload.notificationEmails));

    const response = await axios.post(WEBHOOK_URL, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    console.log(`[Webhook] Successfully sent report ${payload.reportId} to n8n (status: ${response.status})`);
  } catch (error: any) {
    console.error(`[Webhook] Failed to send to n8n:`, error.message);
    // Don't throw - we don't want to fail the whole process if webhook fails
  }
}
