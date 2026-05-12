const express = require("express");
const router  = express.Router();
const { generateLessonContent  } = require("../services/aiGenerator");
const { generateLessonPlanDocx } = require("../services/docxGenerator");

router.post("/generate", async (req, res) => {
  try {
    const formData = req.body;

    const aiContent = await generateLessonContent(formData, formData.schemeText || "");
    const fullPlan  = { ...formData, ...aiContent };

    // Pass topic back in header so frontend can update the card title
    if (aiContent.topic) {
      res.setHeader("X-Lesson-Topic", encodeURIComponent(aiContent.topic.substring(0, 100)));
    }

    const docBuffer = await generateLessonPlanDocx(fullPlan);
    const filename  = `W${formData.week||1}L${formData.lessonNum||1}_${
      (aiContent.topic || "lesson").replace(/[^a-zA-Z0-9]/g,"_")
    }.docx`;

    res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Access-Control-Expose-Headers", "X-Lesson-Topic");
    res.send(docBuffer);

  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: "Failed to generate lesson plan", detail: err.message });
  }
});

module.exports = router;