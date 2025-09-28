#!/usr/bin/env node

console.log('[EMAIL] Starting email service...');

let emailsSent = 0;
let emailsQueued = 3;

const emailTypes = [
  'welcome',
  'password-reset',
  'notification',
  'newsletter',
  'receipt',
  'reminder',
  'verification',
  'alert',
];

const providers = ['SendGrid', 'Mailgun', 'AWS SES', 'Postmark'];
const statuses = ['delivered', 'bounced', 'deferred', 'failed'];

function simulateEmailActivity() {
  if (Math.random() > 0.5 && emailsQueued > 0) {
    const emailType = emailTypes[Math.floor(Math.random() * emailTypes.length)];
    const emailId = Math.random().toString(36).substring(2, 10);
    const recipient = `user${Math.floor(Math.random() * 1000)}@example.com`;
    const provider = providers[Math.floor(Math.random() * providers.length)];

    console.log(`[EMAIL] Sending ${emailType} email to ${recipient} (ID: ${emailId})`);
    console.log(`[EMAIL] Using provider: ${provider}`);

    emailsQueued--;

    setTimeout(() => {
      const status = Math.random() > 0.9 ? statuses[Math.floor(Math.random() * 4)] : 'delivered';
      if (status === 'delivered') {
        emailsSent++;
        console.log(`[EMAIL] Email ${emailId} delivered successfully`);
      } else {
        console.log(`[EMAIL] Email ${emailId} ${status}: ${getStatusReason(status)}`);
      }
    }, Math.random() * 3000 + 1000);
  }

  if (Math.random() > 0.7) {
    const newEmails = Math.floor(Math.random() * 4) + 1;
    emailsQueued += newEmails;
    console.log(`[EMAIL] ${newEmails} new email(s) queued for sending`);
  }

  if (Math.random() > 0.85) {
    const dailyLimit = 1000;
    const remaining = dailyLimit - emailsSent;
    console.log(`[EMAIL] Daily stats: ${emailsSent} sent, ${remaining} remaining quota, ${emailsQueued} queued`);
  }
}

function getStatusReason(status) {
  const reasons = {
    'bounced': 'Invalid email address',
    'deferred': 'Temporary server issue',
    'failed': 'Rate limit exceeded'
  };
  return reasons[status] || 'Unknown error';
}

console.log('[EMAIL] Connected to SMTP server');
console.log('[EMAIL] Rate limit: 1000 emails/day');
console.log(`[EMAIL] Email service ready (${emailsQueued} emails queued)`);

setInterval(simulateEmailActivity, 1500 + Math.random() * 2500);

process.on('SIGTERM', () => {
  console.log('[EMAIL] Received SIGTERM, finishing queued emails...');
  console.log('[EMAIL] Email service stopped');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[EMAIL] Received SIGINT, finishing queued emails...');
  console.log('[EMAIL] Email service stopped');
  process.exit(0);
});