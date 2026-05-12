/* ================================================================
   docxGenerator.js  — EduPlan
   Generates a DOCX matching the institution's lesson plan template.
================================================================ */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, VerticalAlign, ImageRun,
} = require("docx");

/* ── Page constants (DXA: 1 inch = 1440 DXA) ───────────────────── */
const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 720;
const TW = PAGE_W - MARGIN * 2;   // ≈ 10 466 DXA usable width

// 5-column lesson table: Time | Content | Teacher | Learner | Resources
const C = [900, 2391, 2391, 2392, 2392];

/* ── Border helpers ─────────────────────────────────────────────── */
const SGL  = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
const NONE = { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" };
const ALL  = { top: SGL, bottom: SGL, left: SGL, right: SGL };

/* ── Text helpers ───────────────────────────────────────────────── */
function t(text, opts = {}) {
  return new TextRun({
    text: String(text || ""),
    font: "Times New Roman",
    size: 20,
    ...opts,
  });
}

function para(runs, align = AlignmentType.LEFT, sp = {}) {
  return new Paragraph({
    alignment: align,
    spacing: { before: 30, after: 30, ...sp },
    children: Array.isArray(runs) ? runs : [runs],
  });
}

const gap = (pts = 80) =>
  new Paragraph({ spacing: { before: 0, after: pts }, children: [t("")] });

/* ── Generic table cell ─────────────────────────────────────────── */
function mkCell(children, width, {
  span = 1, borders = ALL, vAlign = VerticalAlign.TOP, shading,
} = {}) {
  const opts = {
    borders,
    width: { size: width, type: WidthType.DXA },
    columnSpan: span,
    verticalAlign: vAlign,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: Array.isArray(children) ? children : [children],
  };
  if (shading) opts.shading = shading;
  return new TableCell(opts);
}

/* ── 5-column lesson table ──────────────────────────────────────── */
const COL_HEADERS = [
  "Time", "Content", "Teacher's Activity", "Learner's Activity", "Resources/Material/Ref.",
];

function colHeader() {
  return new TableRow({
    tableHeader: true,
    children: COL_HEADERS.map((h, i) =>
      mkCell(
        para(t(h, { bold: true }), AlignmentType.CENTER),
        C[i],
        { shading: { fill: "D6E4F0" } }
      )
    ),
  });
}

function dataRow(sec = {}) {
  const vals = [
    sec.time, sec.content, sec.teacherActivity, sec.learnerActivity, sec.resources,
  ];
  return new TableRow({
    children: vals.map((v, i) =>
      mkCell(
        para(t(v || ""), i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT),
        C[i]
      )
    ),
  });
}

function sectionTable(sec) {
  return new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: C,
    rows: [colHeader(), dataRow(sec)],
  });
}

/* ── Detect image type from base64 data URI ─────────────────────── */
function detectImageType(base64String) {
  if (!base64String) return "png";
  const lower = base64String.toLowerCase();
  if (lower.startsWith("data:image/jpeg") || lower.startsWith("data:image/jpg")) return "jpg";
  if (lower.startsWith("data:image/gif"))  return "gif";
  if (lower.startsWith("data:image/bmp"))  return "bmp";
  return "png";
}

/* ═══════════════════════════════════════════════════════════════════
   HEADER BLOCK
   Two-column table (borderless):
   LEFT  → School logo, vertically centred
   RIGHT → Institution name + LESSON PLAN + Week/Lesson

   The logo sits to the LEFT in the SAME row as the institution text.
   No vertical stacking of logo above the text.
═══════════════════════════════════════════════════════════════════ */
function headerBlock(data) {
  const LOGO_W = 1900;           // ~1.32 inches — enough for a square logo
  const TEXT_W = TW - LOGO_W;   // remaining width for institution text

  const weekLesson = (data.week && data.lessonNum)
    ? `     WEEK ${data.week}   LESSON ${data.lessonNum}` : "";

  /* ── Logo cell (LEFT column) ── */
  let logoCell;
  if (data.logoBase64) {
    try {
      const imgType = detectImageType(data.logoBase64);
      const b64 = data.logoBase64.includes(",")
        ? data.logoBase64.split(",")[1]
        : data.logoBase64;

      logoCell = mkCell(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0 },
          children: [
            new ImageRun({
              data: Buffer.from(b64, "base64"),
              transformation: { width: 100, height: 100 },
              type: imgType,
            }),
          ],
        }),
        LOGO_W,
        { vAlign: VerticalAlign.CENTER }
      );
    } catch (_) {
      logoCell = mkCell(para(t("")), LOGO_W, { vAlign: VerticalAlign.CENTER });
    }
  } else {
    /* No logo uploaded — empty cell */
    logoCell = mkCell(para(t("")), LOGO_W, { vAlign: VerticalAlign.CENTER });
  }

  /* ── Institution text cell (RIGHT column) ── */
  const textCell = mkCell(
    [
      para(
        t("SCHOOL OF EDUCATION, HUMANITIES AND SOCIAL SCIENCES", { bold: true, size: 20 }),
        AlignmentType.CENTER,
        { before: 20, after: 20 }
      ),
      para(
        t("DEPARTMENT OF EDUCATION", { bold: true, size: 20 }),
        AlignmentType.CENTER,
        { before: 0, after: 20 }
      ),
      para(
        [
          t("LESSON PLAN", { bold: true, size: 22, underline: { type: "single" } }),
          t(weekLesson, { bold: true, size: 20 }),
        ],
        AlignmentType.CENTER,
        { before: 0, after: 0 }
      ),
    ],
    TEXT_W,
    { vAlign: VerticalAlign.CENTER }
  );

  /* Both cells in ONE row → logo left, text right */
  return new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [LOGO_W, TEXT_W],
    rows: [new TableRow({ children: [logoCell, textCell] })],
  });
}

/* ═══════════════════════════════════════════════════════════════════
   INFO BLOCK
   Row 1: Student name, School, Topic | Adm No, Form/Class, No. of Students,
          Subject, Date, Time, Sub-topic
   Row 2: Lesson Objectives (full width, single sentence)
   NO signatures.
═══════════════════════════════════════════════════════════════════ */
function infoBlock(data) {
  const LEFT_W  = Math.floor(TW * 0.48);
  const RIGHT_W = TW - LEFT_W;

  let timeStr = "";
  if (data.startTime && data.endTime) {
    timeStr = `${data.startTime} – ${data.endTime}`;
  } else if (data.startTime) {
    timeStr = data.startTime;
  }

  const formClass = [data.form, data.stream].filter(Boolean).join(" ");

  const leftCell = mkCell(
    [
      para([t("Student Teacher's Name: ", { bold: true }), t(data.studentName || "")]),
      para([t("School's Name: ",          { bold: true }), t(data.schoolName  || "")]),
      para([t("Topic: ",                  { bold: true }), t(data.topic       || "")]),
    ],
    LEFT_W
  );

  const rightCell = mkCell(
    [
      para([
        t("Adm. No.: ",           { bold: true }), t(data.admNo      || ""),
        t("   Form/Class: ",      { bold: true }), t(formClass       || ""),
        t("   No. of Students: ", { bold: true }), t(String(data.numStudents || "")),
      ]),
      para([
        t("Subject: ",  { bold: true }), t(data.subject || ""),
        t("   Date: ",  { bold: true }), t(data.date    || ""),
        t("   Time: ",  { bold: true }), t(timeStr),
      ]),
      para([t("Sub-topic: ", { bold: true }), t(data.subTopic || "")]),
    ],
    RIGHT_W
  );

  const infoRow = new TableRow({ children: [leftCell, rightCell] });

  // Objectives row — full width, single sentence
  const objRow = new TableRow({
    children: [
      mkCell(
        [para([t("Lesson Objectives: ", { bold: true }), t(data.objectives || "")])],
        TW,
        { span: 2 }
      ),
    ],
  });

  return new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [LEFT_W, RIGHT_W],
    rows: [infoRow, objRow],
  });
}

/* ═══════════════════════════════════════════════════════════════════
   DOMAIN PARAGRAPHS — plain text list OUTSIDE any table.

   Output format:
     COGNITIVE DOMAIN [ST1, Con]: Learners explain impacts (ST1) and list examples (Con).
     AFFECTIVE DOMAIN [Intro]: Learners value faulting's role in human activities.
     INTERACTIVE SKILLS DOMAIN [Intro, ST2]: Learners engage in Q&A and discussion.
     PSYCHOMOTOR DOMAIN [Con]: Learners write exercise and notes.

   "COGNITIVE DOMAIN [ST1, Con]" → bold
   ": body text"                 → normal
═══════════════════════════════════════════════════════════════════ */
function domainParagraphs(data) {
  function parseDomain(raw) {
    // Matches: "[TAG]: body" or "[TAG] body"
    const m = (raw || "").match(/^(\[[^\]]+\])[:\s]*([\s\S]*)/);
    if (m) return { tag: m[1].trim(), body: m[2].trim() };
    return { tag: "", body: (raw || "").trim() };
  }

  function domainLine(label, raw) {
    const { tag, body } = parseDomain(raw);
    const boldPart = label + (tag ? " " + tag : "");
    return new Paragraph({
      spacing: { before: 50, after: 50 },
      children: [
        t(boldPart, { bold: true }),
        t(body ? ": " + body : ""),
      ],
    });
  }

  return [
    domainLine("COGNITIVE DOMAIN",          data.cognitiveDomain   || ""),
    domainLine("AFFECTIVE DOMAIN",          data.affectiveDomain   || ""),
    domainLine("INTERACTIVE SKILLS DOMAIN", data.interactiveSkills || ""),
    domainLine("PSYCHOMOTOR DOMAIN",        data.psychomotorDomain || ""),
  ];
}

/* ═══════════════════════════════════════════════════════════════════
   SELF-EVALUATION — plain paragraphs OUTSIDE any table.
   SELF-EVALUATION: (bold underlined)
   Strengths: ...  (bold label)
   Areas for Improvement: ...  (bold label)
   Action Plan: ...  (bold label)
═══════════════════════════════════════════════════════════════════ */
function selfEvalParagraphs(raw) {
  const text = String(raw || "");
  const parts = [];

  parts.push(
    new Paragraph({
      spacing: { before: 100, after: 50 },
      children: [t("SELF-EVALUATION:", { bold: true, underline: { type: "single" } })],
    })
  );

  function extract(label) {
    const re = new RegExp(
      label + "[:\\s]+(.*?)(?=Strengths:|Areas for Improvement:|Action Plan:|$)",
      "is"
    );
    const m = text.match(re);
    return m ? m[1].trim() : "";
  }

  const s  = extract("Strengths");
  const ai = extract("Areas for Improvement");
  const ap = extract("Action Plan");

  if (s || ai || ap) {
    if (s)  parts.push(new Paragraph({ spacing: { before: 30, after: 30 }, children: [t("Strengths: ", { bold: true }), t(s)] }));
    if (ai) parts.push(new Paragraph({ spacing: { before: 30, after: 30 }, children: [t("Areas for Improvement: ", { bold: true }), t(ai)] }));
    if (ap) parts.push(new Paragraph({ spacing: { before: 30, after: 30 }, children: [t("Action Plan: ", { bold: true }), t(ap)] }));
  } else {
    parts.push(para(t(text)));
  }

  return parts;
}

/* ── Section label helper ───────────────────────────────────────── */
function secLabel(labelText, underline = true) {
  return new Paragraph({
    spacing: { before: 100, after: 40 },
    children: [
      t(labelText, {
        bold: true,
        size: 22,
        underline: underline ? { type: "single" } : {},
      }),
    ],
  });
}

function stageLabel(labelText) {
  return new Paragraph({
    spacing: { before: 80, after: 40 },
    children: [t(labelText, { bold: true, size: 20 })],
  });
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════════ */
async function generateLessonPlanDocx(data) {
  const intro = data.introduction || {};
  const s1    = data.stage1       || {};
  const s2    = data.stage2       || {};
  const con   = data.conclusion   || {};

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Times New Roman", size: 20 } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size:   { width: PAGE_W, height: PAGE_H },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        children: [
          /* 1. Logo (left) + Institution text (right) — same table row */
          headerBlock(data),

          /* 2. Student info + single-sentence objectives — no signatures */
          infoBlock(data),

          gap(60),

          /* 3. LESSON INTRODUCTION */
          secLabel("LESSON INTRODUCTION"),
          sectionTable(intro),

          gap(60),

          /* 4. LESSON DEVELOPMENT */
          secLabel("LESSON DEVELOPMENT"),
          stageLabel("Stage I"),
          sectionTable(s1),

          gap(40),
          stageLabel("Stage II"),
          sectionTable(s2),

          gap(60),

          /* 5. CONCLUSION */
          secLabel("CONCLUSION"),
          sectionTable(con),

          gap(80),

          /* 6. Domains — plain paragraph list, OUTSIDE any table */
          ...domainParagraphs(data),

          gap(60),

          /* 7. Self-evaluation — plain paragraphs, OUTSIDE any table */
          ...selfEvalParagraphs(data.selfEvaluation),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

module.exports = { generateLessonPlanDocx };