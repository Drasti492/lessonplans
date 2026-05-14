require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");
const path     = require("path");

const app = express();

/*  Middleware  */
app.use(cors({ exposedHeaders: ["X-Lesson-Topic"] }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/*  Static frontend (if deployed together)  */
app.use(express.static(path.join(__dirname, "public")));

/*  MongoDB  */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log(" MongoDB connected"))
  .catch((err) => console.error(" MongoDB error:", err.message));

/*  Routes  */
app.use("/api/curriculum", require("./routes/curriculum"));
app.use("/api/lessons",    require("./routes/lessons"));
app.use("/api/admin",      require("./routes/admin"));

/*  Health  */
app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date() }));

/*  Fallback  */
app.get("*", (_req, res) => {
  const idx = path.join(__dirname, "public", "index.html");
  res.sendFile(idx, (err) => { if (err) res.send("EduPlan API running."); });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));