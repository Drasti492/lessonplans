/* ================================================================
   extractTopics.js — EduPlan
   Parses a pasted scheme of work (tab-separated or space-aligned)
   and extracts the row matching a given week + lesson number.

   Scheme column order (standard Kenyan format):
   Wk | Les | Topic/Content | Objectives | Life Approach |
   Activities | Methods | Resources | Assessment | Remarks

   The function returns a rich structured object AND a formatted
   string block that the AI prompt can consume directly.
================================================================ */

/**
 * Normalise a raw scheme text line into tab-separated tokens.
 * Handles both \t and multiple-space separators.
 */
function tokeniseLine(line) {
  // If the line has tabs, use them directly
  if (line.includes("\t")) {
    return line.split("\t").map((t) => t.trim());
  }
  // Otherwise collapse 2+ spaces into a single delimiter
  return line.split(/  +/).map((t) => t.trim());
}

/**
 * Parse the full scheme text into an array of lesson objects.
 * Handles multi-line cells by carrying forward the last seen
 * week and lesson numbers.
 */
function parseScheme(schemeText) {
  if (!schemeText || !schemeText.trim()) return [];

  const rawLines = schemeText
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  const lessons = [];
  let currentLesson = null;
  let lastWeek = null;
  let lastLes = null;

  // Column indices — may shift slightly; we detect by header row
  const COLS = {
    wk: 0,
    les: 1,
    topic: 2,
    objectives: 3,
    lifeApproach: 4,
    activities: 5,
    methods: 6,
    resources: 7,
    assessment: 8,
    remarks: 9,
  };

  // Skip header rows
  const isHeader = (tokens) =>
    /^(wk|week|les|lesson|topic|content)/i.test(tokens[0]) ||
    /^(wk|week|les|lesson|topic|content)/i.test(tokens[1]);

  for (const line of rawLines) {
    const tokens = tokeniseLine(line);
    if (tokens.length < 2) continue;
    if (isHeader(tokens)) continue;

    const rawWk  = tokens[COLS.wk]  || "";
    const rawLes = tokens[COLS.les] || "";

    const wkNum  = parseInt(rawWk);
    const lesNum = parseInt(rawLes);

    const hasNewWeek   = !isNaN(wkNum)  && wkNum > 0;
    const hasNewLesson = !isNaN(lesNum) && lesNum > 0;

    if (hasNewWeek)   lastWeek = wkNum;
    if (hasNewLesson) lastLes  = lesNum;

    // A genuine new lesson row has at least a lesson number
    // OR a topic in the topic column
    const hasTopic = (tokens[COLS.topic] || "").trim().length > 0;

    if ((hasNewLesson || hasNewWeek) && hasTopic) {
      // Save previous lesson if exists
      if (currentLesson) lessons.push(currentLesson);

      currentLesson = {
        week:        lastWeek  || 0,
        lesson:      lastLes   || 0,
        topic:       tokens[COLS.topic]       || "",
        objectives:  tokens[COLS.objectives]  || "",
        lifeApproach:tokens[COLS.lifeApproach]|| "",
        activities:  tokens[COLS.activities]  || "",
        methods:     tokens[COLS.methods]     || "",
        resources:   tokens[COLS.resources]   || "",
        assessment:  tokens[COLS.assessment]  || "",
        remarks:     tokens[COLS.remarks]     || "",
      };

    } else if (currentLesson) {
      // Continuation line — append non-empty tokens to existing fields
      // Tokens at known column positions get appended to the right field
      const appendTo = (field, idx) => {
        const extra = (tokens[idx] || "").trim();
        if (extra && extra !== "-") {
          currentLesson[field] = currentLesson[field]
            ? currentLesson[field] + " " + extra
            : extra;
        }
      };

      // Append all columns that might have continuation content
      for (let i = 2; i < tokens.length; i++) {
        const extra = (tokens[i] || "").trim();
        if (!extra || extra === "-") continue;

        // Heuristic: assign based on column position
        if (i === COLS.topic)        currentLesson.topic        += " " + extra;
        else if (i === COLS.objectives)   currentLesson.objectives   += " " + extra;
        else if (i === COLS.lifeApproach) currentLesson.lifeApproach += " " + extra;
        else if (i === COLS.activities)   currentLesson.activities   += " " + extra;
        else if (i === COLS.methods)      currentLesson.methods      += " " + extra;
        else if (i === COLS.resources)    currentLesson.resources    += " " + extra;
        else if (i === COLS.assessment)   currentLesson.assessment   += " " + extra;
        else {
          // Fallback: append to objectives or activities based on content
          if (/learner|student|able to|should/i.test(extra)) {
            currentLesson.objectives += " " + extra;
          } else if (/\d\.|discuss|explain|show|draw|Q&A/i.test(extra)) {
            currentLesson.activities += " " + extra;
          } else if (/KLB|book|chart|text|board|atlas/i.test(extra)) {
            currentLesson.resources += " " + extra;
          } else if (/quiz|oral|describe|list|sketch|write/i.test(extra)) {
            currentLesson.assessment += " " + extra;
          }
        }
      }
    }
  }

  // Push last lesson
  if (currentLesson) lessons.push(currentLesson);

  // Clean up all string fields
  lessons.forEach((l) => {
    Object.keys(l).forEach((k) => {
      if (typeof l[k] === "string") {
        l[k] = l[k].replace(/\s+/g, " ").trim();
      }
    });
  });

  return lessons;
}

/**
 * Find a specific lesson and return it as a formatted context string
 * for the AI prompt. Returns null if not found.
 *
 * @param {string} schemeText  - raw pasted scheme content
 * @param {number|string} week - target week number
 * @param {number|string} les  - target lesson number
 * @returns {string|null}
 */
function extractLessonContext(schemeText, week, les) {
  const lessons = parseScheme(schemeText);

  const targetWeek = parseInt(week);
  const targetLes  = parseInt(les);

  const match = lessons.find(
    (l) => l.week === targetWeek && l.lesson === targetLes
  );

  if (!match) {
    // Debug: log what was parsed so we can see what weeks/lessons exist
    console.log(
      "Parsed lessons:",
      lessons.map((l) => `W${l.week}L${l.lesson} — ${l.topic}`)
    );
    return null;
  }

  // Return a clean, readable context block for the AI
  return [
    `WEEK: ${match.week}`,
    `LESSON: ${match.lesson}`,
    `TOPIC: ${match.topic}`,
    `OBJECTIVES: ${match.objectives}`,
    `LIFE APPROACH / VALUE: ${match.lifeApproach}`,
    `TEACHING/LEARNING ACTIVITIES: ${match.activities}`,
    `METHODS/STRATEGY: ${match.methods}`,
    `RESOURCES/REFERENCES: ${match.resources}`,
    `ASSESSMENT: ${match.assessment}`,
    match.remarks ? `REMARKS: ${match.remarks}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Returns ALL parsed lessons (useful for debugging or summary views).
 */
function getAllLessons(schemeText) {
  return parseScheme(schemeText);
}

module.exports = { extractLessonContext, getAllLessons, parseScheme };