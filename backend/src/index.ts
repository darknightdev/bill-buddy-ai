import express from "express";
import cors from "cors";
import ingest from "./routes/ingest";
import annotate from "./routes/annotate";
import snippet from "./routes/snippet";
import compose from "./routes/compose";
import avp from "./routes/avp"; // Combined pipeline route
import ask from "./routes/ask";

const app = express();

// Configure CORS to allow frontend requests
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use("/api/ingest", ingest);
app.use("/api/annotate", annotate);
app.use("/api/snippet", snippet);
app.use("/api/compose", compose);
app.use("/api/avp", avp); // Combined pipeline
app.use("/api/ask", ask);

// Static file serving
app.use("/media", express.static("public/media"));
app.use("/videos", express.static("public/videos"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global error handler:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(4000, () => console.log("🚀 backend on http://localhost:4000")); 