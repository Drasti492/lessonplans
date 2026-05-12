const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateLessonContent(params, schemeContent = "") {
  try {
    const model    = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const duration = parseInt(params.duration) || 40;

    const introEnd  = Math.round(duration * 0.12);
    const stage1End = Math.round(duration * 0.45);
    const stage2End = Math.round(duration * 0.80);

    const prompt = `You are an expert Kenyan secondary school teacher writing a formal lesson plan.
SUBJECT: ${params.subject}
FORM: ${params.form}
TOPIC: ${params.topic}
SUB-TOPIC: ${params.subTopic}
WEEK: ${params.week}, LESSON: ${params.lessonNum}
DURATION: ${duration} minutes
LESSON TYPE: ${params.lessonType || "Theory"}
REFERENCE BOOK: ${params.referenceBook || "KLB Book 2"}
SCHEME OF WORK: ${schemeContent || "Use Kenyan secondary school curriculum knowledge."}

Return ONLY valid JSON — no markdown, no backticks.
{
  "objectives": "By the end of the lesson, learners should be able to: [3 specific measurable objectives]",
  "introduction": {
    "time": "0-${introEnd} min",
    "content": "[introductory concepts and prior knowledge review]",
    "teacherActivity": "[teacher introduction activities]",
    "learnerActivity": "[student introduction activities]",
    "resources": "[materials used]"
  },
  "stage1": {
    "time": "${introEnd}-${stage1End} min",
    "content": "[main stage 1 content]",
    "teacherActivity": "[stage 1 teaching activities]",
    "learnerActivity": "[stage 1 student activities]",
    "resources": "[stage 1 materials]"
  },
  "stage2": {
    "time": "${stage1End}-${stage2End} min",
    "content": "[stage 2 deeper content/application]",
    "teacherActivity": "[stage 2 teaching activities]",
    "learnerActivity": "[stage 2 student activities]",
    "resources": "[stage 2 materials]"
  },
  "conclusion": {
    "time": "${stage2End}-${duration} min",
    "content": "[summary of lesson]",
    "teacherActivity": "[conclusion activities: summarise, questions, assignment]",
    "learnerActivity": "[student conclusion activities]",
    "resources": "[conclusion materials]"
  },
  "cognitiveDomain": "[knowledge/comprehension/application skills, reference ST1/ST2/Con.]",
  "affectiveDomain": "[attitudes/values developed, reference Intro./ST1]",
  "interactiveSkills": "[communication/collaboration skills, reference Intro./Con.]",
  "psychomotorDomain": "[physical/practical skills, reference Con.]",
  "selfEvaluation": "[2-sentence teacher self-reflection on delivery and improvements]"
}`;

    const result   = await model.generateContent(prompt);
    const response = await result.response;
    let text       = response.text().trim()
      .replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(text);

  } catch (error) {
    console.error("AI error:", error.message);
    return fallback(params);
  }
}

function fallback(params) {
  return {
    objectives: `By the end of the lesson, learners should be able to:\n- Define and explain ${params.topic || "the topic"}\n- Identify key concepts related to ${params.subTopic || params.topic}\n- Apply knowledge to answer examination questions`,
    introduction: { time: "0-5 min", content: `Introduction to ${params.topic}. Review of previous lesson.`, teacherActivity: "Teacher reviews previous lesson through oral questions and introduces the new topic on the board.", learnerActivity: "Learners participate in revision and listen attentively.", resources: `${params.referenceBook || "KLB Book 2"}, Blackboard, Chalk` },
    stage1: { time: "5-20 min", content: `Definition and key concepts of ${params.topic}. Main characteristics.`, teacherActivity: "Teacher explains key concepts using the board and asks probing questions.", learnerActivity: "Learners take notes and answer questions.", resources: `${params.referenceBook || "KLB Book 2"}, Blackboard, Charts` },
    stage2: { time: "20-30 min", content: `Examples and applications of ${params.topic}.`, teacherActivity: "Teacher guides group discussion and supervised exercises.", learnerActivity: "Learners work in groups, draw diagrams and complete exercises.", resources: `${params.referenceBook || "KLB Book 2"}, Charts, Exercise Books` },
    conclusion: { time: "30-40 min", content: `Summary of ${params.topic}. Assignment given.`, teacherActivity: "Teacher summarises lesson, asks oral questions and gives assignment.", learnerActivity: "Learners answer questions and write down the assignment.", resources: "Blackboard, Exercise Books" },
    cognitiveDomain: `Knowledge: Define ${params.topic} (ST1). Comprehension: Explain concepts (ST2). Application: Solve problems (Con.)`,
    affectiveDomain: "Interest in the subject developed (Intro.). Positive attitude toward learning (ST1).",
    interactiveSkills: "Communication through Q&A (Intro., Con.). Collaboration in group work (ST2).",
    psychomotorDomain: "Writing notes and drawing diagrams in exercise books (Con.).",
    selfEvaluation: "Lesson objectives were achieved as learners actively participated. Future lessons will incorporate more visual aids and practice examples.",
  };
}

module.exports = { generateLessonContent };