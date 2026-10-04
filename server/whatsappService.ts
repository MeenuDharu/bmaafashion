import twilio from 'twilio';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import crypto from 'crypto';
import { storage } from './storage';
import type { Order, OrderItem, Product, User, UserPreferences } from '@shared/schema';
import dotenv from "dotenv";
dotenv.config();


// =============================================================================
// TWILIO WHATSAPP BUSINESS API SERVICE INTEGRATION
// =============================================================================
// Comprehensive WhatsApp notification system for Bmaafashion e-commerce platform

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.warn("TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables not set. WhatsApp functionality will be disabled.");
}

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Default WhatsApp Business number for sending messages
const WHATSAPP_BUSINESS_NUMBER = process.env.WHATSAPP_BUSINESS_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox for testing

// WhatsApp Message Types Enum for different notification categories
export enum WhatsappType {
  ORDER_CONFIRMATION = 'order_confirmation',
  ORDER_STATUS_UPDATE = 'order_status_update',
  SHIPPING_NOTIFICATION = 'shipping_notification',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  PAYMENT_FAILED = 'payment_failed',
  DELIVERY_NOTIFICATION = 'delivery_notification',
  ORDER_CANCELLATION = 'order_cancellation',
  ACCOUNT_VERIFICATION = 'account_verification',
  ACCOUNT_WELCOME = 'account_welcome',
  STOCK_ALERT = 'stock_alert',
  PROMOTIONAL = 'promotional'
}

// WhatsApp Priority Levels
export enum WhatsappPriority {
  HIGH = 'high',        // Immediate delivery (payment, security)
  NORMAL = 'normal',    // Standard delivery (orders, shipping)
  LOW = 'low'           // Bulk/promotional messages
}

// WhatsApp Message Status Enum
export enum WhatsappStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// WhatsApp Queue Entry Interface
interface WhatsappQueueEntry {
  id: string;
  type: WhatsappType;
  priority: WhatsappPriority;
  to: string;
  from: string;
  message: string;
  mediaUrl?: string;
  mediaType?: string;
  templateName?: string;
  templateData?: Record<string, any>;
  data?: Record<string, any>;
  userId?: string;
  retryCount: number;
  maxRetries: number;
  scheduledAt: Date;
  createdAt: Date;
  lastError?: string;
}

// Enhanced WhatsApp Parameters Interface
interface WhatsappParams {
  to: string;
  from: string;
  message: string;
  mediaUrl?: string;
  mediaType?: string;
}

// Template Variable Interface
interface WhatsappTemplateVariables {
  recipientName: string;
  recipientPhone: string;
  [key: string]: any;
}

// Constants for WhatsApp processing
const maxRetries = 3;
const retryDelays = [30000, 300000, 1800000]; // 30s, 5min, 30min

// Rate Limiting Configuration (enforced via database)
const rateLimits = {
  [WhatsappPriority.HIGH]: { perMinute: 5, perHour: 50 },   // Conservative limits for WhatsApp
  [WhatsappPriority.NORMAL]: { perMinute: 3, perHour: 30 },
  [WhatsappPriority.LOW]: { perMinute: 1, perHour: 10 }
};

// =============================================================================
// PHONE NUMBER VALIDATION AND FORMATTING
// =============================================================================

/**
 * Validate and format WhatsApp phone number
 * @param phoneNumber Raw phone number string
 * @param defaultCountry Default country code (default: IN for India)
 * @returns Formatted WhatsApp number or null if invalid
 */
export function validateAndFormatWhatsappNumber(
  phoneNumber: string,
  defaultCountry: string = 'IN'
): string | null {
  try {
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      return null;
    }

    // Clean the phone number
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');

    // Check if it's a valid phone number
    if (!isValidPhoneNumber(cleaned, defaultCountry as any)) {
      return null;
    }

    // Parse and format the phone number for WhatsApp
    const parsed = parsePhoneNumber(cleaned, defaultCountry as any);
    return `whatsapp:${parsed.format('E.164')}`; // WhatsApp format
  } catch (error) {
    console.error('WhatsApp phone number validation error:', error);
    return null;
  }
}

/**
 * Check if user has opted in for WhatsApp notifications
 * @param phoneNumber WhatsApp phone number to check
 * @param userId Optional user ID
 * @returns Whether user has opted in
 */
export async function checkWhatsappOptInStatus(
  phoneNumber: string,
  userId?: string
): Promise<boolean> {
  try {
    const whatsappPreferences = await storage.getWhatsappPreferences(phoneNumber, userId);
    return whatsappPreferences?.isOptedIn || false;
  } catch (error) {
    console.error('Error checking WhatsApp opt-in status:', error);
    return false;
  }
}

// =============================================================================
// WHATSAPP MESSAGE TEMPLATE SYSTEM
// =============================================================================

/**
 * Generate order confirmation WhatsApp message
 */
export function generateOrderConfirmationWhatsapp(
  order: Order & { items: (OrderItem & { product: Product })[] },
  customerName: string
): string {
  const orderNumber = order.id.slice(-8).toUpperCase();
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
  const total = Number(order.total).toFixed(2);

  return `🎉 *Order Confirmed!*

Hi ${customerName}! Your Bmaafashion order has been confirmed.

*Order Details:*
📦 Order #${orderNumber}
👔 ${itemCount} item(s)
💰 Total: ₹${total}

Your order is being prepared! We'll send you tracking information once shipped.

Thank you for choosing Bmaafashion! 👒

_Need help? Reply to this message._`;
}

/**
 * Generate order status update WhatsApp message
 */
export function generateOrderStatusUpdateWhatsapp(
  order: Order,
  customerName: string,
  newStatus: string,
  trackingNumber?: string
): string {
  const orderNumber = order.id.slice(-8).toUpperCase();

  const statusEmojis = {
    pending: '⏳',
    processing: '🔄',
    shipped: '🚚',
    delivered: '✅',
    cancelled: '❌'
  };

  const statusMessages = {
    pending: 'Order received and being prepared',
    processing: 'Order is now being processed',
    shipped: `Great news! Your order has shipped${trackingNumber ? `\n📍 Tracking: ${trackingNumber}` : ''}`,
    delivered: 'Order delivered! Thank you for choosing Bmaafashion',
    cancelled: 'Order has been cancelled. Contact us if you need help'
  };

  const emoji = statusEmojis[newStatus as keyof typeof statusEmojis] || '📦';
  const message = statusMessages[newStatus as keyof typeof statusMessages] ||
    `Order status updated to: ${newStatus}`;

  return `${emoji} *Order Update*

Hi ${customerName}! We have an update on your order.

*Order #${orderNumber}*
${message}

${trackingNumber && newStatus === 'shipped' ? `Track your package: [Insert tracking URL]` : ''}

_Questions? Just reply to this message._

Bmaafashion Team 👒`;
}

/**
 * Generate payment confirmation WhatsApp message
 */
export function generatePaymentConfirmationWhatsapp(
  order: Order,
  customerName: string,
  paymentMethod: string
): string {
  const orderNumber = order.id.slice(-8).toUpperCase();
  const amount = Number(order.total).toFixed(2);

  return `💳 *Payment Confirmed!*

Hi ${customerName}! Your payment has been successfully processed.

*Payment Details:*
💰 Amount: ₹${amount}
💳 Method: ${paymentMethod}
📦 Order: #${orderNumber}

Your order is now being prepared for shipment!

Thank you for your business! 👒

Bmaafashion Team`;
}

/**
 * Generate shipping notification WhatsApp message
 */
export function generateShippingNotificationWhatsapp(
  order: Order,
  customerName: string,
  trackingNumber: string,
  estimatedDelivery?: string
): string {
  const orderNumber = order.id.slice(-8).toUpperCase();
  const deliveryInfo = estimatedDelivery ? `\n🕒 Estimated delivery: ${estimatedDelivery}` : '';

  return `🚚 *Your Order is On Its Way!*

Hi ${customerName}! Great news - your Bmaafashion order has shipped!

*Shipping Details:*
📦 Order: #${orderNumber}
📍 Tracking: ${trackingNumber}${deliveryInfo}

Track your package: [Insert tracking URL]

Your order is almost here! 👒

Questions? Reply to this message.

Bmaafashion Team`;
}

/**
 * Generate delivery notification WhatsApp message
 */
export function generateDeliveryNotificationWhatsapp(
  order: Order,
  customerName: string
): string {
  const orderNumber = order.id.slice(-8).toUpperCase();

  return `� *Delivered Successfully!*

Hi ${customerName}! Your Bmaafashion order has been delivered!

*Order #${orderNumber}* ✅

Thank you for shopping with us! 

👒 *Getting Started:*
• Check your order contents
• Follow included guides
• Join our community

Need help? Reply to this message.

Happy Shopping!
Bmaafashion Team 👒`;
}

/**
 * Generate payment failure WhatsApp message
 */
export function generatePaymentFailedWhatsapp(
  order: Order,
  customerName: string,
  failureReason?: string
): string {
  const orderNumber = order.id.slice(-8).toUpperCase();
  const reason = failureReason ? `\n\n*Reason:* ${failureReason}` : '';

  return `❌ *Payment Failed*

Hi ${customerName}, we encountered an issue processing your payment.

*Order #${orderNumber}*${reason}

*Next Steps:*
• Check your payment details
• Try a different payment method
• Contact your bank if needed

We're here to help! Reply to this message or visit our website to retry payment.

Bmaafashion Support Team`;
}

/**
 * Generate order cancellation WhatsApp message
 */
export function generateOrderCancellationWhatsapp(
  order: Order,
  customerName: string,
  reason?: string
): string {
  const orderNumber = order.id.slice(-8).toUpperCase();
  const cancellationReason = reason ? `\n\n*Reason:* ${reason}` : '';

  return `❌ *Order Cancelled*

Hi ${customerName}, your order has been cancelled.

*Order #${orderNumber}*${cancellationReason}

If payment was processed, your refund will be issued within 3-5 business days.

Need to place a new order? Visit our website or reply to this message.

Thank you for understanding.
Bmaafashion Team 👒`;
}

/**
 * Generate account welcome WhatsApp message
 */
export function generateAccountWelcomeWhatsapp(customerName: string): string {
  return `� *Welcome to Bmaafashion!*

Hi ${customerName}! Welcome to our fashion community!

*What's Next:*
👒 Explore our fashion collections
📚 Access style guides
💬 Join our community
🎁 Get exclusive member discounts

Ready to shop? Visit our website or reply with "CATALOG" to see our collection.

Let's find your perfect style!

Bmaafashion Team 👒`;
}

/**
 * Generate stock alert WhatsApp message
 */
export function generateStockAlertWhatsapp(
  productName: string,
  customerName: string
): string {
  return `🔔 *Back in Stock!*

Hi ${customerName}! Great news!

*${productName}* is back in stock! 👒

Don't miss out this time - grab yours before it sells out again.

Shop now: [Product Link]

Happy Shopping!
Bmaafashion Team 👒`;
}

// =============================================================================
// WHATSAPP DELIVERY FUNCTIONS
// =============================================================================

/**
 * Send WhatsApp message using Twilio with delivery tracking
 * @param params WhatsApp parameters
 * @returns Success status and message SID
 */
async function sendWhatsappViaTwilio(params: WhatsappParams): Promise<{
  success: boolean;
  messageSid?: string;
  conversationId?: string;
  error?: string;
}> {
  try {
    if (!twilioClient) {
      throw new Error('Twilio client not initialized. Check environment variables.');
    }

    console.log(`📱 Sending WhatsApp to ${params.to}: ${params.message.substring(0, 50)}...`);

    const messageOptions: any = {
      body: params.message,
      from: params.from,
      to: params.to,
    };

    // Add media if provided
    if (params.mediaUrl) {
      messageOptions.mediaUrl = [params.mediaUrl];
    }

    const message = await twilioClient.messages.create(messageOptions);

    console.log(`✅ WhatsApp sent successfully. SID: ${message.sid}`);

    return {
      success: true,
      messageSid: message.sid,
      conversationId: message.messagingServiceSid || undefined,
    };
  } catch (error: any) {
    console.error('❌ Failed to send WhatsApp via Twilio:', error);
    return {
      success: false,
      error: error.message || 'Unknown Twilio error',
    };
  }
}

/**
 * Add WhatsApp message to queue for reliable delivery
 * @param type WhatsApp message type
 * @param priority WhatsApp priority
 * @param to Recipient WhatsApp number
 * @param message WhatsApp message content
 * @param templateData Template variables
 * @param userId Optional user ID
 * @param mediaUrl Optional media URL
 * @param mediaType Optional media type
 * @returns Success status
 */
export async function queueWhatsapp(
  type: WhatsappType,
  priority: WhatsappPriority,
  to: string,
  message: string,
  templateData?: Record<string, any>,
  userId?: string,
  mediaUrl?: string,
  mediaType?: string
): Promise<boolean> {
  try {
    console.log(`📨 Queuing WhatsApp: ${type} to ${to}`);

    // Validate WhatsApp number
    const formattedPhone = validateAndFormatWhatsappNumber(to);
    if (!formattedPhone) {
      console.error(`❌ Invalid WhatsApp number: ${to}`);
      return false;
    }

    // Check opt-in status (skip for account verification)
    if (type !== WhatsappType.ACCOUNT_VERIFICATION) {
      const isOptedIn = await checkWhatsappOptInStatus(formattedPhone, userId);
      if (!isOptedIn) {
        console.log(`⚠️ User has not opted in for WhatsApp notifications: ${formattedPhone}`);
        return false;
      }
    }

    // Check rate limits
    const rateLimitOk = await checkWhatsappRateLimit(formattedPhone, priority);
    if (!rateLimitOk) {
      console.warn(`⚠️ WhatsApp rate limit exceeded for ${formattedPhone}`);
      return false;
    }

    // Add to WhatsApp queue
    const whatsappQueueEntry = await storage.createWhatsappQueue({
      type,
      priority,
      status: 'pending',
      to: formattedPhone,
      from: WHATSAPP_BUSINESS_NUMBER,
      message,
      mediaUrl,
      mediaType,
      templateData: templateData || {},
      userId,
      retryCount: 0,
      maxRetries,
      scheduledAt: new Date(),
    });

    console.log(`✅ WhatsApp queued successfully: ${whatsappQueueEntry.id}`);

    // For high priority messages, attempt immediate delivery
    if (priority === WhatsappPriority.HIGH) {
      setImmediate(() => processWhatsappQueue());
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to queue WhatsApp:', error);
    return false;
  }
}

/**
 * Process WhatsApp queue and send pending messages
 */
export async function processWhatsappQueue(): Promise<void> {
  try {
    console.log('🔄 Processing WhatsApp queue...');

    // Get pending WhatsApp messages ordered by priority and scheduled time
    const pendingWhatsapps = await storage.getPendingWhatsappQueue();

    if (pendingWhatsapps.length === 0) {
      return;
    }

    console.log(`📱 Found ${pendingWhatsapps.length} pending WhatsApp messages`);

    for (const whatsapp of pendingWhatsapps) {
      try {
        // Check if retry delay has passed
        const now = new Date();
        const scheduledTime = new Date(whatsapp.scheduledAt);

        if (whatsapp.retryCount > 0) {
          const delayMs = retryDelays[Math.min(whatsapp.retryCount - 1, retryDelays.length - 1)];
          const nextRetryTime = new Date(scheduledTime.getTime() + delayMs);

          if (now < nextRetryTime) {
            continue; // Skip this message, not ready for retry yet
          }
        }

        // Attempt to send WhatsApp
        await storage.updateWhatsappQueueStatus(whatsapp.id, 'sending');

        const result = await sendWhatsappViaTwilio({
          to: whatsapp.to,
          from: whatsapp.from,
          message: whatsapp.message,
          mediaUrl: whatsapp.mediaUrl,
          mediaType: whatsapp.mediaType,
        });

        if (result.success) {
          // WhatsApp sent successfully
          await storage.updateWhatsappQueueStatus(whatsapp.id, 'sent', {
            twilioSid: result.messageSid,
            conversationId: result.conversationId,
            sentAt: new Date(),
          });

          // Create delivery log
          if (result.messageSid) {
            await storage.createWhatsappDeliveryLog({
              whatsappQueueId: whatsapp.id,
              twilioSid: result.messageSid,
              phoneNumber: whatsapp.to,
              status: 'sent',
              direction: 'outbound',
              conversationId: result.conversationId,
              templateName: whatsapp.templateName,
              numMedia: whatsapp.mediaUrl ? 1 : 0,
              mediaType: whatsapp.mediaType,
            });
          }

          console.log(`✅ WhatsApp sent successfully: ${whatsapp.id}`);
        } else {
          // WhatsApp failed to send
          const newRetryCount = whatsapp.retryCount + 1;

          if (newRetryCount >= whatsapp.maxRetries) {
            // Max retries reached, mark as failed
            await storage.updateWhatsappQueueStatus(whatsapp.id, 'failed', {
              lastError: result.error,
            });
            console.error(`❌ WhatsApp failed permanently after ${whatsapp.maxRetries} retries: ${whatsapp.id}`);
          } else {
            // Schedule retry
            await storage.updateWhatsappQueueRetry(whatsapp.id, newRetryCount, result.error);
            console.warn(`⚠️ WhatsApp failed, scheduled for retry ${newRetryCount}/${whatsapp.maxRetries}: ${whatsapp.id}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing WhatsApp ${whatsapp.id}:`, error);

        // Update retry count
        const newRetryCount = whatsapp.retryCount + 1;
        if (newRetryCount >= whatsapp.maxRetries) {
          await storage.updateWhatsappQueueStatus(whatsapp.id, 'failed', {
            lastError: (error as Error).message,
          });
        } else {
          await storage.updateWhatsappQueueRetry(whatsapp.id, newRetryCount, (error as Error).message);
        }
      }
    }

    console.log('✅ WhatsApp queue processing completed');
  } catch (error) {
    console.error('❌ Error processing WhatsApp queue:', error);
  }
}

/**
 * Check WhatsApp rate limits
 * @param identifier Phone number or user ID
 * @param priority WhatsApp priority
 * @returns Whether rate limit allows sending
 */
async function checkWhatsappRateLimit(
  identifier: string,
  priority: WhatsappPriority
): Promise<boolean> {
  try {
    const limits = rateLimits[priority];
    const now = new Date();

    // Check minute rate limit
    const minuteWindow = new Date(now.getTime() - 60 * 1000);
    const minuteCount = await storage.getWhatsappRateLimitCount(identifier, minuteWindow, 'minute', priority);

    if (minuteCount >= limits.perMinute) {
      return false;
    }

    // Check hour rate limit  
    const hourWindow = new Date(now.getTime() - 60 * 60 * 1000);
    const hourCount = await storage.getWhatsappRateLimitCount(identifier, hourWindow, 'hour', priority);

    if (hourCount >= limits.perHour) {
      return false;
    }

    // Update rate limit counters
    await storage.incrementWhatsappRateLimit(identifier, priority);

    return true;
  } catch (error) {
    console.error('Error checking WhatsApp rate limit:', error);
    return true; // Allow on error to avoid blocking legitimate messages
  }
}

// =============================================================================
// HIGH-LEVEL WHATSAPP SENDING FUNCTIONS
// =============================================================================

/**
 * Send order confirmation WhatsApp
 */
export async function sendOrderConfirmationWhatsapp(
  order: Order & { items: (OrderItem & { product: Product })[] },
  customerName: string,
  phoneNumber: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generateOrderConfirmationWhatsapp(order, customerName);

    return await queueWhatsapp(
      WhatsappType.ORDER_CONFIRMATION,
      WhatsappPriority.HIGH,
      phoneNumber,
      message,
      {
        orderId: order.id,
        orderTotal: order.total,
        customerName,
        itemCount: order.items.reduce((total, item) => total + item.quantity, 0)
      },
      userId
    );
  } catch (error) {
    console.error('Error sending order confirmation WhatsApp:', error);
    return false;
  }
}

/**
 * Send order status update WhatsApp
 */
export async function sendOrderStatusUpdateWhatsapp(
  order: Order,
  customerName: string,
  phoneNumber: string,
  newStatus: string,
  trackingNumber?: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generateOrderStatusUpdateWhatsapp(order, customerName, newStatus, trackingNumber);

    return await queueWhatsapp(
      WhatsappType.ORDER_STATUS_UPDATE,
      WhatsappPriority.NORMAL,
      phoneNumber,
      message,
      {
        orderId: order.id,
        oldStatus: order.status,
        newStatus,
        trackingNumber,
        customerName
      },
      userId
    );
  } catch (error) {
    console.error('Error sending order status update WhatsApp:', error);
    return false;
  }
}

/**
 * Send payment confirmation WhatsApp
 */
export async function sendPaymentConfirmationWhatsapp(
  order: Order,
  customerName: string,
  phoneNumber: string,
  paymentMethod: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generatePaymentConfirmationWhatsapp(order, customerName, paymentMethod);

    return await queueWhatsapp(
      WhatsappType.PAYMENT_CONFIRMATION,
      WhatsappPriority.HIGH,
      phoneNumber,
      message,
      {
        orderId: order.id,
        paymentAmount: order.total,
        paymentMethod,
        customerName
      },
      userId
    );
  } catch (error) {
    console.error('Error sending payment confirmation WhatsApp:', error);
    return false;
  }
}

/**
 * Send shipping notification WhatsApp
 */
export async function sendShippingNotificationWhatsapp(
  order: Order,
  customerName: string,
  phoneNumber: string,
  trackingNumber: string,
  estimatedDelivery?: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generateShippingNotificationWhatsapp(order, customerName, trackingNumber, estimatedDelivery);

    return await queueWhatsapp(
      WhatsappType.SHIPPING_NOTIFICATION,
      WhatsappPriority.NORMAL,
      phoneNumber,
      message,
      {
        orderId: order.id,
        trackingNumber,
        estimatedDelivery,
        customerName
      },
      userId
    );
  } catch (error) {
    console.error('Error sending shipping notification WhatsApp:', error);
    return false;
  }
}

/**
 * Send delivery notification WhatsApp
 */
export async function sendDeliveryNotificationWhatsapp(
  order: Order,
  customerName: string,
  phoneNumber: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generateDeliveryNotificationWhatsapp(order, customerName);

    return await queueWhatsapp(
      WhatsappType.DELIVERY_NOTIFICATION,
      WhatsappPriority.NORMAL,
      phoneNumber,
      message,
      {
        orderId: order.id,
        customerName
      },
      userId
    );
  } catch (error) {
    console.error('Error sending delivery notification WhatsApp:', error);
    return false;
  }
}

/**
 * Send payment failure WhatsApp
 */
export async function sendPaymentFailedWhatsapp(
  order: Order,
  customerName: string,
  phoneNumber: string,
  failureReason?: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generatePaymentFailedWhatsapp(order, customerName, failureReason);

    return await queueWhatsapp(
      WhatsappType.PAYMENT_FAILED,
      WhatsappPriority.HIGH,
      phoneNumber,
      message,
      {
        orderId: order.id,
        failureReason,
        customerName
      },
      userId
    );
  } catch (error) {
    console.error('Error sending payment failure WhatsApp:', error);
    return false;
  }
}

/**
 * Send order cancellation WhatsApp
 */
export async function sendOrderCancellationWhatsapp(
  order: Order,
  customerName: string,
  phoneNumber: string,
  reason?: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generateOrderCancellationWhatsapp(order, customerName, reason);

    return await queueWhatsapp(
      WhatsappType.ORDER_CANCELLATION,
      WhatsappPriority.NORMAL,
      phoneNumber,
      message,
      {
        orderId: order.id,
        cancellationReason: reason,
        customerName
      },
      userId
    );
  } catch (error) {
    console.error('Error sending order cancellation WhatsApp:', error);
    return false;
  }
}

/**
 * Send account welcome WhatsApp
 */
export async function sendAccountWelcomeWhatsapp(
  customerName: string,
  phoneNumber: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generateAccountWelcomeWhatsapp(customerName);

    return await queueWhatsapp(
      WhatsappType.ACCOUNT_WELCOME,
      WhatsappPriority.NORMAL,
      phoneNumber,
      message,
      {
        customerName
      },
      userId
    );
  } catch (error) {
    console.error('Error sending account welcome WhatsApp:', error);
    return false;
  }
}

/**
 * Send stock alert WhatsApp
 */
export async function sendStockAlertWhatsapp(
  productName: string,
  customerName: string,
  phoneNumber: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generateStockAlertWhatsapp(productName, customerName);

    return await queueWhatsapp(
      WhatsappType.STOCK_ALERT,
      WhatsappPriority.LOW,
      phoneNumber,
      message,
      {
        productName,
        customerName
      },
      userId
    );
  } catch (error) {
    console.error('Error sending stock alert WhatsApp:', error);
    return false;
  }
}

// =============================================================================
// WHATSAPP QUEUE PROCESSING SCHEDULER
// =============================================================================

/**
 * Start WhatsApp queue processor
 * Process WhatsApp queue every 30 seconds
 */
export function startWhatsappQueueProcessor(): void {
  console.log('🚀 Starting WhatsApp queue processor...');

  // Process immediately
  setImmediate(() => processWhatsappQueue());

  // Then process every 30 seconds
  setInterval(() => {
    processWhatsappQueue().catch(error => {
      console.error('Error in WhatsApp queue processor:', error);
    });
  }, 30000);
}

// =============================================================================
// WHATSAPP WEBHOOK HANDLERS (for delivery status updates)
// =============================================================================

/**
 * Handle Twilio WhatsApp status webhook
 * This updates delivery status based on webhook callbacks
 */
export async function handleWhatsappStatusWebhook(webhookData: any): Promise<void> {
  try {
    const { MessageSid, MessageStatus, To, From } = webhookData;

    if (!MessageSid) {
      console.warn('WhatsApp webhook missing MessageSid');
      return;
    }

    console.log(`📱 WhatsApp webhook: ${MessageSid} -> ${MessageStatus}`);

    // Update delivery log status
    await storage.updateWhatsappDeliveryLogStatus(MessageSid, MessageStatus, webhookData);

    // Update queue status if applicable
    const queueEntry = await storage.getWhatsappQueueByTwilioSid(MessageSid);
    if (queueEntry) {
      let newStatus = queueEntry.status;

      switch (MessageStatus) {
        case 'delivered':
          newStatus = 'delivered';
          await storage.updateWhatsappQueueStatus(queueEntry.id, newStatus, {
            deliveredAt: new Date(),
          });
          break;
        case 'read':
          newStatus = 'delivered'; // We consider read as delivered
          await storage.updateWhatsappQueueStatus(queueEntry.id, newStatus, {
            deliveredAt: new Date(),
            readAt: new Date(),
          });
          break;
        case 'failed':
        case 'undelivered':
          newStatus = 'failed';
          await storage.updateWhatsappQueueStatus(queueEntry.id, newStatus, {
            lastError: webhookData.ErrorMessage || 'Delivery failed',
          });
          break;
      }
    }

    console.log(`✅ WhatsApp webhook processed: ${MessageSid}`);
  } catch (error) {
    console.error('❌ Error processing WhatsApp webhook:', error);
  }
}

// =============================================================================
// WHATSAPP OPT-IN MANAGEMENT
// =============================================================================

/**
 * Handle WhatsApp opt-in request
 */
export async function handleWhatsappOptIn(
  phoneNumber: string,
  userId?: string,
  source: string = 'website'
): Promise<boolean> {
  try {
    const formattedPhone = validateAndFormatWhatsappNumber(phoneNumber);
    if (!formattedPhone) {
      return false;
    }

    // Generate opt-in token
    const optInToken = crypto.randomBytes(32).toString('hex');

    // Create or update WhatsApp preferences
    await storage.createOrUpdateWhatsappPreferences({
      userId,
      phoneNumber: formattedPhone,
      isOptedIn: true,
      optInToken,
      optInDate: new Date(),
      optInMethod: source,
      consentSource: source,
    });

    console.log(`✅ WhatsApp opt-in processed for ${formattedPhone}`);
    return true;
  } catch (error) {
    console.error('Error processing WhatsApp opt-in:', error);
    return false;
  }
}

/**
 * Handle WhatsApp opt-out request
 */
export async function handleWhatsappOptOut(
  phoneNumber: string,
  userId?: string,
  method: string = 'user_request'
): Promise<boolean> {
  try {
    const formattedPhone = validateAndFormatWhatsappNumber(phoneNumber);
    if (!formattedPhone) {
      return false;
    }

    // Update WhatsApp preferences to opt out
    await storage.updateWhatsappOptOut(formattedPhone, userId, method);

    console.log(`✅ WhatsApp opt-out processed for ${formattedPhone}`);
    return true;
  } catch (error) {
    console.error('Error processing WhatsApp opt-out:', error);
    return false;
  }
}

// All functions and enums are already exported with 'export' keyword above