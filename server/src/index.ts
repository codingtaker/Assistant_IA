import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import pitchRouter from "./routes/pitch";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Trust the first proxy hop (Render / Railway / Vercel put exactly one proxy in
// front). This makes `req.ip` the real client IP for the rate-limiter instead of
// the proxy's. Value is a hop count (1), NOT `true` — `true` is permissive and
// would let clients spoof X-Forwarded-For. Increase only if you add more proxies.
app.set("trust proxy", 1);

// --- Security & parsing ---
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CORS_ORIGINS ?? "http://localhost:5173")
      .split(",")
      .map((o) => o.trim()),
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "x-api-key", "Authorization"],
    exposedHeaders: ["X-Quota-Remaining", "RateLimit-Limit", "RateLimit-Remaining"],
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
