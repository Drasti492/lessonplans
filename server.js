require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const mongoose = require("mongoose");

const app = express();

app.use(cors({ exposedHeaders: ["X-Lesson-Topic"] }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

// MongoDB optional — don't crash if it fails
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.warn("MongoDB skipped:", err.message));
}

app.use("/api/lessons", require("./routes/lessons"));
app.use("/api/schemes", require("./routes/schemes"));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.get("*", (req, res) => {
  const p = path.join(__dirname, "public", "index.html");
  res.sendFile(p, err => { if (err) res.send("EduPlan API running."); });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));