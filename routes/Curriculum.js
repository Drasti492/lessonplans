const express  = require("express");
const router   = express.Router();
const Subject  = require("../models/Subject");
const Topic    = require("../models/Topic");
const Subtopic = require("../models/Subtopic");

/* GET /api/curriculum/subjects
   Returns all active subjects with their supported forms */
router.get("/subjects", async (_req, res) => {
  try {
    const subjects = await Subject.find({ active: true }).sort({ name: 1 });
    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET /api/curriculum/topics?subjectId=&form=
   Returns topics for a subject + form combination */
router.get("/topics", async (req, res) => {
  try {
    const { subjectId, form } = req.query;
    if (!subjectId || !form) return res.status(400).json({ error: "subjectId and form required" });

    const topics = await Topic.find({ subjectId, form, active: true }).sort({ order: 1 });
    res.json({ topics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET /api/curriculum/subtopics?topicId=
   Returns subtopics (with full lesson content) for a topic */
router.get("/subtopics", async (req, res) => {
  try {
    const { topicId } = req.query;
    if (!topicId) return res.status(400).json({ error: "topicId required" });

    const subtopics = await Subtopic.find({ topicId, active: true }).sort({ order: 1 });
    res.json({ subtopics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* GET /api/curriculum/subtopic/:id
   Returns a single subtopic with full content */
router.get("/subtopic/:id", async (req, res) => {
  try {
    const sub = await Subtopic.findById(req.params.id).populate({
      path: "topicId",
      populate: { path: "subjectId" },
    });
    if (!sub) return res.status(404).json({ error: "Subtopic not found" });
    res.json({ subtopic: sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;