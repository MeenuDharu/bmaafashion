import nodemailer from "nodemailer";
import crypto from "crypto";
import { storage } from "./storage";
import type {
  Order,
  OrderItem,
  Product,
  User,
  UserPreferences,
} from "@shared/schema";
import { generateOrderAccessToken } from "./jwtAuth";
import dotenv from "dotenv";
dotenv.config();

// Comprehensive SMTP Email Service Integration
// Enhanced from basic email verification to full notification system
if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
  console.warn(
    "SMTP_EMAIL or SMTP_PASSWORD environment variables not set. Email functionality will be disabled.",
  );
}

// Create SMTP transporter with Outlook/Office365 configuration
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD, // Outlook account password or app password if 2FA enabled
  },
  tls: {
    rejectUnauthorized: false,
  },
  // Add debugging options
  debug: process.env.NODE_ENV === "development",
  logger: process.env.NODE_ENV === "development",
});

// Verify SMTP connection on startup
if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
  console.log("📧 EMAIL CONFIGURATION:");
  console.log(`   SMTP Host: smtp.gmail.com:587`);
  console.log(`   SMTP Email: ${process.env.SMTP_EMAIL}`);
  console.log(`   SMTP Password: ${process.env.SMTP_PASSWORD ? '***configured***' : 'NOT SET'}`);
  console.log(`   FROM Address will be: ${process.env.SMTP_EMAIL}`);
  
  transporter.verify((error: any, success: any) => {
    if (error) {
      console.error("❌ SMTP connection failed:", error.message);
      console.error("❌ Full error:", error);
    } else {
      console.log("✅ SMTP server is ready to send emails");
    }
  });
} else {
  console.error("❌ SMTP_EMAIL or SMTP_PASSWORD not configured!");
}

// Email Types Enum for different notification categories
export enum EmailType {
  EMAIL_VERIFICATION = "email_verification",
  PASSWORD_RESET = "password_reset",
  ORDER_CONFIRMATION = "order_confirmation",
  ADMIN_ORDER_NOTIFICATION = "admin_order_notification",
  ORDER_STATUS_UPDATE = "order_status_update",
  SHIPPING_NOTIFICATION = "shipping_notification",
  PAYMENT_CONFIRMATION = "payment_confirmation",
  PAYMENT_FAILED = "payment_failed",
  ACCOUNT_WELCOME = "account_welcome",
  ACCOUNT_CREATED_FROM_GUEST = "account_created_from_guest",
  STOCK_ALERT = "stock_alert",
  SUPPORT_TICKET = "support_ticket",
  NEWSLETTER = "newsletter",
  PROMOTIONAL = "promotional",
}

// Email Priority Levels
export enum EmailPriority {
  HIGH = "high", // Immediate delivery (payment, security)
  NORMAL = "normal", // Standard delivery (orders, shipping)
  LOW = "low", // Bulk/promotional (newsletters, promotions)
}

// Email Queue Entry Interface
interface EmailQueueEntry {
  id: string;
  type: EmailType;
  priority: EmailPriority;
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  data?: Record<string, any>;
  userId?: string;
  retryCount: number;
  maxRetries: number;
  scheduledAt: Date;
  createdAt: Date;
  lastError?: string;
}

// Enhanced Email Parameters Interface
interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// Template Variable Interface
interface TemplateVariables {
  recipientName: string;
  recipientEmail: string;
  [key: string]: any;
}

// Constants for email processing
const maxRetries = 3;
const retryDelays = [30000, 300000, 1800000]; // 30s, 5min, 30min

// Rate Limiting Configuration (now enforced via database)
const rateLimits = {
  [EmailPriority.HIGH]: { perMinute: 100, perHour: 1000 },
  [EmailPriority.NORMAL]: { perMinute: 50, perHour: 500 },
  [EmailPriority.LOW]: { perMinute: 10, perHour: 100 },
};

// =============================================================================
// COMPREHENSIVE EMAIL TEMPLATE SYSTEM
// =============================================================================

// Base HTML Template with Bmaafashion Branding
function getBaseEmailTemplate(title: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @media screen and (max-width: 600px) {
          .container { width: 100% !important; padding: 20px !important; }
          .button { width: 100% !important; }
          .order-item { display: block !important; }
          .product-details { margin-top: 15px !important; }
        }
        .button:hover { background-color: #245025 !important; }
        .secondary-button { background-color: #f8f9fa; color: #333; border: 1px solid #dee2e6; }
        .secondary-button:hover { background-color: #e9ecef !important; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa; line-height: 1.6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden;" class="container">
        
        <!-- Header with Bmaafashion Branding -->
        <div style="background-color: #2d5a2d; padding: 40px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">Bmaafashion</h1>
          <p style="color: #a8d5a8; margin: 8px 0 0 0; font-size: 16px; font-weight: 400;">Fashion & Style Solutions</p>
        </div>
        
        <!-- Main Content Area -->
        <div style="padding: 40px;">
          ${content}
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8f9fa; padding: 30px 40px; border-top: 1px solid #e9ecef;">
          <div style="margin-bottom: 20px;">
            <h4 style="color: #2d5a2d; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">Need Help?</h4>
            <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">Our support team is here to help you grow successfully.</p>
            <p style="margin: 0;">
              <a href="mailto:support@bmaafashion.com" style="color: #2d5a2d; text-decoration: none; font-weight: 500;">support@bmaafashion.com</a>
            </p>
          </div>
          
          <div style="border-top: 1px solid #dee2e6; padding-top: 20px; text-align: center;">
            <div style="margin-bottom: 15px;">
              <a href="${process.env.DOMAIN || "http://localhost:5000"}/privacy-policy" style="color: #666; text-decoration: none; margin: 0 10px; font-size: 14px;">Privacy Policy</a>
              <a href="${process.env.DOMAIN || "http://localhost:5000"}/terms-of-service" style="color: #666; text-decoration: none; margin: 0 10px; font-size: 14px;">Terms of Service</a>
            </div>
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2025 Bmaafashion. All rights reserved.<br>
              Fashion that transforms, one style at a time.
            </p>
          </div>
        </div>
        
      </div>
    </body>
    </html>
  `;
}

// Common Button Styles
function getPrimaryButton(text: string, url: string): string {
  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" 
         style="background-color: #2d5a2d; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; transition: background-color 0.3s;" 
         class="button">
        ${text}
      </a>
    </div>
  `;
}

function getSecondaryButton(text: string, url: string): string {
  return `
    <div style="text-align: center; margin: 20px 0;">
      <a href="${url}" 
         style="background-color: #f8f9fa; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500; display: inline-block; border: 1px solid #dee2e6; transition: background-color 0.3s;" 
         class="secondary-button">
        ${text}
      </a>
    </div>
  `;
}

// =============================================================================
// EMAIL TEMPLATE GENERATORS
// =============================================================================

// 1. Email Verification Template (Enhanced)
export function generateVerificationEmailTemplate(
  recipientName: string,
  verificationLink: string,
): { html: string; text: string } {
  const content = `
    <div style="margin-bottom: 30px;">
      <h2 style="color: #2d5a2d; font-size: 28px; margin-bottom: 25px; font-weight: 700;">Welcome to Bmaafashion, ${recipientName}! 👗</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Thank you for joining the Bmaafashion community! We're excited to help you discover amazing fashion and style. 
        To unlock access to our complete range of products and expert growing resources, please verify your email address.
      </p>
      <div style="background: linear-gradient(135deg, #f8fffe 0%, #e8f5e8 100%); padding: 25px; border-radius: 10px; border-left: 4px solid #2d5a2d; margin: 25px 0;">
        <p style="color: #2d5a2d; font-size: 16px; margin: 0; font-weight: 600;">
          ✨ What's waiting for you:
        </p>
        <ul style="color: #555; margin: 15px 0 0 20px; padding: 0;">
          <li style="margin-bottom: 8px;">Access to exclusive fashion collections and trends</li>
          <li style="margin-bottom: 8px;">Expert style tips and fashion guides</li>
          <li style="margin-bottom: 8px;">Community support from fashion enthusiasts</li>
          <li style="margin-bottom: 0;">Exclusive member discounts and early access</li>
        </ul>
      </div>
    </div>
    
    ${getPrimaryButton("Verify Email Address", verificationLink)}
    
    <!-- Alternative Link -->
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <p style="color: #666; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">
        Having trouble with the button? Copy this link:
      </p>
      <p style="color: #2d5a2d; font-size: 13px; word-break: break-all; margin: 0; background: white; padding: 10px; border-radius: 4px; font-family: monospace;">
        ${verificationLink}
      </p>
    </div>
    
    <!-- Security Notice -->
    <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px;">
      <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 0;">
        <strong>🔒 Security Notice:</strong> This verification link will expire in 24 hours. If you didn't create an account with Bmaafashion, please ignore this email.
      </p>
    </div>
  `;

  const html = getBaseEmailTemplate("Verify Your Bmaafashion Account", content);

  const text = `
Welcome to Bmaafashion, ${recipientName}!

Thank you for joining our fashion community! We're excited to help you discover amazing styles.

To access your account and unlock all features, please verify your email address:
${verificationLink}

What's waiting for you:
• Access to exclusive fashion collections
• Expert style tips and fashion guides
• Community support from fashion enthusiasts
• Exclusive member discounts and early access

This verification link will expire in 24 hours for security.

If you didn't create this account, please ignore this email.

Happy Shopping!
The Bmaafashion Team

---
Bmaafashion - Fashion that transforms, one style at a time
© 2025 Bmaafashion. All rights reserved.
  `;

  return { html, text };
}

// 2. Password Reset Template
export function generatePasswordResetTemplate(
  recipientName: string,
  resetLink: string,
): { html: string; text: string } {
  const content = `
    <div style="margin-bottom: 30px;">
      <h2 style="color: #2d5a2d; font-size: 28px; margin-bottom: 25px; font-weight: 700;">Reset Your Password 🔒</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Hi ${recipientName}, we received a request to reset your Bmaafashion account password. 
        If you made this request, click the button below to set a new password.
      </p>
      <div style="background: linear-gradient(135deg, #fff4e6 0%, #ffe8cc 100%); padding: 25px; border-radius: 10px; border-left: 4px solid #ff9800; margin: 25px 0;">
        <p style="color: #e65100; font-size: 16px; margin: 0; font-weight: 600;">
          ⏰ This link expires in 1 hour
        </p>
        <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">
          For your security, this password reset link is only valid for 1 hour from the time it was sent.
        </p>
      </div>
    </div>
    
    ${getPrimaryButton("Reset Your Password", resetLink)}
    
    <!-- Alternative Link -->
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <p style="color: #666; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">
        Having trouble with the button? Copy this link:
      </p>
      <p style="color: #2d5a2d; font-size: 13px; word-break: break-all; margin: 0; background: white; padding: 10px; border-radius: 4px; font-family: monospace;">
        ${resetLink}
      </p>
    </div>
    
    <!-- Security Notice -->
    <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px;">
      <h4 style="color: #2d5a2d; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">🔐 Security Information</h4>
      <p style="color: #888; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0;">
        <strong>Didn't request this?</strong> If you didn't ask to reset your password, you can safely ignore this email. 
        Your password will remain unchanged and your account is secure.
      </p>
      <p style="color: #888; font-size: 13px; line-height: 1.6; margin: 0;">
        If you're concerned about your account security, please contact us immediately at 
        <a href="mailto:support@bmaafashion.com" style="color: #2d5a2d; text-decoration: none;">support@bmaafashion.com</a>
      </p>
    </div>
  `;

  const html = getBaseEmailTemplate("Reset Your Bmaafashion Password", content);

  const text = `
Reset Your Password 🔒

Hi ${recipientName}, we received a request to reset your Bmaafashion account password.

If you made this request, use this link to set a new password:
${resetLink}

⏰ IMPORTANT: This link expires in 1 hour for your security.

Didn't request this?
If you didn't ask to reset your password, you can safely ignore this email. Your password will remain unchanged and your account is secure.

If you're concerned about your account security, please contact us at support@bmaafashion.com

Best regards,
The Bmaafashion Team

---
Bmaafashion - Fashion that transforms, one style at a time
© 2025 Bmaafashion. All rights reserved.
  `;

  return { html, text };
}

// 3. Account Created from Guest Checkout Template
export function generateAccountCreatedFromGuestTemplate(
  recipientName: string,
  email: string,
  temporaryPassword: string,
  loginUrl: string,
): { html: string; text: string } {
  const content = `
    <div style="margin-bottom: 30px;">
      <h2 style="color: #2d5a2d; font-size: 28px; margin-bottom: 25px; font-weight: 700;">Your Bmaafashion Account is Ready! 🎉</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
        Hi ${recipientName}, great news! We've created a Bmaafashion account for you to make future orders even easier.
        You can now track your orders, save addresses, and enjoy a faster checkout experience.
      </p>
      
      <div style="background: linear-gradient(135deg, #f8fffe 0%, #e8f5e8 100%); padding: 25px; border-radius: 10px; border-left: 4px solid #2d5a2d; margin: 25px 0;">
        <p style="color: #2d5a2d; font-size: 16px; margin: 0 0 15px 0; font-weight: 600;">
          📧 Your Login Credentials
        </p>
        <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
          <p style="color: #666; font-size: 13px; margin: 0 0 5px 0; font-weight: 500;">Email Address:</p>
          <p style="color: #2d5a2d; font-size: 15px; margin: 0; font-family: monospace; font-weight: 600;">${email}</p>
        </div>
        <div style="background: white; padding: 15px; border-radius: 6px;">
          <p style="color: #666; font-size: 13px; margin: 0 0 5px 0; font-weight: 500;">Temporary Password:</p>
          <p style="color: #2d5a2d; font-size: 15px; margin: 0; font-family: monospace; font-weight: 600;">${temporaryPassword}</p>
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, #fff4e6 0%, #ffe8cc 100%); padding: 20px; border-radius: 10px; border-left: 4px solid #ff9800; margin: 25px 0;">
        <p style="color: #e65100; font-size: 15px; margin: 0; font-weight: 600;">
          🔒 Important Security Notice
        </p>
        <p style="color: #666; margin: 10px 0 0 0; font-size: 14px; line-height: 1.6;">
          For your security, we recommend changing this temporary password after your first login. You can do this from your account settings.
        </p>
      </div>
    </div>
    
    ${getPrimaryButton("Log In to Your Account", loginUrl)}
    
    <!-- Benefits Section -->
    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin: 30px 0;">
      <h4 style="color: #2d5a2d; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">✨ What You Can Do Now:</h4>
      <ul style="color: #555; margin: 0; padding: 0 0 0 20px; line-height: 1.8;">
        <li style="margin-bottom: 8px;">Track your current and past orders</li>
        <li style="margin-bottom: 8px;">Save multiple shipping addresses</li>
        <li style="margin-bottom: 8px;">Enjoy faster checkout on future purchases</li>
        <li style="margin-bottom: 8px;">Manage your account preferences</li>
        <li style="margin-bottom: 0;">Get exclusive offers and early access to new products</li>
      </ul>
    </div>
    
    <!-- Security Footer -->
    <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px;">
      <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 0;">
        <strong>🔐 Account Security:</strong> Never share your password with anyone. Bmaafashion will never ask for your password via email or phone.
      </p>
    </div>
  `;

  const html = getBaseEmailTemplate("Your Bmaafashion Account is Ready", content);

  const text = `
Your Bmaafashion Account is Ready! 🎉

Hi ${recipientName}, great news! We've created a Bmaafashion account for you to make future orders even easier.

Your Login Credentials:
Email: ${email}
Temporary Password: ${temporaryPassword}

🔒 IMPORTANT: For your security, we recommend changing this temporary password after your first login from your account settings.

What You Can Do Now:
• Track your current and past orders
• Save multiple shipping addresses
• Enjoy faster checkout on future purchases
• Manage your account preferences
• Get exclusive offers and early access to new products

Log in here: ${loginUrl}

Account Security: Never share your password with anyone. Bmaafashion will never ask for your password via email or phone.

Happy Shopping!
The Bmaafashion Team

---
Bmaafashion - Fashion that transforms, one style at a time
© 2025 Bmaafashion. All rights reserved.
  `;

  return { html, text };
}

// 4. Order Confirmation Template
export function generateOrderConfirmationTemplate(
  order: Order & { items: (OrderItem & { product: Product })[] },
  customerName: string,
  orderTrackingUrl?: string,
): { html: string; text: string } {
  // Generate order items HTML
  const orderItemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 15px 0; border-bottom: 1px solid #f0f0f0;">
        <div style="display: flex; align-items: center;" class="order-item">
          <div style="flex: 1;" class="product-details">
            <h4 style="color: #2d5a2d; font-size: 16px; margin: 0 0 5px 0; font-weight: 600;">${item.productName}</h4>
            <p style="color: #666; font-size: 14px; margin: 0;">Quantity: ${item.quantity} × ₹${Number(item.productPrice).toFixed(2)}</p>
          </div>
          <div style="text-align: right; font-weight: 600; color: #2d5a2d; font-size: 16px;">
            ₹${Number(item.totalPrice).toFixed(2)}
          </div>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");

  const content = `
    <div style="margin-bottom: 30px;">
      <h2 style="color: #2d5a2d; font-size: 28px; margin-bottom: 10px; font-weight: 700;">Order Confirmed! 🎉</h2>
      <p style="color: #666; font-size: 16px; margin: 0;">Thank you for your order, ${customerName}!</p>
    </div>
    
    <!-- Order Summary Card -->
    <div style="background-color: #f8fffe; border: 2px solid #e8f5e8; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap;">
        <div>
          <h3 style="color: #2d5a2d; font-size: 20px; margin: 0 0 5px 0; font-weight: 600;">Order #${order.id.slice(-8).toUpperCase()}</h3>
          <p style="color: #666; font-size: 14px; margin: 0;">Placed on ${new Date(
    order.createdAt || new Date(),
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}</p>
        </div>
        <div style="text-align: right;">
          <div style="background-color: #2d5a2d; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block;">
            ${order.status.toUpperCase()}
          </div>
        </div>
      </div>
      
      <!-- Order Items -->
      <table style="width: 100%; border-collapse: collapse;">
        ${orderItemsHtml}
        
        <!-- Order Totals -->
        <tr>
          <td style="padding: 20px 0 10px 0; border-top: 2px solid #2d5a2d;">
            <div style="text-align: right;">
              <div style="margin-bottom: 8px;">
                <span style="color: #666; font-size: 14px;">Subtotal: </span>
                <span style="color: #333; font-weight: 600;">₹${Number(order.subtotal).toFixed(2)}</span>
              </div>
              ${Number(order.shippingCost) > 0
      ? `
                <div style="margin-bottom: 8px;">
                  <span style="color: #666; font-size: 14px;">Shipping: </span>
                  <span style="color: #333; font-weight: 600;">₹${Number(order.shippingCost).toFixed(2)}</span>
                </div>
              `
      : ""
    }
              ${Number(order.taxAmount) > 0
      ? `
                <div style="margin-bottom: 12px;">
                  <span style="color: #666; font-size: 14px;">Tax: </span>
                  <span style="color: #333; font-weight: 600;">₹${Number(order.taxAmount).toFixed(2)}</span>
                </div>
              `
      : ""
    }
              <div style="font-size: 18px; font-weight: 700; color: #2d5a2d;">
                <span>Total: ₹${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Shipping Address -->
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h4 style="color: #2d5a2d; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">📦 Shipping Address</h4>
      <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line;">${order.shippingAddress}</p>
    </div>
    
    <!-- Action Buttons -->
    <div style="text-align: center; margin: 30px 0;">
      ${orderTrackingUrl ? getPrimaryButton("Track Your Order", orderTrackingUrl) : ""}
    </div>
    
    <!-- What's Next -->
    <div style="background: linear-gradient(135deg, #f8fffe 0%, #e8f5e8 100%); padding: 25px; border-radius: 10px; margin: 30px 0;">
      <h4 style="color: #2d5a2d; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">🚀 What's Next?</h4>
      <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0;">
        We're preparing your hydroponic growing system! You'll receive shipping updates and tracking information via email. 
        Your plants will be growing in no time! 🌱
      </p>
    </div>
  `;

  const html = getBaseEmailTemplate(
    "Order Confirmation - Bmaafashion",
    content,
  );

  const text = `
Order Confirmed! 🎉

Thank you for your order, ${customerName}!

Order #${order.id.slice(-8).toUpperCase()}
Placed on ${new Date(order.createdAt || new Date()).toLocaleDateString("en-IN")}
Status: ${order.status.toUpperCase()}

Order Items:
${order.items
      .map(
        (item) =>
          `• ${item.productName} (Qty: ${item.quantity}) - ₹${Number(item.totalPrice).toFixed(2)}`,
      )
      .join("\n")}

Subtotal: ₹${Number(order.subtotal).toFixed(2)}
${Number(order.shippingCost) > 0 ? `Shipping: ₹${Number(order.shippingCost).toFixed(2)}\n` : ""}${Number(order.taxAmount) > 0 ? `Tax: ₹${Number(order.taxAmount).toFixed(2)}\n` : ""}Total: ₹${Number(order.total).toFixed(2)}

Shipping Address:
${order.shippingAddress}

${orderTrackingUrl ? `Track your order: ${orderTrackingUrl}\n\n` : ""}We're preparing your hydroponic growing system! You'll receive shipping updates via email.

Need help? Contact us at support@bmaafashion.com

Happy Shopping!
The Bmaafashion Team

---
Bmaafashion - Fashion that transforms, one style at a time
© 2025 Bmaafashion. All rights reserved.
  `;

  return { html, text };
}

// 4a. Admin Order Notification Template
export function generateAdminOrderNotificationTemplate(
  order: Order & { items: (OrderItem & { product: Product })[] },
  customerName: string,
  customerEmail: string,
): { html: string; text: string } {
  // Generate order items HTML
  const orderItemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 15px 0; border-bottom: 1px solid #f0f0f0;">
        <div style="display: flex; align-items: center;" class="order-item">
          <div style="flex: 1;" class="product-details">
            <h4 style="color: #2d5a2d; font-size: 16px; margin: 0 0 5px 0; font-weight: 600;">${item.productName}</h4>
            <p style="color: #666; font-size: 14px; margin: 0;">Quantity: ${item.quantity} × ₹${Number(item.productPrice).toFixed(2)}</p>
          </div>
          <div style="text-align: right; font-weight: 600; color: #2d5a2d; font-size: 16px;">
            ₹${Number(item.totalPrice).toFixed(2)}
          </div>
        </div>
      </td>
    </tr>
  `,
    )
    .join("");

  const content = `
    <div style="margin-bottom: 30px;">
      <h2 style="color: #2d5a2d; font-size: 28px; margin-bottom: 10px; font-weight: 700;">New Order Received! 🛒</h2>
      <p style="color: #666; font-size: 16px; margin: 0;">A new order has been placed on Bmaafashion.</p>
    </div>
    
    <!-- Order Summary Card -->
    <div style="background-color: #f8fffe; border: 2px solid #e8f5e8; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap;">
        <div>
          <h3 style="color: #2d5a2d; font-size: 20px; margin: 0 0 5px 0; font-weight: 600;">Order #${order.id.slice(-8).toUpperCase()}</h3>
          <p style="color: #666; font-size: 14px; margin: 0;">Placed on ${new Date(
    order.createdAt || new Date(),
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}</p>
        </div>
        <div style="text-align: right;">
          <div style="background-color: #2d5a2d; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block;">
            ${order.status.toUpperCase()}
          </div>
        </div>
      </div>
      
      <!-- Customer Information -->
      <div style="background-color: #fff; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #2d5a2d; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">👤 Customer Information</h4>
        <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 5px 0;">
          <strong>Name:</strong> ${customerName}<br/>
          <strong>Email:</strong> ${customerEmail}<br/>
          ${order.customerPhone ? `<strong>Phone:</strong> ${order.customerPhone}` : ""}
        </p>
      </div>
      
      <!-- Order Items -->
      <table style="width: 100%; border-collapse: collapse;">
        ${orderItemsHtml}
        
        <!-- Order Totals -->
        <tr>
          <td style="padding: 20px 0 10px 0; border-top: 2px solid #2d5a2d;">
            <div style="text-align: right;">
              <div style="margin-bottom: 8px;">
                <span style="color: #666; font-size: 14px;">Subtotal: </span>
                <span style="color: #333; font-weight: 600;">₹${Number(order.subtotal).toFixed(2)}</span>
              </div>
              ${Number(order.shippingCost) > 0
      ? `
                <div style="margin-bottom: 8px;">
                  <span style="color: #666; font-size: 14px;">Shipping: </span>
                  <span style="color: #333; font-weight: 600;">₹${Number(order.shippingCost).toFixed(2)}</span>
                </div>
              `
      : ""
    }
              ${Number(order.taxAmount) > 0
      ? `
                <div style="margin-bottom: 12px;">
                  <span style="color: #666; font-size: 14px;">Tax: </span>
                  <span style="color: #333; font-weight: 600;">₹${Number(order.taxAmount).toFixed(2)}</span>
                </div>
              `
      : ""
    }
              <div style="font-size: 18px; font-weight: 700; color: #2d5a2d;">
                <span>Total: ₹${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Shipping Address -->
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h4 style="color: #2d5a2d; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">📦 Shipping Address</h4>
      <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-line;">${order.shippingAddress}</p>
    </div>
    
    ${order.notes ? `
    <!-- Order Notes -->
    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
      <h4 style="color: #856404; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">📝 Order Notes</h4>
      <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">${order.notes}</p>
    </div>
    ` : ""}
    
    <!-- Action Buttons -->
    <div style="text-align: center; margin: 30px 0;">
      ${getPrimaryButton("View Order in Admin Panel", `${process.env.DOMAIN || "http://localhost:5000"}/admin/orders`)}
    </div>
    
    <!-- Next Steps -->
    <div style="background: linear-gradient(135deg, #f8fffe 0%, #e8f5e8 100%); padding: 25px; border-radius: 10px; margin: 30px 0;">
      <h4 style="color: #2d5a2d; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">📋 Next Steps</h4>
      <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0;">
        Please review this order and update the order status as needed. The customer will receive notifications 
        for any status changes. Process this order promptly to ensure customer satisfaction.
      </p>
    </div>
  `;

  const html = getBaseEmailTemplate(
    "New Order Received - Bmaafashion Admin",
    content,
  );

  const text = `
New Order Received! 🛒

A new order has been placed on Bmaafashion.

Order #${order.id.slice(-8).toUpperCase()}
Placed on ${new Date(order.createdAt || new Date()).toLocaleDateString("en-IN")}
Status: ${order.status.toUpperCase()}

Customer Information:
Name: ${customerName}
Email: ${customerEmail}
${order.customerPhone ? `Phone: ${order.customerPhone}\n` : ""}

Order Items:
${order.items
      .map(
        (item) =>
          `• ${item.productName} (Qty: ${item.quantity}) - ₹${Number(item.totalPrice).toFixed(2)}`,
      )
      .join("\n")}

Subtotal: ₹${Number(order.subtotal).toFixed(2)}
${Number(order.shippingCost) > 0 ? `Shipping: ₹${Number(order.shippingCost).toFixed(2)}\n` : ""}${Number(order.taxAmount) > 0 ? `Tax: ₹${Number(order.taxAmount).toFixed(2)}\n` : ""}Total: ₹${Number(order.total).toFixed(2)}

Shipping Address:
${order.shippingAddress}

${order.notes ? `Order Notes:\n${order.notes}\n\n` : ""}View Order: ${process.env.DOMAIN || "http://localhost:5000"}/admin/orders

Next Steps:
Please review this order and update the order status as needed. The customer will receive notifications for any status changes.

---
Bmaafashion Admin Notification
© 2025 Bmaafashion. All rights reserved.
  `;

  return { html, text };
}

// 3. Order Status Update Template
export function generateOrderStatusUpdateTemplate(
  order: Order,
  customerName: string,
  statusMessage: string,
  trackingNumber?: string,
  trackingUrl?: string,
  orderAccessToken?: string,
): { html: string; text: string } {
  const statusEmoji =
    {
      pending: "⏳",
      processing: "🔄",
      shipped: "🚚",
      delivered: "✅",
      cancelled: "❌",
    }[order.status] || "📦";

  const content = `
    <div style="margin-bottom: 30px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 15px;">${statusEmoji}</div>
      <h2 style="color: #2d5a2d; font-size: 28px; margin-bottom: 10px; font-weight: 700;">Order Update</h2>
      <p style="color: #666; font-size: 16px; margin: 0;">Hi ${customerName}, we have an update on your order!</p>
    </div>
    
    <!-- Status Update Card -->
    <div style="background: linear-gradient(135deg, #f8fffe 0%, #e8f5e8 100%); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
      <h3 style="color: #2d5a2d; font-size: 24px; margin: 0 0 15px 0; font-weight: 700;">
        Order #${order.id.slice(-8).toUpperCase()}
      </h3>
      <div style="background-color: #2d5a2d; color: white; padding: 12px 24px; border-radius: 25px; font-size: 16px; font-weight: 600; display: inline-block; margin-bottom: 20px;">
        ${order.status.toUpperCase()}
      </div>
      <p style="color: #555; font-size: 16px; line-height: 1.7; margin: 0;">${statusMessage}</p>
    </div>
    
    ${trackingNumber
      ? `
      <!-- Tracking Information -->
      <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
        <h4 style="color: #2d5a2d; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">📍 Tracking Information</h4>
        <p style="color: #555; font-size: 16px; margin: 0 0 10px 0;">Tracking Number:</p>
        <p style="color: #2d5a2d; font-size: 18px; font-weight: 600; font-family: monospace; margin: 0;">${trackingNumber}</p>
      </div>
    `
      : ""
    }
    
    <!-- Action Buttons -->
    <div style="text-align: center; margin: 30px 0;">
      ${getSecondaryButton("View Order Details", `${process.env.DOMAIN || "http://localhost:5000"}/order-access?token=${orderAccessToken || ''}&orderId=${order.id}`)}
    </div>
  `;

  const html = getBaseEmailTemplate("Order Update - Bmaafashion", content);

  const text = `
Order Update ${statusEmoji}

Hi ${customerName}, we have an update on your order!

Order #${order.id.slice(-8).toUpperCase()}
Status: ${order.status.toUpperCase()}

${statusMessage}

${trackingNumber ? `Tracking Number: ${trackingNumber}\n` : ""}View order details: ${process.env.DOMAIN || "http://localhost:5000"}/order-access?token=${orderAccessToken || ''}&orderId=${order.id}

Need help? Contact us at support@bmaafashion.com

Best regards,
The Bmaafashion Team

---
Bmaafashion - Fashion that transforms, one style at a time
© 2025 Bmaafashion. All rights reserved.
  `;

  return { html, text };
}

// 4. Payment Confirmation Template
export function generatePaymentConfirmationTemplate(
  order: Order,
  customerName: string,
  paymentMethod: string,
  receiptUrl?: string,
): { html: string; text: string } {
  const content = `
    <div style="margin-bottom: 30px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 15px;">💳</div>
      <h2 style="color: #2d5a2d; font-size: 28px; margin-bottom: 10px; font-weight: 700;">Payment Confirmed</h2>
      <p style="color: #666; font-size: 16px; margin: 0;">Thank you for your payment, ${customerName}!</p>
    </div>
    
    <!-- Payment Details Card -->
    <div style="background: linear-gradient(135deg, #f8fffe 0%, #e8f5e8 100%); border-radius: 12px; padding: 30px; margin: 30px 0;">
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="background-color: #28a745; color: white; padding: 12px 24px; border-radius: 25px; font-size: 16px; font-weight: 600; display: inline-block;">
          ✅ PAYMENT SUCCESSFUL
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Order Number</p>
          <p style="color: #2d5a2d; font-size: 16px; font-weight: 600; margin: 0;">#${order.id.slice(-8).toUpperCase()}</p>
        </div>
        <div>
          <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Payment Method</p>
          <p style="color: #2d5a2d; font-size: 16px; font-weight: 600; margin: 0;">${paymentMethod}</p>
        </div>
        <div>
          <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Amount Paid</p>
          <p style="color: #2d5a2d; font-size: 20px; font-weight: 700; margin: 0;">₹${Number(order.total).toFixed(2)}</p>
        </div>
        <div>
          <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Payment Date</p>
          <p style="color: #2d5a2d; font-size: 16px; font-weight: 600; margin: 0;">${new Date().toLocaleDateString("en-IN")}</p>
        </div>
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div style="text-align: center; margin: 30px 0;">
      ${getSecondaryButton("View Order", `${process.env.DOMAIN || "http://localhost:5000"}/orders/${order.id}`)}
    </div>
    
    <!-- Next Steps -->
    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
      <h4 style="color: #2d5a2d; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">🚀 What Happens Next?</h4>
      <p style="color: #555; font-size: 15px; line-height: 1.7; margin: 0;">
        Your payment has been successfully processed and your order is now being prepared for shipment. 
        You'll receive tracking information once your items are dispatched.
      </p>
    </div>
  `;

  const html = getBaseEmailTemplate("Payment Confirmed - Bmaafashion", content);

  const text = `
Payment Confirmed 💳

Thank you for your payment, ${customerName}!

Payment Details:
Order Number: #${order.id.slice(-8).toUpperCase()}
Payment Method: ${paymentMethod}
Amount Paid: ₹${Number(order.total).toFixed(2)}
Payment Date: ${new Date().toLocaleDateString("en-IN")}

Status: PAYMENT SUCCESSFUL ✅

View Order: ${process.env.DOMAIN || "http://localhost:5000"}/orders/${order.id}

What Happens Next?
Your payment has been successfully processed and your order is now being prepared for shipment. You'll receive tracking information once your items are dispatched.

Need help? Contact us at support@bmaafashion.com

Best regards,
The Bmaafashion Team

---
Bmaafashion - Fashion that transforms, one style at a time
© 2025 Bmaafashion. All rights reserved.
  `;

  return { html, text };
}

// 5. Support Ticket / Contact Form Template
export function generateSupportTicketTemplate(
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  subject: string,
  message: string,
): { html: string; text: string } {
  const content = `
    <div style="margin-bottom: 30px; text-align: center;">
      <div style="font-size: 48px; margin-bottom: 15px;">📨</div>
      <h2 style="color: #2d5a2d; font-size: 28px; margin-bottom: 10px; font-weight: 700;">New Contact Form Submission</h2>
      <p style="color: #666; font-size: 16px; margin: 0;">You have received a new message from a customer</p>
    </div>
    
    <!-- Customer Details Card -->
    <div style="background: linear-gradient(135deg, #f8fffe 0%, #e8f5e8 100%); border-radius: 12px; padding: 30px; margin: 30px 0;">
      <h3 style="color: #2d5a2d; font-size: 20px; margin: 0 0 20px 0; font-weight: 700;">Customer Information</h3>
      
      <div style="margin-bottom: 15px;">
        <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Name</p>
        <p style="color: #2d5a2d; font-size: 16px; margin: 0; font-weight: 600;">${customerName}</p>
      </div>
      
      <div style="margin-bottom: 15px;">
        <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Email</p>
        <p style="color: #2d5a2d; font-size: 16px; margin: 0; font-weight: 600;">
          <a href="mailto:${customerEmail}" style="color: #2d5a2d; text-decoration: none;">${customerEmail}</a>
        </p>
      </div>
      
      <div style="margin-bottom: 15px;">
        <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Phone</p>
        <p style="color: #2d5a2d; font-size: 16px; margin: 0; font-weight: 600;">
          <a href="tel:${customerPhone}" style="color: #2d5a2d; text-decoration: none;">${customerPhone}</a>
        </p>
      </div>
      
      <div>
        <p style="color: #666; font-size: 14px; margin: 0 0 5px 0;">Subject</p>
        <p style="color: #2d5a2d; font-size: 16px; margin: 0; font-weight: 600;">${subject}</p>
      </div>
    </div>
    
    <!-- Message Content -->
    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0;">
      <h4 style="color: #2d5a2d; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">Message</h4>
      <p style="color: #555; font-size: 16px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${message}</p>
    </div>
    
    <!-- Quick Action Button -->
    <div style="text-align: center; margin: 30px 0;">
      ${getPrimaryButton("Reply to Customer", `mailto:${customerEmail}`)}
    </div>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin-top: 30px;">
      <p style="color: #856404; margin: 0; font-size: 14px;">
        <strong>⏰ Action Required:</strong> Please respond to this customer inquiry within 24 hours to maintain excellent customer service.
      </p>
    </div>
  `;

  const html = getBaseEmailTemplate("New Contact Form Submission - Bmaafashion", content);

  const text = `
New Contact Form Submission 📨

Customer Information:
Name: ${customerName}
Email: ${customerEmail}
Phone: ${customerPhone}
Subject: ${subject}

Message:
${message}

---

⏰ Action Required: Please respond to this customer inquiry within 24 hours.

Reply to customer: ${customerEmail}

---
Bmaafashion Support Team
© 2025 Bmaafashion. All rights reserved.
  `;

  return { html, text };
}

// =============================================================================
// EMAIL SENDING FUNCTIONS
// =============================================================================

// Enhanced verification email function
export async function sendVerificationEmail(
  to: string,
  recipientName: string,
  verificationToken: string,
): Promise<boolean> {
  return await queueEmail({
    type: EmailType.EMAIL_VERIFICATION,
    priority: EmailPriority.HIGH,
    to,
    recipientName,
    subject: "Verify Your Bmaafashion Account",
    templateData: {
      recipientName,
      verificationToken,
      verificationLink: `${process.env.DOMAIN || "http://localhost:5000"}/verify-email?token=${verificationToken}`,
    },
  });
}

// Send password reset email
export async function sendPasswordResetEmail(
  to: string,
  recipientName: string,
  resetToken: string,
): Promise<boolean> {
  return await queueEmail({
    type: EmailType.PASSWORD_RESET,
    priority: EmailPriority.HIGH,
    to,
    recipientName,
    subject: "Reset Your Bmaafashion Password",
    templateData: {
      recipientName,
      resetToken,
      resetLink: `${process.env.DOMAIN || "http://localhost:5000"}/reset-password?token=${resetToken}`,
    },
  });
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(
  order: Order & { items: (OrderItem & { product: Product })[] },
  customerName: string,
  customerEmail: string,
  userId?: string,
): Promise<boolean> {
  const orderAccessToken = generateOrderAccessToken(order.id, userId);
  
  return await queueEmail({
    type: EmailType.ORDER_CONFIRMATION,
    priority: EmailPriority.HIGH,
    to: customerEmail,
    recipientName: customerName,
    subject: `Order Confirmed #${order.id.slice(-8).toUpperCase()} - Bmaafashion`,
    templateData: {
      order,
      customerName,
      orderTrackingUrl: `${process.env.DOMAIN || "http://localhost:5000"}/order-access?token=${orderAccessToken}&orderId=${order.id}`,
    },
    userId,
  });
}

// Send admin order notification email
export async function sendAdminOrderNotificationEmail(
  order: Order & { items: (OrderItem & { product: Product })[] },
  customerName: string,
  customerEmail: string,
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_EMAIL;
  
  if (!adminEmail) {
    console.warn('⚠️ No admin email configured. Skipping admin order notification.');
    return false;
  }
  
  return await queueEmail({
    type: EmailType.ADMIN_ORDER_NOTIFICATION,
    priority: EmailPriority.HIGH,
    to: adminEmail,
    recipientName: 'Admin',
    subject: `New Order #${order.id.slice(-8).toUpperCase()} - ${customerName}`,
    templateData: {
      order,
      customerName,
      customerEmail,
    },
  });
}

// Send order status update email
export async function sendOrderStatusUpdateEmail(
  order: Order,
  customerName: string,
  customerEmail: string,
  statusMessage: string,
  trackingNumber?: string,
  userId?: string,
): Promise<boolean> {
  const orderAccessToken = generateOrderAccessToken(order.id, userId);
  
  return await queueEmail({
    type: EmailType.ORDER_STATUS_UPDATE,
    priority: EmailPriority.NORMAL,
    to: customerEmail,
    recipientName: customerName,
    subject: `Order Update #${order.id.slice(-8).toUpperCase()} - ${order.status.toUpperCase()}`,
    templateData: {
      order,
      customerName,
      statusMessage,
      trackingNumber,
      trackingUrl: trackingNumber
        ? `https://example-tracking.com/${trackingNumber}`
        : undefined,
      orderAccessToken,
    },
    userId,
  });
}

// Send payment confirmation email
export async function sendPaymentConfirmationEmail(
  order: Order,
  customerName: string,
  customerEmail: string,
  paymentMethod: string,
  userId?: string,
): Promise<boolean> {
  return await queueEmail({
    type: EmailType.PAYMENT_CONFIRMATION,
    priority: EmailPriority.HIGH,
    to: customerEmail,
    recipientName: customerName,
    subject: `Payment Confirmed #${order.id.slice(-8).toUpperCase()} - Bmaafashion`,
    templateData: {
      order,
      customerName,
      paymentMethod,
      receiptUrl: `${process.env.DOMAIN || "http://localhost:5000"}/api/orders/${order.id}/invoice`,
    },
    userId,
  });
}

// Send payment failure email
export async function sendPaymentFailureEmail(
  order: Order,
  customerName: string,
  customerEmail: string,
  paymentMethod: string,
  failureReason?: string,
  userId?: string,
): Promise<boolean> {
  return await queueEmail({
    type: EmailType.PAYMENT_FAILED,
    priority: EmailPriority.HIGH,
    to: customerEmail,
    recipientName: customerName,
    subject: `Payment Failed #${order.id.slice(-8).toUpperCase()} - Bmaafashion`,
    templateData: {
      order,
      customerName,
      paymentMethod,
      failureReason: failureReason || "Payment verification failed",
      retryUrl: `${process.env.DOMAIN || "http://localhost:5000"}/orders/${order.id}/retry-payment`,
    },
    userId,
  });
}

// Send account created from guest checkout email
export async function sendAccountCreatedFromGuestEmail(
  recipientName: string,
  email: string,
  temporaryPassword: string,
  userId: string,
): Promise<boolean> {
  const loginUrl = `${process.env.DOMAIN || "http://localhost:5000"}/login`;

  return await queueEmail({
    type: EmailType.ACCOUNT_CREATED_FROM_GUEST,
    priority: EmailPriority.HIGH,
    to: email,
    recipientName,
    subject: "Your Bmaafashion Account is Ready! 🎉",
    templateData: {
      recipientName,
      email,
      temporaryPassword,
      loginUrl,
    },
    userId,
  });
}

// Send contact form submission email
export async function sendContactFormEmail(
  name: string,
  email: string,
  phone: string,
  subject: string,
  message: string,
): Promise<boolean> {
  const recipientEmail = process.env.CONTACT_FORM_RECIPIENT_EMAIL || "info@bmaafashion.com";

  return await queueEmail({
    type: EmailType.SUPPORT_TICKET,
    priority: EmailPriority.NORMAL,
    to: recipientEmail,
    recipientName: "Bmaafashion Support Team",
    subject: `Contact Form: ${subject}`,
    templateData: {
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      subject,
      message,
    },
  });
}

// =============================================================================
// EMAIL QUEUE AND DELIVERY SYSTEM
// =============================================================================

// Queue email for processing with persistent database storage
export async function queueEmail(params: {
  type: EmailType;
  priority: EmailPriority;
  to: string;
  recipientName: string;
  subject: string;
  templateData: Record<string, any>;
  userId?: string;
  scheduledAt?: Date;
}): Promise<boolean> {
  try {
    // CRITICAL ENFORCEMENT: Check rate limiting before enqueuing
    const identifier = params.userId || params.to;
    const canSendMinute = await storage.checkRateLimit(
      identifier,
      params.priority,
      "minute",
    );
    const canSendHour = await storage.checkRateLimit(
      identifier,
      params.priority,
      "hour",
    );

    if (!canSendMinute || !canSendHour) {
      console.log(
        `🚫 Email rate limited: ${params.type} to ${params.to} (Priority: ${params.priority})`,
      );
      // Record the suppression for monitoring
      await recordEmailSuppression(params, "RATE_LIMITED");
      return true; // Return true as this is not an error, just rate limited
    }

    // CRITICAL ENFORCEMENT: Check user email preferences
    if (params.userId) {
      const userPrefs = await storage.getUserPreferences(params.userId);
      if (userPrefs && !shouldSendEmail(params.type, userPrefs)) {
        console.log(
          `🚫 Email blocked by user preferences: ${params.type} for user ${params.userId}`,
        );
        await recordEmailSuppression(params, "USER_PREFERENCES");
        return true; // Return true as this is not an error
      }
    }

    // CRITICAL ENFORCEMENT: Check email-specific preferences for guest users
    if (!params.userId) {
      const emailAllowed = await storage.checkEmailAllowed(
        params.to,
        params.type,
      );
      if (!emailAllowed) {
        console.log(
          `🚫 Email blocked by email preferences: ${params.type} to ${params.to}`,
        );
        await recordEmailSuppression(params, "EMAIL_PREFERENCES");
        return true; // Return true as this is not an error
      }
    }

    // Generate email content based on type
    const { html, text } = generateEmailFromTemplate(
      params.type,
      params.templateData,
    );

    // INSTANT SEND: Send email immediately via SMTP instead of queuing
    console.log(`📤 Sending email instantly: ${params.type} to ${params.to} (Priority: ${params.priority})`);
    
    const sent = await sendEmailDirectly({
      to: params.to,
      from: process.env.SMTP_EMAIL || "noreply@bmaafashion.com",
      subject: params.subject,
      html,
      text,
    });

    if (sent) {
      console.log(`✅ Email sent instantly: ${params.type} to ${params.to}`);

      // Record rate limiting counters
      await storage.recordEmailSend(identifier, params.priority, "minute");
      await storage.recordEmailSend(identifier, params.priority, "hour");

      return true;
    } else {
      throw new Error("Failed to send email via SMTP");
    }
  } catch (error) {
    console.error("❌ Failed to send email instantly:", error);
    return false;
  }
}

// Generate email content from template
function generateEmailFromTemplate(
  type: EmailType,
  data: Record<string, any>,
): { html: string; text: string } {
  switch (type) {
    case EmailType.EMAIL_VERIFICATION:
      return generateVerificationEmailTemplate(
        data.recipientName,
        data.verificationLink,
      );

    case EmailType.PASSWORD_RESET:
      return generatePasswordResetTemplate(
        data.recipientName,
        data.resetLink,
      );

    case EmailType.ACCOUNT_CREATED_FROM_GUEST:
      return generateAccountCreatedFromGuestTemplate(
        data.recipientName,
        data.email,
        data.temporaryPassword,
        data.loginUrl,
      );

    case EmailType.ORDER_CONFIRMATION:
      return generateOrderConfirmationTemplate(
        data.order,
        data.customerName,
        data.orderTrackingUrl,
      );

    case EmailType.ADMIN_ORDER_NOTIFICATION:
      return generateAdminOrderNotificationTemplate(
        data.order,
        data.customerName,
        data.customerEmail,
      );

    case EmailType.ORDER_STATUS_UPDATE:
      return generateOrderStatusUpdateTemplate(
        data.order,
        data.customerName,
        data.statusMessage,
        data.trackingNumber,
        data.trackingUrl,
        data.orderAccessToken,
      );

    case EmailType.PAYMENT_CONFIRMATION:
      return generatePaymentConfirmationTemplate(
        data.order,
        data.customerName,
        data.paymentMethod,
        data.receiptUrl,
      );

    case EmailType.SUPPORT_TICKET:
      return generateSupportTicketTemplate(
        data.customerName,
        data.customerEmail,
        data.customerPhone,
        data.subject,
        data.message,
      );

    default:
      throw new Error(`Unsupported email template type: ${type}`);
  }
}

// Check if email should be sent based on user preferences
function shouldSendEmail(
  type: EmailType,
  preferences: UserPreferences,
): boolean {
  const emailNotifications = preferences.emailNotifications as any;

  switch (type) {
    case EmailType.EMAIL_VERIFICATION:
    case EmailType.PASSWORD_RESET:
    case EmailType.ADMIN_ORDER_NOTIFICATION:
      return true; // Always send security and admin emails

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
}

// Process email queue using database operations with proper locking
export async function processEmailQueue(): Promise<void> {
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    // In development mode, log emails instead of sending
    const readyEmails = await storage.dequeueReadyEmails(10); // Process up to 10 emails

    for (const email of readyEmails) {
      try {
        console.log(`[DEV] 📧 Email would be sent:`);
        console.log(`  Type: ${email.type}`);
        console.log(`  To: ${email.to}`);
        console.log(`  Subject: ${email.subject}`);
        if (
          email.type === EmailType.EMAIL_VERIFICATION &&
          email.templateData &&
          typeof email.templateData === "object" &&
          "verificationToken" in email.templateData
        ) {
          console.log(
            `  [DEV] Verification link: ${process.env.DOMAIN || "http://localhost:5000"}/verify-email?token=${email.templateData.verificationToken}`,
          );
        }

        // Mark as sent in database
        await storage.updateEmailStatus(
          email.id,
          "sent",
          undefined,
          undefined,
          new Date(),
        );

        // Log to notifications table
        if (email.userId) {
          try {
            await storage.createNotification({
              userId: email.userId,
              type: email.type,
              title: email.subject,
              message: email.textContent.substring(0, 200) + "...",
              data: email.templateData as Record<string, any> | undefined,
              emailSent: true,
              emailSentAt: new Date(),
            });
          } catch (error) {
            console.error("Failed to create notification record:", error);
          }
        }
      } catch (error) {
        console.error(
          `Failed to process email ${email.id} in dev mode:`,
          error,
        );
        await storage.markEmailAsFailed(
          email.id,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
    return;
  }

  // Get ready emails from database with proper locking
  const readyEmails = await storage.dequeueReadyEmails(10); // Process up to 10 emails at a time

  for (const email of readyEmails) {
    try {
      // Send email via SendGrid
      await sendEmailDirectly({
        to: email.to,
        from: email.from,
        subject: email.subject,
        html: email.htmlContent,
        text: email.textContent,
      });

      console.log(`✅ Email sent successfully: ${email.type} to ${email.to}`);

      // Update email status in database
      await storage.updateEmailStatus(
        email.id,
        "sent",
        undefined,
        undefined,
        new Date(),
      );

      // Log to notifications table
      if (email.userId) {
        try {
          await storage.createNotification({
            userId: email.userId,
            type: email.type,
            title: email.subject,
            message: email.textContent.substring(0, 200) + "...",
            data: email.templateData as Record<string, any> | undefined,
            emailSent: true,
            emailSentAt: new Date(),
          });
        } catch (error) {
          console.error("Failed to create notification record:", error);
        }
      }
    } catch (error) {
      console.error(
        `❌ Failed to send email (attempt ${email.retryCount + 1}):`,
        error,
      );

      if (email.retryCount < email.maxRetries) {
        // Schedule retry with exponential backoff
        const delay =
          retryDelays[Math.min(email.retryCount, retryDelays.length - 1)];
        const nextRetryAt = new Date(Date.now() + delay);
        await storage.incrementEmailRetry(email.id, nextRetryAt);
        console.log(
          `🔄 Email retry scheduled in ${delay / 1000}s for: ${email.type} to ${email.to}`,
        );
      } else {
        console.error(
          `💀 Email permanently failed after ${email.maxRetries} attempts: ${email.type} to ${email.to}`,
        );
        await storage.markEmailAsFailed(
          email.id,
          error instanceof Error ? error.message : String(error),
        );

        // Record to dead letter queue for monitoring
        await recordDeadLetterEmail(email, error);
      }
    }
  }
}

// Direct email sending function (internal)
async function sendEmailDirectly(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.log(`📧 [DEV MODE] Email would be sent to ${params.to}:`);
      console.log(`   Subject: ${params.subject}`);
      console.log(`   Content: ${params.text || "HTML content provided"}`);
      return true;
    }

    console.log(`📤 Attempting to send email via SMTP to: ${params.to}`);
    
    const info = await transporter.sendMail({
      from: params.from || process.env.SMTP_EMAIL || "noreply@bmaafashion.com",
      to: params.to,
      subject: params.subject,
      text: params.text || "",
      html: params.html || "",
    });
    
    // Log detailed SMTP response
    console.log(`📬 SMTP Response for ${params.to}:`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log(`   Accepted: ${JSON.stringify(info.accepted)}`);
    console.log(`   Rejected: ${JSON.stringify(info.rejected)}`);
    console.log(`   Pending: ${JSON.stringify(info.pending)}`);
    
    if (info.rejected && info.rejected.length > 0) {
      throw new Error(`Email rejected by server for recipients: ${info.rejected.join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ SMTP Error details:`, error);
    throw error; // Re-throw for retry logic
  }
}

// Start email queue processor (call this on server startup)
export function startEmailProcessor(): void {
  // Process queue every 30 seconds
  setInterval(async () => {
    try {
      await processEmailQueue();
    } catch (error) {
      console.error("Error in email queue processor:", error);
    }
  }, 30000);

  // Cleanup old emails daily
  setInterval(
    async () => {
      try {
        await storage.cleanupOldEmailQueue(7); // Keep emails for 7 days
        await storage.cleanupOldRateLimits(); // Cleanup old rate limit records
        console.log("🧹 Email queue cleanup completed");
      } catch (error) {
        console.error("Error in email queue cleanup:", error);
      }
    },
    24 * 60 * 60 * 1000,
  ); // 24 hours

  console.log("📧 Email queue processor started with cleanup");
}

// Get email queue status (for monitoring) - now uses database
export async function getEmailQueueStatus(): Promise<{
  total: number;
  pending: number;
  sent: number;
  failed: number;
}> {
  try {
    const stats = await storage.getEmailQueueStats();
    const total = stats.pending + stats.sent + stats.failed;
    return { ...stats, total };
  } catch (error) {
    console.error("Failed to get email queue stats:", error);
    return { total: 0, pending: 0, sent: 0, failed: 0 };
  }
}

// Legacy function for backward compatibility
export async function sendEmail(params: EmailParams): Promise<boolean> {
  return await sendEmailDirectly(params);
}

// =============================================================================
// EMAIL SUPPRESSION AND MONITORING
// =============================================================================

// Record email suppression for monitoring and analytics
async function recordEmailSuppression(
  params: {
    type: EmailType;
    priority: EmailPriority;
    to: string;
    recipientName: string;
    subject: string;
    templateData: Record<string, any>;
    userId?: string;
    scheduledAt?: Date;
  },
  reason: "RATE_LIMITED" | "USER_PREFERENCES" | "EMAIL_PREFERENCES",
): Promise<void> {
  try {
    console.log(
      `📢 Email suppression recorded: ${params.type} to ${params.to} - ${reason}`,
    );

    // Record suppression event in notifications for tracking
    if (params.userId) {
      await storage.createNotification({
        userId: params.userId,
        type: params.type,
        title: `Email Suppressed: ${params.subject}`,
        message: `Email was suppressed due to ${reason.toLowerCase().replace("_", " ")}.`,
        data: { ...params.templateData, suppressionReason: reason },
        emailSent: false,
        emailSentAt: null,
      });
    }

    // TODO: Add to analytics/telemetry system for monitoring
    // This could be sent to monitoring services like DataDog, New Relic, etc.
  } catch (error) {
    console.error("Failed to record email suppression:", error);
  }
}

// Record dead letter email (permanently failed)
async function recordDeadLetterEmail(email: any, error: any): Promise<void> {
  try {
    console.log(`💀 Dead letter email recorded: ${email.type} to ${email.to}`);

    // Create notification for dead letter emails
    if (email.userId) {
      await storage.createNotification({
        userId: email.userId,
        type: email.type,
        title: `Email Failed Permanently: ${email.subject}`,
        message: `Email failed after ${email.maxRetries} attempts. Error: ${error.message}`,
        data: {
          ...email.templateData,
          finalError: error.message,
          retryCount: email.retryCount,
        },
        emailSent: false,
        emailSentAt: null,
      });
    }

    // TODO: Alert system administrators for critical emails
    // TODO: Add to dead letter queue table for analysis
  } catch (deadLetterError) {
    console.error("Failed to record dead letter email:", deadLetterError);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Calculate token expiration (24 hours from now)
export function getTokenExpiration(): Date {
  return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
}

// Generate cryptographically secure verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Hash verification token for secure database storage
export function hashVerificationToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Verify hashed token
export function verifyHashedToken(
  plainToken: string,
  hashedToken: string,
): boolean {
  const hashedPlainToken = hashVerificationToken(plainToken);
  return crypto.timingSafeEqual(
    Buffer.from(hashedPlainToken, "hex"),
    Buffer.from(hashedToken, "hex"),
  );
}

// Format currency for display
export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

// Format date for email display
export function formatEmailDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Clean up old queue entries (call periodically)
export async function cleanupEmailQueue(): Promise<void> {
  try {
    await storage.cleanupOldEmailQueue(7); // Keep emails for 7 days
    await storage.cleanupOldRateLimits(); // Cleanup old rate limit records
    console.log("🧹 Email queue cleanup completed successfully");
  } catch (error) {
    console.error("Error during email queue cleanup:", error);
  }
}

// =============================================================================
// EMAIL SYSTEM INITIALIZATION
// =============================================================================

// Initialize email system (call on server startup)
export function initializeEmailSystem(): void {
  console.log("📧 Initializing comprehensive email notification system...");

  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn(
      "⚠️  SMTP credentials not set - running in development mode (emails will be logged)",
    );
  } else {
    console.log("✅ SMTP credentials configured - emails will be sent instantly via SMTP");
  }

  // Queue processor disabled - emails are sent instantly now
  // startEmailProcessor();

  // Cleanup not needed for instant sending - emails not stored in database
  // setInterval(cleanupEmailQueue, 6 * 60 * 60 * 1000);

  console.log("✅ Email system initialized successfully (instant delivery mode)");
  console.log(
    `📊 Supported email types: ${Object.values(EmailType).join(", ")}`,
  );
}
