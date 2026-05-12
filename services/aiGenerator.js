/* ================================================================
   aiGenerator.js — EduPlan AI Engine (Professional Weekly Version)
   ---------------------------------------------------------------
   FEATURES
   ✔ Weekly scheme-focused generation
   ✔ Uses ONLY uploaded scheme content
   ✔ Strong anti-repetition instructions
   ✔ Dynamic cognitive/affective/interactive domains
   ✔ Dynamic self-evaluation
   ✔ Subject-sensitive responses
   ✔ Geography/Maths/Biology/etc aware
   ✔ Prevents hallucination
   ✔ Produces varied teacher activities
   ✔ Produces varied learner activities
================================================================ */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { extractLessonContext } = require("../utils/extractTopics");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateLessonContent(params, schemeContent = "") {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const isDouble =
      params.isDouble === true || params.isDouble === "true";

    const duration = isDouble
      ? 80
      : parseInt(params.duration || 40);

    const introEnd = Math.round(duration * 0.10);
    const stage1End = Math.round(duration * 0.42);
    const stage2End = Math.round(duration * 0.78);

    /* =========================================================
       EXTRACT ONLY THE REQUIRED WEEK + LESSON
    ========================================================= */

    const lessonScheme = extractLessonContext(
      schemeContent,
      params.week,
      params.lessonNum
    );

    if (!lessonScheme) {
      throw new Error(
        `Lesson not found in uploaded weekly scheme. Check week ${params.week} lesson ${params.lessonNum}.`
      );
    }

    /* =========================================================
       MASTER PROMPT
    ========================================================= */

    const prompt = `
You are a highly experienced Kenyan secondary school teacher and curriculum expert.

You are writing ONE PROFESSIONAL lesson plan using ONLY the uploaded WEEKLY scheme of work.

=========================================================
IMPORTANT CONTEXT
=========================================================

SUBJECT: ${params.subject || ""}
FORM: ${params.form || ""}
TOPIC: ${params.topic || ""}
SUB-TOPIC: ${params.subTopic || ""}
WEEK: ${params.week || ""}
LESSON: ${params.lessonNum || ""}
DURATION: ${duration} minutes

=========================================================
STRICTLY USE THIS LESSON SCHEME
=========================================================

${lessonScheme}

=========================================================
CRITICAL INSTRUCTIONS — FOLLOW STRICTLY
=========================================================

1. USE ONLY THE CONTENT FROM THE SCHEME PROVIDED.
Do not invent unrelated content.

2. ALL SECTIONS MUST MATCH:
- lesson objective
- activities
- resources
- assessment
- teaching method
- life approach

3. EVERY LESSON PLAN MUST FEEL DIFFERENT.
Avoid repeated wording patterns.

4. NEVER repeatedly use:
- "Discusses..."
- "Students listen..."
- "Learners engage..."
- "Teacher explains..."
unless naturally appropriate.

5. VARY:
- verbs
- sentence openings
- instructional strategies
- questioning styles
- assessment styles
- learner tasks

6. DIFFERENT SUBJECTS MUST SOUND DIFFERENT:
- Maths → calculations, solving, reasoning, formulas
- Geography → diagrams, landscapes, maps, interpretation
- Biology → observation, classification, experimentation
- English → reading, discussion, oral skills, writing
- Chemistry → experiments, reactions, observations

7. DO NOT GENERATE GENERIC CONTENT.

8. INTRODUCTION, STAGE I, STAGE II, CONCLUSION MUST ALL USE DIFFERENT TEACHING STYLES.

9. SELF-EVALUATION MUST BE BASED ON:
- actual classroom activities
- actual learner difficulties
- actual assessment
- actual topic taught

10. DOMAIN STATEMENTS MUST MATCH THE LESSON CONTENT EXACTLY.

11. USE NATURAL PROFESSIONAL TEACHER LANGUAGE.

12. OBJECTIVE MUST BE ONE SENTENCE ONLY.

13. RETURN CLEAN VALID JSON ONLY.

=========================================================
TIME ALLOCATION
=========================================================

Introduction: 0–${introEnd} min
Stage I: ${introEnd}–${stage1End} min
Stage II: ${stage1End}–${stage2End} min
Conclusion: ${stage2End}–${duration} min

=========================================================
RETURN THIS JSON STRUCTURE
=========================================================

{
  "objectives": "",

  "introduction": {
    "time": "",
    "content": "",
    "teacherActivity": "",
    "learnerActivity": "",
    "resources": ""
  },

  "stage1": {
    "time": "",
    "content": "",
    "teacherActivity": "",
    "learnerActivity": "",
    "resources": ""
  },

  "stage2": {
    "time": "",
    "content": "",
    "teacherActivity": "",
    "learnerActivity": "",
    "resources": ""
  },

  "conclusion": {
    "time": "",
    "content": "",
    "teacherActivity": "",
    "learnerActivity": "",
    "resources": ""
  },

  "cognitiveDomain": "",

  "affectiveDomain": "",

  "interactiveSkills": "",

  "psychomotorDomain": "",

  "selfEvaluation": ""
}
`;

    const result = await model.generateContent(prompt);

    let text = result.response.text().trim();

    text = text
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    const parsed = JSON.parse(text);

    return parsed;

  } catch (error) {
    console.error("AI generation error:", error.message);

    return fallback(params);
  }
}

/* ================================================================
   FALLBACK
================================================================ */

function fallback(params) {
  const topic = params.topic || "the topic";
  const subTopic = params.subTopic || "the sub-topic";
  const ref = params.referenceBook || "KLB Book";

  const isDouble =
    params.isDouble === true || params.isDouble === "true";

  const duration = isDouble ? 80 : 40;

  const introEnd = Math.round(duration * 0.10);
  const stage1End = Math.round(duration * 0.42);
  const stage2End = Math.round(duration * 0.78);

  return {
    objectives:
      `By the end of the lesson, learners will be able to explain and apply concepts related to ${subTopic}.`,

    introduction: {
      time: `0–${introEnd} min`,
      content:
        `Linking prior knowledge to ${subTopic}.`,
      teacherActivity:
        `Introduces the lesson through guided questioning connected to the previous lesson and outlines the expected learning outcome.`,
      learnerActivity:
        `Respond to introductory questions, share prior knowledge, and record the lesson focus.`,
      resources:
        `${ref}, Whiteboard`
    },

    stage1: {
      time: `${introEnd}–${stage1End} min`,
      content:
        `Development of core ideas related to ${subTopic}.`,
      teacherActivity:
        `Guides learners through the main concept using illustrations, explanations, and examples relevant to the topic.`,
      learnerActivity:
        `Observe demonstrations, participate in guided discussion, and record key points.`,
      resources:
        `${ref}, Charts, Lesson Notes`
    },

    stage2: {
      time: `${stage1End}–${stage2End} min`,
      content:
        `Application activity based on ${subTopic}.`,
      teacherActivity:
        `Organizes learners into collaborative tasks and facilitates analysis of the assigned activity.`,
      learnerActivity:
        `Work collaboratively to complete the assigned activity and present responses.`,
      resources:
        `Exercise Books, Lesson Notes`
    },

    conclusion: {
      time: `${stage2End}–${duration} min`,
      content:
        `Lesson summary and assessment.`,
      teacherActivity:
        `Reviews the major ideas covered, administers a short assessment task, and issues follow-up assignment.`,
      learnerActivity:
        `Respond to assessment items and note the homework assignment.`,
      resources:
        `Whiteboard, Exercise Books`
    },

    cognitiveDomain:
      `[ST1, ST2, Con]: Learners interpret concepts related to ${subTopic} (ST1), apply the ideas during class activities (ST2), and complete the assessment task successfully (Con).`,

    affectiveDomain:
      `[Intro]: Learners develop interest and appreciation towards learning aspects of ${topic}.`,

    interactiveSkills:
      `[Intro, ST2]: Learners exchange ideas during guided discussion and cooperate effectively in classroom activities.`,

    psychomotorDomain:
      `[Con]: Learners write notes, complete exercises, and organize their work neatly in exercise books.`,

    selfEvaluation:
      `Strengths: Learners actively participated in classroom activities and responded positively to the lesson tasks.\nAreas for Improvement: Some learners required additional guidance when handling the assigned activities.\nAction Plan: Provide more guided practice and differentiated support during the next lesson.`
  };
}

module.exports = { generateLessonContent };