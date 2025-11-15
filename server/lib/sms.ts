import twilio from 'twilio';

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
    
    const message = `Daily Site Report Reminder for ${companyName}\n\nPlease submit today's site report:\n${formUrl}\n\n- Trade Ease AI`;
    
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
