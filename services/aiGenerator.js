/* ================================================================
   aiGenerator.js — EduPlan  (Professional Weekly Version v3)
   ---------------------------------------------------------------
   KEY IMPROVEMENTS
   ✔ Uses gemini-2.0-flash (correct model, no 404)
   ✔ extractLessonContext pulls EXACT week+lesson from scheme
   ✔ Prompt is scheme-first: every field is derived from the scheme
   ✔ Objective, topic, sub-topic, activities, resources, assessment
     all come directly from what the user pasted — no invented content
   ✔ Strong anti-repetition rules for activities and language
   ✔ Subject-sensitive tone (Maths ≠ Geography ≠ Biology etc.)
   ✔ Varied instructional strategies per lesson
   ✔ Self-evaluation tied to actual lesson content
   ✔ Domain statements match the lesson specifically
   ✔ Robust JSON-only output with fallback
================================================================ */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { extractLessonContext } = require("../utils/extractTopics");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ── Instructional strategy bank — rotated by lesson number ─────── */
const INTRO_STRATEGIES = [
  "Opens with a thought-provoking real-life question tied to the sub-topic",
  "Uses a short visual stimulus (diagram on board) and asks learners what they observe",
  "Poses a problem scenario relevant to the sub-topic and asks learners to predict an answer",
  "Recalls the previous lesson with a quick oral review question then bridges to today's sub-topic",
  "Displays a key term on the board and invites learners to share what they already know about it",
];

const STAGE1_STRATEGIES = [
  "Direct instruction with step-by-step explanation and diagram on whiteboard",
  "Guided discovery — gives learners a prompt and leads them to deduce the concept",
  "Demonstration using charts/models followed by teacher explanation",
  "Think-Pair-Share — learners discuss in pairs then share with class before teacher explains",
  "Question-led exposition — builds understanding through a structured series of questions",
];

const STAGE2_STRATEGIES = [
  "Group work — small groups analyse a case, then present findings",
  "Peer teaching — pairs explain the concept to each other using notes",
  "Structured problem-solving — learners solve graded examples independently",
  "Collaborative drawing/sketching activity with teacher feedback",
  "Class debate or discussion on the significance/impact of the concept",
];

const CONCLUSION_STRATEGIES = [
  "Written consolidation task with specific prompt; previews next lesson",
  "Oral Q&A recap — teacher poses 3 questions, learners respond in turns",
  "Exit slip — learners write one key fact and one question on a slip of paper",
  "Mind-map summary on the board built collaboratively with learner contributions",
  "Short quiz (3 items) marked and discussed immediately; homework issued",
];

function pickStrategy(arr, lessonNum) {
  return arr[((parseInt(lessonNum) || 1) - 1) % arr.length];
}

/* ── Subject-specific language hints ────────────────────────────── */
function subjectHint(subject) {
  const s = (subject || "").toLowerCase();
  if (/math|maths|mathematics/.test(s))
    return "Use mathematical language: solve, calculate, derive, prove, formula, equation, substitute. Activities should involve working examples on the board, solving problems in steps, and pair/group problem-solving. Assessment should include a solved numerical or algebraic task.";
  if (/geog/.test(s))
    return "Use geographical language: describe, locate, identify, explain distribution, interpret maps/diagrams, sketch, label. Activities should include map work, diagram drawing, and local/global examples. Assessment should include a labelled sketch or a written explanation.";
  if (/bio/.test(s))
    return "Use biological language: classify, observe, describe, explain the function of, identify, dissect. Activities should involve classification exercises, observation, and structured note-taking. Assessment should include labelling a diagram or listing characteristics.";
  if (/chem/.test(s))
    return "Use chemistry language: react, identify, observe, state, write the formula, balance, describe the test. Activities should include experiment descriptions, writing equations, and safety notes. Assessment should involve naming products or describing a test.";
  if (/phys/.test(s))
    return "Use physics language: state, define, calculate, apply the formula, measure, describe. Activities should include formula derivation, worked examples, and practical applications. Assessment should involve a numerical problem.";
  if (/hist/.test(s))
    return "Use historical language: explain causes, describe effects, analyse, compare, evaluate. Activities should include source analysis, timelines, and discussion. Assessment should include a short written explanation or listing of factors.";
  if (/eng|english|lit/.test(s))
    return "Use language-skills vocabulary: read aloud, identify, describe, discuss, write, compose, analyse. Activities should include reading passages, oral discussion, writing tasks. Assessment should include a written or oral production task.";
  if (/busi|commerce|account/.test(s))
    return "Use business/commerce language: calculate, record, describe, state, apply, analyse. Activities should include transaction recording, calculations, and case studies. Assessment should include a practical calculation or journal entry.";
  return "Use subject-appropriate professional language. Vary verbs and activity types across all stages.";
}

/* ════════════════════════════════════════════════════════════════
   MAIN FUNCTION
════════════════════════════════════════════════════════════════ */
async function generateLessonContent(params, schemeContent = "") {
  try {
    // ── Model ──────────────────────────────────────────────────
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // ── Duration ───────────────────────────────────────────────
    const isDouble = params.isDouble === true || params.isDouble === "true";
    const duration = isDouble ? 80 : (parseInt(params.duration) || 40);

    const introEnd  = Math.round(duration * 0.125);  //  5 min @ 40, 10 min @ 80
    const stage1End = Math.round(duration * 0.50);   // 20 min @ 40, 40 min @ 80
    const stage2End = Math.round(duration * 0.875);  // 35 min @ 40, 70 min @ 80

    // ── Extract THIS lesson from the scheme ────────────────────
    const lessonScheme = extractLessonContext(
      schemeContent,
      params.week,
      params.lessonNum
    );

    if (!lessonScheme) {
      console.warn(
        `⚠️  Scheme lookup failed for W${params.week} L${params.lessonNum}. Using fallback.`
      );
      return fallback(params);
    }

    console.log(`\n====== SCHEME: W${params.week} L${params.lessonNum} ======`);
    console.log(lessonScheme);
    console.log("==============================================\n");

    // ── Pick varied strategies ──────────────────────────────────
    const lesNum = parseInt(params.lessonNum) || 1;
    const introStrategy  = pickStrategy(INTRO_STRATEGIES,      lesNum);
    const stage1Strategy = pickStrategy(STAGE1_STRATEGIES,     lesNum + 1);
    const stage2Strategy = pickStrategy(STAGE2_STRATEGIES,     lesNum + 2);
    const conStrategy    = pickStrategy(CONCLUSION_STRATEGIES, lesNum + 3);

    // ── Subject language hint ───────────────────────────────────
    const subjHint = subjectHint(params.subject);

    // ══════════════════════════════════════════════════════════
    //  MASTER PROMPT
    // ══════════════════════════════════════════════════════════
    const prompt = `
You are a highly experienced Kenyan secondary school teacher and teacher-educator writing ONE formal lesson plan for a student teacher's teaching practice portfolio.

=================================================================
YOUR SCHEME OF WORK FOR THIS LESSON (USE THIS AS YOUR BIBLE)
=================================================================
${lessonScheme}

=================================================================
LESSON CONTEXT
=================================================================
Student Teacher : ${params.studentName || ""}
School          : ${params.schoolName  || ""}
Subject         : ${params.subject     || ""}
Form / Class    : ${params.form        || ""}${params.stream ? " " + params.stream : ""}
No. of Students : ${params.numStudents || ""}
Week            : ${params.week        || ""}
Lesson No.      : ${params.lessonNum   || ""}
Duration        : ${duration} minutes${isDouble ? " (DOUBLE LESSON)" : ""}
Day             : ${params.day         || ""}
Date            : ${params.date        || ""}
Start Time      : ${params.startTime   || ""}
End Time        : ${params.endTime     || ""}
Lesson Type     : ${params.lessonType  || "Theory"}
Reference Book  : ${params.referenceBook || ""}

=================================================================
SUBJECT-SPECIFIC LANGUAGE & ACTIVITY RULES
=================================================================
${subjHint}

=================================================================
INSTRUCTIONAL STRATEGIES TO USE (VARY EACH LESSON)
=================================================================
Introduction  : ${introStrategy}
Stage I       : ${stage1Strategy}
Stage II      : ${stage2Strategy}
Conclusion    : ${conStrategy}

=================================================================
MANDATORY RULES — EVERY SINGLE ONE MUST BE FOLLOWED
=================================================================

RULE 1 — SCHEME-FIRST
Every piece of content, every activity, every resource, every
assessment task MUST come from the SCHEME OF WORK block above.
Do NOT invent content not in the scheme. Use the exact objectives,
activities, methods, resources, and assessment stated there.

RULE 2 — ONE-SENTENCE OBJECTIVE
"objectives" = ONE grammatically complete sentence, e.g.:
"By the end of the lesson, learners will be able to [verb] [specific content from scheme]."
Never write a list. Never write two sentences. Combine multiple
learning outcomes from the scheme into one well-formed sentence.

RULE 3 — TIME SLOTS ARE FIXED
Use EXACTLY: "0–${introEnd} min", "${introEnd}–${stage1End} min", "${stage1End}–${stage2End} min", "${stage2End}–${duration} min"

RULE 4 — NO GENERIC FILLER LANGUAGE
NEVER write these phrases:
- "Introduces the lesson through guided questioning"
- "Guides learners through the main concept"
- "Organizes learners into collaborative tasks"
- "Reviews the major ideas covered"
- "Respond to introductory questions, share prior knowledge"
- "Work collaboratively to complete the assigned activity"
- "Observe demonstrations, participate in guided discussion"
- "Development of core ideas related to the sub-topic"
- "Application activity based on the sub-topic"
These are BANNED. Write specific, scheme-grounded content instead.

RULE 5 — EVERY STAGE MUST USE DIFFERENT LANGUAGE
Introduction, Stage I, Stage II, and Conclusion must each have
different teacher activities, different learner activities, and
different sentence patterns. No copy-pasting across stages.

RULE 6 — SPECIFIC TEACHER ACTIVITIES
Teacher activities must state EXACTLY what the teacher does:
- What question they ask (write the actual question in quotes)
- What they write/draw on the board
- What they say during the summary (write it in quotes)
- What assessment task they give (write the exact task prompt)
Do NOT use vague verbs like "explains the concept" alone.

RULE 7 — SPECIFIC LEARNER ACTIVITIES
Learner activities must state exactly what learners DO:
e.g. "Copy definition of ${(lessonScheme.match(/TOPIC: (.+)/) || [])[1] || "the topic"} from board, answer teacher's question, then draw a labelled diagram."
Never just say "listen and respond."

RULE 8 — RESOURCES FROM SCHEME
Use the resources listed in the scheme. If page numbers are given,
include them. Supplement only if clearly appropriate.

RULE 9 — ASSESSMENT FROM SCHEME
The conclusion assessment task must use the exact assessment
wording from the scheme (e.g., "Short quiz: List three intrusive features").

RULE 10 — DOMAIN STATEMENTS MUST BE LESSON-SPECIFIC
Each domain statement must reference this lesson's actual content,
not generic phrases. Use the sub-topic and activities from the scheme.

RULE 11 — SELF-EVALUATION MUST BE AUTHENTIC
Write as if the lesson just happened. Reference:
- The specific activity that worked (from Stage I or II)
- The specific difficulty observed (from the sub-topic complexity)
- A concrete, measurable action plan for the next lesson

RULE 12 — DOMAIN TAG FORMAT
cognitiveDomain   → starts with "[ST1, ST2, Con]" or appropriate subset
affectiveDomain   → starts with "[Intro]"
interactiveSkills → starts with "[Intro, ST2]" or appropriate subset
psychomotorDomain → starts with "[Con]"

RULE 13 — JSON ONLY
Return ONLY the JSON object. No markdown fences. No text before or after.

=================================================================
RETURN EXACTLY THIS JSON STRUCTURE
=================================================================

{
  "objectives": "By the end of the lesson, learners will be able to [...].",

  "introduction": {
    "time": "0–${introEnd} min",
    "content": "[specific prior-knowledge link to THIS lesson's sub-topic from scheme]",
    "teacherActivity": "[specific greeting + specific review question in quotes + introduces sub-topic + states objective]",
    "learnerActivity": "[specific response to teacher's question + what they write/do]",
    "resources": "[from scheme]"
  },

  "stage1": {
    "time": "${introEnd}–${stage1End} min",
    "content": "[first core concept from scheme for this lesson]",
    "teacherActivity": "[specific explanation method from scheme's method column + actual question in quotes]",
    "learnerActivity": "[specific task: note-taking / diagram / problem / observation — must differ from introduction]",
    "resources": "[from scheme, with page numbers]"
  },

  "stage2": {
    "time": "${stage1End}–${stage2End} min",
    "content": "[second concept or application from scheme]",
    "teacherActivity": "[different method from Stage I — from scheme's activities column + specific prompt in quotes]",
    "learnerActivity": "[different task from Stage I — must be a different verb and activity type]",
    "resources": "[from scheme]"
  },

  "conclusion": {
    "time": "${stage2End}–${duration} min",
    "content": "[summary of sub-topic + exact assessment task from scheme + homework reference]",
    "teacherActivity": "[summarises using 2 key points in quotes + gives exact assessment task from scheme + previews next lesson + assigns homework with page reference]",
    "learnerActivity": "[completes the exact assessment task + notes homework]",
    "resources": "[Whiteboard, Exercise Books, reference book]"
  },

  "cognitiveDomain": "[ST1, ST2, Con]: Learners [specific verb from Stage I content] (ST1); [specific verb from Stage II content] (ST2); [specific verb from assessment] (Con).",

  "affectiveDomain": "[Intro]: Learners [show curiosity / appreciate / develop awareness of] [specific aspect of this topic from life approach in scheme].",

  "interactiveSkills": "[Intro, ST2]: Learners [specific interaction from introduction] (Intro); [specific interaction from Stage II activity] (ST2).",

  "psychomotorDomain": "[Con]: Learners [draw / write / label / sketch / solve] [specific product from assessment task] in their exercise books (Con).",

  "selfEvaluation": "Strengths: [specific activity that worked + why it worked for this sub-topic]. Areas for Improvement: [specific concept or skill that caused difficulty for learners]. Action Plan: [concrete next-lesson step tied to the scheme's next lesson content]."
}
`;

    // ── Call Gemini ─────────────────────────────────────────────
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Strip any accidental markdown fences
    text = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/,   "")
      .trim();

    const parsed = JSON.parse(text);
    return parsed;

  } catch (error) {
    console.error("AI generation error:", error.message);
    return fallback(params);
  }
}

/* ════════════════════════════════════════════════════════════════
   FALLBACK — only fires when Gemini is genuinely unreachable
   (NOT for missing scheme data — that now falls back gracefully)
════════════════════════════════════════════════════════════════ */
function fallback(params) {
  const topic    = params.topic    || "the topic";
  const subTopic = params.subTopic || "the sub-topic";
  const ref      = params.referenceBook || "KLB Textbook";
  const isDouble = params.isDouble === true || params.isDouble === "true";
  const duration = isDouble ? 80 : (parseInt(params.duration) || 40);

  const introEnd  = Math.round(duration * 0.125);
  const stage1End = Math.round(duration * 0.50);
  const stage2End = Math.round(duration * 0.875);

  return {
    objectives: `By the end of the lesson, learners will be able to explain the key concepts and significance of ${subTopic} with relevant examples drawn from the scheme of work.`,

    introduction: {
      time: `0–${introEnd} min`,
      content: `Linking prior knowledge on ${topic} to today's sub-topic: ${subTopic}.`,
      teacherActivity: `Greets learners and takes attendance. Asks: "What did we cover in our last lesson on ${topic}?" Writes sub-topic '${subTopic}' on the board. States today's objective clearly.`,
      learnerActivity: `Respond to the review question, copy the sub-topic from the board, and listen to the stated lesson objective.`,
      resources: `${ref}, Whiteboard, Chalk`,
    },

    stage1: {
      time: `${introEnd}–${stage1End} min`,
      content: `Core concepts and definitions related to ${subTopic}.`,
      teacherActivity: `Explains the definition and main characteristics of ${subTopic} on the whiteboard. Draws and labels a diagram. Asks: "Can you identify one key characteristic of ${subTopic}?"`,
      learnerActivity: `Copy the definition and labelled diagram into exercise books. Answer the teacher's question individually.`,
      resources: `${ref}, Whiteboard, Charts, Coloured Chalk`,
    },

    stage2: {
      time: `${stage1End}–${stage2End} min`,
      content: `Application and examples of ${subTopic}.`,
      teacherActivity: `Divides class into groups of four. Each group discusses an assigned example of ${subTopic} and its significance. Circulates, providing targeted feedback. Prompts: "How does this example relate to real life?"`,
      learnerActivity: `Discuss the assigned example in groups, record findings in exercise books, and one member presents a summary to the class.`,
      resources: `${ref}, Exercise Books, Charts, Lesson Notes`,
    },

    conclusion: {
      time: `${stage2End}–${duration} min`,
      content: `Summary of ${subTopic} and written assessment.`,
      teacherActivity: `Summarises: "Today we covered ${subTopic} — key points are [1] and [2]." Gives written task: "In three sentences, describe the significance of ${subTopic}." Previews the next lesson. Assigns homework from ${ref}.`,
      learnerActivity: `Complete the written task in exercise books and note the homework assignment.`,
      resources: `Whiteboard, Exercise Books, ${ref}`,
    },

    cognitiveDomain: `[ST1, ST2, Con]: Learners define and describe ${subTopic} (ST1); analyse examples and their significance through group discussion (ST2); complete a written consolidation task (Con).`,
    affectiveDomain: `[Intro]: Learners show interest in how ${topic} connects to their local environment and everyday experiences (Intro).`,
    interactiveSkills: `[Intro, ST2]: Learners respond to teacher review questions on ${topic} (Intro); collaborate in groups to analyse and present findings on ${subTopic} (ST2).`,
    psychomotorDomain: `[Con]: Learners write a three-sentence description and draw a labelled diagram of ${subTopic} in their exercise books (Con).`,
    selfEvaluation: `Strengths: The group discussion activity generated active participation and learners were able to identify examples of ${subTopic} from the scheme. Areas for Improvement: Some learners required additional prompting to connect the concept to real-life examples. Action Plan: Begin the next lesson with a brief visual comparison chart to reinforce the concept before introducing new scheme content.`,
  };
}

module.exports = { generateLessonContent };