const express = require("express");
const multer  = require("multer");
const mammoth = require("mammoth");
const router  = express.Router();
const { getAllLessons } = require("../utils/extractTopics");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20*1024*1024 } });

router.get("/", (_req, res) => res.json({ message: "Schemes route working" }));

/* Upload DOCX/TXT → extract text */
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
      return res.status(400).json({ error: "Use DOCX or TXT." });
    }
    res.json({ text: text.trim() });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to extract file" });
  }
});

/* Preview: parse pasted scheme text, return detected lessons */
router.post("/preview", express.json({ limit: "5mb" }), (req, res) => {
  try {
    const { schemeText } = req.body;
    if (!schemeText || !schemeText.trim())
      return res.status(400).json({ error: "No scheme text provided" });

    const lessons = getAllLessons(schemeText);
    res.json({
      lessons: lessons.map(l => ({
        week:       l.week,
        lesson:     l.lesson,
        topic:      l.topic      || "",
        objectives: l.objectives || "",
        activities: l.activities || "",
        resources:  l.resources  || "",
        assessment: l.assessment || "",
      })),
      total: lessons.length,
    });
  } catch (err) {
    console.error("Preview error:", err);
    res.status(500).json({ error: "Failed to parse scheme" });
  }
});

module.exports = router;