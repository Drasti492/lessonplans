/**
 * aiGenerator.js
 * DB-FIRST approach: all content comes from the database.
 * AI only enhances language, varies phrasing, and fills any gaps.
 * Uses gemini-2.0-flash-lite (best free-tier quota).
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ── Retry on 429 rate-limit ────────────────────────────── */
async function callWithRetry(model, prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (err) {
      const is429 = err.message && (err.message.includes("429") || err.message.includes("quota"));
      if (is429 && attempt < maxRetries) {
        const waitSec = Math.min(attempt * 12, 25);
        console.warn(`⏳ Rate limit — waiting ${waitSec}s (attempt ${attempt}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, waitSec * 1000));
      } else {
        throw err;
      }
    }
  }
}

/* ── Subject language hints ─────────────────────────────── */
function subjectHint(subject) {
  const s = (subject || "").toLowerCase();
  if (/math/.test(s))  return "Use: solve, calculate, derive, apply formula, verify, work out. Teacher shows step-by-step examples. Assessment must be a calculation problem.";
  if (/geog/.test(s))  return "Use: describe, locate, sketch, label, interpret, compare, explain distribution. Teacher uses maps and diagrams. Assessment includes labelled sketch or map task.";
  if (/bio/.test(s))   return "Use: classify, observe, label, describe function, identify, dissect. Teacher uses specimens and diagrams. Assessment includes labelling a diagram.";
  if (/chem/.test(s))  return "Use: react, balance, write equation, observe, identify. Teacher describes experiments. Assessment involves naming products or describing a test.";
  if (/phys/.test(s))  return "Use: calculate, apply formula, derive, measure, state. Teacher works numerical examples. Assessment is a calculation.";
  if (/hist/.test(s))  return "Use: explain causes, describe effects, analyse, evaluate, state factors. Teacher uses timelines. Assessment is written explanation.";
  if (/eng|lit/.test(s)) return "Use: read, analyse, compose, identify, discuss. Teacher uses extracts. Assessment includes written or oral production.";
  if (/kisw/.test(s))  return "Tumia: elezea, jadili, tunga, tambua, andika. Mwalimu atumie vifungu vya kusoma. Tathmini: kazi ya uandishi au mazungumzo.";
  return "Use precise subject-appropriate professional language. Vary verbs and activity types across stages.";
}

/* ── Strategy rotation banks ────────────────────────────── */
const INTRO_HOOKS = [
  "Opens with a real-life local example directly linked to the subtopic",
  "Displays a diagram/image on the board and asks: 'What do you observe?'",
  "Recalls the previous lesson through a targeted oral question then bridges to today",
  "Poses a prediction question: 'What would happen if…?' linked to subtopic",
  "Writes a key term on the board and invites learners to share prior knowledge",
];
const STAGE1_METHODS = [
  "Step-by-step diagram construction on whiteboard with guided explanation",
  "Guided discovery: builds concept from learner responses to leading questions",
  "Demonstration with charts or models, then structured teacher explanation",
  "Think-Pair-Share: pairs discuss concept then teacher consolidates responses",
  "Question-sequence exposition: progressive questions build full understanding",
];
const STAGE2_METHODS = [
  "Small group task with class presentation of group findings",
  "Supervised independent practice on graded examples",
  "Collaborative sketching/drawing with immediate teacher feedback",
  "Peer teaching: pairs explain concept to each other then swap roles",
  "Structured class discussion on significance with teacher as facilitator",
];
const CONC_STYLES = [
  "Written consolidation task tied to DB assessment field; homework assigned",
  "Oral Q&A recap: 3 targeted questions on key lesson points",
  "Exit ticket: each learner writes one fact and one question on a slip",
  "Collaborative board summary: learners contribute key points one by one",
  "Short timed quiz from DB assessment; self-marked with class discussion",
];
function pick(arr, n) { return arr[((parseInt(n) || 1) - 1) % arr.length]; }

/* ════════════════════════════════════════════════════════
   MAIN EXPORT — enhanceWithAI
   Takes DB content and teacher params, returns JSON lesson
════════════════════════════════════════════════════════ */
async function enhanceWithAI(params, dbContent) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const duration = parseInt(params.duration) || 40;
    const t0 = 0;
    const t1 = Math.round(duration * 0.125);
    const t2 = Math.round(duration * 0.50);
    const t3 = Math.round(duration * 0.875);
    const t4 = duration;

    const lesN = parseInt(params.lessonNum) || 1;

    const prompt = `
You are an expert Kenyan secondary school teacher generating ONE formal lesson plan.

=================================================================
CURRICULUM DATA FROM DATABASE (authoritative source)
=================================================================
Subject     : ${dbContent.subjectName}
Topic       : ${dbContent.topicName}
Sub-Topic   : ${dbContent.subtopicName}
Objectives  : ${dbContent.objectives}
Activities  : ${dbContent.activities}
Methods     : ${dbContent.methods}
Resources   : ${dbContent.resources}
Assessment  : ${dbContent.assessment}
Values/Life : ${dbContent.values}
References  : ${dbContent.references}

Pre-built stages from DB (enhance these — do NOT ignore them):
INTRODUCTION: content="${(dbContent.introduction || {}).content || ''}" teacherActivity="${(dbContent.introduction || {}).teacherActivity || ''}" learnerActivity="${(dbContent.introduction || {}).learnerActivity || ''}" resources="${(dbContent.introduction || {}).resources || ''}"
STAGE 1: content="${(dbContent.stage1 || {}).content || ''}" teacherActivity="${(dbContent.stage1 || {}).teacherActivity || ''}" learnerActivity="${(dbContent.stage1 || {}).learnerActivity || ''}"
STAGE 2: content="${(dbContent.stage2 || {}).content || ''}" teacherActivity="${(dbContent.stage2 || {}).teacherActivity || ''}" learnerActivity="${(dbContent.stage2 || {}).learnerActivity || ''}"
CONCLUSION: content="${(dbContent.conclusion || {}).content || ''}" teacherActivity="${(dbContent.conclusion || {}).teacherActivity || ''}" learnerActivity="${(dbContent.conclusion || {}).learnerActivity || ''}"

=================================================================
LESSON METADATA
=================================================================
Form/Class  : ${params.form}${params.stream ? " " + params.stream : ""}
Students    : ${params.numStudents}
Duration    : ${duration} min
Day         : ${params.day}
Date        : ${params.date}
Time        : ${params.startTime} – ${params.endTime}
Lesson No.  : ${params.lessonNum}

=================================================================
SUBJECT LANGUAGE RULES
=================================================================
${subjectHint(dbContent.subjectName)}

=================================================================
STRATEGIES (rotate — never repeat across lessons)
=================================================================
Introduction : ${pick(INTRO_HOOKS, lesN)}
Stage I      : ${pick(STAGE1_METHODS, lesN + 1)}
Stage II     : ${pick(STAGE2_METHODS, lesN + 2)}
Conclusion   : ${pick(CONC_STYLES, lesN + 3)}

=================================================================
STRICT RULES
=================================================================
1. ALL content must come from the DB fields above. No hallucination.
2. ONE-SENTENCE objective: "By the end of the lesson, learners will be able to [verb(s)] [specific content]."
3. TIME FORMAT — use EXACTLY: "${t0}–${t1} min", "${t1}–${t2} min", "${t2}–${t3} min", "${t3}–${t4} min"
4. Each stage MUST use different verbs, different activity types.
5. Teacher activities: include one actual question in quotes per stage.
6. Learner activities: use action verbs (copy, sketch, label, solve, present, discuss, mark).
7. Resources: use ONLY what is in the DB resources/references fields.
8. Assessment: use wording from DB assessment field.
9. Domain statements: name the actual sub-topic (not generic placeholders).
10. Self-evaluation: reference actual activity + actual difficulty + concrete action plan.
11. Return ONLY raw JSON — no markdown, no backticks, no text outside JSON.

=================================================================
JSON TO RETURN
=================================================================
{
  "objectives": "By the end of the lesson, learners will be able to [DB verbs] [DB content].",
  "introduction": {
    "time": "${t0}–${t1} min",
    "content": "[prior knowledge bridge to ${dbContent.subtopicName}]",
    "teacherActivity": "[greet + register + specific review question in quotes + write sub-topic on board + state objective]",
    "learnerActivity": "[respond to question + copy sub-topic + note objective]",
    "resources": "[from DB resources field]"
  },
  "stage1": {
    "time": "${t1}–${t2} min",
    "content": "[first concept from DB — enhance DB stage1 content]",
    "teacherActivity": "[enhance DB stage1 teacherActivity — include actual question in quotes]",
    "learnerActivity": "[specific task — different from introduction — from DB activities]",
    "resources": "[from DB resources]"
  },
  "stage2": {
    "time": "${t2}–${t3} min",
    "content": "[second concept or application from DB — enhance DB stage2 content]",
    "teacherActivity": "[enhance DB stage2 teacherActivity — different method from stage1]",
    "learnerActivity": "[different task and verb from stage1]",
    "resources": "[from DB resources]"
  },
  "conclusion": {
    "time": "${t3}–${t4} min",
    "content": "[summary of ${dbContent.subtopicName} + exact DB assessment task + homework]",
    "teacherActivity": "[summarise 2 key points in quotes + give exact DB assessment task + preview next lesson + assign homework]",
    "learnerActivity": "[complete DB assessment task + record homework in exercise books]",
    "resources": "Whiteboard, Exercise Books, [DB reference]"
  },
  "cognitiveDomain": "[ST1, ST2, Con]: Learners [ST1 verb] ${dbContent.subtopicName} (ST1); [ST2 verb] [application] (ST2); [assessment verb] (Con).",
  "affectiveDomain": "[Intro]: Learners [appreciate/develop awareness of] [DB values field content] (Intro).",
  "interactiveSkills": "[Intro, ST2]: Learners [intro interaction] (Intro); [ST2 group/pair interaction] (ST2).",
  "psychomotorDomain": "[Con]: Learners [draw/write/label/sketch] [DB assessment product] in exercise books (Con).",
  "selfEvaluation": "Strengths: [specific activity that worked + why]. Areas for Improvement: [specific concept that caused difficulty]. Action Plan: [concrete measurable next step]."
}
`;

    const result = await callWithRetry(model, prompt);
    let text = result.response.text().trim()
      .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/, "").trim();

    return JSON.parse(text);

  } catch (err) {
    console.error("AI enhance error:", err.message);
    return buildFallback(params, dbContent);
  }
}

/* ── Fallback when AI is unavailable ────────────────────── */
function buildFallback(params, db) {
  const dur = parseInt(params.duration) || 40;
  const t1  = Math.round(dur * 0.125);
  const t2  = Math.round(dur * 0.50);
  const t3  = Math.round(dur * 0.875);

  const sub = db.subtopicName || "the sub-topic";
  const ref = db.references   || db.resources || "KLB Textbook";

  return {
    objectives: db.objectives
      ? `By the end of the lesson, learners will be able to ${db.objectives.replace(/^By the end.*able to/i, "").trim() || db.objectives}.`
      : `By the end of the lesson, learners will be able to describe and explain the key characteristics of ${sub} with relevant examples.`,

    introduction: {
      time: `0–${t1} min`,
      content: db.introduction?.content || `Prior knowledge review on ${db.topicName}; introduction of ${sub}.`,
      teacherActivity: db.introduction?.teacherActivity ||
        `Greets learners and marks register. Asks: "What do you recall from our previous lesson on ${db.topicName}?" Writes '${sub}' on the board and states today's objective.`,
      learnerActivity: db.introduction?.learnerActivity ||
        `Respond to the review question, copy the sub-topic from the board, and note the objective in exercise books.`,
      resources: db.introduction?.resources || ref + ", Whiteboard, Chalk",
    },

    stage1: {
      time: `${t1}–${t2} min`,
      content: db.stage1?.content || `Definition and key characteristics of ${sub}.`,
      teacherActivity: db.stage1?.teacherActivity ||
        `Explains the definition and characteristics of ${sub} using the whiteboard. Draws and labels a diagram. Asks: "What is the defining feature of ${sub}?"`,
      learnerActivity: db.stage1?.learnerActivity ||
        `Copy the definition and diagram. Answer the teacher's question individually.`,
      resources: db.stage1?.resources || ref + ", Whiteboard, Charts, Coloured Chalk",
    },

    stage2: {
      time: `${t2}–${t3} min`,
      content: db.stage2?.content || `Application and examples of ${sub} through group activity.`,
      teacherActivity: db.stage2?.teacherActivity ||
        `${db.methods || "Guides group work"}. Asks: "How does ${sub} relate to your local environment?"`,
      learnerActivity: db.stage2?.learnerActivity ||
        `${db.activities || "Discuss examples in groups, record findings, present to class"}.`,
      resources: db.stage2?.resources || ref + ", Exercise Books, Charts",
    },

    conclusion: {
      time: `${t3}–${dur} min`,
      content: db.conclusion?.content || `Summary of ${sub}. ${db.assessment || "Written assessment"}.`,
      teacherActivity: db.conclusion?.teacherActivity ||
        `Summarises: "The key features of ${sub} are…" Gives assessment: ${db.assessment || `"Describe ${sub} in four sentences."`} Previews next lesson. Assigns homework from ${ref}.`,
      learnerActivity: db.conclusion?.learnerActivity ||
        `Complete the assessment task in exercise books and record the homework.`,
      resources: `Whiteboard, Exercise Books, ${ref}`,
    },

    cognitiveDomain: `[ST1, ST2, Con]: Learners define and describe ${sub} (ST1); analyse examples through ${db.methods || "group discussion"} (ST2); complete ${db.assessment || "written assessment"} (Con).`,
    affectiveDomain: `[Intro]: Learners develop awareness of ${db.values || "how " + db.topicName + " connects to the real world"} (Intro).`,
    interactiveSkills: `[Intro, ST2]: Learners respond to teacher's review question on ${db.topicName} (Intro); collaborate to analyse and present findings on ${sub} (ST2).`,
    psychomotorDomain: `[Con]: Learners ${db.assessment ? "complete " + db.assessment.toLowerCase() : "draw and label a diagram of " + sub} in exercise books (Con).`,
    selfEvaluation: `Strengths: The ${db.methods || "practical"} activity generated strong participation as learners applied ${sub} concepts from prior knowledge. Areas for Improvement: Some learners needed additional support linking ${sub} to ${db.values || "real-life contexts"}. Action Plan: Begin next lesson with a visual review of ${sub} before introducing new content.`,
  };
}

module.exports = { enhanceWithAI };