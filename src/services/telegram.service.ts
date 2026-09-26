/**
 * Ababil’s Attire by Sanjida Bethi
 * Telegram Notification Service
 * Sends instant alerts for newly placed orders and test notifications to configured Telegram recipients.
 * 
 * Security:
 * - Bot token is kept in server environment secrets (VITE_TELEGRAM_BOT_TOKEN or backend/Edge Function secrets).
 * - Never fails or rolls back an order if Telegram delivery encounters an issue.
 */

import { settingsService } from './settings.service';
import type { OrderConfirmationResult, CreateGuestOrderPayload, ManualOrderResult, CreateManualOrderPayload } from '../types';

export interface TelegramNotificationResult {
  success: boolean;
  skipped?: boolean;
  message?: string;
  error?: string;
}

function getTelegramBotToken(): string {
  // Check client-provided build environment variable if available
  const token = (import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '').trim();
  return token;
}

export const telegramNotificationService = {
  /**
   * Send a test notification from Admin Settings
   */
  async sendTestNotification(targetChatId?: string): Promise<TelegramNotificationResult> {
    try {
      const settings = await settingsService.getSettings();
      const chatId = (targetChatId ?? settings.telegram_chat_id ?? '').trim();

      if (!chatId) {
        return {
          success: false,
          error: 'Please enter a valid Telegram Chat ID before sending a test notification.',
        };
      }

      const botToken = getTelegramBotToken();
      if (!botToken) {
        return {
          success: false,
          error: 'Telegram Bot Token is not configured in server secrets (VITE_TELEGRAM_BOT_TOKEN). Please add your bot token to environment secrets.',
        };
      }

      const storeName = settings.store_name || "Ababil’s Attire";
      const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });

      const text = 
`🔔 <b>Test Notification — ${storeName}</b>

✅ Your Telegram order notification setup is working successfully!
📅 <b>Timestamp (Dhaka):</b> ${timestamp}
🆔 <b>Chat ID:</b> <code>${chatId}</code>

When new orders are confirmed by customers or placed manually, order details will be delivered here instantly.`;

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
        }),
      });

      const data = await response.json();

      if (data && data.ok) {
        return {
          success: true,
          message: 'Test notification sent successfully to Telegram!',
        };
      } else {
        const errorDesc = data?.description || 'Telegram API returned an error';
        return {
          success: false,
          error: `Telegram Error: ${errorDesc}`,
        };
      }
    } catch (err: any) {
      console.error('[TelegramService] Error sending test notification:', err);
      return {
        success: false,
        error: err.message || 'Network error communicating with Telegram.',
      };
    }
  },

  /**
   * Send notification for a newly confirmed guest order
   * Safe execution: Never throws or breaks customer checkout flow.
   */
  async notifyNewGuestOrder(
    confirmation: OrderConfirmationResult,
    payload: CreateGuestOrderPayload
  ): Promise<TelegramNotificationResult> {
    try {
      const settings = await settingsService.getSettings();

      // Check if Telegram notification is enabled and configured
      if (!settings.telegram_notifications_enabled) {
        return { success: true, skipped: true, message: 'Telegram notifications are disabled in settings.' };
      }

      const chatId = (settings.telegram_chat_id || '').trim();
      if (!chatId) {
        return { success: true, skipped: true, message: 'No Telegram Chat ID configured.' };
      }

      const botToken = getTelegramBotToken();
      if (!botToken) {
        console.warn('[TelegramService] Bot token missing from environment secrets.');
        return { success: false, error: 'Telegram Bot Token not configured.' };
      }

      // Build message content
      const customer = payload.customer;
      const order = payload.order;
      const payment = payload.payment;
      const invoice = confirmation.invoice_number;
      const dateFormatted = order.delivery_date;
      const timeFormatted = order.delivery_time || 'Standard Slot';

      const itemList = payload.items
        .map((it, idx) => {
          let spec = '';
          if (it.selected_size) spec += ` (Size: ${it.selected_size})`;
          if (it.cake_weight) spec += ` (Weight: ${it.cake_weight})`;
          if (it.cake_flavor) spec += ` [${it.cake_flavor}]`;
          return `  ${idx + 1}. <b>${it.product_name_snapshot}</b>${spec} × ${it.quantity} = ৳${it.subtotal.toLocaleString()}`;
        })
        .join('\n');

      const text =
`🛍 <b>New Order Received! #${invoice}</b>

👤 <b>Customer:</b> ${customer.name}
📞 <b>Phone:</b> ${customer.phone}
📍 <b>Delivery Area:</b> ${customer.area || 'Dhaka'}
🏠 <b>Address:</b> ${customer.address}

📦 <b>Items:</b>
${itemList}

💰 <b>Financial Summary:</b>
• Subtotal: ৳${order.subtotal.toLocaleString()}
• Delivery Charge: ৳${order.delivery_charge.toLocaleString()}
• <b>Total Amount:</b> ৳${order.total_amount.toLocaleString()}
• <b>bKash Advance:</b> ৳${(order.advance_amount ?? 500).toLocaleString()} (TrxID: <code>${payment.trx_id}</code>, Last 4: <code>${payment.sender_last4}</code>)
• <b>Cash Due on Delivery:</b> ৳${(order.total_amount - (order.advance_amount ?? 500)).toLocaleString()}

🚚 <b>Requested Delivery:</b> ${dateFormatted} (${timeFormatted})
${order.special_instructions ? `📝 <b>Special Note:</b> <i>${order.special_instructions}</i>\n` : ''}
⚡ <i>Manage this order in Admin Suite → Orders.</i>`;

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
        }),
      });

      const resData = await response.json();
      if (!resData.ok) {
        console.warn('[TelegramService] Telegram API notification rejected:', resData.description);
        return { success: false, error: resData.description };
      }

      return { success: true };
    } catch (err: any) {
      // NEVER fail or throw — log warning only
      console.warn('[TelegramService] Non-blocking failure delivering Telegram order notification:', err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Send notification for a newly created manual admin order
   * Safe execution: Non-blocking.
   */
  async notifyNewManualOrder(
    result: ManualOrderResult,
    payload: CreateManualOrderPayload
  ): Promise<TelegramNotificationResult> {
    try {
      const settings = await settingsService.getSettings();

      if (!settings.telegram_notifications_enabled) {
        return { success: true, skipped: true };
      }

      const chatId = (settings.telegram_chat_id || '').trim();
      if (!chatId) return { success: true, skipped: true };

      const botToken = getTelegramBotToken();
      if (!botToken) return { success: false, error: 'Telegram Bot Token not configured.' };

      const customer = payload.customer;
      const order = payload.order;
      const invoice = result.invoice_number;

      const itemList = payload.items
        .map((it, idx) => {
          let spec = '';
          if (it.selected_size) spec += ` (Size: ${it.selected_size})`;
          if (it.cake_weight) spec += ` (Weight: ${it.cake_weight})`;
          return `  ${idx + 1}. <b>${it.product_name}</b>${spec} × ${it.quantity} = ৳${(it.subtotal || it.unit_price * it.quantity).toLocaleString()}`;
        })
        .join('\n');

      const text =
`📋 <b>New Manual Order Created! #${invoice}</b>
<i>Created via Atelier Admin Suite</i>

👤 <b>Customer:</b> ${customer.name}
📞 <b>Phone:</b> ${customer.phone}
📍 <b>Delivery Area:</b> ${customer.area || 'Dhaka'}
🏠 <b>Address:</b> ${order.delivery_address}

📦 <b>Items:</b>
${itemList}

💰 <b>Financial Summary:</b>
• Total: ৳${result.total_amount.toLocaleString()}
• Advance: ৳${result.advance_amount.toLocaleString()} (${result.advance_status === 'verified' ? 'Verified' : 'Pending'})
• <b>Cash Due on Delivery:</b> ৳${result.cash_due.toLocaleString()}

🚚 <b>Delivery Date:</b> ${order.delivery_date} (${order.delivery_time || 'Standard'})`;

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
        }),
      });

      const resData = await response.json();
      return { success: Boolean(resData?.ok), error: resData?.description };
    } catch (err: any) {
      console.warn('[TelegramService] Non-blocking failure delivering manual order notification:', err.message);
      return { success: false, error: err.message };
    }
  },
};
