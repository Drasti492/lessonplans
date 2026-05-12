
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, VerticalAlign, ImageRun,
} = require("docx");

/* ─── Page / column constants ────────────────────────────────────── */
const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 720;
const TW     = PAGE_W - MARGIN * 2;   // 10 466 DXA

// 5-column lesson table: Time | Content | Teacher | Learner | Resources
const C = [900, 2391, 2391, 2392, 2392];

/* ─── Border shortcuts ───────────────────────────────────────────── */
const SGL  = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
const NONE = { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" };
const ALL  = { top: SGL, bottom: SGL, left: SGL, right: SGL };
const NIL  = { top: NONE, bottom: NONE, left: NONE, right: NONE };

/* ─── Text / paragraph helpers ───────────────────────────────────── */
function t(text, opts = {}) {
  return new TextRun({ text: String(text || ""), font: "Times New Roman", size: 20, ...opts });
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

/* ─── Generic cell ───────────────────────────────────────────────── */
function mkCell(children, width, { span = 1, borders = ALL, vAlign = VerticalAlign.TOP } = {}) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    columnSpan: span,
    verticalAlign: vAlign,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: Array.isArray(children) ? children : [children],
  });
}

/* ─── 5-column lesson table helpers ──────────────────────────────── */
function colHeader() {
  const H = ["Time","Content","Teacher's Activity","Learner's Activity","Resources/Material/Ref."];
  return new TableRow({
    children: H.map((h, i) =>
      mkCell(para(t(h, { bold: true }), AlignmentType.CENTER), C[i])
    ),
  });
}

function dataRow(sec = {}) {
  const V = [sec.time, sec.content, sec.teacherActivity, sec.learnerActivity, sec.resources];
  return new TableRow({
    children: V.map((v, i) =>
      mkCell(para(t(v || ""), i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT), C[i])
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

/* ─── Header table: [Logo | Institution text] ────────────────────── */
function headerBlock(data) {
  const LOGO_W = 1400;
  const TEXT_W = TW - LOGO_W;

  const weekLesson = (data.week && data.lessonNum)
    ? `   WEEK ${data.week}   LESSON ${data.lessonNum}` : "";

  /* Logo cell */
  let logoCell;
  if (data.logoBase64) {
    try {
      const b64 = data.logoBase64.includes(",")
        ? data.logoBase64.split(",")[1] : data.logoBase64;
      logoCell = mkCell(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 0 },
          children: [new ImageRun({
            data: Buffer.from(b64, "base64"),
            transformation: { width: 90, height: 90 },
            type: "png",
          })],
        }),
        LOGO_W, { vAlign: VerticalAlign.CENTER }
      );
    } catch (_) {
      logoCell = mkCell(para(t("")), LOGO_W);
    }
  } else {
    logoCell = mkCell(para(t("")), LOGO_W);
  }

  /* Institution text cell */
  const textCell = mkCell([
    para(t("SCHOOL OF EDUCATION, HUMANITIES AND SOCIAL SCIENCES", { bold: true, size: 20 }), AlignmentType.CENTER),
    para(t("DEPARTMENT OF EDUCATION", { bold: true, size: 20 }), AlignmentType.CENTER),
    para([
      t("LESSON PLAN", { bold: true, size: 22, underline: { type: "single" } }),
      t(weekLesson, { bold: true, size: 20 }),
    ], AlignmentType.CENTER),
  ], TEXT_W, { vAlign: VerticalAlign.CENTER });

  return new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [LOGO_W, TEXT_W],
    rows: [new TableRow({ children: [logoCell, textCell] })],
  });
}

/* ─── Info table: student details + objectives ───────────────────── */
function infoBlock(data) {
  const LEFT_W = Math.floor(TW * 0.42);
  const RIGHT_W = TW - LEFT_W;

  const timeStr = (data.startTime && data.endTime)
    ? `${data.startTime} - ${data.endTime}` : (data.startTime || "");

  const leftCell = mkCell([
    para([t("Student Teacher's Name: ", { bold: true }), t(data.studentName || "")]),
    para([t("School's Name: ",          { bold: true }), t(data.schoolName  || "")]),
    para([t("Topic: ",                   { bold: true }), t(data.topic       || "")]),
  ], LEFT_W);

  const rightCell = mkCell([
    para([
      t("Adm. No.: ", { bold: true }), t(data.admNo || ""),
      t("   Form/Class: ", { bold: true }), t(data.form || ""),
      t("   No. of Students: ", { bold: true }), t(data.numStudents ? String(data.numStudents) : ""),
    ]),
    para([
      t("Subject: ", { bold: true }), t(data.subject || ""),
      t("   Date: ", { bold: true }), t(data.date || ""),
      t("   Time: ", { bold: true }), t(timeStr),
    ]),
    para([t("Sub-topic: ", { bold: true }), t(data.subTopic || "")]),
  ], RIGHT_W);

  const infoRow = new TableRow({ children: [leftCell, rightCell] });

  /* Objectives row — spans both columns */
  const objRow = new TableRow({
    children: [mkCell([
      para([t("Lesson Objectives: ", { bold: true }), t(data.objectives || "")]),
    ], TW, { span: 2 })],
  });

  return new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [LEFT_W, RIGHT_W],
    rows: [infoRow, objRow],
  });
}

/* ─── Domain paragraphs (outside any table) ──────────────────────── */
function domainParagraphs(data) {
  /* Parse the domain text to split label from content */
  function domainPara(label, tag, body) {
    return para([
      t(label + " ", { bold: true }),
      t(tag + ": ",  { bold: false }),
      t(body || ""),
    ]);
  }

  // Extract stage tags from field if present (e.g. "[ST1, Con]")
  function splitDomain(raw) {
    const m = raw.match(/^(\[[^\]]+\])[:.]?\s*(.*)/s);
    if (m) return { tag: m[1], body: m[2].trim() };
    return { tag: "", body: raw };
  }

  const cog  = splitDomain(data.cognitiveDomain  || "");
  const aff  = splitDomain(data.affectiveDomain  || "");
  const isk  = splitDomain(data.interactiveSkills|| "");
  const psy  = splitDomain(data.psychomotorDomain|| "");

  return [
    domainPara("COGNITIVE DOMAIN",        cog.tag, cog.body),
    domainPara("AFFECTIVE DOMAIN",        aff.tag, aff.body),
    domainPara("INTERACTIVE SKILLS DOMAIN", isk.tag, isk.body),
    domainPara("PSYCHOMOTOR DOMAIN",      psy.tag, psy.body),
  ];
}

/* ─── Self-evaluation paragraphs (outside table) ─────────────────── */
function selfEvalParagraphs(raw) {
  const text = raw || "";
  const parts = [];

  function extract(label) {
    const re = new RegExp(label + "[:\\s]+([^]*?)(?=Strengths:|Areas for Improvement:|Action Plan:|$)", "i");
    const m = text.match(re);
    return m ? m[1].trim() : "";
  }

  parts.push(para(t("SELF-EVALUATION:", { bold: true })));

  const s = extract("Strengths");
  const a = extract("Areas for Improvement");
  const p2 = extract("Action Plan");

  if (s || a || p2) {
    if (s)  parts.push(para([t("Strengths: ", { bold: true }), t(s)]));
    if (a)  parts.push(para([t("Areas for Improvement: ", { bold: true }), t(a)]));
    if (p2) parts.push(para([t("Action Plan: ", { bold: true }), t(p2)]));
  } else {
    parts.push(para(t(text)));
  }
  return parts;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════════ */
async function generateLessonPlanDocx(data) {
  const intro = data.introduction || {};
  const s1    = data.stage1       || {};
  const s2    = data.stage2       || {};
  const con   = data.conclusion   || {};

  /* Bold section label paragraphs */
  function secLabel(text, underline = true) {
    return new Paragraph({
      spacing: { before: 100, after: 40 },
      children: [t(text, { bold: true, size: 22, underline: underline ? { type: "single" } : {} })],
    });
  }
  function stageLabel(text) {
    return new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [t(text, { bold: true, size: 20 })],
    });
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Times New Roman", size: 20 } } },
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
        },
      },
      children: [
        /* ── 1. Logo + Institution ── */
        headerBlock(data),

        /* ── 2. Student info + Objectives ── */
        infoBlock(data),

        gap(60),

        /* ── 3. LESSON INTRODUCTION ── */
        secLabel("LESSON INTRODUCTION"),
        sectionTable(intro),

        gap(60),

        /* ── 4. LESSON DEVELOPMENT ── */
        secLabel("LESSON DEVELOPMENT"),
        stageLabel("Stage I"),
        sectionTable(s1),

        gap(40),
        stageLabel("Stage II"),
        sectionTable(s2),

        gap(60),

        /* ── 5. CONCLUSION ── */
        secLabel("CONCLUSION"),
        sectionTable(con),

        gap(80),

        /* ── 6. Domains (outside table) ── */
        ...domainParagraphs(data),

        gap(60),

        /* ── 7. Self-evaluation (outside table) ── */
        ...selfEvalParagraphs(data.selfEvaluation),
      ],
    }],
  });

  return Packer.toBuffer(doc);
}

module.exports = { generateLessonPlanDocx };
