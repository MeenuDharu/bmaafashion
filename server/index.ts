// import express, { type Request, Response, NextFunction } from "express";
// import { registerRoutes } from "./routes";
// import { setupVite, serveStatic, log } from "./vite";
// import { seedProducts } from "./seedProducts";
// import { initializeEmailSystem } from "./emailService";
// import { startSmsQueueProcessor } from "./smsService";
// import { startWhatsappQueueProcessor } from "./whatsappService";
// import dotenv from "dotenv";
// dotenv.config();

// const app = express();
// // Configure trust proxy BEFORE any rate limiting middleware
// // This fixes the X-Forwarded-For header validation error
// app.set("trust proxy", 1);
// // Increase payload size limit to support file uploads (profile images, etc.)
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// app.use((req, res, next) => {
//   const start = Date.now();
//   const path = req.path;
//   let capturedJsonResponse: Record<string, any> | undefined = undefined;

//   const originalResJson = res.json;
//   res.json = function (bodyJson, ...args) {
//     capturedJsonResponse = bodyJson;
//     return originalResJson.apply(res, [bodyJson, ...args]);
//   };

//   res.on("finish", () => {
//     const duration = Date.now() - start;
//     if (path.startsWith("/api")) {
//       let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
//       if (capturedJsonResponse) {
//         logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
//       }

//       if (logLine.length > 80) {
//         logLine = logLine.slice(0, 79) + "…";
//       }

//       log(logLine);
//     }
//   });

//   next();
// });

// (async () => {
//   // Initialize notification systems
//   console.log("🚀 Starting Bmaa Fashion application...");

//   try {
//     initializeEmailSystem();
//     console.log("✅ Email system initialized");
//   } catch (error) {
//     console.error("❌ Failed to initialize email system:", error);
//   }

//   try {
//     startSmsQueueProcessor();
//     console.log("✅ SMS system initialized");
//   } catch (error) {
//     console.error("❌ Failed to initialize SMS system:", error);
//     console.warn("⚠️ SMS notifications will be disabled");
//   }

//   try {
//     startWhatsappQueueProcessor();
//     console.log("✅ WhatsApp system initialized");
//   } catch (error) {
//     console.error("❌ Failed to initialize WhatsApp system:", error);
//     console.warn("⚠️ WhatsApp notifications will be disabled");
//   }

//   // Initialize database with sample products on startup
//   // try {
//   //   await seedProducts();
//   // } catch (error) {
//   //   console.error('Failed to seed products:', error);
//   // }

//   const server = await registerRoutes(app);

//   app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
//     const status = err.status || err.statusCode || 500;
//     const message = err.message || "Internal Server Error";

//     res.status(status).json({ message });
//     throw err;
//   });

//   // importantly only setup vite in development and after
//   // setting up all the other routes so the catch-all route
//   // doesn't interfere with the other routes
//   if (app.get("env") === "development") {
//     await setupVite(app, server);
//   } else {
//     serveStatic(app);
//   }

//   // ALWAYS serve the app on the port specified in the environment variable PORT
//   // Other ports are firewalled. Default to 5000 if not specified.
//   // this serves both the API and the client.
//   // It is the only port that is not firewalled.
//   const port = parseInt(process.env.PORT || "5000", 10);
//   server.listen(
//     {
//       port,
//       host: "0.0.0.0",
//       reusePort: true,
//     },
//     () => {
//       log(`serving on port ${port}`);
//     },
//   );
// })();
// ✅ ensure env is loaded BEFORE other imports read process.env
import "dotenv/config";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite.js";
import { seedProducts } from "./seedProducts.js";
import { initializeEmailSystem } from "./emailService.js";
import { startSmsQueueProcessor } from "./smsService.js";
import { startWhatsappQueueProcessor } from "./whatsappService.js";

const app = express();

// trust proxy before any rate limiting
app.set("trust proxy", 1);

// lift payload limits for uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// tiny safe JSON helper for logs
function safeJson(obj: unknown, max = 800) {
  try {
    const s = JSON.stringify(obj);
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  } catch {
    return "[unserializable]";
  }
}

// simple api response logger
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json.bind(res);
  (res as any).json = function (bodyJson: any, ...args: any[]) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse)
        logLine += ` :: ${safeJson(capturedJsonResponse)}`;
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log("🚀 Starting Bmaa Fashion application...");

  // email system
  try {
    await initializeEmailSystem(); // make it async-safe
    console.log("✅ Email system initialized");
  } catch (error) {
    console.error("❌ Failed to initialize email system:", error);
  }

  // twilio guards
  const hasTwilio = !!(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  );

  try {
    if (hasTwilio) {
      startSmsQueueProcessor();
      console.log("✅ SMS system initialized");
    } else {
      console.warn("⚠️ SMS disabled: missing TWILIO_ACCOUNT_SID/AUTH_TOKEN");
    }
  } catch (error) {
    console.error("❌ Failed to initialize SMS system:", error);
    console.warn("⚠️ SMS notifications will be disabled");
  }

  try {
    if (hasTwilio) {
      startWhatsappQueueProcessor();
      console.log("✅ WhatsApp system initialized");
    } else {
      console.warn(
        "⚠️ WhatsApp disabled: missing TWILIO_ACCOUNT_SID/AUTH_TOKEN",
      );
    }
  } catch (error) {
    console.error("❌ Failed to initialize WhatsApp system:", error);
    console.warn("⚠️ WhatsApp notifications will be disabled");
  }

  // optional: seed products
  // try {
  //   await seedProducts();
  // } catch (error) {
  //   console.error("Failed to seed products:", error);
  // }

  const server = await registerRoutes(app);

  // safe error handler: DO NOT throw after responding
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    log(
      `ERROR ${status}: ${message}${err.stack ? " :: " + err.stack.split("\n")[0] : ""}`,
    );
    if (!res.headersSent) res.status(status);
    res.json({ message });
  });

  // vite or static
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();

// last-resort crash guards (optional)
process.on("unhandledRejection", (r) =>
  console.error("UNHANDLED REJECTION:", r),
);
process.on("uncaughtException", (e) => console.error("UNCAUGHT EXCEPTION:", e));
