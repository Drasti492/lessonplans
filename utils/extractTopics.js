/* ================================================================
   extractTopics.js
   Extracts ONLY the requested week + lesson from weekly scheme
================================================================ */

function extractLessonContext(text, week, lessonNum) {
  if (!text) return "";

  const clean = text.replace(/\r/g, "");

  const lines = clean.split("\n");

  let currentWeek = "";
  let currentLesson = "";

  let collected = [];

  for (let line of lines) {
    const trimmed = line.trim();

    if (!trimmed) continue;

    const wkMatch = trimmed.match(/^(\d+)\s+/);

    if (wkMatch) {
      currentWeek = wkMatch[1];

      const rest = trimmed.replace(/^(\d+)\s+/, "");

      const lesMatch = rest.match(/^(\d+)/);

      if (lesMatch) {
        currentLesson = lesMatch[1];
      }
    } else {
      const lessonMatch = trimmed.match(/^(\d+)\s+/);

      if (lessonMatch) {
        currentLesson = lessonMatch[1];
      }
    }

    if (
      String(currentWeek) === String(week) &&
      String(currentLesson) === String(lessonNum)
    ) {
      collected.push(trimmed);
    }
  }

  return collected.join("\n");
}

module.exports = { extractLessonContext };