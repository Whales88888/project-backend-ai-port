import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    try {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    } catch (e) {
      console.error("Error in res.json:", e);
      return originalResJson.apply(res, [bodyJson, ...args]);
    }
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        try {
          // Safe JSON stringify - handle dates and circular refs
          const jsonStr = JSON.stringify(capturedJsonResponse, (key, value) => {
            if (value instanceof Date) {
              return value.toISOString();
            }
            return value;
          }, 2);
          if (jsonStr.length > 50) {
            logLine += ` :: ${jsonStr.substring(0, 47)}...`;
          } else {
            logLine += ` :: ${jsonStr}`;
          }
        } catch (e) {
          logLine += ` :: [JSON stringify error: ${e}]`;
        }
      }

      if (logLine.length > 200) {
        logLine = logLine.slice(0, 199) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Error handler - only process if response not sent
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    // For POST /api/appointments, provide more specific error
    if (req.method === 'POST' && req.path === '/api/appointments') {
      const status = err.status || err.statusCode || 400;
      const message = err.message || "Invalid appointment data";
      console.error(`[ERROR HANDLER] POST /api/appointments:`, message);
      console.error("Error details:", err);
      return res.status(status).json({ error: message });
    }
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`[ERROR HANDLER] ${req.method} ${req.path}:`, message);
    res.status(status).json({ error: message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
