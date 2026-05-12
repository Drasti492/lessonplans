function extractLessonContext(text, targetWeek, targetLesson) {
  if (!text) return "";

  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  let currentWeek = null;
  let currentLesson = null;

  let collecting = false;
  let lessonLines = [];

  for (const line of lines) {

    /*
      MATCHES:
      7 1 Topic
    */
    const weekLessonMatch = line.match(/^(\d+)\s+(\d+)\s+/);

    /*
      MATCHES:
      2 Topic
    */
    const lessonOnlyMatch = line.match(/^(\d+)\s+/);

    if (weekLessonMatch) {

      currentWeek = weekLessonMatch[1];
      currentLesson = weekLessonMatch[2];

    } else if (lessonOnlyMatch && currentWeek) {

      currentLesson = lessonOnlyMatch[1];
    }

    collecting =
      String(currentWeek) === String(targetWeek) &&
      String(currentLesson) === String(targetLesson);

    if (collecting) {
      lessonLines.push(line);
    }
  }

  return lessonLines.join("\n");
}

module.exports = { extractLessonContext };