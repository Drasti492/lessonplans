/**
 * docxGenerator.js
 * Matches exactly the SCHOOL OF EDUCATION, HUMANITIES AND SOCIAL SCIENCES
 * lesson plan template — all black borders, white backgrounds, no color fills.
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign, ImageRun,
} = require("docx");

/* ─── Page layout (A4, 0.5-inch margins) ──────────────────────────────────── */
const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 720;
const TW = PAGE_W - MARGIN * 2;   // 10 466 DXA usable width

/* ─── Column widths for the 5-column lesson table (sum = TW) ─────────────── */
const C = [900, 2391, 2391, 2392, 2392];

/* ─── Border definitions ──────────────────────────────────────────────────── */
const SGL  = { style: BorderStyle.SINGLE, size: 6,  color: "000000" };
const THIN = { style: BorderStyle.SINGLE, size: 4,  color: "000000" };
const NONE = { style: BorderStyle.NONE,   size: 0,  color: "FFFFFF" };

const ALL  = { top: SGL,  bottom: SGL,  left: SGL,  right: SGL  };
const NIL  = { top: NONE, bottom: NONE, left: NONE, right: NONE };

/* ─── Tiny helpers ────────────────────────────────────────────────────────── */
function t(text, opts = {}) {
  return new TextRun({ text: String(text || ""), font: "Times New Roman", size: 20, ...opts });
}

function p(runs, align = AlignmentType.LEFT, sp = {}) {
  return new Paragraph({
    alignment: align,
    spacing: { before: 30, after: 30, ...sp },
    children: Array.isArray(runs) ? runs : [runs],
  });
}

const blank = () => new Paragraph({ spacing: { before: 0, after: 40 }, children: [t("")] });

/* ─── Generic cell builder ─────────────────────────────────────────────────── */
function mkCell(children, width, { span = 1, borders = ALL, vAlign = VerticalAlign.TOP, padTop = 60, padBot = 60 } = {}) {
  return new TableCell({
    borders,
    width:         { size: width, type: WidthType.DXA },
    columnSpan:    span,
    verticalAlign: vAlign,
    margins:       { top: padTop, bottom: padBot, left: 120, right: 120 },
    children:      Array.isArray(children) ? children : [children],
  });
}

/* ─── Lesson-section helpers ──────────────────────────────────────────────── */

/** Full-span bold black section header row  */
function sectionRow(label) {
  return new TableRow({
    children: [mkCell(
      p(t(label, { bold: true, size: 20 }), AlignmentType.LEFT),
      TW, { span: 5 }
    )],
  });
}

/** Full-span stage label (Stage I / Stage II) */
function stageRow(label) {
  return new TableRow({
    children: [mkCell(
      p(t(label, { bold: true, size: 20 }), AlignmentType.LEFT),
      TW, { span: 5 }
    )],
  });
}

/** Column headers row */
function colHeaderRow() {
  const H = ["Time", "Content", "Teacher's Activity", "Learner's Activity", "Resources/Material/Ref."];
  return new TableRow({
    children: H.map((h, i) => mkCell(
      p(t(h, { bold: true, size: 20 }), AlignmentType.CENTER),
      C[i]
    )),
  });
}

/** Data row from a section object */
function dataRow(sec = {}) {
  const vals = [sec.time, sec.content, sec.teacherActivity, sec.learnerActivity, sec.resources];
  return new TableRow({
    children: vals.map((v, i) => mkCell(
      p(t(v || ""), i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT),
      C[i]
    )),
  });
}

/* ─── Top header (2-column info block) ───────────────────────────────────── */
function headerTable(data) {
  const leftW  = Math.floor(TW * 0.45);
  const rightW = TW - leftW;

  /* Build multi-line paragraphs for each cell */
  function field(label, value, bold = false) {
    return p([
      t(label, { bold: true, size: 20 }),
      t(value || "", { size: 20, bold }),
    ]);
  }

  const weekLesson = (data.week && data.lessonNum)
    ? `  WEEK ${data.week}  LESSON ${data.lessonNum}`
    : "";

  const leftCell = mkCell([
    p(t("SCHOOL OF EDUCATION, HUMANITIES AND SOCIAL SCIENCES", { bold: true, size: 20 }), AlignmentType.CENTER),
    p(t("DEPARTMENT OF EDUCATION", { bold: true, size: 20 }), AlignmentType.CENTER),
    p([
      t("LESSON PLAN", { bold: true, size: 22, underline: { type: "single" } }),
      t(weekLesson, { bold: true, size: 20 }),
    ], AlignmentType.CENTER, { after: 60 }),
  ], leftW + rightW, { span: 2, vAlign: VerticalAlign.CENTER });

  const row1 = new TableRow({ children: [leftCell] });

  /* Row 2 — student info split into 2 cells */
  const timeStr = (data.startTime && data.endTime)
    ? `${data.startTime} - ${data.endTime}`
    : (data.startTime || "");

  const dateStr = data.date || "";

  const leftInfo = mkCell([
    field("Student Teacher's Name: ", data.studentName),
    field("School's Name:  ",          data.schoolName),
    field("Topic:  ",                   data.topic),
  ], leftW, { vAlign: VerticalAlign.TOP });

  const rightInfo = mkCell([
    p([t("Adm. No.:  ", { bold: true, size: 20 }), t(data.admNo || "", { size: 20 }),
       t("          Form/Class:  ", { bold: true, size: 20 }), t(data.form || "", { size: 20 }),
       t("          No. of Students:  ", { bold: true, size: 20 }), t(data.numStudents ? String(data.numStudents) : "", { size: 20 })]),
    p([t("Subject:  ", { bold: true, size: 20 }), t(data.subject || "", { size: 20 }),
       t("          Date:  ", { bold: true, size: 20 }), t(dateStr, { size: 20 }),
       t("          Time:  ", { bold: true, size: 20 }), t(timeStr, { size: 20 })]),
    field("Sub-topic:  ", data.subTopic),
  ], rightW, { vAlign: VerticalAlign.TOP });

  const row2 = new TableRow({ children: [leftInfo, rightInfo] });

  /* Row 3 — Lesson Objectives full width */
  const objRow = new TableRow({
    children: [mkCell([
      p(t("Lesson Objectives:", { bold: true, size: 20 })),
      p(t(data.objectives || "", { size: 20 })),
    ], TW, { span: 2 })],
  });

  return new Table({
    width:        { size: TW, type: WidthType.DXA },
    columnWidths: [leftW, rightW],
    rows:         [row1, row2, objRow],
  });
}

/* ─── Main lesson table ───────────────────────────────────────────────────── */
function lessonTable(data) {
  const intro = data.introduction || {};
  const s1    = data.stage1       || {};
  const s2    = data.stage2       || {};
  const con   = data.conclusion   || {};

  return new Table({
    width:        { size: TW, type: WidthType.DXA },
    columnWidths: C,
    rows: [
      sectionRow("LESSON INTRODUCTION"),
      colHeaderRow(),
      dataRow(intro),

      sectionRow("LESSON DEVELOPMENT"),
      stageRow("Stage I"),
      colHeaderRow(),
      dataRow(s1),

      stageRow("Stage II"),
      colHeaderRow(),
      dataRow(s2),

      sectionRow("CONCLUSION"),
      colHeaderRow(),
      dataRow(con),
    ],
  });
}

/* ─── Domains table ───────────────────────────────────────────────────────── */
function domainsTable(data) {
  const dw = Math.floor(TW / 4);
  const W  = [dw, dw, dw, TW - dw * 3];

  const headers = [
    "COGNITIVE DOMAIN\n[ST1, 2, Con.]",
    "AFFECTIVE DOMAIN\n[Intro.]",
    "INTERACTIVE SKILLS DOMAIN\n[Intro., Con.]",
    "PSYCHOMOTOR DOMAIN\n[Con.]\n(1 Mark)",
  ];
  const bodies = [
    data.cognitiveDomain    || "",
    data.affectiveDomain    || "",
    data.interactiveSkills  || "",
    data.psychomotorDomain  || "",
  ];

  const headRow = new TableRow({
    children: headers.map((h, i) => mkCell(
      p(t(h, { bold: true, size: 18 }), AlignmentType.CENTER),
      W[i]
    )),
  });

  const bodyRow = new TableRow({
    children: bodies.map((b, i) => mkCell(
      p(t(b, { size: 18 }), AlignmentType.LEFT),
      W[i],
      { vAlign: VerticalAlign.TOP, padTop: 80, padBot: 80 }
    )),
  });

  return new Table({
    width:        { size: TW, type: WidthType.DXA },
    columnWidths: W,
    rows:         [headRow, bodyRow],
  });
}

/* ─── Self-evaluation table ───────────────────────────────────────────────── */
function selfEvalTable(data) {
  const evalText = data.selfEvaluation || "";

  /* Parse structured self-eval if it contains the three sections */
  let evalChildren;
  if (evalText.includes("Strengths:") || evalText.includes("Areas for Improvement:")) {
    const lines = evalText
      .replace(/Strengths:/g,               "\nStrengths:")
      .replace(/Areas for Improvement:/g,   "\nAreas for Improvement:")
      .replace(/Action Plan:/g,             "\nAction Plan:")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    evalChildren = lines.map(line => {
      const isHeader = line.startsWith("Strengths:") ||
                       line.startsWith("Areas for Improvement:") ||
                       line.startsWith("Action Plan:");
      if (isHeader) {
        const colon = line.indexOf(":");
        return p([
          t(line.slice(0, colon + 1), { bold: true, size: 20 }),
          t(line.slice(colon + 1),     { size: 20 }),
        ]);
      }
      return p(t(line, { size: 20 }));
    });
  } else {
    evalChildren = [p(t(evalText, { size: 20 }))];
  }

  return new Table({
    width:        { size: TW, type: WidthType.DXA },
    columnWidths: [TW],
    rows: [new TableRow({
      children: [mkCell(
        [p(t("SELF-EVALUATION:", { bold: true, size: 20 })), ...evalChildren, blank(), blank()],
        TW
      )],
    })],
  });
}

/* ─── Signatures (borderless) ─────────────────────────────────────────────── */
function signaturesTable(data) {
  const sw = Math.floor(TW / 3);
  const W  = [sw, sw, TW - sw * 2];
  const S  = [
    { label: "Student Teacher: ", val: data.teacherSignature   || "____________________" },
    { label: "H.O.D: ",           val: data.hodSignature       || "____________________" },
    { label: "Principal: ",        val: data.principalSignature || "____________________" },
  ];
  return new Table({
    width:        { size: TW, type: WidthType.DXA },
    columnWidths: W,
    rows: [new TableRow({
      children: S.map((s, i) => mkCell(
        p([t(s.label, { bold: true, size: 20 }), t(s.val, { size: 20 })]),
        W[i],
        { borders: NIL }
      )),
    })],
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   EXPORTED FUNCTION
   ══════════════════════════════════════════════════════════════════════════ */
async function generateLessonPlanDocx(data) {

  /* Optional logo */
  const logoParas = [];
  if (data.logoBase64) {
    try {
      const b64 = data.logoBase64.includes(",") ? data.logoBase64.split(",")[1] : data.logoBase64;
      logoParas.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [new ImageRun({
          data: Buffer.from(b64, "base64"),
          transformation: { width: 80, height: 80 },
          type: "png",
        })],
      }));
    } catch (_) {}
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Times New Roman", size: 20 } } },
    },
    sections: [{
      properties: {
        page: {
          size:   { width: PAGE_W, height: PAGE_H },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      children: [
        ...logoParas,
        headerTable(data),
        blank(),
        lessonTable(data),
        blank(),
        domainsTable(data),
        blank(),
        selfEvalTable(data),
        blank(),
        signaturesTable(data),
      ],
    }],
  });

  return Packer.toBuffer(doc);
}

module.exports = { generateLessonPlanDocx };