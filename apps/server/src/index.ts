import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import contestRoutes from "./routes/contest.routes";
import problemRoutes from "./routes/problem.routes";
import http from "http";
import { initSocket } from "./sockets";
import submissionRoutes from "./routes/submission.routes";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/contests", contestRoutes);

app.use("/api/problems", problemRoutes);

app.use("/api/submissions", submissionRoutes);


// --- GLOBAL ERROR HANDLER ---
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});
// ----------------------------

const PORT = process.env.PORT || 5001;

const httpServer = http.createServer(app);
initSocket(httpServer);

connectDB().then(() => {
  httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});