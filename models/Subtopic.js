const mongoose = require("mongoose");

/* Reusable stage content shape */
const StageSchema = new mongoose.Schema(
  {
    content:         String,
    teacherActivity: String,
    learnerActivity: String,
    resources:       String,
  },
  { _id: false }
);

const SubtopicSchema = new mongoose.Schema(
  {
    topicId:    { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
    name:       { type: String, required: true, trim: true },
    order:      { type: Number, default: 0 },

    /* Curriculum content — stored so AI has rich context */
    objectives:  { type: String, default: "" },  // full text
    activities:  { type: String, default: "" },  // T/L activities from scheme
    methods:     { type: String, default: "" },  // pedagogy strategies
    resources:   { type: String, default: "" },  // books, charts, etc.
    assessment:  { type: String, default: "" },  // assessment tasks
    values:      { type: String, default: "" },  // life skills / values
    references:  { type: String, default: "" },  // page references

    /* Pre-built lesson stages (AI can override/enhance these) */
    introduction: { type: StageSchema, default: () => ({}) },
    stage1:       { type: StageSchema, default: () => ({}) },
    stage2:       { type: StageSchema, default: () => ({}) },
    conclusion:   { type: StageSchema, default: () => ({}) },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SubtopicSchema.index({ topicId: 1, order: 1 });

module.exports = mongoose.model("Subtopic", SubtopicSchema);