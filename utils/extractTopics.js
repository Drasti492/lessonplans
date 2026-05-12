/* ================================================================
   extractTopics.js — EduPlan  v4
   ----------------------------------------------------------------
   Parses a pasted/uploaded scheme of work (tab-separated, as
   exported from Word/Excel) into structured lesson objects.

   STANDARD KENYAN SCHEME COLUMNS (0-based):
   0: Wk   1: Les   2: Topic   3: Objectives   4: Life Approach
   5: Activities   6: Methods   7: Resources   8: Assessment   9: Remarks

   KEY FIXES vs v3:
   - A genuine new lesson row MUST have a numeric Les in col1
   - Week is carried forward when blank (lessons 2,3 in same week)
   - Resource/method continuation lines with no lesson number
     are appended to the PREVIOUS lesson, NOT treated as new rows
   - 3-strategy matching handles sequential frontend counters
================================================================ */

function isNumeric(s) {
  return /^\d+$/.test((s || "").trim());
}

function splitLine(line) {
  // Prefer tabs; fall back to 3+ spaces (avoids splitting mid-sentence)
  if (line.includes("\t")) return line.split("\t").map((c) => c.trim());
  return line.split(/   +/).map((c) => c.trim());
}

function isHeader(cols) {
  const f = (cols[0] || "").toLowerCase().trim();
  const s = (cols[1] || "").toLowerCase().trim();
  return (
    /^(wk|week)$/.test(f) ||
    /^(wk|week)$/.test(s) ||
    /^les(son)?$/.test(s) ||
    (f === "" && /^les(son)?$/.test(s))
  );
}

function append(existing, extra) {
  const e = (extra || "").trim();
  if (!e) return existing || "";
  if (!existing) return e;
  return existing + " " + e;
}

function appendCol(obj, field, cols, idx) {
  if (cols[idx] && cols[idx].trim()) {
    obj[field] = append(obj[field], cols[idx]);
  }
}

function cleanLesson(l) {
  Object.keys(l).forEach((k) => {
    if (typeof l[k] === "string") l[k] = l[k].replace(/\s+/g, " ").trim();
  });
}

/* ── Main parser ─────────────────────────────────────────── */
function parseScheme(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd());

  const lessons = [];
  let current = null;
  let lastWeek = null;

  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = splitLine(line);
    if (isHeader(cols)) continue;

    const col0 = (cols[0] || "").trim();
    const col1 = (cols[1] || "").trim();

    const weekVal   = isNumeric(col0) ? parseInt(col0) : null;
    const lessonVal = isNumeric(col1) ? parseInt(col1) : null;

    if (lessonVal !== null) {
      // ── New lesson row ─────────────────────────────────────
      if (current) { cleanLesson(current); lessons.push(current); }
      if (weekVal !== null) lastWeek = weekVal;

      current = {
        week:         lastWeek || 0,
        lesson:       lessonVal,
        topic:        (cols[2] || "").trim(),
        objectives:   (cols[3] || "").trim(),
        lifeApproach: (cols[4] || "").trim(),
        activities:   (cols[5] || "").trim(),
        methods:      (cols[6] || "").trim(),
        resources:    (cols[7] || "").trim(),
        assessment:   (cols[8] || "").trim(),
        remarks:      (cols[9] || "").trim(),
      };

    } else if (current !== null) {
      // ── Continuation line ──────────────────────────────────
      if (cols.length >= 4) {
        // Tab structure preserved — append positionally
        appendCol(current, "topic",        cols, 2);
        appendCol(current, "objectives",   cols, 3);
        appendCol(current, "lifeApproach", cols, 4);
        appendCol(current, "activities",   cols, 5);
        appendCol(current, "methods",      cols, 6);
        appendCol(current, "resources",    cols, 7);
        appendCol(current, "assessment",   cols, 8);
        appendCol(current, "remarks",      cols, 9);
      } else {
        // Unstructured continuation — route by keyword
        const text = cols.filter(Boolean).join(" ").trim();
        if (!text) continue;

        if (/by the end|learners will|able to|should be able/i.test(text)) {
          current.objectives = append(current.objectives, text);
        } else if (/^\d+\.|discuss|explain|demonstrate|show|draw|Q&A|use atlas|mark|sketch/i.test(text)) {
          current.activities = append(current.activities, text);
        } else if (/KLB|textbook|blackboard|whiteboard|chart|atlas|lesson note|book \d|pp\./i.test(text)) {
          current.resources = append(current.resources, text);
        } else if (/quiz|oral|short quiz|describe|list|sketch|write|mark.*map|exercise/i.test(text)) {
          current.assessment = append(current.assessment, text);
        } else if (/lecture|instruction|demonstration|collaborative|discussion|map work|questioning/i.test(text)) {
          current.methods = append(current.methods, text);
        } else if (/awareness|approach|impact|value|appreciation|safety/i.test(text)) {
          current.lifeApproach = append(current.lifeApproach, text);
        } else {
          current.topic = append(current.topic, text);
        }
      }
    }
  }

  if (current) { cleanLesson(current); lessons.push(current); }
  return lessons;
}

/* ═══════════════════════════════════════════════════════════
   PUBLIC: extractLessonContext
   -------------------------------------------------------
   The frontend sends `lessonNum` as a SEQUENTIAL counter
   (1,2,3,4,5,6...) across ALL weeks.  The scheme stores
   PER-WEEK lesson numbers (W3 L1, W3 L2, W3 L3).

   We resolve this with 3 strategies:
   1. Exact match: week===targetWeek AND lesson===targetLes
   2. Offset match: subtract lessons from prior weeks to get
      the per-week index, then find it in this week's lessons
   3. Positional fallback: return the correct Nth lesson of
      that week by position in the parsed array
═══════════════════════════════════════════════════════════ */
function extractLessonContext(schemeText, week, lessonNum) {
  const lessons = parseScheme(schemeText);
  const targetWeek = parseInt(week)      || 1;
  const targetLes  = parseInt(lessonNum) || 1;

  console.log(
    "\nParsed lessons:",
    lessons.map((l) => `W${l.week}L${l.lesson} — ${l.topic.substring(0, 50)}`)
  );

  // ── Strategy 1: exact match ────────────────────────────────
  let match = lessons.find(
    (l) => l.week === targetWeek && l.lesson === targetLes
  );
  if (match) {
    console.log(`✅ Exact match: W${match.week}L${match.lesson} "${match.topic}"`);
    return formatContext(match);
  }

  // ── Strategy 2: sequential → per-week offset ──────────────
  // Count how many lessons appear in weeks BEFORE targetWeek
  const priorCount = lessons.filter((l) => l.week < targetWeek).length;
  const indexInWeek = targetLes - priorCount; // 1-based within this week

  const weekLessons = lessons.filter((l) => l.week === targetWeek);
  if (indexInWeek >= 1 && indexInWeek <= weekLessons.length) {
    match = weekLessons[indexInWeek - 1];
    console.log(
      `✅ Offset match: sequential #${targetLes} → W${targetWeek} position #${indexInWeek} → "${match.topic}"`
    );
    return formatContext(match);
  }

  // ── Strategy 3: positional — Nth lesson of this week ──────
  // Use (targetLes - 1) mod weekLessons.length as last resort
  if (weekLessons.length > 0) {
    const pos = ((targetLes - 1) % weekLessons.length);
    match = weekLessons[pos];
    console.warn(
      `⚠️  Positional fallback: W${targetWeek} L${targetLes} → using position ${pos + 1} "${match.topic}"`
    );
    return formatContext(match);
  }

  console.error(
    `❌ No lessons found for W${targetWeek}. Available weeks:`,
    [...new Set(lessons.map((l) => l.week))]
  );
  return null;
}

function formatContext(m) {
  return [
    `WEEK: ${m.week}`,
    `LESSON: ${m.lesson}`,
    `TOPIC: ${m.topic}`,
    `OBJECTIVES: ${m.objectives}`,
    `LIFE APPROACH / VALUE: ${m.lifeApproach || "Not specified"}`,
    `TEACHING/LEARNING ACTIVITIES: ${m.activities || "Not specified"}`,
    `METHODS/STRATEGY: ${m.methods || "Not specified"}`,
    `RESOURCES/REFERENCES: ${m.resources || "Not specified"}`,
    `ASSESSMENT TASK: ${m.assessment || "Not specified"}`,
  ].join("\n");
}

function getAllLessons(schemeText) {
  return parseScheme(schemeText);
}

module.exports = { extractLessonContext, getAllLessons, parseScheme };