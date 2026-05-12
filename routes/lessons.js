const express = require("express");
const router  = express.Router();

const { generateLessonContent  } = require("../services/aiGenerator");
const { generateLessonPlanDocx } = require("../services/docxGenerator");

router.post("/generate", async (req, res) => {
  try {
    const formData = req.body;

    // 1. Generate AI content
    const aiContent = await generateLessonContent(
      formData,
      formData.schemeText || ""
    );

    // 2. Merge with form data
    const fullPlan = { ...formData, ...aiContent };

    // 3. Build DOCX
    const docBuffer = await generateLessonPlanDocx(fullPlan);

    const filename = `W${formData.week || 1}L${formData.lessonNum || 1}_${
      (formData.topic || "lesson").replace(/[^a-zA-Z0-9]/g, "_")
    }.docx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(docBuffer);

  } catch (error) {
    console.error("Generate error:", error);
    res.status(500).json({ error: "Failed to generate lesson plan", detail: error.message });
  }
});

module.exports = router;