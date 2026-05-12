require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const path    = require("path");

const app = express();

/* ── Middleware ── */
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* ── Serve frontend static files (if in same repo) ── */
app.use(express.static(path.join(__dirname, "public")));

/* ── API Routes ── */
app.use("/api/lessons", require("./routes/lessons"));
app.use("/api/schemes", require("./routes/schemes"));

/* ── Health check ── */
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

/* ── Fallback: serve index.html for any non-API route ── */
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "public", "index.html");
  res.sendFile(indexPath, (err) => {
    if (err) res.send("Lesson Plan Generator API is running.");
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));