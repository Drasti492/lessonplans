const mongoose = require("mongoose");

const TopicSchema = new mongoose.Schema(
  {
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    form:      { type: String, required: true },   // e.g. "Form 2"
    name:      { type: String, required: true, trim: true },
    order:     { type: Number, default: 0 },
    active:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

TopicSchema.index({ subjectId: 1, form: 1, order: 1 });

module.exports = mongoose.model("Topic", TopicSchema);