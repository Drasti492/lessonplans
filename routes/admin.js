const express  = require("express");
const router   = express.Router();
const Subject  = require("../models/Subject");
const Topic    = require("../models/Topic");
const Subtopic = require("../models/Subtopic");

/* GET /api/admin/stats — dashboard counts for sidebar */
router.get("/stats", async (_req, res) => {
  try {
    const [subjects, topics, subtopics] = await Promise.all([
      Subject.countDocuments({ active: true }),
      Topic.countDocuments({ active: true }),
      Subtopic.countDocuments({ active: true }),
    ]);
    res.json({ subjects, topics, subtopics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* POST /api/admin/seed — run seed from HTTP (protect in production) */
router.post("/seed", async (_req, res) => {
  try {
    const { runSeed } = require("../seed/seedData");
    await runSeed();
    res.json({ message: "Seed completed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* DELETE /api/admin/clear — wipe all curriculum data (dev only) */
router.delete("/clear", async (_req, res) => {
  try {
    await Promise.all([Subject.deleteMany(), Topic.deleteMany(), Subtopic.deleteMany()]);
    res.json({ message: "All curriculum data cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;