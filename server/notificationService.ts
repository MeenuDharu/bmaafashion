import { 
  sendVerificationEmail, 
  sendOrderConfirmationEmail,
  sendAdminOrderNotificationEmail,
  sendOrderStatusUpdateEmail,
  sendPaymentConfirmationEmail,
  sendPaymentFailureEmail,
  EmailType,
  EmailPriority
} from './emailService';
import { 
  sendOrderConfirmationSms,
  sendOrderStatusUpdateSms,
  sendPaymentConfirmationSms,
  sendPaymentFailedSms,
  sendShippingNotificationSms,
  sendDeliveryNotificationSms,
  sendOrderCancellationSms,
  validateAndFormatPhoneNumber,
  checkSmsOptInStatus,
  SmsType,
  SmsPriority
} from './smsService';
import { 
  sendOrderConfirmationWhatsapp,
  sendOrderStatusUpdateWhatsapp,
  sendPaymentConfirmationWhatsapp,
  sendPaymentFailedWhatsapp,
  sendShippingNotificationWhatsapp,
  sendDeliveryNotificationWhatsapp,
  sendOrderCancellationWhatsapp,
  sendAccountWelcomeWhatsapp,
  validateAndFormatWhatsappNumber,
  checkWhatsappOptInStatus,
  WhatsappType,
  WhatsappPriority
} from './whatsappService';
import { storage } from './storage';
import type { Order, OrderItem, Product, User } from '@shared/schema';

// =============================================================================
// NOTIFICATION SERVICE LAYER
// =============================================================================
// This service manages all email, SMS, and WhatsApp notification triggers for various application events

export class NotificationService {
  
  // =============================================================================
  // HELPER METHODS FOR PHONE NUMBER AND MULTI-CHANNEL MANAGEMENT
  // =============================================================================
  
  /**
   * Extract phone number from user data, order data, or profile
   */
  private static async getPhoneNumberForNotification(
    order: Order,
    userId?: string
  ): Promise<string | null> {
    try {
      // First, check if phone is in the order (guest checkout with phone)
      if (order.customerPhone) {
        return validateAndFormatPhoneNumber(order.customerPhone);
      }
      
      // Second, check user profile if we have a userId
      if (userId) {
        const user = await storage.getUser(userId);
        if (user?.phoneNumber) {
          return validateAndFormatPhoneNumber(user.phoneNumber);
        }
      }
      
      // Third, check if order has userId and fetch user
      if (order.userId) {
        const user = await storage.getUser(order.userId);
        if (user?.phoneNumber) {
          return validateAndFormatPhoneNumber(user.phoneNumber);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting phone number for notification:', error);
      return null;
    }
  }

  /**
   * Extract WhatsApp number from user data, order data, or profile
   */
  private static async getWhatsappNumberForNotification(
    order: Order,
    userId?: string
  ): Promise<string | null> {
    try {
      // First, check if phone is in the order (guest checkout with phone)
      if (order.customerPhone) {
        return validateAndFormatWhatsappNumber(order.customerPhone);
      }
      
      // Second, check user profile if we have a userId
      if (userId) {
        const user = await storage.getUser(userId);
        if (user?.phoneNumber) {
          return validateAndFormatWhatsappNumber(user.phoneNumber);
        }
      }
      
      // Third, check if order has userId and fetch user
      if (order.userId) {
        const user = await storage.getUser(order.userId);
        if (user?.phoneNumber) {
          return validateAndFormatWhatsappNumber(user.phoneNumber);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting WhatsApp number for notification:', error);
      return null;
    }
  }
  
  /**
   * Check if SMS notifications should be sent for this user/phone
   */
  private static async shouldSendSms(
    phoneNumber: string,
    userId?: string,
    smsType?: SmsType
  ): Promise<boolean> {
    try {
      // Always allow account verification SMS
      if (smsType === SmsType.ACCOUNT_VERIFICATION) {
        return true;
      }
      
      // Check SMS opt-in status
      const isOptedIn = await checkSmsOptInStatus(phoneNumber, userId);
      if (!isOptedIn) {
        return false;
      }
      
      // Check user preferences if we have a userId
      if (userId) {
        const userPrefs = await storage.getUserPreferences(userId);
        if (userPrefs && userPrefs.smsNotifications) {
          // Check specific SMS preferences
          switch (smsType) {
            case SmsType.ORDER_CONFIRMATION:
              return (userPrefs.smsNotifications.orderUpdates ?? true);
            case SmsType.ORDER_STATUS_UPDATE:
              return (userPrefs.smsNotifications.orderUpdates ?? true);
            case SmsType.PAYMENT_CONFIRMATION:
              return (userPrefs.smsNotifications.paymentConfirmations ?? true);
            case SmsType.PAYMENT_FAILED:
              return (userPrefs.smsNotifications.paymentConfirmations ?? true); // Use same setting
            case SmsType.SHIPPING_NOTIFICATION:
              return (userPrefs.smsNotifications.shippingNotifications ?? true);
            case SmsType.DELIVERY_NOTIFICATION:
              return (userPrefs.smsNotifications.accountNotifications ?? true);
            case SmsType.ORDER_CANCELLATION:
              return (userPrefs.smsNotifications.orderUpdates ?? true); // Use order updates setting
            case SmsType.PROMOTIONAL:
              return (userPrefs.smsNotifications.promotionalOffers ?? true);
            default:
              return true; // Default to allow for other types
          }
        }
      }
      
      return true; // Default to allow if no specific preferences
    } catch (error) {
      console.error('Error checking SMS send status:', error);
      return false; // Default to not send on error
    }
  }

  /**
   * Check if WhatsApp notifications should be sent for this user/phone
   */
  private static async shouldSendWhatsapp(
    phoneNumber: string,
    userId?: string,
    whatsappType?: WhatsappType
  ): Promise<boolean> {
    try {
      // Always allow account verification WhatsApp
      if (whatsappType === WhatsappType.ACCOUNT_VERIFICATION) {
        return true;
      }
      
      // Check WhatsApp opt-in status
      const isOptedIn = await checkWhatsappOptInStatus(phoneNumber, userId);
      if (!isOptedIn) {
        return false;
      }
      
      // Check user preferences if we have a userId
      if (userId) {
        const userPrefs = await storage.getUserPreferences(userId);
        if (userPrefs && userPrefs.whatsappNotifications) {
          // Check specific WhatsApp preferences
          switch (whatsappType) {
            case WhatsappType.ORDER_CONFIRMATION:
              return (userPrefs.whatsappNotifications.orderConfirmation ?? true);
            case WhatsappType.ORDER_STATUS_UPDATE:
              return (userPrefs.whatsappNotifications.orderUpdates ?? true);
            case WhatsappType.PAYMENT_CONFIRMATION:
              return (userPrefs.whatsappNotifications.paymentConfirmations ?? true);
            case WhatsappType.PAYMENT_FAILED:
              return (userPrefs.whatsappNotifications.paymentConfirmations ?? true); // Use same setting
            case WhatsappType.SHIPPING_NOTIFICATION:
              return (userPrefs.whatsappNotifications.shippingNotifications ?? true);
            case WhatsappType.DELIVERY_NOTIFICATION:
              return (userPrefs.whatsappNotifications.deliveryNotifications ?? true);
            case WhatsappType.ORDER_CANCELLATION:
              return (userPrefs.whatsappNotifications.orderUpdates ?? true); // Use order updates setting
            case WhatsappType.PROMOTIONAL:
              return (userPrefs.whatsappNotifications.promotionalMessages ?? true);
            case WhatsappType.STOCK_ALERT:
              return (userPrefs.whatsappNotifications.stockAlerts ?? true);
            case WhatsappType.ACCOUNT_WELCOME:
              return (userPrefs.whatsappNotifications.accountNotifications ?? true);
            default:
              return true; // Default to allow for other types
          }
        }
      }
      
      return true; // Default to allow if no specific preferences
    } catch (error) {
      console.error('Error checking WhatsApp send status:', error);
      return false; // Default to not send on error
    }
  }
  
  // =============================================================================
  // ORDER LIFECYCLE NOTIFICATIONS
  // =============================================================================
  
  /**
   * Trigger order confirmation notifications (email + SMS + WhatsApp) after successful order creation
   */
  static async triggerOrderConfirmationNotifications(
    order: Order & { items: (OrderItem & { product: Product })[] },
    customerName?: string,
    userId?: string
  ): Promise<{ email: boolean; sms: boolean; whatsapp: boolean }> {
    const results = { email: false, sms: false, whatsapp: false };
    
    try {
      console.log(`📧📱💬 Triggering order confirmation notifications for order ${order.id}`);
      
      // Use provided customer name or extract from order
      const name = customerName || order.customerName;
      const orderUserId = userId || order.userId || undefined;
      
      // Send email notification
      results.email = await sendOrderConfirmationEmail(
        order,
        name,
        order.customerEmail,
        orderUserId
      );
      
      if (results.email) {
        console.log(`✅ Order confirmation email queued for order ${order.id.slice(-8)}`);
        
        // Create notification record for tracking
        await this.createNotificationRecord(
          orderUserId,
          EmailType.ORDER_CONFIRMATION,
          `Order Confirmed #${order.id.slice(-8).toUpperCase()}`,
          `Your order for ₹${order.total} has been confirmed and is being processed.`,
          { orderId: order.id, orderTotal: order.total }
        );
      }
      
      // Send admin notification email
      const adminEmailSent = await sendAdminOrderNotificationEmail(
        order,
        name,
        order.customerEmail
      );
      
      if (adminEmailSent) {
        console.log(`✅ Admin order notification email queued for order ${order.id.slice(-8)}`);
      } else {
        console.log(`⚠️ Admin order notification email skipped for order ${order.id.slice(-8)} - no admin email configured`);
      }
      
      // Send SMS notification
      const phoneNumber = await this.getPhoneNumberForNotification(order, orderUserId);
      if (phoneNumber) {
        const shouldSend = await this.shouldSendSms(phoneNumber, orderUserId, SmsType.ORDER_CONFIRMATION);
        if (shouldSend) {
          results.sms = await sendOrderConfirmationSms(
            order,
            name,
            phoneNumber,
            orderUserId
          );
          
          if (results.sms) {
            console.log(`✅ Order confirmation SMS queued for order ${order.id.slice(-8)}`);
          }
        } else {
          console.log(`⚠️ SMS notification skipped for order ${order.id.slice(-8)} - user preferences or opt-out`);
        }
      } else {
        console.log(`⚠️ SMS notification skipped for order ${order.id.slice(-8)} - no valid phone number`);
      }

      // Send WhatsApp notification
      const whatsappNumber = await this.getWhatsappNumberForNotification(order, orderUserId);
      if (whatsappNumber) {
        const shouldSend = await this.shouldSendWhatsapp(whatsappNumber, orderUserId, WhatsappType.ORDER_CONFIRMATION);
        if (shouldSend) {
          results.whatsapp = await sendOrderConfirmationWhatsapp(
            order,
            name,
            whatsappNumber,
            orderUserId
          );
          
          if (results.whatsapp) {
            console.log(`✅ Order confirmation WhatsApp queued for order ${order.id.slice(-8)}`);
          }
        } else {
          console.log(`⚠️ WhatsApp notification skipped for order ${order.id.slice(-8)} - user preferences or opt-out`);
        }
      } else {
        console.log(`⚠️ WhatsApp notification skipped for order ${order.id.slice(-8)} - no valid WhatsApp number`);
      }
      
      return results;
    } catch (error) {
      console.error(`❌ Failed to trigger order confirmation notifications for order ${order.id}:`, error);
      return results;
    }
  }

  /**
   * Legacy method - trigger order confirmation email only
   * @deprecated Use triggerOrderConfirmationNotifications for both email and SMS
   */
  static async triggerOrderConfirmationEmail(
    order: Order & { items: (OrderItem & { product: Product })[] },
    customerName?: string,
    userId?: string
  ): Promise<boolean> {
    const results = await this.triggerOrderConfirmationNotifications(order, customerName, userId);
    return results.email;
  }

  /**
   * Trigger order status update notifications (email + SMS + WhatsApp) when order status changes
   */
  static async triggerOrderStatusUpdateNotifications(
    order: Order,
    newStatus: string,
    customerName?: string,
    trackingNumber?: string,
    userId?: string
  ): Promise<{ email: boolean; sms: boolean; whatsapp: boolean }> {
    const results = { email: false, sms: false, whatsapp: false };
    
    try {
      console.log(`📧📱 Triggering status update notifications for order ${order.id.slice(-8)}: ${order.status} -> ${newStatus}`);
      
      // Generate status-specific message
      const statusMessage = this.generateStatusMessage(newStatus, order.id.slice(-8));
      const name = customerName || order.customerName;
      const orderUserId = userId || order.userId || undefined;
      
      // Send email notification
      results.email = await sendOrderStatusUpdateEmail(
        { ...order, status: newStatus },
        name,
        order.customerEmail,
        statusMessage,
        trackingNumber,
        orderUserId
      );
      
      if (results.email) {
        console.log(`✅ Status update email queued for order ${order.id.slice(-8)}: ${newStatus}`);
        
        // Create notification record
        await this.createNotificationRecord(
          orderUserId,
          EmailType.ORDER_STATUS_UPDATE,
          `Order Update #${order.id.slice(-8).toUpperCase()} - ${newStatus.toUpperCase()}`,
          statusMessage,
          { 
            orderId: order.id, 
            oldStatus: order.status, 
            newStatus, 
            trackingNumber 
          }
        );
      }
      
      // Send SMS notification
      const phoneNumber = await this.getPhoneNumberForNotification(order, orderUserId);
      if (phoneNumber) {
        const shouldSend = await this.shouldSendSms(phoneNumber, orderUserId, SmsType.ORDER_STATUS_UPDATE);
        if (shouldSend) {
          results.sms = await sendOrderStatusUpdateSms(
            order,
            name,
            phoneNumber,
            newStatus,
            trackingNumber,
            orderUserId
          );
          
          if (results.sms) {
            console.log(`✅ Status update SMS queued for order ${order.id.slice(-8)}: ${newStatus}`);
          }
        } else {
          console.log(`⚠️ SMS notification skipped for order ${order.id.slice(-8)} - user preferences or opt-out`);
        }
      } else {
        console.log(`⚠️ SMS notification skipped for order ${order.id.slice(-8)} - no valid phone number`);
      }

      // Send WhatsApp notification
      const whatsappNumber = await this.getWhatsappNumberForNotification(order, orderUserId);
      if (whatsappNumber) {
        const shouldSend = await this.shouldSendWhatsapp(whatsappNumber, orderUserId, WhatsappType.ORDER_STATUS_UPDATE);
        if (shouldSend) {
          results.whatsapp = await sendOrderStatusUpdateWhatsapp(
            order,
            name,
            whatsappNumber,
            newStatus,
            trackingNumber,
            orderUserId
          );
          
          if (results.whatsapp) {
            console.log(`✅ Status update WhatsApp queued for order ${order.id.slice(-8)}: ${newStatus}`);
          }
        } else {
          console.log(`⚠️ WhatsApp notification skipped for order ${order.id.slice(-8)} - user preferences or opt-out`);
        }
      } else {
        console.log(`⚠️ WhatsApp notification skipped for order ${order.id.slice(-8)} - no valid WhatsApp number`);
      }
      
      return results;
    } catch (error) {
      console.error(`❌ Failed to trigger status update notifications for order ${order.id}:`, error);
      return results;
    }
  }

  /**
   * Legacy method - trigger order status update email only
   * @deprecated Use triggerOrderStatusUpdateNotifications for both email and SMS
   */
  static async triggerOrderStatusUpdateEmail(
    order: Order,
    newStatus: string,
    customerName?: string,
    trackingNumber?: string,
    userId?: string
  ): Promise<boolean> {
    const results = await this.triggerOrderStatusUpdateNotifications(
      order, newStatus, customerName, trackingNumber, userId
    );
    return results.email;
  }

  /**
   * Trigger payment confirmation notifications (email + SMS + WhatsApp) after successful payment
   */
  static async triggerPaymentConfirmationNotifications(
    order: Order,
    paymentMethod: string,
    customerName?: string,
    userId?: string
  ): Promise<{ email: boolean; sms: boolean; whatsapp: boolean }> {
    const results = { email: false, sms: false, whatsapp: false };
    
    try {
      console.log(`💳📱 Triggering payment confirmation notifications for order ${order.id.slice(-8)}`);
      
      const name = customerName || order.customerName;
      const orderUserId = userId || order.userId || undefined;
      
      // Send email notification
      results.email = await sendPaymentConfirmationEmail(
        order,
        name,
        order.customerEmail,
        paymentMethod,
        orderUserId
      );
      
      if (results.email) {
        console.log(`✅ Payment confirmation email queued for order ${order.id.slice(-8)}`);
        
        // Create notification record
        await this.createNotificationRecord(
          orderUserId,
          EmailType.PAYMENT_CONFIRMATION,
          `Payment Confirmed #${order.id.slice(-8).toUpperCase()}`,
          `Your payment of ₹${order.total} has been successfully processed via ${paymentMethod}.`,
          { 
            orderId: order.id, 
            paymentAmount: order.total, 
            paymentMethod,
            paymentDate: new Date().toISOString()
          }
        );
      }
      
      // Send SMS notification
      const phoneNumber = await this.getPhoneNumberForNotification(order, orderUserId);
      if (phoneNumber) {
        const shouldSend = await this.shouldSendSms(phoneNumber, orderUserId, SmsType.PAYMENT_CONFIRMATION);
        if (shouldSend) {
          results.sms = await sendPaymentConfirmationSms(
            order,
            name,
            phoneNumber,
            paymentMethod,
            orderUserId
          );
          
          if (results.sms) {
            console.log(`✅ Payment confirmation SMS queued for order ${order.id.slice(-8)}`);
          }
        } else {
          console.log(`⚠️ SMS notification skipped for order ${order.id.slice(-8)} - user preferences or opt-out`);
        }
      } else {
        console.log(`⚠️ SMS notification skipped for order ${order.id.slice(-8)} - no valid phone number`);
      }

      // Send WhatsApp notification
      const whatsappNumber = await this.getWhatsappNumberForNotification(order, orderUserId);
      if (whatsappNumber) {
        const shouldSend = await this.shouldSendWhatsapp(whatsappNumber, orderUserId, WhatsappType.PAYMENT_CONFIRMATION);
        if (shouldSend) {
          results.whatsapp = await sendPaymentConfirmationWhatsapp(
            order,
            name,
            whatsappNumber,
            paymentMethod,
            orderUserId
          );
          
          if (results.whatsapp) {
            console.log(`✅ Payment confirmation WhatsApp queued for order ${order.id.slice(-8)}`);
          }
        } else {
          console.log(`⚠️ WhatsApp notification skipped for order ${order.id.slice(-8)} - user preferences or opt-out`);
        }
      } else {
        console.log(`⚠️ WhatsApp notification skipped for order ${order.id.slice(-8)} - no valid WhatsApp number`);
      }
      
      return results;
    } catch (error) {
      console.error(`❌ Failed to trigger payment confirmation notifications for order ${order.id}:`, error);
      return results;
    }
  }

  /**
   * Legacy method - trigger payment confirmation email only
   * @deprecated Use triggerPaymentConfirmationNotifications for both email and SMS
   */
  static async triggerPaymentConfirmationEmail(
    order: Order,
    paymentMethod: string,
    customerName?: string,
    userId?: string
  ): Promise<boolean> {
    const results = await this.triggerPaymentConfirmationNotifications(
      order, paymentMethod, customerName, userId
    );
    return results.email;
  }

  /**
   * Trigger payment failure notifications (email + SMS + WhatsApp) after failed payment
   */
  static async triggerPaymentFailureNotifications(
    order: Order,
    paymentMethod: string,
    customerName?: string,
    failureReason?: string,
    userId?: string
  ): Promise<{ email: boolean; sms: boolean; whatsapp: boolean }> {
    const results = { email: false, sms: false, whatsapp: false };
    
    try {
      console.log(`❌📱 Triggering payment failure notifications for order ${order.id.slice(-8)}`);
      
      const name = customerName || order.customerName;
      const orderUserId = userId || order.userId || undefined;
      
      // Send email notification
      results.email = await sendPaymentFailureEmail(
        order,
        name,
        order.customerEmail,
        paymentMethod,
        failureReason,
        orderUserId
      );
      
      if (results.email) {
        console.log(`✅ Payment failure email queued for order ${order.id.slice(-8)}`);
        
        // Create notification record
        await this.createNotificationRecord(
          orderUserId,
          EmailType.PAYMENT_FAILED,
          `Payment Failed #${order.id.slice(-8).toUpperCase()}`,
          `Payment failed for your order. ${failureReason ? `Reason: ${failureReason}` : 'Please try again or contact support.'}`,
          { 
            orderId: order.id, 
            paymentAmount: order.total, 
            paymentMethod,
            failureReason,
            failureDate: new Date().toISOString()
          }
        );
      }
      
      // Send SMS notification
      const phoneNumber = await this.getPhoneNumberForNotification(order, orderUserId);
      if (phoneNumber) {
        const shouldSend = await this.shouldSendSms(phoneNumber, orderUserId, SmsType.PAYMENT_FAILED);
        if (shouldSend) {
          results.sms = await sendPaymentFailedSms(
            order,
            name,
            phoneNumber,
            failureReason,
            orderUserId
          );
          
          if (results.sms) {
            console.log(`✅ Payment failure SMS queued for order ${order.id.slice(-8)}`);
          }
        } else {
          console.log(`⚠️ SMS notification skipped for order ${order.id.slice(-8)} - user preferences or opt-out`);
        }
      } else {
        console.log(`⚠️ SMS notification skipped for order ${order.id.slice(-8)} - no valid phone number`);
      }

      // Send WhatsApp notification
      const whatsappNumber = await this.getWhatsappNumberForNotification(order, orderUserId);
      if (whatsappNumber) {
        const shouldSend = await this.shouldSendWhatsapp(whatsappNumber, orderUserId, WhatsappType.PAYMENT_FAILED);
        if (shouldSend) {
          results.whatsapp = await sendPaymentFailedWhatsapp(
            order,
            name,
            whatsappNumber,
            failureReason,
            orderUserId
          );
          
          if (results.whatsapp) {
            console.log(`✅ Payment failure WhatsApp queued for order ${order.id.slice(-8)}`);
          }
        } else {
          console.log(`⚠️ WhatsApp notification skipped for order ${order.id.slice(-8)} - user preferences or opt-out`);
        }
      } else {
        console.log(`⚠️ WhatsApp notification skipped for order ${order.id.slice(-8)} - no valid WhatsApp number`);
      }
      
      return results;
    } catch (error) {
      console.error(`❌ Failed to trigger payment failure notifications for order ${order.id}:`, error);
      return results;
    }
  }

  /**
   * Legacy method - trigger payment failure email only
   * @deprecated Use triggerPaymentFailureNotifications for both email and SMS
   */
  static async triggerPaymentFailureEmail(
    order: Order,
    paymentMethod: string,
    customerName?: string,
    failureReason?: string,
    userId?: string
  ): Promise<boolean> {
    const results = await this.triggerPaymentFailureNotifications(
      order, paymentMethod, customerName, failureReason, userId
    );
    return results.email;
  }

  // =============================================================================
  // NEW SMS-SPECIFIC NOTIFICATION METHODS
  // =============================================================================

  /**
   * Trigger shipping notification (email + SMS + WhatsApp) when order is shipped
   */
  static async triggerShippingNotifications(
    order: Order,
    trackingNumber: string,
    estimatedDelivery?: string,
    customerName?: string,
    userId?: string
  ): Promise<{ email: boolean; sms: boolean; whatsapp: boolean }> {
    const results = { email: false, sms: false, whatsapp: false };
    
    try {
      console.log(`🚚📱 Triggering shipping notifications for order ${order.id.slice(-8)}`);
      
      const name = customerName || order.customerName;
      const orderUserId = userId || order.userId || undefined;
      
      // Send email notification (using existing email service if available)
      // Note: This would need to be implemented in emailService.ts
      // results.email = await sendShippingNotificationEmail(order, name, order.customerEmail, trackingNumber, estimatedDelivery, orderUserId);
      
      // Send SMS notification
      const phoneNumber = await this.getPhoneNumberForNotification(order, orderUserId);
      if (phoneNumber) {
        const shouldSend = await this.shouldSendSms(phoneNumber, orderUserId, SmsType.SHIPPING_NOTIFICATION);
        if (shouldSend) {
          results.sms = await sendShippingNotificationSms(
            order,
            name,
            phoneNumber,
            trackingNumber,
            estimatedDelivery,
            orderUserId
          );
          
          if (results.sms) {
            console.log(`✅ Shipping notification SMS queued for order ${order.id.slice(-8)}`);
            
            // Create notification record
            await this.createNotificationRecord(
              orderUserId,
              EmailType.ORDER_STATUS_UPDATE, // Use existing email type
              `Order Shipped #${order.id.slice(-8).toUpperCase()}`,
              `Your order has shipped! Track your package: ${trackingNumber}${estimatedDelivery ? ` (Est. delivery: ${estimatedDelivery})` : ''}`,
              { 
                orderId: order.id,
                trackingNumber,
                estimatedDelivery,
                shippedAt: new Date().toISOString()
              }
            );
          }
        } else {
          console.log(`⚠️ SMS notification skipped for order ${order.id.slice(-8)} - user preferences or opt-out`);
        }
      } else {
        console.log(`⚠️ SMS notification skipped for order ${order.id.slice(-8)} - no valid phone number`);
      }

      // Send WhatsApp notification
      const whatsappNumber = await this.getWhatsappNumberForNotification(order, orderUserId);
      if (whatsappNumber) {
        const shouldSend = await this.shouldSendWhatsapp(whatsappNumber, orderUserId, WhatsappType.SHIPPING_NOTIFICATION);
        if (shouldSend) {
          results.whatsapp = await sendShippingNotificationWhatsapp(
            order,
            name,
            whatsappNumber,
            trackingNumber,
            estimatedDelivery,
            orderUserId
          );
          
          if (results.whatsapp) {
            console.log(`✅ Shipping notification WhatsApp queued for order ${order.id.slice(-8)}`);
          }
        } else {
          console.log(`⚠️ WhatsApp notification skipped for order ${order.id.slice(-8)} - user preferences or opt-out`);
        }
      } else {
        console.log(`⚠️ WhatsApp notification skipped for order ${order.id.slice(-8)} - no valid WhatsApp number`);
      }
      
      return results;
    } catch (error) {
      console.error(`❌ Failed to trigger shipping notifications for order ${order.id}:`, error);
      return results;
    }
  }

  /**
   * Trigger delivery notification (email + SMS + WhatsApp) when order is delivered
   */
  static async triggerDeliveryNotifications(
    order: Order,
    customerName?: string,
    userId?: string
  ): Promise<{ email: boolean; sms: boolean; whatsapp: boolean }> {
    const results = { email: false, sms: false, whatsapp: false };
    
    try {
      console.log(`📦📱 Triggering delivery notifications for order ${order.id.slice(-8)}`);
      
      const name = customerName || order.customerName;
      const orderUserId = userId || order.userId || undefined;
      
      // Send SMS notification
      const phoneNumber = await this.getPhoneNumberForNotification(order, orderUserId);
      if (phoneNumber) {
        const shouldSend = await this.shouldSendSms(phoneNumber, orderUserId, SmsType.DELIVERY_NOTIFICATION);
        if (shouldSend) {
          results.sms = await sendDeliveryNotificationSms(
            order,
            name,
            phoneNumber,
            orderUserId
          );
          
          if (results.sms) {
            console.log(`✅ Delivery notification SMS queued for order ${order.id.slice(-8)}`);
            
            // Create notification record
            await this.createNotificationRecord(
              orderUserId,
              EmailType.ORDER_STATUS_UPDATE, // Use existing email type
              `Order Delivered #${order.id.slice(-8).toUpperCase()}`,
              `Your Bmaafashion order has been delivered! Thank you for shopping with us.`,
              { 
                orderId: order.id,
                deliveredAt: new Date().toISOString()
              }
            );
          }
        } else {
          console.log(`⚠️ SMS notification skipped for order ${order.id.slice(-8)} - user preferences or opt-out`);
        }
      } else {
        console.log(`⚠️ SMS notification skipped for order ${order.id.slice(-8)} - no valid phone number`);
      }

      // Send WhatsApp notification
      const whatsappNumber = await this.getWhatsappNumberForNotification(order, orderUserId);
      if (whatsappNumber) {
        const shouldSend = await this.shouldSendWhatsapp(whatsappNumber, orderUserId, WhatsappType.DELIVERY_NOTIFICATION);
        if (shouldSend) {
          results.whatsapp = await sendDeliveryNotificationWhatsapp(
            order,
            name,
            whatsappNumber,
            orderUserId
          );
          
          if (results.whatsapp) {
            console.log(`✅ Delivery notification WhatsApp queued for order ${order.id.slice(-8)}`);
          }
        } else {
          console.log(`⚠️ WhatsApp notification skipped for order ${order.id.slice(-8)} - user preferences or opt-out`);
        }
      } else {
        console.log(`⚠️ WhatsApp notification skipped for order ${order.id.slice(-8)} - no valid WhatsApp number`);
      }
      
      return results;
    } catch (error) {
      console.error(`❌ Failed to trigger delivery notifications for order ${order.id}:`, error);
      return results;
    }
  }

  /**
   * Trigger order cancellation notifications (email + SMS + WhatsApp) when order is cancelled
   */
  static async triggerOrderCancellationNotifications(
    order: Order,
    reason?: string,
    customerName?: string,
    userId?: string
  ): Promise<{ email: boolean; sms: boolean; whatsapp: boolean }> {
    const results = { email: false, sms: false, whatsapp: false };
    
    try {
      console.log(`❌📱 Triggering order cancellation notifications for order ${order.id.slice(-8)}`);
      
      const name = customerName || order.customerName;
      const orderUserId = userId || order.userId || undefined;
      
      // Send SMS notification
      const phoneNumber = await this.getPhoneNumberForNotification(order, orderUserId);
      if (phoneNumber) {
        const shouldSend = await this.shouldSendSms(phoneNumber, orderUserId, SmsType.ORDER_CANCELLATION);
        if (shouldSend) {
          results.sms = await sendOrderCancellationSms(
            order,
            name,
            phoneNumber,
            reason,
            orderUserId
          );
          
          if (results.sms) {
            console.log(`✅ Order cancellation SMS queued for order ${order.id.slice(-8)}`);
            
            // Create notification record
            await this.createNotificationRecord(
              orderUserId,
              EmailType.ORDER_STATUS_UPDATE, // Use existing email type
              `Order Cancelled #${order.id.slice(-8).toUpperCase()}`,
              `Your order has been cancelled. ${reason ? `Reason: ${reason}` : 'Contact support if you have questions.'}`,
              { 
                orderId: order.id,
                cancellationReason: reason,
                cancelledAt: new Date().toISOString()
              }
            );
          }
        } else {
          console.log(`⚠️ SMS notification skipped for order ${order.id.slice(-8)} - user preferences or opt-out`);
        }
      } else {
        console.log(`⚠️ SMS notification skipped for order ${order.id.slice(-8)} - no valid phone number`);
      }

      // Send WhatsApp notification
      const whatsappNumber = await this.getWhatsappNumberForNotification(order, orderUserId);
      if (whatsappNumber) {
        const shouldSend = await this.shouldSendWhatsapp(whatsappNumber, orderUserId, WhatsappType.ORDER_CANCELLATION);
        if (shouldSend) {
          results.whatsapp = await sendOrderCancellationWhatsapp(
            order,
            name,
            whatsappNumber,
            reason,
            orderUserId
          );
          
          if (results.whatsapp) {
            console.log(`✅ Order cancellation WhatsApp queued for order ${order.id.slice(-8)}`);
          }
        } else {
          console.log(`⚠️ WhatsApp notification skipped for order ${order.id.slice(-8)} - user preferences or opt-out`);
        }
      } else {
        console.log(`⚠️ WhatsApp notification skipped for order ${order.id.slice(-8)} - no valid WhatsApp number`);
      }
      
      return results;
    } catch (error) {
      console.error(`❌ Failed to trigger order cancellation notifications for order ${order.id}:`, error);
      return results;
    }
  }

  // =============================================================================
  // ACCOUNT & AUTHENTICATION NOTIFICATIONS
  // =============================================================================

  /**
   * Trigger email verification for new user registration
   */
  static async triggerEmailVerification(
    email: string,
    firstName: string,
    verificationToken: string,
    userId?: string
  ): Promise<boolean> {
    try {
      console.log(`📧 Triggering email verification for ${email}`);
      
      const success = await sendVerificationEmail(email, firstName, verificationToken);
      
      if (success) {
        console.log(`✅ Email verification queued for ${email}`);
        
        // Create notification record
        await this.createNotificationRecord(
          userId,
          EmailType.EMAIL_VERIFICATION,
          'Verify Your Bmaafashion Account',
          `Welcome ${firstName}! Please verify your email address to complete your account setup.`,
          { 
            email,
            verificationToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
        );
      }
      
      return success;
    } catch (error) {
      console.error(`❌ Failed to trigger email verification for ${email}:`, error);
      return false;
    }
  }

  // =============================================================================
  // BULK NOTIFICATION OPERATIONS
  // =============================================================================

  /**
   * Send notifications to multiple users (for admin-triggered campaigns)
   */
  static async triggerBulkNotifications(
    type: EmailType,
    userIds: string[],
    subject: string,
    templateData: Record<string, any>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    console.log(`📧 Triggering bulk ${type} notifications for ${userIds.length} users`);

    // Process in batches to avoid overwhelming the email queue
    const batchSize = 50;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const promises = batch.map(async (userId) => {
        try {
          const user = await storage.getUser(userId);
          if (!user || !user.email) {
            failed++;
            return;
          }

          // Create notification record for tracking
          await this.createNotificationRecord(
            userId,
            type,
            subject,
            `Bulk notification: ${type}`,
            templateData
          );
          
          success++;
        } catch (error) {
          console.error(`Failed to process bulk notification for user ${userId}:`, error);
          failed++;
        }
      });

      await Promise.all(promises);
      
      // Small delay between batches to prevent overwhelming the system
      if (i + batchSize < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`📊 Bulk notification results: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  /**
   * Generate contextual status messages for order updates
   */
  private static generateStatusMessage(status: string, orderNumber: string): string {
    const messages = {
      pending: `Your order #${orderNumber} has been received and is awaiting processing.`,
      processing: `Great news! Your order #${orderNumber} is now being prepared for shipment.`,
      shipped: `Your order #${orderNumber} has been shipped and is on its way to you!`,
      delivered: `Your order #${orderNumber} has been delivered. Thank you for choosing Bmaafashion!`,
      cancelled: `Your order #${orderNumber} has been cancelled. If you have any questions, please contact our support team.`
    };

    return messages[status as keyof typeof messages] || 
      `Your order #${orderNumber} status has been updated to: ${status}`;
  }

  /**
   * Create notification record for tracking purposes
   */
  private static async createNotificationRecord(
    userId: string | null | undefined,
    type: EmailType,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      if (userId) {
        await storage.createNotification({
          userId,
          type,
          title,
          message,
          data: data || {},
          read: false,
          emailSent: false // Will be updated when email is actually sent
        });
      }
    } catch (error) {
      console.error('Failed to create notification record:', error);
      // Don't throw - notification record creation shouldn't fail the main operation
    }
  }

  // =============================================================================
  // MONITORING & ANALYTICS
  // =============================================================================

  /**
   * Get notification statistics for monitoring dashboard
   */
  static async getNotificationStats(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<{
    totalSent: number;
    totalPending: number;
    totalFailed: number;
    byType: Record<string, number>;
  }> {
    try {
      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Get notifications within timeframe
      const notifications = await storage.getNotifications();
      const filteredNotifications = notifications.filter(
        n => !!n.createdAt && new Date(n.createdAt) >= startDate
      );

      // Calculate stats
      const totalSent = filteredNotifications.filter(n => n.emailSent).length;
      const totalPending = filteredNotifications.filter(n => !n.emailSent).length;
      const totalFailed = 0; // Would need additional tracking for failed emails

      // Group by type
      const byType: Record<string, number> = {};
      filteredNotifications.forEach(notification => {
        byType[notification.type] = (byType[notification.type] || 0) + 1;
      });

      return {
        totalSent,
        totalPending,
        totalFailed,
        byType
      };
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return {
        totalSent: 0,
        totalPending: 0,
        totalFailed: 0,
        byType: {}
      };
    }
  }

  /**
   * Check if user has email notifications enabled for specific type
   */
  static async checkUserEmailPreference(userId: string, emailType: EmailType): Promise<boolean> {
    try {
      if (!userId) return true; // Default to enabled for guest users
      
      const preferences = await storage.getUserPreferences(userId);
      if (!preferences) return true; // Default to enabled if no preferences
      
      const emailNotifications = preferences.emailNotifications as any;
      
      // Always send critical notifications
      if ([EmailType.EMAIL_VERIFICATION, EmailType.PASSWORD_RESET].includes(emailType)) {
        return true;
      }
      
      // Check specific preferences
      switch (emailType) {
        case EmailType.ORDER_CONFIRMATION:
        case EmailType.ORDER_STATUS_UPDATE:
        case EmailType.PAYMENT_CONFIRMATION:
        case EmailType.SHIPPING_NOTIFICATION:
          return emailNotifications?.orderUpdates !== false;
        
        case EmailType.STOCK_ALERT:
          return emailNotifications?.stockAlerts === true;
        
        case EmailType.NEWSLETTER:
          return emailNotifications?.newsletter === true;
        
        case EmailType.PROMOTIONAL:
          return emailNotifications?.promotions === true;
        
        default:
          return true;
      }
    } catch (error) {
      console.error('Failed to check user email preference:', error);
      return true; // Default to enabled on error
    }
  }
}

// Export default instance
export const notificationService = NotificationService;