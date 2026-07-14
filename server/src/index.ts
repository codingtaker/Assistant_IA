import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import pitchRouter from "./routes/pitch";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// --- Security & parsing ---
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CORS_ORIGINS ?? "http://localhost:5173")
      .split(",")
      .map((o) => o.trim()),
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "50kb" }));

// --- Routes ---
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "2.0.0" });
});

app.use("/api/pitch", pitchRouter);

// --- Error handling ---
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 StartupPitch AI server running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV ?? "development"}`);
});
