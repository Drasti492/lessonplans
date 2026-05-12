/* ================================================================
   aiGenerator.js — EduPlan  v4
   ----------------------------------------------------------------
   FIXES vs v3:
   ✔ gemini-2.0-flash (correct model)
   ✔ Rate-limit retry with exponential back-off (handles 429)
   ✔ Prompt is SCHEME-FIRST — every word comes from the scheme row
   ✔ Banned generic phrases listed explicitly in prompt
   ✔ Subject-sensitive language bank
   ✔ Strategy rotation so every lesson feels different
   ✔ Topic/sub-topic come from the SCHEME, not from user row inputs
     (user row inputs are used as hints only)
================================================================ */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { extractLessonContext } = require("../utils/extractTopics");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ── Rate-limit retry wrapper ────────────────────────────────── */
async function callWithRetry(model, prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (err) {
      const is429 = err.message && (
        err.message.includes("429") ||
        err.message.includes("Too Many Requests") ||
        err.message.includes("quota")
      );
      if (is429 && attempt < maxRetries) {
        // Extract retry-after seconds from error message if available
        const retryMatch = err.message.match(/retryDelay['":\s]+(\d+)/);
        const waitSec = retryMatch ? parseInt(retryMatch[1]) : (attempt * 15);
        console.warn(`⏳ Rate limit hit. Waiting ${waitSec}s before retry ${attempt}/${maxRetries}...`);
        await new Promise((r) => setTimeout(r, waitSec * 1000));
      } else {
        throw err;
      }
    }
  }
}

/* ── Subject-specific language hints ────────────────────────── */
function subjectHint(subject) {
  const s = (subject || "").toLowerCase();
  if (/math|maths|mathematics/.test(s))
    return "SUBJECT IS MATHEMATICS. Use: solve, calculate, derive, substitute, prove, apply formula, work out, verify. Teacher activities must include worked examples on the board with step-by-step solutions. Learner tasks must involve solving numerical or algebraic problems. Assessment must be a calculation task.";
  if (/geog/.test(s))
    return "SUBJECT IS GEOGRAPHY. Use: describe, locate, identify, explain distribution, interpret, sketch, label, mark on map, compare. Teacher activities must include map work, diagram drawing, or local/global examples. Assessment must include a labelled sketch, map task, or written explanation.";
  if (/bio/.test(s))
    return "SUBJECT IS BIOLOGY. Use: classify, observe, identify, describe, explain the function of, label, dissect. Teacher activities must involve classification exercises, observation, or specimen examination. Assessment must include labelling a diagram or listing characteristics.";
  if (/chem/.test(s))
    return "SUBJECT IS CHEMISTRY. Use: react, identify, state, write the equation, balance, describe the test, observe. Teacher activities must include experiment descriptions or equation writing. Assessment must involve naming products or describing a test result.";
  if (/phys/.test(s))
    return "SUBJECT IS PHYSICS. Use: state, define, calculate, apply the formula, measure, describe, derive. Teacher activities must include formula derivation and worked numerical examples. Assessment must involve solving a numerical problem.";
  if (/hist/.test(s))
    return "SUBJECT IS HISTORY. Use: explain causes, describe effects, analyse, compare, evaluate, state factors. Teacher activities must include source analysis, timelines, and structured discussion. Assessment must be a written explanation or listing of factors.";
  if (/eng|english|lit/.test(s))
    return "SUBJECT IS ENGLISH/LITERATURE. Use: read, identify, discuss, write, analyse, compose, describe. Teacher activities must include reading extracts, oral discussion, and writing tasks. Assessment must include a written or oral production.";
  return "Use precise, subject-appropriate professional language. Vary verbs and activity types across all four stages.";
}

/* ── Strategy rotation bank ──────────────────────────────────── */
const INTRO_HOOKS = [
  "Opens with a real-life scenario or problem directly related to the sub-topic",
  "Displays a diagram/image on the board and asks: 'What do you observe here?'",
  "Poses a prediction question based on the previous lesson's content",
  "Recalls the previous lesson with a quick oral question then bridges to today",
  "Writes a key term on the board and invites learners to share prior knowledge",
];
const STAGE1_METHODS = [
  "Explanation with step-by-step diagram construction on the whiteboard",
  "Guided discovery: poses a leading question and builds the concept from learner responses",
  "Demonstration using charts/models then teacher explanation",
  "Think-Pair-Share: learners discuss in pairs then teacher consolidates",
  "Question-led exposition: builds understanding through a structured question sequence",
];
const STAGE2_METHODS = [
  "Small group analysis task with presentation of findings to class",
  "Peer teaching: pairs explain the concept to each other using their notes",
  "Independent problem-solving on graded examples from the scheme",
  "Collaborative drawing/sketching with immediate teacher feedback",
  "Structured class discussion on significance/impact with teacher facilitation",
];
const CONCLUSION_STYLES = [
  "Written consolidation task with specific scheme-based prompt; homework issued",
  "Oral Q&A recap: teacher poses 3 targeted questions, learners respond individually",
  "Exit activity: learners write one key fact and one question before leaving",
  "Board summary built collaboratively: learners contribute key points one by one",
  "Short quiz (3 items) from scheme's assessment column, marked and discussed immediately",
];

function pick(arr, n) {
  return arr[((parseInt(n) || 1) - 1) % arr.length];
}

/* ════════════════════════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════════════════════════ */
async function generateLessonContent(params, schemeContent = "") {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // ── Duration ─────────────────────────────────────────────
    const isDouble = params.isDouble === true || params.isDouble === "true";
    const duration = isDouble ? 80 : (parseInt(params.duration) || 40);

    // Fixed time breakpoints matching sample lesson plans exactly
    const t0 = 0;
    const t1 = Math.round(duration * 0.125);   //  5 min @ 40,  10 min @ 80
    const t2 = Math.round(duration * 0.50);    // 20 min @ 40,  40 min @ 80
    const t3 = Math.round(duration * 0.875);   // 35 min @ 40,  70 min @ 80
    const t4 = duration;                        // 40 min @ 40,  80 min @ 80

    // ── Extract scheme row ────────────────────────────────────
    const schemeRow = extractLessonContext(
      schemeContent,
      params.week,
      params.lessonNum
    );

    if (!schemeRow) {
      console.warn(`⚠️  No scheme match W${params.week}L${params.lessonNum} — using fallback`);
      return fallback(params, duration, t1, t2, t3, t4);
    }

    console.log(`\n====== SCHEME W${params.week}L${params.lessonNum} ======\n${schemeRow}\n========================\n`);

    // ── Pick varied strategies ────────────────────────────────
    const lesN = parseInt(params.lessonNum) || 1;
    const introHook    = pick(INTRO_HOOKS,      lesN);
    const stage1Method = pick(STAGE1_METHODS,   lesN + 1);
    const stage2Method = pick(STAGE2_METHODS,   lesN + 2);
    const conclusionStyle = pick(CONCLUSION_STYLES, lesN + 3);

    // ── Build prompt ──────────────────────────────────────────
    const prompt = `
You are a highly experienced Kenyan secondary school teacher writing ONE formal lesson plan for a student teacher's teaching practice portfolio.

=================================================================
SCHEME OF WORK FOR THIS LESSON — THIS IS YOUR ONLY SOURCE
=================================================================
${schemeRow}

=================================================================
LESSON HEADER INFORMATION
=================================================================
Student Teacher : ${params.studentName || ""}
School          : ${params.schoolName  || ""}
Subject         : ${params.subject     || ""}
Form / Class    : ${params.form || ""}${params.stream ? " " + params.stream : ""}
No. of Students : ${params.numStudents || ""}
Week            : ${params.week}
Lesson No.      : ${params.lessonNum}
Duration        : ${duration} minutes${isDouble ? " (DOUBLE LESSON)" : ""}
Day             : ${params.day || ""}
Date            : ${params.date || ""}
Time            : ${params.startTime || ""} – ${params.endTime || ""}
Lesson Type     : ${params.lessonType || "Theory"}
Reference Book  : ${params.referenceBook || ""}

=================================================================
SUBJECT LANGUAGE RULES
=================================================================
${subjectHint(params.subject)}

=================================================================
INSTRUCTIONAL STRATEGIES TO USE FOR THIS LESSON
=================================================================
Introduction : ${introHook}
Stage I      : ${stage1Method}
Stage II     : ${stage2Method}
Conclusion   : ${conclusionStyle}

=================================================================
STRICT RULES — FOLLOW EVERY ONE WITHOUT EXCEPTION
=================================================================

RULE 1 — SCHEME IS YOUR BIBLE
Every piece of content must come from the SCHEME row above.
Use the exact TOPIC, OBJECTIVES, ACTIVITIES, METHODS, RESOURCES,
and ASSESSMENT from the scheme. Do not invent anything.

RULE 2 — TOPIC AND SUB-TOPIC
The "topic" field in the scheme IS the lesson topic.
If the scheme topic contains a colon (e.g. "Intrusive Features: Sills, Dykes"),
the part before the colon is the Topic and the part after is the Sub-topic.
If there is no colon, the full topic text is both Topic and Sub-topic.

RULE 3 — ONE-SENTENCE OBJECTIVE
Write a single grammatically complete sentence:
"By the end of the lesson, learners will be able to [verb(s)] [specific content]."
If the scheme has multiple objectives, combine them into one sentence using "and".
Never write a list. Never write two sentences.

RULE 4 — TIME SLOTS ARE FIXED — USE EXACTLY THESE:
"${t0}–${t1} min", "${t1}–${t2} min", "${t2}–${t3} min", "${t3}–${t4} min"

RULE 5 — ABSOLUTELY BANNED PHRASES (never write these):
- "Introduces the lesson through guided questioning"
- "Guides learners through the main concept"
- "Organizes learners into collaborative tasks"
- "Reviews the major ideas covered"
- "Development of core ideas related to the sub-topic"
- "Application activity based on the sub-topic"
- "Core concepts and definitions related to the sub-topic"
- "Linking prior knowledge on the topic to today's sub-topic: the sub-topic"
- "Respond to introductory questions, share prior knowledge"
- "Work collaboratively to complete the assigned activity"
If any of the above appear in your draft, rewrite that sentence entirely.

RULE 6 — SPECIFIC TEACHER ACTIVITIES REQUIRED
Every teacher activity must state:
• The exact question the teacher asks (write it in quotation marks)
• What the teacher writes or draws on the board (be specific)
• What the teacher says during the summary (write key quotes)
• The exact assessment task wording (use the scheme's assessment column)

RULE 7 — SPECIFIC LEARNER ACTIVITIES REQUIRED
Every learner activity must say exactly what learners DO — not "listen and respond".
Use specific verbs: copy, label, sketch, solve, calculate, answer, present, discuss, mark.

RULE 8 — EACH STAGE MUST USE DIFFERENT LANGUAGE
Introduction, Stage I, Stage II, and Conclusion must each have:
- Different teacher actions
- Different learner tasks
- Different sentence patterns
Do NOT repeat the same activity type across stages.

RULE 9 — RESOURCES MUST MATCH SCHEME
Use only the resources listed in the scheme row. Include page numbers if given.

RULE 10 — ASSESSMENT MUST MATCH SCHEME
The conclusion assessment task must use the wording from the scheme's ASSESSMENT TASK field.

RULE 11 — DOMAIN STATEMENTS MUST BE SPECIFIC TO THIS LESSON
Each domain must reference this lesson's actual sub-topic and activities.
Never write "[ST1, ST2, Con]: Learners interpret concepts related to the sub-topic..."
Write the actual sub-topic name and actual activity type.

RULE 12 — SELF-EVALUATION MUST SOUND AUTHENTIC
Write as if the lesson just ended. Reference:
- The specific activity that worked (name it)
- The specific concept learners found difficult (name it)
- A concrete next-lesson step tied to the scheme's next lesson

RULE 13 — JSON ONLY
Return ONLY the raw JSON object.
No markdown fences (no \`\`\`json).
No text before or after the JSON.

=================================================================
JSON STRUCTURE TO RETURN
=================================================================

{
  "objectives": "By the end of the lesson, learners will be able to [exact verb(s) from scheme objectives] [exact content from scheme topic].",

  "introduction": {
    "time": "${t0}–${t1} min",
    "content": "[specific prior-knowledge link to this lesson's topic — name the previous lesson concept]",
    "teacherActivity": "[greets + takes attendance + asks specific review question in quotes + writes topic on board + states objective]",
    "learnerActivity": "[respond to the review question by doing X + copy topic + note objective]",
    "resources": "[from scheme resources field, with page numbers]"
  },

  "stage1": {
    "time": "${t1}–${t2} min",
    "content": "[first core concept from scheme — use exact topic/activity wording]",
    "teacherActivity": "[specific explanation using scheme's method + actual question in quotes + what is drawn/shown]",
    "learnerActivity": "[specific task — must differ from introduction: e.g. copy diagram, solve example, label feature]",
    "resources": "[from scheme, with page numbers]"
  },

  "stage2": {
    "time": "${t2}–${t3} min",
    "content": "[second concept or application from scheme activities column]",
    "teacherActivity": "[different method from Stage I — from scheme's activities + specific prompt in quotes]",
    "learnerActivity": "[different task from Stage I — different verb and activity type]",
    "resources": "[from scheme]"
  },

  "conclusion": {
    "time": "${t3}–${t4} min",
    "content": "[summary of topic key points + exact assessment task from scheme + homework reference]",
    "teacherActivity": "[summarises 2 key points using new vocabulary — write them in quotes + gives exact assessment task from scheme's ASSESSMENT TASK field + previews next lesson + assigns homework with page reference from scheme]",
    "learnerActivity": "[complete the exact assessment task + note homework]",
    "resources": "Whiteboard, Exercise Books, [reference from scheme]"
  },

  "cognitiveDomain": "[ST1, ST2, Con]: Learners [specific verb from Stage I activity] [specific sub-topic content] (ST1); [specific verb from Stage II activity] [specific application] (ST2); [specific verb from assessment task] (Con).",

  "affectiveDomain": "[Intro]: Learners [show curiosity about / appreciate / develop awareness of] [specific aspect from scheme's LIFE APPROACH field] (Intro).",

  "interactiveSkills": "[Intro, ST2]: Learners [specific interaction from introduction — e.g. respond to teacher's question on X] (Intro); [specific interaction from Stage II — e.g. collaborate in pairs to sketch Y] (ST2).",

  "psychomotorDomain": "[Con]: Learners [draw / write / label / sketch / solve / mark] [specific product from the assessment task] in their exercise books (Con).",

  "selfEvaluation": "Strengths: [specific activity name that worked + concrete reason it worked for this sub-topic]. Areas for Improvement: [specific concept or skill from this lesson that caused difficulty]. Action Plan: [concrete measurable next-lesson step tied to the scheme's next lesson or assessment]."
}
`;

    // ── Call Gemini with retry ────────────────────────────────
    const result = await callWithRetry(model, prompt);
    let text = result.response.text().trim();

    // Strip any accidental markdown fences
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i,     "")
      .replace(/```\s*$/,      "")
      .trim();

    return JSON.parse(text);

  } catch (err) {
    console.error("AI generation error:", err.message);
    const isDouble = params.isDouble === true || params.isDouble === "true";
    const duration = isDouble ? 80 : (parseInt(params.duration) || 40);
    const t1 = Math.round(duration * 0.125);
    const t2 = Math.round(duration * 0.50);
    const t3 = Math.round(duration * 0.875);
    return fallback(params, duration, t1, t2, t3, duration);
  }
}

/* ════════════════════════════════════════════════════════════
   FALLBACK — only when Gemini is genuinely unreachable
   Uses whatever topic/subtopic/resources the parser found.
════════════════════════════════════════════════════════════ */
function fallback(params, duration, t1, t2, t3, t4) {
  // Try to get real topic/subtopic from scheme if possible
  const topic    = params.topic    || params.schemeTopic    || "the topic";
  const subTopic = params.subTopic || params.schemeSubTopic || "the sub-topic";
  const ref      = params.referenceBook || "KLB Textbook";

  return {
    objectives: `By the end of the lesson, learners will be able to describe and explain the key characteristics of ${subTopic} with relevant examples.`,

    introduction: {
      time: `${0}–${t1} min`,
      content: `Prior knowledge review on ${topic}; introduction of ${subTopic}.`,
      teacherActivity: `Greets learners and marks the register. Asks: "What do you recall from our previous lesson on ${topic}?" Writes '${subTopic}' on the board. States today's objective.`,
      learnerActivity: `Respond to the review question, copy the sub-topic from the board, and note the lesson objective.`,
      resources: `${ref}, Whiteboard, Chalk`,
    },
    stage1: {
      time: `${t1}–${t2} min`,
      content: `Definition, types, and key characteristics of ${subTopic}.`,
      teacherActivity: `Explains the definition and main characteristics of ${subTopic} using the whiteboard. Draws and labels a diagram. Asks: "What is the key feature that defines ${subTopic}?"`,
      learnerActivity: `Copy the definition and labelled diagram. Answer the teacher's question individually.`,
      resources: `${ref}, Whiteboard, Charts, Coloured Chalk`,
    },
    stage2: {
      time: `${t2}–${t3} min`,
      content: `Examples, applications, and significance of ${subTopic}.`,
      teacherActivity: `Organises learners into groups of four. Each group analyses an example of ${subTopic} and its significance. Circulates giving feedback. Asks: "How does ${subTopic} relate to your everyday environment?"`,
      learnerActivity: `Discuss the assigned example in groups, record findings, then one member presents a summary to the class.`,
      resources: `${ref}, Exercise Books, Charts, Lesson Notes`,
    },
    conclusion: {
      time: `${t3}–${t4} min`,
      content: `Summary of ${subTopic} and written assessment.`,
      teacherActivity: `Summarises: "${subTopic} can be defined as... and its key features are..." Gives written task: "In three sentences, describe the significance of ${subTopic}." Previews the next lesson. Assigns homework from ${ref}.`,
      learnerActivity: `Complete the written task in exercise books and record the homework.`,
      resources: `Whiteboard, Exercise Books, ${ref}`,
    },
    cognitiveDomain: `[ST1, ST2, Con]: Learners define and describe ${subTopic} (ST1); analyse examples and their significance through group work (ST2); complete a written consolidation task (Con).`,
    affectiveDomain: `[Intro]: Learners develop curiosity about how ${topic} connects to their local environment and daily experiences (Intro).`,
    interactiveSkills: `[Intro, ST2]: Learners respond to teacher's review question on ${topic} (Intro); collaborate in groups to discuss and present findings on ${subTopic} (ST2).`,
    psychomotorDomain: `[Con]: Learners write a three-sentence description and draw a labelled diagram of ${subTopic} in their exercise books (Con).`,
    selfEvaluation: `Strengths: The group analysis activity generated active participation and learners could identify examples of ${subTopic} from their prior knowledge. Areas for Improvement: Some learners needed additional prompting to link ${subTopic} to real-life examples. Action Plan: Begin the next lesson with a brief visual comparison to reinforce understanding before introducing new scheme content.`,
  };
}

module.exports = { generateLessonContent };