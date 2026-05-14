/**
 * extractTopics.js — Production-grade Kenyan scheme-of-work parser (IMPROVED)
 *
 * Fixes:
 * - Better DOCX/Excel paste handling
 * - Safer continuation detection
 * - Stronger header detection
 * - Flexible column mapping
 * - More stable lesson reconstruction
 */

// ─────────────────────────────────────────────
// 1. CLEANING HELPERS
// ─────────────────────────────────────────────

function cleanText(t) {
  return (t || "")
    .replace(/\r/g, "")
    .replace(/\u00A0/g, " ") // non-breaking spaces from Word
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isInt(s) {
  return /^\d+$/.test((s || "").toString().trim());
}

function safeCell(cells, i) {
  return (cells && cells[i] !== undefined && cells[i] !== null)
    ? cells[i].toString().trim()
    : "";
}

// ─────────────────────────────────────────────
// 2. ROW SPLITTING (ROBUST)
// ─────────────────────────────────────────────

function splitIntoTabRows(rawText) {
  if (!rawText) return [];

  const normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");

  const lines = normalized.split("\n");

  const rows = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // split on tabs OR multiple spaces (DOCX fix)
    const cells = trimmed
      .split(/\t| {2,}/)
      .map(c => cleanText(c));

    rows.push({
      cells,
      raw: line
    });
  }

  return rows;
}

// ─────────────────────────────────────────────
// 3. DETECTION
// ─────────────────────────────────────────────

function detectLessonStart(cells) {
  const nonEmpty = cells
    .map((v, i) => ({ v: cleanText(v), i }))
    .filter(x => x.v !== "");

  if (nonEmpty.length < 2) return null;

  const a = nonEmpty[0];
  const b = nonEmpty[1];

  if (isInt(a.v) && isInt(b.v)) {
    return {
      week: parseInt(a.v),
      lesson: parseInt(b.v),
      weekIdx: a.i,
      lessonIdx: b.i
    };
  }

  return null;
}

// FIXED SAFE VERSION
function detectWeekOnly(cells) {
  const c0 = safeCell(cells, 0);
  const c1 = safeCell(cells, 1);

  if (isInt(c0) && !isInt(c1)) {
    return parseInt(c0);
  }

  return null;
}

function isHeaderRow(cells) {
  const text = cells.join(" ").toLowerCase();

  const keywords = [
    "wk", "week", "lesson", "topic",
    "objective", "life", "approach",
    "activity", "method", "resource",
    "assessment", "remark"
  ];

  const hits = keywords.filter(k => text.includes(k)).length;

  return hits >= 3; // stricter = fewer false positives
}

// ─────────────────────────────────────────────
// 4. COLUMN MAP
// ─────────────────────────────────────────────

function buildColumnMap(headerCells) {
  const map = {};

  const patterns = [
    { field: "week", re: /^(wk|week)/i },
    { field: "lesson", re: /^(les|lesson)/i },
    { field: "topic", re: /topic/i },
    { field: "objectives", re: /obj|outcome/i },
    { field: "lifeApproach", re: /life|approach/i },
    { field: "activities", re: /activ/i },
    { field: "methods", re: /meth/i },
    { field: "resources", re: /resour/i },
    { field: "assessment", re: /assess/i },
    { field: "remarks", re: /remark/i }
  ];

  if (headerCells?.length) {
    headerCells.forEach((cell, idx) => {
      const text = cleanText(cell);
      const match = patterns.find(p => p.re.test(text));
      if (match) map[idx] = match.field;
    });
  }

  if (Object.keys(map).length < 3) {
    return {
      0: "week",
      1: "lesson",
      2: "topic",
      3: "objectives",
      4: "lifeApproach",
      5: "activities",
      6: "methods",
      7: "resources",
      8: "assessment",
      9: "remarks"
    };
  }

  return map;
}

// ─────────────────────────────────────────────
// 5. LESSON STRUCTURE
// ─────────────────────────────────────────────

function emptyLesson() {
  return {
    week: 0,
    lesson: 0,
    topic: "",
    objectives: "",
    lifeApproach: "",
    activities: "",
    methods: "",
    resources: "",
    assessment: "",
    remarks: ""
  };
}

function applyCells(record, cells, colMap) {
  cells.forEach((cell, idx) => {
    const field = colMap[idx];
    const cleaned = cleanText(cell);

    if (!field || !cleaned) return;
    if (field === "week" || field === "lesson") return;

    if (record[field]) {
      record[field] += " | " + cleaned; // safer merge
    } else {
      record[field] = cleaned;
    }
  });
}

// ─────────────────────────────────────────────
// 6. MAIN PARSER
// ─────────────────────────────────────────────

function parseScheme(rawText) {
  if (!rawText?.trim()) return [];

  const rows = splitIntoTabRows(rawText);
  if (!rows.length) return [];

  let colMap = null;
  let headerIndex = -1;

  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    if (isHeaderRow(rows[i].cells)) {
      colMap = buildColumnMap(rows[i].cells);
      headerIndex = i;
      break;
    }
  }

  if (!colMap) colMap = buildColumnMap(null);

  const lessons = [];
  let current = null;

  for (let i = 0; i < rows.length; i++) {
    if (i === headerIndex) continue;

    const cells = rows[i].cells;

    if (isHeaderRow(cells)) continue;

    const start = detectLessonStart(cells);

    if (start) {
      if (current?.week && current?.lesson) {
        lessons.push(current);
      }

      current = emptyLesson();
      current.week = start.week;
      current.lesson = start.lesson;

      const clone = [...cells];
      clone[start.weekIdx] = "";
      clone[start.lessonIdx] = "";

      applyCells(current, clone, colMap);
      continue;
    }

    if (!current) continue;

    const weekOnly = detectWeekOnly(cells);
    if (weekOnly) {
      current.week = weekOnly;
      continue;
    }

    applyCells(current, cells, colMap);
  }

  if (current?.week && current?.lesson) {
    lessons.push(current);
  }

  return lessons;
}

// ─────────────────────────────────────────────
// 7. CONTEXT EXTRACTOR
// ─────────────────────────────────────────────

function extractLessonContext(schemeText, week, lessonNum) {
  const lessons = parseScheme(schemeText);

  const w = parseInt(week);
  const l = parseInt(lessonNum);

  const match = lessons.find(x => x.week === w && x.lesson === l);
  if (!match) return null;

  return `
WEEK: ${match.week}
LESSON: ${match.lesson}
TOPIC: ${match.topic}
OBJECTIVES: ${match.objectives}
LIFE APPROACH: ${match.lifeApproach}
ACTIVITIES: ${match.activities}
METHODS: ${match.methods}
RESOURCES: ${match.resources}
ASSESSMENT: ${match.assessment}
${match.remarks ? "REMARKS: " + match.remarks : ""}
`.trim();
}

// ─────────────────────────────────────────────
// 8. DEBUG
// ─────────────────────────────────────────────

function debugPrint(lessons) {
  console.log("Parsed Lessons:", lessons.length);

  lessons.forEach((l, i) => {
    console.log(`\n${i + 1}. W${l.week} L${l.lesson}`);
    console.log(l.topic);
  });
}

module.exports = { parseScheme, extractLessonContext, debugPrint };