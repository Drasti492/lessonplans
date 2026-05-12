const express = require("express");
const multer  = require("multer");
const mammoth = require("mammoth");
const router  = express.Router();

// Store file in memory (no disk needed)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

/* ── Health check ── */
router.get("/", (_req, res) => res.json({ message: "Schemes route working" }));

/* ── Upload and extract text from DOCX / TXT ── */
router.post("/upload", upload.single("scheme"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const name = req.file.originalname.toLowerCase();
    let text = "";

    if (name.endsWith(".txt")) {
      text = req.file.buffer.toString("utf-8");

    } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;

    } else {
      return res.status(400).json({ error: "Unsupported file type. Use DOCX or TXT." });
    }

    res.json({ text: text.trim() });

  } catch (err) {
    console.error("Scheme upload error:", err);
    res.status(500).json({ error: "Failed to extract text from file" });
  }
});

module.exports = router;