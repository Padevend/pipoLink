import { Hono } from "hono";
import { AuthRouter } from "./routes/auth.route.js";
import { UserRouter } from "./routes/user.route.js";
import { DeviceRouter } from "./routes/device.route.js";
import { MessagingRouter } from "./routes/messaging.route.js";
import { LibraryRouter } from "./routes/library.route.js";
import { AiRouter } from "./routes/ai.route.js";
import { SubscriptionRouter } from "./routes/subscription.route.js";
import { PaymentRouter } from "./routes/payment.route.js";
import { NotificationRouter } from "./routes/notification.route.js";
import { AnnouncementRouter } from "./routes/announcement.route.js";
import { UpdatesRouter } from "./routes/updates.route.js";
import { AdminRouter } from "./routes/admin.route.js";
import { env } from "../config/envManager.js";
import { prisma } from "../config/database.js";
import { corsConfig } from "../config/cors.js";

export function createRouter() {
  const app = new Hono();

  // add cors 
  app.use(corsConfig);

  // route de sante
  app.get("/health", async (c) => {
    // verifier les connexions à la base de données, services externes, etc.
    let isDbConnected = await prisma.$connect().then(() => true).catch(() => false);

    return c.json({ 
      status: "live",
      environment: env.get("NODE_ENV") || "development",
      version: env.get("APP_VERSION") || "1.0.0",
      clientDomain: env.get("CLIENT_DOMAIN"),
      connectionCheck: {
        database: isDbConnected,
      }
    });
  });

  // Enregistrement des routes
  app.route("/auth", AuthRouter);
  app.route("/users", UserRouter);
  app.route("/devices", DeviceRouter);
  app.route("/messaging", MessagingRouter);
  app.route("/library", LibraryRouter);
  app.route("/ai", AiRouter);
  app.route("/subscriptions", SubscriptionRouter);
  app.route("/payments", PaymentRouter);
  app.route("/notifications", NotificationRouter);
  app.route("/announcements", AnnouncementRouter);
  app.route("/updates", UpdatesRouter);
  app.route("/admin", AdminRouter);

  return app;
}
