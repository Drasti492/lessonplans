const express = require("express");
const router = express.Router();

const { generateLessonContent } = require("../services/aiGenerator");
const { generateLessonPlanDocx } = require("../services/docxGenerator");

router.post("/generate", async (req, res) => {
  try {

    const formData = req.body;

    const aiContent = await generateLessonContent(
      formData,
      formData.schemeText || ""
    );

    const fullPlan = {
      ...formData,
      ...aiContent
    };

    const docBuffer = await generateLessonPlanDocx(fullPlan);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=lesson-plan.docx"
    );

    res.send(docBuffer);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Failed to generate lesson plan"
    });
  }
});

module.exports = router;