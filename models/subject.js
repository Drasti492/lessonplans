const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, unique: true, trim: true },
    forms: { type: [String], default: ["Form 1", "Form 2", "Form 3", "Form 4"] },
    code:  { type: String, trim: true },   // e.g. "GEO", "MATH"
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", SubjectSchema);