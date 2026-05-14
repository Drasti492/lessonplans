/**
 * seedData.js — EduPlan Kenyan Curriculum Seed
 * Run: node seed/seedData.js
 * Or:  POST /api/admin/seed
 *
 * Covers: Geography, Mathematics, Biology, Chemistry,
 *         Physics, History, English, Kiswahili — Forms 1–4
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Subject  = require("../models/Subject");
const Topic    = require("../models/Topic");
const Subtopic = require("../models/Subtopic");

/* ════════════════════════════════════════════════════════
   CURRICULUM DATA
════════════════════════════════════════════════════════ */
const CURRICULUM = [

  /* ─────────────────────────────────────────────────────
     GEOGRAPHY
  ───────────────────────────────────────────────────── */
  {
    subject: { name: "Geography", code: "GEO", forms: ["Form 1","Form 2","Form 3","Form 4"] },
    topics: [

      // ── FORM 1 ──
      { form: "Form 1", name: "Introduction to Geography", order: 1, subtopics: [
        { name: "Definition and Branches of Geography", order: 1, objectives: "define geography and identify its main branches", activities: "Class discussion on branches; learners list examples of each branch", methods: "Discussion, Q&A", resources: "KLB Geography Book 1 pp.1–4, Blackboard, Lesson Notes", assessment: "List four branches of geography with one example each", values: "Appreciation of the natural environment", introduction: { content: "Introduction to Geography as a subject", teacherActivity: 'Welcomes class. Asks: "What do you think Geography is about?" Lists responses on board. States objective.', learnerActivity: "Respond to question, listen and copy topic from board.", resources: "Blackboard, Chalk" }, stage1: { content: "Definition and scope of Geography", teacherActivity: 'Explains the definition: "Geography is the study of the earth surface, its features, inhabitants and phenomena." Writes definition on board. Asks: "Which features of the earth do you interact with daily?"', learnerActivity: "Copy definition, answer question, take notes.", resources: "KLB Book 1 pp.1–2, Blackboard" }, stage2: { content: "Main branches: Physical, Human, Practical Geography", teacherActivity: "Draws a branch diagram on board showing Physical (climate, vegetation, rivers), Human (population, settlement) and Practical Geography. Guides learners to place examples.", learnerActivity: "Copy diagram, classify given examples into correct branches in pairs.", resources: "Blackboard, Lesson Notes" }, conclusion: { content: "Summary and assessment", teacherActivity: 'Summarises: "Geography is divided into Physical, Human, and Practical branches." Gives task: "List four branches and give one example each." Assigns homework from KLB pp.1–4.', learnerActivity: "Complete task, record homework.", resources: "Exercise Books, KLB Book 1" } },
        { name: "Importance of Studying Geography", order: 2, objectives: "explain the importance of studying geography in everyday life", activities: "Group discussion on importance; class presentation", methods: "Group work, Discussion", resources: "KLB Geography Book 1 pp.4–6, Blackboard", assessment: "State five reasons why Geography is important", values: "Environmental responsibility and conservation awareness", introduction: { content: "Review of Geography branches", teacherActivity: 'Asks: "Name one branch of Geography from last lesson." Bridges to today: "Why should we study Geography?"', learnerActivity: "Respond to review question, listen attentively.", resources: "Blackboard" }, stage1: { content: "Economic, social and environmental importance", teacherActivity: 'Explains how Geography helps in farming, town planning, tourism, and disaster management. Draws mind map on board. Asks: "How does Geography help farmers?"', learnerActivity: "Copy mind map, answer question, take notes.", resources: "KLB Book 1 pp.4–5, Blackboard" }, stage2: { content: "Career opportunities related to Geography", teacherActivity: "Guides learners in groups to brainstorm careers: surveyor, meteorologist, urban planner, geographer, environmentalist. Each group presents findings.", learnerActivity: "Group brainstorm, record findings, one member presents to class.", resources: "Exercise Books, Lesson Notes" }, conclusion: { content: "Summary and written task", teacherActivity: 'Summarises key importance points. Gives written task: "State five reasons why Geography is important." Previews next lesson: Maps and Map Reading.', learnerActivity: "Complete written task, copy homework.", resources: "Exercise Books, KLB Book 1" } },
      ]},

      // ── FORM 2 — VULCANICITY (detailed) ──
      { form: "Form 2", name: "Vulcanicity", order: 1, subtopics: [
        { name: "Definition and Causes of Vulcanicity", order: 1, objectives: "define vulcanicity and explain its causes", activities: "Class discussion; diagram drawing of earth's interior; Q&A", methods: "Direct instruction, Guided discussion", resources: "KLB Geography Book 2 pp.24–26, Blackboard, Charts, Lesson Notes", assessment: "Explain three causes of vulcanicity", values: "Understanding natural hazards and disaster preparedness", references: "KLB Book 2 pp.24–26",
          introduction: { content: "Introduction to internal land-forming processes", teacherActivity: 'Greets class and marks register. Asks: "Have you ever seen or heard of a volcano? Where?" Writes "VULCANICITY" on board. States objective.', learnerActivity: "Respond to question, copy topic, note objective.", resources: "Blackboard, Chalk" },
          stage1: { content: "Definition: vulcanicity vs vulcanism; structure of the earth relevant to volcanic activity", teacherActivity: 'Defines: "Vulcanicity refers to the process by which magma and other materials are forced through weaknesses in the earth\'s crust." Draws cross-section of the earth on board showing crust, mantle, outer core, inner core. Asks: "Where does magma come from?"', learnerActivity: "Copy definition and earth cross-section diagram, label layers, answer question.", resources: "KLB Book 2 pp.24–25, Blackboard, Coloured Chalk" },
          stage2: { content: "Causes of vulcanicity: tectonic plate movement, hot spots, subduction", teacherActivity: "Uses a chart showing plate boundaries to explain: (1) collision of plates, (2) subduction zones, (3) hot spots. Guides pairs to identify each on the chart. Asks: \"What happens when two plates collide?\"", learnerActivity: "Study chart in pairs, identify and label three cause types, answer teacher's question.", resources: "Charts, KLB Book 2 pp.25–26, Exercise Books" },
          conclusion: { content: "Summary and assessment", teacherActivity: 'Summarises: "Vulcanicity is caused by plate movement, subduction, and hot spots." Gives task: "Explain three causes of vulcanicity." Previews: Extrusive Features. Homework: Read KLB pp.24–26.', learnerActivity: "Complete task in exercise books, record homework.", resources: "Exercise Books, KLB Book 2" } },

        { name: "Extrusive Features: Types of Volcanoes", order: 2, objectives: "describe and differentiate types of volcanoes with examples from Africa and the world", activities: "Drawing of volcano diagrams; group classification of volcano types", methods: "Demonstration, Collaborative learning", resources: "KLB Geography Book 2 pp.26–30, Charts, Lesson Notes, Blackboard", assessment: "Draw and label a composite volcano; give one example from Africa", values: "Appreciating natural landscape formation and its beauty", references: "KLB Book 2 pp.26–30",
          introduction: { content: "Review of vulcanicity causes", teacherActivity: 'Asks: "Name one cause of vulcanicity from our last lesson." Writes "Types of Volcanoes" on board. States objective.', learnerActivity: "Respond, copy topic, note objective.", resources: "Blackboard" },
          stage1: { content: "Classification: active, dormant, extinct volcanoes; basic volcano structure (vent, crater, lava, ash)", teacherActivity: 'Explains: "Volcanoes are classified as active, dormant, or extinct based on their last eruption." Draws basic volcano cross-section on board showing vent, crater, magma chamber, lava flow. Asks: "What is the difference between a dormant and extinct volcano?"', learnerActivity: "Copy diagram and labels, answer question, take notes.", resources: "KLB Book 2 pp.26–27, Blackboard, Coloured Chalk" },
          stage2: { content: "Types by shape: shield, composite, ash-cinder cones; examples — Mt Kenya, Mt Kilimanjaro, Mt Elgon", teacherActivity: "Displays chart showing the three volcano shapes side by side. Explains each type's formation and gives African examples. Groups compare diagrams and list differences in a table. Asks: \"Which is the tallest volcano in Africa?\"", learnerActivity: "Copy chart, complete comparison table in groups, one member presents findings.", resources: "Charts, KLB Book 2 pp.28–30" },
          conclusion: { content: "Summary and assessment", teacherActivity: 'Summarises: "Shield volcanoes are gentle, composite are steep-sided, cinder cones are small and steep." Assessment: "Draw and label a composite volcano; give one African example." Homework: KLB pp.26–30.', learnerActivity: "Draw and label diagram, record homework.", resources: "Exercise Books, KLB Book 2" } },

        { name: "Intrusive Features: Sills and Dykes", order: 3, objectives: "describe the formation of sills and dykes and draw labelled diagrams", activities: "Drawing sills and dykes in pairs; Q&A on formation", methods: "Demonstration, Pair work", resources: "KLB Geography Book 2 pp.32–33, Charts, Lesson Notes, Blackboard", assessment: "Draw and label a sill and a dyke; describe the formation of each", values: "Practical application: visualising geological structures beneath the surface", references: "KLB Book 2 pp.32–33",
          introduction: { content: "Distinction between extrusive and intrusive features", teacherActivity: 'Asks: "What is the difference between extrusive and intrusive vulcanicity?" Writes "Intrusive Features: Sills and Dykes" on board. States objective.', learnerActivity: "Respond to question, copy topic and objective.", resources: "Blackboard" },
          stage1: { content: "Sills: horizontal magma intrusions between rock layers", teacherActivity: 'Explains: "A sill is a sheet-like intrusion of magma injected horizontally between existing rock strata." Draws a sill diagram on the board showing horizontal magma layer between sedimentary rocks. Asks: "In which direction does a sill lie?"', learnerActivity: "Copy diagram and label (sill, country rock, bedding planes). Answer teacher's question.", resources: "KLB Book 2 pp.32–33, Blackboard, Coloured Chalk" },
          stage2: { content: "Dykes: vertical magma intrusions cutting across rock layers", teacherActivity: "Draws a dyke diagram next to the sill, showing vertical magma intrusion cutting across horizontal strata. Guides pairs to draw both features and annotate differences. Asks: \"How does the orientation of a dyke differ from a sill?\"", learnerActivity: "Draw sill and dyke diagrams in exercise books in pairs, annotate, answer Q&A.", resources: "Charts, KLB Book 2 pp.32–33, Exercise Books" },
          conclusion: { content: "Summary and drawing assessment", teacherActivity: 'Summarises: "Sills are horizontal, dykes are vertical intrusions." Assessment: "Draw and label a sill and dyke; describe the formation of each." Homework: Read KLB pp.32–33.', learnerActivity: "Complete drawing task, record homework.", resources: "Exercise Books, KLB Book 2" } },

        { name: "Intrusive Features: Laccoliths, Batholiths and Lopoliths", order: 4, objectives: "explain the formation of laccoliths, batholiths, phacoliths, and lopoliths", activities: "Explaining formations; show charts; students sketch features", methods: "Interactive lecture, Sketching", resources: "KLB Geography Book 2 pp.33–35, Charts, Lesson Notes, Blackboard", assessment: "Describe the formation of a batholith and sketch and label one intrusive feature of your choice", values: "Environmental impact: linking geological formations to landscapes and resources", references: "KLB Book 2 pp.33–35",
          introduction: { content: "Review of sills and dykes", teacherActivity: 'Asks: "Draw a sill in the air with your finger." Bridges to today: "Today we study larger intrusive features." Writes topic on board.', learnerActivity: "Demonstrate sill shape, copy topic, note objective.", resources: "Blackboard" },
          stage1: { content: "Laccolith (dome-shaped) and batholith (massive granite body)", teacherActivity: 'Explains: "A laccolith forms when magma intrudes between rock layers and pushes the upper layers into a dome shape." Draws laccolith and batholith on board. Asks: "What distinguishes a batholith from a laccolith in terms of size?"', learnerActivity: "Copy diagrams and labels, take notes, answer teacher's question.", resources: "KLB Book 2 pp.33–34, Charts, Blackboard" },
          stage2: { content: "Phacolith (lens-shaped in fold) and lopolith (saucer-shaped depression)", teacherActivity: "Displays chart showing all four features side by side. Groups of three each sketch one assigned feature from the chart and describe its formation in two sentences. Asks: \"Which feature is associated with fold mountains?\"", learnerActivity: "Groups sketch assigned feature, write two-sentence description, present to class.", resources: "Charts, Exercise Books, KLB Book 2 pp.34–35" },
          conclusion: { content: "Summary and sketch assessment", teacherActivity: 'Summarises: "Intrusive features form underground and are exposed only after erosion." Assessment: "Describe the formation of a batholith; sketch and label one intrusive feature." Homework: KLB pp.33–35.', learnerActivity: "Complete assessment, record homework.", resources: "Exercise Books, KLB Book 2" } },

        { name: "Effects of Vulcanicity on Human Activities", order: 5, objectives: "explain the positive and negative effects of vulcanicity on human activities with examples", activities: "Group discussion on impacts; class debate — positive vs negative effects", methods: "Discussion, Debate, Q&A", resources: "KLB Geography Book 2 pp.35–38, Lesson Notes, Blackboard", assessment: "List three positive and three negative effects of vulcanicity on human activities", values: "Faulting's role in human activities; disaster preparedness and environmental stewardship", references: "KLB Book 2 pp.35–38",
          introduction: { content: "Local examples of volcanic impact", teacherActivity: 'Asks: "Can you think of any benefit or problem caused by volcanoes near where people live?" Writes "Effects of Vulcanicity" on board.', learnerActivity: "Share local examples, copy topic, note objective.", resources: "Blackboard" },
          stage1: { content: "Positive effects: fertile soils, geothermal energy, tourism, mineral deposits", teacherActivity: 'Explains each positive effect with East African examples: "The fertile soils on Mt Elgon support intensive farming." Draws a mind map on board. Asks: "Name one country that uses geothermal energy from volcanic areas."', learnerActivity: "Copy mind map, answer question (Kenya), take notes.", resources: "KLB Book 2 pp.35–36, Blackboard" },
          stage2: { content: "Negative effects: destruction of property, displacement, health hazards, climate disruption", teacherActivity: "Groups of four each analyse one negative effect and its management strategy. Groups present findings. Asks: \"Which negative effect is hardest to manage and why?\"", learnerActivity: "Group analysis and presentation. Each group covers one negative impact.", resources: "KLB Book 2 pp.36–38, Exercise Books" },
          conclusion: { content: "Summary and assessment", teacherActivity: 'Summarises: "Vulcanicity has both positive effects (tourism, geothermal energy, fertile soils) and negative effects (destruction, displacement)." Assessment: "List 3 positive and 3 negative effects." Homework: KLB pp.35–38.', learnerActivity: "Complete assessment, record homework.", resources: "Exercise Books, KLB Book 2" } },
      ]},

      { form: "Form 2", name: "Faulting", order: 2, subtopics: [
        { name: "Definition and Types of Faults", order: 1, objectives: "define faulting and identify types of faults with labelled diagrams", activities: "Diagram drawing of fault types; Q&A on classification", methods: "Direct instruction, Guided drawing", resources: "KLB Geography Book 2 pp.40–43, Blackboard, Charts, Lesson Notes", assessment: "Draw and label a normal fault and a reverse fault", values: "Understanding earth's dynamic nature and its role in landscape formation", references: "KLB Book 2 pp.40–43",
          introduction: { content: "Introduction to faulting as a result of crustal stress", teacherActivity: 'Asks: "What happens to a stick when you bend it too hard?" Bridges to faulting: "The earth\'s crust breaks in a similar way." Writes topic on board.', learnerActivity: "Respond to question, copy topic, note objective.", resources: "Blackboard" },
          stage1: { content: "Definition of fault and fault plane; types: normal, reverse, tear/strike-slip faults", teacherActivity: 'Defines: "A fault is a crack in the earth\'s crust along which displacement has occurred." Draws three fault types on board. Asks: "In a normal fault, which block moves down relative to the other?"', learnerActivity: "Copy definitions and fault diagrams with labels, answer question (hanging wall moves down).", resources: "KLB Book 2 pp.40–41, Blackboard, Coloured Chalk" },
          stage2: { content: "Applying fault classification to real-world examples", teacherActivity: "Shows chart of East African Rift Valley formation. Groups classify whether the valley was formed by normal, reverse, or tear faults. Asks: \"What type of stress produces a reverse fault?\"", learnerActivity: "Study chart, classify and justify in groups, present.", resources: "Charts, KLB Book 2 pp.41–43" },
          conclusion: { content: "Summary and drawing task", teacherActivity: 'Summarises fault types and the direction of movement in each. Assessment: "Draw and label a normal fault and a reverse fault." Homework: KLB pp.40–43.', learnerActivity: "Complete drawing task, record homework.", resources: "Exercise Books, KLB Book 2" } },

        { name: "Features Resulting from Faulting", order: 2, objectives: "describe rift valleys, horsts, escarpments and block mountains resulting from faulting", activities: "Drawing rift valley and horst diagrams; local examples discussion", methods: "Demonstration, Discussion", resources: "KLB Geography Book 2 pp.43–47, Charts, Blackboard, Lesson Notes", assessment: "Draw a labelled diagram showing how a rift valley forms; give one example from Africa", values: "Faulting's role in shaping human activities: settlement, farming, tourism", references: "KLB Book 2 pp.43–47",
          introduction: { content: "Review of fault types", teacherActivity: 'Asks: "Name the type of fault where the hanging wall moves up." Writes today\'s topic on board.', learnerActivity: "Respond (reverse fault), copy topic.", resources: "Blackboard" },
          stage1: { content: "Rift valley formation and features; examples: Great Rift Valley, Albertine Rift", teacherActivity: 'Explains: "A rift valley forms when a block of land sinks between two parallel faults." Draws step-by-step formation on board. Asks: "Name two lakes found in the Great Rift Valley."', learnerActivity: "Copy formation diagram, answer question (e.g. Lake Nakuru, Lake Turkana), take notes.", resources: "KLB Book 2 pp.43–45, Blackboard" },
          stage2: { content: "Horsts, escarpments, block mountains: Ruwenzori, Danakil, Usambara", teacherActivity: "Shows chart comparing rift valley and horst. Groups draw a labelled horst diagram and list one example. Asks: \"What is the relationship between a rift valley and a horst?\"", learnerActivity: "Draw horst diagram, list example, answer question.", resources: "Charts, Exercise Books" },
          conclusion: { content: "Summary and diagram task", teacherActivity: 'Summarises: "Rift valleys form by subsidence; horsts form by uplift between faults." Assessment: "Draw a rift valley formation diagram; give one African example." Homework: KLB pp.43–47.', learnerActivity: "Complete diagram, record homework.", resources: "Exercise Books, KLB Book 2" } },

        { name: "Effects of Faulting on Human Activities", order: 3, objectives: "explain the importance of faulting on human activities including positive and negative impacts", activities: "Group discussion on positive and negative impacts; oral questions", methods: "Discussion, Q&A", resources: "KLB Geography Book 2 pp.47–50, Lesson Notes, Blackboard", assessment: "Explain the importance of faulting on human activities — list three positive and two negative effects", values: "Valuing geological knowledge for disaster preparedness and resource use", references: "KLB Book 2 pp.47–50",
          introduction: { content: "Local examples of faulting's influence on human settlement", teacherActivity: 'Asks: "Why do you think people settle near the Great Rift Valley?" Lists responses. Writes topic on board.', learnerActivity: "Share ideas, copy topic, note objective.", resources: "Blackboard" },
          stage1: { content: "Positive impacts: fertile soils, tourism, mineral resources, water bodies", teacherActivity: 'Explains each with examples: "Rift Valley lakes support fishing communities. Fault scarps attract tourism. Fertile soils support agriculture." Draws mind map on board. Asks: "Name one resource found in rift valleys."', learnerActivity: "Copy mind map, answer question, take notes.", resources: "KLB Book 2 pp.47–48, Blackboard" },
          stage2: { content: "Negative impacts: earthquakes, disrupted transport, displacement", teacherActivity: "Groups of four each analyse one negative impact and suggest a management strategy. Present to class. Asks: \"Which impact is most difficult for communities to manage?\"", learnerActivity: "Group analysis, presentation of impact and management strategy.", resources: "KLB Book 2 pp.48–50, Exercise Books" },
          conclusion: { content: "Summary and impact list", teacherActivity: 'Summarises: "Faulting brings both opportunities (tourism, farming) and challenges (earthquakes, displacement)." Assessment: "List 3 positive and 2 negative effects." Homework: KLB pp.47–50.', learnerActivity: "Complete assessment list, record homework.", resources: "Exercise Books, KLB Book 2" } },
      ]},

      { form: "Form 2", name: "Folding", order: 3, subtopics: [
        { name: "Definition and Causes of Folding", order: 1, objectives: "define folding and explain the causes and types of folds", activities: "Paper folding demonstration; Q&A on causes", methods: "Demonstration, Q&A", resources: "KLB Geography Book 2 pp.52–55, Blackboard, Paper for demo, Lesson Notes", assessment: "Define folding and state three causes", values: "Understanding how forces shape mountains and affect human settlement patterns", references: "KLB Book 2 pp.52–55",
          introduction: { content: "Demonstration with a sheet of paper to model folding", teacherActivity: 'Holds a flat sheet of paper horizontally and pushes both ends together to form an arch. Asks: "What happened to the paper? What forces caused this?" Writes topic on board.', learnerActivity: "Observe demonstration, answer question, copy topic.", resources: "Sheet of paper, Blackboard" },
          stage1: { content: "Definition of folding; compressional forces acting on rock layers", teacherActivity: 'Defines: "Folding is the bending of rock layers due to compressional forces within the earth\'s crust." Draws stress arrows on rock layers on board. Asks: "What type of force causes folding?"', learnerActivity: "Copy definition and diagram, answer (compressional), take notes.", resources: "KLB Book 2 pp.52–53, Blackboard" },
          stage2: { content: "Types of folds: anticline, syncline, isoclinal, recumbent, overfold", teacherActivity: "Shows chart of fold types. Groups of three each sketch one assigned fold type and write a one-sentence description. Present to class. Asks: \"Which fold type might eventually become a fault?\"", learnerActivity: "Sketch assigned fold, write description, present.", resources: "Charts, KLB Book 2 pp.53–55, Exercise Books" },
          conclusion: { content: "Summary and definition task", teacherActivity: 'Summarises fold types and their characteristics. Assessment: "Define folding and state three causes." Homework: KLB pp.52–55.', learnerActivity: "Complete assessment, record homework.", resources: "Exercise Books, KLB Book 2" } },
      ]},
    ]
  },

  /* ─────────────────────────────────────────────────────
     MATHEMATICS
  ───────────────────────────────────────────────────── */
  {
    subject: { name: "Mathematics", code: "MATH", forms: ["Form 1","Form 2","Form 3","Form 4"] },
    topics: [
      { form: "Form 1", name: "Basic Algebra", order: 1, subtopics: [
        { name: "Introduction to Algebraic Expressions", order: 1, objectives: "define and simplify algebraic expressions by collecting like terms", activities: "Worked examples on board; learners solve practice problems", methods: "Direct instruction, Supervised practice", resources: "KLB Mathematics Book 1 pp.1–5, Blackboard, Exercise Books", assessment: "Simplify: 3x + 2y − x + 5y and 4a² − 2a + 3a² + a", values: "Development of logical thinking and problem-solving skills", references: "KLB Math Book 1 pp.1–5",
          introduction: { content: "Meaning of a variable and algebraic notation", teacherActivity: 'Asks: "If x represents the number of books you have, what does 3x mean?" Writes "ALGEBRAIC EXPRESSIONS" on board. States objective.', learnerActivity: "Respond to question, copy topic, note objective.", resources: "Blackboard" },
          stage1: { content: "Definition of term, coefficient, variable, constant; like and unlike terms", teacherActivity: 'Explains: "An algebraic expression is a combination of variables, coefficients, and constants connected by operations." Writes examples: 3x, −2y², 5 on board. Asks: "Which of these are like terms: 3x, 2y, 5x?"', learnerActivity: "Copy definitions, identify like terms (3x and 5x), take notes.", resources: "KLB Book 1 pp.1–3, Blackboard" },
          stage2: { content: "Simplifying by collecting like terms: worked examples and practice", teacherActivity: "Works three examples step-by-step: (1) 2x+3x, (2) 4a−2b+3a+5b, (3) 3x²+2x−x²−x. Learners solve three practice problems in exercise books. Asks: \"Simplify 5m + 3n − 2m + n.\"", learnerActivity: "Follow worked examples, solve three practice problems, answer teacher's question (3m+4n).", resources: "KLB Book 1 pp.3–5, Exercise Books, Blackboard" },
          conclusion: { content: "Summary and assessment", teacherActivity: 'Summarises: "Collect like terms by adding or subtracting their coefficients." Assessment: "Simplify 3x+2y−x+5y and 4a²−2a+3a²+a." Homework: KLB Ex. 1.1.', learnerActivity: "Solve assessment problems, record homework.", resources: "Exercise Books, KLB Book 1" } },
      ]},

      { form: "Form 2", name: "Quadratic Expressions and Equations", order: 1, subtopics: [
        { name: "Expansion of Algebraic Expressions", order: 1, objectives: "expand algebraic expressions including perfect squares and difference of two squares", activities: "Worked examples; learners expand given expressions step by step", methods: "Direct instruction, Individual practice", resources: "KLB Mathematics Book 2 pp.1–6, Blackboard, Exercise Books", assessment: "Expand: (a) (x+3)(x−5) (b) (2x+1)² (c) (x+4)(x−4)", values: "Logical reasoning and systematic approach to solving mathematical problems", references: "KLB Math Book 2 pp.1–6",
          introduction: { content: "Review of algebraic multiplication from Form 1", teacherActivity: 'Asks: "What is 3(x+2)?" Bridges to today: "Today we multiply two brackets together." Writes topic on board.', learnerActivity: "Answer 3x+6, copy topic, note objective.", resources: "Blackboard" },
          stage1: { content: "FOIL method for expanding (a+b)(c+d)", teacherActivity: 'Explains FOIL: First, Outer, Inner, Last. Works example: (x+2)(x+3) = x²+3x+2x+6 = x²+5x+6 step by step on board. Asks: "What do we multiply first in FOIL?"', learnerActivity: "Follow FOIL steps, copy worked example, answer (First terms).", resources: "KLB Book 2 pp.1–3, Blackboard" },
          stage2: { content: "Special cases: perfect square (a+b)², difference of two squares (a+b)(a−b)", teacherActivity: "Shows shortcut formulas: (a+b)²=a²+2ab+b², (a−b)(a+b)=a²−b². Works one example each. Learners practice three expressions. Asks: \"Expand (x−5)(x+5) using the shortcut.\"", learnerActivity: "Apply formulas, solve three practice expressions, answer (x²−25).", resources: "KLB Book 2 pp.3–6, Exercise Books" },
          conclusion: { content: "Summary and assessment problems", teacherActivity: 'Summarises FOIL and two special cases. Assessment: "Expand (x+3)(x−5), (2x+1)², and (x+4)(x−4)." Homework: KLB Ex. 1.1 page 6.', learnerActivity: "Solve assessment problems, record homework.", resources: "Exercise Books, KLB Book 2" } },

        { name: "Factorisation of Quadratic Expressions", order: 2, objectives: "factorise quadratic expressions ax²+bx+c by grouping and by inspection", activities: "Step-by-step factorisation worked examples; practice problems", methods: "Direct instruction, Guided practice", resources: "KLB Mathematics Book 2 pp.7–13, Blackboard, Exercise Books", assessment: "Factorise: (a) x²+7x+12 (b) x²−9 (c) 2x²+5x+3", values: "Perseverance and systematic thinking in multi-step problem solving", references: "KLB Math Book 2 pp.7–13",
          introduction: { content: "Reverse link from expansion to factorisation", teacherActivity: 'Writes on board: "(x+3)(x+4) = x²+7x+12". Asks: "Can we go backwards — start with x²+7x+12 and get the brackets?" Writes today\'s topic.', learnerActivity: "Observe connection, copy topic, note objective.", resources: "Blackboard" },
          stage1: { content: "Factorising trinomials: find two numbers whose product is c and sum is b", teacherActivity: 'Works x²+5x+6: "Find two numbers that multiply to 6 and add to 5: these are 2 and 3." So x²+5x+6=(x+2)(x+3). Works two more examples. Asks: "Factorise x²+7x+12."', learnerActivity: "Follow method, attempt x²+7x+12, verify (x+3)(x+4).", resources: "KLB Book 2 pp.7–10, Blackboard" },
          stage2: { content: "Difference of two squares and harder cases: 2x²+5x+3 by splitting the middle term", teacherActivity: "Shows x²−9=(x−3)(x+3). For 2x²+5x+3: split 5x as 2x+3x, group and factor. Works the example fully on board. Learners solve two practice problems. Asks: \"Factorise 2x²+7x+3.\"", learnerActivity: "Follow splitting method, solve 2x²+7x+3 and one more practice problem.", resources: "KLB Book 2 pp.10–13, Exercise Books" },
          conclusion: { content: "Summary and factorisation assessment", teacherActivity: 'Summarises both methods. Assessment: "Factorise x²+7x+12, x²−9, and 2x²+5x+3." Homework: KLB Ex. 1.2 page 13.', learnerActivity: "Solve assessment, record homework.", resources: "Exercise Books, KLB Book 2" } },

        { name: "Solving Quadratic Equations by Factorisation", order: 3, objectives: "solve quadratic equations by factorisation and verify solutions", activities: "Worked solutions; learners solve equations and verify by substitution", methods: "Direct instruction, Supervised practice", resources: "KLB Mathematics Book 2 pp.14–18, Blackboard, Exercise Books", assessment: "Solve: (a) x²−5x+6=0 (b) x²+x−12=0 (c) 2x²−x−3=0", values: "Verification mindset: checking answers builds accuracy and confidence", references: "KLB Math Book 2 pp.14–18",
          introduction: { content: "Link between factorised expression and equation roots", teacherActivity: 'Asks: "If (x−2)(x−3)=0, what are the values of x?" Explains zero-product property. Writes today\'s topic.', learnerActivity: "Deduce x=2 or x=3, copy topic, note objective.", resources: "Blackboard" },
          stage1: { content: "Solving ax²+bx+c=0 by factorisation: step-by-step method", teacherActivity: "Works x²−5x+6=0 step by step: factorise to (x−2)(x−3)=0, then x=2 or x=3. Verifies by substituting both values. Asks: \"How many solutions can a quadratic equation have?\"", learnerActivity: "Follow steps, note verification, answer (at most two).", resources: "KLB Book 2 pp.14–16, Blackboard" },
          stage2: { content: "Equations with leading coefficient >1; verification by substitution", teacherActivity: "Works 2x²+3x−2=0. Learners solve x²+x−12=0 and 2x²−x−3=0 in pairs, then verify. Circulates giving feedback. Asks: \"Which solution satisfies 2x²−x−3=0: x=1.5 or x=−1?\"", learnerActivity: "Solve assigned equations in pairs, verify by substitution, answer question.", resources: "KLB Book 2 pp.16–18, Exercise Books" },
          conclusion: { content: "Summary and equation assessment", teacherActivity: 'Summarises the three steps. Assessment: "Solve x²−5x+6=0, x²+x−12=0, and 2x²−x−3=0." Homework: KLB Ex. 1.3.', learnerActivity: "Solve assessment equations, record homework.", resources: "Exercise Books, KLB Book 2" } },
      ]},
    ]
  },

  /* ─────────────────────────────────────────────────────
     BIOLOGY
  ───────────────────────────────────────────────────── */
  {
    subject: { name: "Biology", code: "BIO", forms: ["Form 1","Form 2","Form 3","Form 4"] },
    topics: [
      { form: "Form 1", name: "Introduction to Biology", order: 1, subtopics: [
        { name: "Definition and Branches of Biology", order: 1, objectives: "define biology and identify its major branches with examples", activities: "Class discussion; learners list organisms studied in each branch", methods: "Discussion, Q&A", resources: "KLB Biology Book 1 pp.1–4, Blackboard, Lesson Notes", assessment: "State five branches of biology and give one organism studied in each", values: "Appreciation of the diversity of life and its interconnectedness", references: "KLB Biology Book 1 pp.1–4",
          introduction: { content: "Introduction to living things in our environment", teacherActivity: 'Asks: "Name five living things you can see outside this classroom." Writes "BIOLOGY" on board. States objective.', learnerActivity: "Name organisms, copy topic, note objective.", resources: "Blackboard" },
          stage1: { content: "Definition of biology; characteristics of living things", teacherActivity: 'Defines: "Biology is the scientific study of living organisms and their interactions with the environment." Lists MRS GREN on board. Asks: "Which characteristic distinguishes living from non-living things most clearly?"', learnerActivity: "Copy definition and MRS GREN, discuss answer.", resources: "KLB Book 1 pp.1–2, Blackboard" },
          stage2: { content: "Branches: Zoology, Botany, Microbiology, Ecology, Genetics", teacherActivity: "Displays a branch diagram. Groups each study one branch and name two organisms studied in it. Present to class. Asks: \"Which branch would study bacteria?\"", learnerActivity: "Group study, name organisms, present findings, answer (Microbiology).", resources: "KLB Book 1 pp.2–4, Exercise Books" },
          conclusion: { content: "Summary and assessment", teacherActivity: 'Summarises five branches. Assessment: "State five branches and give one organism in each." Homework: KLB pp.1–4.', learnerActivity: "Complete assessment, record homework.", resources: "Exercise Books, KLB Book 1" } },
      ]},
      { form: "Form 2", name: "Nutrition in Plants and Animals", order: 1, subtopics: [
        { name: "Photosynthesis: Process and Conditions", order: 1, objectives: "describe the process of photosynthesis and state the conditions necessary for it to occur", activities: "Diagram of photosynthesis; discussion of raw materials and products", methods: "Direct instruction, Guided diagram work", resources: "KLB Biology Book 2 pp.45–52, Blackboard, Charts, Leaf specimens", assessment: "State the equation for photosynthesis and list three conditions necessary for it to occur", values: "Appreciation of plants as the foundation of all food chains and life support systems", references: "KLB Biology Book 2 pp.45–52",
          introduction: { content: "How plants make their own food", teacherActivity: 'Holds up a green leaf. Asks: "Where does this leaf get its food?" Corrects misconceptions. Writes "PHOTOSYNTHESIS" on board.', learnerActivity: "Answer question, copy topic, note objective.", resources: "Leaf specimens, Blackboard" },
          stage1: { content: "Definition and word equation for photosynthesis; role of chlorophyll", teacherActivity: 'Explains: "Photosynthesis is the process by which green plants manufacture food using light energy, CO₂, and water." Writes the word equation. Asks: "What pigment absorbs light energy in the leaf?"', learnerActivity: "Copy definition and word equation, answer (chlorophyll).", resources: "KLB Book 2 pp.45–48, Blackboard" },
          stage2: { content: "Conditions for photosynthesis: light, CO₂, water, chlorophyll; leaf adaptations", teacherActivity: "Shows chart of leaf cross-section. Groups identify and label structures aiding photosynthesis. Asks: \"What happens to the rate of photosynthesis if CO₂ concentration increases?\"", learnerActivity: "Label leaf cross-section from chart, discuss and answer question in pairs.", resources: "Charts, KLB Book 2 pp.48–52, Exercise Books" },
          conclusion: { content: "Summary and equation assessment", teacherActivity: 'Summarises: "Photosynthesis requires light, CO₂, water and chlorophyll to produce glucose and oxygen." Assessment: "Write the equation; list three conditions." Homework: KLB pp.45–52.', learnerActivity: "Write equation, list conditions, record homework.", resources: "Exercise Books, KLB Book 2" } },
      ]},
    ]
  },

  /* ─────────────────────────────────────────────────────
     CHEMISTRY
  ───────────────────────────────────────────────────── */
  {
    subject: { name: "Chemistry", code: "CHEM", forms: ["Form 1","Form 2","Form 3","Form 4"] },
    topics: [
      { form: "Form 2", name: "The Mole", order: 1, subtopics: [
        { name: "Introduction to the Mole Concept", order: 1, objectives: "define the mole and relate it to Avogadro's number with simple calculations", activities: "Worked calculations; learners calculate number of particles from moles", methods: "Direct instruction, Individual practice", resources: "KLB Chemistry Book 2 pp.1–6, Blackboard, Periodic Table, Exercise Books", assessment: "Calculate the number of molecules in 2 moles of water; calculate moles in 3.01×10²³ atoms", values: "Appreciation of the scale of atoms and molecules in everyday substances", references: "KLB Chemistry Book 2 pp.1–6",
          introduction: { content: "Why we need a counting unit for atoms", teacherActivity: 'Asks: "How many atoms do you think are in a grain of sand?" Shows impossibly large number. Bridges: "Chemists use the mole to count particles." Writes topic on board.', learnerActivity: "Guess, observe the number, copy topic.", resources: "Blackboard" },
          stage1: { content: "Definition: 1 mole = 6.02×10²³ particles (Avogadro's number)", teacherActivity: 'States: "One mole of any substance contains 6.02×10²³ particles." Works example: "How many molecules in 3 moles of CO₂? = 3 × 6.02×10²³." Asks: "What is the value of Avogadro\'s number?"', learnerActivity: "Copy definition, work alongside teacher, answer (6.02×10²³).", resources: "KLB Book 2 pp.1–3, Blackboard" },
          stage2: { content: "Calculating number of particles from moles and vice versa", teacherActivity: "Works three calculations on board. Learners solve two independent problems. Circulates. Asks: \"How many moles is 1.204×10²⁴ molecules?\"", learnerActivity: "Follow worked examples, solve two practice problems, answer (2 moles).", resources: "KLB Book 2 pp.3–6, Exercise Books" },
          conclusion: { content: "Summary and calculation assessment", teacherActivity: 'Summarises. Assessment: "Calculate molecules in 2 moles of water; calculate moles in 3.01×10²³ atoms." Homework: KLB Ex.1.1.', learnerActivity: "Solve assessment, record homework.", resources: "Exercise Books, KLB Book 2" } },
      ]},
    ]
  },

  /* ─────────────────────────────────────────────────────
     PHYSICS
  ───────────────────────────────────────────────────── */
  {
    subject: { name: "Physics", code: "PHY", forms: ["Form 1","Form 2","Form 3","Form 4"] },
    topics: [
      { form: "Form 2", name: "Magnetic Effect of Electric Current", order: 1, subtopics: [
        { name: "Oersted's Discovery and Magnetic Field Around a Conductor", order: 1, objectives: "describe Oersted's discovery and explain the magnetic field pattern around a current-carrying conductor", activities: "Describe experiment; draw field patterns; Q&A on direction using right-hand rule", methods: "Demonstration description, Guided drawing", resources: "KLB Physics Book 2 pp.110–115, Blackboard, Lesson Notes, Compass diagrams", assessment: "State two factors that affect the strength of the magnetic field around a conductor and draw the field pattern for current flowing upward", values: "Curiosity and observation skills — Oersted's accidental discovery changed science", references: "KLB Physics Book 2 pp.110–115",
          introduction: { content: "Observation: a compass needle deflects near a wire with current", teacherActivity: 'Describes Oersted\'s 1820 experiment: "A compass near a wire jumped when current flowed." Asks: "What does this tell us about the relationship between electricity and magnetism?"', learnerActivity: "Discuss relationship, copy topic, note objective.", resources: "Compass diagram on board" },
          stage1: { content: "Magnetic field around a straight conductor: concentric circles; direction from right-hand rule", teacherActivity: 'Draws a conductor on board with current flowing up. Shows concentric circles around it. Explains right-hand rule: "Wrap your right hand around the conductor — thumb points in current direction, fingers show field direction." Asks: "If current flows downward, which way do the circles go?"', learnerActivity: "Copy diagram, apply right-hand rule, answer question (anticlockwise).", resources: "KLB Book 2 pp.110–112, Blackboard" },
          stage2: { content: "Factors affecting field strength: current magnitude, distance from conductor", teacherActivity: "Draws field patterns for high vs low current, and near vs far from wire. Groups compare the two sets and state the effect of each factor. Asks: \"What happens to the field if you double the current?\"", learnerActivity: "Compare field diagrams in pairs, state effects, answer (it gets stronger).", resources: "KLB Book 2 pp.112–115, Exercise Books" },
          conclusion: { content: "Summary and field pattern assessment", teacherActivity: 'Summarises Oersted\'s discovery and right-hand rule. Assessment: "State two factors affecting field strength; draw field pattern for upward current." Homework: KLB pp.110–115.', learnerActivity: "State factors, draw pattern, record homework.", resources: "Exercise Books, KLB Book 2" } },
      ]},
    ]
  },

  /* ─────────────────────────────────────────────────────
     HISTORY & GOVERNMENT
  ───────────────────────────────────────────────────── */
  {
    subject: { name: "History and Government", code: "HIST", forms: ["Form 1","Form 2","Form 3","Form 4"] },
    topics: [
      { form: "Form 2", name: "Colonial Administration in Kenya", order: 1, subtopics: [
        { name: "British Colonial Administrative Systems", order: 1, objectives: "describe the British administrative systems of direct and indirect rule with examples from Kenya and Uganda", activities: "Class discussion; compare direct vs indirect rule in a table", methods: "Discussion, Comparative analysis", resources: "KLB History Book 2 pp.45–52, Blackboard, Lesson Notes", assessment: "Compare direct and indirect rule — give two differences and one example of each system in East Africa", values: "Critical analysis of governance systems and their long-term impact on African societies", references: "KLB History Book 2 pp.45–52",
          introduction: { content: "How Britain governed its East African territories", teacherActivity: 'Asks: "How do you think the British managed to control millions of Africans with only a few thousand British administrators?" Writes topic on board.', learnerActivity: "Share ideas, copy topic, note objective.", resources: "Blackboard" },
          stage1: { content: "Direct rule: features, implementation in Kenya's settled areas", teacherActivity: 'Explains: "Under direct rule, British officials governed Africans directly, replacing local leaders." Lists features on board. Asks: "Why was direct rule more expensive for Britain?"', learnerActivity: "Copy features, answer (needed more British administrators), take notes.", resources: "KLB Book 2 pp.45–48, Blackboard" },
          stage2: { content: "Indirect rule: Lugard's system in Uganda; use of local chiefs", teacherActivity: "Explains Lugard's indirect rule in Buganda. Groups fill in comparison table: Direct vs Indirect rule. Asks: \"Why did Britain prefer indirect rule in Uganda compared to Kenya's highlands?\"", learnerActivity: "Complete comparison table in groups, discuss and present.", resources: "KLB Book 2 pp.48–52, Exercise Books" },
          conclusion: { content: "Summary and comparison task", teacherActivity: 'Summarises both systems. Assessment: "Compare direct and indirect rule — give two differences and one example each." Homework: KLB pp.45–52.', learnerActivity: "Complete comparison, record homework.", resources: "Exercise Books, KLB Book 2" } },
      ]},
    ]
  },

  /* ─────────────────────────────────────────────────────
     ENGLISH
  ───────────────────────────────────────────────────── */
  {
    subject: { name: "English", code: "ENG", forms: ["Form 1","Form 2","Form 3","Form 4"] },
    topics: [
      { form: "Form 2", name: "Writing Skills: Composition", order: 1, subtopics: [
        { name: "Writing a Descriptive Essay", order: 1, objectives: "write a descriptive essay using vivid sensory language and a clear structure", activities: "Analysing a model essay; learners write a descriptive paragraph in class", methods: "Guided analysis, Independent writing", resources: "KLB English Book 2 pp.80–87, Blackboard, Model essay handout, Exercise Books", assessment: "Write a descriptive paragraph (150 words) describing a market scene using at least three senses", values: "Creative expression and accurate communication through writing", references: "KLB English Book 2 pp.80–87",
          introduction: { content: "Introduction to descriptive writing and its purpose", teacherActivity: 'Asks: "Close your eyes — describe what you see, hear, and smell in a busy market." Writes "DESCRIPTIVE ESSAY" on board.', learnerActivity: "Describe orally, copy topic, note objective.", resources: "Blackboard" },
          stage1: { content: "Features of descriptive writing: sensory language, vivid adjectives, structured paragraphs", teacherActivity: 'Explains: "Descriptive writing uses the five senses to paint a picture in words." Reads model paragraph. Asks: "Identify two examples of sensory language in this paragraph."', learnerActivity: "Listen, identify sensory examples, copy features.", resources: "Model essay, KLB Book 2 pp.80–83" },
          stage2: { content: "Planning and drafting a descriptive paragraph on a market scene", teacherActivity: "Guides learners to plan: setting, three senses, specific details. Learners draft their paragraph in exercise books. Circulates giving feedback. Asks: \"What specific detail makes a description more vivid — 'a loud noise' or 'a vendor shouting prices'?\"", learnerActivity: "Plan using given structure, draft descriptive paragraph, answer question.", resources: "Exercise Books, KLB Book 2 pp.83–87" },
          conclusion: { content: "Peer review and assessment", teacherActivity: 'Pairs swap paragraphs and identify two examples of sensory language in their partner\'s work. Gives assessment: "Write 150-word market scene description using three senses." Homework: Revise draft.', learnerActivity: "Peer review, complete assessment draft, note homework.", resources: "Exercise Books, KLB Book 2" } },
      ]},
    ]
  },

  /* ─────────────────────────────────────────────────────
     KISWAHILI
  ───────────────────────────────────────────────────── */
  {
    subject: { name: "Kiswahili", code: "KSW", forms: ["Form 1","Form 2","Form 3","Form 4"] },
    topics: [
      { form: "Form 2", name: "Insha: Uandishi wa Makala", order: 1, subtopics: [
        { name: "Kuandika Makala ya Maelezo", order: 1, objectives: "kuandika makala ya maelezo yenye muundo mzuri na lugha sahihi", activities: "Kuchunguza makala mfano; kuandika aya ya maelezo darasani", methods: "Maelekezo, Mazoezi ya uandishi", resources: "KLB Kiswahili Book 2 ukurasa 90–96, Ubao, Makala mfano, Daftari", assessment: "Andika aya ya maelezo (maneno 150) ukielezea mazingira ya sokoni ukitumia hisi tatu", values: "Kueleza kwa usahihi na kwa ubunifu kupitia uandishi wa Kiswahili sanifu", references: "KLB Kiswahili Book 2 uk.90–96",
          introduction: { content: "Utangulizi wa uandishi wa makala ya maelezo", teacherActivity: 'Anauliza: "Funga macho yako — elezea unachokiona, kusikia na kunusa sokoni." Anaandika mada ubaoni.', learnerActivity: "Kuelezea kwa mdomo, kunakili mada na lengo.", resources: "Ubao" },
          stage1: { content: "Sifa za makala ya maelezo: lugha ya hisi, vielelezo, muundo", teacherActivity: 'Anaeleza: "Makala ya maelezo hutumia hisi tano kutoa picha wazi kwa maneno." Anasoma makala mfano. Anauliza: "Taja mfano mmoja wa lugha ya hisi katika makala hii."', learnerActivity: "Kusikiliza, kutaja mfano, kunakili sifa.", resources: "Makala mfano, KLB uk.90–93" },
          stage2: { content: "Kupanga na kuandika aya ya maelezo", teacherActivity: "Anaelekeza wanafunzi kupanga: mandhari, hisi tatu, maelezo mahususi. Wanafunzi wanaandika aya katika madaftari yao. Anauliza: \"Ni nini kinachofanya maelezo yawe mazuri zaidi — 'kelele kali' au 'muuzaji akipiga kelele bei'?\"", learnerActivity: "Kupanga kwa muundo uliopewa, kuandika aya, kujibu swali.", resources: "Madaftari, KLB uk.93–96" },
          conclusion: { content: "Mapitio ya kijamii na tathmini", teacherActivity: 'Wanafunzi wanabadilishana madaftari na kutambua mifano miwili ya lugha ya hisi. Anatoa tathmini: "Andika aya ya maneno 150 ya mazingira ya sokoni ukitumia hisi tatu."', learnerActivity: "Mapitio ya kijamii, kukamilisha tathmini, kuandika kazi ya nyumbani.", resources: "Madaftari, KLB uk.90–96" } },
      ]},
    ]
  },

]; // end CURRICULUM

/* ════════════════════════════════════════════════════════
   SEED FUNCTION
════════════════════════════════════════════════════════ */
async function runSeed() {
  console.log("\n📚 Starting EduPlan curriculum seed...\n");

  for (const entry of CURRICULUM) {
    /* ── Upsert Subject ── */
    let subject = await Subject.findOneAndUpdate(
      { name: entry.subject.name },
      { ...entry.subject, active: true },
      { upsert: true, new: true }
    );
    console.log(`✅ Subject: ${subject.name}`);

    for (const topicData of entry.topics) {
      /* ── Upsert Topic ── */
      let topic = await Topic.findOneAndUpdate(
        { subjectId: subject._id, form: topicData.form, name: topicData.name },
        { subjectId: subject._id, form: topicData.form, name: topicData.name, order: topicData.order, active: true },
        { upsert: true, new: true }
      );
      console.log(`   📖 Topic: ${topicData.form} — ${topic.name}`);

      for (const subData of topicData.subtopics) {
        const { name, order, objectives, activities, methods, resources,
                assessment, values, references, introduction, stage1, stage2, conclusion } = subData;

        await Subtopic.findOneAndUpdate(
          { topicId: topic._id, name },
          { topicId: topic._id, name, order, objectives: objectives||"", activities: activities||"",
            methods: methods||"", resources: resources||"", assessment: assessment||"",
            values: values||"", references: references||"",
            introduction: introduction||{}, stage1: stage1||{}, stage2: stage2||{}, conclusion: conclusion||{},
            active: true },
          { upsert: true, new: true }
        );
        console.log(`      📝 Subtopic: ${name}`);
      }
    }
  }

  console.log("\n🎉 Seed complete!\n");
}

/* ── Run directly ── */
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      await runSeed();
      mongoose.disconnect();
    })
    .catch((err) => { console.error("DB Error:", err.message); process.exit(1); });
}

module.exports = { runSeed };