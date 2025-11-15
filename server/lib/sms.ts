import twilio from 'twilio';
import { storage } from '../storage';

export const DEFAULT_SMS_TEMPLATE = `Daily Site Report Reminder for {companyName}

Please submit today's site report:
{formUrl}

- Trade Ease AI`;

export interface SMSConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export class SMSService {
  private client: any;
  private fromNumber: string;

  constructor(config: SMSConfig) {
    this.client = twilio(config.accountSid, config.authToken);
    this.fromNumber = config.phoneNumber;
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: to
      });
      
      console.log(`SMS sent successfully to ${to}, SID: ${result.sid}`);
      return true;
    } catch (error) {
      console.error(`Failed to send SMS to ${to}:`, error);
      return false;
    }
  }

  async sendDailyReminder(phoneNumber: string, formSlug: string, companyName: string): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const formUrl = `${baseUrl}/form/${formSlug}`;
    
    // Get custom SMS template from settings, or use default
    let template = await storage.getSetting('sms_template');
    if (!template) {
      template = DEFAULT_SMS_TEMPLATE;
    }
    
    // Replace template variables
    const message = template
      .replace(/\{companyName\}/g, companyName)
      .replace(/\{formUrl\}/g, formUrl);
    
    return this.sendSMS(phoneNumber, message);
  }

  private getBaseUrl(): string {
    if (process.env.PUBLIC_BASE_URL) {
      return this.normalizeBaseUrl(process.env.PUBLIC_BASE_URL);
    } else if (process.env.REPLIT_DOMAINS) {
      const domains = process.env.REPLIT_DOMAINS.split(',').map(d => d.trim()).filter(d => d);
      if (domains.length > 0) {
        return this.normalizeBaseUrl(domains[0]);
      }
    } else if (process.env.REPLIT_DEV_DOMAIN) {
      return this.normalizeBaseUrl(process.env.REPLIT_DEV_DOMAIN);
    }
    return 'http://localhost:5000';
  }

  private normalizeBaseUrl(url: string): string {
    let normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }
    normalized = normalized.replace(/\/+$/, '');
    return normalized;
  }
}

export function createSMSService(): SMSService | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    console.warn('Twilio credentials not configured. SMS functionality will be disabled.');
    return null;
  }

  return new SMSService({
    accountSid,
    authToken,
    phoneNumber
  });
}

// Helper function to send a daily reminder (for test SMS and scheduler)
export async function sendDailyReminder(client: { formSlug: string; companyName: string; notificationPhoneNumber?: string | null }, phoneNumber?: string): Promise<void> {
  const smsService = createSMSService();
  if (!smsService) {
    throw new Error('SMS service not configured. Please check Twilio credentials.');
  }

  const targetPhone = phoneNumber || client.notificationPhoneNumber;
  if (!targetPhone) {
    throw new Error('No phone number provided');
  }

  const success = await smsService.sendDailyReminder(
    targetPhone,
    client.formSlug,
    client.companyName
  );

  if (!success) {
    throw new Error('Failed to send SMS');
  }
}
