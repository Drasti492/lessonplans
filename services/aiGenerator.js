const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateLessonContent(params, schemeContent = "") {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
You are an expert Kenyan secondary school teacher.

Generate a professional lesson plan in JSON ONLY.

SUBJECT: ${params.subject}
FORM: ${params.form}
TOPIC: ${params.topic}
SUBTOPIC: ${params.subTopic}
WEEK: ${params.week}
LESSON: ${params.lessonNum}

SCHEME:
${schemeContent}

RETURN JSON ONLY.

{
  "objectives":"",
  "introduction":{
    "time":"",
    "content":"",
    "teacherActivity":"",
    "learnerActivity":"",
    "resources":""
  },
  "stage1":{
    "time":"",
    "content":"",
    "teacherActivity":"",
    "learnerActivity":"",
    "resources":""
  },
  "stage2":{
    "time":"",
    "content":"",
    "teacherActivity":"",
    "learnerActivity":"",
    "resources":""
  },
  "conclusion":{
    "time":"",
    "content":"",
    "teacherActivity":"",
    "learnerActivity":"",
    "resources":""
  },
  "cognitiveDomain":"",
  "affectiveDomain":"",
  "interactiveSkills":"",
  "psychomotorDomain":""
}
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    let text = response.text();

    text = text.replace(/```json/g, "");
    text = text.replace(/```/g, "");

    return JSON.parse(text);

  } catch (error) {
    console.log(error);

    return fallback(params);
  }
}

function fallback(params) {
  return {
    objectives: `Understand ${params.topic}`,
    introduction: {
      time: "0-5 min",
      content: "Introduction",
      teacherActivity: "Teacher introduces lesson",
      learnerActivity: "Learners listen",
      resources: "Books"
    },
    stage1: {
      time: "5-20 min",
      content: "Main lesson",
      teacherActivity: "Explain concepts",
      learnerActivity: "Take notes",
      resources: "Board"
    },
    stage2: {
      time: "20-35 min",
      content: "Practical examples",
      teacherActivity: "Give examples",
      learnerActivity: "Answer questions",
      resources: "Charts"
    },
    conclusion: {
      time: "35-40 min",
      content: "Summary",
      teacherActivity: "Summarize",
      learnerActivity: "Respond",
      resources: "Board"
    },
    cognitiveDomain: "Knowledge acquisition",
    affectiveDomain: "Interest development",
    interactiveSkills: "Discussion",
    psychomotorDomain: "Writing"
  };
}

module.exports = {
  generateLessonContent
};