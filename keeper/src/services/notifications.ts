import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { config } from '../config';
import { getSupabaseClient } from '../db/supabase';

// Initialize clients only if credentials are provided
const sendgridInitialized = config.SENDGRID_API_KEY ? true : false;
const twilioInitialized = config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN ? true : false;

if (sendgridInitialized) {
  sgMail.setApiKey(config.SENDGRID_API_KEY!);
}

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

const emailTemplates: Record<NotificationTemplate, (data: TemplateData) => { subject: string; html: string; text: string }> = {
  heartbeat_received: (data) => ({
    subject: 'HERITA — Heartbeat Confirmed',
    html: `
      <div style="font-family: 'Geist Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #080C14; color: #F8FAFC; padding: 40px; border-radius: 16px; border: 1px solid #1E293B;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-family: 'Playfair Display', serif; color: #D4AF37; font-size: 28px; margin: 0; letter-spacing: 0.1em;">HERITA</h1>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.15em;">Digital Legacy on Solana</p>
        </div>
        
        <div style="background: #0F1623; border: 1px solid #1E293B; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #34D399; font-size: 20px; margin: 0 0 16px 0;">Heartbeat Confirmed</h2>
          <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px 0;">
            Your vault has received a heartbeat signal. The inactivity timer has been reset.
          </p>
          <div style="background: #161F2E; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Vault Address</p>
            <p style="margin: 0; font-family: 'Geist Mono', monospace; font-size: 14px; color: #F8FAFC; word-break: break-all;">${data.vaultAddress}</p>
          </div>
          ${data.timeRemaining ? `
          <div style="background: #161F2E; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 8px 0; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Time Until Next Action Required</p>
            <p style="margin: 0; font-family: 'Geist Mono', monospace; font-size: 18px; color: #D4AF37; font-weight: 600;">${data.timeRemaining}</p>
          </div>
          ` : ''}
        </div>
        
        ${data.explorerUrl ? `
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${data.explorerUrl}" style="display: inline-block; background: #D4AF37; color: #000000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">View on Explorer</a>
        </div>
        ` : ''}
        
        <div style="border-top: 1px solid #1E293B; padding-top: 24px; text-align: center;">
          <p style="color: #64748B; font-size: 12px; margin: 0;">
            This is an automated notification from HERITA.<br>
            <a href="https://herita.xyz" style="color: #D4AF37; text-decoration: none;">herita.xyz</a>
          </p>
        </div>
      </div>
    `,
    text: `HERITA — Heartbeat Confirmed

Your vault has received a heartbeat signal. The inactivity timer has been reset.

Vault Address: ${data.vaultAddress}
${data.timeRemaining ? `Time Until Next Action Required: ${data.timeRemaining}` : ''}
${data.explorerUrl ? `View on Explorer: ${data.explorerUrl}` : ''}

— HERITA Digital Legacy Protocol`,
  }),

  deposit_received: (data) => ({
    subject: 'HERITA — Deposit Received',
    html: `
      <div style="font-family: 'Geist Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #080C14; color: #F8FAFC; padding: 40px; border-radius: 16px; border: 1px solid #1E293B;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-family: 'Playfair Display', serif; color: #D4AF37; font-size: 28px; margin: 0; letter-spacing: 0.1em;">HERITA</h1>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.15em;">Digital Legacy on Solana</p>
        </div>
        
        <div style="background: #0F1623; border: 1px solid #1E293B; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #34D399; font-size: 20px; margin: 0 0 16px 0;">Deposit Received</h2>
          <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px 0;">
            New funds have been deposited into your vault.
          </p>
          <div style="background: #161F2E; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Amount</p>
            <p style="margin: 0; font-family: 'Geist Mono', monospace; font-size: 24px; color: #34D399; font-weight: 700;">${data.amount || '0'} SOL</p>
          </div>
          <div style="background: #161F2E; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 8px 0; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Vault Address</p>
            <p style="margin: 0; font-family: 'Geist Mono', monospace; font-size: 14px; color: #F8FAFC; word-break: break-all;">${data.vaultAddress}</p>
          </div>
        </div>
        
        ${data.explorerUrl ? `
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${data.explorerUrl}" style="display: inline-block; background: #D4AF37; color: #000000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">View Transaction</a>
        </div>
        ` : ''}
        
        <div style="border-top: 1px solid #1E293B; padding-top: 24px; text-align: center;">
          <p style="color: #64748B; font-size: 12px; margin: 0;">
            This is an automated notification from HERITA.<br>
            <a href="https://herita.xyz" style="color: #D4AF37; text-decoration: none;">herita.xyz</a>
          </p>
        </div>
      </div>
    `,
    text: `HERITA — Deposit Received

New funds have been deposited into your vault.

Amount: ${data.amount || '0'} SOL
Vault Address: ${data.vaultAddress}
${data.explorerUrl ? `View Transaction: ${data.explorerUrl}` : ''}

— HERITA Digital Legacy Protocol`,
  }),

  expiry_warning: (data) => ({
    subject: 'HERITA — Vault Expiration Warning',
    html: `
      <div style="font-family: 'Geist Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #080C14; color: #F8FAFC; padding: 40px; border-radius: 16px; border: 1px solid #1E293B;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-family: 'Playfair Display', serif; color: #D4AF37; font-size: 28px; margin: 0; letter-spacing: 0.1em;">HERITA</h1>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.15em;">Digital Legacy on Solana</p>
        </div>
        
        <div style="background: #0F1623; border: 1px solid #FBBF24; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FBBF24; font-size: 20px; margin: 0 0 16px 0;">⚠️ Expiration Warning</h2>
          <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px 0;">
            Your vault is approaching its inactivity threshold. If no heartbeat is sent before the timer expires, your heirs will be able to claim the assets.
          </p>
          <div style="background: #161F2E; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Time Remaining</p>
            <p style="margin: 0; font-family: 'Geist Mono', monospace; font-size: 24px; color: #FBBF24; font-weight: 700;">${data.timeRemaining || 'Unknown'}</p>
          </div>
          <div style="background: #161F2E; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 8px 0; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Vault Address</p>
            <p style="margin: 0; font-family: 'Geist Mono', monospace; font-size: 14px; color: #F8FAFC; word-break: break-all;">${data.vaultAddress}</p>
          </div>
        </div>
        
        <div style="background: #161F2E; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; color: #94A3B8; font-size: 14px; line-height: 1.6;">
            <strong style="color: #F8FAFC;">Action Required:</strong> Send a heartbeat to reset the timer and maintain control of your vault. Visit <a href="https://herita.xyz/vaults" style="color: #D4AF37; text-decoration: none;">herita.xyz/vaults</a> to access your vault.
          </p>
        </div>
        
        <div style="border-top: 1px solid #1E293B; padding-top: 24px; text-align: center;">
          <p style="color: #64748B; font-size: 12px; margin: 0;">
            This is an automated notification from HERITA.<br>
            <a href="https://herita.xyz" style="color: #D4AF37; text-decoration: none;">herita.xyz</a>
          </p>
        </div>
      </div>
    `,
    text: `HERITA — Vault Expiration Warning

Your vault is approaching its inactivity threshold. If no heartbeat is sent before the timer expires, your heirs will be able to claim the assets.

Time Remaining: ${data.timeRemaining || 'Unknown'}
Vault Address: ${data.vaultAddress}

Action Required: Send a heartbeat to reset the timer and maintain control of your vault. Visit https://herita.xyz/vaults to access your vault.

— HERITA Digital Legacy Protocol`,
  }),

  vault_expired: (data) => ({
    subject: 'HERITA — Vault Expired — Claim Available',
    html: `
      <div style="font-family: 'Geist Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #080C14; color: #F8FAFC; padding: 40px; border-radius: 16px; border: 1px solid #1E293B;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-family: 'Playfair Display', serif; color: #D4AF37; font-size: 28px; margin: 0; letter-spacing: 0.1em;">HERITA</h1>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.15em;">Digital Legacy on Solana</p>
        </div>
        
        <div style="background: #0F1623; border: 1px solid #FB7185; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #FB7185; font-size: 20px; margin: 0 0 16px 0;">Vault Expired — Claim Available</h2>
          <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px 0;">
            ${data.heirName ? `Hello ${data.heirName},` : 'Hello,'} The inactivity period for this vault has expired. You are now eligible to claim your allocated assets.
          </p>
          <div style="background: #161F2E; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Vault Address</p>
            <p style="margin: 0; font-family: 'Geist Mono', monospace; font-size: 14px; color: #F8FAFC; word-break: break-all;">${data.vaultAddress}</p>
          </div>
          ${data.amount ? `
          <div style="background: #161F2E; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 8px 0; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Your Allocation</p>
            <p style="margin: 0; font-family: 'Geist Mono', monospace; font-size: 24px; color: #34D399; font-weight: 700;">${data.amount} SOL</p>
          </div>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="https://herita.xyz/heir" style="display: inline-block; background: #D4AF37; color: #000000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Execute Claim</a>
        </div>
        
        <div style="border-top: 1px solid #1E293B; padding-top: 24px; text-align: center;">
          <p style="color: #64748B; font-size: 12px; margin: 0;">
            This is an automated notification from HERITA.<br>
            <a href="https://herita.xyz" style="color: #D4AF37; text-decoration: none;">herita.xyz</a>
          </p>
        </div>
      </div>
    `,
    text: `HERITA — Vault Expired — Claim Available

${data.heirName ? `Hello ${data.heirName},` : 'Hello,'} The inactivity period for this vault has expired. You are now eligible to claim your allocated assets.

Vault Address: ${data.vaultAddress}
${data.amount ? `Your Allocation: ${data.amount} SOL` : ''}

Execute your claim at: https://herita.xyz/heir

— HERITA Digital Legacy Protocol`,
  }),

  claim_executed: (data) => ({
    subject: 'HERITA — Claim Executed',
    html: `
      <div style="font-family: 'Geist Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #080C14; color: #F8FAFC; padding: 40px; border-radius: 16px; border: 1px solid #1E293B;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-family: 'Playfair Display', serif; color: #D4AF37; font-size: 28px; margin: 0; letter-spacing: 0.1em;">HERITA</h1>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.15em;">Digital Legacy on Solana</p>
        </div>
        
        <div style="background: #0F1623; border: 1px solid #34D399; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #34D399; font-size: 20px; margin: 0 0 16px 0;">Claim Executed Successfully</h2>
          <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px 0;">
            The claim for this vault has been executed. Assets have been distributed to the designated heirs.
          </p>
          <div style="background: #161F2E; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Vault Address</p>
            <p style="margin: 0; font-family: 'Geist Mono', monospace; font-size: 14px; color: #F8FAFC; word-break: break-all;">${data.vaultAddress}</p>
          </div>
        </div>
        
        ${data.explorerUrl ? `
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${data.explorerUrl}" style="display: inline-block; background: #D4AF37; color: #000000; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">View on Explorer</a>
        </div>
        ` : ''}
        
        <div style="border-top: 1px solid #1E293B; padding-top: 24px; text-align: center;">
          <p style="color: #64748B; font-size: 12px; margin: 0;">
            This is an automated notification from HERITA.<br>
            <a href="https://herita.xyz" style="color: #D4AF37; text-decoration: none;">herita.xyz</a>
          </p>
        </div>
      </div>
    `,
    text: `HERITA — Claim Executed Successfully

The claim for this vault has been executed. Assets have been distributed to the designated heirs.

Vault Address: ${data.vaultAddress}
${data.explorerUrl ? `View on Explorer: ${data.explorerUrl}` : ''}

— HERITA Digital Legacy Protocol`,
  }),

  vault_cancelled: (data) => ({
    subject: 'HERITA — Vault Cancelled',
    html: `
      <div style="font-family: 'Geist Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #080C14; color: #F8FAFC; padding: 40px; border-radius: 16px; border: 1px solid #1E293B;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-family: 'Playfair Display', serif; color: #D4AF37; font-size: 28px; margin: 0; letter-spacing: 0.1em;">HERITA</h1>
          <p style="color: #94A3B8; font-size: 12px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.15em;">Digital Legacy on Solana</p>
        </div>
        
        <div style="background: #0F1623; border: 1px solid #94A3B8; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #94A3B8; font-size: 20px; margin: 0 0 16px 0;">Vault Cancelled</h2>
          <p style="color: #94A3B8; line-height: 1.6; margin: 0 0 16px 0;">
            This vault has been cancelled by the owner. All remaining funds have been returned to the owner.
          </p>
          <div style="background: #161F2E; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 8px 0; color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Vault Address</p>
            <p style="margin: 0; font-family: 'Geist Mono', monospace; font-size: 14px; color: #F8FAFC; word-break: break-all;">${data.vaultAddress}</p>
          </div>
        </div>
        
        <div style="border-top: 1px solid #1E293B; padding-top: 24px; text-align: center;">
          <p style="color: #64748B; font-size: 12px; margin: 0;">
            This is an automated notification from HERITA.<br>
            <a href="https://herita.xyz" style="color: #D4AF37; text-decoration: none;">herita.xyz</a>
          </p>
        </div>
      </div>
    `,
    text: `HERITA — Vault Cancelled

This vault has been cancelled by the owner. All remaining funds have been returned to the owner.

Vault Address: ${data.vaultAddress}

— HERITA Digital Legacy Protocol`,
  }),
};

const smsTemplates: Record<NotificationTemplate, (data: TemplateData) => string> = {
  heartbeat_received: (data) =>
    `HERITA: Heartbeat confirmed for vault ${data.vaultAddress.slice(0, 8)}...${data.vaultAddress.slice(-4)}. Timer reset. ${data.timeRemaining ? `Next action in ${data.timeRemaining}.` : ''} herita.xyz`,

  deposit_received: (data) =>
    `HERITA: ${data.amount || '0'} SOL deposited into vault ${data.vaultAddress.slice(0, 8)}...${data.vaultAddress.slice(-4)}. herita.xyz`,

  expiry_warning: (data) =>
    `HERITA WARNING: Vault ${data.vaultAddress.slice(0, 8)}... expires in ${data.timeRemaining || 'soon'}. Send heartbeat NOW to maintain control. herita.xyz/vaults`,

  vault_expired: (data) =>
    `HERITA: Vault ${data.vaultAddress.slice(0, 8)}... has expired. You can now claim your allocation. Visit herita.xyz/heir`,

  claim_executed: (data) =>
    `HERITA: Claim executed for vault ${data.vaultAddress.slice(0, 8)}... Assets distributed. herita.xyz`,

  vault_cancelled: (data) =>
    `HERITA: Vault ${data.vaultAddress.slice(0, 8)}... has been cancelled by the owner. herita.xyz`,
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
        console.error(`[Notifications] Failed to send ${pref.channel} to ${pref.address}:`, err);
        await logNotification(vaultId, pref.id, pref.channel, pref.address, template, 'failed', err.message);
      }
    }
  } catch (err) {
    console.error('[Notifications] Error in sendNotification:', err);
  }
}

// ============================================================
// Email Sender
// ============================================================

async function sendEmail(to: string, template: NotificationTemplate, data: TemplateData): Promise<void> {
  if (!sendgridInitialized) {
    console.warn('[Notifications] SendGrid not configured');
    return;
  }

  const { subject, html, text } = emailTemplates[template](data);

  await sgMail.send({
    to,
    from: config.SENDGRID_FROM_EMAIL!,
    subject,
    html,
    text,
  });

  console.log(`[Notifications] Email sent to ${to}: ${subject}`);
}

// ============================================================
// SMS Sender
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

  // 1. Expiry warning (owner)
  if (remaining <= thresholdSeconds && remaining > 0) {
    const alreadySent = await wasNotificationSentRecently(vaultId, 'expiry_warning', 24);
    if (!alreadySent) {
      const days = Math.floor(remaining / 86400);
      const hours = Math.floor((remaining % 86400) / 3600);
      const timeRemaining = days > 0 ? `${days}d ${hours}h` : `${hours}h`;

      await sendNotification({
        vaultId,
        template: 'expiry_warning',
        recipientType: 'owner',
        data: {
          vaultAddress,
          timeRemaining,
        },
      });
    }
  }

  // 2. Vault expired (heirs)
  if (remaining <= 0) {
    const alreadySent = await wasNotificationSentRecently(vaultId, 'vault_expired', 24);
    if (!alreadySent) {
      // Fetch heirs to notify each one
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
  emailConfigured: sendgridInitialized,
  smsConfigured: twilioInitialized && !!config.TWILIO_PHONE_NUMBER,
  fromEmail: config.SENDGRID_FROM_EMAIL,
  twilioNumber: config.TWILIO_PHONE_NUMBER,
  expiryThresholdPercent: config.EXPIRY_WARNING_THRESHOLD_PERCENT,
};
