const express  = require("express");
const router   = express.Router();
const Subtopic = require("../models/Subtopic");
const Topic    = require("../models/Topic");
const Subject  = require("../models/Subject");
const { enhanceWithAI }        = require("../services/aiGenerator");
const { generateLessonPlanDocx } = require("../services/docxGenerator");

router.post("/generate", async (req, res) => {
  try {
    const body = req.body;

    /* ── 1. Fetch subtopic + topic + subject from DB ── */
    const subtopic = await Subtopic.findById(body.subtopicId);
    if (!subtopic) {
      return res.status(404).json({ error: "Subtopic not found. Run seed first." });
    }

    const topic   = await Topic.findById(subtopic.topicId);
    const subject = topic ? await Subject.findById(topic.subjectId) : null;

    /* ── 2. Build rich lesson context from DB ── */
    const dbContent = {
      topicName:    topic    ? topic.name    : body.topic    || "",
      subjectName:  subject  ? subject.name  : body.subject  || "",
      subtopicName: subtopic.name,
      objectives:   subtopic.objectives  || "",
      activities:   subtopic.activities  || "",
      methods:      subtopic.methods     || "",
      resources:    subtopic.resources   || "",
      assessment:   subtopic.assessment  || "",
      values:       subtopic.values      || "",
      references:   subtopic.references  || "",
      introduction: subtopic.introduction || {},
      stage1:       subtopic.stage1       || {},
      stage2:       subtopic.stage2       || {},
      conclusion:   subtopic.conclusion   || {},
    };

    /* ── 3. Merge teacher/school info with DB content ── */
    const lessonParams = {
      studentName:  body.studentName  || "",
      admNo:        body.admNo        || "",
      schoolName:   body.schoolName   || "",
      department:   body.department   || "School of Education, Humanities and Social Sciences",
      subject:      dbContent.subjectName,
      form:         body.form || body.grade || "",
      stream:       body.stream       || "",
      numStudents:  body.numStudents  || "",
      duration:     body.duration     || 40,
      day:          body.day          || "",
      date:         body.date         || "",
      startTime:    body.startTime    || "",
      endTime:      body.endTime      || "",
      lessonNum:    body.lessonNum    || 1,
      logoBase64:   body.logoBase64   || null,
      topic:        dbContent.topicName,
      subTopic:     dbContent.subtopicName,
    };

    /* ── 4. AI enhancement using DB content ── */
    const aiContent = await enhanceWithAI(lessonParams, dbContent);

    /* ── 5. Build final plan ── */
    const fullPlan = { ...lessonParams, ...aiContent };

    /* ── 6. Generate DOCX ── */
    const docBuffer = await generateLessonPlanDocx(fullPlan);

    /* ── 7. Send response ── */
    if (aiContent.topic || dbContent.topicName) {
      res.setHeader("X-Lesson-Topic",
        encodeURIComponent((aiContent.subTopic || dbContent.subtopicName).substring(0, 100)));
      res.setHeader("Access-Control-Expose-Headers", "X-Lesson-Topic");
    }

    const safeFileName = (dbContent.subtopicName || "lesson")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 40);

    res.setHeader("Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition",
      `attachment; filename="L${body.lessonNum}_${safeFileName}.docx"`);
    res.send(docBuffer);

  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: "Failed to generate lesson plan", detail: err.message });
  }
});

module.exports = router;