const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign, ImageRun,
} = require("docx");

const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 720;
const TW = PAGE_W - MARGIN * 2; // 10466 DXA
const C  = [900, 2391, 2391, 2392, 2392]; // 5 columns, sum = TW

const SGL  = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
const NONE = { style: BorderStyle.NONE,   size: 0, color: "FFFFFF" };
const ALL  = { top: SGL, bottom: SGL, left: SGL, right: SGL };
const NIL  = { top: NONE, bottom: NONE, left: NONE, right: NONE };

function t(text, opts = {}) {
  return new TextRun({ text: String(text || ""), font: "Arial", size: 18, ...opts });
}
function p(runs, align = AlignmentType.LEFT, sp = {}) {
  return new Paragraph({ alignment: align, spacing: { before: 40, after: 40, ...sp }, children: Array.isArray(runs) ? runs : [runs] });
}
const blank = () => new Paragraph({ spacing: { before: 0, after: 60 }, children: [t("")] });

function mkCell(children, width, { shade = null, span = 1, borders = ALL, vAlign = VerticalAlign.CENTER } = {}) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA }, columnSpan: span,
    verticalAlign: vAlign, margins: { top: 60, bottom: 60, left: 100, right: 100 },
    shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
    children: Array.isArray(children) ? children : [children],
  });
}

function sectionRow(label) {
  return new TableRow({ children: [mkCell(p(t(label, { bold: true, size: 20, color: "FFFFFF" }), AlignmentType.CENTER), TW, { span: 5, shade: "1F3864" })] });
}
function stageRow(label) {
  return new TableRow({ children: [mkCell(p(t(label, { bold: true })), TW, { span: 5, shade: "BDD7EE" })] });
}
function colHeaderRow() {
  const H = ["Time", "Content", "Teacher's Activity", "Learner's Activity", "Resources / Material / Ref."];
  return new TableRow({ children: H.map((h, i) => mkCell(p(t(h, { bold: true, size: 17 }), AlignmentType.CENTER), C[i], { shade: "D9E1F2" })) });
}
function dataRow(sec = {}) {
  const V = [sec.time, sec.content, sec.teacherActivity, sec.learnerActivity, sec.resources];
  return new TableRow({ children: V.map((v, i) => mkCell(p(t(v || ""), i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT), C[i])) });
}

function infoTable(rows) {
  return new Table({
    width: { size: TW, type: WidthType.DXA }, columnWidths: [TW],
    rows: rows.map(cells => new TableRow({
      children: cells.map(c => mkCell(p([t(c.label, { bold: true }), t(c.value || "")]), c.width))
    }))
  });
}

function domainsTable(data) {
  const dw = Math.floor(TW / 4);
  const W  = [dw, dw, dw, TW - dw * 3];
  const D  = [
    { title: "COGNITIVE DOMAIN\n[ST1, 2, Con.]",           body: data.cognitiveDomain   },
    { title: "AFFECTIVE DOMAIN\n[Intro.]",                  body: data.affectiveDomain   },
    { title: "INTERACTIVE SKILLS DOMAIN\n[Intro., Con.]",   body: data.interactiveSkills },
    { title: "PSYCHOMOTOR DOMAIN\n[Con.]",                  body: data.psychomotorDomain },
  ];
  return new Table({
    width: { size: TW, type: WidthType.DXA }, columnWidths: W,
    rows: [
      new TableRow({ children: D.map((d, i) => mkCell(p(t(d.title, { bold: true, size: 16, color: "FFFFFF" }), AlignmentType.CENTER), W[i], { shade: "1F3864" })) }),
      new TableRow({ children: D.map((d, i) => mkCell(p(t(d.body || "", { size: 17 })), W[i])) }),
    ],
  });
}

function signaturesTable(data) {
  const sw = Math.floor(TW / 3);
  const S  = [
    { label: "Student Teacher: ", val: data.teacherSignature   || "____________________" },
    { label: "H.O.D: ",           val: data.hodSignature       || "____________________" },
    { label: "Principal: ",        val: data.principalSignature || "____________________" },
  ];
  const W = [sw, sw, TW - sw * 2];
  return new Table({
    width: { size: TW, type: WidthType.DXA }, columnWidths: W,
    rows: [new TableRow({ children: S.map((s, i) => mkCell(p([t(s.label, { bold: true }), t(s.val)]), W[i], { borders: NIL })) })],
  });
}

async function generateLessonPlanDocx(data) {
  const intro = data.introduction || {}, s1 = data.stage1 || {}, s2 = data.stage2 || {}, con = data.conclusion || {};
  const half  = Math.floor(TW / 2);

  const logoParas = [];
  if (data.logoBase64) {
    try {
      const b64  = data.logoBase64.includes(",") ? data.logoBase64.split(",")[1] : data.logoBase64;
      const buf  = Buffer.from(b64, "base64");
      logoParas.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new ImageRun({ data: buf, transformation: { width: 80, height: 80 }, type: "png" })] }));
    } catch (_) {}
  }

  const meta = infoTable([
    [{ label: "Student Teacher's Name:  ", value: data.studentName || "", width: half }, { label: "School's Name:  ", value: data.schoolName || "", width: TW - half }],
    [{ label: "Topic:  ", value: data.topic || "", width: 2900 }, { label: "Adm. No.:  ", value: data.admNo || "", width: 1800 }, { label: "Form/Class:  ", value: data.form || "", width: 1800 }, { label: "No. of Students:  ", value: data.numStudents ? String(data.numStudents) : "", width: TW - 2900 - 1800 - 1800 }],
    [{ label: "Subject:  ", value: data.subject || "", width: 2600 }, { label: "Date:  ", value: data.date || "", width: 2700 }, { label: "Time:  ", value: (data.startTime && data.endTime) ? `${data.startTime} – ${data.endTime}` : (data.startTime || ""), width: TW - 2600 - 2700 }],
    [{ label: "Sub-topic:  ", value: data.subTopic || "", width: TW }],
  ]);

  const objTable = new Table({
    width: { size: TW, type: WidthType.DXA }, columnWidths: [TW],
    rows: [new TableRow({ children: [mkCell([p(t("Lesson Objectives:", { bold: true })), p(t(data.objectives || ""))], TW)] })],
  });

  const lessonTable = new Table({
    width: { size: TW, type: WidthType.DXA }, columnWidths: C,
    rows: [
      sectionRow("LESSON INTRODUCTION"), colHeaderRow(), dataRow(intro),
      sectionRow("LESSON DEVELOPMENT"),  colHeaderRow(), stageRow("Stage I"),  dataRow(s1), stageRow("Stage II"), dataRow(s2),
      sectionRow("CONCLUSION"),          colHeaderRow(), dataRow(con),
    ],
  });

  const evalTable = new Table({
    width: { size: TW, type: WidthType.DXA }, columnWidths: [TW],
    rows: [new TableRow({ children: [mkCell([p(t("SELF-EVALUATION:", { bold: true })), p(t(data.selfEvaluation || "")), blank(), blank()], TW)] })],
  });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 18 } } } },
    sections: [{
      properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } } },
      children: [
        ...logoParas,
        p(t("SCHOOL OF EDUCATION, HUMANITIES AND SOCIAL SCIENCES", { bold: true, size: 22 }), AlignmentType.CENTER),
        p(t("DEPARTMENT OF EDUCATION", { bold: true, size: 20 }), AlignmentType.CENTER),
        p(t("LESSON PLAN", { bold: true, size: 22, underline: {} }), AlignmentType.CENTER, { after: 120 }),
        meta, objTable,
        blank(),
        lessonTable,
        blank(),
        domainsTable(data),
        blank(),
        evalTable,
        blank(),
        signaturesTable(data),
      ],
    }],
  });

  return Packer.toBuffer(doc);
}

module.exports = { generateLessonPlanDocx };