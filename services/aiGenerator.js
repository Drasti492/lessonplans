/* ================================================================
   aiGenerator.js  — EduPlan
   Generates lesson plan JSON content using Gemini AI.
   - Strictly relies on uploaded scheme of work
   - Single-sentence lesson objective
   - Avoids repeating words/phrases across plans
   - Supports double lessons (80 min) with automatic time partition
================================================================ */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateLessonContent(params, schemeContent = "") {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // ── Duration: single = 40 min, double = 80 min ──────────────
    const isDouble  = params.isDouble === true || params.isDouble === "true";
    const duration  = isDouble ? 80 : (parseInt(params.duration) || 40);

    // Time breakpoints scaled to lesson length
    const introEnd  = Math.round(duration * 0.10);  //  4 min (40) /  8 min (80)
    const stage1End = Math.round(duration * 0.42);  // 17 min (40) / 34 min (80)
    const stage2End = Math.round(duration * 0.78);  // 31 min (40) / 62 min (80)

    // ── Pull lesson-specific week/lesson context from scheme ─────
    const lessonContext = schemeContent
      ? `\nFocus specifically on Week ${params.week}, Lesson ${params.lessonNum} from this scheme:\n${schemeContent}`
      : `\nNo scheme uploaded — use standard Kenyan secondary school ${params.subject} curriculum for Form ${(params.form || "").replace(/\D/g, "") || "2"}.`;

    const prompt = `You are an experienced Kenyan secondary school teacher writing ONE formal lesson plan.

LESSON DETAILS:
- Subject: ${params.subject || ""}
- Form/Class: ${params.form || ""}
- Topic: ${params.topic || ""}
- Sub-Topic: ${params.subTopic || ""}
- Week: ${params.week || "1"}, Lesson Number: ${params.lessonNum || "1"}
- Duration: ${duration} minutes${isDouble ? " (DOUBLE LESSON)" : ""}
- Lesson Type: ${params.lessonType || "Theory"}
- Reference Book: ${params.referenceBook || "KLB Textbook"}
- General Objectives: ${params.generalObjectives || ""}
- Day: ${params.lessonDay || ""}
- Date: ${params.date || ""}
${lessonContext}

ABSOLUTE RULES — FOLLOW EVERY ONE:
1. The "objectives" field must be ONE single sentence only, like:
   "By the end of the lesson, learners will be able to [specific verb] [specific content from scheme]."
   Do NOT write a numbered list. Do NOT write multiple sentences.

2. Time slots MUST exactly be:
   "0–${introEnd} min", "${introEnd}–${stage1End} min", "${stage1End}–${stage2End} min", "${stage2End}–${duration} min"

3. ALL content (activities, resources, objectives) MUST be derived from the scheme of work above.
   Do NOT invent topics or activities not mentioned in the scheme.
   Use the exact sub-topic, page references, and activities the scheme specifies.

4. DO NOT repeat the same verbs, phrases, or sentence structures across introduction, stage1, stage2, and conclusion.
   Each stage must use different language, different activity types, and different sentence patterns.

5. Domain tags MUST use this exact bracket format at the start:
   cognitiveDomain   → starts with "[ST1, ST2, Con]"
   affectiveDomain   → starts with "[Intro]"
   interactiveSkills → starts with "[Intro, ST2]"
   psychomotorDomain → starts with "[Con]"

6. selfEvaluation MUST contain exactly these three parts, each on a new sentence:
   "Strengths: [what worked, specific to THIS lesson's content and activities].
    Areas for Improvement: [specific weakness observed in THIS lesson].
    Action Plan: [concrete next step for the next lesson]."

7. Resources must reference the actual book, page numbers from the scheme if available.

8. Return ONLY valid JSON — no markdown, no backticks, no text before or after the JSON.

Return this exact structure:

{
  "objectives": "By the end of the lesson, learners will be able to [specific measurable action] [specific content from scheme for ${params.subTopic}].",

  "introduction": {
    "time": "0–${introEnd} min",
    "content": "[prior knowledge question or hook based on what the scheme says precedes ${params.subTopic}]",
    "teacherActivity": "[specific greeting + attendance + probing question about prior lesson + writes sub-topic '${params.subTopic}' on board + states today's objective]",
    "learnerActivity": "[specific response: answer the review question, copy sub-topic, listen to objective]",
    "resources": "[exact book from scheme with page number, whiteboard, chalk]"
  },

  "stage1": {
    "time": "${introEnd}–${stage1End} min",
    "content": "[first core concept from scheme for ${params.subTopic} — definition, classification, or key idea]",
    "teacherActivity": "[specific explanation method: diagram drawing / map reading / chart display / comparison — tied to scheme content. Pose a different question than introduction.]",
    "learnerActivity": "[specific different activity: label diagram / copy notes / answer questions in pairs — not the same as introduction activity]",
    "resources": "[scheme's reference book with page, charts, coloured chalk, whiteboard]"
  },

  "stage2": {
    "time": "${stage1End}–${stage2End} min",
    "content": "[second concept, application, or case study from scheme for ${params.subTopic}]",
    "teacherActivity": "[different method: group work / guided discovery / problem solving / field sketch — different from stage1. Facilitate rather than explain.]",
    "learnerActivity": "[different task: group discussion / sketch a diagram / solve a problem / analyse data — must be distinct from stage1 activity]",
    "resources": "[exercise books, lesson notes, maps/charts from scheme if applicable]"
  },

  "conclusion": {
    "time": "${stage2End}–${duration} min",
    "content": "[summary of ${params.subTopic} key points + oral or written assessment question + homework]",
    "teacherActivity": "[summarise 2–3 key points on board using different words from earlier stages. Give specific written/oral task. Preview next lesson. Assign homework from scheme's reference.]",
    "learnerActivity": "[write summary / answer task / record homework — must be distinct from earlier activities]",
    "resources": "[whiteboard, exercise books, ${params.referenceBook || "KLB Textbook"}]"
  },

  "cognitiveDomain": "[ST1, ST2, Con]: Learners [specific verb from scheme content] ${params.subTopic} (ST1); [second different verb] [specific application] (ST2); [third verb] [assessment task] (Con).",

  "affectiveDomain": "[Intro]: Learners [value/appreciate/show interest in] [specific aspect of ${params.topic}] relevant to their [local/national/environmental] context (Intro).",

  "interactiveSkills": "[Intro, ST2]: Learners [respond to questions / participate in discussion] on ${params.subTopic} (Intro); [collaborate / present findings / engage peers] during [specific stage2 activity] (ST2).",

  "psychomotorDomain": "[Con]: Learners [draw / write / label / sketch] [specific product — e.g. labelled diagram of ${params.subTopic}] in their exercise books (Con).",

  "selfEvaluation": "Strengths: [specific positive — which activity worked, what learners grasped, why it worked for THIS sub-topic]. Areas for Improvement: [specific gap — which concept caused confusion or which learners struggled]. Action Plan: [concrete measurable step to address the gap in the next lesson, tied to the scheme]."
}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Strip markdown fences Gemini sometimes adds
    text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
    text = text.replace(/```\s*$/, "").trim();

    return JSON.parse(text);

  } catch (error) {
    console.error("AI generation error:", error.message);
    return fallback(params);
  }
}

/* ── Fallback when Gemini is unavailable ────────────────────────── */
function fallback(params) {
  const topic    = params.topic    || "the topic";
  const subTopic = params.subTopic || "the sub-topic";
  const ref      = params.referenceBook || "KLB Textbook";
  const isDouble = params.isDouble === true || params.isDouble === "true";
  const dur      = isDouble ? 80 : (parseInt(params.duration) || 40);
  const introEnd  = Math.round(dur * 0.10);
  const stage1End = Math.round(dur * 0.42);
  const stage2End = Math.round(dur * 0.78);

  return {
    objectives: `By the end of the lesson, learners will be able to explain the key characteristics and significance of ${subTopic} with relevant examples.`,

    introduction: {
      time: `0–${introEnd} min`,
      content: `Review of prior knowledge on ${topic}. Introduction of sub-topic: ${subTopic}.`,
      teacherActivity: `Greets learners and takes attendance. Poses a revision question: "What did we cover in the previous lesson about ${topic}?" Writes sub-topic '${subTopic}' on the board and states today's objective.`,
      learnerActivity: "Respond to the revision question, copy sub-topic from the board, and listen to the stated objective.",
      resources: `${ref}, Whiteboard, Chalk`,
    },

    stage1: {
      time: `${introEnd}–${stage1End} min`,
      content: `Definition, types and characteristics of ${subTopic}.`,
      teacherActivity: `Uses the whiteboard to explain the definition and key characteristics of ${subTopic}. Draws and labels a diagram. Asks: "What distinguishes ${subTopic} from what we studied before?"`,
      learnerActivity: "Copy notes and the labelled diagram into exercise books. Answer the teacher's question individually.",
      resources: `${ref}, Whiteboard, Charts, Coloured Chalk`,
    },

    stage2: {
      time: `${stage1End}–${stage2End} min`,
      content: `Examples and effects of ${subTopic}. Group analysis activity.`,
      teacherActivity: `Organises learners into groups of four. Each group analyses a given example of ${subTopic} and discusses its effects or significance. Moves around giving feedback.`,
      learnerActivity: "Discuss the assigned example in groups, record findings, and one member presents a summary to the class.",
      resources: `${ref}, Exercise Books, Charts, Lesson Notes`,
    },

    conclusion: {
      time: `${stage2End}–${dur} min`,
      content: `Consolidation of ${subTopic}. Written task and homework assignment.`,
      teacherActivity: `Summarises two main points about ${subTopic} using fresh vocabulary. Gives written task: "In three sentences, describe the significance of ${subTopic}." Previews next lesson. Assigns homework from ${ref}.`,
      learnerActivity: "Complete the written task in exercise books. Note down the homework assignment.",
      resources: `Whiteboard, Exercise Books, ${ref}`,
    },

    cognitiveDomain: `[ST1, ST2, Con]: Learners define and identify characteristics of ${subTopic} (ST1); analyse examples and effects through group work (ST2); complete a written consolidation task (Con).`,
    affectiveDomain: `[Intro]: Learners show curiosity about how ${topic} relates to their local environment and daily experiences (Intro).`,
    interactiveSkills: `[Intro, ST2]: Learners respond to teacher revision questions on ${topic} (Intro); collaborate in groups to analyse and present findings on ${subTopic} (ST2).`,
    psychomotorDomain: `[Con]: Learners draw and label a diagram of ${subTopic} and write a three-sentence description in their exercise books (Con).`,
    selfEvaluation: `Strengths: The group activity generated active engagement and learners were able to identify at least two examples of ${subTopic} from their discussions. Areas for Improvement: A few learners struggled to distinguish ${subTopic} from related concepts covered in earlier lessons. Action Plan: Begin the next lesson with a brief visual comparison chart to clearly differentiate the concepts before introducing new material from the scheme.`,
  };
}

module.exports = { generateLessonContent };