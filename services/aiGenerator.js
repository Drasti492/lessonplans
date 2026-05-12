const { GoogleGenerativeAI } = require("@google/generative-ai");
const { extractLessonContext } = require("../utils/extractTopics");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function callWithRetry(model, prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (err) {
      const is429 = err.message && (err.message.includes("429") || err.message.includes("quota"));
      if (is429 && attempt < maxRetries) {
        const retryMatch = err.message.match(/retryDelay['":\s]+(\d+)/);
        const waitSec = Math.min(retryMatch ? parseInt(retryMatch[1]) : attempt * 10, 20);
        console.warn(`⏳ Rate limit. Waiting ${waitSec}s (attempt ${attempt}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, waitSec * 1000));
      } else { throw err; }
    }
  }
}

function subjectHint(subject) {
  const s = (subject || "").toLowerCase();
  if (/math|maths/.test(s))  return "MATHEMATICS: use solve, calculate, derive, apply formula. Teacher shows step-by-step examples. Assessment must be a calculation.";
  if (/geog/.test(s))        return "GEOGRAPHY: use describe, locate, sketch, label, interpret. Teacher uses maps/diagrams. Assessment includes labelled sketch.";
  if (/bio/.test(s))         return "BIOLOGY: use classify, observe, label, describe function. Teacher uses specimens/diagrams. Assessment includes labelling.";
  if (/chem/.test(s))        return "CHEMISTRY: use react, balance, write equation, observe. Teacher describes experiments. Assessment names products.";
  if (/phys/.test(s))        return "PHYSICS: use calculate, apply formula, derive, measure. Teacher uses numerical examples. Assessment is a calculation.";
  if (/hist/.test(s))        return "HISTORY: use explain causes, describe effects, evaluate factors. Use timelines. Assessment is written explanation.";
  return "Use precise subject-appropriate language. Vary verbs across stages.";
}

const INTRO_HOOKS = [
  "Opens with a real-life scenario directly related to the sub-topic",
  "Displays a diagram on the board and asks: 'What do you observe here?'",
  "Poses a prediction question based on the previous lesson",
  "Recalls prior lesson with oral Q&A then bridges to today's content",
  "Writes a key term on the board and asks learners to share prior knowledge",
];
const STAGE1 = [
  "Step-by-step diagram construction on whiteboard with explanation",
  "Guided discovery: builds concept from learner responses to leading questions",
  "Demonstration using charts/models then teacher explanation",
  "Think-Pair-Share: learners discuss in pairs then teacher consolidates",
  "Structured question sequence building understanding progressively",
];
const STAGE2 = [
  "Small group analysis task with class presentation of findings",
  "Peer teaching: pairs explain concept to each other using notes",
  "Independent problem-solving on graded examples from scheme",
  "Collaborative drawing/sketching with immediate teacher feedback",
  "Class discussion on significance with teacher facilitation",
];
const CONC = [
  "Written consolidation task with scheme-based prompt; homework issued",
  "Oral Q&A recap: teacher poses 3 targeted questions, learners respond individually",
  "Exit activity: each learner writes one key fact and one question",
  "Board summary built collaboratively: learners contribute key points",
  "Short quiz from scheme assessment column, marked and discussed immediately",
];
function pick(arr, n) { return arr[((parseInt(n)||1)-1) % arr.length]; }

async function generateLessonContent(params, schemeContent = "") {
  try {
    // ✅ gemini-1.5-flash — NOT gemini-2.0-flash (zero free quota)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const isDouble = params.isDouble === true || params.isDouble === "true";
    const duration = isDouble ? 80 : (parseInt(params.duration) || 40);
    const t0=0, t1=Math.round(duration*.125), t2=Math.round(duration*.50), t3=Math.round(duration*.875), t4=duration;

    const schemeRow = extractLessonContext(schemeContent, params.week, params.lessonNum);
    if (!schemeRow) {
      console.warn(`⚠️ No scheme match W${params.week}L${params.lessonNum} — using fallback`);
      return fallback(params, duration, t1, t2, t3, t4);
    }

    console.log(`\n====== SCHEME: W${params.week} L${params.lessonNum} ======\n${schemeRow}\n==============================================\n`);

    const lesN = parseInt(params.lessonNum)||1;
    const prompt = `
You are a highly experienced Kenyan secondary school teacher writing ONE formal lesson plan.

=== SCHEME ROW (YOUR ONLY SOURCE) ===
${schemeRow}

=== LESSON INFO ===
Subject: ${params.subject||""}, Form/Class: ${params.grade||params.form||""}${params.stream?" "+params.stream:""}, No. of Students: ${params.numStudents||""}
Week: ${params.week}, Lesson: ${params.lessonNum}, Duration: ${duration} min${isDouble?" (DOUBLE)":""}, Day: ${params.day||""}, Date: ${params.date||""}, Time: ${params.startTime||""}–${params.endTime||""}

=== SUBJECT RULES ===
${subjectHint(params.subject)}

=== STRATEGIES ===
Introduction: ${pick(INTRO_HOOKS,lesN)}
Stage I: ${pick(STAGE1,lesN+1)}
Stage II: ${pick(STAGE2,lesN+2)}
Conclusion: ${pick(CONC,lesN+3)}

=== STRICT RULES ===
1. All content from scheme only. No invention.
2. topic: clean topic name from scheme (no numbered objectives mixed in).
3. ONE-SENTENCE objective: "By the end of the lesson, learners will be able to [verb] [specific content from scheme]."
4. TIME SLOTS — use EXACTLY: "${t0}–${t1} min", "${t1}–${t2} min", "${t2}–${t3} min", "${t3}–${t4} min"
5. NEVER write: "guides learners through the main concept", "core concepts related to the sub-topic", "application activity based on the sub-topic"
6. Teacher activities: include actual question in quotes, state what is drawn on board.
7. Learner activities: use action verbs (copy, label, sketch, solve, answer, present, mark).
8. Each stage must have DIFFERENT teacher actions and learner tasks.
9. Resources from scheme RESOURCES column (include page numbers).
10. Assessment from scheme ASSESSMENT TASK column.
11. Domain statements: name the actual sub-topic and actual activity (not generic placeholders).
12. Self-evaluation: name the specific activity that worked, the specific difficult concept, concrete next step.
13. Return ONLY raw JSON — no markdown fences, no text outside JSON.

=== JSON STRUCTURE ===
{
  "topic": "[clean topic from scheme]",
  "subTopic": "[sub-topic from scheme, or same as topic]",
  "objectives": "By the end of the lesson, learners will be able to [verb from scheme] [specific content].",
  "introduction": {
    "time": "${t0}–${t1} min",
    "content": "[specific prior-knowledge concept this lesson builds on]",
    "teacherActivity": "[greet + register + specific review question in quotes + write topic on board + state objective]",
    "learnerActivity": "[respond to review question + copy topic + note objective in exercise books]",
    "resources": "[from scheme resources with page numbers]"
  },
  "stage1": {
    "time": "${t1}–${t2} min",
    "content": "[first core concept from scheme]",
    "teacherActivity": "[specific teaching method from scheme + actual question in quotes + what is shown on board]",
    "learnerActivity": "[specific task — different from introduction]",
    "resources": "[from scheme]"
  },
  "stage2": {
    "time": "${t2}–${t3} min",
    "content": "[second concept or application from scheme activities]",
    "teacherActivity": "[different method from Stage I + specific prompt in quotes]",
    "learnerActivity": "[different task and verb from Stage I]",
    "resources": "[from scheme]"
  },
  "conclusion": {
    "time": "${t3}–${t4} min",
    "content": "[summary of key points + exact assessment task from scheme + homework]",
    "teacherActivity": "[summarise 2 key points in quotes + give exact assessment task from scheme + preview next lesson + homework with page ref]",
    "learnerActivity": "[complete assessment task + note homework]",
    "resources": "Whiteboard, Exercise Books, [scheme reference]"
  },
  "cognitiveDomain": "[ST1, ST2, Con]: Learners [specific verb] [actual sub-topic] (ST1); [verb] [specific application] (ST2); [verb from assessment] (Con).",
  "affectiveDomain": "[Intro]: Learners [appreciate/develop awareness of] [specific aspect from scheme life approach] (Intro).",
  "interactiveSkills": "[Intro, ST2]: Learners [specific interaction from introduction] (Intro); [specific interaction from Stage II] (ST2).",
  "psychomotorDomain": "[Con]: Learners [draw/write/label/sketch] [specific product from assessment] in exercise books (Con).",
  "selfEvaluation": "Strengths: [specific activity that worked + why]. Areas for Improvement: [specific concept that caused difficulty]. Action Plan: [concrete next-lesson step tied to next scheme content]."
}`;

    const result = await callWithRetry(model, prompt);
    let text = result.response.text().trim()
      .replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/```\s*$/,"").trim();
    return JSON.parse(text);

  } catch (err) {
    console.error("AI generation error:", err.message);
    const isDouble = params.isDouble===true||params.isDouble==="true";
    const duration = isDouble ? 80 : (parseInt(params.duration)||40);
    const t1=Math.round(duration*.125), t2=Math.round(duration*.50), t3=Math.round(duration*.875);
    return fallback(params, duration, t1, t2, t3, duration);
  }
}

function fallback(params, duration, t1, t2, t3, t4) {
  const topic    = params.topic    || "the topic";
  const subTopic = params.subTopic || topic;
  const ref      = params.referenceBook || "KLB Textbook";
  return {
    topic, subTopic,
    objectives: `By the end of the lesson, learners will be able to describe and explain the key characteristics of ${subTopic} with relevant examples.`,
    introduction: { time:`0–${t1} min`, content:`Prior knowledge review on ${topic}; introduction of ${subTopic}.`, teacherActivity:`Greets learners and marks register. Asks: "What do you recall from our previous lesson on ${topic}?" Writes '${subTopic}' on board and states today's objective.`, learnerActivity:`Respond to review question, copy the sub-topic from the board, and note the objective in exercise books.`, resources:`${ref}, Whiteboard, Chalk` },
    stage1: { time:`${t1}–${t2} min`, content:`Definition and key characteristics of ${subTopic}.`, teacherActivity:`Explains definition of ${subTopic} using the whiteboard. Draws and labels a diagram. Asks: "What is the key feature that defines ${subTopic}?"`, learnerActivity:`Copy the definition and labelled diagram. Answer the teacher's question individually.`, resources:`${ref}, Whiteboard, Charts, Coloured Chalk` },
    stage2: { time:`${t2}–${t3} min`, content:`Examples, applications, and significance of ${subTopic}.`, teacherActivity:`Divides class into groups of four. Each group analyses an example of ${subTopic}. Circulates giving feedback. Asks: "How does ${subTopic} relate to your local environment?"`, learnerActivity:`Discuss assigned example in groups, record findings, then one member presents a brief summary.`, resources:`${ref}, Exercise Books, Charts` },
    conclusion: { time:`${t3}–${t4} min`, content:`Summary of ${subTopic} and written assessment.`, teacherActivity:`Summarises: "The key features of ${subTopic} are..." Gives written task: "Describe ${subTopic} in four sentences." Previews next lesson. Assigns homework from ${ref}.`, learnerActivity:`Complete the written task in exercise books and record the homework.`, resources:`Whiteboard, Exercise Books, ${ref}` },
    cognitiveDomain: `[ST1, ST2, Con]: Learners define and describe ${subTopic} (ST1); analyse examples through group discussion (ST2); complete a written consolidation task (Con).`,
    affectiveDomain: `[Intro]: Learners develop curiosity about how ${topic} connects to their local environment (Intro).`,
    interactiveSkills: `[Intro, ST2]: Learners respond to teacher's review question on ${topic} (Intro); collaborate in groups to analyse and present findings on ${subTopic} (ST2).`,
    psychomotorDomain: `[Con]: Learners write a four-sentence description and draw a labelled diagram of ${subTopic} in exercise books (Con).`,
    selfEvaluation: `Strengths: The group analysis activity generated active participation and learners identified examples of ${subTopic} from prior knowledge. Areas for Improvement: Some learners needed prompting to articulate definitions clearly in writing. Action Plan: Begin next lesson with a visual comparison activity before introducing new scheme content.`,
  };
}

module.exports = { generateLessonContent };