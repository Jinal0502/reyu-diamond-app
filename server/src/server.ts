import express, { type Application, type Request, type Response , type NextFunction } from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors , {CorsOptions} from "cors";
import routes from "./routes/index.routes.js"
import { errorHandler } from "./middlewares/error.middleware.js";

dotenv.config();
connectDB();
const app: Application = express();

const corsOptions: CorsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors(corsOptions));

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

app.use("/api/reyu-diamond/" , routes)

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});