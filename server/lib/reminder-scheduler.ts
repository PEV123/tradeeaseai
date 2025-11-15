import * as cron from 'node-cron';
import { SMSService } from './sms';
import { storage } from '../storage';

export class ReminderScheduler {
  private smsService: SMSService | null;
  private sentToday: Set<string> = new Set();
  private cronJob: cron.ScheduledTask | null = null;
  private resetJob: cron.ScheduledTask | null = null;

  constructor(smsService: SMSService | null) {
    this.smsService = smsService;
  }

  start() {
    if (!this.smsService) {
      console.log('SMS service not configured. Reminder scheduler will not start.');
      return;
    }

    // Run every minute to check if any reminders need to be sent
    // Cron expression: "* * * * *" means every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.checkAndSendReminders();
    }, {
      timezone: 'Australia/Sydney' // Australian Eastern Time
    });

    // Reset the sent tracking at midnight AEST
    this.resetJob = cron.schedule('0 0 * * *', () => {
      console.log('Resetting daily SMS reminder tracking (AEST midnight)');
      this.sentToday.clear();
    }, {
      timezone: 'Australia/Sydney'
    });

    console.log('SMS reminder scheduler started (Australian Eastern Time)');
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    if (this.resetJob) {
      this.resetJob.stop();
      this.resetJob = null;
    }
    console.log('SMS reminder scheduler stopped');
  }

  private async checkAndSendReminders() {
    try {
      // Get current time in Australian Eastern Time (HH:MM format)
      const now = new Date();
      const aestTime = new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Sydney',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(now);

      // Get current day of week in AEST (lowercase)
      const currentDay = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Australia/Sydney',
        weekday: 'long'
      }).format(now).toLowerCase();

      // Find all active clients
      const allClients = await storage.getAllClients();

      for (const client of allClients) {
        // Check if client has notification settings configured
        if (!client.active || !client.notificationPhoneNumber || !client.notificationTime) {
          continue;
        }

        // Check if today is in the selected notification days
        // If notificationDays is null/empty, send every day (backward compatible)
        if (client.notificationDays && client.notificationDays.length > 0) {
          if (!client.notificationDays.includes(currentDay)) {
            continue; // Skip this client - not a notification day
          }
        }

        // Check if it's time to send the reminder
        if (client.notificationTime === aestTime) {
          const reminderKey = `${client.id}-${this.getToday()}`;
          
          // Check if we've already sent a reminder today
          if (!this.sentToday.has(reminderKey)) {
            console.log(`Sending SMS reminder to ${client.companyName} at ${aestTime} AEST on ${currentDay}`);
            
            const success = await this.smsService!.sendDailyReminder(
              client.notificationPhoneNumber,
              client.formSlug,
              client.companyName
            );

            if (success) {
              this.sentToday.add(reminderKey);
              console.log(`SMS reminder sent successfully to ${client.companyName}`);
            } else {
              console.error(`Failed to send SMS reminder to ${client.companyName}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking and sending reminders:', error);
    }
  }

  private getToday(): string {
    // Get today's date in AEST as YYYY-MM-DD
    const now = new Date();
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Australia/Sydney',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
  }
}

export function createReminderScheduler(smsService: SMSService | null): ReminderScheduler {
  return new ReminderScheduler(smsService);
}
