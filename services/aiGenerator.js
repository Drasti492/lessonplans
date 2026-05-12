const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateLessonContent(params, schemeContent = "") {
  try {
    const model    = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const duration = parseInt(params.duration) || 40;
    const introEnd  = Math.round(duration * 0.12);
    const stage1End = Math.round(duration * 0.45);
    const stage2End = Math.round(duration * 0.80);

    const prompt = `You are an experienced Kenyan secondary school teacher writing a formal lesson plan.
Study the scheme of work carefully to extract: page references, specific activities, and exact sub-topic details.

LESSON DETAILS:
Subject: ${params.subject}
Form/Class: ${params.form}
Topic: ${params.topic}
Sub-Topic: ${params.subTopic}
Week: ${params.week}, Lesson: ${params.lessonNum}
Duration: ${duration} minutes
Lesson Type: ${params.lessonType || "Theory"}
Reference Book: ${params.referenceBook || "KLB Book 2"}
General Objectives: ${params.generalObjectives || ""}

SCHEME OF WORK (use this for page refs, activities, and context):
${schemeContent || "No scheme provided — use standard Kenyan secondary curriculum knowledge."}

IMPORTANT FORMATTING RULES:
1. Time format: "0-${introEnd} min", "${introEnd}-${stage1End} min", "${stage1End}-${stage2End} min", "${stage2End}-${duration} min"
2. Keep teacher and learner activities natural and varied lesson to lesson
3. Domains MUST reference specific stages: use (ST1), (ST2), (Con.), (Intro.) in brackets
4. Self-evaluation MUST have exactly three labelled parts: Strengths: ... Areas for Improvement: ... Action Plan: ...
5. Return ONLY valid JSON — no markdown, no backticks, no extra text

{
  "objectives": "By the end of the lesson, the learner should be able to: 1. [specific verb] [specific knowledge outcome]. 2. [specific verb] [specific skill outcome]. 3. [specific verb] [application outcome].",

  "introduction": {
    "time": "0-${introEnd} min",
    "content": "[prior knowledge topic or hook question related to ${params.subTopic}]",
    "teacherActivity": "[greeting, roll call, specific review question, objective statement — tied to ${params.topic}]",
    "learnerActivity": "[specific student response: answering, listening, noting objectives]",
    "resources": "[exact book with page numbers from scheme, whiteboard]"
  },

  "stage1": {
    "time": "${introEnd}-${stage1End} min",
    "content": "[first key concept or sub-concept of ${params.subTopic}]",
    "teacherActivity": "[explain, draw diagram, use chart, ask probing questions — specific to content]",
    "learnerActivity": "[take notes, observe diagram, respond to questions, ask for clarification]",
    "resources": "[textbook with page ref, charts, whiteboard, coloured chalks]"
  },

  "stage2": {
    "time": "${stage1End}-${stage2End} min",
    "content": "[second key concept, application, or practical activity of ${params.subTopic}]",
    "teacherActivity": "[group activity, guided practice, discussion facilitation — specific technique]",
    "learnerActivity": "[draw labelled diagram / group discussion / complete exercise — specific activity]",
    "resources": "[exercise books, charts, textbook, lesson notes]"
  },

  "conclusion": {
    "time": "${stage2End}-${duration} min",
    "content": "[summary of ${params.subTopic} key points + assessment question + homework]",
    "teacherActivity": "[summarise 2-3 key points, give written/oral assessment task, preview next lesson, assign homework from textbook]",
    "learnerActivity": "[listen to summary, complete assessment task, write down homework]",
    "resources": "[whiteboard, exercise books]"
  },

  "cognitiveDomain": "Learners [knowledge verb e.g. define/describe/explain] [specific content] (ST1); [comprehension/application verb] [specific content] (ST2); [higher verb] [task] (Con.).",

  "affectiveDomain": "Learners [develop/appreciate/show interest in] [specific value related to topic] (Intro.); [positive disposition] [related to ST1 or ST2 content] (ST1).",

  "interactiveSkills": "Learners [engage in Q&A / participate in group discussion] (Intro., ST2); [present findings / collaborate] on [specific activity] (Con.).",

  "psychomotorDomain": "Learners [draw labelled diagram / write notes / complete exercise] on [specific content] (Con.).",

  "selfEvaluation": "Strengths: [specific positive outcome — e.g. which activity worked well and why, student engagement level]. Areas for Improvement: [specific weakness observed — e.g. which concept students struggled with]. Action Plan: [specific concrete step to take in the next lesson to address the weakness]."
}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim()
      .replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(text);
  } catch (error) {
    console.error("AI generation error:", error.message);
    return fallback(params);
  }
}

/* ── Fallback when Gemini is unavailable ── */
function fallback(params) {
  const topic    = params.topic    || "the topic";
  const subTopic = params.subTopic || "the sub-topic";
  const ref      = params.referenceBook || "KLB Book 2";
  const dur      = parseInt(params.duration) || 40;
  const s1e      = Math.round(dur * 0.45);
  const s2e      = Math.round(dur * 0.80);

  return {
    objectives: `By the end of the lesson, the learner should be able to:\n1. Define and explain ${subTopic}.\n2. Identify the key characteristics and types of ${subTopic}.\n3. Apply knowledge of ${subTopic} to answer structured questions.`,

    introduction: {
      time: `0-${Math.round(dur * 0.12)} min`,
      content: `Prior knowledge review on ${topic}. Introduction of ${subTopic}.`,
      teacherActivity: `Greets learners and takes attendance. Asks: "What do you remember about ${topic} from the previous lesson?" Introduces today's sub-topic: ${subTopic}. States lesson objectives on the board.`,
      learnerActivity: "Respond to revision question. Listen attentively and note objectives in exercise books.",
      resources: `${ref}, Whiteboard, Chalk`,
    },

    stage1: {
      time: `${Math.round(dur * 0.12)}-${s1e} min`,
      content: `Definition and key concepts of ${subTopic}. Main characteristics.`,
      teacherActivity: `Explains the definition and characteristics of ${subTopic} using the whiteboard. Draws a diagram to illustrate. Asks: "Can you give an example of ${subTopic}?"`,
      learnerActivity: "Take notes on the definition and characteristics. Observe the diagram. Answer teacher's questions.",
      resources: `${ref}, Whiteboard, Charts, Chalk`,
    },

    stage2: {
      time: `${s1e}-${s2e} min`,
      content: `Application and examples of ${subTopic}. Group activity and sketching.`,
      teacherActivity: `Divides class into groups. Each group discusses an example of ${subTopic} and draws a labelled diagram. Moves around facilitating and giving feedback.`,
      learnerActivity: "Work in groups to discuss examples. Draw and label a diagram. Share findings with the class.",
      resources: `${ref}, Exercise Books, Charts, Lesson Notes`,
    },

    conclusion: {
      time: `${s2e}-${dur} min`,
      content: `Summary of ${subTopic}. Assessment and homework.`,
      teacherActivity: `Summarises key points on the board. Gives written task: "Describe ${subTopic} in 5 sentences." Previews next lesson. Assigns homework: Read ${ref} and answer review questions.`,
      learnerActivity: "Listen to summary. Complete written task. Write down homework assignment.",
      resources: "Whiteboard, Exercise Books",
    },

    cognitiveDomain: `Learners define and describe ${subTopic} (ST1); apply knowledge to identify examples (ST2); complete written task (Con.).`,
    affectiveDomain: `Learners show interest in learning about ${topic} (Intro.); develop appreciation for the subject through group work (ST2).`,
    interactiveSkills: `Learners respond to teacher questions and engage in Q&A (Intro.); collaborate in group discussion and share findings (ST2, Con.).`,
    psychomotorDomain: `Learners draw and label a diagram of ${subTopic} in exercise books (Con.).`,
    selfEvaluation: `Strengths: Learners were engaged during the group activity and produced accurate diagrams. Areas for Improvement: Some learners struggled to articulate definitions clearly in writing. Action Plan: In the next lesson, provide a structured definition template to guide learners in writing formal responses.`,
  };
}

module.exports = { generateLessonContent };