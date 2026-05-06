import { Resend } from 'resend';
import twilio from 'twilio';
import { config } from '../config';
import { getSupabaseClient } from '../db/supabase';

// Initialize clients only if credentials are provided
const resendClient = config.EMAIL_API_KEY ? new Resend(config.EMAIL_API_KEY) : null;
const emailInitialized = !!resendClient;

const twilioInitialized = config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN ? true : false;
const twilioClient = twilioInitialized
  ? twilio(config.TWILIO_ACCOUNT_SID!, config.TWILIO_AUTH_TOKEN!)
  : null;

const supabase = getSupabaseClient();

// ============================================================
// Notification Templates
// ============================================================

export type NotificationTemplate =
  | 'heartbeat_received'
  | 'deposit_received'
  | 'expiry_warning'
  | 'vault_expired'
  | 'claim_executed'
  | 'vault_cancelled';

interface TemplateData {
  vaultAddress: string;
  ownerAddress?: string;
  amount?: string;
  timeRemaining?: string;
  expiryDate?: string;
  explorerUrl?: string;
  heirName?: string;
  [key: string]: string | undefined;
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

const emailTemplates: Record<NotificationTemplate, (data: TemplateData) => { subject: string; html: string; text: string }> = {
  heartbeat_received: (data) => ({
    subject: 'HERITA — Heartbeat Confirmed',
    html: buildEmailHtml('Heartbeat Confirmed', '#34D399', `
      <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px 0;">Your vault has received a heartbeat signal. The inactivity timer has been reset.</p>
      ${infoBox('Vault Address', data.vaultAddress)}
      ${data.timeRemaining ? infoBox('Time Until Next Action Required', data.timeRemaining, '#D4AF37') : ''}
    `, data.explorerUrl),
    text: `HERITA — Heartbeat Confirmed\nVault: ${data.vaultAddress}\n${data.timeRemaining ? `Next action in: ${data.timeRemaining}` : ''}`,
  }),

  deposit_received: (data) => ({
    subject: 'HERITA — Deposit Received',
    html: buildEmailHtml('Deposit Received', '#34D399', `
      <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px 0;">New funds have been deposited into your vault.</p>
      ${infoBox('Amount', `${data.amount || '0'} SOL`, '#34D399', '24px')}
      ${infoBox('Vault Address', data.vaultAddress)}
    `, data.explorerUrl, 'View Transaction'),
    text: `HERITA — Deposit Received\nAmount: ${data.amount || '0'} SOL\nVault: ${data.vaultAddress}`,
  }),

  expiry_warning: (data) => ({
    subject: 'HERITA — Vault Expiration Warning',
    html: buildEmailHtml('⚠️ Expiration Warning', '#FBBF24', `
      <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px 0;">Your vault is approaching its inactivity threshold. If no heartbeat is sent before the timer expires, your heirs will be able to claim the assets.</p>
      ${infoBox('Time Remaining', data.timeRemaining || 'Unknown', '#FBBF24', '24px')}
      ${infoBox('Vault Address', data.vaultAddress)}
      <div style="background: #161F2E; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-top: 16px;">
        <p style="margin: 0; color: #94A3B8; font-size: 14px; line-height: 1.6;">
          <strong style="color: #F8FAFC;">Action Required:</strong> Send a heartbeat at <a href="https://herita.xyz/vaults" style="color: #D4AF37; text-decoration: none;">herita.xyz/vaults</a>
        </p>
      </div>
    `, undefined, undefined, '#FBBF24'),
    text: `HERITA — Vault Expiration Warning\nTime Remaining: ${data.timeRemaining || 'Unknown'}\nVault: ${data.vaultAddress}\nAction: Send heartbeat at herita.xyz/vaults`,
  }),

  vault_expired: (data) => ({
    subject: 'HERITA — Vault Expired — Claim Available',
    html: buildEmailHtml('Vault Expired — Claim Available', '#FB7185', `
      <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px 0;">${data.heirName ? `Hello ${data.heirName},` : 'Hello,'} The inactivity period for this vault has expired. You are now eligible to claim your allocated assets.</p>
      ${infoBox('Vault Address', data.vaultAddress)}
      ${data.amount ? infoBox('Your Allocation', `${data.amount} SOL`, '#34D399', '24px') : ''}
    `, 'https://herita.xyz/heir', 'Execute Claim', '#FB7185'),
    text: `HERITA — Vault Expired\n${data.heirName ? `Hello ${data.heirName},` : ''} Claim your assets at herita.xyz/heir\nVault: ${data.vaultAddress}`,
  }),

  claim_executed: (data) => ({
    subject: 'HERITA — Claim Executed',
    html: buildEmailHtml('Claim Executed Successfully', '#34D399', `
      <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px 0;">The claim for this vault has been executed. Assets have been distributed to the designated heirs.</p>
      ${infoBox('Vault Address', data.vaultAddress)}
    `, data.explorerUrl, 'View on Explorer', '#34D399'),
    text: `HERITA — Claim Executed\nVault: ${data.vaultAddress}\n${data.explorerUrl || ''}`,
  }),

  vault_cancelled: (data) => ({
    subject: 'HERITA — Vault Cancelled',
    html: buildEmailHtml('Vault Cancelled', '#94A3B8', `
      <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px 0;">This vault has been cancelled by the owner. All remaining funds have been returned.</p>
      ${infoBox('Vault Address', data.vaultAddress)}
    `, undefined, undefined, '#94A3B8'),
    text: `HERITA — Vault Cancelled\nVault: ${data.vaultAddress}`,
  }),
};

// Email HTML helpers
function infoBox(label: string, value: string, color = '#F8FAFC', fontSize = '14px'): string {
  return `<div style="background: #161F2E; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
    <p style="margin: 0 0 8px 0; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">${label}</p>
    <p style="margin: 0; font-family: 'Geist Mono', monospace; font-size: ${fontSize}; color: ${color}; font-weight: 600; word-break: break-all;">${value}</p>
  </div>`;
}

function buildEmailHtml(title: string, titleColor: string, body: string, ctaUrl?: string, ctaLabel?: string, borderColor?: string): string {
  return `<div style="font-family: 'Geist Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #080C14; color: #F8FAFC; padding: 40px; border-radius: 16px; border: 1px solid #1E293B;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-family: 'Playfair Display', serif; color: #D4AF37; font-size: 28px; margin: 0; letter-spacing: 0.1em;">HERITA</h1>
      <p style="color: #94A3B8; font-size: 12px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.15em;">Digital Legacy on Solana</p>
    </div>
    <div style="background: #0F1623; border: 1px solid ${borderColor || '#1E293B'}; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="color: ${titleColor}; font-size: 20px; margin: 0 0 16px 0;">${title}</h2>
      ${body}
    </div>
    ${ctaUrl ? `<div style="text-align: center; margin-bottom: 24px;">
      <a href="${ctaUrl}" style="display: inline-block; background: #D4AF37; color: #000000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">${ctaLabel || 'View on Explorer'}</a>
    </div>` : ''}
    <div style="border-top: 1px solid #1E293B; padding-top: 24px; text-align: center;">
      <p style="color: #64748B; font-size: 12px; margin: 0;">Automated notification from HERITA.<br><a href="https://herita.xyz" style="color: #D4AF37; text-decoration: none;">herita.xyz</a></p>
    </div>
  </div>`;
}

const smsTemplates: Record<NotificationTemplate, (data: TemplateData) => string> = {
  heartbeat_received: (data) =>
    `HERITA: Heartbeat confirmed for vault ${shortAddr(data.vaultAddress)}. Timer reset. ${data.timeRemaining ? `Next in ${data.timeRemaining}.` : ''} herita.xyz`,
  deposit_received: (data) =>
    `HERITA: ${data.amount || '0'} SOL deposited into vault ${shortAddr(data.vaultAddress)}. herita.xyz`,
  expiry_warning: (data) =>
    `HERITA WARNING: Vault ${shortAddr(data.vaultAddress)} expires in ${data.timeRemaining || 'soon'}. Send heartbeat NOW. herita.xyz/vaults`,
  vault_expired: (data) =>
    `HERITA: Vault ${shortAddr(data.vaultAddress)} has expired. Claim your allocation at herita.xyz/heir`,
  claim_executed: (data) =>
    `HERITA: Claim executed for vault ${shortAddr(data.vaultAddress)}. Assets distributed. herita.xyz`,
  vault_cancelled: (data) =>
    `HERITA: Vault ${shortAddr(data.vaultAddress)} has been cancelled by the owner. herita.xyz`,
};

// ============================================================
// Core Notification Service
// ============================================================

interface SendNotificationParams {
  vaultId: string;
  template: NotificationTemplate;
  recipientType: 'owner' | 'heir';
  data: TemplateData;
  heirWalletAddress?: string;
}

export async function sendNotification(params: SendNotificationParams): Promise<void> {
  if (!config.NOTIFICATIONS_ENABLED) {
    console.log('[Notifications] Notifications are disabled');
    return;
  }

  const { vaultId, template, recipientType, data, heirWalletAddress } = params;

  try {
    // Fetch notification preferences for this vault
    let query = supabase
      .from('notification_preferences')
      .select('*')
      .eq('vault_id', vaultId)
      .eq('recipient_type', recipientType);

    if (heirWalletAddress) {
      query = query.eq('heir_wallet_address', heirWalletAddress);
    }

    const { data: preferences, error } = await query;

    if (error) {
      console.error('[Notifications] Error fetching preferences:', error);
      return;
    }

    if (!preferences || preferences.length === 0) {
      console.log(`[Notifications] No preferences found for vault ${vaultId}, type ${recipientType}`);
      return;
    }

    // Send to each preferred channel
    for (const pref of preferences) {
      // Skip unverified preferences
      if (!pref.is_verified) {
        console.log(`[Notifications] Skipping unverified preference: ${pref.address}`);
        continue;
      }

      try {
        if (pref.channel === 'email') {
          await sendEmail(pref.address, template, data);
        } else if (pref.channel === 'sms') {
          await sendSMS(pref.address, template, data);
        }

        // Log success
        await logNotification(vaultId, pref.id, pref.channel, pref.address, template, 'sent');
      } catch (err: any) {
        console.error(`[Notifications] Failed to send ${pref.channel} to ${pref.address}:`, err?.message || err);
        await logNotification(vaultId, pref.id, pref.channel, pref.address, template, 'failed', err?.message);
      }
    }
  } catch (err) {
    console.error('[Notifications] Error in sendNotification:', err);
  }
}

// ============================================================
// Direct send (for test endpoint — bypasses preferences lookup)
// ============================================================

export async function sendDirectNotification(
  channel: 'email' | 'sms',
  address: string,
  template: NotificationTemplate,
  data: TemplateData
): Promise<void> {
  if (channel === 'email') {
    await sendEmail(address, template, data);
  } else if (channel === 'sms') {
    await sendSMS(address, template, data);
  }
}

// ============================================================
// Email Sender (Resend)
// ============================================================

async function sendEmail(to: string, template: NotificationTemplate, data: TemplateData): Promise<void> {
  if (!resendClient) {
    console.warn('[Notifications] Resend not configured (no EMAIL_API_KEY)');
    return;
  }

  const { subject, html, text } = emailTemplates[template](data);

  const result = await resendClient.emails.send({
    from: config.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }

  console.log(`[Notifications] Email sent to ${to}: ${subject} (id: ${result.data?.id})`);
}

// ============================================================
// SMS Sender (Twilio)
// ============================================================

async function sendSMS(to: string, template: NotificationTemplate, data: TemplateData): Promise<void> {
  if (!twilioClient || !config.TWILIO_PHONE_NUMBER) {
    console.warn('[Notifications] Twilio not configured');
    return;
  }

  const body = smsTemplates[template](data);

  await twilioClient.messages.create({
    to,
    from: config.TWILIO_PHONE_NUMBER,
    body,
  });

  console.log(`[Notifications] SMS sent to ${to}: ${body.slice(0, 50)}...`);
}

// ============================================================
// Notification Logger
// ============================================================

async function logNotification(
  vaultId: string,
  preferenceId: string | null,
  channel: string,
  recipientAddress: string,
  templateName: string,
  status: 'sent' | 'failed' | 'bounced',
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase.from('notification_logs').insert({
    vault_id: vaultId,
    notification_preference_id: preferenceId,
    channel,
    recipient_address: recipientAddress,
    template_name: templateName,
    status,
    error_message: errorMessage || null,
  });

  if (error) {
    console.error('[Notifications] Error logging notification:', error);
  }
}

// ============================================================
// Helper: Check if a notification was already sent recently
// ============================================================

async function wasNotificationSentRecently(
  vaultId: string,
  template: NotificationTemplate,
  hoursAgo: number = 24
): Promise<boolean> {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('notification_logs')
    .select('id')
    .eq('vault_id', vaultId)
    .eq('template_name', template)
    .eq('status', 'sent')
    .gte('sent_at', cutoff)
    .limit(1);

  if (error) {
    console.error('[Notifications] Error checking notification logs:', error);
    return false;
  }

  return data && data.length > 0;
}

// ============================================================
// Helper: Check if vault needs expiry notification
// ============================================================

export async function checkAndSendExpiryNotifications(
  vaultId: string,
  vaultAddress: string,
  lastHeartbeat: number,
  inactivityPeriod: number,
  solBalance: number
): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = lastHeartbeat + inactivityPeriod;
  const remaining = expiry - now;
  const thresholdPercent = config.EXPIRY_WARNING_THRESHOLD_PERCENT;
  const thresholdSeconds = inactivityPeriod * (thresholdPercent / 100);

  // 1. Expiry warning (owner + heirs)
  if (remaining <= thresholdSeconds && remaining > 0) {
    const alreadySent = await wasNotificationSentRecently(vaultId, 'expiry_warning', 24);
    if (!alreadySent) {
      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const timeRemaining = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

      // Notify owner
      await sendNotification({
        vaultId,
        template: 'expiry_warning',
        recipientType: 'owner',
        data: { vaultAddress, timeRemaining },
      });

      // Notify heirs (so they can prepare)
      const { data: heirs } = await supabase
        .from('heirs')
        .select('wallet_address, name')
        .eq('vault_id', vaultId);

      if (heirs && heirs.length > 0) {
        for (const heir of heirs) {
          await sendNotification({
            vaultId,
            template: 'expiry_warning',
            recipientType: 'heir',
            heirWalletAddress: heir.wallet_address,
            data: { vaultAddress, timeRemaining, heirName: heir.name || undefined },
          });
        }
      }
    }
  }

  // 2. Vault expired (owner + heirs)
  if (remaining <= 0) {
    const alreadySent = await wasNotificationSentRecently(vaultId, 'vault_expired', 24);
    if (!alreadySent) {
      // Notify owner
      await sendNotification({
        vaultId,
        template: 'vault_expired',
        recipientType: 'owner',
        data: { vaultAddress },
      });

      // Notify heirs
      const { data: heirs } = await supabase
        .from('heirs')
        .select('wallet_address, name')
        .eq('vault_id', vaultId);

      if (heirs && heirs.length > 0) {
        for (const heir of heirs) {
          await sendNotification({
            vaultId,
            template: 'vault_expired',
            recipientType: 'heir',
            heirWalletAddress: heir.wallet_address,
            data: {
              vaultAddress,
              heirName: heir.name || undefined,
            },
          });
        }
      }
    }
  }
}

// ============================================================
// Export configuration status
// ============================================================

export const notificationsConfig = {
  enabled: config.NOTIFICATIONS_ENABLED,
  emailConfigured: emailInitialized,
  smsConfigured: twilioInitialized && !!config.TWILIO_PHONE_NUMBER,
  fromEmail: config.EMAIL_FROM,
  twilioNumber: config.TWILIO_PHONE_NUMBER,
  expiryThresholdPercent: config.EXPIRY_WARNING_THRESHOLD_PERCENT,
};
