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

export function createRouter() {
  const app = new Hono();

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

  return app;
}
