import express, { type Application, type Request, type Response, type NextFunction } from "express";
import dotenv from "dotenv";
import http from "http";
import helmet from "helmet";
import { Server } from "socket.io";
import { setupSocket } from "./socket/socket";
import { apiLimiter } from "./middlewares/rateLimit.middleware";
import connectDB from "./config/db.js";
import cors, { CorsOptions } from "cors";
import routes from "./routes/index.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { stripeWebhookController } from "./controllers/stripe.webhook.controller.js";
import { initAuctionCron } from "./cron/auction.cron.js";
import logger from "./utils/logger";

dotenv.config();
connectDB();

const app: Application = express();

// CORS options
const corsOptions: CorsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
};

// Stripe webhook (raw body)
app.use(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookController
);

// JSON + URL encoded middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet());

app.use(apiLimiter);

// CORS middleware
app.use(cors(corsOptions));


// File size error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "One or more files exceed 20MB limit"
    });
  }

  res.status(500).json({
    success: false,
    message: err.message
  });
});


// API routes
app.use("/api/reyu-diamond/", routes);

// General error handler
app.use(errorHandler);

// ------------------------
// SOCKET.IO SETUP
// ------------------------

// create HTTP server from Express app
const server = http.createServer(app);

// attach Socket.IO
export const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
});

// call your socket setup function
setupSocket(io);

// start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV });
  initAuctionCron();
});
