import twilio from 'twilio';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import crypto from 'crypto';
import { storage } from './storage';
import type { Order, OrderItem, Product, User, UserPreferences } from '@shared/schema';
import dotenv from "dotenv";
dotenv.config();


// =============================================================================
// TWILIO SMS SERVICE INTEGRATION
// =============================================================================
// Comprehensive SMS notification system for Bmaafashion e-commerce platform

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.warn("TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables not set. SMS functionality will be disabled.");
}

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Default Twilio phone number for sending SMS
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

// SMS Types Enum for different notification categories
export enum SmsType {
  ORDER_CONFIRMATION = 'order_confirmation',
  ORDER_STATUS_UPDATE = 'order_status_update',
  SHIPPING_NOTIFICATION = 'shipping_notification',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  PAYMENT_FAILED = 'payment_failed',
  DELIVERY_NOTIFICATION = 'delivery_notification',
  ORDER_CANCELLATION = 'order_cancellation',
  ACCOUNT_VERIFICATION = 'account_verification',
  STOCK_ALERT = 'stock_alert',
  PROMOTIONAL = 'promotional'
}

// SMS Priority Levels
export enum SmsPriority {
  HIGH = 'high',        // Immediate delivery (payment, security)
  NORMAL = 'normal',    // Standard delivery (orders, shipping)
  LOW = 'low'           // Bulk/promotional messages
}

// SMS Queue Entry Interface
interface SmsQueueEntry {
  id: string;
  type: SmsType;
  priority: SmsPriority;
  to: string;
  from: string;
  message: string;
  data?: Record<string, any>;
  userId?: string;
  retryCount: number;
  maxRetries: number;
  scheduledAt: Date;
  createdAt: Date;
  lastError?: string;
}

// Enhanced SMS Parameters Interface
interface SmsParams {
  to: string;
  from: string;
  message: string;
}

// Template Variable Interface
interface SmsTemplateVariables {
  recipientName: string;
  recipientPhone: string;
  [key: string]: any;
}

// Constants for SMS processing
const maxRetries = 3;
const retryDelays = [30000, 300000, 1800000]; // 30s, 5min, 30min

// Rate Limiting Configuration (enforced via database)
const rateLimits = {
  [SmsPriority.HIGH]: { perMinute: 10, perHour: 100 },
  [SmsPriority.NORMAL]: { perMinute: 5, perHour: 50 },
  [SmsPriority.LOW]: { perMinute: 2, perHour: 20 }
};

// =============================================================================
// PHONE NUMBER VALIDATION AND FORMATTING
// =============================================================================

/**
 * Validate and format phone number for SMS delivery
 * @param phoneNumber Raw phone number string
 * @param defaultCountry Default country code (default: IN for India)
 * @returns Formatted phone number or null if invalid
 */
export function validateAndFormatPhoneNumber(
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

    // Parse and format the phone number
    const parsed = parsePhoneNumber(cleaned, defaultCountry as any);
    return parsed.format('E.164'); // International format
  } catch (error) {
    console.error('Phone number validation error:', error);
    return null;
  }
}

/**
 * Check if user has opted in for SMS notifications
 * @param phoneNumber Phone number to check
 * @param userId Optional user ID
 * @returns Whether user has opted in
 */
export async function checkSmsOptInStatus(
  phoneNumber: string,
  userId?: string
): Promise<boolean> {
  try {
    const smsPreferences = await storage.getSmsPreferences(phoneNumber, userId);
    return smsPreferences?.isOptedIn || false;
  } catch (error) {
    console.error('Error checking SMS opt-in status:', error);
    return false;
  }
}

// =============================================================================
// SMS TEMPLATE SYSTEM
// =============================================================================

/**
 * Generate order confirmation SMS message
 */
export function generateOrderConfirmationSms(
  order: Order & { items: (OrderItem & { product: Product })[] },
  customerName: string
): string {
  const orderNumber = order.id.slice(-8).toUpperCase();
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
  const total = Number(order.total).toFixed(2);

  return `Hi ${customerName}! 🎉 Your Bmaafashion order #${orderNumber} for ${itemCount} item(s) worth ₹${total} has been confirmed. Track your order with us! - Bmaafashion`;
}

/**
 * Generate order status update SMS message
 */
export function generateOrderStatusUpdateSms(
  order: Order,
  customerName: string,
  newStatus: string,
  trackingNumber?: string
): string {
  const orderNumber = order.id.slice(-8).toUpperCase();

  const statusMessages = {
    pending: `📦 Order #${orderNumber} received and being prepared`,
    processing: `🔄 Order #${orderNumber} is now being processed`,
    shipped: `🚚 Great news! Order #${orderNumber} has shipped${trackingNumber ? ` (Track: ${trackingNumber})` : ''}`,
    delivered: `✅ Order #${orderNumber} delivered! Thank you for choosing Bmaafashion`,
    cancelled: `❌ Order #${orderNumber} has been cancelled. Contact support if needed`
  };

  const message = statusMessages[newStatus as keyof typeof statusMessages] ||
    `📋 Order #${orderNumber} status updated to: ${newStatus}`;

  return `Hi ${customerName}! ${message} - Bmaafashion`;
}

/**
 * Generate payment confirmation SMS message
 */
export function generatePaymentConfirmationSms(
  order: Order,
  customerName: string,
  paymentMethod: string
): string {
  const orderNumber = order.id.slice(-8).toUpperCase();
  const amount = Number(order.total).toFixed(2);

  return `Hi ${customerName}! 💳 Payment of ₹${amount} confirmed for order #${orderNumber} via ${paymentMethod}. Your order is being prepared! - Bmaafashion`;
}

/**
 * Generate shipping notification SMS message
 */
export function generateShippingNotificationSms(
  order: Order,
  customerName: string,
  trackingNumber: string,
  estimatedDelivery?: string
): string {
  const orderNumber = order.id.slice(-8).toUpperCase();
  const deliveryInfo = estimatedDelivery ? ` Est. delivery: ${estimatedDelivery}` : '';

  return `Hi ${customerName}! 🚚 Your Bmaafashion order #${orderNumber} is on its way! Track: ${trackingNumber}${deliveryInfo} - Bmaafashion`;
}

/**
 * Generate delivery notification SMS message
 */
export function generateDeliveryNotificationSms(
  order: Order,
  customerName: string
): string {
  const orderNumber = order.id.slice(-8).toUpperCase();

  return `Hi ${customerName}! � Your Bmaafashion order #${orderNumber} has been delivered! Thank you for shopping with us. - Bmaafashion`;
}

/**
 * Generate payment failure SMS message
 */
export function generatePaymentFailedSms(
  order: Order,
  customerName: string,
  failureReason?: string
): string {
  const orderNumber = order.id.slice(-8).toUpperCase();
  const reason = failureReason ? ` Reason: ${failureReason}` : '';

  return `Hi ${customerName}! ❌ Payment failed for order #${orderNumber}.${reason} Please retry or contact support. - Bmaafashion`;
}

/**
 * Generate order cancellation SMS message
 */
export function generateOrderCancellationSms(
  order: Order,
  customerName: string,
  reason?: string
): string {
  const orderNumber = order.id.slice(-8).toUpperCase();
  const cancellationReason = reason ? ` Reason: ${reason}` : '';

  return `Hi ${customerName}! Your order #${orderNumber} has been cancelled.${cancellationReason} Refund will be processed if applicable. - Bmaafashion`;
}

// =============================================================================
// SMS DELIVERY FUNCTIONS
// =============================================================================

/**
 * Send SMS using Twilio with delivery tracking
 * @param params SMS parameters
 * @returns Success status and message SID
 */
async function sendSmsViaTwilio(params: SmsParams): Promise<{
  success: boolean;
  messageSid?: string;
  error?: string;
}> {
  try {
    if (!twilioClient) {
      throw new Error('Twilio client not initialized. Check environment variables.');
    }

    console.log(`📱 Sending SMS to ${params.to}: ${params.message.substring(0, 50)}...`);

    const message = await twilioClient.messages.create({
      body: params.message,
      from: params.from,
      to: params.to,
    });

    console.log(`✅ SMS sent successfully. SID: ${message.sid}`);

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (error: any) {
    console.error('❌ Failed to send SMS via Twilio:', error);
    return {
      success: false,
      error: error.message || 'Unknown Twilio error',
    };
  }
}

/**
 * Add SMS to queue for reliable delivery
 * @param type SMS type
 * @param priority SMS priority
 * @param to Recipient phone number
 * @param message SMS message content
 * @param templateData Template variables
 * @param userId Optional user ID
 * @returns Success status
 */
export async function queueSms(
  type: SmsType,
  priority: SmsPriority,
  to: string,
  message: string,
  templateData?: Record<string, any>,
  userId?: string
): Promise<boolean> {
  try {
    console.log(`📨 Queuing SMS: ${type} to ${to}`);

    // Validate phone number
    const formattedPhone = validateAndFormatPhoneNumber(to);
    if (!formattedPhone) {
      console.error(`❌ Invalid phone number: ${to}`);
      return false;
    }

    // Check opt-in status
    const isOptedIn = await checkSmsOptInStatus(formattedPhone, userId);
    if (!isOptedIn && type !== SmsType.ACCOUNT_VERIFICATION) {
      console.log(`⚠️ User has not opted in for SMS notifications: ${formattedPhone}`);
      return false;
    }

    // Check rate limits
    const rateLimitOk = await checkSmsRateLimit(formattedPhone, priority);
    if (!rateLimitOk) {
      console.warn(`⚠️ SMS rate limit exceeded for ${formattedPhone}`);
      return false;
    }

    // Add to SMS queue
    const smsQueueEntry = await storage.createSmsQueue({
      type,
      priority,
      status: 'pending',
      to: formattedPhone,
      from: TWILIO_PHONE_NUMBER,
      message,
      templateData: templateData || {},
      userId,
      retryCount: 0,
      maxRetries,
      scheduledAt: new Date(),
    });

    console.log(`✅ SMS queued successfully: ${smsQueueEntry.id}`);

    // For high priority messages, attempt immediate delivery
    if (priority === SmsPriority.HIGH) {
      setImmediate(() => processSmsQueue());
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to queue SMS:', error);
    return false;
  }
}

/**
 * Process SMS queue and send pending messages
 */
export async function processSmsQueue(): Promise<void> {
  try {
    console.log('🔄 Processing SMS queue...');

    // Get pending SMS messages ordered by priority and scheduled time
    const pendingSms = await storage.getPendingSmsQueue();

    if (pendingSms.length === 0) {
      return;
    }

    console.log(`📱 Found ${pendingSms.length} pending SMS messages`);

    for (const sms of pendingSms) {
      try {
        // Check if retry delay has passed
        const now = new Date();
        const scheduledTime = new Date(sms.scheduledAt);

        if (sms.retryCount > 0) {
          const delayMs = retryDelays[Math.min(sms.retryCount - 1, retryDelays.length - 1)];
          const nextRetryTime = new Date(scheduledTime.getTime() + delayMs);

          if (now < nextRetryTime) {
            continue; // Skip this message, not ready for retry yet
          }
        }

        // Attempt to send SMS
        await storage.updateSmsQueueStatus(sms.id, 'sending');

        const result = await sendSmsViaTwilio({
          to: sms.to,
          from: sms.from,
          message: sms.message,
        });

        if (result.success) {
          // SMS sent successfully
          await storage.updateSmsQueueStatus(sms.id, 'sent', {
            twilioSid: result.messageSid,
            sentAt: new Date(),
          });

          // Create delivery log
          if (result.messageSid) {
            await storage.createSmsDeliveryLog({
              smsQueueId: sms.id,
              twilioSid: result.messageSid,
              phoneNumber: sms.to,
              status: 'sent',
              direction: 'outbound',
              numSegments: Math.ceil(sms.message.length / 160),
            });
          }

          console.log(`✅ SMS sent successfully: ${sms.id}`);
        } else {
          // SMS failed to send
          const newRetryCount = sms.retryCount + 1;

          if (newRetryCount >= sms.maxRetries) {
            // Max retries reached, mark as failed
            await storage.updateSmsQueueStatus(sms.id, 'failed', {
              lastError: result.error,
            });
            console.error(`❌ SMS failed permanently after ${sms.maxRetries} retries: ${sms.id}`);
          } else {
            // Schedule retry
            await storage.updateSmsQueueRetry(sms.id, newRetryCount, result.error);
            console.warn(`⚠️ SMS failed, scheduled for retry ${newRetryCount}/${sms.maxRetries}: ${sms.id}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing SMS ${sms.id}:`, error);

        // Update retry count
        const newRetryCount = sms.retryCount + 1;
        if (newRetryCount >= sms.maxRetries) {
          await storage.updateSmsQueueStatus(sms.id, 'failed', {
            lastError: (error as Error).message,
          });
        } else {
          await storage.updateSmsQueueRetry(sms.id, newRetryCount, (error as Error).message);
        }
      }
    }

    console.log('✅ SMS queue processing completed');
  } catch (error) {
    console.error('❌ Error processing SMS queue:', error);
  }
}

/**
 * Check SMS rate limits
 * @param identifier Phone number or user ID
 * @param priority SMS priority
 * @returns Whether rate limit allows sending
 */
async function checkSmsRateLimit(
  identifier: string,
  priority: SmsPriority
): Promise<boolean> {
  try {
    const limits = rateLimits[priority];
    const now = new Date();

    // Check minute rate limit
    const minuteWindow = new Date(now.getTime() - 60 * 1000);
    const minuteCount = await storage.getSmsRateLimitCount(identifier, minuteWindow, 'minute', priority);

    if (minuteCount >= limits.perMinute) {
      return false;
    }

    // Check hour rate limit  
    const hourWindow = new Date(now.getTime() - 60 * 60 * 1000);
    const hourCount = await storage.getSmsRateLimitCount(identifier, hourWindow, 'hour', priority);

    if (hourCount >= limits.perHour) {
      return false;
    }

    // Update rate limit counters
    await storage.incrementSmsRateLimit(identifier, priority);

    return true;
  } catch (error) {
    console.error('Error checking SMS rate limit:', error);
    return true; // Allow on error to avoid blocking legitimate messages
  }
}

// =============================================================================
// HIGH-LEVEL SMS SENDING FUNCTIONS
// =============================================================================

/**
 * Send order confirmation SMS
 */
export async function sendOrderConfirmationSms(
  order: Order & { items: (OrderItem & { product: Product })[] },
  customerName: string,
  phoneNumber: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generateOrderConfirmationSms(order, customerName);

    return await queueSms(
      SmsType.ORDER_CONFIRMATION,
      SmsPriority.HIGH,
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
    console.error('Error sending order confirmation SMS:', error);
    return false;
  }
}

/**
 * Send order status update SMS
 */
export async function sendOrderStatusUpdateSms(
  order: Order,
  customerName: string,
  phoneNumber: string,
  newStatus: string,
  trackingNumber?: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generateOrderStatusUpdateSms(order, customerName, newStatus, trackingNumber);

    return await queueSms(
      SmsType.ORDER_STATUS_UPDATE,
      SmsPriority.NORMAL,
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
    console.error('Error sending order status update SMS:', error);
    return false;
  }
}

/**
 * Send payment confirmation SMS
 */
export async function sendPaymentConfirmationSms(
  order: Order,
  customerName: string,
  phoneNumber: string,
  paymentMethod: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generatePaymentConfirmationSms(order, customerName, paymentMethod);

    return await queueSms(
      SmsType.PAYMENT_CONFIRMATION,
      SmsPriority.HIGH,
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
    console.error('Error sending payment confirmation SMS:', error);
    return false;
  }
}

/**
 * Send shipping notification SMS
 */
export async function sendShippingNotificationSms(
  order: Order,
  customerName: string,
  phoneNumber: string,
  trackingNumber: string,
  estimatedDelivery?: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generateShippingNotificationSms(order, customerName, trackingNumber, estimatedDelivery);

    return await queueSms(
      SmsType.SHIPPING_NOTIFICATION,
      SmsPriority.NORMAL,
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
    console.error('Error sending shipping notification SMS:', error);
    return false;
  }
}

/**
 * Send delivery notification SMS
 */
export async function sendDeliveryNotificationSms(
  order: Order,
  customerName: string,
  phoneNumber: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generateDeliveryNotificationSms(order, customerName);

    return await queueSms(
      SmsType.DELIVERY_NOTIFICATION,
      SmsPriority.NORMAL,
      phoneNumber,
      message,
      {
        orderId: order.id,
        customerName
      },
      userId
    );
  } catch (error) {
    console.error('Error sending delivery notification SMS:', error);
    return false;
  }
}

/**
 * Send payment failure SMS
 */
export async function sendPaymentFailedSms(
  order: Order,
  customerName: string,
  phoneNumber: string,
  failureReason?: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generatePaymentFailedSms(order, customerName, failureReason);

    return await queueSms(
      SmsType.PAYMENT_FAILED,
      SmsPriority.HIGH,
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
    console.error('Error sending payment failure SMS:', error);
    return false;
  }
}

/**
 * Send order cancellation SMS
 */
export async function sendOrderCancellationSms(
  order: Order,
  customerName: string,
  phoneNumber: string,
  reason?: string,
  userId?: string
): Promise<boolean> {
  try {
    const message = generateOrderCancellationSms(order, customerName, reason);

    return await queueSms(
      SmsType.ORDER_CANCELLATION,
      SmsPriority.NORMAL,
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
    console.error('Error sending order cancellation SMS:', error);
    return false;
  }
}

// =============================================================================
// SMS QUEUE PROCESSING SCHEDULER
// =============================================================================

/**
 * Start SMS queue processor
 * Process SMS queue every 30 seconds
 */
export function startSmsQueueProcessor(): void {
  console.log('🚀 Starting SMS queue processor...');

  // Process immediately
  setImmediate(() => processSmsQueue());

  // Then process every 30 seconds
  setInterval(() => {
    processSmsQueue().catch(error => {
      console.error('Error in SMS queue processor:', error);
    });
  }, 30000);
}

// =============================================================================
// SMS WEBHOOK HANDLERS (for delivery status updates)
// =============================================================================

/**
 * Handle Twilio SMS status webhook
 * @param webhookData Twilio webhook payload
 */
export async function handleTwilioSmsWebhook(webhookData: any): Promise<void> {
  try {
    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = webhookData;

    if (!MessageSid) {
      console.warn('Webhook received without MessageSid');
      return;
    }

    console.log(`📱 SMS status update: ${MessageSid} -> ${MessageStatus}`);

    // Update delivery log
    await storage.updateSmsDeliveryLogStatus(MessageSid, {
      status: MessageStatus,
      errorCode: ErrorCode,
      errorMessage: ErrorMessage,
    });

    // Update SMS queue status if needed
    if (MessageStatus === 'delivered') {
      await storage.updateSmsQueueStatusByTwilioSid(MessageSid, 'delivered', {
        deliveredAt: new Date(),
      });
    } else if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
      await storage.updateSmsQueueStatusByTwilioSid(MessageSid, 'failed', {
        lastError: ErrorMessage || `SMS ${MessageStatus}`,
      });
    }

  } catch (error) {
    console.error('Error handling Twilio SMS webhook:', error);
  }
}

// Export SMS service functions
export default {
  queueSms,
  processSmsQueue,
  sendOrderConfirmationSms,
  sendOrderStatusUpdateSms,
  sendPaymentConfirmationSms,
  sendShippingNotificationSms,
  sendDeliveryNotificationSms,
  sendPaymentFailedSms,
  sendOrderCancellationSms,
  validateAndFormatPhoneNumber,
  checkSmsOptInStatus,
  startSmsQueueProcessor,
  handleTwilioSmsWebhook,
  SmsType,
  SmsPriority,
};